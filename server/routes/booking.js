const express = require('express');
const Booking = require('../models/Booking');
const { adminAuth } = require('../middleware/auth');
const router = express.Router();

// Create new booking (public)
router.post('/', async (req, res) => {
    try {
        const { name, phone, email, service, bookingTime } = req.body;

        // Validate required fields
        if (!name || !phone || !email || !service || !bookingTime) {
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        // Check if time slot is available
        const bookingDateTime = new Date(bookingTime);
        
        // Validate time is within working hours (08:00-22:00) and is a valid 2-hour block start time
        const hours = bookingDateTime.getHours();
        const minutes = bookingDateTime.getMinutes();
        const validStartTimes = [8, 10, 12, 14, 16, 18, 20];
        
        if (!validStartTimes.includes(hours) || minutes !== 0) {
            return res.status(400).json({
                message: 'Invalid time slot. Please select a valid 2-hour time block starting at 8:00 AM, 10:00 AM, 12:00 PM, 2:00 PM, 4:00 PM, 6:00 PM, or 8:00 PM.'
            });
        }
        
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
            bookingTime: bookingDateTime
        });

        await booking.save();

        // Update or create customer record
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

        res.status(201).json({
            message: 'Booking submitted successfully!',
            booking
        });
    } catch (error) {
        res.status(400).json({
            message: 'Error creating booking',
            error: error.message
        });
    }
});

// Check booking availability (public)
router.post('/check-booking-availability', async (req, res) => {
    try {
        const { bookingTime } = req.body;

        if (!bookingTime) {
            return res.status(400).json({
                message: 'Booking time is required',
                available: false
            });
        }

        const bookingDateTime = new Date(bookingTime);

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

        booking.status = status;
        await booking.save();

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