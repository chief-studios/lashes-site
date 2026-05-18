import React from 'react';

export default function OrderToast({ message }) {
  if (!message) return null;

  return (
    <div className="order-toast" role="status" aria-live="polite">
      {message}
    </div>
  );
}
