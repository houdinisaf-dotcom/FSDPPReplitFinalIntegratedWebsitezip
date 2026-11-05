import { productImagesForDisplay, safe } from './catalogue-data.js';
import { trackEvent } from './analytics.js';
import { outlineIcon } from './brand/outline-icons.js';
import { showCartToast } from './motion-runtime.js';

export const CLIENT_BAG_STORAGE_KEY = 'fsd-client-bag-v1';
export const MAX_BAG_QUANTITY = 99;

function normalizeVariant(variant = {}) {
  return {
    size: String(variant?.size ?? '').trim().slice(0, 80),
    colourway: String(variant?.colourway ?? '').trim().slice(0, 80),
  };
}

function makeLineId(productId, variant = {}) {
  const normalized = normalizeVariant(variant);
  return normalized.size || normalized.colourway
    ? JSON.stringify([productId, normalized.size, normalized.colourway])
    : String(productId);
}

function parseLineId(lineId) {
  if (/^\d+$/.test(String(lineId))) {
    return { productId: Number(lineId), size: '', colourway: '' };
  }
  try {
    const [productId, size = '', colourway = ''] = JSON.parse(lineId);
    if (!Number.isInteger(Number(productId))) return null;
    return { productId: Number(productId), ...normalizeVariant({ size, colourway }) };
  } catch {
    return null;
  }
}

function resolveLineId(idOrLineId, variant = {}) {
  if (typeof idOrLineId === 'string' && idOrLineId.startsWith('[')) return idOrLineId;
  const productId = Number(idOrLineId);
  return Number.isInteger(productId) ? makeLineId(productId, variant) : '';
}

export function getBagEligibilityIssues(product) {
  const id = Number(product?.id);
  const price = Number(product?.confirmedPrice);
  const priceNotes = `${product?.priceBasis ?? ''} ${product?.notes ?? ''}`;
  const imageStatus = String(product?.imageStatus ?? '');
  const stockStatus = String(product?.stockStatus ?? product?.availability ?? '').trim();
  const stockQuantity = Number(product?.stockQuantity);
  const hasPositiveStock = Number.isSafeInteger(stockQuantity) && stockQuantity > 0;
  const hasAvailableStockStatus = /^(?:in[\s-]?stock|available(?: now)?)$/i.test(stockStatus);
  const hasApprovedStandaloneMedia = productImagesForDisplay(product).length > 0
    && /\b(?:approved|standalone)\b/i.test(imageStatus)
    && !/\b(?:concept board|collage|contact sheet|placeholder|not confirmed|no image|brief only|reference only|pending|unconfirmed|unapproved)\b/i.test(imageStatus)
    && !/\bnot\s+(?:approved|standalone)\b/i.test(imageStatus);
  const issues = [];

  if (!Number.isInteger(id) || id <= 0) issues.push('product identity');
  if (product?.publicationStatus !== 'Active') issues.push('active publication status');
  if (!Number.isFinite(price) || price <= 0 || /\b(?:reference only|not for sale)\b/i.test(priceNotes)) {
    issues.push('confirmed price');
  }
  if (typeof product?.sku !== 'string' || !product.sku.trim() || /^(?:tbd|pending|unassigned)$/i.test(product.sku.trim())) {
    issues.push('SKU');
  }
  if (!hasPositiveStock && !hasAvailableStockStatus) issues.push('confirmed in-stock status');
  if (!hasApprovedStandaloneMedia) issues.push('approved standalone product media');

  return issues;
}

export function canAddToBag(product) {
  return getBagEligibilityIssues(product).length === 0;
}

function resolveStorage(storage) {
  if (storage !== undefined) return storage;
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function createClientBag(products, storage) {
  const eligibleProducts = new Map(
    products.filter(canAddToBag).map(product => [Number(product.id), product]),
  );
  const persistedStorage = resolveStorage(storage);
  let quantities = {};

  try {
    const saved = JSON.parse(persistedStorage?.getItem(CLIENT_BAG_STORAGE_KEY) || '{}');
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      quantities = {};
      for (const [storedLineId, storedQuantity] of Object.entries(saved)) {
        const line = parseLineId(storedLineId);
        const quantity = Number(storedQuantity);
        if (!line || !eligibleProducts.has(line.productId) || !Number.isInteger(quantity) || quantity <= 0) continue;
        const lineId = makeLineId(line.productId, line);
        quantities[lineId] = Math.min(quantity, MAX_BAG_QUANTITY);
      }
    }
  } catch {
    quantities = {};
  }

  const persist = () => {
    try {
      persistedStorage?.setItem(CLIENT_BAG_STORAGE_KEY, JSON.stringify(quantities));
    } catch {
      // The bag remains usable for this page view when browser storage is unavailable.
    }
  };

  const remove = (idOrLineId, variant = {}) => {
    const lineId = resolveLineId(idOrLineId, variant);
    if (!Object.hasOwn(quantities, lineId)) return false;
    delete quantities[lineId];
    persist();
    return true;
  };

  return Object.freeze({
    add(id, amount = 1, variant = {}) {
      const numericId = Number(id);
      const numericAmount = Number(amount);
      if (!eligibleProducts.has(numericId) || !Number.isInteger(numericAmount) || numericAmount < 1) {
        return false;
      }
      const lineId = makeLineId(numericId, variant);
      quantities[lineId] = Math.min(
        MAX_BAG_QUANTITY,
        (quantities[lineId] || 0) + numericAmount,
      );
      persist();
      return true;
    },
    setQuantity(idOrLineId, quantity, variant = {}) {
      const lineId = resolveLineId(idOrLineId, variant);
      const numericQuantity = Number(quantity);
      const line = parseLineId(lineId);
      if (!line || !eligibleProducts.has(line.productId) || !Number.isInteger(numericQuantity)) return false;
      if (numericQuantity <= 0) return remove(lineId);
      if (!Object.hasOwn(quantities, lineId)) return false;
      quantities[lineId] = Math.min(numericQuantity, MAX_BAG_QUANTITY);
      persist();
      return true;
    },
    remove,
    clear() {
      quantities = {};
      persist();
    },
    items() {
      return Object.entries(quantities).map(([lineId, quantity]) => {
        const line = parseLineId(lineId);
        const product = eligibleProducts.get(line.productId);
        const unitAmount = Math.round(product.confirmedPrice * 100);
        return Object.freeze({
          product,
          productId: line.productId,
          lineId,
          size: line.size,
          colourway: line.colourway,
          quantity,
          unitAmount,
          lineAmount: unitAmount * quantity,
        });
      });
    },
    itemCount() {
      return Object.values(quantities).reduce((sum, quantity) => sum + quantity, 0);
    },
    subtotal() {
      return this.items().reduce((sum, item) => sum + item.lineAmount, 0);
    },
  });
}

const formatMoney = amount => new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
}).format(amount / 100);

export function mountClientBag({ products, documentRef = globalThis.document } = {}) {
  const trigger = documentRef?.querySelector?.('[data-bag-open]');
  if (!trigger || !documentRef.body) {
    throw new TypeError('mountClientBag requires the FSD bag button and document body.');
  }

  const bag = createClientBag(products);
  const dialog = documentRef.createElement('dialog');
  dialog.id = 'fsd-bag-dialog';
  dialog.className = 'fsd-bag-dialog';
  dialog.setAttribute('aria-labelledby', 'fsd-bag-title');
  dialog.innerHTML = `
    <div class="fsd-bag-shell">
      <header class="fsd-bag-header">
        <div>
          <p class="fsd-bag-kicker">FSD / YOUR SELECTION</p>
          <h2 id="fsd-bag-title">Your bag</h2>
        </div>
        <button type="button" class="fsd-bag-close" data-bag-close aria-label="Close bag">${outlineIcon('close')}</button>
      </header>
      <div class="fsd-bag-body">
        <p class="fsd-bag-status" data-bag-status role="status" aria-live="polite"></p>
        <div class="fsd-bag-lines" data-bag-lines></div>
      </div>
      <footer class="fsd-bag-footer">
        <div class="fsd-bag-subtotal"><span>Subtotal</span><strong data-bag-subtotal>£0.00</strong></div>
        <p class="fsd-bag-note">No payment provider or checkout is integrated; no order is processed.</p>
        <button type="button" class="fsd-bag-checkout" disabled aria-disabled="true">Checkout disabled</button>
      </footer>
    </div>`;
  documentRef.body.append(dialog);
  const toast = documentRef.createElement('div');
  toast.className = 'fsd-add-toast';
  toast.dataset.cartToast = '';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.hidden = true;
  documentRef.body.append(toast);
  const placeToastForLayer = () => {
    const productDialog = documentRef.querySelector('#product-dialog');
    const destination = productDialog?.open ? productDialog : documentRef.body;
    if (toast.parentElement !== destination) destination.append(toast);
  };

  const count = trigger.querySelector('[data-bag-count]');
  const lines = dialog.querySelector('[data-bag-lines]');
  const subtotal = dialog.querySelector('[data-bag-subtotal]');
  const status = dialog.querySelector('[data-bag-status]');
  let returnFocus = null;

  const render = () => {
    const items = bag.items();
    const itemCount = bag.itemCount();
    count.textContent = String(itemCount);
    trigger.setAttribute('aria-label', `Open bag, ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`);
    trigger.setAttribute('aria-expanded', String(dialog.open));
    subtotal.textContent = formatMoney(bag.subtotal());

    lines.innerHTML = items.length
      ? `<ul class="fsd-bag-list">${items.map(({ product, quantity, unitAmount, lineAmount, lineId, size, colourway }) => `
          <li class="fsd-bag-item">
            <div class="fsd-bag-item-copy">
              <h3>${safe(product.name)}</h3>
              <p>${safe(product.category)} · ${formatMoney(unitAmount)} each</p>
              ${(size || colourway) ? `<p>${[size && `Size: ${size}`, colourway && `Colour: ${colourway}`].filter(Boolean).map(safe).join(' · ')}</p>` : ''}
            </div>
            <strong class="fsd-bag-line-total">${formatMoney(lineAmount)}</strong>
            <div class="fsd-bag-item-controls" role="group" aria-label="Quantity for ${safe(product.name)}">
              <button type="button" data-bag-quantity="-1" data-bag-line-id="${safe(lineId)}"
                aria-label="Decrease quantity of ${safe(product.name)}">${outlineIcon('minus')}</button>
              <span aria-live="polite">${quantity}</span>
              <button type="button" data-bag-quantity="1" data-bag-line-id="${safe(lineId)}"
                aria-label="Increase quantity of ${safe(product.name)}">${outlineIcon('plus')}</button>
              <button type="button" class="fsd-bag-remove" data-bag-remove data-bag-line-id="${safe(lineId)}">
                Remove <span class="sr-only">${safe(product.name)}</span>
              </button>
            </div>
          </li>`).join('')}</ul>
          <button type="button" class="fsd-bag-clear" data-bag-clear>Clear bag</button>`
      : '<p class="fsd-bag-empty">Your bag is empty.</p>';
  };

  const open = (opener = trigger) => {
    if (dialog.open) return;
    returnFocus = opener?.isConnected ? opener : trigger;
    dialog.showModal();
    dialog.querySelector('[data-bag-close]')?.focus({ preventScroll: true });
    render();
    trackEvent('bag_opened', {
      item_count: bag.items().length,
      unit_count: bag.itemCount(),
    });
  };

  const addToBag = (id, variant = {}, quantity = 1) => {
    const product = products.find(item => Number(item.id) === Number(id));
    const added = bag.add(id, quantity, variant);
    if (added) {
      const variantText = [
        variant.size && `size ${variant.size}`,
        variant.colourway && variant.colourway,
      ].filter(Boolean).join(' / ');
      const quantityText = quantity > 1 ? `${quantity} × ` : '';
      status.textContent = `${quantityText}${product.name}${variantText ? `, ${variantText}` : ''} added to your bag. Checkout is disabled.`;
      placeToastForLayer();
      showCartToast(toast, `${quantityText}${product.name}${variantText ? ` · ${variantText}` : ''} added to your bag. Checkout is disabled.`);
      render();
      trackEvent('product_added_to_bag', {
        product_id: product.id,
        product_category: product.category,
        product_quantity: quantity,
        product_size: variant.size || undefined,
        product_colourway: variant.colourway || undefined,
      });
    } else {
      status.textContent = 'This item is not available in the client-side bag.';
    }
    return added;
  };

  documentRef.addEventListener('click', event => {
    const openButton = event.target.closest?.('[data-bag-open]');
    if (openButton) {
      open(openButton);
      return;
    }
  });

  dialog.addEventListener('click', event => {
    if (event.target === dialog || event.target.closest?.('[data-bag-close]')) {
      dialog.close();
      return;
    }
    if (event.target.closest?.('[data-bag-clear]')) {
      bag.clear();
      status.textContent = 'Your bag has been cleared.';
      render();
      return;
    }
    const removeButton = event.target.closest?.('[data-bag-remove]');
    if (removeButton) {
      bag.remove(removeButton.dataset.bagLineId);
      status.textContent = 'Item removed from your bag.';
      render();
      return;
    }
    const quantityButton = event.target.closest?.('[data-bag-quantity]');
    if (quantityButton) {
      const lineId = quantityButton.dataset.bagLineId;
      const current = bag.items().find(item => item.lineId === lineId)?.quantity || 0;
      bag.setQuantity(lineId, current + Number(quantityButton.dataset.bagQuantity));
      status.textContent = 'Bag quantity updated.';
      render();
    }
  });

  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    dialog.close('escape');
  });

  dialog.addEventListener('close', () => {
    trigger.setAttribute('aria-expanded', 'false');
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
  });

  render();
  return Object.freeze({ addToBag, open, bag });
}
