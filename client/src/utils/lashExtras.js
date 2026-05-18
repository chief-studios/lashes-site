export function isColorLashExtra(productName) {
  return Boolean(productName?.toLowerCase().includes('color'));
}

export function formatExtraOrderLabel(extra, colorLabel) {
  if (isColorLashExtra(extra?.name) && colorLabel) {
    return `${extra.name}: ${colorLabel}`;
  }
  return extra.name;
}
