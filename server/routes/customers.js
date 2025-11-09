const express = require('express');
const Customer = require('../models/Customer');
const Booking = require('../models/Booking');
const { adminAuth } = require('../middleware/auth');
const router = express.Router();

// Get all customers (admin only)
router.get('/', adminAuth, async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const customers = await Customer.find(query)
            .sort({ lastVisit: -1, createdAt: -1 })
            .limit(100);
        
        res.json(customers);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching customers',
            error: error.message
        });
    }
});

// Get single customer with booking history (admin only)
router.get('/:id', adminAuth, async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Get customer's booking history
        const bookings = await Booking.find({
            email: customer.email
        }).sort({ bookingTime: -1 });

        res.json({
            customer,
            bookings
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching customer',
            error: error.message
        });
    }
});

// Create or update customer (admin only)
router.post('/', adminAuth, async (req, res) => {
    try {
        const { name, email, phone, notes } = req.body;

        // Check if customer already exists
        let customer = await Customer.findOne({ email: email.toLowerCase() });

        if (customer) {
            // Update existing customer
            customer.name = name;
            customer.phone = phone;
            if (notes) customer.notes = notes;
            await customer.save();
        } else {
            // Create new customer
            customer = new Customer({
                name,
                email: email.toLowerCase(),
                phone,
                notes: notes || ''
            });
            await customer.save();
        }

        res.status(201).json({
            message: 'Customer saved successfully',
            customer
        });
    } catch (error) {
        res.status(400).json({
            message: 'Error saving customer',
            error: error.message
        });
    }
});

// Update customer (admin only)
router.patch('/:id', adminAuth, async (req, res) => {
    try {
        const updates = req.body;
        if (updates.email) {
            updates.email = updates.email.toLowerCase();
        }

        const customer = await Customer.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.json({
            message: 'Customer updated successfully',
            customer
        });
    } catch (error) {
        res.status(400).json({
            message: 'Error updating customer',
            error: error.message
        });
    }
});

// Delete customer (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const customer = await Customer.findByIdAndDelete(req.params.id);

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        res.status(400).json({
            message: 'Error deleting customer',
            error: error.message
        });
    }
});

// Sync customers from bookings (admin only) - useful for migrating existing bookings
router.post('/sync', adminAuth, async (req, res) => {
    try {
        const bookings = await Booking.find();
        let synced = 0;

        for (const booking of bookings) {
            let customer = await Customer.findOne({ email: booking.email.toLowerCase() });

            if (!customer) {
                customer = new Customer({
                    name: booking.name,
                    email: booking.email.toLowerCase(),
                    phone: booking.phone,
                    totalBookings: 0,
                    totalSpent: 0
                });
            }

            // Update stats
            customer.totalBookings += 1;
            if (!customer.lastVisit || new Date(booking.bookingTime) > customer.lastVisit) {
                customer.lastVisit = booking.bookingTime;
            }

            await customer.save();
            synced++;
        }

        res.json({
            message: `Synced ${synced} customers from bookings`
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error syncing customers',
            error: error.message
        });
    }
});

module.exports = router;

