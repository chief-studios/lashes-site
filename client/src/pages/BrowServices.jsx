import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import OrderBar from '../components/OrderBar';
import BookingCheckoutModal from '../components/BookingCheckoutModal';
import PaymentSuccessModal from '../components/PaymentSuccessModal';
import InlineTip from '../components/InlineTip';
import WhatsAppInquiryBanner from '../components/WhatsAppInquiryBanner';
import { fetchAvailableSlotsForDate } from '../utils/timeSlots';
import { buildBookingDateTimeFields } from '../utils/bookingDateTime';
import { apiUrl } from '../config/api';
import { scrollPageToTopAfterPaint } from '../utils/scrollPageToTop';
import '../styles/base.css';
import '../styles/service-page.css';
import '../styles/booking.css';

const fallbackBrowServices = [
  {
    id: 'brow-1',
    name: 'Brow Shaping',
    description: 'Brow shaping is a semi-permanent dye application that tints the hair on your brows, making them appear darker, fuller, and more defined.',
    price: 30,
    duration: '10 minutes',
    image: '/images/brow-shaping.jpeg',
    type: 'brow'
  },
  {
    id: 'brow-2',
    name: 'Brow Lamination',
    description: 'Brow lamination is a semi-permanent dye application that tints the hair on your brows, making them appear darker, fuller, and more defined.',
    price: 100,
    duration: '30 minutes',
    image: '/images/brow-lamination.jpeg',
    type: 'brow'
  },
  {
    id: 'brow-3',
    name: 'Brow Tinting',
    description: 'Brow tinting is a semi-permanent dye application that tints the hair on your brows, making them appear darker, fuller, and more defined.',
    price: 100,
    duration: '10 minutes',
    image: '/images/brow-tinting.jpeg',
    type: 'brow'
  },
  {
    id: 'brow-4',
    name: 'Brow Combo',
    description: 'Brow tinting is a semi-permanent dye application that tints the hair on your brows, making them appear darker, fuller, and more defined.',
    price: 100,
    duration: '40 minutes',
    image: '/images/lamination-tinting.jpeg',
    type: 'brow'
  }
];

export default function BrowServices() {
  const navigate = useNavigate();
  const productsSectionRef = useRef(null);

  const [browServices, setBrowServices] = useState(fallbackBrowServices);
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
  const [checkoutReadyToPay, setCheckoutReadyToPay] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [timeSlotAvailable, setTimeSlotAvailable] = useState(null);
  const [submitStatus, setSubmitStatus] = useState({ type: '', message: '' });

  const [paystackPublicKey, setPaystackPublicKey] = useState('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    product: '',
    date: '',
    time: '',
    comments: ''
  });

  useEffect(() => {
    scrollPageToTopAfterPaint();
  }, []);

  // Fetch dynamic brow services from DB if available
  useEffect(() => {
    let isMounted = true;
    const fetchServices = async () => {
      try {
        const response = await fetch(apiUrl('/api/services'));
        if (response.ok) {
          const data = await response.json();
          if (isMounted && data.length > 0) {
            const mapped = data.map(s => ({
              id: s._id,
              name: s.name,
              description: s.description,
              price: s.price,
              duration: s.duration,
              image: (s.image.startsWith('http') || s.image.startsWith('data:') || s.image.startsWith('/'))
                ? s.image
                : `/images/${s.image}`,
              type: 'brow'
            }));
            setBrowServices(mapped);
          }
        }
      } catch (err) {
        console.warn('Could not fetch services from API, using fallback data:', err);
      }
    };
    fetchServices();
    return () => { isMounted = false; };
  }, []);

  // Fetch Paystack Key
  useEffect(() => {
    const loadPaystackKey = async () => {
      try {
        const response = await fetch(apiUrl('/api/paystack/public-key'));
        if (response.ok) {
          const data = await response.json();
          setPaystackPublicKey(data.publicKey || '');
        }
      } catch (error) {
        console.error('Paystack key fetch failed:', error);
      }
    };
    loadPaystackKey();
  }, []);

  // Fetch time slots when date changes
  useEffect(() => {
    let isMounted = true;
    if (formData.date) {
      fetchAvailableSlotsForDate(formData.date).then(slots => {
        if (isMounted) {
          setAvailableTimeSlots(slots);
          if (slots.length === 0) {
            setSubmitStatus({
              type: 'error',
              message: 'No available time slots for this date. Kindly choose another date.'
            });
          }
        }
      });
    } else {
      setAvailableTimeSlots([]);
    }
    return () => { isMounted = false; };
  }, [formData.date]);

  const handleSelectService = (serviceId) => {
    const service = browServices.find(s => s.id === serviceId);
    if (!service) return;

    if (selectedProductDetails?.id === serviceId) {
      setSelectedProductDetails(null);
      setFormData(prev => ({ ...prev, product: '' }));
    } else {
      setSelectedProductDetails(service);
      setFormData(prev => ({ ...prev, product: service.name }));
    }
    setCheckoutReadyToPay(false);
    setSubmitStatus({ type: '', message: '' });
  };

  const removeMainFromOrder = () => {
    setSelectedProductDetails(null);
    setFormData(prev => ({ ...prev, product: '' }));
    setCheckoutReadyToPay(false);
  };

  const openBookingModal = () => {
    if (!selectedProductDetails) return;
    setCheckoutReadyToPay(false);
    setSubmitStatus({ type: '', message: '' });
    setShowBookingModal(true);
  };

  const closeBookingModal = () => {
    setShowBookingModal(false);
    setCheckoutReadyToPay(false);
    setSubmitStatus({ type: '', message: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSubmitStatus({ type: '', message: '' });
    setTimeSlotAvailable(null);

    if (name === 'time' && value && formData.date) {
      const dateTimeFields = buildBookingDateTimeFields(formData.date, value);
      fetch(apiUrl('/api/bookings/check-booking-availability'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dateTimeFields)
      })
        .then(res => res.json())
        .then(data => {
          if (!data.available) {
            setTimeSlotAvailable(false);
            setSubmitStatus({
              type: 'error',
              message: data.message || 'This time slot is not available. Please select a different slot.'
            });
            setFormData(prev => ({ ...prev, time: '' }));
          } else {
            setTimeSlotAvailable(true);
          }
        })
        .catch(err => console.error('Error checking availability:', err));
    }
  };

  const getTotalPrice = () => {
    return selectedProductDetails ? selectedProductDetails.price : 0;
  };

  const getDepositAmount = () => {
    return getTotalPrice() * 0.4;
  };

  const canPayFromReview = () => {
    return Boolean(
      formData.name &&
      formData.phone &&
      formData.email &&
      formData.date &&
      formData.time &&
      selectedProductDetails &&
      paystackPublicKey
    );
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
    if (e && e.preventDefault) e.preventDefault();

    if (!formData.name || !formData.phone || !formData.email || !formData.date || !formData.time) {
      setSubmitStatus({
        type: 'error',
        message: 'Please fill in all required fields (Name, Phone, Email, Date, Time).'
      });
      return;
    }

    if (!selectedProductDetails) {
      setSubmitStatus({
        type: 'error',
        message: 'Please select a brow service.'
      });
      return;
    }

    const isAvailable = await checkTimeSlotAvailability();
    if (!isAvailable) return;

    setCheckoutReadyToPay(true);
    setSubmitStatus({
      type: 'success',
      message: 'Time slot verified! Please click "Pay Deposit" below to finalize your booking.'
    });
  };

  const handlePaystackSuccess = async (reference) => {
    setPaymentProcessing(true);
    setSubmitStatus({ type: '', message: '' });

    try {
      const dateTimeFields = buildBookingDateTimeFields(formData.date, formData.time);
      const serviceName = selectedProductDetails ? selectedProductDetails.name : 'Brow Service';
      const deposit = getDepositAmount();

      const response = await fetch(apiUrl('/api/bookings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          service: serviceName,
          ...dateTimeFields,
          comments: formData.comments,
          paymentReference: reference.reference,
          amount: deposit,
          amountPaid: deposit,
          totalAmount: getTotalPrice(),
          remainingAmount: Math.max(0, getTotalPrice() - deposit),
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
        setSelectedProductDetails(null);
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

  const paystackProps = {
    email: formData.email,
    amount: Math.round(getDepositAmount() * 100),
    currency: 'GHS',
    publicKey: paystackPublicKey,
    text: paymentProcessing ? 'Processing...' : `Pay Deposit (₵${getDepositAmount()})`,
    onSuccess: handlePaystackSuccess,
    onClose: handlePaystackClose,
  };

  const hasActiveOrder = Boolean(selectedProductDetails);

  return (
    <div className={`service-page${hasActiveOrder ? ' service-page--order-active' : ''}`}>
      <BookingCheckoutModal
        isOpen={showBookingModal}
        onClose={closeBookingModal}
        title="Book Your Brow Service"
        mainProduct={selectedProductDetails}
        extras={[]}
        totalPrice={getTotalPrice()}
        depositAmount={getDepositAmount()}
        onRemoveMain={removeMainFromOrder}
        formData={formData}
        onInputChange={handleInputChange}
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
        extras={[]}
        totalPrice={getTotalPrice()}
        depositAmount={getDepositAmount()}
        onProceed={openBookingModal}
        canProceed={Boolean(selectedProductDetails)}
      />
      <div className="service-container">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back to Services
        </button>

        <div className="page-header">
          <h1>Brow Services</h1>
          <p className="page-description">
            Professional brow shaping, lamination, and tinting to complement your features, define your arch, and frame your eyes with effortless elegance.
          </p>
        </div>

        <PaymentSuccessModal isOpen={showConfirmationPopup} />

        <div className="products-section" ref={productsSectionRef}>
          <h2>Available Services</h2>
          <InlineTip title="How to order">
            <ul>
              <li>Tap the brow service you'd like to book to add it to your Order Summary.</li>
              <li>Click 'Proceed to Book' to select your date, time slot, and enter your details.</li>
            </ul>
          </InlineTip>

          <div className="products-grid">
            {browServices.map(service => (
              <div
                key={service.id}
                className={`product-card ${selectedProductDetails?.id === service.id ? 'selected' : ''}`}
                onClick={() => handleSelectService(service.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectService(service.id);
                  }
                }}
              >
                <div className="product-image">
                  <img src={service.image} alt={service.name} />
                </div>
                <div className="product-info">
                  <h3>{service.name}</h3>
                  <p className="product-description">{service.description}</p>
                  <div className="product-details">
                    <span className="duration">{service.duration}</span>
                    <span className="price">₵{service.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <WhatsAppInquiryBanner
            customMessage="Hi! I am browsing Brow Services on your website and have a question about brow shaping, tinting, or lamination."
          />
        </div>
      </div>
    </div>
  );
}
