const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: String, required: true },
    image: { type: String, required: true }, // Filename only, e.g., 'mega volume.jpg'
    type: { type: String, required: true }, // e.g., 'cluster mega volume', 'mink classic'
    extra: { type: String, enum: ['yes', 'no'], default: 'no' },
    poster: { type: String, enum: ['yes', 'no'], default: 'no' }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);