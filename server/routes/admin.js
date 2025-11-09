const express = require('express');
const { adminAuth } = require('../middleware/auth');
const Booking = require('../models/Booking');
const Customer = require('../models/Customer');
const TimeSlot = require('../models/TimeSlot');
const router = express.Router();

// Admin dashboard stats
router.get('/dashboard', adminAuth, async (req, res) => {
    try {
        const totalBookings = await Booking.countDocuments();
        const pendingBookings = await Booking.countDocuments({ status: 'pending' });
        const confirmedBookings = await Booking.countDocuments({ status: 'confirmed' });
        const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });
        const totalCustomers = await Customer.countDocuments();
        const availableSlots = await TimeSlot.countDocuments({ isAvailable: true });

        // Recent bookings
        const recentBookings = await Booking.find()
            .sort({ createdAt: -1 })
            .limit(10);

        // Bookings by status for chart
        const bookingsByStatus = {
            pending: pendingBookings,
            confirmed: confirmedBookings,
            cancelled: cancelledBookings
        };

        // Recent bookings this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const bookingsThisMonth = await Booking.countDocuments({
            createdAt: { $gte: startOfMonth }
        });

        res.json({
            stats: {
                total: totalBookings,
                pending: pendingBookings,
                confirmed: confirmedBookings,
                cancelled: cancelledBookings,
                totalCustomers,
                availableSlots,
                bookingsThisMonth,
                bookingsByStatus
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

// Analytics endpoint
router.get('/analytics', adminAuth, async (req, res) => {
    try {
        const { period = '30' } = req.query; // days
        const days = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Bookings over time
        const bookings = await Booking.find({
            createdAt: { $gte: startDate }
        }).sort({ createdAt: 1 });

        // Group bookings by date
        const bookingsByDate = {};
        bookings.forEach(booking => {
            const date = booking.createdAt.toISOString().split('T')[0];
            if (!bookingsByDate[date]) {
                bookingsByDate[date] = { date, count: 0, revenue: 0 };
            }
            bookingsByDate[date].count++;
            
            // Calculate revenue
            // This is a simplified version - in production, you'd want to store price in booking
        });

        // Top services
        const serviceCounts = {};
        bookings.forEach(booking => {
            serviceCounts[booking.service] = (serviceCounts[booking.service] || 0) + 1;
        });

        const topServices = Object.entries(serviceCounts)
            .map(([service, count]) => ({ service, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Customer statistics
        const newCustomers = await Customer.countDocuments({
            createdAt: { $gte: startDate }
        });

        const returningCustomers = await Customer.countDocuments({
            totalBookings: { $gt: 1 },
            lastVisit: { $gte: startDate }
        });

        res.json({
            period: days,
            bookingsByDate: Object.values(bookingsByDate),
            topServices,
            customerStats: {
                new: newCustomers,
                returning: returningCustomers
            },
            totalBookings: bookings.length
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching analytics',
            error: error.message
        });
    }
});

module.exports = router;