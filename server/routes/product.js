const express = require('express');
const { adminAuth } = require('../middleware/auth');
const Product = require('../models/Product')
const router = express.Router();

// Get all products (Public)
router.get('/', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
});

// Create a new product (Admin only)
router.post('/', adminAuth, async (req, res) => {
    try {
        const { name, description, price, duration, image, type, extra, poster } = req.body;
        const newProduct = new Product({ name, description, price, duration, image, type, extra, poster });
        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        res.status(400).json({ message: 'Error creating product', error: error.message });
    }
});

// Update a product (Admin only)
router.put('/:id', adminAuth, async (req, res) => {
    try {
        const { name, description, price, duration, image, type, extra, poster } = req.body;
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            { name, description, price, duration, image, type, extra, poster },
            { new: true, runValidators: true }
        );
        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(updatedProduct);
    } catch (error) {
        res.status(400).json({ message: 'Error updating product', error: error.message });
    }
});

// Delete a product (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product', error: error.message });
    }
});

module.exports = router;