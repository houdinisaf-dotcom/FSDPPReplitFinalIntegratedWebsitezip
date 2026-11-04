import { imagePlaceholderMarkup } from './image-placeholder.js';
import { imageSwatchBackground, productImagesForDisplay } from './data/products.js';

const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

export function productColourwayOptions(product) {
  if (Array.isArray(product?.rowColourways)) return product.rowColourways.map(value => String(value).trim()).filter(Boolean);
  return typeof product?.colourways === 'string'
    ? product.colourways.split(/\s*;\s*/).map(value => value.trim()).filter(Boolean)
    : [];
}

export function productColourwayImageIndex(images, colourway) {
  const normalize = value => String(value || '').toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const target = normalize(colourway);
  return images.findIndex(image => normalize(image.colourway || image.variant || image.label) === target);
}

export function productCardImageMarkup(product, {
  colourway = '',
  kind = 'product',
  className = '',
} = {}) {
  const images = productImagesForDisplay(product);
  const colourways = productColourwayOptions(product);
  const isMultiColour = colourways.length > 1;
  const mappedIndex = colourway ? productColourwayImageIndex(images, colourway) : -1;
  const image = mappedIndex >= 0
    ? images[mappedIndex]
    : isMultiColour
      ? null
      : images[0];

  if (image) {
    return `<img class="${escape(className)}" src="${escape(image.src)}"
      alt="${escape(product.name)} — ${escape(image.label)}"
      data-fsd-image-fallback="true" data-fsd-image-title="${escape(product.name)}"
      data-fsd-image-variant="${escape(image.colourway || image.variant || image.size || '')}"
      data-fsd-image-kind="${escape(kind)}" loading="lazy" decoding="async"/>`;
  }

  return imagePlaceholderMarkup({
    title: product?.name || 'FSD product',
    variantLabel: colourway || product?.galleryPlaceholders?.[0] || colourways[0] || '',
    kind,
    className,
  });
}

export function productCardColourwaysMarkup(product, {
  selected = productColourwayOptions(product)[0] || '',
  className = 'catalogue-card-swatches',
  dataPrefix = 'catalogue',
} = {}) {
  const colourways = productColourwayOptions(product);
  if (colourways.length < 2) return '';

  return `<div class="${escape(className)}" role="group" aria-label="Colour options for ${escape(product.name)}"
      data-product-card-swatches="${escape(product.id)}">
    <span class="catalogue-card-swatches__selected" data-product-card-selected-colourway aria-live="polite">${escape(selected)}</span>
    ${colourways.map((colourway, index) => {
      const swatch = imageSwatchBackground(colourway, product.colourwayPalette);
      return `<button type="button" data-${escape(dataPrefix)}-card-colourway="${index}"
          aria-label="Choose ${escape(colourway)} for ${escape(product.name)}"
          aria-pressed="${colourway === selected}">
        <span class="catalogue-swatch-dot" aria-hidden="true"${swatch ? ` style="--catalogue-swatch:${escape(swatch)}"` : ''}></span>
        <span class="sr-only">${escape(colourway)}</span>
      </button>`;
    }).join('')}
  </div>`;
}
