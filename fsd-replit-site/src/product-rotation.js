import { FSD_MOTION, loadMotion, prefersReducedMotion } from './motion-config.js';
import { rotationFramesForProduct } from './product-rotation-assets.js';

const PLACEHOLDER_FRAME_COUNT = 24;

// These must be individual, compressed WebP angles of the same product and colourway.
// The current catalogue contains no approved 360° sequence for the selected product.

function isWebpPath(source) {
  return typeof source === 'string' && /\.webp(?:[?#].*)?$/i.test(source);
}

function drawPlaceholder(context, width, height, frameIndex, frameCount, waitingForPhoto = false, failed = false) {
  context.fillStyle = '#101114';
  context.fillRect(0, 0, width, height);

  const inset = Math.max(16, Math.min(width, height) * 0.065);
  context.strokeStyle = 'rgba(200, 170, 114, .58)';
  context.lineWidth = 1;
  context.strokeRect(inset, inset, width - inset * 2, height - inset * 2);

  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#c8aa72';
  context.font = `600 ${Math.max(11, Math.min(15, width * 0.035))}px Manrope, sans-serif`;
  context.fillText(`${waitingForPhoto ? 'FRAME' : 'PLACEHOLDER FRAME'} ${String(frameIndex + 1).padStart(2, '0')} / ${frameCount}`, width / 2, height / 2 - 18);
  context.fillStyle = '#d7d2c8';
  context.font = `500 ${Math.max(10, Math.min(12, width * 0.028))}px "DM Sans", sans-serif`;
  context.fillText(
    failed ? 'WEBP FRAME COULD NOT LOAD' : waitingForPhoto ? 'LOADING WEBP FRAME' : '360° PHOTO REQUIRED',
    width / 2,
    height / 2 + 10,
  );
  context.fillStyle = '#96928b';
  context.fillText('No product image is simulated here.', width / 2, height / 2 + 34);
}

function drawImageContain(context, image, width, height) {
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  context.fillStyle = '#101114';
  context.fillRect(0, 0, width, height);
  context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

export function mountProductRotationViewer(root) {
  const poster = root?.querySelector('[data-rotation-fallback]');
  const canvas = root?.querySelector('[data-rotation-canvas]');
  const controls = root?.querySelector('[data-rotation-controls]');
  const hint = root?.querySelector('[data-rotation-hint]');
  const caption = root?.querySelector('[data-rotation-caption]');
  const frameCountLabel = root?.querySelector('[data-rotation-frame-count]');
  const status = root?.querySelector('[data-rotation-status]');
  const productId = Number(root?.dataset.rotationProduct);
  if (!root || !poster || !canvas || !controls || !hint || !caption || !status) return () => {};

  const sources = rotationFramesForProduct(productId).filter(isWebpPath);
  const frameCount = sources.length || PLACEHOLDER_FRAME_COUNT;
  const loadedFrames = new Array(sources.length);
  const failedFrames = new Set();
  const view = root.ownerDocument?.defaultView;
  const reducedMotion = view?.matchMedia?.('(prefers-reduced-motion: reduce)');
  const context = canvas.getContext?.('2d');
  if (!context) return () => {};

  let frameIndex = 0;
  let disposed = false;
  let sequenceObserver = null;
  let resizeObserver = null;
  let loadedNearViewport = false;
  let dragPointerId = null;
  let lastPointerX = 0;
  let dragRemainder = 0;
  let hintDismissed = false;

  const reportFrame = () => {
    const frame = String(frameIndex + 1).padStart(2, '0');
    if (sources.length) {
      status.textContent = `Rotation frame ${frame} of ${frameCount}.`;
    } else {
      status.textContent = `Placeholder frame ${frame} of ${frameCount}. No product rotation photograph is available.`;
    }
  };

  const draw = () => {
    if (disposed || canvas.hidden) return;
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const ratio = Math.min(view?.devicePixelRatio || 1, 2);
    const width = Math.round(bounds.width * ratio);
    const height = Math.round(bounds.height * ratio);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const image = loadedFrames[frameIndex];
    if (image?.complete && image.naturalWidth && image.naturalHeight) {
      drawImageContain(context, image, bounds.width, bounds.height);
    } else {
      drawPlaceholder(
        context,
        bounds.width,
        bounds.height,
        frameIndex,
        frameCount,
        sources.length > 0,
        failedFrames.has(frameIndex),
      );
    }
  };

  const changeFrame = delta => {
    dismissHint();
    frameIndex = (frameIndex + delta + frameCount) % frameCount;
    reportFrame();
    draw();
  };

  const dismissHint = () => {
    if (hintDismissed || hint.hidden) return;
    hintDismissed = true;
    if (prefersReducedMotion(view)) {
      hint.hidden = true;
      return;
    }
    void loadMotion()
      .then(({ animate }) => {
        if (prefersReducedMotion(view) || !hint.isConnected) return null;
        return animate(hint, { opacity: [1, 0] }, {
          duration: FSD_MOTION.shortDuration,
          ease: FSD_MOTION.ease,
        }).finished;
      })
      .catch(error => view?.console?.error?.('FSD rotation hint could not animate.', error))
      .finally(() => { hint.hidden = true; });
  };

  const loadFrame = index => {
    if (index < 0 || index >= sources.length || loadedFrames[index]) return;
    const image = new view.Image();
    image.decoding = 'async';
    if (index === 0) image.fetchPriority = 'high';
    image.onload = () => {
      if (disposed) return;
      if (index === 0 && !reducedMotion?.matches) {
        poster.hidden = true;
        canvas.hidden = false;
        caption.textContent = '360° product photography is loaded.';
      }
      draw();
    };
    image.onerror = () => {
      failedFrames.add(index);
      draw();
      if (index === 0) caption.textContent = 'The 360° image sequence could not load. The static catalogue image remains visible.';
    };
    loadedFrames[index] = image;
    image.src = sources[index];
  };

  const loadRemainingFrames = () => {
    if (loadedNearViewport || !sources.length || reducedMotion?.matches) return;
    loadedNearViewport = true;
    for (let index = 1; index < sources.length; index += 1) loadFrame(index);
  };

  const activate = () => {
    if (disposed || reducedMotion?.matches) return;
    sequenceObserver?.disconnect();
    sequenceObserver = null;
    root.tabIndex = 0;
    controls.hidden = false;
    hint.hidden = hintDismissed;
    canvas.hidden = false;
    reportFrame();
    if (frameCountLabel) {
      frameCountLabel.textContent = sources.length
        ? `${frameCount} compressed WebP frames`
        : `${frameCount} placeholder frames`;
    }

    if (!sources.length) {
      caption.textContent = 'No 360° product photos were supplied. This canvas contains labeled placeholders only.';
      hint.textContent = 'These are placeholder frames, not product views. Drag or use the arrows to cycle them.';
      poster.hidden = false;
      draw();
      return;
    }

    hint.textContent = 'Drag to rotate, or focus this viewer and use the left and right arrow keys.';
    caption.textContent = 'Loading the first 360° product frame.';
    loadFrame(0);
    if (view?.IntersectionObserver) {
      sequenceObserver = new view.IntersectionObserver(([entry]) => {
        if (!entry?.isIntersecting) return;
        loadRemainingFrames();
        sequenceObserver?.disconnect();
        sequenceObserver = null;
      }, { rootMargin: '320px 0px', threshold: 0.01 });
      sequenceObserver.observe(root);
    } else {
      loadRemainingFrames();
    }
    draw();
  };

  const deactivate = () => {
    sequenceObserver?.disconnect();
    sequenceObserver = null;
    poster.hidden = false;
    canvas.hidden = true;
    controls.hidden = true;
    hint.hidden = true;
    root.removeAttribute('tabindex');
    caption.textContent = 'Reduced motion is enabled. The static product image is shown.';
    status.textContent = '';
  };

  const onKeyDown = event => {
    if ((event.target !== root && event.target !== canvas) || reducedMotion?.matches) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      changeFrame(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      changeFrame(1);
    }
  };
  const onPointerDown = event => {
    if (canvas.hidden || reducedMotion?.matches || event.button > 0) return;
    dragPointerId = event.pointerId;
    lastPointerX = event.clientX;
    dragRemainder = 0;
    canvas.setPointerCapture?.(event.pointerId);
    root.dataset.dragging = 'true';
    dismissHint();
  };
  const onPointerMove = event => {
    if (dragPointerId !== event.pointerId) return;
    dragRemainder += event.clientX - lastPointerX;
    lastPointerX = event.clientX;
    const threshold = Math.max(8, canvas.clientWidth / 36);
    while (Math.abs(dragRemainder) >= threshold) {
      const direction = Math.sign(dragRemainder);
      changeFrame(-direction);
      dragRemainder -= direction * threshold;
    }
  };
  const onPointerEnd = event => {
    if (dragPointerId !== event.pointerId) return;
    dragPointerId = null;
    delete root.dataset.dragging;
  };
  const onMotionPreferenceChange = event => {
    if (event.matches) deactivate();
    else activate();
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerEnd);
  canvas.addEventListener('pointercancel', onPointerEnd);
  root.addEventListener('keydown', onKeyDown);
  root.querySelector('[data-rotation-prev]')?.addEventListener('click', () => changeFrame(-1));
  root.querySelector('[data-rotation-next]')?.addEventListener('click', () => changeFrame(1));

  if (view?.ResizeObserver) {
    resizeObserver = new view.ResizeObserver(draw);
    const stage = root.querySelector('.product-rotation__stage');
    if (stage) resizeObserver.observe(stage);
  }
  reducedMotion?.addEventListener?.('change', onMotionPreferenceChange);

  if (reducedMotion?.matches) deactivate();
  else activate();

  return () => {
    disposed = true;
    sequenceObserver?.disconnect();
    resizeObserver?.disconnect();
    reducedMotion?.removeEventListener?.('change', onMotionPreferenceChange);
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerEnd);
    canvas.removeEventListener('pointercancel', onPointerEnd);
    root.removeEventListener('keydown', onKeyDown);
  };
}
