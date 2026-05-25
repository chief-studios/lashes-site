import React from 'react';
import { Link } from 'react-router-dom';

export default function CustomizedSetConsultModal({ isOpen, onClose }) {
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
          A customized mink set is tailored to your look and needs. Before we can book this
          service, you&apos;ll need a consultation so we can plan your style together.
        </p>
        <p className="customized-set-modal__hint">
          Book a lash consultation first — then we can move forward with your customized set.
        </p>
        <div className="customized-set-modal__actions">
          <Link
            to="/lash-consultation"
            className="modal-ok-btn customized-set-modal__cta"
            onClick={onClose}
          >
            Book a consultation
          </Link>
          <button type="button" className="customized-set-modal__close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
