import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../config/api';
import ConfirmModal from '../components/ConfirmModal';
import { isCategoryBanner } from '../utils/productStyles';

const PRESET_IMAGES = [
    { label: '-- Select Preset Image --', value: '' },
    { label: 'Mink Classic', value: 'mink classic.jpg' },
    { label: 'Mink Cat Eye', value: 'mink cat eye.jpg' },
    { label: 'Mink Cat Eye Hybrid', value: 'mink cat eye hybrid.jpg' },
    { label: 'Mink Cat Eye Volume', value: 'mink cat eye volume.jpg' },
    { label: 'Mink Classic (Bottom Lashes)', value: 'mink classic with bottom lashes.jpg' },
    { label: 'Mink Classic (Color Lashes)', value: 'mink classic with color lashes.jpg' },
    { label: 'Mink Hybrid', value: 'mink hybrid.jpg' },
    { label: 'Mink Hybrid (Bottom Lashes)', value: 'mink hybrid with bottom lashes.jpg' },
    { label: 'Mink Hybrid (Color Lashes)', value: 'mink hybrid with color lashes.jpg' },
    { label: 'Mink Volume', value: 'mink volume.jpg' },
    { label: 'Mink Volume (Bottom Lashes)', value: 'mink volume with bottom lashes.jpg' },
    { label: 'Mink Volume (Color Lashes)', value: 'mink volume with color lashes.jpg' },
    { label: 'Mink Wispy', value: 'mink wispy.jpg' },
    { label: 'Mink Wispy Volume', value: 'mink wispy volume.jpg' },
    { label: 'Mink Doll Eye', value: 'mink doll eye.jpg' },
    { label: 'Mink Natural Set', value: 'mink natural set.jpg' },
    { label: 'Mink Poster Highlight', value: 'mink poster.jpg' },
    { label: 'Mink Cover Picture', value: 'mink cover picture.jpg' },
    { label: 'Mega Volume Cover Photo', value: 'mega volume cover photo.jpeg' },
    { label: 'Mega Volume Cat Eye', value: 'mega volume cat eye.jpeg' },
    { label: 'Mega Volume Wispy', value: 'mega volume wispy.jpeg' },
    { label: 'Cluster Classic', value: 'cluster classic.jpg' },
    { label: 'Cluster Classic Cat Eye', value: 'cluster classic cat eye.jpg' },
    { label: 'Cluster Classic Wispy', value: 'cluster classic wispy.jpg' },
    { label: 'Cluster Classic (Bottom Lashes)', value: 'cluster classic with bottom lashes.jpg' },
    { label: 'Cluster Classic (Color Lashes)', value: 'cluster classic with color lashes.jpg' },
    { label: 'Cluster Hybrid', value: 'cluster hybrid.jpg' },
    { label: 'Cluster Hybrid Cat Eye', value: 'cluster hybrid cat eye.jpg' },
    { label: 'Cluster Hybrid Wispy', value: 'cluster hybrid wispy.jpg' },
    { label: 'Cluster Hybrid (Bottom Lashes)', value: 'cluster hybrid with bottoms.jpg' },
    { label: 'Cluster Hybrid (Color Lashes)', value: 'cluster hybrid color lashes.jpg' },
    { label: 'Cluster Volume', value: 'cluster volume.jpg' },
    { label: 'Cluster Volume Cat Eye', value: 'cluster volume cat eye.jpg' },
    { label: 'Cluster Volume Wispy', value: 'cluster volume wispy.jpg' },
    { label: 'Cluster Volume (Bottom Lashes)', value: 'cluster volume with bottom lashes.jpg' },
    { label: 'Cluster Volume (Color Lashes)', value: 'cluster volume with color lashes.jpg' },
    { label: 'Anime Style', value: 'anime image.jpeg' },
    { label: 'Consultation', value: 'consultation.jpg' },
];

const getImagePreviewSrc = (imageStr) => {
    if (!imageStr) return null;
    if (imageStr.startsWith('http') || imageStr.startsWith('data:') || imageStr.startsWith('/')) {
        return imageStr;
    }
    return `/images/${imageStr}`;
};

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
    const [imageMode, setImageMode] = useState('upload'); // 'upload' | 'preset' | 'custom'
    const [productToDelete, setProductToDelete] = useState(null);
    const fileInputRef = useRef(null);

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

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 15 * 1024 * 1024) {
                setError('Selected image file is too large (max 15MB)');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const maxDim = 1200;
                    if (width > maxDim || height > maxDim) {
                        if (width > height) {
                            height = Math.round((height * maxDim) / width);
                            width = maxDim;
                        } else {
                            width = Math.round((width * maxDim) / height);
                            height = maxDim;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
                    setFormData(prev => ({ ...prev, image: compressedDataUrl }));
                };
                img.src = reader.result;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.image) {
            setError('Please upload or select an image for the product.');
            return;
        }

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
                if (fileInputRef.current) fileInputRef.current.value = '';
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
        if (product.image?.startsWith('data:')) {
            setImageMode('upload');
        } else if (PRESET_IMAGES.some(p => p.value === product.image)) {
            setImageMode('preset');
        } else {
            setImageMode('custom');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const confirmDeleteProduct = async () => {
        if (!productToDelete) return;

        const token = localStorage.getItem('adminToken');
        try {
            const response = await fetch(apiUrl(`/api/products/${productToDelete._id}`), {
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
        } finally {
            setProductToDelete(null);
        }
    };

    const previewSrc = getImagePreviewSrc(formData.image);

    return (
        <div style={{ padding: '2rem', color: '#000000', maxWidth: '1200px', margin: '0 auto' }}>
            <button onClick={() => navigate('/admin')} className="btn btn-secondary" style={{ marginBottom: '1.5rem', cursor: 'pointer' }}>
                ← Back to Dashboard
            </button>

            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-pink, #FF1493)' }}>Manage Products</h2>

            {error && <div style={{ background: 'rgba(244, 67, 54, 0.1)', color: '#c62828', border: '1px solid rgba(244, 67, 54, 0.3)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Form Section */}
                <div style={{ background: '#ffffff', border: '2px solid rgba(255, 20, 147, 0.15)', padding: '1.5rem', borderRadius: '16px', boxShadow: 'var(--shadow-soft)' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '1.25rem', color: 'var(--primary-pink, #FF1493)' }}>{editingId ? 'Edit Product' : 'Add New Product'}</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: '#000' }}>Product Name</label>
                            <input name="name" placeholder="Product Name (e.g., Cat Eye)" value={formData.name} onChange={handleInputChange} required style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: '#000' }}>Description</label>
                            <textarea name="description" placeholder="Description" value={formData.description} onChange={handleInputChange} required rows="3" style={inputStyle} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: '#000' }}>Price (₵)</label>
                                <input name="price" type="number" placeholder="Price (e.g., 250)" value={formData.price} onChange={handleInputChange} required style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: '#000' }}>Duration</label>
                                <input name="duration" placeholder="Duration (e.g., 120 mins)" value={formData.duration} onChange={handleInputChange} required style={inputStyle} />
                            </div>
                        </div>

                        {/* Image Selection Area */}
                        <div style={{ background: '#fafafa', border: '1px solid rgba(255, 20, 147, 0.2)', padding: '1rem', borderRadius: '12px' }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.6rem', color: '#000' }}>Product Image</label>
                            
                            {/* Mode Selection Tabs */}
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setImageMode('upload')}
                                    style={{
                                        ...modeTabStyle,
                                        background: imageMode === 'upload' ? 'var(--primary-pink, #FF1493)' : '#e0e0e0',
                                        color: imageMode === 'upload' ? '#fff' : '#333'
                                    }}
                                >
                                    📁 Upload File
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setImageMode('preset')}
                                    style={{
                                        ...modeTabStyle,
                                        background: imageMode === 'preset' ? 'var(--primary-pink, #FF1493)' : '#e0e0e0',
                                        color: imageMode === 'preset' ? '#fff' : '#333'
                                    }}
                                >
                                    🖼️ Preset Library
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setImageMode('custom')}
                                    style={{
                                        ...modeTabStyle,
                                        background: imageMode === 'custom' ? 'var(--primary-pink, #FF1493)' : '#e0e0e0',
                                        color: imageMode === 'custom' ? '#fff' : '#333'
                                    }}
                                >
                                    🔗 Custom URL
                                </button>
                            </div>

                            {/* Mode Controls */}
                            {imageMode === 'upload' && (
                                <div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        style={{ ...inputStyle, padding: '0.5rem' }}
                                    />
                                    <p style={{ fontSize: '0.8rem', color: '#666', margin: '0.4rem 0 0' }}>Select an image file from your computer (PNG, JPG, WEBP).</p>
                                </div>
                            )}

                            {imageMode === 'preset' && (
                                <div>
                                    <select
                                        name="image"
                                        value={formData.image}
                                        onChange={handleInputChange}
                                        style={inputStyle}
                                    >
                                        {PRESET_IMAGES.map((img, idx) => (
                                            <option key={idx} value={img.value}>{img.label}</option>
                                        ))}
                                    </select>
                                    <p style={{ fontSize: '0.8rem', color: '#666', margin: '0.4rem 0 0' }}>Select an existing lash style image from the studio catalog.</p>
                                </div>
                            )}

                            {imageMode === 'custom' && (
                                <div>
                                    <input
                                        name="image"
                                        placeholder="Image URL or filename (e.g., https://... or mink classic.jpg)"
                                        value={formData.image}
                                        onChange={handleInputChange}
                                        style={inputStyle}
                                    />
                                </div>
                            )}

                            {/* Live Image Preview */}
                            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', background: '#fff', padding: '0.75rem', borderRadius: '8px', border: '1px dashed rgba(255, 20, 147, 0.4)' }}>
                                {previewSrc ? (
                                    <>
                                        <img
                                            src={previewSrc}
                                            alt="Preview"
                                            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #FF1493' }}
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                        <div style={{ fontSize: '0.85rem', color: '#444', wordBreak: 'break-all' }}>
                                            <strong style={{ color: '#FF1493' }}>Selected Image:</strong>
                                            <div style={{ marginTop: '0.2rem', maxHeight: '40px', overflow: 'hidden' }}>
                                                {formData.image.startsWith('data:') ? 'Uploaded Image File (Base64)' : formData.image}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ fontSize: '0.85rem', color: '#888', fontStyle: 'italic' }}>
                                        📷 No image selected yet. Choose a file or preset above.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: '#000' }}>Lash Category / Type</label>
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
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: '#000' }}>Extra Option</label>
                                <select name="extra" value={formData.extra} onChange={handleInputChange} style={inputStyle}>
                                    <option value="no">Is Extra? No</option>
                                    <option value="yes">Is Extra? Yes</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem', color: '#000' }}>Poster Highlight</label>
                                <select name="poster" value={formData.poster} onChange={handleInputChange} style={inputStyle}>
                                    <option value="no">Is Poster? No</option>
                                    <option value="yes">Is Poster? Yes</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                            <button type="submit" style={{ ...buttonStyle, flex: 1, background: editingId ? '#ff8c00' : 'var(--primary-pink, #FF1493)' }}>
                                {editingId ? 'Update Product' : 'Add Product'}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingId(null);
                                        setFormData({ name: '', description: '', price: '', duration: '', image: '', type: 'mink classic', extra: 'no', poster: 'no' });
                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                    }}
                                    style={{ ...buttonStyle, background: '#666' }}
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* List Section */}
                <div style={{ background: '#ffffff', border: '2px solid rgba(255, 20, 147, 0.15)', padding: '1.5rem', borderRadius: '16px', maxHeight: '80vh', overflowY: 'auto', boxShadow: 'var(--shadow-soft)' }}>
                    {(() => {
                        const displayedProducts = products.filter(p => !isCategoryBanner(p));
                        return (
                            <>
                                <h3 style={{ marginTop: 0, marginBottom: '1.25rem', color: 'var(--primary-pink, #FF1493)' }}>Existing Products ({displayedProducts.length})</h3>
                                {loading ? (
                                    <p style={{ color: '#666' }}>Loading products...</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {displayedProducts.map(product => (
                                            <div key={product._id} style={{ background: '#f8f8f8', border: '1px solid rgba(255, 20, 147, 0.15)', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    {product.image && (
                                                        <img
                                                            src={getImagePreviewSrc(product.image)}
                                                            alt={product.name}
                                                            style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255, 20, 147, 0.4)' }}
                                                        />
                                                    )}
                                                    <div>
                                                        <strong style={{ color: '#000000', fontSize: '1rem' }}>{product.name}</strong>
                                                        <div style={{ fontSize: '0.85rem', color: '#666666', marginTop: '0.2rem' }}>{product.type} • ₵{product.price}</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button onClick={() => handleEdit(product)} style={{ ...smallButtonStyle, background: '#007bff' }}>Edit</button>
                                                    <button onClick={() => setProductToDelete(product)} style={{ ...smallButtonStyle, background: '#dc3545' }}>Delete</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </div>
            </div>

            <ConfirmModal
                isOpen={Boolean(productToDelete)}
                title="Delete Product"
                message={productToDelete ? `Are you sure you want to delete "${productToDelete.name}"? This action cannot be undone.` : ''}
                confirmText="Delete Product"
                cancelText="Cancel"
                confirmVariant="danger"
                onConfirm={confirmDeleteProduct}
                onCancel={() => setProductToDelete(null)}
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

const modeTabStyle = {
    flex: 1,
    padding: '0.4rem 0.6rem',
    border: 'none',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
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

export default AdminProducts;