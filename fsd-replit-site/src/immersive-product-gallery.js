import { galleryIndexesForVariant } from './product-gallery-model.js';

export function maxZoomForSource(sourceWidth, sourceHeight, viewportWidth, viewportHeight, ceiling = 3) {
  const values = [sourceWidth, sourceHeight, viewportWidth, viewportHeight].map(Number);
  if (values.some(value => !Number.isFinite(value) || value <= 0)) return 1;
  const fitScale = Math.min(values[2] / values[0], values[3] / values[1]);
  return Math.max(1, Math.min(Number(ceiling) || 3, 1 / fitScale));
}

export function mountImmersiveProductGallery({
  dialog,
  body,
  getProduct,
  getImages,
  getVariant,
  selectImage,
  selectPlaceholder = () => {},
}) {
  const doc = dialog?.ownerDocument;
  if (!doc?.defaultView?.MutationObserver || !doc.body) return () => {};
  const viewer = doc.createElement('dialog');
  viewer.id = 'fsd-product-viewer';
  viewer.className = 'fsd-photo-viewer';
  viewer.setAttribute('aria-labelledby', 'fsd-photo-viewer-title');
  viewer.innerHTML = `
    <header class="fsd-photo-viewer__header">
      <div><span>FSD / PRODUCT PHOTOGRAPHY</span><h2 id="fsd-photo-viewer-title"></h2></div>
      <button type="button" data-viewer-close aria-label="Close full-screen gallery">CLOSE ×</button>
    </header>
    <div class="fsd-photo-viewer__tools">
      <button type="button" data-viewer-prev aria-label="Previous product photograph">←</button>
      <p data-viewer-caption role="status" aria-live="polite"></p>
      <button type="button" data-viewer-next aria-label="Next product photograph">→</button>
      <button type="button" data-viewer-zoom aria-pressed="false">ZOOM</button>
      <label>Magnification <input data-viewer-scale aria-label="Image magnification" type="range" min="1" max="3" step="any" value="1" /></label>
    </div>
    <div class="fsd-photo-viewer__stage" data-viewer-stage tabindex="0" role="group" aria-label="Full-size photograph. Use arrow keys to browse. Zoom to inspect and drag or scroll to pan.">
      <div class="fsd-photo-viewer__plane"><img data-viewer-photo alt="" draggable="false" hidden /></div>
      <div data-viewer-error role="group" aria-label="Photograph load error" hidden>
        <p data-viewer-error-message role="status"></p>
        <button type="button" data-viewer-retry>TRY AGAIN</button>
      </div>
    </div>
    <div class="fsd-photo-viewer__thumbs" role="group" aria-label="Views of the selected colourway"></div>
    <p class="fsd-photo-viewer__hint">Original catalogue photographs · Arrow keys to browse · Escape to return · Zoom and drag to inspect</p>`;
  doc.body.append(viewer);
  const stage = viewer.querySelector('[data-viewer-stage]');
  const plane = viewer.querySelector('.fsd-photo-viewer__plane');
  const photo = viewer.querySelector('[data-viewer-photo]');
  const error = viewer.querySelector('[data-viewer-error]');
  const errorMessage = viewer.querySelector('[data-viewer-error-message]');
  const scaleInput = viewer.querySelector('[data-viewer-scale]');
  const zoomButton = viewer.querySelector('[data-viewer-zoom]');
  const thumbs = viewer.querySelector('.fsd-photo-viewer__thumbs');
  let generation = 0;
  let returnFocus = null;
  let currentIndex = -1;
  let viewerProduct = null;
  let zoom = 1;
  let maxZoom = 1;
  let resizeFrame = 0;
  let suppressClickUntil = 0;
  let gesture = null;
  const pointers = new Set();

  const model = () => {
    const product = getProduct();
    const images = getImages() || [];
    const variant = getVariant() || {};
    const indexes = product ? galleryIndexesForVariant(product, images, variant) : [];
    const pressed = body.querySelector('[data-catalogue-image-index][aria-pressed="true"]');
    const selected = pressed ? Number(pressed.dataset.catalogueImageIndex) : -1;
    const galleryViews = [...body.querySelectorAll('.product-detail-gallery [data-catalogue-gallery-view]')]
      .filter(button => button.hasAttribute('data-catalogue-placeholder-view')
        || indexes.includes(Number(button.dataset.catalogueImageIndex)));
    const selectedView = galleryViews.find(button => button.getAttribute('aria-pressed') === 'true') || null;
    return {
      product,
      images,
      variant,
      indexes,
      selected: indexes.includes(selected) ? selected : indexes[0] ?? -1,
      galleryViews,
      selectedView,
    };
  };
  const setZoom = value => {
    zoom = Math.max(1, Math.min(maxZoom, Number(value) || 1));
    plane.style.width = `${zoom * 100}%`;
    plane.style.height = `${zoom * 100}%`;
    scaleInput.max = String(maxZoom);
    scaleInput.value = String(zoom);
    scaleInput.disabled = maxZoom <= 1;
    zoomButton.disabled = maxZoom <= 1;
    zoomButton.setAttribute('aria-pressed', String(zoom > 1));
    stage.dataset.zoomed = String(zoom > 1);
    if (zoom === 1) { stage.scrollTop = 0; stage.scrollLeft = 0; }
  };
  const updateZoomLimit = (width, height) => {
    maxZoom = maxZoomForSource(width, height, stage.clientWidth, stage.clientHeight);
    setZoom(zoom);
  };
  const paint = index => {
    const state = model();
    if (!state.indexes.includes(index)) return;
    currentIndex = index;
    selectImage(index);
    queueMicrotask(refresh);
    maxZoom = 1;
    setZoom(1);
    const image = state.images[index];
    const token = ++generation;
    photo.hidden = true;
    error.hidden = true;
    stage.setAttribute('aria-busy', 'true');
    viewer.querySelector('#fsd-photo-viewer-title').textContent = state.product.name;
    viewer.querySelector('[data-viewer-caption]').textContent =
      `${state.indexes.indexOf(index) + 1} / ${state.indexes.length} · ${image.label || 'Product view'}${image.colourway ? ` · ${image.colourway}` : ''}`;
    ['prev', 'next'].forEach(direction => {
      viewer.querySelector(`[data-viewer-${direction}]`).disabled = state.indexes.length < 2;
    });
    thumbs.querySelectorAll('button').forEach(button =>
      button.setAttribute('aria-pressed', String(Number(button.dataset.viewerIndex) === index)));
    // Decode the original catalogue asset before showing it. Stale or failed
    // requests cannot leave another colourway visible under a new caption.
    const incoming = new doc.defaultView.Image();
    let ready;
    if (typeof incoming.decode === 'function') {
      incoming.src = image.src;
      ready = Promise.resolve().then(() => incoming.decode());
    } else {
      ready = new Promise((resolve, reject) => {
        incoming.onload = resolve;
        incoming.onerror = reject;
        incoming.src = image.src;
      });
    }
    ready.then(() => {
      if (generation !== token || !viewer.open) return;
      updateZoomLimit(incoming.naturalWidth, incoming.naturalHeight);
      photo.src = image.src;
      photo.alt = `${state.product.name} — ${image.label || 'Product view'}`;
      photo.hidden = false;
      stage.removeAttribute('aria-busy');
    }).catch(() => {
      if (generation !== token || !viewer.open) return;
      errorMessage.textContent = `${state.product.name} — this photograph could not load. Retry or choose another view.`;
      error.hidden = false;
      stage.removeAttribute('aria-busy');
    });
  };
  const step = direction => {
    const state = model();
    if (viewer.open) {
      if (state.indexes.length < 2) return;
      const position = Math.max(0, state.indexes.indexOf(currentIndex));
      const next = state.indexes[(position + direction + state.indexes.length) % state.indexes.length];
      paint(next);
      return;
    }
    if (state.galleryViews.length < 2) return;
    const currentViewIndex = state.galleryViews.indexOf(state.selectedView);
    const position = currentViewIndex < 0 ? 0 : currentViewIndex;
    const nextView = state.galleryViews[
      (position + direction + state.galleryViews.length) % state.galleryViews.length
    ];
    if (nextView.hasAttribute('data-catalogue-placeholder-view')) {
      selectPlaceholder(nextView);
      queueMicrotask(refresh);
      return;
    }
    const nextImageIndex = Number(nextView.dataset.catalogueImageIndex);
    if (Number.isInteger(nextImageIndex)) {
      selectImage(nextImageIndex, { immediate: true });
      queueMicrotask(refresh);
    }
  };
  const open = opener => {
    const state = model();
    if (!state.indexes.length || !body.querySelector('[data-catalogue-main-image]:not([hidden])')) return;
    returnFocus = opener;
    viewerProduct = state.product.id;
    thumbs.replaceChildren();
    if (state.indexes.length > 1) state.indexes.forEach(index => {
      const image = state.images[index];
      const button = doc.createElement('button');
      button.type = 'button';
      button.dataset.viewerIndex = String(index);
      button.setAttribute('aria-label', image.label || 'Product view');
      const thumbnail = doc.createElement('img');
      thumbnail.src = image.src;
      thumbnail.alt = '';
      thumbnail.loading = 'lazy';
      button.append(thumbnail);
      button.addEventListener('click', () => paint(index));
      thumbs.append(button);
    });
    viewer.showModal();
    paint(state.selected);
    viewer.querySelector('[data-viewer-close]').focus({ preventScroll: true });
  };
  const refresh = () => {
    if (!dialog.open) return;
    const state = model();
    if (viewer.open && (viewerProduct !== state.product?.id || !state.indexes.includes(currentIndex))) viewer.close();
    const gallery = body.querySelector('.product-detail-gallery');
    const main = gallery?.querySelector('[data-catalogue-main-image]');
    if (!gallery) return;
    let tools = gallery.querySelector('[data-immersive-gallery-tools]');
    if (!tools) {
      tools = doc.createElement('div');
      tools.className = 'fsd-gallery-tools';
      tools.dataset.immersiveGalleryTools = '';
      tools.innerHTML = `<button type="button" data-gallery-step="-1" aria-label="Previous selected-colourway view">←</button>
        <span data-gallery-count aria-live="polite"></span>
        <button type="button" data-gallery-step="1" aria-label="Next selected-colourway view">→</button>
        <button type="button" data-gallery-fullscreen>FULL-SCREEN / INSPECT</button>`;
      const featureGrid = gallery.querySelector('.product-detail-gallery__feature-grid');
      (featureGrid || gallery.querySelector('figure'))?.after(tools);
      const imageStage = gallery.querySelector('.product-detail-image-stage');
      if (imageStage) {
        imageStage.tabIndex = 0;
        imageStage.setAttribute('role', 'group');
        imageStage.setAttribute('aria-label', 'Product photographs. Use left and right arrow keys to browse this colourway.');
      }
    }
    const count = tools.querySelector('[data-gallery-count]');
    const selectedViewIndex = state.galleryViews.indexOf(state.selectedView);
    const text = state.galleryViews.length
      ? `${Math.max(0, selectedViewIndex) + 1} / ${state.galleryViews.length} VIEWS`
      : 'IMAGE PENDING';
    if (count.textContent !== text) count.textContent = text;
    tools.querySelectorAll('[data-gallery-step]').forEach(button => { button.disabled = state.galleryViews.length < 2; });
    tools.querySelector('[data-gallery-fullscreen]').disabled =
      !state.indexes.length || !main || main.hidden || state.selectedView?.hasAttribute('data-catalogue-placeholder-view');
  };
  const observer = new doc.defaultView.MutationObserver(refresh);
  observer.observe(body, { childList: true, subtree: true });
  const onBodyClick = event => {
    if (Date.now() < suppressClickUntil && event.target.closest('[data-gallery-photo-open]')) {
      event.preventDefault(); event.stopImmediatePropagation(); return;
    }
    const photo = event.target.closest('[data-gallery-photo-open]');
    if (photo) {
      event.preventDefault();
      event.stopImmediatePropagation();
      open(photo);
      return;
    }
    const full = event.target.closest('[data-gallery-fullscreen]');
    const direction = event.target.closest('[data-gallery-step]');
    if (full) open(full);
    if (direction) step(Number(direction.dataset.galleryStep));
    queueMicrotask(refresh);
  };
  const onVariantChange = () => queueMicrotask(refresh);
  const onKey = event => {
    if (event.target.closest('input, select, textarea')) return;
    if (!viewer.open && !event.target.closest('.product-detail-gallery')) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); event.stopPropagation();
      step(event.key === 'ArrowLeft' ? -1 : 1);
      queueMicrotask(refresh);
    } else if (viewer.open && ['+', '=', '-', '0'].includes(event.key)) {
      event.preventDefault(); setZoom(event.key === '0' ? 1 : zoom + (event.key === '-' ? -.25 : .25));
    }
  };
  const onPointerDown = event => {
    if (!viewer.open && !event.target.closest('.product-detail-image-stage')) return;
    pointers.add(event.pointerId);
    if (pointers.size !== 1) { gesture = null; return; }
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY,
      left: stage.scrollLeft, top: stage.scrollTop, pan: viewer.open && zoom > 1 && event.pointerType === 'mouse' };
    if (gesture.pan) { event.preventDefault(); stage.setPointerCapture(event.pointerId); }
  };
  const onPointerMove = event => {
    if (!gesture?.pan || gesture.id !== event.pointerId) return;
    stage.scrollLeft = gesture.left - (event.clientX - gesture.x);
    stage.scrollTop = gesture.top - (event.clientY - gesture.y);
  };
  const onPointerEnd = event => {
    pointers.delete(event.pointerId);
    if (gesture?.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    if (event.type !== 'pointercancel' && !gesture.pan && zoom === 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      suppressClickUntil = Date.now() + 350;
      step(dx < 0 ? 1 : -1);
      queueMicrotask(refresh);
    }
    gesture = null;
  };
  const closeViewer = () => { if (viewer.open) viewer.close(); };
  const onProductClose = () => { if (!dialog.open) closeViewer(); };
  const onViewerClose = () => {
    setZoom(1);
    maxZoom = 1;
    generation++;
    gesture = null;
    pointers.clear();
    if (returnFocus?.isConnected && dialog.open) returnFocus.focus({ preventScroll: true });
  };
  const onCancel = event => { event.preventDefault(); closeViewer(); };
  body.addEventListener('click', onBodyClick, true);
  body.addEventListener('change', onVariantChange);
  body.addEventListener('keydown', onKey);
  body.addEventListener('pointerdown', onPointerDown);
  body.addEventListener('pointerup', onPointerEnd);
  body.addEventListener('pointercancel', onPointerEnd);
  viewer.addEventListener('keydown', onKey);
  viewer.addEventListener('close', onViewerClose);
  viewer.addEventListener('cancel', onCancel);
  stage.addEventListener('pointerdown', onPointerDown);
  stage.addEventListener('pointermove', onPointerMove);
  stage.addEventListener('pointerup', onPointerEnd);
  stage.addEventListener('pointercancel', onPointerEnd);
  viewer.querySelector('[data-viewer-close]').addEventListener('click', closeViewer);
  viewer.querySelector('[data-viewer-prev]').addEventListener('click', () => step(-1));
  viewer.querySelector('[data-viewer-next]').addEventListener('click', () => step(1));
  zoomButton.addEventListener('click', () => setZoom(zoom > 1 ? 1 : Math.min(2, maxZoom)));
  scaleInput.addEventListener('input', event => setZoom(event.target.value));
  viewer.querySelector('[data-viewer-retry]').addEventListener('click', () => {
    if (currentIndex >= 0) paint(currentIndex);
  });
  const onResize = () => {
    if (!viewer.open || !photo.naturalWidth || !photo.naturalHeight) return;
    if (resizeFrame) doc.defaultView.cancelAnimationFrame(resizeFrame);
    resizeFrame = doc.defaultView.requestAnimationFrame(() => {
      resizeFrame = 0;
      updateZoomLimit(photo.naturalWidth, photo.naturalHeight);
    });
  };
  doc.defaultView.addEventListener('resize', onResize, { passive: true });
  dialog.addEventListener('close', onProductClose);
  refresh();
  return () => {
    observer.disconnect();
    body.removeEventListener('click', onBodyClick, true);
    body.removeEventListener('change', onVariantChange);
    body.removeEventListener('keydown', onKey);
    body.removeEventListener('pointerdown', onPointerDown);
    body.removeEventListener('pointerup', onPointerEnd);
    body.removeEventListener('pointercancel', onPointerEnd);
    doc.defaultView.removeEventListener('resize', onResize);
    if (resizeFrame) doc.defaultView.cancelAnimationFrame(resizeFrame);
    dialog.removeEventListener('close', onProductClose);
    viewer.remove();
  };
}
