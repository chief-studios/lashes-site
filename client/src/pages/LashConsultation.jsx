import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import consultationImage from '../images/consultation.jpg';
import { generateTimeSlots } from '../utils/timeSlots';
import '../styles/base.css';
import '../styles/service-page.css';
import '../styles/consultation.css';
import '../styles/booking.css';

const LashConsultation = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    date: '',
    time: ''
  });
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    if (formData.date) {
      // Generate time slots on the frontend
      const slots = generateTimeSlots();
      setAvailableTimeSlots(slots);
    } else {
      setAvailableTimeSlots([]);
    }
  }, [formData.date]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setSubmitStatus({ type: '', message: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitStatus({ type: '', message: '' });

    try {
      const [hours, minutes] = formData.time.split(':');
      const bookingDateTime = new Date(formData.date);
      bookingDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const response = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          service: 'Lash Consultation',
          bookingTime: bookingDateTime.toISOString()
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus({ type: 'success', message: data.message || 'Booking submitted successfully! We will confirm your appointment soon.' });
        setFormData({
          name: '',
          phone: '',
          email: '',
          date: '',
          time: ''
        });
        setAvailableTimeSlots([]);
        setTimeout(() => {
          navigate('/');
        }, 2000);
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
    <div className="service-page">
      <div className="service-container">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back to Services
        </button>
        
        <div className="service-header">
          <div className="service-image">
            <img src={consultationImage} alt="Lash Consultation" />
            <div className="service-overlay">
              <div className="service-badge">
                <span className="price">GHS 120</span>
                <span className="duration">60 mins</span>
              </div>
            </div>
          </div>
          <div className="service-info">
            <h1>Lash Consultation</h1>
            <p className="service-description">
              Professional consultation to determine the best lash style for your eyes and lifestyle. Our expert technicians will assess your natural lashes and recommend the perfect treatment for you.
            </p>
            <div className="service-features">
              <div className="feature">
                <span className="feature-icon"><i className="fa-solid fa-user-check" aria-hidden="true"></i></span>
                <span>Personalized Assessment</span>
              </div>
              <div className="feature">
                <span className="feature-icon"><i className="fa-solid fa-eye" aria-hidden="true"></i></span>
                <span>Eye Shape Analysis</span>
              </div>
              <div className="feature">
                <span className="feature-icon"><i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i></span>
                <span>Style Recommendations</span>
              </div>
            </div>
          </div>
        </div>

        <div className="booking-section consultation-booking">
          <h2>Book Your Lash Consultation</h2>
          <p className="booking-subtitle">
            Let's find your perfect lash look. We'll respond within 24 hours.
          </p>
          <form className="booking-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Enter your email address"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="date">Preferred Date *</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-group">
              <label htmlFor="time">Preferred Time *</label>
              <select
                id="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
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
            
            <button type="submit" className="submit-btn btn btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Book Consultation'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LashConsultation;
