const express = require('express');
const { adminAuth } = require('../middleware/auth');
const LashColor = require('../models/LashColor');
const router = express.Router();

// Get all lash colors (Public)
router.get('/', async (req, res) => {
    try {
        const colors = await LashColor.find().sort({ createdAt: 1 });
        res.json(colors);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching lash colors', error: error.message });
    }
});

// Create a new lash color (Admin only)
router.post('/', adminAuth, async (req, res) => {
    try {
        const { value, label, swatch } = req.body;
        
        if (!value || !label || !swatch) {
            return res.status(400).json({ message: 'Value, label, and swatch are required.' });
        }

        const normalizedValue = value.toLowerCase().trim().replace(/\s+/g, '-');
        const newColor = new LashColor({ value: normalizedValue, label: label.trim(), swatch: swatch.trim() });
        const savedColor = await newColor.save();
        res.status(201).json(savedColor);
    } catch (error) {
        res.status(400).json({ message: 'Error creating lash color', error: error.message });
    }
});

// Update a lash color (Admin only)
router.put('/:id', adminAuth, async (req, res) => {
    try {
        const { value, label, swatch } = req.body;
        const normalizedValue = value ? value.toLowerCase().trim().replace(/\s+/g, '-') : undefined;

        const updatedColor = await LashColor.findByIdAndUpdate(
            req.params.id,
            { ...(value && { value: normalizedValue }), ...(label && { label: label.trim() }), ...(swatch && { swatch: swatch.trim() }) },
            { new: true, runValidators: true }
        );

        if (!updatedColor) {
            return res.status(404).json({ message: 'Lash color not found' });
        }

        res.json(updatedColor);
    } catch (error) {
        res.status(400).json({ message: 'Error updating lash color', error: error.message });
    }
});

// Delete a lash color (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const deletedColor = await LashColor.findByIdAndDelete(req.params.id);
        if (!deletedColor) {
            return res.status(404).json({ message: 'Lash color not found' });
        }
        res.json({ message: 'Lash color deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting lash color', error: error.message });
    }
});

module.exports = router;
