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

// Get available time slots (public)
router.get('/available', async (req, res) => {
    try {
        const { date } = req.query;
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
        res.json(timeSlots);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching available time slots',
            error: error.message
        });
    }
});

module.exports = router;
