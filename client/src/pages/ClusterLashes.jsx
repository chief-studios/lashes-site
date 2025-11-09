import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { products } from '../data/products';
import '../styles.css';

const ClusterLashes = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    product: '',
    date: '',
    time: ''
  });
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });
  const bookingFormRef = useRef(null);
  const productsSectionRef = useRef(null);
  const [selectedGroup, setSelectedGroup] = useState(null); // 'classic' | 'hybrid' | 'volume' | null

  useEffect(() => {
    if (formData.date) {
      fetchAvailableTimeSlots();
    } else {
      setAvailableTimeSlots([]);
    }
  }, [formData.date]);

  const fetchAvailableTimeSlots = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/time-slots/available?date=${formData.date}`);
      if (response.ok) {
        const data = await response.json();
        const formattedSlots = data.map(slot => {
          const timeStr = slot.time;
          const [hours, minutes] = timeStr.split(':');
          const hour = parseInt(hours);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour % 12 || 12;
          return {
            value: timeStr,
            display: `${displayHour}:${minutes} ${ampm}`
          };
        });
        setAvailableTimeSlots(formattedSlots);
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);
      setAvailableTimeSlots([]);
    }
  };

  const handleSelectProduct = (productName) => {
    setFormData(prev => ({ ...prev, product: productName }));
    // Smooth scroll to the booking form
    if (bookingFormRef.current) {
      bookingFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
          service: formData.product || 'Cluster Lashes',
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
          product: '',
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
        
        <div className="page-header">
          <h1>Cluster Lashes</h1>
          <p className="page-description">
            Cluster lashes are gentle on the eyes, easy to remove, and last for one to two weeks. Perfect for special occasions or those who want a temporary lash enhancement.
          </p>
        </div>

        <div className="products-section" ref={productsSectionRef}>
          <h2>Available Styles</h2>
          {(() => {
            const clusterProducts = products.filter(p => (p.category || '').toLowerCase().includes('cluster'));
            const matches = (key) => (item) =>
              (item.name || '').toLowerCase().includes(key) || (item.description || '').toLowerCase().includes(key);
            const groups = {
              classic: clusterProducts.filter(matches('classic')),
              hybrid: clusterProducts.filter(matches('hybrid')),
              volume: clusterProducts.filter(matches('volume')),
            };

            const scrollToSection = () => {
              if (productsSectionRef.current) {
                productsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            };

            if (!selectedGroup) {
              const sections = [
                { key: 'classic', title: 'Classic', items: groups.classic },
                { key: 'volume', title: 'Volume', items: groups.volume },
                { key: 'hybrid', title: 'Hybrid', items: groups.hybrid },
              ];
              const placeholderFor = (key, items) => {
                if (key === 'hybrid') {
                  const lower = (s) => (s || '').toLowerCase();
                  const by = (substr) => items.find(p => lower(p.name).includes(substr));
                  const preferred = by('wispy') || by('cat eye') || items.find(p => lower(p.name) === 'cluster hybrid') || items[0];
                  return preferred?.image;
                }
                return items[0]?.image;
              };
              const selectGroup = (key) => {
                // Only change the view to show the group's products; do not scroll to form
                setSelectedGroup(key);
              };

              return (
                <div className="service-cards-container">
                  {sections.filter(s => s.items.length > 0).map(section => (
                    <div
                      key={section.key}
                      className="service-card"
                      onClick={() => { selectGroup(section.key); }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectGroup(section.key); } }}
                    >
                      <div className="service-image">
                        <img src={placeholderFor(section.key, section.items)} alt={`${section.title} placeholder`} />
                      </div>
                      <div className="service-info">
                        <h3>{section.title}</h3>
                        <p className="service-details">{section.items.length} styles available</p>
                      </div>
                    </div>
                  ))}
                </div>
              );
            }

            const mapKeyToTitle = { classic: 'Classic', hybrid: 'Hybrid', volume: 'Volume' };
            const items = groups[selectedGroup] || [];
            return (
              <>
                <button className="back-btn" onClick={() => { setSelectedGroup(null); scrollToSection(); }}>
                  ← Back to Categories
                </button>
                <h3 style={{color: '#fff', marginBottom: '1rem', marginTop: '0.5rem'}}>{mapKeyToTitle[selectedGroup]}</h3>
                <div className="products-grid">
                  {items.map(product => (
                    <div
                      key={product.id}
                      className="product-card"
                      onClick={() => handleSelectProduct(product.name)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectProduct(product.name); } }}
                    >
                      <div className="product-image">
                        <img src={product.image} alt={product.name} />
                      </div>
                      <div className="product-info">
                        <h3>{product.name}</h3>
                        <p className="product-description">{product.description}</p>
                        <div className="product-details">
                          <span className="duration">{product.duration}</span>
                          <span className="price">₵{product.price}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>

        {selectedGroup && (
        <div className="booking-section" ref={bookingFormRef}>
          <h2>Book Your Cluster Lashes</h2>
          <form className="booking-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="product">Selected Product</label>
              <input
                type="text"
                id="product"
                name="product"
                value={formData.product}
                onChange={(e) => setFormData(prev => ({ ...prev, product: e.target.value }))}
                placeholder="Choose a product above or enter here"
              />
            </div>
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
                disabled={!formData.date || availableTimeSlots.length === 0}
              >
                <option value="">
                  {!formData.date 
                    ? 'Please select a date first' 
                    : availableTimeSlots.length === 0 
                      ? 'No available slots for this date' 
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
              {loading ? 'Submitting...' : 'Submit Booking'}
            </button>
          </form>
        </div>
        )}
      </div>
    </div>
  );
};

export default ClusterLashes;
