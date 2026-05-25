import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { scrollPageToTopAfterPaint } from '../utils/scrollPageToTop';

const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    scrollPageToTopAfterPaint();
  }, [location.pathname, location.search, location.key]);

  return null;
};

export default ScrollToTop;
