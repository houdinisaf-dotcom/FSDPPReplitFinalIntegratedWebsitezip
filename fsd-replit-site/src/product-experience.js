import { priceInfo, safe } from './catalogue-data.js';
import { revealEditorial, cancelMotion, animateWithTokens } from './motion.js';
import { renderProductStory } from './product-story.js';
import { applyProductSEO, restoreProductSEO, productRouteMatch, isProductPath, productPageInfo } from './product-seo.js';
import { productVariantGallery, productVariants, renderProductOptions, renderProductSizes, productVariantSizes } from './product-options.js';
import { applyImageSource, PRODUCT_IMAGE_SIZES, renderImageAttributes } from './product-assets.js';

let config = null;
let currentId = null;
let opener = null;
let ownedEntry = false;
let sourceURL = null;
let sourceState = null;
let context = null;
let selectedImage = 0;
let selectedVariantId = null;
let activeProductImages = [];
let imageRequest = 0;
let touchStart = null;
let viewer = null;
let viewerReturnFocus = null;
let listenersReady = false;

const dialog = () => document.querySelector('#product-dialog');
const body = () => document.querySelector('#dialog-body');
const currentProduct = () => config?.products.find(item => item.id === currentId);
const isReduced = () => {
  try { return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false; }
  catch { return false; }
};
const canFadePreviewVariant = () => !isReduced();
const detail = (label, value) => value
  ? `<dt>${safe(label)}</dt><dd>${safe(value)}</dd>` : '';
const deferredImageAttributes = (image, alt = '') => renderImageAttributes(image, { alt, lazy: true })
  .replace(/^src="/, 'data-src="')
  .replace(' srcset="', ' data-srcset="')
  .replace(' sizes="', ' data-sizes="');
const approvedGalleryVariants = product =>
  productVariants(product).filter(variant => productVariantGallery(product, variant.id).length > 0);

function galleryCounterLabel(product, images, imageIndex = 0) {
  const variants = productVariants(product);
  const variant = variants.find(item => String(item.id) === String(selectedVariantId));
  if (variants.length > 1 && variant) {
    if (images.length === 1) {
      const available = approvedGalleryVariants(product);
      const position = available.findIndex(item => String(item.id) === String(variant.id));
      return `${Math.max(0, position) + 1} / ${Math.max(1, available.length)} · ${variant.colour}`;
    }
    return `${variant.colour} · ${imageIndex + 1} / ${images.length} · ${images[imageIndex]?.label || ''}`;
  }
  return `${imageIndex + 1} / ${images.length} · ${images[imageIndex]?.label || ''}`;
}

function viewerCaption(product, images, imageIndex) {
  return config?.preview
    ? galleryCounterLabel(product, images, imageIndex)
    : `${galleryCounterLabel(product, images, imageIndex)} · DESIGN CONCEPT`;
}

function renderImageGallery(product, variantImages = null) {
  const images = variantImages || (Array.isArray(product.images) ? product.images : []);
  if (!images.length) {
    const selected = productVariants(product).find(variant => String(variant.id) === String(selectedVariantId));
    return `<div class="product-unavailable-panel" role="status" aria-live="polite">
      <strong>${safe(selected?.colour || 'PRODUCT IMAGE')}</strong>
      <span>Imagery to follow. Approved imagery is not available for this colourway.<br/>No other colour image is shown as a substitute.</span>
    </div>`;
  }
  const active = images[0];
  const variants = productVariants(product);
  const variantChoices = variants.length > 1 && (!config?.preview || images.length === 1);
  const activeVariant = variants.find(variant => String(variant.id) === String(selectedVariantId));
  const thumbnails = variantChoices
    ? variants.map((variant, index) => {
      const variantImages = productVariantGallery(product, variant.id);
      const selected = String(variant.id) === String(selectedVariantId);
      const preview = variantImages[0];
      return `<figure>
        <button type="button" class="product-gallery-thumb${selected ? ' is-current' : ''}" data-image-index="${index}"
          data-variant-id="${safe(variant.id)}" aria-pressed="${selected}" aria-label="Choose ${safe(variant.colour)} colourway${preview ? '' : ', image not available'}">
          ${preview ? `<img ${selected ? renderImageAttributes(preview, { alt: '', lazy: true }) : deferredImageAttributes(preview)}/>` : ''}
        </button><figcaption>${safe(variant.colour)}${preview ? '' : ' · image pending'}</figcaption>
      </figure>`;
    }).join('')
    : images.map((image, index) => `<figure>
        <button type="button" class="product-gallery-thumb${index === 0 ? ' is-current' : ''}" data-image-index="${index}" data-gallery-image-src="${safe(image.src)}"
          aria-pressed="${index === 0}" aria-label="Show ${safe(image.label)}">
          <img ${index === 0 ? renderImageAttributes(image, { alt: '', lazy: true }) : deferredImageAttributes(image)}/>
        </button><figcaption>${safe(image.label)}</figcaption>
      </figure>`).join('');
  const imageThumbnails = variantChoices && images.length > 1
    ? `<div class="product-gallery-thumbnails product-gallery-image-thumbnails" role="group" aria-label="Choose an image for ${safe(activeVariant?.colour || 'this colourway')}">
      ${images.map((image, index) => `<figure>
        <button type="button" class="product-gallery-thumb${index === 0 ? ' is-current' : ''}" data-gallery-image-index="${index}" data-gallery-image-src="${safe(image.src)}"
          aria-pressed="${index === 0}" aria-label="Show ${safe(image.label)}">
          <img ${index === 0 ? renderImageAttributes(image, { alt: '', lazy: true }) : deferredImageAttributes(image)}/>
        </button><figcaption>${safe(image.label)}</figcaption>
      </figure>`).join('')}
    </div>`
    : '';
  const availableVariants = approvedGalleryVariants(product);
  const variantNavigation = variantChoices && images.length === 1 && availableVariants.length > 1;
  const choiceCount = variantChoices && images.length === 1 ? availableVariants.length : images.length;
  return `<div class="product-gallery" data-product-gallery aria-label="Product image gallery">
    <div class="product-gallery-stage">
      <button class="product-gallery-viewer-trigger" type="button" data-open-viewer aria-label="View ${safe(active.label)} full screen">
        <img data-gallery-main ${renderImageAttributes(active, { alt: `${product.name} — ${active.label}${config?.preview ? '' : '; design concept'}`, priority: true, sizes: PRODUCT_IMAGE_SIZES })}/>
        <span class="product-gallery-expand" aria-hidden="true">EXPAND ↗</span>
      </button>
      <p data-gallery-caption>${variantChoices ? `${safe(activeVariant?.colour || '')} · ` : ''}${safe(active.label)}${config?.preview ? '' : ' <span>· DESIGN CONCEPT</span>'}</p>
    </div>
    ${choiceCount > 1 ? `<div class="product-gallery-thumbnails" role="group" aria-label="${variantChoices ? 'Choose a mapped colourway' : 'Choose a mapped product image'}">
      ${thumbnails}
    </div>` : ''}${imageThumbnails}
    <div class="product-gallery-controls">
      ${choiceCount > 1 ? `<button type="button" data-gallery-prev aria-label="Previous ${variantNavigation ? 'mapped colourway' : 'mapped image'}">← PREVIOUS</button>
        <span data-gallery-status aria-live="polite">${safe(galleryCounterLabel(product, images, 0))}</span>
        <button type="button" data-gallery-next aria-label="Next ${variantNavigation ? 'mapped colourway' : 'mapped image'}">NEXT →</button>`
        : `<span data-gallery-status aria-live="polite">${safe(galleryCounterLabel(product, images, 0))}</span>`}
    </div>
  </div>`;
}

function renderProduct(product) {
  if (!config?.preview) applyProductSEO(product);
  const price = config?.preview
    ? { label: 'Price', value: 'Not set' }
    : priceInfo(product);
  const optional = [
    ['Coverage', product.coverage],
    ['Development specifications', product.specifications],
    ['Specification status', product.specificationStatus],
    ['Price basis', product.priceBasis],
    ['Development notes', product.notes],
  ].filter(([, value]) => String(value ?? '').trim());
  const accordion = optional.length ? `<div class="product-record-panels">
    ${optional.map(([label, value]) => `<details><summary>${safe(label)}</summary><p>${safe(value)}</p></details>`).join('')}
  </div>` : '';
  const variants = productVariants(product);
  const firstMappedVariant = variants.find(variant => productVariantGallery(product, variant.id).length);
  const initialVariant = firstMappedVariant || variants[0] || null;
  selectedVariantId = initialVariant?.id ?? null;
  activeProductImages = initialVariant
    ? productVariantGallery(product, initialVariant.id)
    : (Array.isArray(product.images) ? product.images : []);
  body().innerHTML = `<div class="catalogue-dialog-images">${renderImageGallery(product, activeProductImages)}</div>
    <div class="dialog-copy">
      <p class="section-kicker">${safe(product.category)} / ${config?.preview ? 'DRAFT REVIEW' : 'PRE-LAUNCH'}</p><h1 id="product-title" class="product-detail-title">${safe(product.name)}</h1>
      <p class="product-record-label">${config?.preview ? 'EDITORIAL STATUS · DRAFT' : `PRODUCT RECORD · ${String(product.id).padStart(2, '0')}`}</p>
      ${renderProductOptions(product, selectedVariantId)}
      <dl class="catalogue-details" id="product-details">
        ${detail('Colourways', product.colourways || 'To be confirmed')}
        ${detail('Audience', product.audience)}
        ${detail('Collection line', product.collection)}
        ${detail('Also shown in', (product.alsoShowIn || []).join('; '))}
        ${detail(product.aliasStatus ? `Also appears as · ${product.aliasStatus}` : 'Also appears as · identity to confirm', product.alias)}
        ${detail('Coverage', product.coverage)}
        ${detail('Development specifications', product.specifications)}
        ${detail('Specification status', product.specificationStatus)}
        ${detail('Price basis', product.priceBasis)}
        ${detail('Image status in master list', product.imageStatus)}
        ${detail('Development notes', product.notes)}
      </dl>
      ${accordion}
      <div class="dialog-price"><span>${safe(price.label)}</span><strong>${safe(price.value)}</strong></div>
      ${config?.preview ? '' : `<p><a class="product-permanent-link" href="${safe(productPageInfo(product).url)}">PRODUCT LINK ↗</a> · <a class="product-permanent-link" href="/#collections">COLLECTIONS ↗</a></p>`}
      <small class="product-prelaunch-note">${config?.preview
        ? 'Price not set. Purchasing disabled.'
        : 'This is a development record, not a product available to purchase. Specifications, sizing and launch availability are not confirmed.'}</small>
    </div>${renderProductStory(product, price)}`;
  selectedImage = 0;
  imageRequest += 1;
  cancelMotion('product-gallery');
  cancelMotion('product-gallery-image');
  cancelMotion('product-detail-enter');
  revealEditorial(body().querySelector?.('.product-story'));
}

function setSelectedVariantControls(product, variant, images) {
  const selectedSizeOption = body().querySelector('[data-size-option][aria-pressed="true"]');
  const previousSize = selectedSizeOption?.dataset.sizeOption;
  const nextSizes = productVariantSizes(product, variant.id);
  const retainedSize = previousSize != null && nextSizes.some(size => String(size) === String(previousSize))
    ? previousSize
    : null;
  const sizeContainer = body().querySelector('[data-size-options-container]');
  if (sizeContainer) sizeContainer.innerHTML = renderProductSizes(product, variant.id, retainedSize);
  body().querySelectorAll('[data-colour-option]').forEach(option => {
    option.setAttribute('aria-pressed', String(String(option.dataset.variantId) === String(variant.id)));
  });
  const colour = body().querySelector('[data-selected-colour]');
  if (colour) colour.textContent = variant.colour || 'To be confirmed';
  let sku = body().querySelector('[data-selected-sku]');
  if (variant.sku) {
    if (!sku) {
      sku = document.createElement('div');
      sku.className = 'product-selected-sku';
      sku.dataset.selectedSku = '';
      body().querySelector('.product-options-header')?.after(sku);
    }
    sku.textContent = `SKU ${variant.sku}`;
  } else sku?.remove();
  const status = body().querySelector('[data-variant-status]');
  const unavailable = variant.stock === 0 || variant.availability === 'unavailable';
  if (status) status.textContent = unavailable
    ? images.length
      ? 'Unavailable · image preview shown for identification only. Not available to purchase.'
      : 'Unavailable · approved imagery is not available for this colourway.'
    : images.length
      ? 'Development record · not available to purchase.'
      : 'Approved imagery is not available for this colourway. Product details remain unchanged.';
}

async function selectProductVariant(variantId, focusThumb = false, keepViewerOpen = false) {
  const product = currentProduct();
  const variant = productVariants(product).find(item => String(item.id) === String(variantId));
  if (!product || !variant) return;
  const request = ++imageRequest;
  if (config?.preview) cancelMotion('product-variant');
  const images = productVariantGallery(product, variant.id);
  const options = body().querySelector('.product-options');
  const status = options?.querySelector('[data-variant-status]');
  if (!images.length) {
    selectedVariantId = variant.id;
    activeProductImages = [];
    selectedImage = 0;
    const gallery = body().querySelector('.catalogue-dialog-images');
    if (gallery) gallery.innerHTML = renderImageGallery(product, []);
    setSelectedVariantControls(product, variant, []);
    if (keepViewerOpen && viewer?.open) {
      viewerReturnFocus = body().querySelector('[data-open-viewer]');
      setZoom(0, true);
      syncViewer();
    } else closeViewerBeforeProduct();
    if (focusThumb) body().querySelectorAll('[data-variant-id]').forEach(button => {
      if (String(button.dataset.variantId) === String(variant.id)) button.focus({ preventScroll: true });
    });
    return;
  }
  const candidate = new Image();
  candidate.decoding = 'async';
  candidate.onerror = () => {
    if (request !== imageRequest) return;
    const message = `Could not load ${variant.colour} imagery. Previous colour selection and image retained.`;
    if (status) status.textContent = message;
    const galleryStatus = body().querySelector('[data-gallery-status]');
    if (galleryStatus) {
      // Keep the gallery's visible failure feedback without announcing the same
      // error twice when the options' live status is also present.
      galleryStatus.setAttribute('aria-live', status ? 'off' : 'polite');
      galleryStatus.textContent = `Image unavailable. ${message}`;
    }
  };
  candidate.onload = async () => {
    try { await candidate.decode?.(); } catch { /* A loaded image remains usable if decode is unsupported. */ }
    if (request !== imageRequest || !body().isConnected) return;
    const gallery = body().querySelector('.catalogue-dialog-images');
    const oldMain = gallery?.querySelector('[data-gallery-main]');
    if (config?.preview && canFadePreviewVariant() && oldMain) {
      const fadeOut = animateWithTokens(oldMain, [{ opacity: 1 }, { opacity: 0.58 }], 'product-variant');
      if (fadeOut) await new Promise(resolve => {
        if (fadeOut.addEventListener) {
          fadeOut.addEventListener('finish', resolve, { once: true });
          fadeOut.addEventListener('cancel', resolve, { once: true });
        } else {
          fadeOut.onfinish = resolve;
          fadeOut.oncancel = resolve;
        }
      });
      if (request !== imageRequest || !body().isConnected) return;
    }
    selectedVariantId = variant.id;
    activeProductImages = images;
    selectedImage = 0;
    if (gallery) gallery.innerHTML = renderImageGallery(product, images);
    if (config?.preview && canFadePreviewVariant()) {
      const nextMain = gallery?.querySelector('[data-gallery-main]');
      if (nextMain) animateWithTokens(nextMain, [{ opacity: 0.58 }, { opacity: 1 }], 'product-variant');
    }
    setSelectedVariantControls(product, variant, images);
    if (keepViewerOpen && viewer?.open) {
      viewerReturnFocus = body().querySelector('[data-open-viewer]');
      setZoom(0, true);
      syncViewer();
    } else closeViewerBeforeProduct();
    if (focusThumb) body().querySelectorAll('[data-variant-id]').forEach(button => {
      if (String(button.dataset.variantId) === String(variant.id)) button.focus({ preventScroll: true });
    });
  };
  applyImageSource(candidate, images[0], PRODUCT_IMAGE_SIZES);
}

function setGalleryImage(index, focusThumb = false) {
  const product = currentProduct();
  const images = activeProductImages || product?.images || [];
  if (!images.length) return;
  const variants = productVariants(product);
  if (variants.length > 1 && images.length === 1) {
    const selectable = approvedGalleryVariants(product);
    if (selectable.length > 1) {
      const current = selectable.findIndex(variant => String(variant.id) === String(selectedVariantId));
      const direction = index >= selectedImage ? 1 : -1;
      const targetIndex = (current + direction + selectable.length) % selectable.length;
      const target = selectable[targetIndex];
      if (target && targetIndex !== current) {
        selectProductVariant(target.id, focusThumb, Boolean(viewer?.open));
      }
      return;
    }
  }
  const targetIndex = (index + images.length) % images.length;
  const request = ++imageRequest;
  cancelMotion('product-gallery-image');
  const image = images[targetIndex];
  const gallery = body().querySelector('[data-product-gallery]');
  const main = gallery?.querySelector('[data-gallery-main]');
  if (!main) return;
  if (targetIndex === selectedImage) {
    if (focusThumb) gallery.querySelector(`[data-image-index="${targetIndex}"]`)?.focus({ preventScroll: true });
    return;
  }
  const nextImage = new Image();
  nextImage.decoding = 'async';
  nextImage.onload = async () => {
    try { await nextImage.decode?.(); } catch { /* Loaded image remains usable if decode is unsupported. */ }
    if (request !== imageRequest || !main.isConnected) return;
    const commit = () => {
      if (request !== imageRequest || !main.isConnected) return;
      selectedImage = targetIndex;
      applyImageSource(main, image, PRODUCT_IMAGE_SIZES);
      gallery.querySelector('.product-gallery-stage')?.classList.remove('image-failed');
      main.alt = `${product.name} — ${image.label}${config?.preview ? '' : '; design concept'}`;
      gallery.querySelector('[data-gallery-caption]').innerHTML = config?.preview
        ? safe(image.label)
        : `${safe(image.label)} <span>· DESIGN CONCEPT</span>`;
      const status = gallery.querySelector('[data-gallery-status]');
      if (status) status.textContent = galleryCounterLabel(product, images, targetIndex);
      gallery.querySelectorAll('[data-image-index]').forEach(button => {
        const active = !button.dataset.variantId && Number(button.dataset.imageIndex) === targetIndex;
        button.classList.toggle('is-current', active);
        button.setAttribute('aria-pressed', String(active));
      });
      gallery.querySelectorAll('[data-gallery-image-index]').forEach(button => {
        const active = Number(button.dataset.galleryImageIndex) === targetIndex;
        button.classList.toggle('is-current', active);
        button.setAttribute('aria-pressed', String(active));
      });
      if (focusThumb) gallery.querySelector(`[data-gallery-image-index="${targetIndex}"], [data-image-index="${targetIndex}"]`)?.focus({ preventScroll: true });
      syncViewer();
    };
    const finishTransition = () => {
      if (request !== imageRequest) return;
      commit();
      animateWithTokens(main, [{ opacity: 0.72 }, { opacity: 1 }], 'product-gallery-image');
    };
    const fade = isReduced() ? null :
      animateWithTokens(main, [{ opacity: 1 }, { opacity: 0.55 }], 'product-gallery-image');
    if (!fade) {
      commit();
      return;
    }
    if (fade.addEventListener) {
      fade.addEventListener('finish', finishTransition, { once: true });
      fade.addEventListener('cancel', finishTransition, { once: true });
    } else {
      fade.onfinish = finishTransition;
      fade.oncancel = finishTransition;
    }
  };
  nextImage.onerror = () => {
    if (request !== imageRequest) return;
    const status = gallery.querySelector('[data-gallery-status]');
    if (status) status.textContent = `Image unavailable · ${image.label}. The current image is retained.`;
  };
  applyImageSource(nextImage, image, PRODUCT_IMAGE_SIZES);
}

function loadThumbnail(button) {
  const image = button?.querySelector('img[data-src]');
  if (!image) return;
  const product = currentProduct();
  const variantId = button.dataset.variantId;
  const imageIndex = button.dataset.galleryImageIndex ?? button.dataset.imageIndex;
  const source = button.dataset.galleryImageSrc;
  const asset = variantId
    ? productVariantGallery(product, variantId)[0]
    : source
      ? activeProductImages.find(item => item.src === source)
      : activeProductImages[Number(imageIndex)];
  if (asset) applyImageSource(image, asset, PRODUCT_IMAGE_SIZES);
  else image.src = image.dataset.src;
  image.loading = 'eager';
  image.removeAttribute('data-src');
  image.removeAttribute('data-srcset');
  image.removeAttribute('data-sizes');
}

function ensureViewer() {
  if (viewer) return viewer;
  viewer = document.createElement('dialog');
  viewer.className = 'product-image-viewer';
  viewer.setAttribute('aria-label', 'Product image viewer');
  viewer.innerHTML = `<div class="product-viewer-frame">
    <button type="button" data-viewer-close aria-label="Close image viewer">CLOSE <span aria-hidden="true">×</span></button>
    <button type="button" data-viewer-prev aria-label="Previous image">←</button>
    <figure><img data-viewer-image alt=""/><figcaption data-viewer-caption></figcaption></figure>
    <button type="button" data-viewer-next aria-label="Next image">→</button>
    <div class="product-viewer-zoom" role="group" aria-label="Image zoom">
      <button type="button" data-zoom-out aria-label="Zoom out">−</button><span data-zoom-level>100%</span>
      <button type="button" data-zoom-in aria-label="Zoom in">+</button><button type="button" data-zoom-reset>RESET</button>
    </div></div>`;
  document.body.append(viewer);
  viewer.addEventListener('error', onImageError, true);
  viewer.addEventListener('touchstart', onTouchStart, { passive: true });
  viewer.addEventListener('touchend', onTouchEnd, { passive: true });
  viewer.addEventListener('touchcancel', () => { touchStart = null; }, { passive: true });
  viewer.addEventListener('click', event => {
    if (event.target === viewer || event.target.closest('[data-viewer-close]')) viewer.close();
    if (event.target.closest('[data-viewer-prev]')) setGalleryImage(selectedImage - 1);
    if (event.target.closest('[data-viewer-next]')) setGalleryImage(selectedImage + 1);
    if (event.target.closest('[data-zoom-in]')) setZoom(0.2);
    if (event.target.closest('[data-zoom-out]')) setZoom(-0.2);
    if (event.target.closest('[data-zoom-reset]')) setZoom(0, true);
  });
  viewer.addEventListener('close', () => {
    viewerReturnFocus?.focus?.({ preventScroll: true });
    viewerReturnFocus = null;
  });
  viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') { event.preventDefault(); setGalleryImage(selectedImage + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); setGalleryImage(selectedImage - 1); }
  });
  return viewer;
}

let zoom = 1;
function setZoom(delta, reset = false) {
  zoom = reset ? 1 : Math.max(1, Math.min(2.5, zoom + delta));
  const image = viewer?.querySelector('[data-viewer-image]');
  if (image) image.style.transform = `scale(${zoom})`;
  const level = viewer?.querySelector('[data-zoom-level]');
  if (level) level.textContent = `${Math.round(zoom * 100)}%`;
}

function syncViewer() {
  if (!viewer) return;
  const product = currentProduct();
  const images = activeProductImages || product?.images || [];
  const image = images[selectedImage];
  if (!image) return;
  const img = viewer.querySelector('[data-viewer-image]');
  img.src = image.src;
  img.alt = `${product.name} — ${image.label}; design concept`;
  viewer.querySelector('[data-viewer-caption]').textContent = viewerCaption(product, images, selectedImage);
  const canNavigateVariants = images.length === 1 && approvedGalleryVariants(product).length > 1;
  viewer.querySelectorAll('[data-viewer-prev], [data-viewer-next]').forEach(button => {
    button.disabled = images.length < 2 && !canNavigateVariants;
  });
}

function onProductClick(event) {
  const colourOption = event.target.closest('[data-colour-option]');
  if (colourOption) { selectProductVariant(colourOption.dataset.variantId); return; }
  const sizeOption = event.target.closest('[data-size-option]');
  if (sizeOption) {
    const group = sizeOption.closest('.product-size-options');
    group?.querySelectorAll('[data-size-option]').forEach(option =>
      option.setAttribute('aria-pressed', String(option === sizeOption)));
    return;
  }
  const thumb = event.target.closest('[data-image-index]');
  if (thumb) {
    if (thumb.dataset.variantId) selectProductVariant(thumb.dataset.variantId, true);
    else setGalleryImage(Number(thumb.dataset.imageIndex), true);
    return;
  }
  const galleryThumb = event.target.closest('[data-gallery-image-index]');
  if (galleryThumb) { setGalleryImage(Number(galleryThumb.dataset.galleryImageIndex), true); return; }
  if (event.target.closest('[data-gallery-prev]')) { setGalleryImage(selectedImage - 1); return; }
  if (event.target.closest('[data-gallery-next]')) { setGalleryImage(selectedImage + 1); return; }
  if (event.target.closest('[data-open-viewer]')) {
    const images = activeProductImages || currentProduct()?.images || [];
    if (!images.length) return;
    viewerReturnFocus = event.target.closest('[data-open-viewer]');
    const imageViewer = ensureViewer();
    zoom = 1;
    setZoom(0, true);
    if (!imageViewer.open) imageViewer.showModal();
    syncViewer();
    imageViewer.querySelector('[data-viewer-close]').focus({ preventScroll: true });
    return;
  }
  const storyReturn = event.target.closest('.product-story-return');
  if (storyReturn) {
    event.preventDefault();
    body().querySelector('#product-details')?.scrollIntoView({ behavior: isReduced() ? 'auto' : 'smooth', block: 'start' });
  }
}

function onProductKeydown(event) {
  if (!dialog()?.open || viewer?.open) return;
  const tag = event.target?.tagName;
  if (['INPUT', 'TEXTAREA', 'SELECT', 'SUMMARY'].includes(tag)) return;
  if (tag === 'A') return;
  if (tag === 'BUTTON' && !event.target.closest('[data-open-viewer], [data-image-index], [data-gallery-image-index], [data-gallery-prev], [data-gallery-next]')) return;
  const product = currentProduct();
  const images = activeProductImages || product?.images || [];
  const hasMultipleVariants = productVariants(product).filter(variant => productVariantGallery(product, variant.id).length).length > 1;
  if ((images.length < 2 && !hasMultipleVariants) || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  setGalleryImage(selectedImage + (event.key === 'ArrowRight' ? 1 : -1));
}

function onDetailsToggle(event) {
  const detailsPanel = event.target;
  if (!(detailsPanel instanceof HTMLDetailsElement) || !detailsPanel.open) return;
  const content = detailsPanel.querySelector('p');
  if (!content) return;
  animateWithTokens(content, [
    { opacity: 0.72, transform: 'translateY(4px)' },
    { opacity: 1, transform: 'translateY(0)' },
  ], 'product-detail-content');
}

function onGalleryIntent(event) {
  const thumb = event.target.closest('[data-image-index], [data-gallery-image-index]');
  if (thumb) loadThumbnail(thumb);
}

function onTouchStart(event) {
  touchStart = null;
  if (event.touches.length !== 1 || (!viewer?.open && !event.target.closest('[data-product-gallery]'))) return;
  const touch = event.touches[0];
  touchStart = { x: touch.clientX, y: touch.clientY, viewer: Boolean(viewer?.open) };
}
function onTouchEnd(event) {
  if (!touchStart) return;
  const wasViewer = touchStart.viewer;
  const touch = event.changedTouches[0];
  const dx = touch.clientX - touchStart.x;
  const dy = touch.clientY - touchStart.y;
  touchStart = null;
  if (Math.abs(dx) > 54 && Math.abs(dx) > Math.abs(dy) * 1.3 &&
      wasViewer === Boolean(viewer?.open)) setGalleryImage(selectedImage + (dx < 0 ? 1 : -1));
}

function currentState() {
  const state = typeof history !== 'undefined' ? history.state : null;
  return { ...(state && typeof state === 'object' ? state : {}) };
}
const currentLocation = () => typeof location !== 'undefined'
  ? location : { hash: '', pathname: '/', search: '' };

function dispatchRestore() {
  if (context && typeof CustomEvent === 'function' && document.dispatchEvent) {
    document.dispatchEvent(new CustomEvent('fsd:restore-collection-context', { detail: context }));
  }
  context = null;
}

function closeViewerBeforeProduct() {
  if (viewer?.open) {
    viewerReturnFocus = null;
    viewer.close();
  }
}

function closeProduct({ fromHistory = false, restore = true } = {}) {
  if (config?.preview && config?.inline) return;
  if (!fromHistory && ownedEntry && productRouteMatch(currentLocation()) && typeof history !== 'undefined') {
    history.back();
    return;
  }
  closeViewerBeforeProduct();
  const productDialog = dialog();
  if (productDialog?.open) productDialog.close();
  document.documentElement?.classList?.remove('fsd-modal-open');
  const priorContext = context;
  const previousOpener = opener;
  const closedId = currentId;
  const restoredScrollY = sourceState?.catalogue?.scrollY;
  opener = null;
  currentId = null;
  restoreProductSEO();
  if (restore) dispatchRestore();
  if (restore && !priorContext && sourceState?.catalogue) {
    if (typeof CustomEvent === 'function' && document.dispatchEvent) {
      document.dispatchEvent(new CustomEvent('fsd:restore-catalogue-state', { detail: sourceState.catalogue }));
    }
  }
  const restoreFocus = () => {
    if (currentId !== null) return;
    if (priorContext) {
      const restoredAction = document.querySelector(`[data-product-id="${closedId}"]`);
      if (restoredAction?.isConnected) restoredAction.focus({ preventScroll: true });
      else if (previousOpener?.isConnected) previousOpener.focus({ preventScroll: true });
    } else if (sourceState?.catalogue) {
      const openerIsPageRoot = ['BODY', 'HTML'].includes(previousOpener?.tagName);
      if (previousOpener?.isConnected && !openerIsPageRoot) previousOpener.focus({ preventScroll: true });
      else {
        const restoredCardAction = document.querySelector(`[data-product="${closedId}"]`);
        if (restoredCardAction?.isConnected) restoredCardAction.focus({ preventScroll: true });
        else previousOpener?.focus?.({ preventScroll: true });
      }
    } else if (previousOpener?.isConnected) previousOpener.focus({ preventScroll: true });
  };
  if (restore) {
    restoreFocus();
    // History traversal restores its own focus after popstate has returned.
    // Apply our source focus in the next task, after that browser step.
    if (typeof window !== 'undefined') window.setTimeout(() => {
      if (currentId !== null) return;
      if (Number.isFinite(restoredScrollY)) {
        window.scrollTo({ top: restoredScrollY, behavior: 'instant' });
      }
      restoreFocus();
    }, 0);
  }
  if (!fromHistory && productRouteMatch(currentLocation())) {
    if (typeof history !== 'undefined') history.replaceState(currentState(), '', sourceURL || `${currentLocation().pathname}${currentLocation().search}#products`);
  }
  ownedEntry = false;
}

function syncFromLocation() {
  const match = productRouteMatch(currentLocation());
  if (match) {
    const id = Number(match[1]);
    if (config.products.some(product => product.id === id)) {
      if (currentId !== id) {
        const routeState = typeof history !== 'undefined' ? history.state : null;
        const openFromHistory = () => {
          if (Number(productRouteMatch(currentLocation())?.[1]) !== id) return;
          openProduct(id, {
            fromHistory: true,
            context: routeState?.fsdProductContext || null,
            historyState: routeState,
          });
        };
        const handoff = new CustomEvent('fsd:product-route-handoff', {
          cancelable: true,
          detail: { openProduct: openFromHistory },
        });
        document.dispatchEvent(handoff);
        if (!handoff.defaultPrevented) openFromHistory();
      }
      return;
    }
  }
  if (currentId !== null) closeProduct({ fromHistory: true });
}

function openProduct(id, options = {}) {
  const product = config?.products.find(item => config?.preview
    ? String(item.id) === String(id)
    : item.id === Number(id));
  if (!product) return;
  if (currentId === product.id && dialog()?.open) return;
  if (currentId !== null) closeProduct({ fromHistory: true, restore: false });
  const productDialog = dialog();
  const fromHistory = Boolean(options.fromHistory);
  const routeState = options.historyState || (typeof history !== 'undefined' ? history.state : null);
  const loc = currentLocation();
  if (!config?.preview) {
    sourceURL = `${isProductPath(loc) ? '/' : loc.pathname}${loc.search}${loc.hash && !productRouteMatch(loc) ? loc.hash : '#products'}`;
    sourceState = { ...currentState(), catalogue: config.getCatalogueState?.() || null };
  }
  context = options.context || null;
  opener = options.opener || document.activeElement;
  currentId = product.id;
  ownedEntry = false;
  renderProduct(product);
  if (config?.inline) {
    productDialog.setAttribute('open', '');
    productDialog.classList.add('draft-inline-product');
  } else {
    document.documentElement?.classList?.add('fsd-modal-open');
    if (!productDialog.open) productDialog.showModal();
  }
  if (!config?.preview && !fromHistory && !productRouteMatch(loc) && typeof history !== 'undefined') {
    const state = { ...sourceState };
    history.pushState({
      ...state,
      fsdProductEntry: true,
      fsdProductContext: context,
      fsdSourceURL: sourceURL,
      fsdSourceState: state,
    }, '', `#product/${product.id}`);
    ownedEntry = true;
  } else if (!config?.preview && fromHistory) {
    ownedEntry = Boolean(routeState?.fsdProductEntry);
    sourceURL = routeState?.fsdSourceURL || sourceURL;
    sourceState = routeState?.fsdSourceState || sourceState;
    if (!routeState?.fsdSourceURL && !context && sourceState?.catalogue) {
      sourceState.catalogue = { ...sourceState.catalogue, archiveOpen: true };
    }
  }
  const close = config?.inline ? null : productDialog.querySelector?.('#close-dialog');
  close?.focus({ preventScroll: true });
  body().querySelectorAll?.('[data-image-index]')?.forEach(button => loadThumbnail(button));
  animateWithTokens(body(), [
    { opacity: 0.92, transform: 'translateY(4px)' },
    { opacity: 1, transform: 'translateY(0)' },
  ], 'product-detail-enter');
}

export function initProductExperience(options) {
  config = options;
  if (listenersReady) return;
  listenersReady = true;
  const productDialog = dialog();
  body()?.addEventListener?.('click', onProductClick);
  body()?.addEventListener?.('focusin', onGalleryIntent);
  body()?.addEventListener?.('pointerover', onGalleryIntent, { passive: true });
  body()?.addEventListener?.('keydown', onProductKeydown);
  body()?.addEventListener?.('touchstart', onTouchStart, { passive: true });
  body()?.addEventListener?.('touchend', onTouchEnd, { passive: true });
  body()?.addEventListener?.('touchcancel', () => { touchStart = null; }, { passive: true });
  body()?.addEventListener?.('toggle', onDetailsToggle, true);
  body()?.addEventListener?.('error', onImageError, true);
  if (config?.preview && config?.inline) {
    productDialog.setAttribute('open', '');
    productDialog.classList.add('draft-inline-product');
    productDialog.addEventListener?.('cancel', event => event.preventDefault());
  } else {
    productDialog.addEventListener?.('cancel', event => {
      event.preventDefault();
      closeProduct();
    });
  }
  if (!(config?.preview && config?.inline)) productDialog.addEventListener?.('close', () => {
    if (productDialog.open || currentId === null) return;
    if (ownedEntry && productRouteMatch(currentLocation()) && typeof history !== 'undefined') {
      history.back();
      closeProduct({ fromHistory: true });
    } else closeProduct();
    if (!document.querySelector('dialog[open]')) document.documentElement?.classList?.remove('fsd-modal-open');
    if (viewer?.open) viewer.close();
  });
  if (typeof window !== 'undefined' && !config?.preview) {
    window.addEventListener?.('popstate', syncFromLocation);
    window.addEventListener?.('hashchange', syncFromLocation);
  }
  if (!config?.preview && productRouteMatch(currentLocation())) syncFromLocation();
}

export function showProductExperience(id, options = {}) {
  openProduct(id, options);
}

export function closeProductExperience() {
  closeProduct();
}

export function restoreCatalogueState(state) {
  document.dispatchEvent(new CustomEvent('fsd:restore-catalogue-state', { detail: state }));
}

function onImageError(event) {
  const image = event.target;
  if (typeof HTMLImageElement === 'undefined' || !(image instanceof HTMLImageElement)) return;
  if (image.matches('[data-gallery-main]')) {
    image.closest('.product-gallery-stage')?.classList.add('image-failed');
    const status = body().querySelector('[data-gallery-status]');
    if (status) status.textContent = 'Mapped image unavailable. Other product record details remain available.';
  }
  if (image.closest('.product-gallery-thumbnails')) {
    const status = body().querySelector('[data-gallery-status]');
    if (status) status.textContent = 'A mapped thumbnail could not be displayed; the image label remains available.';
  }
  if (image.closest('.product-story-lead figure')) {
    image.closest('figure')?.classList.add('image-failed');
  }
  if (image.matches('[data-viewer-image]')) {
    const caption = viewer?.querySelector('[data-viewer-caption]');
    if (caption) caption.textContent = 'This mapped image could not be displayed.';
  }
}
