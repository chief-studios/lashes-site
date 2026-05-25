/** Matches fixed nav + .service-page margin-top */
export const NAV_SCROLL_OFFSET = 80;

export function scrollPageToTop(behavior = 'auto') {
  window.scrollTo({ top: 0, left: 0, behavior });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

export function scrollElementBelowNav(element, behavior = 'auto') {
  if (!element) {
    scrollPageToTop(behavior);
    return;
  }
  const top = element.getBoundingClientRect().top + window.scrollY - NAV_SCROLL_OFFSET;
  window.scrollTo({ top: Math.max(0, top), left: 0, behavior });
}

/** Run after layout so scroll wins over browser restoration / late renders */
export function scrollPageToTopAfterPaint() {
  scrollPageToTop('auto');
  requestAnimationFrame(() => {
    scrollPageToTop('auto');
    requestAnimationFrame(() => scrollPageToTop('auto'));
  });
}
