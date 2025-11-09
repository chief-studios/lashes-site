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

        // Check if time slot is available (basic conflict check)
        const bookingDateTime = new Date(bookingTime);
        const existingBooking = await Booking.findOne({
            bookingTime: bookingDateTime,
            status: { $in: ['pending', 'confirmed'] }
        });

        if (existingBooking) {
            return res.status(400).json({
                message: 'This time slot is already booked. Please choose another time.'
            });
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

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
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
        const booking = await Booking.findByIdAndDelete(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        res.json({ message: 'Booking deleted successfully' });
    } catch (error) {
        res.status(400).json({
            message: 'Error deleting booking',
            error: error.message
        });
    }
});

module.exports = router;