import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import consultationImage from '../images/consultation.jpg';
import '../styles/ServicePage.css';

const LashConsultation = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    timeSlot: '',
    description: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Booking submitted:', { service: 'Lash Consultation', ...formData });
    alert('Booking submitted successfully! We will contact you soon.');
    navigate('/');
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
                <span className="feature-icon">✨</span>
                <span>Personalized Assessment</span>
              </div>
              <div className="feature">
                <span className="feature-icon">👁️</span>
                <span>Eye Shape Analysis</span>
              </div>
              <div className="feature">
                <span className="feature-icon">💄</span>
                <span>Style Recommendations</span>
              </div>
            </div>
          </div>
        </div>

        <div className="booking-section">
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
              <label htmlFor="timeSlot">Preferred Time Slot *</label>
              <select
                id="timeSlot"
                name="timeSlot"
                value={formData.timeSlot}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a time slot</option>
                <option value="9:00 AM">9:00 AM</option>
                <option value="10:00 AM">10:00 AM</option>
                <option value="11:00 AM">11:00 AM</option>
                <option value="12:00 PM">12:00 PM</option>
                <option value="1:00 PM">1:00 PM</option>
                <option value="2:00 PM">2:00 PM</option>
                <option value="3:00 PM">3:00 PM</option>
                <option value="4:00 PM">4:00 PM</option>
                <option value="5:00 PM">5:00 PM</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Additional Notes</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                placeholder="Any special requests, questions, or notes about your desired lash look..."
              />
            </div>
            
            <button type="submit" className="submit-btn btn btn-primary">
              Book Consultation
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LashConsultation;
