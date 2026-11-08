import {
  getVerifiedProductSpecifications,
  imageSwatchBackground,
  products,
  safe,
} from './catalogue-data.js';
import {
  productSizeGuideForProduct,
  productSizeGuidanceForProduct,
} from './size-guide-data.js';
import { imagePlaceholderMarkup } from './image-placeholder.js';
import { productImagesForDisplay } from './data/products.js';
import { rotationFramesForProduct } from './product-rotation-assets.js';
import { productSeoPath, productStructuredData } from './product-structured-data.js';
import { MAX_BAG_QUANTITY } from './bag.js';
import { CLOTHING_LINES, productBelongsToLine } from './clothing-lines.js';

export function productSizeOptions(product) {
  return String(product?.sizes || '')
    .split(/[;,/]/)
    .map(value => value.trim())
    .filter(Boolean);
}

function absoluteImageUrl(src) {
  const origin = globalThis.location?.origin;
  try {
    return new URL(src, origin).href;
  } catch {
    try {
      return new URL(src).href;
    } catch {
      return '';
    }
  }
}

function relatedProductsFor(product) {
  const sameCategory = products.filter(candidate =>
    candidate.id !== product.id &&
    candidate.category === product.category &&
    (!product.audience || candidate.audience === product.audience));
  const sameCollection = product.collection
    ? sameCategory.filter(candidate => candidate.collection === product.collection)
    : [];
  const pool = sameCollection.length ? sameCollection : sameCategory;
  return pool.slice(0, 4);
}

function renderRelatedProducts(product) {
  const related = relatedProductsFor(product);
  if (!related.length) return '';
  return `<section class="product-detail-related" aria-labelledby="product-related-title">
    <h3 id="product-related-title">Related products</h3>
    <div class="product-detail-related__grid">
      ${related.map(item => {
        const image = productImagesForDisplay(item)[0];
        return `<button class="product-detail-related__item" type="button" data-related-product="${item.id}">
          ${image
            ? `<img src="${safe(image.src)}" alt="${safe(item.name)} — ${safe(image.label)}" loading="lazy"
                data-fsd-image-fallback="true" data-fsd-image-title="${safe(item.name)}" data-fsd-image-kind="product"/>`
            : imagePlaceholderMarkup({ title: item.name, kind: 'product', className: 'fsd-image-placeholder--compact product-detail-related__placeholder' })}
          <span>${safe(item.name)}</span>
          <small>${safe(item.category)}</small>
        </button>`;
      }).join('')}
    </div>
  </section>`;
}

function renderColourwayOptions(product, colourways, colourwayImageIndexes) {
  if (!colourways.length) return '';
  return `<fieldset class="product-detail-colourways">
    <legend>Colour</legend>
    <div class="product-detail-options" role="radiogroup" aria-label="Choose a colour">
      ${colourways.map((colourway, index) => {
        const swatch = imageSwatchBackground(colourway, product.colourwayPalette);
        return `<label class="product-detail-option product-detail-option--colour">
          <input type="radio" name="product-colour-${product.id}" value="${safe(colourway)}"
            data-catalogue-colourway-index="${index}" data-catalogue-colourway-image-index="${colourwayImageIndexes[index]}"
            ${index === 0 ? 'checked' : ''} />
          <span class="product-detail-swatch" aria-hidden="true"${swatch ? ` style="--catalogue-swatch:${safe(swatch)}"` : ''}></span>
          <span>${safe(colourway)}</span>
        </label>`;
      }).join('')}
    </div>
    <p class="product-detail-selected-colour" data-catalogue-selected-colourway aria-live="polite">${safe(colourways[0])}</p>
  </fieldset>`;
}

function renderRotationViewer(product, poster) {
  const frames = rotationFramesForProduct(product?.id);
  if (!frames.length || !poster?.src) return '';
  return `<section class="product-rotation" data-product-rotation data-rotation-product="43"
      aria-labelledby="product-rotation-title-43">
    <header class="product-rotation__heading">
      <p class="section-kicker">FSD / PRODUCT VIEW</p>
      <h3 id="product-rotation-title-43">360° product view</h3>
      <p data-rotation-caption>Inspect the product through its complete photographic rotation.</p>
    </header>
    <figure class="product-rotation__stage">
      <img data-rotation-fallback src="${safe(poster.src)}" alt="${safe(product.name)} — ${safe(poster.label || 'Main product view')}" loading="lazy" decoding="async" />
      <canvas data-rotation-canvas aria-hidden="true" hidden></canvas>
      <figcaption>${frames.length} individual photographs of the same product and colourway.</figcaption>
    </figure>
    <p class="product-rotation__hint" data-rotation-hint hidden>Drag to turn the frame, or focus this viewer and use the left and right arrow keys.</p>
    <div class="product-rotation__controls" data-rotation-controls hidden>
      <button type="button" data-rotation-prev aria-label="Previous rotation frame">←</button>
      <span data-rotation-frame-count>${frames.length} photographs</span>
      <button type="button" data-rotation-next aria-label="Next rotation frame">→</button>
    </div>
    <p class="sr-only" data-rotation-status role="status" aria-live="polite"></p>
  </section>`;
}

function renderSizeOptions(product, sizes) {
  if (!sizes.length) return '';
  return `<fieldset class="product-detail-sizes">
    <legend>Size</legend>
    <div class="product-detail-options" role="radiogroup" aria-label="Choose a size">
      ${sizes.map(size => {
        const unavailable = product.stockBySize?.[size] === 0
          || product.availabilityBySize?.[size] === 'out-of-stock'
          || product.outOfStockSizes?.includes?.(size);
        return `<label class="product-detail-option product-detail-option--size${unavailable ? ' is-out-of-stock' : ''}">
        <input type="radio" name="product-size-${product.id}" value="${safe(size)}" data-product-size
          ${unavailable ? `aria-disabled="true" aria-label="${safe(size)}, out of stock" data-out-of-stock="true" title="Out of stock"` : ''} />
        <span>${safe(size)}${unavailable ? '<small class="product-detail-out-of-stock">OUT OF STOCK</small>' : ''}</span>
      </label>`;
      }).join('')}
    </div>
    <button class="product-detail-text-link" type="button" data-size-guide>Size guide</button>
  </fieldset>`;
}

function galleryVariantKey(image) {
  return String(image?.colourway || image?.variant || '')
    .trim()
    .toLocaleLowerCase('en-GB')
    .replace(/\s+/g, ' ');
}

function normalizedGalleryLabel(image) {
  return String(image?.label || '')
    .toLocaleLowerCase('en-GB')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function gallerySide(image, side) {
  const label = normalizedGalleryLabel(image);
  return side === 'front'
    ? /\bfront\b/.test(label)
    : /\b(?:rear|back)\b/.test(label);
}

function galleryProductViewRank(image) {
  const label = normalizedGalleryLabel(image);
  if (/\bproduct\b/.test(label)) return 0;
  if (/\b(?:lifestyle|training|action)\b/.test(label)) return 2;
  return 1;
}

function preferredGallerySideIndex(images, side, variant, hasMultipleColourways, allowNonProductViews = false) {
  const preferredVariant = galleryVariantKey({ variant });
  const candidates = images
    .map((image, index) => ({ image, index }))
    .filter(({ image }) => {
      if (!gallerySide(image, side)) return false;
      if (!allowNonProductViews && !/\bproduct\b/.test(normalizedGalleryLabel(image))) return false;
      const candidateVariant = galleryVariantKey(image);
      return hasMultipleColourways
        ? Boolean(preferredVariant && candidateVariant === preferredVariant)
        : !preferredVariant || !candidateVariant || candidateVariant === preferredVariant;
    })
    .sort((a, b) => galleryProductViewRank(a.image) - galleryProductViewRank(b.image));

  return candidates[0]?.index ?? -1;
}

export function editorialGalleryPrimaryImageIndex(
  images,
  fallbackIndex,
  preferredVariant = '',
  hasMultipleColourways = false,
  requireFrontBackPair = false,
) {
  const fallback = images[fallbackIndex];
  if (!fallback) return fallbackIndex;
  // Quick View preserves the approved Velocity listing hero; full details use
  // the exact selected-colourway front/rear pair instead.
  if (!requireFrontBackPair && /\bmain product listing\b/i.test(fallback.label || '')) return fallbackIndex;

  const variant = preferredVariant || fallback.colourway || fallback.variant || '';
  const frontIndex = preferredGallerySideIndex(images, 'front', variant, hasMultipleColourways, requireFrontBackPair);
  const rearIndex = preferredGallerySideIndex(images, 'rear', variant, hasMultipleColourways, requireFrontBackPair);

  // Full-detail pages prioritize an exact variant-matched pair when available;
  // Quick View retains its curated source-selected order.
  return frontIndex >= 0 && rearIndex >= 0 ? frontIndex : fallbackIndex;
}

export function editorialGallerySecondaryImageIndex(
  images,
  primaryIndex,
  preferredVariant = '',
  hasMultipleColourways = false,
  requireFrontBackPair = false,
) {
  const primary = images[primaryIndex] || images[0];
  if (!primary) return -1;
  const primaryVariant = galleryVariantKey(primary) || galleryVariantKey({ variant: preferredVariant });

  if (requireFrontBackPair) {
    const oppositeSide = gallerySide(primary, 'front')
      ? 'rear'
      : gallerySide(primary, 'rear')
        ? 'front'
        : '';
    if (!oppositeSide) return -1;
    const oppositeIndex = preferredGallerySideIndex(
      images,
      oppositeSide,
      primaryVariant,
      hasMultipleColourways,
      true,
    );
    return oppositeIndex >= 0 && oppositeIndex !== primaryIndex && images[oppositeIndex]?.src !== primary.src
      ? oppositeIndex
      : -1;
  }

  if (gallerySide(primary, 'front') && /\bproduct\b/.test(normalizedGalleryLabel(primary))) {
    const rearIndex = preferredGallerySideIndex(
      images,
      'rear',
      primaryVariant,
      hasMultipleColourways,
    );
    if (rearIndex >= 0 && rearIndex !== primaryIndex && images[rearIndex]?.src !== primary.src) {
      return rearIndex;
    }
  }

  return images.findIndex((image, index) => {
    if (index === primaryIndex || image.src === primary.src) return false;
    const candidateVariant = galleryVariantKey(image);
    if (hasMultipleColourways && (!primaryVariant || candidateVariant !== primaryVariant)) return false;
    if (primaryVariant && candidateVariant && candidateVariant !== primaryVariant) return false;
    return true;
  });
}

const productGalleryViewTypes = Object.freeze([
  Object.freeze({ id: 'front', label: 'Front view' }),
  Object.freeze({ id: 'back', label: 'Back view' }),
  Object.freeze({ id: 'detail', label: 'Detail view' }),
]);

function galleryViewType(image) {
  const label = String(image?.label || image || '').toLocaleLowerCase('en-GB');
  if (/\bfront\b/.test(label)) return 'front';
  if (/\b(back|rear|reverse)\b/.test(label)) return 'back';
  if (/\b(detail|close.?up|fabric|texture|branding|logo|crest|panel|seam|pocket|hardware)\b/.test(label)) return 'detail';
  return '';
}

function galleryViewSlots(images = [], galleryPlaceholders = []) {
  const firstImageByType = new Map();
  images.forEach((image, index) => {
    const type = galleryViewType(image);
    if (type && !firstImageByType.has(type)) firstImageByType.set(type, index);
  });

  const usedImageIndexes = new Set();
  const slots = productGalleryViewTypes.map(view => {
    const imageIndex = firstImageByType.get(view.id);
    if (Number.isInteger(imageIndex)) {
      usedImageIndexes.add(imageIndex);
      return {
        kind: 'image',
        viewId: view.id,
        viewLabel: view.label,
        imageIndex,
      };
    }
    return { kind: 'placeholder', viewId: view.id, viewLabel: view.label };
  });

  images.forEach((image, imageIndex) => {
    if (usedImageIndexes.has(imageIndex)) return;
    slots.push({
      kind: 'image',
      viewId: `image-${imageIndex}`,
      viewLabel: String(image.label || 'Product view'),
      imageIndex,
    });
  });

  galleryPlaceholders.forEach((value, index) => {
    const label = String(value || '').trim();
    if (!label || galleryViewType(label)) return;
    slots.push({
      kind: 'placeholder',
      viewId: `additional-${index}`,
      viewLabel: label,
    });
  });

  return slots;
}

function renderProductViewPlaceholder(product, viewLabel, variantLabel = '', {
  className = '',
  hidden = false,
  decorative = false,
  compact = false,
  variantAttribute = 'data-catalogue-variant-label',
  attributes = '',
} = {}) {
  const view = String(viewLabel || 'Product view').toLocaleUpperCase('en-GB');
  const accessibility = decorative
    ? ' aria-hidden="true"'
    : ` role="img" aria-label="${safe(product.name)} — ${safe(view)} — IMAGE PENDING"`;
  return `<div class="fsd-product-view-placeholder${compact ? ' fsd-product-view-placeholder--compact' : ''}${className ? ` ${className}` : ''}"${hidden ? ' hidden' : ''}${attributes ? ` ${attributes}` : ''}${accessibility}>
    <svg class="fsd-product-view-placeholder__graphic" viewBox="0 0 96 96" aria-hidden="true" focusable="false">
      <path d="M14 9h68v78H14z" fill="none" stroke="currentColor" stroke-width=".7" opacity=".44"/>
      <path d="M23 18h50v60H23z" fill="none" stroke="currentColor" stroke-width=".55" stroke-dasharray="2 4" opacity=".48"/>
      <path d="M48 25v46M31 48h34" fill="none" stroke="currentColor" stroke-width=".65" opacity=".58"/>
      <circle cx="48" cy="48" r="13" fill="none" stroke="currentColor" stroke-width=".65" opacity=".58"/>
      <path d="M8 14h8M80 14h8M8 82h8M80 82h8" fill="none" stroke="currentColor" stroke-width="1"/>
    </svg>
    <span class="fsd-product-view-placeholder__brand">FSD / PRODUCT IMAGE</span>
    <strong class="fsd-product-view-placeholder__view" data-catalogue-view-title>${safe(view)}</strong>
    <span class="fsd-product-view-placeholder__status">IMAGE PENDING</span>
    <span class="fsd-product-view-placeholder__variant" ${variantAttribute}>${safe(variantLabel)}</span>
  </div>`;
}

function renderMainImagePlaceholder(product, variantLabel = '', viewLabel = 'Front view', { hidden = false } = {}) {
  const viewType = galleryViewType(viewLabel) || 'front';
  return renderProductViewPlaceholder(product, viewLabel, variantLabel, {
    className: 'fsd-image-placeholder--detail catalogue-variant-image-placeholder catalogue-gallery-placeholder',
    hidden,
    attributes: `data-catalogue-variant-placeholder data-catalogue-view-placeholder="${safe(viewType)}"`,
  });
}

function renderSecondaryGalleryPanel(product, image, variantLabel = '', {
  showPlaceholder = false,
  viewLabel = 'Back view',
  omitImageElement = false,
} = {}) {
  const placeholderVariant = variantLabel;
  const imageMarkup = image
    ? `<img data-catalogue-secondary-image data-fsd-image-fallback="true"
        data-fsd-image-title="${safe(product.name)}"
        data-fsd-image-variant="${safe(image.colourway || image.variant || image.size || '')}"
        data-fsd-image-kind="detail" src="${safe(image.src)}"
        alt="${safe(product.name)} — ${safe(image.label)}" loading="lazy" decoding="async" />`
    : omitImageElement
      ? ''
      : `<img data-catalogue-secondary-image data-fsd-image-fallback="true"
        data-fsd-image-title="${safe(product.name)}" data-fsd-image-kind="detail"
        alt="${safe(product.name)} — additional product view" hidden />`;

  return `<figure class="product-detail-gallery__secondary" data-catalogue-secondary-panel
      aria-label="${safe(viewLabel)}"${image || showPlaceholder ? '' : ' hidden'}>
      <div class="product-detail-gallery__secondary-stage">
        ${imageMarkup}
        ${renderProductViewPlaceholder(product, viewLabel, placeholderVariant, {
          className: 'fsd-image-placeholder--detail product-detail-gallery__secondary-placeholder catalogue-gallery-placeholder',
          hidden: Boolean(image),
          variantAttribute: 'data-catalogue-secondary-variant',
          attributes: 'data-catalogue-secondary-placeholder',
        })}
      </div>
      <figcaption data-catalogue-secondary-caption>${image ? safe(image.label) : showPlaceholder ? `${safe(viewLabel).toLocaleUpperCase('en-GB')} — IMAGE PENDING` : ''}</figcaption>
    </figure>`;
}

function renderGalleryThumbnails(product, images, galleryPlaceholders, selectedImageIndex = -1, selectedPlaceholderView = '') {
  const slots = galleryViewSlots(images, galleryPlaceholders);
  return `<div class="product-detail-gallery__thumbnail-section">
    <p class="product-detail-gallery__thumbnail-heading"><span>GALLERY VIEWS</span><span>SELECT A VIEW</span></p>
    <div class="catalogue-selector__thumbs" data-catalogue-thumbnail-rail role="group" aria-label="Choose a product image view">
      ${slots.map(slot => {
      const selected = slot.kind === 'image'
        ? slot.imageIndex === selectedImageIndex
        : slot.viewId === selectedPlaceholderView;
      if (slot.kind === 'placeholder') {
        return `<button type="button"
          class="catalogue-selector__thumb catalogue-selector__thumb--pending${selected ? ' is-selected' : ''}"
          data-catalogue-gallery-view data-catalogue-placeholder-view="${safe(slot.viewId)}"
          data-catalogue-view-label="${safe(slot.viewLabel)}"
          aria-label="${safe(slot.viewLabel)} — image pending" aria-pressed="${selected}">
          ${renderProductViewPlaceholder(product, slot.viewLabel, '', {
            className: 'fsd-product-view-placeholder--thumbnail',
            decorative: true,
            compact: true,
          })}
          <span class="catalogue-selector__thumb-label">${safe(slot.viewLabel.toLocaleUpperCase('en-GB'))}</span>
        </button>`;
      }
      const image = images[slot.imageIndex];
      const thumbnailLabel = productGalleryViewTypes.find(view => view.id === slot.viewId)?.label || slot.viewLabel;
      return `<button type="button"
        class="catalogue-selector__thumb${selected ? ' is-selected' : ''}"
        data-catalogue-gallery-view data-catalogue-image-index="${slot.imageIndex}"
        data-catalogue-view-label="${safe(thumbnailLabel)}"
        aria-label="Show ${safe(thumbnailLabel)}" aria-pressed="${selected}">
        <span class="catalogue-selector__thumb-photo">
          <img src="${safe(image.src)}" alt=""
            data-fsd-image-fallback="true" data-fsd-image-title="${safe(product.name)}"
            data-fsd-image-variant="${safe(image.colourway || image.variant || image.size || '')}"
            data-fsd-image-kind="gallery" loading="lazy" decoding="async" />
        </span>
        <span class="catalogue-selector__thumb-label">${safe(thumbnailLabel.toLocaleUpperCase('en-GB'))}</span>
      </button>`;
      }).join('')}
    </div>
  </div>`;
}

function renderGallery(product, images, initialImageIndex, galleryPlaceholders, initialVariant = '', hasMultipleColourways = false, quickView = false) {
  const safeImages = Array.isArray(images) ? images : [];
  const requireFrontBackPair = !quickView;
  const activeInitialIndex = safeImages.length
    ? Math.max(0, Math.min(safeImages.length - 1, Number.isInteger(initialImageIndex) ? initialImageIndex : 0))
    : -1;
  const selectedImage = safeImages[activeInitialIndex];
  const variantPlaceholder = renderMainImagePlaceholder(product, initialVariant, 'Front view', { hidden: true });
  if (!selectedImage) {
    if (safeImages.length) {
      const initialImage = safeImages[activeInitialIndex];
      return `<div class="product-detail-gallery">
        <div class="product-detail-gallery__feature-grid${requireFrontBackPair ? ' has-secondary' : ' is-single'}">
          <figure class="catalogue-selector__main">
            <div class="product-detail-image-stage">
              <button type="button" class="product-detail-image-zoom" data-gallery-photo-open
                aria-haspopup="dialog" aria-controls="fsd-product-viewer"
                aria-label="Open full-screen product photograph" hidden>
                <img class="mapped-gallery-image" data-mapped-gallery-active="true" data-catalogue-main-image
                  data-fsd-image-fallback="true" data-fsd-image-title="${safe(product.name)}"
                  data-fsd-image-variant="${safe(initialImage.colourway || initialImage.variant || initialImage.size || '')}" data-fsd-image-kind="detail"
                  src="${safe(initialImage.src)}" alt="${safe(product.name)} — ${safe(initialImage.label)}"
                  loading="eager" fetchpriority="high" decoding="async" />
              </button>
              ${renderMainImagePlaceholder(product, initialVariant, 'Front view')}
            </div>
            <figcaption data-catalogue-main-caption aria-live="polite">FRONT VIEW — IMAGE PENDING</figcaption>
          </figure>
          ${requireFrontBackPair
            ? renderSecondaryGalleryPanel(product, null, initialVariant, { showPlaceholder: true, viewLabel: 'Back view' })
            : ''}
        </div>
        ${renderGalleryThumbnails(product, safeImages, galleryPlaceholders, activeInitialIndex)}
      </div>`;
    }
    return `<div class="product-detail-gallery product-detail-gallery--placeholders">
      <div class="product-detail-gallery__feature-grid${requireFrontBackPair ? ' has-secondary' : ' is-single'}" role="group" aria-label="${safe(product.name)} image gallery">
        <figure class="catalogue-selector__main">
          <div class="product-detail-image-stage">${renderMainImagePlaceholder(product, initialVariant, 'Front view')}</div>
          <figcaption data-catalogue-main-caption aria-live="polite">FRONT VIEW — IMAGE PENDING</figcaption>
        </figure>
        ${requireFrontBackPair
          ? renderSecondaryGalleryPanel(product, null, initialVariant, { showPlaceholder: true, viewLabel: 'Back view', omitImageElement: true })
          : ''}
      </div>
      ${renderGalleryThumbnails(product, safeImages, galleryPlaceholders, -1, 'front')}
    </div>`;
  }
  const secondaryIndex = editorialGallerySecondaryImageIndex(
    safeImages,
    activeInitialIndex,
    initialVariant,
    hasMultipleColourways,
    requireFrontBackPair,
  );
  const secondaryImage = secondaryIndex >= 0 ? safeImages[secondaryIndex] : null;
  return `<div class="product-detail-gallery">
    <div class="product-detail-gallery__feature-grid${secondaryImage || requireFrontBackPair ? ' has-secondary' : ' is-single'}">
      <figure class="catalogue-selector__main">
        <div class="product-detail-image-stage">
          <button type="button" class="product-detail-image-zoom" data-gallery-photo-open
            aria-haspopup="dialog" aria-controls="fsd-product-viewer"
            aria-label="Open full-screen product photograph">
            <img class="mapped-gallery-image" data-mapped-gallery-active="true" data-catalogue-main-image
              data-fsd-image-fallback="true" data-fsd-image-title="${safe(product.name)}"
            data-fsd-image-variant="${safe(selectedImage.colourway || selectedImage.variant || selectedImage.size || '')}" data-fsd-image-kind="detail"
              src="${safe(selectedImage.src)}" alt="${safe(product.name)} — ${safe(selectedImage.label)}"
              loading="eager" fetchpriority="high" decoding="async" />
          </button>
          ${renderMainImagePlaceholder(
            product,
            initialVariant,
            productGalleryViewTypes.find(view => view.id === galleryViewType(selectedImage))?.label || 'Front view',
            { hidden: true },
          )}
        </div>
        <figcaption data-catalogue-main-caption aria-live="polite">${safe(selectedImage.label)}</figcaption>
      </figure>
      ${requireFrontBackPair
        ? renderSecondaryGalleryPanel(product, secondaryImage, initialVariant, {
          showPlaceholder: !secondaryImage,
          viewLabel: gallerySide(selectedImage, 'front') ? 'Back view' : gallerySide(selectedImage, 'rear') ? 'Front view' : 'Back view',
        })
        : safeImages.length > 1 ? renderSecondaryGalleryPanel(product, secondaryImage, initialVariant) : ''}
    </div>
    ${renderGalleryThumbnails(product, safeImages, galleryPlaceholders, activeInitialIndex)}
  </div>`;
}

function renderDetails(product, sizes, hardwarePreview = false) {
  if (hardwarePreview) {
    return product.category
      ? `<dl class="product-detail-catalogue-facts">
          <dt>Category</dt><dd>${safe(product.category)}</dd>
        </dl>`
      : '';
  }
  const verified = getVerifiedProductSpecifications(product.id);
  const sizeGuidance = productSizeGuidanceForProduct(product);
  const technicalSpecs = verified?.technicalSpecs || {};
  const setContents = product.setContents
    ? `<p><strong>Set includes:</strong> ${safe(product.setContents)}</p>`
    : '';
  const sizeSummary = sizes.length && !sizeGuidance
    ? `<p><strong>Sizes:</strong> ${safe(sizes.join(' / '))}</p>`
    : '';
  const alias = product.alias?.trim() && /^confirmed$/i.test(product.aliasStatus || '')
    ? `<p><strong>Also appears as:</strong> ${safe(product.alias)}</p>`
    : '';
  const sku = product.sku
    ? `<p><strong>Product code:</strong> ${safe(product.sku)}</p>`
    : '';
  const fit = sizeGuidance
    ? ''
    : product.coverage
    ? `<p><strong>Coverage:</strong> ${safe(product.coverage)}</p>`
    : technicalSpecs.fit
      ? `<p><strong>Fit:</strong> ${safe(technicalSpecs.fit)}</p>`
      : '';
  const sizeGuidanceMarkup = sizeGuidance
    ? `<section class="product-size-guidance" data-breeze-size-guidance>
        <h3>Confirmed size range</h3>
        <ul class="product-size-guidance__range" aria-label="Listed sizes">
          ${sizeGuidance.sizes.map(size => `<li>${safe(size)}</li>`).join('')}
        </ul>
        <p>${safe(sizeGuidance.note)}</p>
      </section>`
    : '';
  const features = verified?.benefits.length
    ? `<ul>${verified.benefits.map(feature => `<li>${safe(feature)}</li>`).join('')}</ul>`
    : '';
  const materials = verified?.materials.length
    ? safe(verified.materials.join(' '))
    : '';
  const specificationLabel = technicalSpecs.fabricWeight ? 'Fabric weight' : 'GSM / specifications';
  const specifications = technicalSpecs.fabricWeight
    ? safe(technicalSpecs.fabricWeight)
    : technicalSpecs.composition
      ? safe(technicalSpecs.composition)
    : '';
  const care = technicalSpecs.care ? safe(technicalSpecs.care) : '';
  const deliverySummary = '';
  const productDetails = [
    setContents,
    sku,
    alias,
    features,
    materials ? `<p><strong>Material:</strong> ${materials}</p>` : '',
    specifications ? `<p><strong>${specificationLabel}:</strong> ${specifications}</p>` : '',
    care ? `<p><strong>Care instructions:</strong> ${care}</p>` : '',
  ].join('');
  const sizeAndFit = [sizeSummary, fit, sizeGuidanceMarkup].join('');
  return `<div class="product-detail-accordions">
    ${productDetails ? `<details class="product-detail-accordion">
      <summary>Product Details</summary>
      <div>${productDetails}</div>
    </details>` : ''}
    ${sizeAndFit ? `<details class="product-detail-accordion">
      <summary>Size &amp; Fit</summary>
      <div>${sizeAndFit}</div>
    </details>` : ''}
    <details class="product-detail-accordion">
      <summary>Shipping &amp; Returns</summary>
      <div>${deliverySummary}<a href="/delivery-returns.html">Full delivery and returns information</a></div>
    </details>
  </div>`;
}

function renderVerifiedSizeGuideTable(guide) {
  return `<div class="size-guide-table-wrap"><table>
    <caption>Measurements in ${safe(guide.unit)}</caption>
    <thead><tr><th scope="col">Size</th>${guide.measurements.map(measurement => `<th scope="col">${safe(measurement)}</th>`).join('')}</tr></thead>
    <tbody>${guide.rows.map(row => `<tr><th scope="row">${safe(row.size)}</th>${guide.measurements.map(measurement => `<td data-label="${safe(measurement)}">${safe(row.values[measurement])}</td>`).join('')}</tr>`).join('')}</tbody>
  </table></div>`;
}

export function renderProductDetailPage({
  product,
  images,
  initialImageIndex,
  galleryPlaceholders,
  colourways,
  colourwayImageIndexes,
  sizes,
  price,
  canPurchase,
  hardwarePreview = false,
  quickView = false,
}) {
  const breadcrumbCategory = product.category || 'FSD Collection';
  const breadcrumbLine = CLOTHING_LINES.find(line => productBelongsToLine(product, line.id));
  const detailBreadcrumb = breadcrumbLine
    ? `<li><a href="/collections/${safe(breadcrumbLine.id)}">${safe(breadcrumbLine.title)}</a></li>`
    : product.category
      ? `<li><a href="#products" data-category-link="${safe(product.category)}">${safe(product.category)}</a></li>`
      : '';
  const description = product.description || '';
  const initialImage = images[initialImageIndex];
  const requireFrontBackPair = !quickView;
  const hasSecondaryImage = requireFrontBackPair || Boolean(initialImage && editorialGallerySecondaryImageIndex(
    images,
    initialImageIndex,
    initialImage.colourway || initialImage.variant || colourways[0] || '',
    colourways.length > 1,
    requireFrontBackPair,
  ) >= 0);
  const imageMarkup = renderGallery(
    product,
    images,
    initialImageIndex,
    galleryPlaceholders,
    initialImage?.colourway || initialImage?.variant || colourways[0] || '',
    colourways.length > 1,
    quickView,
  );
  const rotationMarkup = renderRotationViewer(product, images[0]);
  const sizeMarkup = renderSizeOptions(product, sizes);
  const breezeCommercialDetailsUnconfirmed = /^pre[\s-]?launch$/i.test(
    String(product.commercialStatus ?? '').trim(),
  );
  const actionMarkup = canPurchase
    ? `<button class="catalogue-bag-add product-detail-add" type="button" data-bag-add="${product.id}"
        data-product-primary-add ${sizes.length ? 'disabled aria-disabled="true"' : ''}>ADD TO BAG</button>
       ${sizes.length ? '<p class="product-detail-size-help" data-size-help role="status">Choose a size to continue.</p>' : ''}`
    : breezeCommercialDetailsUnconfirmed
      ? ''
     : `<div class="product-detail-notify">
         <button class="product-detail-notify__button" type="button" data-product-notify-primary disabled aria-disabled="true"
          aria-describedby="product-notify-note-${product.id}">Notify me when available</button>
        <p id="product-notify-note-${product.id}">Email notifications are not connected. No email is collected.</p>
      </div>`;
  const quantityMarkup = canPurchase
    ? `<label class="product-detail-quantity" for="product-quantity-${product.id}">
        <span>Quantity</span>
        <input id="product-quantity-${product.id}" type="number" inputmode="numeric"
          min="1" max="${MAX_BAG_QUANTITY}" step="1" value="1"
          data-product-quantity aria-label="Quantity" />
      </label>`
    : '';
  const availability = hardwarePreview
    ? 'Not available for purchase.'
    : breezeCommercialDetailsUnconfirmed
      ? 'Pre-launch: availability is not confirmed. Stock by colourway and size, dispatch timing, delivery terms, and returns terms are not confirmed.'
      : '';
  const priceMarkup = price.label || price.value
    ? `<p class="product-detail-price">${price.label ? `<span>${safe(price.label)}</span>` : ''}${price.value ? `<strong>${safe(price.value)}</strong>` : ''}</p>`
    : '';
  const summaryMarkup = description
    ? `<p class="product-detail-summary">${safe(description)}</p>`
    : '';
  const schema = productStructuredData(product, { images, colourways, sizes });

  return `<div class="product-detail-page product-detail-page--editorial${quickView ? ' product-detail-page--quick-view' : ''}">
    <div class="product-detail-layout" data-catalogue-has-secondary="${hasSecondaryImage}">
      <section class="product-detail-media" aria-label="${safe(product.name)} product images">
        <div class="product-detail-media__masthead"><span>FSD / PRODUCT PHOTOGRAPHY</span><span>${images.length ? `${String(images.length).padStart(2, '0')} MAPPED VIEWS` : 'IMAGE TO BE ADDED'}</span></div>
        ${imageMarkup}${rotationMarkup}
      </section>
      <section class="product-detail-purchase" aria-labelledby="product-title">
        <nav class="catalogue-breadcrumbs" aria-label="Breadcrumb"><ol>
          <li><a href="#products" data-shop-breadcrumb>SHOP</a></li>
          ${product.audience ? `<li>${safe(product.audience)}</li>` : ''}
          ${detailBreadcrumb}
          <li aria-current="page">${safe(product.name)}</li>
        </ol></nav>
        <button class="catalogue-back" type="button" data-catalogue-back>RETURN TO THE HOUSE</button>
        <p class="section-kicker">${safe(breadcrumbCategory)}</p>
        <h1 id="product-title">${safe(product.name)}</h1>
        ${priceMarkup}
        ${summaryMarkup}
        ${renderColourwayOptions(product, colourways, colourwayImageIndexes)}
        ${sizeMarkup}
        ${availability ? `<p class="product-detail-availability"${breezeCommercialDetailsUnconfirmed ? ' role="status"' : ''}>${safe(availability)}</p>` : ''}
        ${quantityMarkup}
        ${actionMarkup}
        ${quickView ? `<a class="product-detail-full-page" href="${safe(productSeoPath(product))}">VIEW FULL PRODUCT PAGE <span aria-hidden="true">↗</span></a>` : ''}
        <p class="product-detail-delivery-summary">
          <a href="/delivery-returns.html">Delivery and returns</a>
        </p>
        <button class="product-detail-wishlist" type="button" data-product-wishlist="${product.id}" aria-pressed="false">
          <span aria-hidden="true">♡</span><span data-wishlist-label>Add to wishlist</span>
        </button>
        <p class="product-detail-action-status" data-product-action-status role="status" aria-live="polite"></p>
        <div data-product-specifications-root data-product-id="${product.id}"></div>
      </section>
    </div>
    ${renderDetails(product, sizes, hardwarePreview)}
    ${renderRelatedProducts(product)}
    ${Array.isArray(product.reviews) && product.reviews.length
      ? `<section class="product-detail-reviews" aria-label="Customer reviews">
          <h3>Customer reviews</h3><p>${safe(product.reviews.length)} verified reviews</p>
        </section>`
      : ''}
    ${breezeCommercialDetailsUnconfirmed ? '' : canPurchase ? `<div class="product-detail-sticky" data-sticky-add-bar hidden>
      <strong>${safe(product.name)}${price.value ? ` · ${safe(price.value)}` : ''}</strong>
      <button class="catalogue-bag-add" type="button" data-bag-add="${product.id}" data-sticky-add ${sizes.length ? 'disabled aria-disabled="true"' : ''}>ADD TO BAG</button>
    </div>` : `<div class="product-detail-sticky product-detail-sticky--notify" data-sticky-add-bar hidden>
      <div class="product-detail-sticky__copy">
        <strong>${safe(product.name)}</strong>
        <small id="product-sticky-notify-note-${product.id}">Email notifications are not connected. No email is collected.</small>
      </div>
      <button class="product-detail-notify__button" type="button" data-sticky-notify disabled aria-disabled="true"
        aria-describedby="product-sticky-notify-note-${product.id}">Notify me when available</button>
    </div>`}
    <script type="application/ld+json" data-product-jsonld>${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>
  </div>`;
}

export function renderSizeGuideDialog(product) {
  const sizeGuidance = productSizeGuidanceForProduct(product);
  if (sizeGuidance) {
    return `<div class="size-guide-dialog__shell" data-size-guide-status="CONTENT PENDING">
      <header><div><p class="section-kicker">FSD / SIZE GUIDE</p><h2 id="size-guide-title">${safe(product.name)}</h2></div>
        <button type="button" data-size-guide-close aria-label="Close size guide">×</button></header>
      <section class="product-size-guidance product-size-guidance--dialog" data-breeze-size-guidance>
        <h3>Confirmed size range</h3>
        <ul class="product-size-guidance__range" aria-label="Listed sizes">
          ${sizeGuidance.sizes.map(size => `<li>${safe(size)}</li>`).join('')}
        </ul>
        <p>${safe(sizeGuidance.note)}</p>
      </section>
    </div>`;
  }
  const guide = productSizeGuideForProduct(product);
  if (!guide) {
    return `<div class="size-guide-dialog__shell" data-size-guide-status="CONTENT PENDING">
      <header><div><p class="section-kicker">FSD / SIZE GUIDE</p><h2 id="size-guide-title">${safe(product.name)}</h2></div>
        <button type="button" data-size-guide-close aria-label="Close size guide">×</button></header>
      <p class="size-guide-pending" role="status">Product-specific measurements are not available for this item yet.</p>
    </div>`;
  }
  return `<div class="size-guide-dialog__shell">
    <header><div><p class="section-kicker">FSD / SIZE GUIDE</p><h2 id="size-guide-title">${safe(product.name)}</h2></div>
      <button type="button" data-size-guide-close aria-label="Close size guide">×</button></header>
    ${guide.fitNote ? `<p>${safe(guide.fitNote)}</p>` : ''}
    ${renderVerifiedSizeGuideTable(guide)}
    <a class="size-guide-full-link" href="/size-guide.html">View the full size guide</a>
  </div>`;
}
