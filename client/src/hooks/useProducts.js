import { useState, useEffect } from 'react';
import { apiUrl } from '../config/api';

export const useProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const fetchProducts = async () => {
            try {
                const response = await fetch(apiUrl('/api/products'));
                if (response.ok) {
                    const dynamicProducts = await response.json();
                    if (isMounted) {
                        const mappedProducts = dynamicProducts.map(p => ({
                            id: p._id, // MongoDB ObjectId (string)
                            name: p.name,
                            description: p.description,
                            price: p.price,
                            duration: p.duration,
                            image: (p.image.startsWith('http') || p.image.startsWith('data:') || p.image.startsWith('/'))
                                ? p.image
                                : `/images/${p.image}`,
                            type: p.type,
                            extra: p.extra,
                            poster: p.poster
                        }));
                        setProducts(mappedProducts);
                    }
                } else {
                    console.warn('Failed to fetch dynamic products from DB');
                }
            } catch (err) {
                console.error('Error fetching dynamic products:', err);
                if (isMounted) setError(err.message);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchProducts();
        return () => { isMounted = false; };
    }, []);

    return { products, loading, error };
};