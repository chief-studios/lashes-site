import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PaystackButton } from 'react-paystack';
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
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [shouldTriggerPayment, setShouldTriggerPayment] = useState(false);
  const [timeSlotAvailable, setTimeSlotAvailable] = useState(null); // null = not checked, true = available, false = unavailable
  const bookingFormRef = useRef(null);
  const productsSectionRef = useRef(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);

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
      setTimeSlotAvailable(null); // Reset availability check when date/time changes
    }
  }, [formData.date, formData.time]);

  // Trigger payment when shouldTriggerPayment becomes true
  useEffect(() => {
    if (shouldTriggerPayment) {
      setShouldTriggerPayment(false);
      // The PaystackButton will automatically trigger since we're using the component directly
    }
  }, [shouldTriggerPayment]);

  const handleSelectProduct = (productName) => {
    const product = products.find(p => p.name === productName);
    setSelectedProductDetails(product);
    setFormData(prev => ({ ...prev, product: productName }));
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
    setTimeSlotAvailable(null); // Reset availability check when any field changes
  };

  const handleColorChange = (e) => {
    const color = e.target.value;
    setSelectedColor(color);

    if (color) {
      const colorComment = `Color: ${color.charAt(0).toUpperCase() + color.slice(1)}`;
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

  // Calculate amount in pesewas (Paystack uses smallest currency unit)
  const getPaymentAmount = () => {
    if (!selectedProductDetails || !selectedProductDetails.price) return 0;
    const price = typeof selectedProductDetails.price === 'number'
      ? selectedProductDetails.price
      : parseFloat(selectedProductDetails.price) || 0;
    return price * 100; // Convert to pesewas (for GHS)
  };

  // Paystack success callback - this is where we submit the booking after successful payment
  const handlePaystackSuccess = async (reference) => {
    setPaymentProcessing(true);
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
          comments: formData.comments,
          paymentReference: reference.reference,
          amount: getPaymentAmount() / 100, // Convert back to cedis
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

      // Check if there's already a booking for this time slot
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

      // If available is false, it means the slot is taken
      if (!availabilityData.available) {
        setTimeSlotAvailable(false);
        setSubmitStatus({
          type: 'error',
          message: availabilityData.message || 'Time slot unavailable. Kindly choose another time slot.'
        });
        return false;
      }

      // If we get here, the time slot is available
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

    // Form validation
    if (!formData.name || !formData.phone || !formData.email || !formData.product || !formData.date || !formData.time) {
      setSubmitStatus({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }

    if (!selectedProductDetails) {
      setSubmitStatus({ type: 'error', message: 'Please select a product from the list above.' });
      return;
    }

    // Check time slot availability before payment
    const isAvailable = await checkTimeSlotAvailability();

    if (!isAvailable) {
      return; // Stop here if time slot is not available
    }

    // If time slot is available, proceed to payment
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
    text: paymentProcessing ? "Processing Payment..." : `Pay ₵${selectedProductDetails?.price || '0'} Now`,
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
      selectedProductDetails;
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
            const minkProducts = products.filter(p => p.type && p.type.toLowerCase().includes('mink'));
            const filteredMinkProducts = minkProducts.filter(p => p.poster !== 'yes');

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
            const sortedMainStyles = sortProductsByPrice([...mainStyles]);

            return (
              <>
                <button className="back-btn" onClick={() => { setSelectedGroup(null); scrollToSection(); }}>
                  ← Back to Categories
                </button>
                <h3 style={{ color: '#fff', marginBottom: '1rem', marginTop: '0.5rem' }}>{mapKeyToTitle[selectedGroup]}</h3>

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

            {/* Order Summary */}
            {selectedProductDetails && (
              <div className="order-summary">
                <h3>Order Summary</h3>
                <div className="summary-content">
                  <p><strong>Service:</strong> {selectedProductDetails.name}</p>
                  <p><strong>Price:</strong> ₵{selectedProductDetails.price}</p>
                  <p><strong>Duration:</strong> {selectedProductDetails.duration}</p>
                  {selectedColor && (
                    <p><strong>Color:</strong> {selectedColor.charAt(0).toUpperCase() + selectedColor.slice(1)}</p>
                  )}
                </div>
              </div>
            )}

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
                  readOnly
                />
              </div>

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

export default MinkLashes;