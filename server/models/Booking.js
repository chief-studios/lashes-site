const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    service: {
        type: String,
        required: true
    },
    bookingTime: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled'],
        default: 'pending'
    },
    comments:{
        type: String,
    },
    amountPaid: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        default: 0
    },
    remainingAmount: {
        type: Number,
        default: 0
    },
    paymentReference: {
        type: String,
        trim: true
    },
    paymentStatus: {
        type: String,
        trim: true
    },
    currency: {
        type: String,
        trim: true,
        default: 'GHS'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient querying
bookingSchema.index({ bookingTime: 1 });
bookingSchema.index({ email: 1 });

module.exports = mongoose.model('Booking', bookingSchema);