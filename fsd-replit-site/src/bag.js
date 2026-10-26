import { safe } from './catalogue-data.js';
import { trackEvent } from './analytics.js';
import { outlineIcon } from './brand/outline-icons.js';

export const CLIENT_BAG_STORAGE_KEY = 'fsd-client-bag-v1';
const MAX_QUANTITY = 99;

export function canAddToBag(product) {
  const id = Number(product?.id);
  const price = Number(product?.confirmedPrice);
  const priceNotes = `${product?.priceBasis ?? ''} ${product?.notes ?? ''}`;
  return Number.isInteger(id) &&
    Number.isFinite(price) &&
    price > 0 &&
    !/\b(?:reference only|not for sale)\b/i.test(priceNotes);
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
      quantities = Object.fromEntries(
        Object.entries(saved)
          .map(([id, quantity]) => [Number(id), Number(quantity)])
          .filter(([id, quantity]) =>
            eligibleProducts.has(id) &&
            Number.isInteger(quantity) &&
            quantity > 0
          )
          .map(([id, quantity]) => [id, Math.min(quantity, MAX_QUANTITY)]),
      );
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

  const remove = id => {
    const numericId = Number(id);
    if (!Object.hasOwn(quantities, numericId)) return false;
    delete quantities[numericId];
    persist();
    return true;
  };

  return Object.freeze({
    add(id, amount = 1) {
      const numericId = Number(id);
      const numericAmount = Number(amount);
      if (!eligibleProducts.has(numericId) || !Number.isInteger(numericAmount) || numericAmount < 1) {
        return false;
      }
      quantities[numericId] = Math.min(
        MAX_QUANTITY,
        (quantities[numericId] || 0) + numericAmount,
      );
      persist();
      return true;
    },
    setQuantity(id, quantity) {
      const numericId = Number(id);
      const numericQuantity = Number(quantity);
      if (!eligibleProducts.has(numericId) || !Number.isInteger(numericQuantity)) return false;
      if (numericQuantity <= 0) return remove(numericId);
      quantities[numericId] = Math.min(numericQuantity, MAX_QUANTITY);
      persist();
      return true;
    },
    remove,
    clear() {
      quantities = {};
      persist();
    },
    items() {
      return Object.entries(quantities).map(([id, quantity]) => {
        const product = eligibleProducts.get(Number(id));
        const unitAmount = Math.round(product.confirmedPrice * 100);
        return Object.freeze({
          product,
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
        <p class="fsd-bag-note">Payment is not available here. No order is processed.</p>
        <button type="button" class="fsd-bag-checkout" disabled aria-disabled="true">Checkout disabled</button>
      </footer>
    </div>`;
  documentRef.body.append(dialog);

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
      ? `<ul class="fsd-bag-list">${items.map(({ product, quantity, unitAmount, lineAmount }) => `
          <li class="fsd-bag-item">
            <div class="fsd-bag-item-copy">
              <h3>${safe(product.name)}</h3>
              <p>${safe(product.category)} · ${formatMoney(unitAmount)} each</p>
            </div>
            <strong class="fsd-bag-line-total">${formatMoney(lineAmount)}</strong>
            <div class="fsd-bag-item-controls" role="group" aria-label="Quantity for ${safe(product.name)}">
              <button type="button" data-bag-quantity="-1" data-product-id="${product.id}"
                aria-label="Decrease quantity of ${safe(product.name)}">${outlineIcon('minus')}</button>
              <span aria-live="polite">${quantity}</span>
              <button type="button" data-bag-quantity="1" data-product-id="${product.id}"
                aria-label="Increase quantity of ${safe(product.name)}">${outlineIcon('plus')}</button>
              <button type="button" class="fsd-bag-remove" data-bag-remove data-product-id="${product.id}">
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

  const addToBag = id => {
    const product = products.find(item => Number(item.id) === Number(id));
    const added = bag.add(id);
    if (added) {
      status.textContent = `${product.name} added to your bag. Checkout is disabled.`;
      render();
      trackEvent('product_added_to_bag', {
        product_id: product.id,
        product_category: product.category,
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
      bag.remove(removeButton.dataset.productId);
      status.textContent = 'Item removed from your bag.';
      render();
      return;
    }
    const quantityButton = event.target.closest?.('[data-bag-quantity]');
    if (quantityButton) {
      const productId = quantityButton.dataset.productId;
      const current = bag.items().find(item => item.product.id === Number(productId))?.quantity || 0;
      bag.setQuantity(productId, current + Number(quantityButton.dataset.bagQuantity));
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
