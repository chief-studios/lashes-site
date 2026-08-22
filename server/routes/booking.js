const express = require('express');
const rateLimit = require('express-rate-limit');
const { Resend } = require('resend');
const Booking = require('../models/Booking');
const { adminAuth } = require('../middleware/auth');
const router = express.Router();

const bookingLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { message: 'Too many booking attempts. Please wait 15 minutes before trying again.' },
    standardHeaders: true,
    legacyHeaders: false,
});
const emailFrom = () =>
    process.env.EMAIL_FROM || 'Lash Studio <onboarding@resend.dev>';

/** Admin inbox for new-booking alerts (any one of these in .env works). */
const getAdminNotifyEmail = () =>
    (process.env.ADMIN_EMAIL ||
        process.env.BOOKING_NOTIFY_EMAIL ||
        process.env.NOTIFY_EMAIL ||
        '')
        .trim();

function pad2(n) {
    return String(n).padStart(2, '0');
}

function formatDateOnlyToDDMMYYYY(input) {
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) return '';
    const day = pad2(d.getDate());
    const month = pad2(d.getMonth() + 1);
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

const formatBookingDateTime = (input) => {
    const d = new Date(input);
    if (Number.isNaN(d.getTime())) return String(input);
    const date = formatDateOnlyToDDMMYYYY(d);
    const hours = pad2(d.getHours());
    const minutes = pad2(d.getMinutes());
    return `${date} ${hours}:${minutes}`;
};

const Settings = require('../models/Settings');
const TimeSlot = require('../models/TimeSlot');

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Resolve appointment time from bookingDate + timeSlot (preferred) or ISO bookingTime.
 */
const resolveBookingDateTime = (body) => {
    const { bookingTime, bookingDate, timeSlot } = body;

    if (bookingDate && timeSlot) {
        const slotMatch = /^(\d{1,2}):(\d{2})$/.exec(String(timeSlot).trim());
        if (!slotMatch) {
            return { error: 'The selected time slot is unavailable' };
        }

        const hours = parseInt(slotMatch[1], 10);
        const minutes = parseInt(slotMatch[2], 10);

        let dateMatch = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(String(bookingDate).trim());
        let day;
        let month;
        let year;

        if (dateMatch) {
            year = parseInt(dateMatch[1], 10);
            month = parseInt(dateMatch[2], 10);
            day = parseInt(dateMatch[3], 10);
        } else {
            dateMatch = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/.exec(String(bookingDate).trim());
            if (!dateMatch) {
                return { error: 'The selected time slot is unavailable' };
            }
            day = parseInt(dateMatch[1], 10);
            month = parseInt(dateMatch[2], 10);
            year = parseInt(dateMatch[3], 10);
        }

        const bookingDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);

        if (Number.isNaN(bookingDateTime.getTime())) {
            return { error: 'The selected time slot is unavailable' };
        }

        return { bookingDateTime, hours, minutes, timeSlotStr: String(timeSlot).trim() };
    }

    if (!bookingTime) {
        return { error: 'The selected time slot is unavailable' };
    }

    const bookingDateTime = new Date(bookingTime);
    if (Number.isNaN(bookingDateTime.getTime())) {
        return { error: 'The selected time slot is unavailable' };
    }

    const hours = bookingDateTime.getHours();
    const minutes = bookingDateTime.getMinutes();
    const timeSlotStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    return { bookingDateTime, hours, minutes, timeSlotStr };
};

/**
 * Checks:
 * Step 1: Work hours & TimeSlot manual availability check FIRST.
 * Step 2: Existing booking check SECOND.
 */
const verifyBookingAvailability = async (bookingDateTime, timeStr) => {
    try {
        const settings = await Settings.getSettings();
        const businessHours = settings.businessHours || {};
        const dayOfWeek = DAY_NAMES[bookingDateTime.getDay()];
        const daySchedule = businessHours[dayOfWeek];

        // STEP 1: Check work hours & available slots list
        if (!daySchedule || !daySchedule.isOpen) {
            return { available: false, message: 'Studio is closed on this day. Please select a different day or slot.' };
        }

        const hours = bookingDateTime.getHours();
        const minutes = bookingDateTime.getMinutes();
        const formattedTimeStr = timeStr || `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

        if (Array.isArray(daySchedule.slots) && daySchedule.slots.length > 0) {
            if (!daySchedule.slots.includes(formattedTimeStr)) {
                return { available: false, message: 'This time slot is not available. Please select a different slot.' };
            }
        } else {
            const { open = '08:00', close = '20:00' } = daySchedule;
            const [openH, openM] = open.split(':').map(Number);
            const [closeH, closeM] = close.split(':').map(Number);

            const reqMinutes = hours * 60 + minutes;
            const openMinutes = openH * 60 + openM;
            const closeMinutes = closeH * 60 + closeM;

            if (reqMinutes < openMinutes || reqMinutes >= closeMinutes) {
                return { available: false, message: 'Selected time is outside working hours. Please select a different slot.' };
            }
        }

        const dateOnly = new Date(bookingDateTime);
        dateOnly.setHours(0, 0, 0, 0);

        const timeSlot = await TimeSlot.findOne({
            date: dateOnly,
            time: formattedTimeStr
        });

        if (timeSlot && !timeSlot.isAvailable) {
            return { available: false, message: 'This time slot is not available. Please select a different slot.' };
        }

        // STEP 2: Check existing booking second
        const existingBooking = await Booking.findOne({
            bookingTime: bookingDateTime,
            status: { $in: ['pending', 'confirmed', 'completed'] }
        });

        if (existingBooking) {
            return { available: false, message: 'This time slot has already been taken. Please select a different slot.' };
        }

        return { available: true };
    } catch (error) {
        console.error('Error verifying booking availability:', error);
        return { available: false, message: 'Error checking time slot availability. Please try again.' };
    }
};

/**
 * Resend returns `{ data, error }` (errors usually do not throw). Match the official pattern.
 * @returns {{ ok: boolean, data?: unknown, error?: unknown }}
 */
const sendResendEmail = async (payload) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        console.warn('[booking email] Missing RESEND_API_KEY in environment.');
        return { ok: false, error: { message: 'Missing RESEND_API_KEY' } };
    }

    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send(payload);

    if (error) {
        console.error('[booking email] Resend API error:', error);
        return { ok: false, error, data };
    }

    return { ok: true, data };
};

const sendAdminNewBookingEmail = async (booking) => {
    const adminTo = getAdminNotifyEmail();
    if (!adminTo) {
        console.warn(
            '[booking email] No admin recipient. Set ADMIN_EMAIL (or BOOKING_NOTIFY_EMAIL) in .env.'
        );
        return;
    }

    const subject = `New booking: ${booking.name} (${booking.service})`;
    const html = `
        <h2>New Booking Submitted</h2>
        <p><strong>Name:</strong> ${booking.name}</p>
        <p><strong>Email:</strong> ${booking.email}</p>
        <p><strong>Phone:</strong> ${booking.phone}</p>
        <p><strong>Service:</strong> ${booking.service}</p>
        <p><strong>Booking Time:</strong> ${formatBookingDateTime(booking.bookingTime)}</p>
        <p><strong>Comments:</strong> ${booking.comments || 'None'}</p>
    `;

    const result = await sendResendEmail({
        from: emailFrom(),
        to: [adminTo],
        subject,
        html,
        replyTo: booking.email
    });

    if (!result.ok) {
        const err = result.error;
        console.error(
            '[booking email] Admin notification failed:',
            err && typeof err === 'object' && 'message' in err ? err.message : err
        );
    }
};

/**
 * Email the client when admin approves (confirmed) or rejects (cancelled) a booking.
 * @param {import('../models/Booking')} booking
 * @param {'confirmed'|'cancelled'} status
 */
const sendClientStatusEmail = async (booking, status) => {
    if (!booking?.email) {
        console.warn('[booking email] No client email on booking; skipping status email.');
        return;
    }

    const isApproved = status === 'confirmed';
    const when = formatBookingDateTime(booking.bookingTime);

    const subject = isApproved
        ? 'Your booking has been approved'
        : 'Your booking has been rejected';

    const text = isApproved
        ? `Hi ${booking.name},\n\nYour booking has been approved.\n\nService: ${booking.service}\nDate & time: ${when}\n\nYour appointment will take place at the time above. We look forward to seeing you.\n\nIf you need to make changes, reply to this email or contact the studio.`
        : `Hi ${booking.name},\n\nYour booking has been rejected.\n\nService: ${booking.service}\nRequested time: ${when}\n\nThis appointment will not take place. You may book another available slot on our website.\n\nThank you for your interest.`;

    const html = isApproved
        ? `
        <h2>Booking approved</h2>
        <p>Hi ${booking.name},</p>
        <p>Your booking has been <strong>approved</strong>. Your appointment <strong>will take place</strong> at the time below.</p>
        <p><strong>Service:</strong> ${booking.service}</p>
        <p><strong>Date &amp; time:</strong> ${when}</p>
        <p>We look forward to seeing you. If you need to make changes, reply to this email or contact the studio.</p>
    `
        : `
        <h2>Booking rejected</h2>
        <p>Hi ${booking.name},</p>
        <p>Your booking has been <strong>rejected</strong>. The appointment below <strong>will not take place</strong>.</p>
        <p><strong>Service:</strong> ${booking.service}</p>
        <p><strong>Requested time:</strong> ${when}</p>
        <p>Please choose another available slot on our website if you would still like to book.</p>
    `;

    const result = await sendResendEmail({
        from: emailFrom(),
        to: [booking.email],
        subject,
        html,
        text
    });

    if (!result.ok) {
        const err = result.error;
        console.error(
            '[booking email] Client approval/rejection email failed:',
            err && typeof err === 'object' && 'message' in err ? err.message : err
        );
        return;
    }

    console.log(
        `[booking email] Client ${isApproved ? 'approval' : 'rejection'} email sent to ${booking.email}`
    );
};

// Create new booking (public)
router.post('/', bookingLimiter, async (req, res) => {
    try {
        const {
            name,
            phone,
            email,
            service,
            bookingTime,
            comments,
            amount,
            amountPaid,
            totalAmount,
            paymentReference,
            paymentStatus,
            currency
        } = req.body;

        // Validate required fields
        if (!name || !phone || !email || !service || !bookingTime) {
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        const parsedNumber = (value) => {
            if (typeof value === 'number') return value;
            const parsed = parseFloat(value);
            return Number.isNaN(parsed) ? 0 : parsed;
        };

        const paid = parsedNumber(amountPaid ?? amount);
        const total = parsedNumber(totalAmount);

        if (paid < 0 || total < 0) {
            return res.status(400).json({ message: 'Invalid payment amounts' });
        }

        const remainingAmount = Math.max(0, total - paid);

        const resolved = resolveBookingDateTime(req.body);
        if (resolved.error) {
            return res.status(400).json({ message: resolved.error });
        }

        const { bookingDateTime, hours, minutes, timeSlotStr } = resolved;
        
        // 2-Tier Check: 1) Work hours/slot availability FIRST, 2) Existing booking SECOND
        const availability = await verifyBookingAvailability(bookingDateTime, timeSlotStr);
        if (!availability.available) {
            return res.status(400).json({
                message: availability.message || 'The selected time slot is unavailable'
            });
        }
        
        // Mark the time slot as unavailable
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        const dateOnly = new Date(bookingDateTime);
        dateOnly.setHours(0, 0, 0, 0);
        
        let timeSlot = await TimeSlot.findOne({
            date: dateOnly,
            time: timeString
        });
        
        if (timeSlot) {
            timeSlot.isAvailable = false;
            await timeSlot.save();
        }

        const booking = new Booking({
            name,
            phone,
            email: email.toLowerCase(),
            service,
            bookingTime: bookingDateTime,
            comments: comments || '',
            amountPaid: paid,
            totalAmount: total,
            remainingAmount,
            paymentReference,
            paymentStatus,
            currency: currency || 'GHS'
        });

        await booking.save();

        try {
            await sendAdminNewBookingEmail(booking);
        } catch (emailError) {
            console.error('Failed to send admin booking email:', emailError.message);
        }

        try {
            const Customer = require('../models/Customer');
            let customer = await Customer.findOne({ email: email.toLowerCase() });

            if (customer) {
                customer.totalBookings += 1;
                if (!customer.lastVisit || bookingDateTime > customer.lastVisit) {
                    customer.lastVisit = bookingDateTime;
                }
                await customer.save();
            } else {
                customer = new Customer({
                    name,
                    email: email.toLowerCase(),
                    phone,
                    totalBookings: 1,
                    lastVisit: bookingDateTime
                });
                await customer.save();
            }
        } catch (customerError) {
            console.error('[booking] Customer record update failed:', customerError.message);
        }

        // Return booking plus a human-friendly date string (DD/MM/YYYY)
        const bookingObj = booking.toObject ? booking.toObject() : booking;
        bookingObj.bookingDate = formatDateOnlyToDDMMYYYY(booking.bookingTime);

        res.status(201).json({
            message: 'Booking submitted successfully!',
            booking: bookingObj
        });
    } catch (error) {
        console.error('[booking] Create booking failed:', error);
        res.status(400).json({
            message: 'Error creating booking',
            error: error.message
        });
    }
});

// Check booking availability (public)
// Step 1: Check work hours / time slot availability first
// Step 2: Check existing booking second
router.post('/check-booking-availability', async (req, res) => {
    try {
        const resolved = resolveBookingDateTime(req.body);
        if (resolved.error) {
            return res.status(400).json({
                message: resolved.error,
                available: false
            });
        }

        const { bookingDateTime, timeSlotStr } = resolved;

        const availability = await verifyBookingAvailability(bookingDateTime, timeSlotStr);
        if (!availability.available) {
            return res.json({
                available: false,
                message: availability.message || 'The selected time slot is unavailable'
            });
        }

        res.json({
            available: true,
            message: 'Time slot is available'
        });

    } catch (error) {
        console.error('Error in check-booking-availability:', error);
        res.status(500).json({
            message: 'Error checking booking availability',
            error: error.message,
            available: false
        });
    }
});

// Get available time slots (public)
router.get('/available-slots', async (req, res) => {
    try {
        const { date } = req.query;
        
        // Get available time slots from TimeSlot model
        const TimeSlot = require('../models/TimeSlot');
        let query = { isAvailable: true };
        
        if (date) {
            const startOfDay = new Date(date);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            
            query.date = {
                $gte: startOfDay,
                $lte: endOfDay
            };
        }

        const timeSlots = await TimeSlot.find(query).sort({ date: 1, time: 1 });
        
        // Filter out slots that are already booked
        const bookedSlots = await Booking.find({
            bookingTime: {
                $gte: date ? new Date(date) : new Date(),
                $lt: date ? new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            },
            status: { $in: ['pending', 'confirmed'] }
        });

        const availableSlots = timeSlots.filter(slot => {
            const slotDateTime = new Date(`${slot.date.toISOString().split('T')[0]}T${slot.time}`);
            return !bookedSlots.some(booking => 
                new Date(booking.bookingTime).getTime() === slotDateTime.getTime()
            );
        });

        res.json(availableSlots);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching available time slots',
            error: error.message
        });
    }
});

// Get all bookings (admin only)
router.get('/', adminAuth, async (req, res) => {
    try {
        const { status, date, search } = req.query;
        let query = {};

        if (status) {
            query.status = status;
        }

        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            query.bookingTime = { $gte: startOfDay, $lte: endOfDay };
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { service: { $regex: search, $options: 'i' } }
            ];
        }

        const bookings = await Booking.find(query).sort({ bookingTime: 1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching bookings',
            error: error.message
        });
    }
});

// Get single booking (admin only)
router.get('/:id', adminAuth, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        res.json(booking);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching booking',
            error: error.message
        });
    }
});

// Update booking status (admin only)
router.patch('/:id/status', adminAuth, async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        const previousStatus = booking.status;

        booking.status = status;
        await booking.save();

        const statusChanged = previousStatus !== status;
        const shouldNotifyClient =
            statusChanged && (status === 'confirmed' || status === 'cancelled');

        if (shouldNotifyClient) {
            await sendClientStatusEmail(booking, status);
        }

        // Update time slot availability based on status
        const TimeSlot = require('../models/TimeSlot');
        const bookingDateTime = new Date(booking.bookingTime);
        const hours = bookingDateTime.getHours();
        const minutes = bookingDateTime.getMinutes();
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        const dateOnly = new Date(bookingDateTime);
        dateOnly.setHours(0, 0, 0, 0);
        
        let timeSlot = await TimeSlot.findOne({
            date: dateOnly,
            time: timeString
        });
        
        if (timeSlot) {
            // If cancelled, make slot available again
            // If confirmed or pending, keep it unavailable
            if (status === 'cancelled') {
                timeSlot.isAvailable = true;
            } else {
                timeSlot.isAvailable = false;
            }
            await timeSlot.save();
        }

        res.json({ message: 'Booking status updated', booking });
    } catch (error) {
        res.status(400).json({
            message: 'Error updating booking',
            error: error.message
        });
    }
});

// Update booking (admin only)
router.patch('/:id', adminAuth, async (req, res) => {
    try {
        const updates = req.body;
        if (updates.email) {
            updates.email = updates.email.toLowerCase();
        }
        if (updates.bookingTime) {
            updates.bookingTime = new Date(updates.bookingTime);
        }

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        res.json({ message: 'Booking updated', booking });
    } catch (error) {
        res.status(400).json({
            message: 'Error updating booking',
            error: error.message
        });
    }
});

// Delete booking (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Free up the time slot before deleting
        const TimeSlot = require('../models/TimeSlot');
        const bookingDateTime = new Date(booking.bookingTime);
        const hours = bookingDateTime.getHours();
        const minutes = bookingDateTime.getMinutes();
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        const dateOnly = new Date(bookingDateTime);
        dateOnly.setHours(0, 0, 0, 0);
        
        const timeSlot = await TimeSlot.findOne({
            date: dateOnly,
            time: timeString
        });
        
        if (timeSlot) {
            timeSlot.isAvailable = true;
            await timeSlot.save();
        }

        await Booking.findByIdAndDelete(req.params.id);

        res.json({ message: 'Booking deleted successfully' });
    } catch (error) {
        res.status(400).json({
            message: 'Error deleting booking',
            error: error.message
        });
    }
});

module.exports = router;