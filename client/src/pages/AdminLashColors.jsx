import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../config/api';
import ConfirmModal from '../components/ConfirmModal';
import { scrollElementBelowNav } from '../utils/scrollPageToTop';

const AdminLashColors = () => {
    const navigate = useNavigate();
    const [colors, setColors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        label: '',
        value: '',
        swatch: '#ff1493'
    });
    const [editingId, setEditingId] = useState(null);
    const [colorToDelete, setColorToDelete] = useState(null);
    const formRef = useRef(null);

    useEffect(() => {
        fetchColors();
    }, []);

    const fetchColors = async () => {
        try {
            setLoading(true);
            const response = await fetch(apiUrl('/api/lash-colors'));
            if (response.ok) {
                const data = await response.json();
                setColors(data);
            } else {
                setError('Failed to fetch lash colors');
            }
        } catch (err) {
            setError('Error connecting to server');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            if (name === 'label' && !editingId) {
                updated.value = value.toLowerCase().trim().replace(/\s+/g, '-');
            }
            return updated;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.label || !formData.value || !formData.swatch) {
            setError('Please fill in all fields (Label, Value, Swatch).');
            return;
        }

        const token = localStorage.getItem('adminToken');

        try {
            const url = editingId ? `/api/lash-colors/${editingId}` : '/api/lash-colors';
            const method = editingId ? 'PUT' : 'POST';

            const response = await fetch(apiUrl(url), {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setFormData({ label: '', value: '', swatch: '#ff1493' });
                setEditingId(null);
                fetchColors();
            } else {
                const data = await response.json();
                setError(data.message || 'Failed to save lash color');
            }
        } catch (err) {
            setError('Error saving lash color');
        }
    };

    const handleEdit = (color) => {
        setFormData({
            label: color.label,
            value: color.value,
            swatch: color.swatch
        });
        setEditingId(color._id);
        if (formRef.current) {
            scrollElementBelowNav(formRef.current, 'smooth');
        }
    };

    const confirmDeleteColor = async () => {
        if (!colorToDelete) return;

        const token = localStorage.getItem('adminToken');
        try {
            const response = await fetch(apiUrl(`/api/lash-colors/${colorToDelete._id}`), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                fetchColors();
            } else {
                setError('Failed to delete lash color');
            }
        } catch (err) {
            setError('Error deleting lash color');
        } finally {
            setColorToDelete(null);
        }
    };

    return (
        <div className="admin-manage-container">
            <button onClick={() => navigate('/admin')} className="btn btn-secondary" style={{ marginBottom: '1.5rem', cursor: 'pointer' }}>
                ← Back to Dashboard
            </button>

            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-pink, #FF1493)' }}>Manage Lash Colors</h2>

            {error && <div style={{ background: 'rgba(244, 67, 54, 0.1)', color: '#c62828', border: '1px solid rgba(244, 67, 54, 0.3)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}

            <div className="admin-manage-grid">
                {/* Form Section */}
                <div ref={formRef} className="admin-manage-card">
                    <h3 style={{ marginTop: 0, marginBottom: '1.25rem', color: 'var(--primary-pink, #FF1493)' }}>{editingId ? 'Edit Lash Color' : 'Add New Lash Color'}</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: '#000' }}>Color Label</label>
                            <input name="label" placeholder="e.g. Neon Pink" value={formData.label} onChange={handleInputChange} required style={inputStyle} />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: '#000' }}>Value / Code</label>
                            <input name="value" placeholder="e.g. neon-pink" value={formData.value} onChange={handleInputChange} required style={inputStyle} />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: '#000' }}>Color Swatch</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <input
                                    type="color"
                                    name="swatch"
                                    value={formData.swatch}
                                    onChange={handleInputChange}
                                    style={{ width: '48px', height: '44px', border: 'none', borderRadius: '8px', cursor: 'pointer', background: 'none' }}
                                />
                                <input
                                    type="text"
                                    name="swatch"
                                    placeholder="#FF1493"
                                    value={formData.swatch}
                                    onChange={handleInputChange}
                                    required
                                    style={{ ...inputStyle, flex: 1 }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                            <button type="submit" style={{ ...buttonStyle, flex: 1, background: editingId ? '#ff8c00' : 'var(--primary-pink, #FF1493)' }}>
                                {editingId ? 'Update Color' : 'Add Color'}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingId(null);
                                        setFormData({ label: '', value: '', swatch: '#ff1493' });
                                    }}
                                    style={{ ...buttonStyle, background: '#666' }}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* List Section */}
                <div className="admin-manage-card admin-manage-scroll-list">
                    <h3 style={{ marginTop: 0, marginBottom: '1.25rem', color: 'var(--primary-pink, #FF1493)' }}>Existing Lash Colors ({colors.length})</h3>
                    {loading ? (
                        <p style={{ color: '#666' }}>Loading lash colors...</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {colors.map(color => (
                                <div key={color._id} className="admin-item-card">
                                    <div className="admin-item-content">
                                        <span
                                            style={{
                                                width: '28px',
                                                height: '28px',
                                                borderRadius: '50%',
                                                backgroundColor: color.swatch,
                                                border: '2px solid rgba(0,0,0,0.15)',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                                flexShrink: 0
                                            }}
                                        />
                                        <div>
                                            <strong style={{ color: '#000000', fontSize: '0.95rem' }}>{color.label}</strong>
                                            <div style={{ fontSize: '0.8rem', color: '#666666' }}>Code: <code>{color.value}</code> | Hex: <code>{color.swatch}</code></div>
                                        </div>
                                    </div>
                                    <div className="admin-item-actions">
                                        <button onClick={() => handleEdit(color)} style={{ ...smallButtonStyle, background: '#007bff' }}>Edit</button>
                                        <button onClick={() => setColorToDelete(color)} style={{ ...smallButtonStyle, background: '#dc3545' }}>Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={Boolean(colorToDelete)}
                title="Delete Lash Color"
                message={colorToDelete ? `Are you sure you want to delete "${colorToDelete.label}"?` : ''}
                confirmText="Delete Color"
                cancelText="Cancel"
                confirmVariant="danger"
                onConfirm={confirmDeleteColor}
                onCancel={() => setColorToDelete(null)}
            />
        </div>
    );
};

const inputStyle = {
    padding: '0.75rem 1rem',
    background: '#ffffff',
    border: '2px solid rgba(255, 20, 147, 0.25)',
    borderRadius: '8px',
    color: '#000000',
    fontSize: '0.95rem',
    width: '100%',
    fontFamily: 'inherit',
    colorScheme: 'light'
};

const buttonStyle = {
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '50px',
    color: '#ffffff',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '1px'
};

const smallButtonStyle = {
    padding: '0.4rem 0.8rem',
    border: 'none',
    borderRadius: '4px',
    color: '#ffffff',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer'
};

export default AdminLashColors;
