export function trackEvent(name, data) {
  if (typeof window === 'undefined') return;

  try {
    window.umami?.track(name, data);
  } catch {
    // Analytics must never interfere with storefront interactions.
  }
}

/**
 * Record a completed purchase only from a handler that has received
 * server-confirmed payment success. Never call this from bag or checkout UI.
 */
export function trackCompletedPurchase({ paymentStatus, orderValueMinor, currency } = {}) {
  if (paymentStatus !== 'succeeded') return;
  if (!Number.isSafeInteger(orderValueMinor) || orderValueMinor <= 0) return;
  if (currency !== 'GBP') return;

  trackEvent('purchase_completed', {
    order_value: orderValueMinor / 100,
    currency,
  });
}
