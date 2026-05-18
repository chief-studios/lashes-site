/**
 * Context-aware steps for the "How to order" tip on lash service pages.
 */
export function getHowToOrderSteps(selectedGroup, selectedProductDetails) {
  if (selectedProductDetails) {
    return [
      'Refine your style with optional extras.',
      'Every touch updates your Order Summary — add or remove at will.',
    ];
  }

  if (selectedGroup) {
    return [
      'Pick your main style.',
      'Tap the look you love to add it to your Order Summary.',
    ];
  }

  return [
    'Pick your main style — begin with Classic, Hybrid, or Volume.',
    'Each collection reveals the looks curated for you.',
  ];
}
