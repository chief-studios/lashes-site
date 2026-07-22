/** Category cover banners — shown on category cards only, not bookable styles. */
export function isCategoryBanner(product) {
  return product?.isCategoryCover === true || product?.poster === 'yes';
}

/** Main bookable styles (excludes extras and category banners). */
export function isMainStyle(product) {
  return product?.extra !== 'yes' && !isCategoryBanner(product);
}

export function countMainStyles(items) {
  return items.filter(isMainStyle).length;
}

export function getCategoryCoverImage(items) {
  const banner = items.find(isCategoryBanner);
  if (banner?.image) return banner.image;
  const firstMain = items.find(isMainStyle);
  if (firstMain?.image) return firstMain.image;
  return items[0]?.image;
}

export function filterBookableProducts(items) {
  return items.filter((product) => !isCategoryBanner(product));
}

export function separateStylesAndExtras(items) {
  const mainStyles = items.filter(isMainStyle);
  const extras = items.filter((product) => product.extra === 'yes');
  return { mainStyles, extras };
}
