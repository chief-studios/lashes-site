import { useState, useEffect, useCallback } from 'react';

export function useOrderToast(durationMs = 2500) {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), durationMs);
    return () => clearTimeout(timer);
  }, [toast, durationMs]);

  const showOrderToast = useCallback((message) => {
    setToast({ message, id: Date.now() });
  }, []);

  return { toast, showOrderToast };
}
