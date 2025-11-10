import React, { useState, useEffect } from 'react';
import '../styles/base.css';
import '../styles/admin.css';

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:5000/api/admin/analytics?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="admin-content"><div className="loading">Loading...</div></div>;
  }

  if (!analytics) {
    return <div className="admin-content"><div className="loading">No data available</div></div>;
  }

  return (
    <div className="admin-content">
      <div className="admin-section-header">
        <h2>Analytics & Reports</h2>
        <div className="period-selector">
          <label>Period: </label>
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      <div className="analytics-stats">
        <div className="stat-card">
          <h3>Total Bookings</h3>
          <p className="stat-value">{analytics.totalBookings}</p>
        </div>
        <div className="stat-card">
          <h3>New Customers</h3>
          <p className="stat-value">{analytics.customerStats.new}</p>
        </div>
        <div className="stat-card">
          <h3>Returning Customers</h3>
          <p className="stat-value">{analytics.customerStats.returning}</p>
        </div>
      </div>

      <div className="analytics-section">
        <h3>Top Services</h3>
        <div className="top-services-list">
          {analytics.topServices.length > 0 ? (
            analytics.topServices.map((service, index) => (
              <div key={index} className="service-item">
                <div className="service-rank">#{index + 1}</div>
                <div className="service-info">
                  <span className="service-name">{service.service}</span>
                  <span className="service-count">{service.count} bookings</span>
                </div>
                <div className="service-bar">
                  <div
                    className="service-bar-fill"
                    style={{
                      width: `${(service.count / analytics.topServices[0].count) * 100}%`
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p>No bookings in this period</p>
          )}
        </div>
      </div>

      <div className="analytics-section">
        <h3>Bookings Over Time</h3>
        <div className="bookings-chart">
          {analytics.bookingsByDate.length > 0 ? (
            <div className="chart-container">
              {analytics.bookingsByDate.map((item, index) => {
                const maxCount = Math.max(...analytics.bookingsByDate.map(d => d.count));
                return (
                  <div key={index} className="chart-bar-wrapper">
                    <div className="chart-bar">
                      <div
                        className="chart-bar-fill"
                        style={{
                          height: `${(item.count / maxCount) * 100}%`
                        }}
                      />
                    </div>
                    <div className="chart-label">
                      {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="chart-value">{item.count}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p>No bookings data for this period</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;

