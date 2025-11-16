import React, { useState, useEffect } from 'react';
import '../styles/base.css';
import '../styles/admin.css';

const AdminSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    studioName: '',
    studioEmail: '',
    studioPhone: '',
    studioAddress: '',
    businessHours: {
      monday: { open: '09:00', close: '18:00', isOpen: true },
      tuesday: { open: '09:00', close: '18:00', isOpen: true },
      wednesday: { open: '09:00', close: '18:00', isOpen: true },
      thursday: { open: '09:00', close: '18:00', isOpen: true },
      friday: { open: '09:00', close: '18:00', isOpen: true },
      saturday: { open: '10:00', close: '16:00', isOpen: true },
      sunday: { open: '10:00', close: '16:00', isOpen: false }
    },
    bookingSettings: {
      advanceBookingDays: 30,
      cancellationHours: 24,
      slotDuration: 30
    },
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: '',
      tiktok: ''
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('https://lashes-site.onrender.com/api/settings/admin', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setFormData({
          studioName: data.studioName || '',
          studioEmail: data.studioEmail || '',
          studioPhone: data.studioPhone || '',
          studioAddress: data.studioAddress || '',
          businessHours: data.businessHours || formData.businessHours,
          bookingSettings: data.bookingSettings || formData.bookingSettings,
          socialMedia: data.socialMedia || formData.socialMedia
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('https://lashes-site.onrender.com/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Settings saved successfully!');
        fetchSettings();
      } else {
        alert('Error saving settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const updateBusinessHours = (day, field, value) => {
    setFormData({
      ...formData,
      businessHours: {
        ...formData.businessHours,
        [day]: {
          ...formData.businessHours[day],
          [field]: field === 'isOpen' ? value : value
        }
      }
    });
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  if (loading) {
    return <div className="admin-content"><div className="loading">Loading...</div></div>;
  }

  return (
    <div className="admin-content">
      <div className="admin-section-header">
        <h2>Settings</h2>
      </div>

      <form onSubmit={handleSubmit} className="settings-form">
        <div className="settings-section">
          <h3>Studio Information</h3>
          <div className="form-group">
            <label>Studio Name</label>
            <input
              type="text"
              value={formData.studioName}
              onChange={(e) => setFormData({...formData, studioName: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.studioEmail}
              onChange={(e) => setFormData({...formData, studioEmail: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              value={formData.studioPhone}
              onChange={(e) => setFormData({...formData, studioPhone: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Address</label>
            <textarea
              value={formData.studioAddress}
              onChange={(e) => setFormData({...formData, studioAddress: e.target.value})}
              rows="3"
            />
          </div>
        </div>

        <div className="settings-section">
          <h3>Business Hours</h3>
          {days.map(day => (
            <div key={day} className="business-hours-row">
              <div className="day-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.businessHours[day].isOpen}
                    onChange={(e) => updateBusinessHours(day, 'isOpen', e.target.checked)}
                  />
                  <span className="day-name">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                </label>
              </div>
              {formData.businessHours[day].isOpen && (
                <div className="hours-inputs">
                  <input
                    type="time"
                    value={formData.businessHours[day].open}
                    onChange={(e) => updateBusinessHours(day, 'open', e.target.value)}
                  />
                  <span>to</span>
                  <input
                    type="time"
                    value={formData.businessHours[day].close}
                    onChange={(e) => updateBusinessHours(day, 'close', e.target.value)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="settings-section">
          <h3>Booking Settings</h3>
          <div className="form-group">
            <label>Advance Booking Days</label>
            <input
              type="number"
              value={formData.bookingSettings.advanceBookingDays}
              onChange={(e) => setFormData({
                ...formData,
                bookingSettings: {
                  ...formData.bookingSettings,
                  advanceBookingDays: parseInt(e.target.value)
                }
              })}
              min="1"
            />
          </div>

          <div className="form-group">
            <label>Cancellation Hours (before appointment)</label>
            <input
              type="number"
              value={formData.bookingSettings.cancellationHours}
              onChange={(e) => setFormData({
                ...formData,
                bookingSettings: {
                  ...formData.bookingSettings,
                  cancellationHours: parseInt(e.target.value)
                }
              })}
              min="1"
            />
          </div>

          <div className="form-group">
            <label>Slot Duration (minutes)</label>
            <input
              type="number"
              value={formData.bookingSettings.slotDuration}
              onChange={(e) => setFormData({
                ...formData,
                bookingSettings: {
                  ...formData.bookingSettings,
                  slotDuration: parseInt(e.target.value)
                }
              })}
              min="15"
              step="15"
            />
          </div>
        </div>

        <div className="settings-section">
          <h3>Social Media</h3>
          <div className="form-group">
            <label>Facebook URL</label>
            <input
              type="url"
              value={formData.socialMedia.facebook || ''}
              onChange={(e) => setFormData({
                ...formData,
                socialMedia: {
                  ...formData.socialMedia,
                  facebook: e.target.value
                }
              })}
            />
          </div>

          <div className="form-group">
            <label>Instagram URL</label>
            <input
              type="url"
              value={formData.socialMedia.instagram || ''}
              onChange={(e) => setFormData({
                ...formData,
                socialMedia: {
                  ...formData.socialMedia,
                  instagram: e.target.value
                }
              })}
            />
          </div>

          <div className="form-group">
            <label>Twitter URL</label>
            <input
              type="url"
              value={formData.socialMedia.twitter || ''}
              onChange={(e) => setFormData({
                ...formData,
                socialMedia: {
                  ...formData.socialMedia,
                  twitter: e.target.value
                }
              })}
            />
          </div>

          <div className="form-group">
            <label>TikTok URL</label>
            <input
              type="url"
              value={formData.socialMedia.tiktok || ''}
              onChange={(e) => setFormData({
                ...formData,
                socialMedia: {
                  ...formData.socialMedia,
                  tiktok: e.target.value
                }
              })}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;

