import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts'; // <-- IMPORTS BOTH STATIC & DB PRODUCTS
import { generateTimeSlots } from '../utils/timeSlots';
import { buildBookingDateTimeFields } from '../utils/bookingDateTime';
import { apiUrl } from '../config/api';
import { useServicePageScroll } from '../hooks/useServicePageScroll';
import { scrollElementBelowNav } from '../utils/scrollPageToTop';
import { getHowToOrderSteps } from '../utils/howToOrderSteps';
import { LASH_COLORS } from '../data/lashColors';
import InlineTip from '../components/InlineTip';
import OrderBar from '../components/OrderBar';
import BookingCheckoutModal from '../components/BookingCheckoutModal';
import ColorLashPicker from '../components/ColorLashPicker';
import PaymentSuccessModal from '../components/PaymentSuccessModal';
import CustomizedSetConsultModal from '../components/CustomizedSetConsultModal';
import customizedSetImage from '../images/anime image.jpeg';
import '../styles/base.css';
import '../styles/service-page.css';
import '../styles/home.css';
import '../styles/booking.css';

const MinkLashes = () => {
  const navigate = useNavigate();
  const { products } = useProducts(); // <-- COMBINED PRODUCTS ARRAY

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
  const [timeSlotAvailable, setTimeSlotAvailable] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [checkoutReadyToPay, setCheckoutReadyToPay] = useState(false);
  const productsSectionRef = useRef(null);
  const extrasRef = useRef(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedColor, setSelectedColor] = useState('');
  const colorPickerRef = useRef(null);
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
  const [showCustomizedSetModal, setShowCustomizedSetModal] = useState(false);

  useServicePageScroll(productsSectionRef, {
    selectedGroup,
    selectedProductId: selectedProductDetails?.id,
    extrasRef,
  });

  const [paystackPublicKey, setPaystackPublicKey] = useState('');
  const [paystackKeyError, setPaystackKeyError] = useState('');

  useEffect(() => {
    const loadPaystackKey = async () => {
      try {
        const response = await fetch(apiUrl('/api/paystack/public-key'));
        if (!response.ok) throw new Error('Unable to load payment configuration.');
        const data = await response.json();
        setPaystackPublicKey(data.publicKey || '');
      } catch (error) {
        console.error('Paystack key fetch failed:', error);
        setPaystackKeyError('Unable to initialize payment gateway. Please try again later.');
      }
    };

    loadPaystackKey();
  }, []);

  const refillPrices = {
    classic: 80,
    hybrid: 120,
    volume: 150,
    megaVolume: 170
  }

  const refillExtra = selectedGroup && refillPrices[selectedGroup] ? { id: 1001, name: "Refill", price: refillPrices[selectedGroup], extra: "yes" } : null;
  
  const additionalExtras = [
    { id: 1002, name: "Extra Length", price: 30, extra: "yes" },
    { id: 1003, name: "Removal", price: 50, extra: "yes" }
  ]

  const displayedAdditionalExtras = refillExtra
    ? [refillExtra, ...additionalExtras]
    : additionalExtras

  useEffect(() => {
    if (formData.date) {
      const slots = generateTimeSlots();
      setAvailableTimeSlots(slots);
    } else {
      setAvailableTimeSlots([]);
    }
  }, [formData.date]);

  useEffect(() => {
    if (formData.date || formData.time) {
      setSubmitStatus({ type: '', message: '' });
      setTimeSlotAvailable(null);
    }
  }, [formData.date, formData.time]);

  const handleSelectProduct = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    setSelectedProductDetails(product);
    setFormData(prev => ({ ...prev, product: product.name || '' }));
    setSelectedColor('');
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const removeMainFromOrder = () => {
    if (!selectedProductDetails) return;
    setSelectedProductDetails(null);
    setFormData(prev => ({ ...prev, product: '' }));
    setSelectedColor('');
    removeColorComment();
    setCheckoutReadyToPay(false);
  };

  const handleSelectExtra = (productId, isSelected) => {
    let product = products.find(p => p.id === productId);
    if (!product) {
      product = displayedAdditionalExtras.find(a => a.id === productId);
    }

    if (!product) return;

    if (isSelected) {
      if (selectedExtras.some(p => p.id === product.id)) return;
      setSelectedExtras(prev => [...prev, product]);
      if (isColorLashExtra(product?.name)) {
        requestAnimationFrame(() => scrollElementBelowNav(colorPickerRef.current));
      }
    } else {
      setSelectedExtras(prev => prev.filter(p => p.id !== productId));
      if (isColorLashExtra(product?.name)) {
        setSelectedColor('');
        removeColorComment();
      }
    }
    setCheckoutReadyToPay(false);
  };

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

  const isExtraSelected = (productId) => {
    return selectedExtras.some(extra => extra.id === productId);
  };

  const isColorLashExtra = (productName) => {
    return productName.toLowerCase().includes('color');
  };

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
    setCheckoutReadyToPay(false);
  };

  const handleColorChange = (e) => {
    const color = e.target.value;
    setSelectedColor(color);
    setCheckoutReadyToPay(false);

    if (color) {
      const colorComment = `Color: ${LASH_COLORS.find(c => c.value === color)?.label}`;
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
      removeColorComment();
    }
  };

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

    return (total * 0.4) * 100;
  };

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

  const handlePaystackSuccess = async (reference) => {
    setPaymentProcessing(true);
    setSubmitStatus({ type: '', message: '' });

    try {
      const dateTimeFields = buildBookingDateTimeFields(formData.date, formData.time);
      let comments = formData.comments;

      if (selectedExtras.length > 0) {
        const extraNames = selectedExtras.map(extra => extra.name).join(', ');
        const extrasComment = `Extras: ${extraNames}`;

        if (comments && !comments.includes('Extras:')) {
          comments = comments + '\n' + extrasComment;
        } else if (!comments) {
          comments = extrasComment;
        }
      }

      let service = 'Mink Lashes';
      if (selectedProductDetails && selectedProductDetails.type) {
        const typeParts = selectedProductDetails.type.toLowerCase().split(' ');
        const lashType = typeParts.slice(1).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        service = `Mink ${lashType} ${formData.product}`.trim();
      } else if (formData.product) {
        service = `Mink Lashes ${formData.product}`;
      }

      const response = await fetch(apiUrl('/api/bookings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          service: service,
          ...dateTimeFields,
          comments: comments,
          paymentReference: reference.reference,
          amount: getPaymentAmount() / 100,
          amountPaid: getPaymentAmount() / 100,
          totalAmount: getTotalPrice(),
          remainingAmount: Math.max(0, getTotalPrice() - (getPaymentAmount() / 100)),
          paymentStatus: 'completed',
          currency: 'GHS'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShowBookingModal(false);
        setCheckoutReadyToPay(false);
        setShowConfirmationPopup(true);

        setFormData({ name: '', phone: '', email: '', product: '', date: '', time: '', comments: '' });
        setSelectedColor('');
        setSelectedProductDetails(null);
        setSelectedExtras([]);
        setAvailableTimeSlots([]);
        setTimeSlotAvailable(null);

        setTimeout(() => {
          setShowConfirmationPopup(false);
          navigate('/');
        }, 6500);
      } else {
        setSubmitStatus({
          type: 'error',
          message: `Payment successful but booking failed: ${data.message || data.error || 'Please contact us with your payment reference.'}`
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

  const handlePaystackClose = () => {
    setSubmitStatus({
      type: 'info',
      message: 'Payment was not completed. You can try again when ready.'
    });
  };

  const checkTimeSlotAvailability = async () => {
    try {
      setCheckingAvailability(true);
      setSubmitStatus({ type: '', message: '' });

      const dateTimeFields = buildBookingDateTimeFields(formData.date, formData.time);

      const checkResponse = await fetch(apiUrl('/api/bookings/check-booking-availability'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dateTimeFields)
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

    if (!paystackPublicKey) {
      setSubmitStatus({ type: 'error', message: 'Payment gateway unavailable. Please try again later.' });
      return;
    }

    if (hasColorLashExtra() && !selectedColor) {
      setSubmitStatus({ type: 'error', message: 'Please select a color for your color lashes extra.' });
      return;
    }

    const isAvailable = await checkTimeSlotAvailability();

    if (!isAvailable) {
      return;
    }

    setCheckoutReadyToPay(true);
  };

  const closeBookingModal = () => {
    setShowBookingModal(false);
    setCheckoutReadyToPay(false);
  };

  const openBookingModal = () => {
    setCheckoutReadyToPay(false);
    setSubmitStatus({ type: '', message: '' });
    setShowBookingModal(true);
  };

  const hasActiveOrder = Boolean(selectedProductDetails) || selectedExtras.length > 0;

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
        { display_name: "Service", variable_name: "service", value: formData.product },
        { display_name: "Booking Date", variable_name: "booking_date", value: formData.date }
      ]
    },
    publicKey: paystackPublicKey,
    text: paymentProcessing ? "Processing Payment..." : `Pay ₵${(getTotalPrice() * 0.4).toFixed(2)} Now`,
    onSuccess: (reference) => handlePaystackSuccess(reference),
    onClose: handlePaystackClose,
  };

  const isFormValid = () => {
    return formData.name && formData.phone && formData.email && formData.product && formData.date && formData.time && selectedProductDetails && (!hasColorLashExtra() || selectedColor) && !!paystackPublicKey;
  };

  const canPayFromReview = () => {
    return Boolean(selectedProductDetails) && (!hasColorLashExtra() || selectedColor) && !!paystackPublicKey;
  };

  const sortProductsByPrice = (productsArray) => {
    return productsArray.sort((a, b) => {
      const priceA = typeof a.price === 'number' ? a.price : parseFloat(a.price) || 0;
      const priceB = typeof b.price === 'number' ? b.price : parseFloat(b.price) || 0;
      return priceA - priceB;
    });
  };

  return (
    <div className={`service-page${hasActiveOrder ? ' service-page--order-active' : ''}`}>
      <BookingCheckoutModal
        isOpen={showBookingModal}
        onClose={closeBookingModal}
        title="Book Your Mink Lashes"
        mainProduct={selectedProductDetails}
        extras={selectedExtras}
        colorLabel={hasColorLashExtra() && selectedColor ? LASH_COLORS.find(c => c.value === selectedColor)?.label : null}
        totalPrice={getTotalPrice()}
        depositAmount={getTotalPrice() * 0.4}
        onRemoveMain={removeMainFromOrder}
        onRemoveExtra={(id) => handleSelectExtra(id, false)}
        formData={formData}
        onInputChange={handleInputChange}
        selectedColor={selectedColor}
        onColorChange={handleColorChange}
        hasColorLashExtra={hasColorLashExtra}
        availableColors={LASH_COLORS}
        availableTimeSlots={availableTimeSlots}
        onSubmit={handleSubmit}
        submitStatus={submitStatus}
        checkingAvailability={checkingAvailability}
        readyToPay={checkoutReadyToPay}
        paystackProps={paystackProps}
        paymentProcessing={paymentProcessing}
        canPay={canPayFromReview()}
      />
      <OrderBar
        mainProduct={selectedProductDetails}
        extras={selectedExtras}
        totalPrice={getTotalPrice()}
        depositAmount={getTotalPrice() * 0.4}
        onProceed={openBookingModal}
        canProceed={Boolean(selectedProductDetails)}
        colorLabel={hasColorLashExtra() && selectedColor ? LASH_COLORS.find((c) => c.value === selectedColor)?.label : null}
      />
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

        <PaymentSuccessModal isOpen={showConfirmationPopup} />
        <CustomizedSetConsultModal
          isOpen={showCustomizedSetModal}
          onClose={() => setShowCustomizedSetModal(false)}
        />
        {false && showConfirmationPopup && (
          <div className="modal-overlay" style={{ zIndex: 1000 }}>
            <div className="modal-content" style={{ maxWidth: '420px', textAlign: 'center', color: '#fff', background: 'rgba(0,0,0,0.7)' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>Payment Successful</h3>
              <p style={{ margin: '0.5rem 0 0', fontSize: '1rem', color: '#fff' }}>Payment completed and booking confirmed.</p>
              <p style={{ fontWeight: 600, marginTop: '0.5rem', fontSize: '0.95rem', color: '#fff' }}>Late arrivals attract an extra fee of GHS 30.</p>
            </div>
          </div>
        )}

        <div className="products-section" ref={productsSectionRef}>
          <h2>Available Styles</h2>
          <InlineTip title="How to order">
            <ul>
              {getHowToOrderSteps(selectedGroup, selectedProductDetails).map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </InlineTip>
          {(() => {
            // Filters the combined (static + dynamic) products array
            const minkProducts = products.filter(p => p.type && p.type.toLowerCase().includes('mink'));
            const filteredMinkProducts = minkProducts.filter(p => p.poster !== 'yes');

            const groups = {
              classic: filteredMinkProducts.filter(p => p.type === 'mink classic'),
              hybrid: filteredMinkProducts.filter(p => p.type === 'mink hybrid'),
              volume: filteredMinkProducts.filter(p => p.type === 'mink volume'),
              megaVolume: filteredMinkProducts.filter(p => p.type === 'mink mega volume'),
            };

            const separateStylesAndExtras = (items) => {
              const mainStyles = items.filter(p => p.extra !== 'yes');
              const extras = items.filter(p => p.extra === 'yes');
              return { mainStyles, extras };
            };

            const scrollToSection = () => {
              scrollElementBelowNav(productsSectionRef.current, 'smooth');
            };

            if (!selectedGroup) {
              const styleSections = [
                { key: 'classic', title: 'Classic', items: groups.classic },
                { key: 'hybrid', title: 'Hybrid', items: groups.hybrid },
                { key: 'volume', title: 'Volume', items: groups.volume },
                { key: 'megaVolume', title: 'Mega Volume', items: groups.megaVolume },
              ];
              const customizedSection = {
                key: 'customized',
                title: 'Customized Set',
                consultationOnly: true,
                coverImage: customizedSetImage,
                details: 'Consultation included',
              };

              const selectGroup = (key) => {
                setSelectedGroup(key);
              };

              const openCustomizedModal = () => {
                setShowCustomizedSetModal(true);
                if (document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur();
                }
              };

              return (
                <div className="service-cards-container">
                  {styleSections.filter(s => s.items.length > 0).map(section => {
                    const { mainStyles } = separateStylesAndExtras(section.items);
                    const posterItem = minkProducts.find(p => p.type === `mink ${section.key}` && p.poster === 'yes');
                    const coverImage = posterItem?.image || mainStyles[0]?.image || section.items[0]?.image;

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
                          <img src={coverImage} alt={`${section.title} placeholder`} />
                        </div>
                        <div className="service-info">
                          <h3>{section.title}</h3>
                          <p className="service-details">{mainStyles.length} styles available</p>
                        </div>
                      </div>
                    );
                  })}
                  <div
                    key={customizedSection.key}
                    className="service-card service-card--consultation"
                    onClick={openCustomizedModal}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openCustomizedModal();
                      }
                    }}
                  >
                    <div className="service-image">
                      <img src={customizedSection.coverImage} alt="Customized Set" />
                    </div>
                    <div className="service-info">
                      <h3>{customizedSection.title} (₵300)</h3>
                      <p className="service-details">{customizedSection.details} (₵50)</p>
                    </div>
                  </div>
                </div>
              );
            }

            const mapKeyToTitle = { classic: 'Classic', hybrid: 'Hybrid', volume: 'Volume', megaVolume: 'Mega Volume' };
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
                            className={`product-card ${selectedProductDetails?.id === product.id ? 'selected' : ''}`}
                            onClick={() => handleSelectProduct(product.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectProduct(product.id); } }}
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

                {(extras.length > 0 || displayedAdditionalExtras.length > 0) && (
                  <div ref={extrasRef} className="extras-section">
                    <h4 style={{ color: '#ff66b2', marginBottom: '1rem', marginTop: '2rem', fontSize: '1.5rem', fontWeight: '700' }}>Optional Extras</h4>
                    <p style={{ color: '#ccc', marginBottom: '1rem' }}>Select any extras you'd like to add to your main style</p>
                    <InlineTip title="Tip">
                      Extras are optional—tap to add, tap again to remove. Your summary updates automatically.
                    </InlineTip>

                    {extras.length > 0 && (
                      <div className="products-grid">
                        {extras
                          .filter(p => p.poster !== 'yes')
                          .map(product => (
                            <div
                              key={product.id}
                              className={`product-card extra-card ${isExtraSelected(product.id) ? 'selected' : ''}`}
                              onClick={() => handleSelectExtra(product.id, !isExtraSelected(product.id))}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectExtra(product.id, !isExtraSelected(product.id)); } }}
                            >
                              <div className="product-image">
                                <img src={product.image} alt={product.name} />
                                <div className="extra-checkbox">
                                  <input
                                    type="checkbox"
                                    checked={isExtraSelected(product.id)}
                                    onChange={(e) => handleSelectExtra(product.id, e.target.checked)}
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
                    )}

                    {hasColorLashExtra() && (
                      <div ref={colorPickerRef}>
                        <ColorLashPicker
                          id="mink-lash-color"
                          selectedColor={selectedColor}
                          onChange={handleColorChange}
                          colors={LASH_COLORS}
                        />
                      </div>
                    )}

                    {displayedAdditionalExtras.length > 0 && (
                      <>
                        <h5 style={{ color: '#fff', marginTop: '1.5rem' }}>Other Extras</h5>
                        <div className="plain-extras-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                          {displayedAdditionalExtras.map(extra => (
                            <label key={extra.id} className={`plain-extra ${isExtraSelected(extra.id) ? 'selected' : ''}`} style={{ color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                              <input
                                type="checkbox"
                                checked={isExtraSelected(extra.id)}
                                onChange={(e) => handleSelectExtra(extra.id, e.target.checked)}
                                style={{ marginRight: '0.6rem' }}
                              />
                              <span>{extra.name} - ₵{extra.price}</span>
                            </label>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default MinkLashes;