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
        monday: { open: String, close: String, isOpen: Boolean },
        tuesday: { open: String, close: String, isOpen: Boolean },
        wednesday: { open: String, close: String, isOpen: Boolean },
        thursday: { open: String, close: String, isOpen: Boolean },
        friday: { open: String, close: String, isOpen: Boolean },
        saturday: { open: String, close: String, isOpen: Boolean },
        sunday: { open: String, close: String, isOpen: Boolean }
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
            default: 30 // minutes
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

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({
            businessHours: {
                monday: { open: '08:00', close: '20:00', isOpen: true },
                tuesday: { open: '08:00', close: '20:00', isOpen: true },
                wednesday: { open: '08:00', close: '20:00', isOpen: true },
                thursday: { open: '08:00', close: '20:00', isOpen: true },
                friday: { open: '08:00', close: '20:00', isOpen: true },
                saturday: { open: '08:00', close: '20:00', isOpen: true },
                sunday: { open: '08:00', close: '20:00', isOpen: false }
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

