const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: String, required: true },
    image: { type: String, required: true }, // Filename only, e.g., 'mega volume.jpg'
})

module.exports = mongoose.model('Service', serviceSchema);