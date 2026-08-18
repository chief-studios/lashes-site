import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../config/api';

const AdminProducts = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        duration: '',
        image: '',
        type: 'mink classic',
        extra: 'no',
        poster: 'no'
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await fetch(apiUrl('/api/products'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setProducts(data);
            } else {
                setError('Failed to fetch products');
            }
        } catch (err) {
            setError('Error connecting to server');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const token = localStorage.getItem('adminToken');

        try {
            const url = editingId ? `/api/products/${editingId}` : '/api/products';
            const method = editingId ? 'PUT' : 'POST';

            const response = await fetch(apiUrl(url), {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    price: parseFloat(formData.price)
                })
            });

            if (response.ok) {
                setFormData({ name: '', description: '', price: '', duration: '', image: '', type: 'mink classic', extra: 'no', poster: 'no' });
                setEditingId(null);
                fetchProducts();
            } else {
                const data = await response.json();
                setError(data.message || 'Failed to save product');
            }
        } catch (err) {
            setError('Error saving product');
        }
    };

    const handleEdit = (product) => {
        setFormData({
            name: product.name,
            description: product.description,
            price: product.price,
            duration: product.duration,
            image: product.image,
            type: product.type,
            extra: product.extra,
            poster: product.poster
        });
        setEditingId(product._id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;

        const token = localStorage.getItem('adminToken');
        try {
            const response = await fetch(apiUrl(`/api/products/${id}`), {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                fetchProducts();
            } else {
                setError('Failed to delete product');
            }
        } catch (err) {
            setError('Error deleting product');
        }
    };

    return (
        <div style={{ padding: '2rem', color: '#000', maxWidth: '1200px', margin: '0 auto' }}>
            <button onClick={() => navigate('/admin')} style={{ marginBottom: '1rem', padding: '0.5rem 1rem', background: '#FF1493', color: '#fff', border: 'none', borderRadius: '50px', cursor: 'pointer', fontWeight: '600' }}>
                ← Back to Dashboard
            </button>

            <h2 style={{ marginBottom: '1.5rem', color: '#FF1493' }}>Manage Products</h2>

            {error && <div style={{ background: 'rgba(244, 67, 54, 0.1)', color: '#c62828', border: '1px solid rgba(244, 67, 54, 0.3)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Form Section */}
                <div style={{ background: '#ffffff', border: '2px solid rgba(255, 20, 147, 0.15)', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 4px 20px rgba(255, 20, 147, 0.08)' }}>
                    <h3 style={{ marginTop: 0, color: '#000000', marginBottom: '1rem' }}>{editingId ? 'Edit Product' : 'Add New Product'}</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input name="name" placeholder="Product Name (e.g., Cat Eye)" value={formData.name} onChange={handleInputChange} required style={inputStyle} />
                        <textarea name="description" placeholder="Description" value={formData.description} onChange={handleInputChange} required rows="3" style={inputStyle} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <input name="price" type="number" placeholder="Price (e.g., 250)" value={formData.price} onChange={handleInputChange} required style={inputStyle} />
                            <input name="duration" placeholder="Duration (e.g., 120 mins)" value={formData.duration} onChange={handleInputChange} required style={inputStyle} />
                        </div>
                        <input name="image" placeholder="Image Filename (e.g., mink mega volume cat eye.jpg)" value={formData.image} onChange={handleInputChange} required style={inputStyle} />
                        <p style={{ fontSize: '0.8rem', color: '#666', margin: '-0.5rem 0 0' }}>⚠️ Place this image file in the <code>client/public/images/</code> folder.</p>

                        <select name="type" value={formData.type} onChange={handleInputChange} style={inputStyle}>
                            <option value="mink classic">Mink Classic</option>
                            <option value="mink hybrid">Mink Hybrid</option>
                            <option value="mink volume">Mink Volume</option>
                            <option value="mink mega volume">Mink Mega Volume</option>
                            <option value="cluster classic">Cluster Classic</option>
                            <option value="cluster hybrid">Cluster Hybrid</option>
                            <option value="cluster volume">Cluster Volume</option>
                            <option value="cluster mega volume">Cluster Mega Volume</option>
                        </select>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <select name="extra" value={formData.extra} onChange={handleInputChange} style={inputStyle}>
                                <option value="no">Is Extra? No</option>
                                <option value="yes">Is Extra? Yes</option>
                            </select>
                            <select name="poster" value={formData.poster} onChange={handleInputChange} style={inputStyle}>
                                <option value="no">Is Poster? No</option>
                                <option value="yes">Is Poster? Yes</option>
                            </select>
                        </div>

                        <button type="submit" style={{ ...buttonStyle, background: editingId ? '#f57c00' : '#FF1493' }}>
                            {editingId ? 'Update Product' : 'Add Product'}
                        </button>
                        {editingId && (
                            <button type="button" onClick={() => { setEditingId(null); setFormData({ name: '', description: '', price: '', duration: '', image: '', type: 'mink classic', extra: 'no', poster: 'no' }); }} style={{ ...buttonStyle, background: '#666' }}>
                                Cancel Edit
                            </button>
                        )}
                    </form>
                </div>

                {/* List Section */}
                <div style={{ background: '#ffffff', border: '2px solid rgba(255, 20, 147, 0.15)', padding: '1.5rem', borderRadius: '16px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 4px 20px rgba(255, 20, 147, 0.08)' }}>
                    <h3 style={{ marginTop: 0, color: '#000000', marginBottom: '1rem' }}>Existing Products ({products.length})</h3>
                    {loading ? (
                        <p style={{ color: '#000' }}>Loading...</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {products.map(product => (
                                <div key={product._id} style={{ background: '#f8f8f8', border: '1px solid rgba(255, 20, 147, 0.2)', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <strong style={{ color: '#FF1493' }}>{product.name}</strong>
                                        <div style={{ fontSize: '0.85rem', color: '#444' }}>{product.type} • ₵{product.price}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => handleEdit(product)} style={{ ...smallButtonStyle, background: '#FF1493' }}>Edit</button>
                                        <button onClick={() => handleDelete(product._id)} style={{ ...smallButtonStyle, background: '#dc3545' }}>Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const inputStyle = {
    padding: '0.75rem',
    background: '#ffffff',
    border: '2px solid rgba(255, 20, 147, 0.3)',
    borderRadius: '8px',
    color: '#000000',
    fontSize: '1rem'
};

const buttonStyle = {
    padding: '0.75rem',
    border: 'none',
    borderRadius: '50px',
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer'
};

const smallButtonStyle = {
    padding: '0.4rem 0.8rem',
    border: 'none',
    borderRadius: '50px',
    color: '#fff',
    fontSize: '0.85rem',
    cursor: 'pointer',
    fontWeight: '600'
};

export default AdminProducts;