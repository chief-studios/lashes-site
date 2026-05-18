import React from 'react';
import { PaystackButton } from 'react-paystack';

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

export default function OrderReviewModal({
  isOpen,
  onClose,
  mainProduct,
  extras = [],
  colorLabel,
  totalPrice,
  depositAmount,
  onRemoveMain,
  onRemoveExtra,
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
      <div className="modal-content order-review-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Review Your Order</h2>
        <p className="order-review-subtitle">Check everything before you pay. Tap × to remove an item.</p>

        <div className="order-review-items">
          {mainProduct ? (
            <OrderReviewLine
              label={mainProduct.name}
              price={mainProduct.price}
              onRemove={onRemoveMain}
            />
          ) : (
            <p className="order-review-empty">No main style selected. Close and choose a style above.</p>
          )}

          {extras.map((extra) => (
            <OrderReviewLine
              key={extra.id}
              label={extra.name}
              price={extra.price}
              pricePrefix="+"
              onRemove={() => onRemoveExtra(extra.id)}
            />
          ))}

          {colorLabel && (
            <div className="order-review-item order-review-item--static">
              <div className="order-review-item__info">
                <span className="order-review-item__label">Color: {colorLabel}</span>
              </div>
            </div>
          )}
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

        <div className="order-review-actions">
          <button type="button" className="order-review-cancel-btn" onClick={onClose}>
            Back to form
          </button>

          {canPay ? (
            <PaystackButton
              {...paystackProps}
              className={`paystack-button order-review-pay-btn ${paymentProcessing ? 'processing' : ''}`}
            />
          ) : (
            <button type="button" className="submit-btn" disabled>
              Select a main style to pay
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
