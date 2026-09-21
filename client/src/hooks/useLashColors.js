import { useState, useEffect } from 'react';
import { apiUrl } from '../config/api';

export const useLashColors = () => {
    const [lashColors, setLashColors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const fetchLashColors = async () => {
            try {
                const response = await fetch(apiUrl('/api/lash-colors'));
                if (response.ok) {
                    const dynamicColors = await response.json();
                    if (isMounted) {
                        const mappedColors = dynamicColors.map(c => ({
                            id: c._id,
                            value: c.value,
                            label: c.label,
                            swatch: c.swatch
                        }));
                        setLashColors(mappedColors);
                    }
                } else {
                    console.warn('Failed to fetch dynamic lash colors from DB');
                }
            } catch (err) {
                console.error('Error fetching dynamic lash colors:', err);
                if (isMounted) setError(err.message);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchLashColors();
        return () => { isMounted = false; };
    }, []);

    return { lashColors, loading, error };
};
