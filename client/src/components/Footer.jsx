import React from 'react';
import '../styles/base.css';
import '../styles/footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <h3 className="luxury-text">Best Lashes</h3>
        <p>Where luxury meets beauty. Book your perfect lash experience today.</p>
        <div className="social-links">
          <a
            href="https://instagram.com/best_lashes.pd"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="floating"
          >
            <i className="fa-brands fa-instagram" />
          </a>
          <a
            href="https://www.snapchat.com/add/thepadikuor"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Snapchat"
            className="floating"
            style={{animationDelay: '0.5s'}}
          >
            <i className="fa-brands fa-snapchat" />
          </a>
          <a
            href="https://www.tiktok.com/@the.padikuor09"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok"
            className="floating"
            style={{animationDelay: '1s'}}
          >
            <i className="fa-brands fa-tiktok" />
          </a>
          <a
            href="https://wa.me/233240935600"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="floating"
            style={{animationDelay: '1.5s'}}
          >
            <i className="fa-brands fa-whatsapp" />
          </a>
        </div>
        <p>
          © 2025 Best Lashes. All rights reserved. Built by
          <a 
            href="https://enamcudjoeahiable.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginLeft: '0.25rem', color: 'inherit', textDecoration: 'underline' }}
          >
            chief studios
          </a>.
        </p>
      </div>
    </footer>
  );
};

export default Footer;


