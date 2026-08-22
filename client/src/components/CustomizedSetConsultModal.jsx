import React from 'react';

export default function CustomizedSetConsultModal({ isOpen, onClose, onProceed }) {
  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="modal-overlay customized-set-modal-overlay"
      role="presentation"
      onClick={handleOverlayClick}
    >
      <div
        className="modal-content customized-set-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="customized-set-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="customized-set-modal-title">Customized Set</h2>
        <p>
          A customized mink set is tailored to your unique look and needs. The consultation is included as part of your customized set package so we can plan your style together (Customized Set: ₵250 + Consultation fee: ₵50 = Total ₵300).
        </p>
        <p className="customized-set-modal__hint">
          Proceed below to select your date, time slot, and enter your booking details.
        </p>
        <div className="customized-set-modal__actions">
          <button
            type="button"
            className="modal-ok-btn customized-set-modal__cta"
            onClick={onProceed}
          >
            Proceed to Book
          </button>
          <button type="button" className="customized-set-modal__close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
