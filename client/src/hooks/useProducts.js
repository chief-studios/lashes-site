import { useState, useEffect } from 'react';
import { products as staticProducts } from '../data/products';
import { apiUrl } from '../config/api';

export const useProducts = () => {
    const [products, setProducts] = useState(staticProducts);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const response = await fetch(apiUrl('/api/products'));
                if (response.ok) {
                    const dynamicProducts = await response.json();

                    // Map dynamic products to match the static product structure
                    const mappedProducts = dynamicProducts.map(p => ({
                        id: p._id, // MongoDB ObjectId (string)
                        name: p.name,
                        description: p.description,
                        price: p.price,
                        duration: p.duration,
                        // Serve from public folder dynamically
                        image: p.image.startsWith('http') ? p.image : `/images/${p.image}`,
                        type: p.type,
                        extra: p.extra,
                        poster: p.poster
                    }));

                    // Merge static and dynamic products. 
                    // (Static IDs are numbers, Dynamic IDs are strings, so no collisions)
                    setProducts([...staticProducts, ...mappedProducts]);
                } else {
                    console.warn('Failed to fetch dynamic products, using static fallback.');
                }
            } catch (err) {
                console.error('Error fetching dynamic products, using static fallback:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    return { products, loading, error };
};