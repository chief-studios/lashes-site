const express = require('express');
const { adminAuth } = require('../middleware/auth');
const Booking = require('../models/Booking');
const router = express.Router();

// Admin dashboard stats
router.get('/dashboard', adminAuth, async (req, res) => {
    try {
        const totalBookings = await Booking.countDocuments();
        const pendingBookings = await Booking.countDocuments({ status: 'pending' });
        const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });

        // Recent bookings
        const recentBookings = await Booking.find()
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            stats: {
                total: totalBookings,
                pending: pendingBookings,
                confirmed: confirmedBookings
            },
            recentBookings
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching dashboard data',
            error: error.message
        });
    }
});

module.exports = router;