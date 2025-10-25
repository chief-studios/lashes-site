import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AdminDashboard.css';
import '../styles/AdminLogin.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [bookings, setBookings] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTimeSlot, setNewTimeSlot] = useState({
    time: '',
    date: '',
    isAvailable: true
  });

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
      const response = await fetch('http://localhost:5000/api/auth/login', {
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
      const bookingsResponse = await fetch('http://localhost:5000/api/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        setBookings(bookingsData);
      }

      // Fetch time slots (we'll create this endpoint)
      const timeSlotsResponse = await fetch('http://localhost:5000/api/time-slots', {
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
    navigate('/admin/login');
  };

  const handleAddTimeSlot = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:5000/api/time-slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTimeSlot)
      });

      if (response.ok) {
        setNewTimeSlot({ time: '', date: '', isAvailable: true });
        fetchData();
      }
    } catch (error) {
      console.error('Error adding time slot:', error);
    }
  };

  const handleUpdateBookingStatus = async (bookingId, status) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}/status`, {
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
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={loginData.password}
                onChange={handleLoginInputChange}
                required
                disabled={loginLoading}
              />
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
          className={`nav-btn ${activeTab === 'time-slots' ? 'active' : ''}`}
          onClick={() => setActiveTab('time-slots')}
        >
          Time Slots
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
                    <p><strong>Time:</strong> {new Date(booking.bookingTime).toLocaleTimeString()}</p>
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

        {activeTab === 'time-slots' && (
          <div className="time-slots-section">
            <h2>Manage Time Slots</h2>
            
            <form className="add-time-slot-form" onSubmit={handleAddTimeSlot}>
              <h3>Add New Time Slot</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date">Date</label>
                  <input
                    type="date"
                    id="date"
                    value={newTimeSlot.date}
                    onChange={(e) => setNewTimeSlot({...newTimeSlot, date: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="time">Time</label>
                  <input
                    type="time"
                    id="time"
                    value={newTimeSlot.time}
                    onChange={(e) => setNewTimeSlot({...newTimeSlot, time: e.target.value})}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="add-btn">Add Time Slot</button>
            </form>

            <div className="time-slots-list">
              <h3>Available Time Slots</h3>
              {timeSlots.map(slot => (
                <div key={slot._id} className="time-slot-card">
                  <div className="slot-info">
                    <p><strong>Date:</strong> {new Date(slot.date).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> {slot.time}</p>
                    <p><strong>Status:</strong> 
                      <span className={`status ${slot.isAvailable ? 'available' : 'unavailable'}`}>
                        {slot.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
