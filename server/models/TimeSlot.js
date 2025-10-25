const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient querying
timeSlotSchema.index({ date: 1, time: 1 });
timeSlotSchema.index({ isAvailable: 1 });

module.exports = mongoose.model('TimeSlot', timeSlotSchema);
