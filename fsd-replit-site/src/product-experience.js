import { priceInfo, safe } from './catalogue-data.js';
import { revealEditorial, cancelMotion, animateWithTokens } from './motion.js';
import { renderProductStory } from './product-story.js';

const PRODUCT_HASH = /^#product\/(\d+)$/;
let config = null;
let currentId = null;
let opener = null;
let ownedEntry = false;
let sourceURL = null;
let sourceState = null;
let context = null;
let selectedImage = 0;
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
const detail = (label, value) => value
  ? `<dt>${safe(label)}</dt><dd>${safe(value)}</dd>` : '';

function renderImageGallery(product) {
  const images = Array.isArray(product.images) ? product.images : [];
  if (!images.length) {
    const label = product.imageStatus.startsWith('Image exists')
      ? 'Concept image mapping pending'
      : product.imageStatus.startsWith('Brief only') ? 'Image under review' : 'Imagery to follow';
    return `<div class="catalogue-placeholder"><span>FSD / PRE-LAUNCH</span>
      <strong>${safe(product.category)}</strong><small>${safe(label)}</small></div>`;
  }
  const active = images[0];
  return `<div class="product-gallery" data-product-gallery aria-label="Product image gallery">
    <div class="product-gallery-stage">
      <button class="product-gallery-viewer-trigger" type="button" data-open-viewer aria-label="View ${safe(active.label)} full screen">
        <img data-gallery-main src="${safe(active.src)}" alt="${safe(product.name)} — ${safe(active.label)}; design concept" decoding="async"/>
        <span class="product-gallery-expand" aria-hidden="true">EXPAND ↗</span>
      </button>
      <p data-gallery-caption>${safe(active.label)} <span>· DESIGN CONCEPT</span></p>
    </div>
    ${images.length > 1 ? `<div class="product-gallery-thumbnails" role="group" aria-label="Choose a mapped colourway image">
      ${images.map((image, index) => `<figure>
        <button type="button" class="product-gallery-thumb${index === 0 ? ' is-current' : ''}" data-image-index="${index}"
          aria-pressed="${index === 0}" aria-label="Show ${safe(image.label)}">
          <img ${index === 0 ? `src="${safe(image.src)}"` : `data-src="${safe(image.src)}"`} alt="" loading="lazy" decoding="async"/>
        </button><figcaption>${safe(image.label)}</figcaption>
      </figure>`).join('')}
    </div>` : ''}
    <div class="product-gallery-controls">
      ${images.length > 1 ? `<button type="button" data-gallery-prev aria-label="Previous mapped image">← PREVIOUS</button>
        <span data-gallery-status aria-live="polite">1 / ${images.length} · ${safe(active.label)}</span>
        <button type="button" data-gallery-next aria-label="Next mapped image">NEXT →</button>`
        : `<span data-gallery-status aria-live="polite">1 / 1 · ${safe(active.label)}</span>`}
    </div>
  </div>`;
}

function renderProduct(product) {
  const price = priceInfo(product);
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
  body().innerHTML = `<div class="catalogue-dialog-images">${renderImageGallery(product)}</div>
    <div class="dialog-copy">
      <p class="section-kicker">${safe(product.category)} / PRE-LAUNCH</p><h2 id="product-title">${safe(product.name)}</h2>
      <p class="product-record-label">PRODUCT RECORD · ${String(product.id).padStart(2, '0')}</p>
      <dl class="catalogue-details" id="product-details">
        ${detail('Colourways', product.colourways || 'To be confirmed')}
        ${detail('Audience', product.audience)}
        ${detail('Collection line', product.collection)}
        ${detail('Also shown in', product.alsoShowIn.join('; '))}
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
      <small class="product-prelaunch-note">This is a development record, not a product available to purchase. Specifications, sizing and launch availability are not confirmed.</small>
    </div>${renderProductStory(product, price)}`;
  selectedImage = 0;
  imageRequest += 1;
  cancelMotion('product-gallery');
  cancelMotion('product-gallery-image');
  cancelMotion('product-detail-enter');
  revealEditorial(body().querySelector?.('.product-story'));
}

function setGalleryImage(index, focusThumb = false) {
  const product = currentProduct();
  const images = product?.images || [];
  if (!images.length) return;
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
      main.src = image.src;
      gallery.querySelector('.product-gallery-stage')?.classList.remove('image-failed');
      main.alt = `${product.name} — ${image.label}; design concept`;
      gallery.querySelector('[data-gallery-caption]').innerHTML = `${safe(image.label)} <span>· DESIGN CONCEPT</span>`;
      const status = gallery.querySelector('[data-gallery-status]');
      if (status) status.textContent = `${targetIndex + 1} / ${images.length} · ${image.label}`;
      gallery.querySelectorAll('[data-image-index]').forEach(button => {
        const active = Number(button.dataset.imageIndex) === targetIndex;
        button.classList.toggle('is-current', active);
        button.setAttribute('aria-pressed', String(active));
      });
      if (focusThumb) gallery.querySelector(`[data-image-index="${targetIndex}"]`)?.focus({ preventScroll: true });
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
  nextImage.src = image.src;
}

function loadThumbnail(button) {
  const image = button?.querySelector('img[data-src]');
  if (!image) return;
  image.loading = 'eager';
  image.src = image.dataset.src;
  image.removeAttribute('data-src');
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
  const image = product?.images?.[selectedImage];
  if (!image) return;
  const img = viewer.querySelector('[data-viewer-image]');
  img.src = image.src;
  img.alt = `${product.name} — ${image.label}; design concept`;
  viewer.querySelector('[data-viewer-caption]').textContent = `${image.label} · DESIGN CONCEPT`;
  viewer.querySelectorAll('[data-viewer-prev], [data-viewer-next]').forEach(button => {
    button.disabled = product.images.length < 2;
  });
}

function onProductClick(event) {
  const thumb = event.target.closest('[data-image-index]');
  if (thumb) { setGalleryImage(Number(thumb.dataset.imageIndex), true); return; }
  if (event.target.closest('[data-gallery-prev]')) { setGalleryImage(selectedImage - 1); return; }
  if (event.target.closest('[data-gallery-next]')) { setGalleryImage(selectedImage + 1); return; }
  if (event.target.closest('[data-open-viewer]')) {
    const images = currentProduct()?.images || [];
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
  if (tag === 'BUTTON' && !event.target.closest('[data-open-viewer], [data-image-index], [data-gallery-prev], [data-gallery-next]')) return;
  const images = currentProduct()?.images || [];
  if (images.length < 2 || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
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
  const thumb = event.target.closest('[data-image-index]');
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
  if (!fromHistory && ownedEntry && PRODUCT_HASH.test(currentLocation().hash) && typeof history !== 'undefined') {
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
  if (!fromHistory && PRODUCT_HASH.test(currentLocation().hash)) {
    if (typeof history !== 'undefined') history.replaceState(currentState(), '', sourceURL || `${currentLocation().pathname}${currentLocation().search}#products`);
  }
  ownedEntry = false;
}

function syncFromLocation() {
  const match = currentLocation().hash.match(PRODUCT_HASH);
  if (match) {
    const id = Number(match[1]);
    if (config.products.some(product => product.id === id)) {
      if (currentId !== id) {
        const routeState = typeof history !== 'undefined' ? history.state : null;
        const openFromHistory = () => {
          if (currentLocation().hash !== `#product/${id}`) return;
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
  const product = config?.products.find(item => item.id === Number(id));
  if (!product) return;
  if (currentId === product.id && dialog()?.open) return;
  if (currentId !== null) closeProduct({ fromHistory: true, restore: false });
  const productDialog = dialog();
  const fromHistory = Boolean(options.fromHistory);
  const routeState = options.historyState || (typeof history !== 'undefined' ? history.state : null);
  const loc = currentLocation();
  sourceURL = `${loc.pathname}${loc.search}${loc.hash && !PRODUCT_HASH.test(loc.hash) ? loc.hash : '#products'}`;
  sourceState = { ...currentState(), catalogue: config.getCatalogueState?.() || null };
  context = options.context || null;
  opener = options.opener || document.activeElement;
  currentId = product.id;
  ownedEntry = false;
  renderProduct(product);
  document.documentElement?.classList?.add('fsd-modal-open');
  if (!productDialog.open) productDialog.showModal();
  if (!fromHistory && !PRODUCT_HASH.test(loc.hash) && typeof history !== 'undefined') {
    const state = { ...sourceState };
    history.pushState({
      ...state,
      fsdProductEntry: true,
      fsdProductContext: context,
      fsdSourceURL: sourceURL,
      fsdSourceState: state,
    }, '', `#product/${product.id}`);
    ownedEntry = true;
  } else if (fromHistory) {
    ownedEntry = Boolean(routeState?.fsdProductEntry);
    sourceURL = routeState?.fsdSourceURL || sourceURL;
    sourceState = routeState?.fsdSourceState || sourceState;
    if (!routeState?.fsdSourceURL && !context && sourceState?.catalogue) {
      sourceState.catalogue = { ...sourceState.catalogue, archiveOpen: true };
    }
  }
  const close = productDialog.querySelector?.('#close-dialog');
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
  productDialog.addEventListener?.('cancel', event => {
    event.preventDefault();
    closeProduct();
  });
  productDialog.addEventListener?.('close', () => {
    if (productDialog.open || currentId === null) return;
    if (ownedEntry && PRODUCT_HASH.test(currentLocation().hash) && typeof history !== 'undefined') {
      history.back();
      closeProduct({ fromHistory: true });
    } else closeProduct();
    if (!document.querySelector('dialog[open]')) document.documentElement?.classList?.remove('fsd-modal-open');
    if (viewer?.open) viewer.close();
  });
  if (typeof window !== 'undefined') {
    window.addEventListener?.('popstate', syncFromLocation);
    window.addEventListener?.('hashchange', syncFromLocation);
  }
  if (PRODUCT_HASH.test(currentLocation().hash || '')) syncFromLocation();
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
