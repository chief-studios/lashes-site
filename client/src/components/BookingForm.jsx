import React, { useState, useEffect } from 'react';
import { products } from '../data/products';
import { generateTimeSlots } from '../utils/timeSlots';
import '../styles/base.css';
import '../styles/booking.css';

const BookingForm = ({ selectedProduct = null }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        service: selectedProduct?.name || '',
        date: '',
        time: ''
    });
    const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });

    useEffect(() => {
        if (selectedProduct) {
            setFormData(prev => ({ ...prev, service: selectedProduct.name }));
        }
    }, [selectedProduct]);

    useEffect(() => {
        if (formData.date) {
            // Generate time slots on the frontend
            const slots = generateTimeSlots();
            setAvailableTimeSlots(slots);
        } else {
            setAvailableTimeSlots([]);
        }
    }, [formData.date]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setSubmitStatus({ type: '', message: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSubmitStatus({ type: '', message: '' });

        try {
            // Combine date and time into a single datetime
            const [hours, minutes] = formData.time.split(':');
            const bookingDateTime = new Date(formData.date);
            bookingDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            const response = await fetch('https://lashes-site.onrender.com/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    phone: formData.phone,
                    email: formData.email,
                    service: formData.service,
                    bookingTime: bookingDateTime.toISOString()
                })
            });

            const data = await response.json();

            if (response.ok) {
                setSubmitStatus({ type: 'success', message: data.message || 'Booking submitted successfully! We will confirm your appointment soon.' });
                // Reset form
                setFormData({
                    name: '',
                    phone: '',
                    email: '',
                    service: selectedProduct?.name || '',
                    date: '',
                    time: ''
                });
                setAvailableTimeSlots([]);
            } else {
                setSubmitStatus({ type: 'error', message: data.message || 'Error submitting booking. Please try again.' });
            }
        } catch (error) {
            setSubmitStatus({ type: 'error', message: 'Network error. Please check your connection and try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="booking-form" onSubmit={handleSubmit}>
            <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="service">Service</label>
                <select
                    id="service"
                    name="service"
                    value={formData.service}
                    onChange={handleChange}
                    required
                >
                    <option value="">Select a service</option>
                    {products.map(product => (
                        <option key={product._id} value={product.name}>
                            {product.name} - ${product.price} ({product.duration})
                        </option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label htmlFor="date">Preferred Date</label>
                <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                />
            </div>

            <div className="form-group">
                <label htmlFor="time">Preferred Time</label>
                <select
                    id="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    required
                    disabled={!formData.date}
                >
                    <option value="">
                        {!formData.date 
                            ? 'Please select a date first' 
                            : 'Select a time'}
                    </option>
                    {availableTimeSlots.map((slot, index) => (
                        <option key={index} value={slot.value}>{slot.display}</option>
                    ))}
                </select>
            </div>

            {submitStatus.message && (
                <div className={`submit-message ${submitStatus.type}`}>
                    {submitStatus.message}
                </div>
            )}

            <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Submitting...' : 'Book Appointment'}
            </button>
        </form>
    );
};

export default BookingForm;
