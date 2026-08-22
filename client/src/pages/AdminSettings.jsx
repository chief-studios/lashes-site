import React, { useState, useEffect } from 'react';
import { apiUrl } from '../config/api';
import '../styles/base.css';
import '../styles/admin.css';

const defaultWeeklySlots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];

const AdminSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSlotInputs, setNewSlotInputs] = useState({});
  const [formData, setFormData] = useState({
    studioName: '',
    studioEmail: '',
    studioPhone: '',
    studioAddress: '',
    businessHours: {
      monday: { open: '08:00', close: '20:00', isOpen: true, slots: [...defaultWeeklySlots] },
      tuesday: { open: '08:00', close: '20:00', isOpen: true, slots: [...defaultWeeklySlots] },
      wednesday: { open: '08:00', close: '20:00', isOpen: true, slots: [...defaultWeeklySlots] },
      thursday: { open: '08:00', close: '20:00', isOpen: true, slots: [...defaultWeeklySlots] },
      friday: { open: '08:00', close: '20:00', isOpen: true, slots: [...defaultWeeklySlots] },
      saturday: { open: '08:00', close: '20:00', isOpen: true, slots: [...defaultWeeklySlots] },
      sunday: { open: '08:00', close: '20:00', isOpen: false, slots: [] }
    },
    bookingSettings: {
      advanceBookingDays: 30,
      cancellationHours: 24,
      slotDuration: 120
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
      const response = await fetch(apiUrl('/api/settings/admin'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);

        const loadedHours = data.businessHours || {};
        const daysList = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const normalizedHours = {};

        daysList.forEach(day => {
          const dayData = loadedHours[day] || {};
          normalizedHours[day] = {
            open: dayData.open || '08:00',
            close: dayData.close || '20:00',
            isOpen: typeof dayData.isOpen === 'boolean' ? dayData.isOpen : true,
            slots: Array.isArray(dayData.slots) && dayData.slots.length > 0
              ? dayData.slots
              : (dayData.isOpen !== false ? [...defaultWeeklySlots] : [])
          };
        });

        setFormData({
          studioName: data.studioName || '',
          studioEmail: data.studioEmail || '',
          studioPhone: data.studioPhone || '',
          studioAddress: data.studioAddress || '',
          businessHours: normalizedHours,
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
      const response = await fetch(apiUrl('/api/settings'), {
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
    setFormData(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          [field]: value
        }
      }
    }));
  };

  const handleAddSlot = (day) => {
    const slotVal = newSlotInputs[day];
    if (!slotVal) return;
    const currentSlots = formData.businessHours[day]?.slots || [];
    if (!currentSlots.includes(slotVal)) {
      const updated = [...currentSlots, slotVal].sort();
      updateBusinessHours(day, 'slots', updated);
    }
    setNewSlotInputs(prev => ({ ...prev, [day]: '' }));
  };

  const handleRemoveSlot = (day, slotToRemove) => {
    const currentSlots = formData.businessHours[day]?.slots || [];
    const updated = currentSlots.filter(s => s !== slotToRemove);
    updateBusinessHours(day, 'slots', updated);
  };

  const handleAutoGenerateSlots = (day) => {
    const daySchedule = formData.businessHours[day];
    if (!daySchedule || !daySchedule.open || !daySchedule.close) return;
    const slotDuration = formData.bookingSettings?.slotDuration || 120;
    const [openH, openM] = daySchedule.open.split(':').map(Number);
    const [closeH, closeM] = daySchedule.close.split(':').map(Number);

    let startMins = openH * 60 + openM;
    const endMins = closeH * 60 + closeM;

    const slots = [];
    while (startMins + slotDuration <= endMins) {
      const h = Math.floor(startMins / 60);
      const m = startMins % 60;
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      slots.push(timeStr);
      startMins += slotDuration;
    }

    updateBusinessHours(day, 'slots', slots);
  };

  const formatSlotDisplay = (timeStr) => {
    if (!timeStr) return '';
    const [hStr, mStr] = timeStr.split(':');
    const h = parseInt(hStr, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${String(displayH).padStart(2, '0')}:${mStr}${ampm}`;
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
          <h3>Business Hours & Weekly Available Time Slots</h3>
          <p className="settings-description" style={{ color: 'var(--gray-dark)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Set open/close hours and available time slots for each day of the week. Clients will only see and be able to book these active time slots.
          </p>
          {days.map(day => (
            <div key={day} className="business-hours-block" style={{
              background: 'rgba(255, 20, 147, 0.03)',
              border: '1px solid rgba(255, 20, 147, 0.15)',
              borderRadius: '8px',
              padding: '1.25rem',
              marginBottom: '1.25rem'
            }}>
              <div className="business-hours-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div className="day-checkbox">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    <input
                      type="checkbox"
                      checked={formData.businessHours[day]?.isOpen}
                      onChange={(e) => updateBusinessHours(day, 'isOpen', e.target.checked)}
                    />
                    <span className="day-name">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
                  </label>
                </div>
                {formData.businessHours[day]?.isOpen && (
                  <div className="hours-inputs" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="time"
                      value={formData.businessHours[day]?.open}
                      onChange={(e) => updateBusinessHours(day, 'open', e.target.value)}
                    />
                    <span>to</span>
                    <input
                      type="time"
                      value={formData.businessHours[day]?.close}
                      onChange={(e) => updateBusinessHours(day, 'close', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => handleAutoGenerateSlots(day)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.85rem',
                        background: 'var(--primary-pink)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginLeft: '0.5rem'
                      }}
                      title="Auto generate slots based on open/close hours and slot duration"
                    >
                      ⚡ Auto-Fill Slots
                    </button>
                  </div>
                )}
              </div>

              {formData.businessHours[day]?.isOpen && (
                <div className="day-slots-container" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed rgba(255, 20, 147, 0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--primary-black)' }}>
                      Available Booking Time Slots for {day.charAt(0).toUpperCase() + day.slice(1)}:
                    </strong>
                  </div>
                  <div className="slots-badges" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    {(formData.businessHours[day]?.slots || []).length === 0 ? (
                      <span style={{ fontSize: '0.85rem', color: '#c62828', fontStyle: 'italic' }}>
                        No time slots configured for {day}. Clients won't see any slots for this day.
                      </span>
                    ) : (
                      (formData.businessHours[day]?.slots || []).map((slot, idx) => (
                        <span key={idx} style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          background: '#fff',
                          border: '1px solid var(--primary-pink)',
                          color: 'var(--primary-pink)',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          fontWeight: '600'
                        }}>
                          {formatSlotDisplay(slot)} ({slot})
                          <button
                            type="button"
                            onClick={() => handleRemoveSlot(day, slot)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#c62828',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              padding: '0 0.2rem',
                              lineHeight: 1
                            }}
                            title="Remove slot"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                  <div className="add-slot-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="time"
                      value={newSlotInputs[day] || ''}
                      onChange={(e) => setNewSlotInputs({ ...newSlotInputs, [day]: e.target.value })}
                      style={{ padding: '0.3rem 0.5rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.85rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddSlot(day)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.85rem',
                        background: 'var(--primary-black, #111)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      + Add Time Slot
                    </button>
                  </div>
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

