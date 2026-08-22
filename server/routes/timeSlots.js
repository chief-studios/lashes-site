const express = require('express');
const TimeSlot = require('../models/TimeSlot');
const Booking = require('../models/Booking');
const Settings = require('../models/Settings');
const { adminAuth } = require('../middleware/auth');
const router = express.Router();

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Checks if requested date and time fall within configured admin work hours.
 */
async function checkTimeWithinWorkHours(dateObj, timeStr) {
    const settings = await Settings.getSettings();
    const businessHours = settings.businessHours || {};

    const dayOfWeek = DAY_NAMES[dateObj.getDay()];
    const daySchedule = businessHours[dayOfWeek];

    if (!daySchedule || !daySchedule.isOpen) {
        return { isWithin: false, reason: 'Studio is closed on this day' };
    }

    if (Array.isArray(daySchedule.slots) && daySchedule.slots.length > 0) {
        if (!daySchedule.slots.includes(timeStr)) {
            return { isWithin: false, reason: 'The selected time slot is not available for this day' };
        }
        return { isWithin: true };
    }

    const { open = '08:00', close = '20:00' } = daySchedule;
    const [openH, openM] = open.split(':').map(Number);
    const [closeH, closeM] = close.split(':').map(Number);

    const [reqH, reqM] = timeStr.split(':').map(Number);

    const reqMinutes = reqH * 60 + reqM;
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    if (reqMinutes < openMinutes || reqMinutes >= closeMinutes) {
        return { isWithin: false, reason: 'Selected time is outside working hours' };
    }

    return { isWithin: true };
}

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

// Check time slot availability (public)
// Step 1: Check work hours / time slot availability first
// Step 2: Check existing booking second
router.post('/check-availability', async (req, res) => {
    try {
        const { date, time } = req.body;

        if (!date || !time) {
            return res.status(400).json({
                message: 'Date and time parameters are required',
                available: false
            });
        }

        const bookingDateObj = new Date(date);
        if (Number.isNaN(bookingDateObj.getTime())) {
            return res.status(400).json({
                message: 'The selected time slot is unavailable',
                available: false
            });
        }

        // STEP 1: First check if that time is available for booking (work hours & admin manual blocks)
        const workHoursCheck = await checkTimeWithinWorkHours(bookingDateObj, time);
        if (!workHoursCheck.isWithin) {
            return res.json({
                available: false,
                message: 'The selected time slot is unavailable'
            });
        }

        const dateOnly = new Date(date);
        dateOnly.setHours(0, 0, 0, 0);

        const timeSlot = await TimeSlot.findOne({
            date: dateOnly,
            time: time
        });

        if (timeSlot && !timeSlot.isAvailable) {
            return res.json({
                available: false,
                message: 'The selected time slot is unavailable'
            });
        }

        // STEP 2: Second check if there's a booking there already
        const [hours, minutes] = time.split(':');
        const bookingDateTime = new Date(date);
        bookingDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

        const existingBooking = await Booking.findOne({
            bookingTime: bookingDateTime,
            status: { $in: ['pending', 'confirmed', 'completed'] }
        });

        if (existingBooking) {
            return res.json({
                available: false,
                message: 'The selected time slot is unavailable'
            });
        }

        res.json({
            available: true,
            message: 'Time slot is available'
        });

    } catch (error) {
        console.error('Error in check-availability:', error);
        res.status(500).json({
            message: 'Error checking time slot availability',
            error: error.message,
            available: false
        });
    }
});

// Helper function to generate time slots for a given date based on Settings work hours
async function generateTimeSlotsForDate(date) {
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    const settings = await Settings.getSettings();
    const businessHours = settings.businessHours || {};
    const dayOfWeek = DAY_NAMES[dateObj.getDay()];
    const daySchedule = businessHours[dayOfWeek];

    if (!daySchedule || !daySchedule.isOpen) {
        return [];
    }

    let timeSlots = [];
    if (Array.isArray(daySchedule.slots) && daySchedule.slots.length > 0) {
        timeSlots = [...daySchedule.slots];
    } else {
        const slotDuration = settings.bookingSettings?.slotDuration || 120;
        const { open = '08:00', close = '20:00' } = daySchedule;

        const [openH, openM] = open.split(':').map(Number);
        const [closeH, closeM] = close.split(':').map(Number);

        let startMins = openH * 60 + openM;
        const endMins = closeH * 60 + closeM;

        while (startMins + slotDuration <= endMins) {
            const h = Math.floor(startMins / 60);
            const m = startMins % 60;
            const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            timeSlots.push(timeStr);
            startMins += slotDuration;
        }
    }

    const generatedSlots = [];

    for (const time of timeSlots) {
        let slot = await TimeSlot.findOne({
            date: dateObj,
            time: time
        });

        if (!slot) {
            slot = new TimeSlot({
                date: dateObj,
                time: time,
                isAvailable: true
            });
            await slot.save();
        }

        const [hours, minutes] = time.split(':');
        const slotDateTime = new Date(dateObj);
        slotDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

        const existingBooking = await Booking.findOne({
            bookingTime: slotDateTime,
            status: { $in: ['pending', 'confirmed', 'completed'] }
        });

        if (existingBooking && slot.isAvailable) {
            slot.isAvailable = false;
            await slot.save();
        }

        if (slot.isAvailable && !existingBooking) {
            generatedSlots.push(slot);
        }
    }

    return generatedSlots;
}

// Get available time slots (public) - auto-generates based on admin work hours
router.get('/available', async (req, res) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({
                message: 'Date parameter is required'
            });
        }

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