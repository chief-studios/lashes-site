const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    studioName: {
        type: String,
        default: 'Best Lashes'
    },
    studioEmail: {
        type: String,
        default: ''
    },
    studioPhone: {
        type: String,
        default: ''
    },
    studioAddress: {
        type: String,
        default: ''
    },
    businessHours: {
        monday: { open: String, close: String, isOpen: Boolean, slots: [String] },
        tuesday: { open: String, close: String, isOpen: Boolean, slots: [String] },
        wednesday: { open: String, close: String, isOpen: Boolean, slots: [String] },
        thursday: { open: String, close: String, isOpen: Boolean, slots: [String] },
        friday: { open: String, close: String, isOpen: Boolean, slots: [String] },
        saturday: { open: String, close: String, isOpen: Boolean, slots: [String] },
        sunday: { open: String, close: String, isOpen: Boolean, slots: [String] }
    },
    bookingSettings: {
        advanceBookingDays: {
            type: Number,
            default: 30
        },
        cancellationHours: {
            type: Number,
            default: 24
        },
        slotDuration: {
            type: Number,
            default: 120 // minutes
        }
    },
    socialMedia: {
        facebook: String,
        instagram: String,
        twitter: String,
        tiktok: String
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Helper to generate default slots list (8:00 AM - 8:00 PM, 2-hour blocks)
const defaultSlots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({
            businessHours: {
                monday: { open: '08:00', close: '20:00', isOpen: true, slots: [...defaultSlots] },
                tuesday: { open: '08:00', close: '20:00', isOpen: true, slots: [...defaultSlots] },
                wednesday: { open: '08:00', close: '20:00', isOpen: true, slots: [...defaultSlots] },
                thursday: { open: '08:00', close: '20:00', isOpen: true, slots: [...defaultSlots] },
                friday: { open: '08:00', close: '20:00', isOpen: true, slots: [...defaultSlots] },
                saturday: { open: '08:00', close: '20:00', isOpen: true, slots: [...defaultSlots] },
                sunday: { open: '08:00', close: '20:00', isOpen: false, slots: [] }
            },
            bookingSettings: {
                advanceBookingDays: 30,
                cancellationHours: 24,
                slotDuration: 120
            }
        });
    }
    return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);

