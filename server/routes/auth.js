const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Admin login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Get credentials from environment variables
        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD;

        // Check username
        if (username !== adminUsername) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password (support both plain text and hashed passwords)
        let isMatch = false;
        if (adminPassword.startsWith('$2')) {
            // Password is hashed
            isMatch = await bcrypt.compare(password, adminPassword);
        } else {
            // Password is plain text
            isMatch = password === adminPassword;
        }

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create token
        const token = jwt.sign(
            { username: adminUsername, role: 'admin' },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                username: adminUsername,
                role: 'admin'
            }
        });
    } catch (error) {
        res.status(500).json({
            message: 'Server error during authentication',
            error: error.message
        });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    res.json({
        user: {
            username: req.user.username,
            role: req.user.role
        }
    });
});

module.exports = router;