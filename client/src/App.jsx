import React from 'react';
import ProductList from './components/ProductList';
import BookingForm from './components/BookingForm';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>Beauty & Wellness Studio</h1>
        <p>Book your perfect treatment experience</p>
      </header>

      <main className="main-content">
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
        <p>&copy; 2024 Beauty & Wellness Studio. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;