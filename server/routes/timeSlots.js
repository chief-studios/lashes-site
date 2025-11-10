const express = require('express');
const TimeSlot = require('../models/TimeSlot');
const { adminAuth } = require('../middleware/auth');
const router = express.Router();

// Get all time slots (admin only)
router.get('/', adminAuth, async (req, res) => {
    try {
        const timeSlots = await TimeSlot.find().sort({ date: 1, time: 1 });
        res.json(timeSlots);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching time slots',
            error: error.message
        });
    }
});

// Create new time slot (admin only)
router.post('/', adminAuth, async (req, res) => {
    try {
        const { date, time, isAvailable = true } = req.body;

        // Check if time slot already exists
        const existingSlot = await TimeSlot.findOne({
            date: new Date(date),
            time: time
        });

        if (existingSlot) {
            return res.status(400).json({
                message: 'Time slot already exists for this date and time'
            });
        }

        const timeSlot = new TimeSlot({
            date: new Date(date),
            time,
            isAvailable
        });

        await timeSlot.save();
        res.status(201).json({
            message: 'Time slot created successfully',
            timeSlot
        });
    } catch (error) {
        res.status(400).json({
            message: 'Error creating time slot',
            error: error.message
        });
    }
});

// Update time slot availability (admin only)
router.patch('/:id', adminAuth, async (req, res) => {
    try {
        const { isAvailable } = req.body;
        const timeSlot = await TimeSlot.findByIdAndUpdate(
            req.params.id,
            { isAvailable },
            { new: true }
        );

        if (!timeSlot) {
            return res.status(404).json({ message: 'Time slot not found' });
        }

        res.json({ message: 'Time slot updated', timeSlot });
    } catch (error) {
        res.status(400).json({
            message: 'Error updating time slot',
            error: error.message
        });
    }
});

// Delete time slot (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const timeSlot = await TimeSlot.findByIdAndDelete(req.params.id);

        if (!timeSlot) {
            return res.status(404).json({ message: 'Time slot not found' });
        }

        res.json({ message: 'Time slot deleted successfully' });
    } catch (error) {
        res.status(400).json({
            message: 'Error deleting time slot',
            error: error.message
        });
    }
});

// Helper function to generate time slots for a given date
async function generateTimeSlotsForDate(date) {
    const Booking = require('../models/Booking');
    
    // Working hours: 08:00 to 22:00 (10:00 PM) with 2-hour blocks
    const timeSlots = [
        '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'
    ];
    
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);
    
    const generatedSlots = [];
    
    for (const time of timeSlots) {
        // Check if slot already exists
        let slot = await TimeSlot.findOne({
            date: dateObj,
            time: time
        });
        
        // If slot doesn't exist, create it
        if (!slot) {
            slot = new TimeSlot({
                date: dateObj,
                time: time,
                isAvailable: true
            });
            await slot.save();
        }
        
        // Check if slot is booked
        const [hours, minutes] = time.split(':');
        const slotDateTime = new Date(dateObj);
        slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        const existingBooking = await Booking.findOne({
            bookingTime: slotDateTime,
            status: { $in: ['pending', 'confirmed'] }
        });
        
        // Mark as unavailable if booked
        if (existingBooking && slot.isAvailable) {
            slot.isAvailable = false;
            await slot.save();
        }
        
        // Only return available slots
        if (slot.isAvailable) {
            generatedSlots.push(slot);
        }
    }
    
    return generatedSlots;
}

// Get available time slots (public) - auto-generates if needed
router.get('/available', async (req, res) => {
    try {
        const { date } = req.query;
        
        if (!date) {
            return res.status(400).json({
                message: 'Date parameter is required'
            });
        }
        
        // Generate time slots for the requested date
        const timeSlots = await generateTimeSlotsForDate(date);
        
        res.json(timeSlots);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching available time slots',
            error: error.message
        });
    }
});

module.exports = router;
