import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { products } from '../data/products';
import { generateTimeSlots } from '../utils/timeSlots';
import '../styles/base.css';
import '../styles/service-page.css';
import '../styles/home.css';
import '../styles/booking.css';

const MinkLashes = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    product: '',
    date: '',
    time: '',
    comments: ''
  });
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });
  const bookingFormRef = useRef(null);
  const productsSectionRef = useRef(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedColor, setSelectedColor] = useState(''); // NEW: Separate state for color selection

  // NEW: Available colors for color lashes
  const availableColors = [
    { value: 'pink', label: 'Pink' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' },
    { value: 'purple', label: 'Purple' }
  ];

  useEffect(() => {
    if (formData.date) {
      const slots = generateTimeSlots();
      setAvailableTimeSlots(slots);
    } else {
      setAvailableTimeSlots([]);
    }
  }, [formData.date]);

  const handleSelectProduct = (productName) => {
    setFormData(prev => ({ ...prev, product: productName }));

    // NEW: Reset color selection when a new product is selected
    setSelectedColor('');

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

  // NEW: Handle color selection
  const handleColorChange = (e) => {
    const color = e.target.value;
    setSelectedColor(color);

    // Update comments to include the selected color
    if (color) {
      const colorComment = `Color: ${color.charAt(0).toUpperCase() + color.slice(1)}`;

      // Check if there's already a color comment and replace it, or add it to existing comments
      const existingComments = formData.comments;
      const colorRegex = /Color:\s*\w+/i;

      if (colorRegex.test(existingComments)) {
        // Replace existing color comment
        setFormData(prev => ({
          ...prev,
          comments: existingComments.replace(colorRegex, colorComment)
        }));
      } else {
        // Add new color comment to existing comments
        const separator = existingComments ? '\n' : '';
        setFormData(prev => ({
          ...prev,
          comments: existingComments + separator + colorComment
        }));
      }
    } else {
      // Remove color comment if no color is selected
      const existingComments = formData.comments;
      const colorRegex = /Color:\s*\w+/i;

      if (colorRegex.test(existingComments)) {
        setFormData(prev => ({
          ...prev,
          comments: existingComments.replace(colorRegex, '').trim()
        }));
      }
    }
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
          service: formData.product || 'Mink Lashes',
          bookingTime: bookingDateTime.toISOString(),
          comments: formData.comments
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
          time: '',
          comments: ''
        });
        setSelectedColor(''); // NEW: Reset color selection
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

  // Helper function to sort products by price in ascending order
  const sortProductsByPrice = (productsArray) => {
    return productsArray.sort((a, b) => {
      // Convert prices to numbers for proper comparison
      const priceA = typeof a.price === 'number' ? a.price : parseFloat(a.price) || 0;
      const priceB = typeof b.price === 'number' ? b.price : parseFloat(b.price) || 0;
      return priceA - priceB;
    });
  };

  // NEW: Check if selected product is a color lash product
  const isColorLashProduct = formData.product.toLowerCase().includes('color');

  return (
    <div className="service-page">
      <div className="service-container">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back to Services
        </button>

        <div className="page-header">
          <h1>Mink Lashes</h1>
          <p className="page-description">
            Mink lashes last for three to six weeks and provide a luxurious, long-lasting look. Made from premium materials for the most natural and comfortable feel.
          </p>
        </div>

        <div className="products-section" ref={productsSectionRef}>
          <h2>Available Styles</h2>
          {(() => {
            // Filter mink products by type property
            const minkProducts = products.filter(p => p.type && p.type.toLowerCase().includes('mink'));

            // Exclude products marked as posters
            const filteredMinkProducts = minkProducts.filter(p => p.poster !== 'yes');

            // Group by type property and separate main styles from extras
            const groups = {
              classic: filteredMinkProducts.filter(p => p.type === 'mink classic'),
              hybrid: filteredMinkProducts.filter(p => p.type === 'mink hybrid'),
              volume: filteredMinkProducts.filter(p => p.type === 'mink volume'),
            };

            const separateStylesAndExtras = (items) => {
              const mainStyles = items.filter(p => p.extra !== 'yes');
              const extras = items.filter(p => p.extra === 'yes');
              return { mainStyles, extras };
            };

            const scrollToSection = () => {
              if (productsSectionRef.current) {
                productsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            };

            if (!selectedGroup) {
              const sections = [
                { key: 'classic', title: 'Classic', items: groups.classic },
                { key: 'hybrid', title: 'Hybrid', items: groups.hybrid },
                { key: 'volume', title: 'Volume', items: groups.volume },
              ];
              const selectGroup = (key) => {
                setSelectedGroup(key);
              };

              return (
                <div className="service-cards-container">
                  {sections.filter(s => s.items.length > 0).map(section => {
                    const { mainStyles } = separateStylesAndExtras(section.items);
                    return (
                      <div
                        key={section.key}
                        className="service-card"
                        onClick={() => { selectGroup(section.key); }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectGroup(section.key); } }}
                      >
                        <div className="service-image">
                          <img src={mainStyles[0]?.image || section.items[0]?.image} alt={`${section.title} placeholder`} />
                        </div>
                        <div className="service-info">
                          <h3>{section.title}</h3>
                          <p className="service-details">{mainStyles.length} styles available</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }

            const mapKeyToTitle = { classic: 'Classic', hybrid: 'Hybrid', volume: 'Volume' };
            const items = groups[selectedGroup] || [];
            const { mainStyles, extras } = separateStylesAndExtras(items);

            // Sort main styles by price in ascending order
            const sortedMainStyles = sortProductsByPrice([...mainStyles]);

            return (
              <>
                <button className="back-btn" onClick={() => { setSelectedGroup(null); scrollToSection(); }}>
                  ← Back to Categories
                </button>
                <h3 style={{ color: '#fff', marginBottom: '1rem', marginTop: '0.5rem' }}>{mapKeyToTitle[selectedGroup]}</h3>

                {/* Main Styles - Now sorted by price */}
                {sortedMainStyles.length > 0 && (
                  <>
                    <h4 style={{ color: '#fff', marginBottom: '1rem', marginTop: '0.5rem', fontSize: '1.2rem' }}></h4>
                    <div className="products-grid">
                      {sortedMainStyles
                        .filter(p => p.poster !== 'yes')
                        .map(product => (
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
                )}

                {/* Extras - You can also sort these by price if desired */}
                {extras.length > 0 && (
                  <>
                    <h4 style={{ color: '#fff', marginBottom: '1rem', marginTop: '2rem', fontSize: '1.2rem' }}>Extras</h4>
                    <div className="products-grid">
                      {extras
                        .filter(p => p.poster !== 'yes')
                        .map(product => (
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
                )}
              </>
            );
          })()}
        </div>

        {selectedGroup && (
          <div className="booking-section" ref={bookingFormRef}>
            <h2>Book Your Mink Lashes</h2>
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

              {/* NEW: Color selection dropdown for color lash products */}
              {isColorLashProduct && (
                <div className="form-group">
                  <label htmlFor="color">Select Color *</label>
                  <select
                    id="color"
                    name="color"
                    value={selectedColor}
                    onChange={handleColorChange}
                    required
                  >
                    <option value="">Choose a color</option>
                    {availableColors.map((color, index) => (
                      <option key={index} value={color.value}>
                        {color.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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

              <div className="form-row">
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
              </div>

              {/* Comments field */}
              <div className="form-group">
                <label htmlFor="comments">Additional Comments (Optional)</label>
                <textarea
                  id="comments"
                  name="comments"
                  value={formData.comments}
                  onChange={handleInputChange}
                  placeholder="Any special requests, allergies, or additional information you'd like us to know..."
                  rows="4"
                />
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

export default MinkLashes;