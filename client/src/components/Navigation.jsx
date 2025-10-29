import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import bestLashesLogo from '../images/Best lashes Logo BG WHITE.png';
import '../styles.css';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Consultation', path: '/lash-consultation' },
    { name: 'Cluster Lashes', path: '/cluster-lashes' },
    { name: 'Mink Lashes', path: '/mink-lashes' },
    {name: 'Admin', path: '/admin'}
  ];

  const handleNavClick = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand" onClick={() => navigate('/')}>
          <img src={bestLashesLogo} alt="Best Lashes" className="brand-logo" />
        </div>

        <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          {navItems.map((item) => (
            <button
              key={item.name}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => handleNavClick(item.path)}
            >
              {item.name}
            </button>
          ))}
        </div>

        <button 
          className="nav-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          <span className={`hamburger ${isMenuOpen ? 'active' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
