import React from 'react';
import { PaystackButton } from 'react-paystack';
import InlineTip from './InlineTip';
import ColorLashPicker from './ColorLashPicker';
import { formatExtraOrderLabel } from '../utils/lashExtras';

function OrderReviewLine({ label, price, pricePrefix = '', onRemove }) {
  const priceValue = typeof price === 'number' ? price : parseFloat(price) || 0;

  return (
    <div className="order-review-item">
      <div className="order-review-item__info">
        <span className="order-review-item__label">{label}</span>
        <span className="order-review-item__price">
          {pricePrefix}₵{priceValue}
        </span>
      </div>
      <button
        type="button"
        className="order-review-item__remove"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
      >
        ×
      </button>
    </div>
  );
}

export default function BookingCheckoutModal({
  isOpen,
  onClose,
  title,
  mainProduct,
  extras = [],
  colorLabel,
  totalPrice,
  depositAmount,
  onRemoveMain,
  onRemoveExtra,
  formData,
  onInputChange,
  selectedColor,
  onColorChange,
  hasColorLashExtra,
  availableColors,
  availableTimeSlots,
  onSubmit,
  submitStatus,
  checkingAvailability,
  readyToPay,
  paystackProps,
  paymentProcessing,
  canPay,
}) {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-overlay order-review-overlay" onClick={handleOverlayClick}>
      <div
        className="modal-content order-review-modal booking-checkout-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-modal-title"
      >
        <header className="booking-checkout-modal__header">
          <h2 id="checkout-modal-title">{title}</h2>
          <p className="order-review-subtitle">
            Review your selections, then complete your details. Tap × to update your order.
          </p>
        </header>

        <form className="booking-form booking-checkout-form" onSubmit={onSubmit}>
          <div className="booking-checkout-modal__scroll">
            <section className="booking-checkout-section" aria-labelledby="checkout-order-heading">
              <h3 id="checkout-order-heading" className="booking-checkout-section__title">
                Order summary
              </h3>
              <div className="order-review-items">
                {mainProduct ? (
                  <OrderReviewLine
                    label={mainProduct.name}
                    price={mainProduct.price}
                    onRemove={onRemoveMain}
                  />
                ) : (
                  <p className="order-review-empty">
                    No main style selected. Close and choose a style above.
                  </p>
                )}

                {extras.map((extra) => (
                  <OrderReviewLine
                    key={extra.id}
                    label={formatExtraOrderLabel(extra, colorLabel)}
                    price={extra.price}
                    pricePrefix="+"
                    onRemove={() => onRemoveExtra(extra.id)}
                  />
                ))}
              </div>

              <div className="order-review-totals">
                <div className="order-review-total-row">
                  <span>Total</span>
                  <strong>₵{totalPrice.toFixed(2)}</strong>
                </div>
                <div className="order-review-total-row order-review-total-row--deposit">
                  <span>Deposit due now (40%)</span>
                  <strong>₵{depositAmount.toFixed(2)}</strong>
                </div>
              </div>
            </section>

            <section className="booking-checkout-section" aria-labelledby="checkout-details-heading">
              <h3 id="checkout-details-heading" className="booking-checkout-section__title">
                Your details
              </h3>

              {hasColorLashExtra() && (
                <div className="booking-checkout-field">
                  <ColorLashPicker
                    id="checkout-color"
                    selectedColor={selectedColor}
                    onChange={onColorChange}
                    colors={availableColors}
                    compact
                  />
                </div>
              )}

              <div className="booking-checkout-field form-group">
                <label htmlFor="checkout-name">Full Name *</label>
                <input
                  type="text"
                  id="checkout-name"
                  name="name"
                  value={formData.name}
                  onChange={onInputChange}
                  required
                />
              </div>

              <div className="booking-checkout-field form-group">
                <label htmlFor="checkout-phone">Phone Number *</label>
                <input
                  type="tel"
                  id="checkout-phone"
                  name="phone"
                  value={formData.phone}
                  onChange={onInputChange}
                  required
                />
              </div>

              <div className="booking-checkout-field form-group">
                <label htmlFor="checkout-email">Email Address *</label>
                <input
                  type="email"
                  id="checkout-email"
                  name="email"
                  value={formData.email}
                  onChange={onInputChange}
                  required
                />
              </div>

              <div className="booking-checkout-field form-group">
                <label htmlFor="checkout-date">Preferred Date *</label>
                <input
                  type="date"
                  id="checkout-date"
                  name="date"
                  value={formData.date}
                  onChange={onInputChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="booking-checkout-field form-group">
                <label htmlFor="checkout-time">Preferred Time *</label>
                <select
                  id="checkout-time"
                  name="time"
                  value={formData.time}
                  onChange={onInputChange}
                  required
                  disabled={!formData.date}
                >
                  <option value="">
                    {!formData.date ? 'Please select a date first' : 'Select a time'}
                  </option>
                  {availableTimeSlots.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.display}
                    </option>
                  ))}
                </select>
              </div>

              <div className="booking-checkout-field form-group">
                <label htmlFor="checkout-comments">Additional Comments (Optional)</label>
                <textarea
                  id="checkout-comments"
                  name="comments"
                  value={formData.comments}
                  onChange={onInputChange}
                  placeholder="Any special requests, allergies, or additional information..."
                  rows="3"
                />
              </div>
            </section>

            {submitStatus.message && (
              <div className={`submit-message ${submitStatus.type}`}>
                {submitStatus.message}
              </div>
            )}

            <InlineTip title="Payment">
              To book, you’ll pay a <strong>40% non‑refundable</strong> deposit after we verify your
              selected time slot.
            </InlineTip>
          </div>

          <footer className="booking-checkout-modal__footer">
            <div className="order-review-actions">
              <button type="button" className="order-review-cancel-btn" onClick={onClose}>
                Keep browsing
              </button>

              {readyToPay && canPay ? (
                <PaystackButton
                  {...paystackProps}
                  className={`paystack-button order-review-pay-btn ${paymentProcessing ? 'processing' : ''}`}
                />
              ) : (
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={checkingAvailability || !mainProduct}
                >
                  {checkingAvailability ? 'Checking Availability...' : 'Verify time slot'}
                </button>
              )}
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}
