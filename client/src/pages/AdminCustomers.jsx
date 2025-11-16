import React, { useState, useEffect } from 'react';
import '../styles/base.css';
import '../styles/admin.css';

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerBookings, setCustomerBookings] = useState([]);

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm]);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const url = searchTerm
        ? `https://lashes-site.onrender.com/api/customers?search=${encodeURIComponent(searchTerm)}`
        : 'https://lashes-site.onrender.com/api/customers';
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetails = async (customerId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`https://lashes-site.onrender.com/api/customers/${customerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedCustomer(data.customer);
        setCustomerBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching customer details:', error);
    }
  };

  const handleSyncCustomers = async () => {
    if (!window.confirm('This will sync customers from existing bookings. Continue?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('https://lashes-site.onrender.com/api/customers/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchCustomers();
        alert('Customers synced successfully!');
      }
    } catch (error) {
      console.error('Error syncing customers:', error);
    }
  };

  if (loading) {
    return <div className="admin-content"><div className="loading">Loading...</div></div>;
  }

  return (
    <div className="admin-content">
      <div className="admin-section-header">
        <h2>Customers</h2>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button className="btn btn-secondary" onClick={handleSyncCustomers}>
            Sync from Bookings
          </button>
        </div>
      </div>

      <div className="customers-container">
        <div className="customers-list">
          <h3>All Customers ({customers.length})</h3>
          {customers.length > 0 ? (
            <div className="customers-grid">
              {customers.map(customer => (
                <div
                  key={customer._id}
                  className={`customer-card ${selectedCustomer?._id === customer._id ? 'selected' : ''}`}
                  onClick={() => fetchCustomerDetails(customer._id)}
                >
                  <div className="customer-header">
                    <h4>{customer.name}</h4>
                    <span className="customer-badge">
                      {customer.totalBookings} {customer.totalBookings === 1 ? 'booking' : 'bookings'}
                    </span>
                  </div>
                  <div className="customer-info">
                    <p><strong>Email:</strong> {customer.email}</p>
                    <p><strong>Phone:</strong> {customer.phone}</p>
                    {customer.lastVisit && (
                      <p><strong>Last Visit:</strong> {new Date(customer.lastVisit).toLocaleDateString()}</p>
                    )}
                    {customer.totalSpent > 0 && (
                      <p><strong>Total Spent:</strong> ${customer.totalSpent.toFixed(2)}</p>
                    )}
                  </div>
                  {customer.notes && (
                    <div className="customer-notes">
                      <p><strong>Notes:</strong> {customer.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>No customers found</p>
          )}
        </div>

        {selectedCustomer && (
          <div className="customer-details">
            <h3>Customer Details</h3>
            <div className="customer-detail-card">
              <h4>{selectedCustomer.name}</h4>
              <div className="detail-info">
                <p><strong>Email:</strong> {selectedCustomer.email}</p>
                <p><strong>Phone:</strong> {selectedCustomer.phone}</p>
                <p><strong>Total Bookings:</strong> {selectedCustomer.totalBookings}</p>
                {selectedCustomer.lastVisit && (
                  <p><strong>Last Visit:</strong> {new Date(selectedCustomer.lastVisit).toLocaleDateString()}</p>
                )}
                {selectedCustomer.notes && (
                  <div className="notes-section">
                    <p><strong>Notes:</strong></p>
                    <p>{selectedCustomer.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <h3>Booking History</h3>
            <div className="bookings-list">
              {customerBookings.length > 0 ? (
                customerBookings.map(booking => (
                  <div key={booking._id} className="booking-item">
                    <div className="booking-info">
                      <p><strong>Service:</strong> {booking.service}</p>
                      <p><strong>Date:</strong> {new Date(booking.bookingTime).toLocaleDateString()}</p>
                      <p><strong>Time:</strong> {new Date(booking.bookingTime).toLocaleTimeString()}</p>
                      <p><strong>Status:</strong> 
                        <span className={`status ${booking.status}`}>{booking.status}</span>
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p>No booking history</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCustomers;

