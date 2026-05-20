import React from 'react';

export default function PaymentSuccessModal({ isOpen, autoCloseMs = 8000 }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay payment-success-overlay" role="presentation">
      <div
        className="modal-content payment-success-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="payment-success-title"
        aria-describedby="payment-success-desc"
      >
        <div className="payment-success-modal__glow" aria-hidden />

        <div className="payment-success-modal__icon-wrap" aria-hidden>
          <svg className="payment-success-modal__icon" viewBox="0 0 52 52" fill="none">
            <circle cx="26" cy="26" r="24" className="payment-success-modal__icon-ring" />
            <path
              d="M16 27.5L23 34.5L37 19.5"
              className="payment-success-modal__icon-check"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <p className="payment-success-modal__eyebrow">Booking confirmed</p>
        <h3 id="payment-success-title" className="payment-success-modal__title">
          Thank you, beautiful
        </h3>
        <p id="payment-success-desc" className="payment-success-modal__lead">
          Your deposit is received and your appointment is reserved. We can&apos;t wait to see you.
        </p>

        <div className="payment-success-modal__notice">
          <span className="payment-success-modal__notice-icon" aria-hidden>
            <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
              <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          <div className="payment-success-modal__notice-text">
            <strong>Arrive on time</strong>
            <p>
              Late arrivals attract an extra fee of{' '}
              <span className="payment-success-modal__fee">GHS 30</span>.
            </p>
          </div>
        </div>

        <p className="payment-success-modal__redirect">Taking you home shortly…</p>

        <div
          className="payment-success-modal__progress"
          style={{ '--payment-success-duration': `${autoCloseMs}ms` }}
          aria-hidden
        >
          <div className="payment-success-modal__progress-bar" />
        </div>
      </div>
    </div>
  );
}
