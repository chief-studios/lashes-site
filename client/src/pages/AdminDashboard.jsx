import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminCustomers from './AdminCustomers';
import AdminAnalytics from './AdminAnalytics';
import AdminSettings from './AdminSettings';
import '../styles/base.css';
import '../styles/admin.css';
import '../styles/booking.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPassword, setShowPassword] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const checkAuth = () => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const response = await fetch('https://lashes-site.onrender.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        setIsAuthenticated(true);
      } else {
        setLoginError(data.message || 'Login failed');
      }
    } catch (error) {
      setLoginError('Network error. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLoginInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      // Fetch bookings
      const bookingsResponse = await fetch('https://lashes-site.onrender.com/api/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        setBookings(bookingsData);
      }

      // Fetch time slots (we'll create this endpoint)
      const timeSlotsResponse = await fetch('https://lashes-site.onrender.com/api/time-slots', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (timeSlotsResponse.ok) {
        const timeSlotsData = await timeSlotsResponse.json();
        setTimeSlots(timeSlotsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setIsAuthenticated(false);
    setBookings([]);
    setTimeSlots([]);
    setLoading(false);
    // Reset form data
    setLoginData({ username: '', password: '' });
    setLoginError('');
  };


  const formatTime = (date) => {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
    const displayHours = String(d.getHours() % 12 || 12).padStart(2, '0');
    return `${displayHours}:${minutes}${ampm}`;
  };

  const handleUpdateBookingStatus = async (bookingId, status) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`https://lashes-site.onrender.com/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-container">
          <div className="admin-login-header">
            <h1>Admin Login</h1>
            <p>Sign in to manage your lash studio</p>
          </div>

          <form className="admin-login-form" onSubmit={handleLogin}>
            {loginError && <div className="error-message">{loginError}</div>}
            
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={loginData.username}
                onChange={handleLoginInputChange}
                required
                disabled={loginLoading}
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={loginData.password}
                  onChange={handleLoginInputChange}
                  required
                  disabled={loginLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  disabled={loginLoading}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#999',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="login-btn"
              disabled={loginLoading}
            >
              {loginLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="back-to-site">
            <button 
              className="back-btn"
              onClick={() => navigate('/')}
            >
              ← Back to Site
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-actions">
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="admin-nav">
        <button 
          className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={`nav-btn ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          Bookings
        </button>
        <button 
          className={`nav-btn ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          Customers
        </button>
        <button 
          className={`nav-btn ${activeTab === 'time-slots' ? 'active' : ''}`}
          onClick={() => setActiveTab('time-slots')}
        >
          Time Slots
        </button>
        <button 
          className={`nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
        <button 
          className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard-stats">
            <div className="stat-card">
              <h3>Total Bookings</h3>
              <p>{bookings.length}</p>
            </div>
            <div className="stat-card">
              <h3>Pending Bookings</h3>
              <p>{bookings.filter(b => b.status === 'pending').length}</p>
            </div>
            <div className="stat-card">
              <h3>Confirmed Bookings</h3>
              <p>{bookings.filter(b => b.status === 'confirmed').length}</p>
            </div>
            <div className="stat-card">
              <h3>Available Time Slots</h3>
              <p>{timeSlots.filter(ts => ts.isAvailable).length}</p>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="bookings-section">
            <h2>All Bookings</h2>
            <div className="bookings-list">
              {bookings.map(booking => (
                <div key={booking._id} className="booking-card">
                  <div className="booking-info">
                    <h4>{booking.name}</h4>
                    <p><strong>Service:</strong> {booking.service}</p>
                    <p><strong>Email:</strong> {booking.email}</p>
                    <p><strong>Phone:</strong> {booking.phone}</p>
                    <p><strong>Date:</strong> {new Date(booking.bookingTime).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> {formatTime(booking.bookingTime)}</p>
                    <p><strong>Status:</strong> 
                      <span className={`status ${booking.status}`}>{booking.status}</span>
                    </p>
                  </div>
                  <div className="booking-actions">
                    <button 
                      className={`status-btn ${booking.status === 'confirmed' ? 'confirmed' : ''}`}
                      onClick={() => handleUpdateBookingStatus(booking._id, 'confirmed')}
                      disabled={booking.status === 'confirmed'}
                    >
                      Confirm
                    </button>
                    <button 
                      className={`status-btn cancel`}
                      onClick={() => handleUpdateBookingStatus(booking._id, 'cancelled')}
                      disabled={booking.status === 'cancelled'}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'customers' && <AdminCustomers />}
        {activeTab === 'analytics' && <AdminAnalytics />}
        {activeTab === 'settings' && <AdminSettings />}

        {activeTab === 'time-slots' && (
          <div className="time-slots-section">
            <h2>Time Slots</h2>
            <div style={{ 
              background: 'rgba(255, 20, 147, 0.1)', 
              padding: '1rem', 
              borderRadius: '8px', 
              marginBottom: '2rem',
              border: '1px solid rgba(255, 20, 147, 0.2)'
            }}>
              <p style={{ margin: 0, color: 'var(--primary-black)' }}>
                <strong>Working Hours:</strong> 8:00 AM - 10:00 PM<br />
                <strong>Time Blocks:</strong> 2-hour intervals (8:00-10:00, 10:00-12:00, 12:00-2:00 PM, 2:00-4:00 PM, 4:00-6:00 PM, 6:00-8:00 PM, 8:00-10:00 PM)<br />
                Time slots are automatically generated when customers select a date. No manual addition needed.
              </p>
            </div>

            <div className="time-slots-list">
              <h3>Recent Time Slots</h3>
              {timeSlots.length === 0 ? (
                <p style={{ color: 'var(--gray-dark)', fontStyle: 'italic' }}>
                  No time slots have been generated yet. They will be created automatically when customers book appointments.
                </p>
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                  gap: '1rem' 
                }}>
                  {timeSlots.slice(0, 50).map(slot => (
                    <div key={slot._id} className="time-slot-card">
                      <div className="slot-info">
                        <p><strong>Date:</strong> {new Date(slot.date).toLocaleDateString()}</p>
                        <p><strong>Time:</strong> {slot.time}</p>
                        <p><strong>Status:</strong> 
                          <span className={`status ${slot.isAvailable ? 'available' : 'unavailable'}`}>
                            {slot.isAvailable ? 'Available' : 'Booked'}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
