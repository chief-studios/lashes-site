import { useEffect } from 'react';
import { scrollElementBelowNav, scrollPageToTopAfterPaint } from '../utils/scrollPageToTop';

/**
 * Keep cluster/mink service pages starting at the top on load and when drilling into styles/extras.
 */
export function useServicePageScroll(productsSectionRef, { selectedGroup, selectedProductId }) {
  useEffect(() => {
    scrollPageToTopAfterPaint();
  }, []);

  useEffect(() => {
    if (selectedGroup == null) return;
    const frame = requestAnimationFrame(() => {
      scrollElementBelowNav(productsSectionRef.current);
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedGroup, productsSectionRef]);

  useEffect(() => {
    if (!selectedProductId) return;
    const frame = requestAnimationFrame(() => {
      scrollElementBelowNav(productsSectionRef.current);
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedProductId, productsSectionRef]);
}
