const express = require('express');
const { adminAuth } = require('../middleware/auth');
const Service = require('../models/Services');
const Product = require('../models/Product');
const router = express.Router();

// Get all services (Public)
router.get('/', async (req, res) => {
    try {
        const services = await Service.find().sort({ createdAt: -1 });
        res.json(services);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching services', error: error.message });
    }
});

// Create a new service (Admin only)
router.post('/', adminAuth, async (req, res) => {
    try {
        const { name, description, price, duration, image } = req.body;
        const newService = new Service({ name, description, price, duration, image });
        const savedService = await newService.save();

        await Product.updateOne(
            { name },
            { $set: { name, description, price, duration, image, type: 'brow' } },
            { upsert: true }
        );

        res.status(201).json(savedService);
    } catch (error) {
        res.status(400).json({ message: 'Error creating service', error: error.message });
    }
});

// Update a service (Admin only)
router.put('/:id', adminAuth, async (req, res) => {
    try {
        const { name, description, price, duration, image } = req.body;
        const updatedService = await Service.findByIdAndUpdate(
            req.params.id,
            { name, description, price, duration, image },
            { new: true, runValidators: true }
        );
        if (!updatedService) {
            return res.status(404).json({ message: 'Service not found' });
        }

        await Product.updateOne(
            { name: updatedService.name },
            { $set: { name: updatedService.name, description: updatedService.description, price: updatedService.price, duration: updatedService.duration, image: updatedService.image, type: 'brow' } },
            { upsert: true }
        );

        res.json(updatedService);
    } catch (error) {
        res.status(400).json({ message: 'Error updating service', error: error.message });
    }
});

// Delete a service (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const deletedService = await Service.findByIdAndDelete(req.params.id);
        if (!deletedService) {
            return res.status(404).json({ message: 'Service not found' });
        }

        await Product.deleteOne({ name: deletedService.name, type: 'brow' });

        res.json({ message: 'Service deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting service', error: error.message });
    }
});

module.exports = router;
