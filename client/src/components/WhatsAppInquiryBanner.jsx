import React from 'react';

export default function WhatsAppInquiryBanner({
  whatsappNumber = '233240935600',
  customMessage = "Hi! I am browsing lash styles on your website and didn't see the exact look I am looking for. Can I share a reference photo or inquire about a custom style?",
  title = "Don't see what you're looking for?",
  subtitle = "Have a specific reference photo or custom look in mind? Chat with us directly on WhatsApp and we'll help bring your custom look to life!"
}) {
  const encodedMessage = encodeURIComponent(customMessage);
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

  return (
    <div className="whatsapp-inquiry-banner">
      <div className="whatsapp-inquiry-content">
        <div className="whatsapp-icon-badge">
          <i className="fa-brands fa-whatsapp" />
        </div>
        <div className="whatsapp-inquiry-text">
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-inquiry-btn"
      >
        <i className="fa-brands fa-whatsapp" />
        Chat on WhatsApp
      </a>
    </div>
  );
}
