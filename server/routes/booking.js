const express = require('express');
const { Resend } = require('resend');
const Booking = require('../models/Booking');
const { adminAuth } = require('../middleware/auth');
const router = express.Router();

const emailFrom = () =>
    process.env.EMAIL_FROM || 'Lash Studio <onboarding@resend.dev>';

/** Admin inbox for new-booking alerts (any one of these in .env works). */
const getAdminNotifyEmail = () =>
    (process.env.ADMIN_EMAIL ||
        process.env.BOOKING_NOTIFY_EMAIL ||
        process.env.NOTIFY_EMAIL ||
        '')
        .trim();

const formatBookingDateTime = (date) => new Date(date).toLocaleString();

const VALID_SLOT_HOURS = [8, 10, 12, 14, 16, 18, 20];
const INVALID_SLOT_MESSAGE =
    'Invalid time slot. Please select a valid 2-hour time block starting at 8:00 AM, 10:00 AM, 12:00 PM, 2:00 PM, 4:00 PM, 6:00 PM, or 8:00 PM.';

/**
 * Resolve appointment time from bookingDate + timeSlot (preferred) or ISO bookingTime.
 */
const resolveBookingDateTime = (body) => {
    const { bookingTime, bookingDate, timeSlot } = body;

    if (bookingDate && timeSlot) {
        const slotMatch = /^(\d{1,2}):(\d{2})$/.exec(String(timeSlot).trim());
        if (!slotMatch) {
            return { error: INVALID_SLOT_MESSAGE };
        }

        const hours = parseInt(slotMatch[1], 10);
        const minutes = parseInt(slotMatch[2], 10);

        if (!VALID_SLOT_HOURS.includes(hours) || minutes !== 0) {
            return { error: INVALID_SLOT_MESSAGE };
        }

        const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(bookingDate).trim());
        if (!dateMatch) {
            return { error: 'Invalid booking date.' };
        }

        const y = parseInt(dateMatch[1], 10);
        const mo = parseInt(dateMatch[2], 10);
        const d = parseInt(dateMatch[3], 10);
        const bookingDateTime = new Date(y, mo - 1, d, hours, minutes, 0, 0);

        if (Number.isNaN(bookingDateTime.getTime())) {
            return { error: 'Invalid booking date.' };
        }

        return { bookingDateTime, hours, minutes };
    }

    if (!bookingTime) {
        return { error: 'Booking time is required' };
    }

    const bookingDateTime = new Date(bookingTime);
    if (Number.isNaN(bookingDateTime.getTime())) {
        return { error: 'Invalid booking time' };
    }

    const hours = bookingDateTime.getHours();
    const minutes = bookingDateTime.getMinutes();

    if (!VALID_SLOT_HOURS.includes(hours) || minutes !== 0) {
        return { error: INVALID_SLOT_MESSAGE };
    }

    return { bookingDateTime, hours, minutes };
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
 * Notify the client when admin accepts (confirmed) or rejects (cancelled) a booking.
 * @param {import('../models/Booking')} booking
 * @param {'confirmed'|'cancelled'} status
 */
const sendClientStatusEmail = async (booking, status) => {
    if (!booking?.email) {
        console.warn('[booking email] No client email on booking; skipping status email.');
        return;
    }

    const isConfirmed = status === 'confirmed';
    const when = formatBookingDateTime(booking.bookingTime);

    const subject = isConfirmed
        ? 'Your lash appointment is confirmed'
        : 'Your lash appointment was not confirmed';

    const html = isConfirmed
        ? `
        <h2>Appointment confirmed</h2>
        <p>Hi ${booking.name},</p>
        <p>Your booking has been <strong>accepted</strong>. Your appointment <strong>will take place</strong> at the time below.</p>
        <p><strong>Service:</strong> ${booking.service}</p>
        <p><strong>Date &amp; time:</strong> ${when}</p>
        <p><strong>Phone on file:</strong> ${booking.phone}</p>
        <p>We look forward to seeing you. If you need to change anything, reply to this email or contact the studio.</p>
    `
        : `
        <h2>Appointment not confirmed</h2>
        <p>Hi ${booking.name},</p>
        <p>Your booking request was <strong>not accepted</strong>. The appointment below <strong>will not take place</strong>.</p>
        <p><strong>Service:</strong> ${booking.service}</p>
        <p><strong>Requested time:</strong> ${when}</p>
        <p>Please choose another available slot on our website if you would still like to book.</p>
    `;

    const result = await sendResendEmail({
        from: emailFrom(),
        to: [booking.email],
        subject,
        html
    });

    if (!result.ok) {
        const err = result.error;
        const msg =
            err && typeof err === 'object' && 'message' in err
                ? String(err.message)
                : err
                  ? JSON.stringify(err)
                  : 'Resend send failed';
        throw new Error(msg);
    }

    console.log(
        `[booking email] Client ${isConfirmed ? 'acceptance' : 'rejection'} email sent to ${booking.email}`
    );
};

// Create new booking (public)
router.post('/', async (req, res) => {
    try {
        const { name, phone, email, service, bookingTime, comments } = req.body;

        // Validate required fields
        if (!name || !phone || !email || !service || !bookingTime) {
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        const resolved = resolveBookingDateTime(req.body);
        if (resolved.error) {
            return res.status(400).json({ message: resolved.error });
        }

        const { bookingDateTime, hours, minutes } = resolved;
        
        // Check for existing bookings
        const existingBooking = await Booking.findOne({
            bookingTime: bookingDateTime,
            status: { $in: ['pending', 'confirmed'] }
        });

        if (existingBooking) {
            return res.status(400).json({
                message: 'This time slot is already booked. Please choose another time.'
            });
        }
        
        // Mark the time slot as unavailable
        const TimeSlot = require('../models/TimeSlot');
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
            comments: comments || ''
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

        res.status(201).json({
            message: 'Booking submitted successfully!',
            booking
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
router.post('/check-booking-availability', async (req, res) => {
    try {
        const resolved = resolveBookingDateTime(req.body);
        if (resolved.error) {
            return res.status(400).json({
                message: resolved.error,
                available: false
            });
        }

        const { bookingDateTime } = resolved;

        // Check for existing bookings
        const existingBooking = await Booking.findOne({
            bookingTime: bookingDateTime,
            status: { $in: ['pending', 'confirmed'] }
        });

        if (existingBooking) {
            return res.json({
                available: false,
                message: 'This time slot is already booked. Please choose another time.'
            });
        }

        // If no existing booking, time slot is available
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
            try {
                await sendClientStatusEmail(booking, status);
            } catch (emailError) {
                console.error(
                    '[booking email] Failed to send client status email:',
                    emailError.message
                );
            }
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