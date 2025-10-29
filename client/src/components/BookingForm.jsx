import React, { useState } from 'react';
import '../styles.css';

const BookingForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        service: '',
        date: '',
        time: ''
    });

    const timeSlots = [
        '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
        '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
    ];

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Will connect to backend later
        console.log('Booking data:', formData);
        alert('Booking submitted! We will confirm your appointment soon.');

        // Reset form
        setFormData({
            name: '',
            phone: '',
            email: '',
            service: '',
            date: '',
            time: ''
        });
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
                    <option value="Classic Facial">Classic Facial</option>
                    <option value="Full Body Massage">Full Body Massage</option>
                    <option value="Manicure & Pedicure">Manicure & Pedicure</option>
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
                >
                    <option value="">Select a time</option>
                    {timeSlots.map(slot => (
                        <option key={slot} value={slot}>{slot}</option>
                    ))}
                </select>
            </div>

            <button type="submit" className="submit-btn">
                Book Appointment
            </button>
        </form>
    );
};

export default BookingForm;