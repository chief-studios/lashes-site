import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import ServiceCards from './components/ServiceCards';
import AdminLink from './components/AdminLink';
import LashConsultation from './pages/LashConsultation';
import ClusterLashes from './pages/ClusterLashes';
import MinkLashes from './pages/MinkLashes';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';
import './styles/FeminineAccents.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Navigation />
        <AdminLink />
        
        <Routes>
          <Route path="/" element={
            <>
              {/* Hero Section */}
              <section className="hero">
                <div className="hero-content">
                  <h1 className="fade-in-up">Lashes That Speak Luxury</h1>
                  <p className="fade-in-up">
                    Discover the art of premium lash extensions. From delicate classics to bold volumes, 
                    we craft the perfect look for your unique beauty.
                  </p>
                  <div className="hero-buttons">
                    <a href="/lash-consultation" className="btn btn-primary">
                      Book Consultation
                    </a>
                    <a href="#services" className="btn btn-secondary">
                      Explore Collection
                    </a>
                  </div>
                </div>
              </section>

              {/* Services Section */}
              <section id="services" className="main-content">
                <div className="products-section glass-card">
                  <h2 className="diamond-accent">Our Signature Services</h2>
                  <div className="section-divider"></div>
                  <ServiceCards />
                </div>
              </section>

              {/* Footer */}
              <footer className="footer">
                <div className="footer-content">
                  <h3 className="luxury-text">Best Lashes</h3>
                  <p>Where luxury meets beauty. Book your perfect lash experience today.</p>
                  <div className="social-links">
                    <a href="#" aria-label="Instagram" className="floating">📸</a>
                    <a href="#" aria-label="TikTok" className="floating" style={{animationDelay: '0.5s'}}>🎵</a>
                    <a href="#" aria-label="Facebook" className="floating" style={{animationDelay: '1s'}}>📘</a>
                    <a href="#" aria-label="Twitter" className="floating" style={{animationDelay: '1.5s'}}>🐦</a>
                  </div>
                  <p>&copy; 2024 Best Lashes. All rights reserved.</p>
                </div>
              </footer>
            </>
          } />
          
          <Route path="/lash-consultation" element={<LashConsultation />} />
          <Route path="/cluster-lashes" element={<ClusterLashes />} />
          <Route path="/mink-lashes" element={<MinkLashes />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;