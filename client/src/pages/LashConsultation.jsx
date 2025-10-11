import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
            <img src="https://images.unsplash.com/photo-1594736797933-d0c2b0b4b8b8?w=600&h=400&fit=crop&crop=center" alt="Lash Consultation" />
          </div>
          <div className="service-info">
            <h1>Lash Consultation</h1>
            <p className="service-description">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.
            </p>
            <div className="service-price">
              <span className="price-label">Price:</span>
              <span className="price-value">GHS 120</span>
            </div>
          </div>
        </div>

        <div className="booking-section">
          <h2>Book Your Lash Consultation</h2>
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
                placeholder="Any special requests or notes..."
              />
            </div>
            
            <button type="submit" className="submit-btn">
              Submit Booking
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LashConsultation;
