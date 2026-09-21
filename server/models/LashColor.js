const mongoose = require('mongoose');

const lashColorSchema = new mongoose.Schema({
    value: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    swatch: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('LashColor', lashColorSchema);
