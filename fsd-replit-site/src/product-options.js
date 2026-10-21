import { safe } from './catalogue-data.js';
import { getVariantGallery } from './catalogue-model.js';

const statusLabel = value => ({
  Draft: 'DRAFT',
  'Awaiting Images': 'AWAITING IMAGES',
  'Awaiting Approval': 'AWAITING APPROVAL',
  Approved: 'APPROVED · NOT FOR SALE',
  Published: 'PUBLISHED · PURCHASE DISABLED',
}[value] || 'AWAITING APPROVAL');

export function productVariants(product) {
  return Array.isArray(product?.catalogue?.variants) ? product.catalogue.variants : [];
}

export function productVariantGallery(product, variantId) {
  if (variantId == null) return Array.isArray(product?.images) ? product.images : [];
  const images = getVariantGallery(product, variantId);
  return Array.isArray(images) ? images : [];
}

export function productVariantSizes(product, variantId) {
  const catalogue = product?.catalogue;
  const variant = productVariants(product).find(item => String(item.id) === String(variantId));
  if (variant && Array.isArray(variant.sizes)) return variant.sizes;
  return Array.isArray(catalogue?.sizes) ? catalogue.sizes : [];
}

export function renderProductSizes(product, variantId, selectedSize = null) {
  const sizes = productVariantSizes(product, variantId);
  if (!sizes.length) return '';
  return `<div class="product-options-sizes"><span class="product-options-label">Size</span>
    <div class="product-size-options" role="group" aria-label="Available sizes">
      ${sizes.map(size => `<button class="product-size-option" type="button" data-size-option="${safe(size)}" aria-pressed="${String(size) === String(selectedSize)}">${safe(size)}</button>`).join('')}
    </div></div>`;
}

export function renderProductOptions(product, selectedVariantId = null) {
  const catalogue = product?.catalogue;
  if (!catalogue) return '';
  const variants = productVariants(product);
  const selected = variants.find(variant => String(variant.id) === String(selectedVariantId)) || variants[0] || null;
  const contentStatus = statusLabel(catalogue.editorialStatus);
  const currentColour = selected?.colour || '';
  const sku = selected?.sku || '';
  const selectedUnavailable = selected?.stock === 0 || selected?.availability === 'unavailable';
  const selectedHasImages = selected ? productVariantGallery(product, selected.id).length > 0 : false;
  const initialVariantStatus = selectedUnavailable
    ? selectedHasImages
      ? 'Unavailable · image preview shown for identification only. Not available to purchase.'
      : 'Unavailable · approved imagery is not available for this colourway.'
    : selectedHasImages
      ? 'Development record · not available to purchase.'
      : 'Approved imagery is not available for this colourway.';
  return `<div class="product-content-status" data-product-content-status="${safe(catalogue.editorialStatus || 'Awaiting Approval')}">${safe(contentStatus)}</div>
    <section class="product-options" aria-label="Product options">
      <div class="product-options-header">
        <span class="product-options-label">Colour</span>
        <span class="product-selected-colour" data-selected-colour>${safe(currentColour || 'To be confirmed')}</span>
      </div>
      ${sku ? `<div class="product-selected-sku" data-selected-sku>SKU ${safe(sku)}</div>` : ''}
      ${variants.length ? `<div class="product-colour-options" role="group" aria-label="Choose a colourway">
        ${variants.map(variant => {
          const active = selected && String(selected.id) === String(variant.id);
          const imageState = productVariantGallery(product, variant.id).length ? 'available' : 'awaiting-image';
          const unavailable = variant.stock === 0 || variant.availability === 'unavailable';
          const known = variant.sku ? `, SKU ${safe(variant.sku)}` : '';
          const imageLabel = imageState === 'available' ? '' : ', image not available';
          const availabilityLabel = unavailable ? ', unavailable' : '';
          const swatch = /^#[\da-f]{6}$/i.test(String(variant.swatch || '')) ? variant.swatch : '';
          return `<button class="product-colour-option" type="button" data-colour-option data-variant-id="${safe(variant.id)}"
            data-image-state="${safe(imageState)}" data-availability="${unavailable ? 'unavailable' : safe(variant.availability || 'unconfirmed')}" aria-pressed="${Boolean(active)}"
            aria-label="${safe(variant.colour)}${known}${imageLabel}${availabilityLabel}">${swatch ? `<i class="product-option-swatch" aria-hidden="true" style="--option-swatch:${safe(swatch)}"></i>` : ''}<span>${safe(variant.colour)}</span>${unavailable ? '<small class="product-option-unavailable-label">UNAVAILABLE</small>' : ''}</button>`;
        }).join('')}
      </div>` : ''}
      <div data-size-options-container>${renderProductSizes(product, selected?.id, null)}</div>
      <p class="product-options-status" data-variant-status role="status" aria-live="polite">${safe(initialVariantStatus)}</p>
    </section>`;
}
