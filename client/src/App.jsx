import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Intro from './components/Intro';
import ServiceCards from './components/ServiceCards';
import LashConsultation from './pages/LashConsultation';
import ClusterLashes from './pages/ClusterLashes';
import MinkLashes from './pages/MinkLashes';
import './App.css';

function App() {
  const [showIntro, setShowIntro] = useState(true);

  const handleIntroFinish = () => setShowIntro(false);
  
  return (
    <Router>
      <div className="app">
        {showIntro && <Intro duration={1800} onFinish={handleIntroFinish} />}
        
        <Routes>
          <Route path="/" element={
            <>
              <header className="header">
                <div className="container">
                  <h1>Lash Studio</h1>
                  <p>Welcome to Best Lashes - Book Your Pefect Lash</p>
                </div>
              </header>

              <main className="main-content container">
                <section className="products-section">
                  <h2>Our Services</h2>
                  <ServiceCards />
                </section>
              </main>

              <footer className="footer">
                <div className="container">
                  <p>&copy; 2024 Beauty & Wellness Studio. All rights reserved.</p>
                </div>
              </footer>
            </>
          } />
          
          <Route path="/lash-consultation" element={<LashConsultation />} />
          <Route path="/cluster-lashes" element={<ClusterLashes />} />
          <Route path="/mink-lashes" element={<MinkLashes />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;