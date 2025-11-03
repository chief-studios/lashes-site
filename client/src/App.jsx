import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import ServiceCards from './components/ServiceCards';
import AdminLink from './components/AdminLink';
import LashConsultation from './pages/LashConsultation';
import ClusterLashes from './pages/ClusterLashes';
import MinkLashes from './pages/MinkLashes';
import AdminDashboard from './pages/AdminDashboard';
import Footer from './components/Footer';
import './styles.css';

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

              <Footer />
            </>
          } />
          
          <Route path="/lash-consultation" element={<><LashConsultation /><Footer /></>} />
          <Route path="/cluster-lashes" element={<><ClusterLashes /><Footer /></>} />
          <Route path="/mink-lashes" element={<><MinkLashes /><Footer /></>} />
          <Route path="/admin" element={<><AdminDashboard /><Footer /></>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;