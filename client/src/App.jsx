import React, { useState } from 'react';
import ProductList from './components/ProductList';
import BookingForm from './components/BookingForm';
import Intro from './components/Intro';
import './App.css';

function App() {
  const [showIntro, setShowIntro] = useState(true);

  const handleIntroFinish = () => setShowIntro(false);
  return (
    <div className="app">
      {showIntro && <Intro duration={1800} onFinish={handleIntroFinish} />}
      <header className="header">
        <div className="container">
          <h1>Beauty & Wellness Studio</h1>
          <p>Book your perfect treatment experience</p>
        </div>
      </header>

      <main className="main-content container">
        <section className="products-section">
          <h2>Our Services</h2>
          <ProductList />
        </section>

        <section className="booking-section">
          <h2>Book Your Appointment</h2>
          <BookingForm />
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <p>&copy; 2024 Beauty & Wellness Studio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;