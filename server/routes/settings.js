const express = require('express');
const Settings = require('../models/Settings');
const { adminAuth } = require('../middleware/auth');
const router = express.Router();

// Get settings (public for studio info, admin for full settings)
router.get('/', async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        
        // Return public info only if not admin
        const isAdmin = req.headers.authorization; // Basic check, full auth handled in admin route
        
        if (!isAdmin) {
            return res.json({
                studioName: settings.studioName,
                studioEmail: settings.studioEmail,
                studioPhone: settings.studioPhone,
                studioAddress: settings.studioAddress,
                businessHours: settings.businessHours,
                socialMedia: settings.socialMedia
            });
        }

        res.json(settings);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching settings',
            error: error.message
        });
    }
});

// Get full settings (admin only)
router.get('/admin', adminAuth, async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        res.json(settings);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching settings',
            error: error.message
        });
    }
});

// Update settings (admin only)
router.patch('/', adminAuth, async (req, res) => {
    try {
        let settings = await Settings.findOne();
        
        if (!settings) {
            settings = new Settings(req.body);
        } else {
            Object.assign(settings, req.body);
            settings.updatedAt = Date.now();
        }

        await settings.save();
        res.json({
            message: 'Settings updated successfully',
            settings
        });
    } catch (error) {
        res.status(400).json({
            message: 'Error updating settings',
            error: error.message
        });
    }
});

module.exports = router;

