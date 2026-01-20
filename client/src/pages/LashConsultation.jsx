import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PaystackButton } from 'react-paystack';
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
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [shouldTriggerPayment, setShouldTriggerPayment] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [timeSlotAvailable, setTimeSlotAvailable] = useState(null);

  // Consultation fee
  const CONSULTATION_FEE = 50;
  
  // Paystack configuration
  const paystackPublicKey = "pk_test_687e1e97db3f1e8ce1b3f7b8bd3220169f57dff2";

  useEffect(() => {
    if (formData.date) {
      // Generate time slots on the frontend
      const slots = generateTimeSlots();
      setAvailableTimeSlots(slots);
    } else {
      setAvailableTimeSlots([]);
    }
  }, [formData.date]);

  // Reset status when date or time changes
  useEffect(() => {
    if (formData.date || formData.time) {
      setSubmitStatus({ type: '', message: '' });
      setTimeSlotAvailable(null);
    }
  }, [formData.date, formData.time]);

  // Trigger payment when shouldTriggerPayment becomes true
  useEffect(() => {
    if (shouldTriggerPayment) {
      setShouldTriggerPayment(false);
    }
  }, [shouldTriggerPayment]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setSubmitStatus({ type: '', message: '' });
    setTimeSlotAvailable(null);
  };

  // Check if time slot is available
  const checkTimeSlotAvailability = async () => {
    try {
      setCheckingAvailability(true);
      setSubmitStatus({ type: '', message: '' });

      const [hours, minutes] = formData.time.split(':');
      const bookingDateTime = new Date(formData.date);
      bookingDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const checkResponse = await fetch(`https://lashes-site.onrender.com/api/bookings/check-booking-availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingTime: bookingDateTime.toISOString()
        })
      });

      if (!checkResponse.ok) {
        throw new Error('Failed to check booking availability');
      }

      const availabilityData = await checkResponse.json();

      if (!availabilityData.available) {
        setTimeSlotAvailable(false);
        setSubmitStatus({
          type: 'error',
          message: availabilityData.message || 'Time slot unavailable. Kindly choose another time slot.'
        });
        return false;
      }

      setTimeSlotAvailable(true);
      return true;

    } catch (error) {
      console.error('Time slot verification error:', error);
      setTimeSlotAvailable(false);
      setSubmitStatus({
        type: 'error',
        message: 'Error verifying time slot availability. Please try again.'
      });
      return false;
    } finally {
      setCheckingAvailability(false);
    }
  };

  // Paystack success callback
  const handlePaystackSuccess = async (reference) => {
    setPaymentProcessing(true);
    setSubmitStatus({ type: '', message: '' });

    try {
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
          service: 'Lash Consultation',
          bookingTime: bookingDateTime.toISOString(),
          paymentReference: reference.reference,
          amount: CONSULTATION_FEE,
          paymentStatus: 'completed',
          currency: 'GHS'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus({
          type: 'success',
          message: 'Payment successful! Consultation booking confirmed. We will contact you soon.'
        });

        // Reset form
        setFormData({
          name: '',
          phone: '',
          email: '',
          date: '',
          time: ''
        });
        setAvailableTimeSlots([]);
        setTimeSlotAvailable(null);

        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setSubmitStatus({
          type: 'error',
          message: `Payment successful but booking failed: ${data.message || 'Please contact us with your payment reference.'}`
        });
      }
    } catch (error) {
      setSubmitStatus({
        type: 'error',
        message: `Payment successful but booking failed. Please contact us with reference: ${reference.reference}`
      });
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Paystack close callback
  const handlePaystackClose = () => {
    setSubmitStatus({
      type: 'info',
      message: 'Payment was not completed. You can try again when ready.'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus({ type: '', message: '' });

    if (!formData.name || !formData.phone || !formData.email || !formData.date || !formData.time) {
      setSubmitStatus({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }

    const isAvailable = await checkTimeSlotAvailability();

    if (!isAvailable) {
      return;
    }

    setShouldTriggerPayment(true);
  };

  // Paystack component props
  const paystackProps = {
    email: formData.email,
    amount: CONSULTATION_FEE * 100,
    currency: "GHS",
    metadata: {
      name: formData.name,
      phone: formData.phone,
      service: 'Lash Consultation',
      bookingDate: formData.date,
      bookingTime: formData.time
    },
    publicKey: paystackPublicKey,
    text: paymentProcessing ? "Processing Payment..." : `Pay ₵${CONSULTATION_FEE} Now`,
    onSuccess: (reference) => handlePaystackSuccess(reference),
    onClose: handlePaystackClose,
  };

  const isFormValid = () => {
    return formData.name &&
      formData.phone &&
      formData.email &&
      formData.date &&
      formData.time;
  };

  const canProceedToPayment = () => {
    return isFormValid() && timeSlotAvailable === true;
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
            
            {canProceedToPayment() ? (
              <div className="payment-section">
                <PaystackButton
                  {...paystackProps}
                  className={`paystack-button ${paymentProcessing ? 'processing' : ''}`}
                />
              </div>
            ) : (
              <button type="submit" className="submit-btn btn btn-primary" disabled={loading || checkingAvailability}>
                {checkingAvailability ? 'Checking Availability...' : 'Proceed to Payment'}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default LashConsultation;
