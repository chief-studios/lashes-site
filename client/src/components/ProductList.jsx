import React from 'react';
import { useProducts } from '../hooks/useProducts';
import '../styles/base.css';
import '../styles/home.css';

const ProductList = () => {
    const { products, loading } = useProducts();

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>Loading products...</div>;
    }

    return (
        <div className="product-grid">
            {products.map(product => (
                <div key={product.id || product._id} className="product-card">
                    <div className="product-image">
                        <img src={product.image} alt={product.name} />
                    </div>
                    <div className="product-info">
                        <h3>{product.name}</h3>
                        <p className="product-description">{product.description}</p>
                        <div className="product-details">
                            <span className="duration">{product.duration}</span>
                            <span className="price">₵{product.price}</span>
                        </div>
                        <span className="category">{product.type}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ProductList;