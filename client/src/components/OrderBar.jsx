import React from 'react';

function buildSummaryLine(mainProduct, extras, colorLabel) {
  const colorSuffix = colorLabel ? ` · ${colorLabel}` : '';
  if (mainProduct && extras.length > 0) {
    const extraLabel = extras.length === 1 ? '1 extra' : `${extras.length} extras`;
    return `${mainProduct.name} · ${extraLabel}${colorSuffix}`;
  }
  if (mainProduct) return `${mainProduct.name}${colorSuffix}`;
  if (extras.length === 1) return `${extras[0].name}${colorSuffix}`;
  return `${extras.length} items${colorSuffix}`;
}

export default function OrderBar({
  mainProduct,
  extras = [],
  totalPrice,
  depositAmount,
  onProceed,
  canProceed,
  colorLabel = null,
}) {
  const hasItems = Boolean(mainProduct) || extras.length > 0;
  if (!hasItems) return null;

  return (
    <aside className="order-bar" role="complementary" aria-label="Your order">
      <div className="order-bar__inner">
        <div className="order-bar__summary">
          <span className="order-bar__eyebrow">Your order</span>
          <span className="order-bar__line">{buildSummaryLine(mainProduct, extras, colorLabel)}</span>
          <span className="order-bar__meta">
            Total ₵{totalPrice.toFixed(2)}
            <span className="order-bar__deposit"> · 40% deposit ₵{depositAmount.toFixed(2)}</span>
          </span>
        </div>
        <button
          type="button"
          className="order-bar__cta"
          onClick={onProceed}
          disabled={!canProceed}
        >
          Proceed to payment
        </button>
      </div>
    </aside>
  );
}
