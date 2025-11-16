import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PaystackButton } from 'react-paystack';
import { products } from '../data/products';
import { generateTimeSlots } from '../utils/timeSlots';
import '../styles/base.css';
import '../styles/service-page.css';
import '../styles/home.css';
import '../styles/booking.css';

const ClusterLashes = () => {
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
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [shouldTriggerPayment, setShouldTriggerPayment] = useState(false);
  const [timeSlotAvailable, setTimeSlotAvailable] = useState(null);
  const bookingFormRef = useRef(null);
  const productsSectionRef = useRef(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState([]);

  // Paystack configuration
  const paystackPublicKey = "pk_test_687e1e97db3f1e8ce1b3f7b8bd3220169f57dff2";

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

  const handleSelectProduct = (productName) => {
    const product = products.find(p => p.name === productName);
    setSelectedProductDetails(product);
    setFormData(prev => ({ ...prev, product: productName }));
    setSelectedColor('');
  };

  // Handle extra selection
  const handleSelectExtra = (productName, isSelected) => {
    const product = products.find(p => p.name === productName);

    if (isSelected) {
      setSelectedExtras(prev => [...prev, product]);
    } else {
      setSelectedExtras(prev => prev.filter(p => p.name !== productName));
      // If color lashes extra is deselected, remove the color selection and comment
      if (isColorLashExtra(productName)) {
        setSelectedColor('');
        // Remove color comment from comments
        removeColorComment();
      }
    }
  };

  // NEW: Function to remove color comment from comments
  const removeColorComment = () => {
    const existingComments = formData.comments;
    const colorRegex = /Color:\s*\w+/i;

    if (colorRegex.test(existingComments)) {
      setFormData(prev => ({
        ...prev,
        comments: existingComments.replace(colorRegex, '').trim()
      }));
    }
  };

  // Check if an extra is selected
  const isExtraSelected = (productName) => {
    return selectedExtras.some(extra => extra.name === productName);
  };

  // NEW: Check if the selected extra is a color lash product
  const isColorLashExtra = (productName) => {
    return productName.toLowerCase().includes('color');
  };

  // NEW: Check if any selected extra is a color lash
  const hasColorLashExtra = () => {
    return selectedExtras.some(extra => isColorLashExtra(extra.name));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setSubmitStatus({ type: '', message: '' });
    setTimeSlotAvailable(null);
  };

  // UPDATED: Color change handler that adds to comments
  const handleColorChange = (e) => {
    const color = e.target.value;
    setSelectedColor(color);

    if (color) {
      const colorComment = `Color: ${availableColors.find(c => c.value === color)?.label}`;
      const existingComments = formData.comments;
      const colorRegex = /Color:\s*\w+/i;

      if (colorRegex.test(existingComments)) {
        setFormData(prev => ({
          ...prev,
          comments: existingComments.replace(colorRegex, colorComment)
        }));
      } else {
        const separator = existingComments ? '\n' : '';
        setFormData(prev => ({
          ...prev,
          comments: existingComments + separator + colorComment
        }));
      }
    } else {
      // Remove color comment if color is deselected
      removeColorComment();
    }
  };

  // Calculate total amount including extras
  const getPaymentAmount = () => {
    let total = 0;

    if (selectedProductDetails && selectedProductDetails.price) {
      const price = typeof selectedProductDetails.price === 'number'
        ? selectedProductDetails.price
        : parseFloat(selectedProductDetails.price) || 0;
      total += price;
    }

    selectedExtras.forEach(extra => {
      if (extra.price) {
        const price = typeof extra.price === 'number'
          ? extra.price
          : parseFloat(extra.price) || 0;
        total += price;
      }
    });

    return total * 100;
  };

  // Get total price for display
  const getTotalPrice = () => {
    let total = 0;

    if (selectedProductDetails && selectedProductDetails.price) {
      const price = typeof selectedProductDetails.price === 'number'
        ? selectedProductDetails.price
        : parseFloat(selectedProductDetails.price) || 0;
      total += price;
    }

    selectedExtras.forEach(extra => {
      if (extra.price) {
        const price = typeof extra.price === 'number'
          ? extra.price
          : parseFloat(extra.price) || 0;
        total += price;
      }
    });

    return total;
  };

  // Paystack success callback - updated to include extras in comments
  const handlePaystackSuccess = async (reference) => {
    setPaymentProcessing(true);
    setSubmitStatus({ type: '', message: '' });

    try {
      const [hours, minutes] = formData.time.split(':');
      const bookingDateTime = new Date(formData.date);
      bookingDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      let comments = formData.comments;

      // Build comments including extras
      if (selectedExtras.length > 0) {
        const extraNames = selectedExtras.map(extra => extra.name).join(', ');
        const extrasComment = `Extras: ${extraNames}`;

        // Combine existing comments with extras comment
        if (comments && !comments.includes('Extras:')) {
          comments = comments + '\n' + extrasComment;
        } else if (!comments) {
          comments = extrasComment;
        }
        // If comments already contain extras, we don't need to add them again
      }

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
          bookingTime: bookingDateTime.toISOString(),
          comments: comments,
          paymentReference: reference.reference,
          amount: getPaymentAmount() / 100,
          paymentStatus: 'completed',
          currency: 'GHS'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus({
          type: 'success',
          message: 'Payment successful! Booking confirmed. We will contact you soon.'
        });

        // Reset form
        setFormData({
          name: '',
          phone: '',
          email: '',
          product: '',
          date: '',
          time: '',
          comments: ''
        });
        setSelectedColor('');
        setSelectedProductDetails(null);
        setSelectedExtras([]);
        setAvailableTimeSlots([]);
        setTimeSlotAvailable(null);

        setTimeout(() => {
          navigate('/');
        }, 5000);
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

  // Check if time slot is available by querying existing bookings
  const checkTimeSlotAvailability = async () => {
    try {
      setCheckingAvailability(true);
      setSubmitStatus({ type: '', message: '' });

      const [hours, minutes] = formData.time.split(':');
      const bookingDateTime = new Date(formData.date);
      bookingDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const checkResponse = await fetch(`http://localhost:5000/api/bookings/check-booking-availability`, {
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

  // Modified handleSubmit to check time slot availability before payment
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus({ type: '', message: '' });

    if (!formData.name || !formData.phone || !formData.email || !formData.product || !formData.date || !formData.time) {
      setSubmitStatus({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }

    if (!selectedProductDetails) {
      setSubmitStatus({ type: 'error', message: 'Please select a main style from the list above.' });
      return;
    }

    // NEW: Check if color lashes extra is selected but no color is chosen
    if (hasColorLashExtra() && !selectedColor) {
      setSubmitStatus({ type: 'error', message: 'Please select a color for your color lashes extra.' });
      return;
    }

    const isAvailable = await checkTimeSlotAvailability();

    if (!isAvailable) {
      return;
    }

    setShouldTriggerPayment(true);
  };

  // Paystack component props with GHS currency
  const paystackProps = {
    email: formData.email,
    amount: getPaymentAmount(),
    currency: "GHS",
    metadata: {
      name: formData.name,
      phone: formData.phone,
      product: formData.product,
      bookingDate: formData.date,
      bookingTime: formData.time,
      custom_fields: [
        {
          display_name: "Service",
          variable_name: "service",
          value: formData.product
        },
        {
          display_name: "Booking Date",
          variable_name: "booking_date",
          value: formData.date
        }
      ]
    },
    publicKey: paystackPublicKey,
    text: paymentProcessing ? "Processing Payment..." : `Pay ₵${getTotalPrice()} Now`,
    onSuccess: (reference) => handlePaystackSuccess(reference),
    onClose: handlePaystackClose,
  };

  const isFormValid = () => {
    return formData.name &&
      formData.phone &&
      formData.email &&
      formData.product &&
      formData.date &&
      formData.time &&
      selectedProductDetails &&
      // NEW: Include color validation only if color lashes extra is selected
      (!hasColorLashExtra() || selectedColor);
  };

  const canProceedToPayment = () => {
    return isFormValid() && timeSlotAvailable === true;
  };

  const sortProductsByPrice = (productsArray) => {
    return productsArray.sort((a, b) => {
      const priceA = typeof a.price === 'number' ? a.price : parseFloat(a.price) || 0;
      const priceB = typeof b.price === 'number' ? b.price : parseFloat(b.price) || 0;
      return priceA - priceB;
    });
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
          <p>Kindly select any style and extra you prefer. It will automatically be added to your order summary. You can select another main style and it will automatically be changed in your order summary or select an already selected extra to deselect it if you no longer prefer that extra.</p>
          {(() => {
            const clusterProducts = products.filter(p => p.type && p.type.toLowerCase().includes('cluster'));
            const filteredClusterProducts = clusterProducts.filter(p => p.poster !== 'yes');

            const groups = {
              classic: filteredClusterProducts.filter(p => p.type === 'cluster classic'),
              hybrid: filteredClusterProducts.filter(p => p.type === 'cluster hybrid'),
              volume: filteredClusterProducts.filter(p => p.type === 'cluster volume'),
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
            const sortedMainStyles = sortProductsByPrice([...mainStyles]);

            return (
              <>
                <button className="back-btn" onClick={() => { setSelectedGroup(null); scrollToSection(); }}>
                  ← Back to Categories
                </button>
                <h3 style={{ color: '#fff', marginBottom: '1rem', marginTop: '0.5rem' }}>{mapKeyToTitle[selectedGroup]}</h3>

                {sortedMainStyles.length > 0 && (
                  <>
                    <h4 style={{ color: '#fff', marginBottom: '1rem', marginTop: '0.5rem', fontSize: '1.2rem' }}>Main Styles</h4>
                    <div className="products-grid">
                      {sortedMainStyles
                        .filter(p => p.poster !== 'yes')
                        .map(product => (
                          <div
                            key={product.id}
                            className={`product-card ${selectedProductDetails?.name === product.name ? 'selected' : ''}`}
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

                {extras.length > 0 && (
                  <>
                    <h4 style={{ color: '#fff', marginBottom: '1rem', marginTop: '2rem', fontSize: '1.2rem' }}>Optional Extras</h4>
                    <p style={{ color: '#ccc', marginBottom: '1rem' }}>Select any extras you'd like to add to your main style</p>
                    <div className="products-grid">
                      {extras
                        .filter(p => p.poster !== 'yes')
                        .map(product => (
                          <div
                            key={product.id}
                            className={`product-card extra-card ${isExtraSelected(product.name) ? 'selected' : ''}`}
                            onClick={() => handleSelectExtra(product.name, !isExtraSelected(product.name))}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectExtra(product.name, !isExtraSelected(product.name)); } }}
                          >
                            <div className="product-image">
                              <img src={product.image} alt={product.name} />
                              <div className="extra-checkbox">
                                <input
                                  type="checkbox"
                                  checked={isExtraSelected(product.name)}
                                  onChange={(e) => handleSelectExtra(product.name, e.target.checked)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            </div>
                            <div className="product-info">
                              <h3>{product.name}</h3>
                              <p className="product-description">{product.description}</p>
                              <div className="product-details">
                                <span className="duration">{product.duration}</span>
                                <span className="price">+₵{product.price}</span>
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
            <h2>Book Your Cluster Lashes</h2>

            {/* Order Summary - REMOVED color display */}
            {(selectedProductDetails || selectedExtras.length > 0) && (
              <div className="order-summary">
                <h3>Order Summary</h3>
                <div className="summary-content">
                  {selectedProductDetails && (
                    <>
                      <p><strong>Main Service:</strong> {selectedProductDetails.name}</p>
                      <p><strong>Base Price:</strong> ₵{selectedProductDetails.price}</p>
                      <p><strong>Duration:</strong> {selectedProductDetails.duration}</p>
                    </>
                  )}

                  {selectedExtras.length > 0 && (
                    <>
                      <p><strong>Extras:</strong></p>
                      <ul className="extras-list">
                        {selectedExtras.map((extra, index) => (
                          <li key={index}>
                            {extra.name} - +₵{extra.price}
                            {/* REMOVED: Color display from order summary */}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  <div className="total-section">
                    <p><strong>Total Price:</strong> ₵{getTotalPrice()}</p>
                  </div>
                </div>
              </div>
            )}

            <form className="booking-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="product">Selected Main Style *</label>
                <input
                  type="text"
                  id="product"
                  name="product"
                  value={formData.product}
                  onChange={(e) => setFormData(prev => ({ ...prev, product: e.target.value }))}
                  placeholder="Choose a main style above"
                  readOnly
                />
                {!selectedProductDetails && (
                  <small className="form-hint">Please select a main style from the options above</small>
                )}
              </div>

              {/* Color selection only shows when color lashes extra is selected */}
              {hasColorLashExtra() && (
                <div className="form-group">
                  <label htmlFor="color">Select Color for Color Lashes *</label>
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
                  <small className="form-hint">
                    Please select your preferred color for the color lashes extra
                  </small>
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
                <small className="form-hint">
                  {hasColorLashExtra() && selectedColor
                    ? `Color selection (${availableColors.find(c => c.value === selectedColor)?.label}) has been automatically added above.`
                    : 'Your color selection will appear here when you choose a color.'}
                </small>
              </div>
              {submitStatus.message && (
                <div className={`submit-message ${submitStatus.type}`}>
                  {submitStatus.message}
                </div>
              )}

              {/* Paystack Payment Button - only show when form is valid and time slot is available */}
              {canProceedToPayment() ? (
                <div className="payment-section">
                  <PaystackButton
                    {...paystackProps}
                    className={`paystack-button ${paymentProcessing ? 'processing' : ''}`}
                  />
                </div>
              ) : (
                <button type="submit" className="submit-btn" disabled={loading || checkingAvailability}>
                  {checkingAvailability ? 'Checking Availability...' : 'Proceed to Payment'}
                </button>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClusterLashes;