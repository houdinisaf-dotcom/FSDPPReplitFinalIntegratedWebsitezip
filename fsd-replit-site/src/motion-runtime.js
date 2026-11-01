import { FSD_MOTION, loadMotion, prefersReducedMotion } from './motion-config.js';

const playbackByElement = new WeakMap();
const generationByElement = new WeakMap();
const addButtonTimers = new WeakMap();
const toastTimers = new WeakMap();
const toastGenerations = new WeakMap();
const stickyGenerations = new WeakMap();
const mountedRotations = new WeakMap();
const observedRows = new WeakSet();
let motionFailureReported = false;

const ROW_SELECTOR = '.fsd-product-card, .product-card';

function reportMotionFailure(error) {
  if (motionFailureReported) return;
  motionFailureReported = true;
  globalThis.console?.error?.('FSD motion could not load or run; static content remains available.', error);
}

async function mountRotationViewer(viewer) {
  if (mountedRotations.has(viewer)) return;
  mountedRotations.set(viewer, () => {});
  try {
    const { mountProductRotationViewer } = await import('./product-rotation.js');
    if (!viewer.isConnected) {
      mountedRotations.delete(viewer);
      return;
    }
    mountedRotations.set(viewer, mountProductRotationViewer(viewer));
  } catch (error) {
    mountedRotations.delete(viewer);
    reportMotionFailure(error);
  }
}

export async function animateElement(element, keyframes, options = {}) {
  if (!element?.isConnected) return false;
  if (prefersReducedMotion(element.ownerDocument?.defaultView)) return true;

  const generation = (generationByElement.get(element) || 0) + 1;
  generationByElement.set(element, generation);
  playbackByElement.get(element)?.stop?.();

  try {
    const { animate } = await loadMotion();
    if (!element.isConnected || generationByElement.get(element) !== generation) return false;

    const controls = animate(element, keyframes, {
      ...options,
      duration: options.duration ?? FSD_MOTION.duration,
      ease: options.ease ?? FSD_MOTION.ease,
    });
    playbackByElement.set(element, controls);

    try {
      await controls.finished;
    } catch {
      // A newer state change can stop an in-flight animation.
    }

    if (playbackByElement.get(element) === controls) playbackByElement.delete(element);
    return generationByElement.get(element) === generation;
  } catch (error) {
    reportMotionFailure(error);
    return false;
  }
}

export function animateAddButton(button) {
  if (!button?.isConnected) return;
  const originalLabel = button.dataset.motionOriginalLabel ?? button.textContent;
  button.dataset.motionOriginalLabel = originalLabel;
  const priorTimer = addButtonTimers.get(button);
  if (priorTimer) clearTimeout(priorTimer);

  button.dataset.cartState = 'added';
  button.textContent = 'ADDED';
  void animateElement(button, {
    opacity: [0.86, 1],
    scale: [1, 1.035, 1],
  }, { duration: FSD_MOTION.shortDuration });

  const timer = setTimeout(() => {
    if (!button.isConnected) return;
    button.textContent = originalLabel;
    delete button.dataset.cartState;
    addButtonTimers.delete(button);
  }, 1200);
  addButtonTimers.set(button, timer);

  const status = button.closest('#dialog-body')?.querySelector('[data-product-action-status]');
  if (status?.textContent.trim()) {
    void animateElement(status, {
      opacity: [0, 1],
      y: [8, 0],
    }, { duration: FSD_MOTION.shortDuration });
  }
}

export function showCartToast(toast, message) {
  if (!toast?.isConnected) return;
  const generation = (toastGenerations.get(toast) || 0) + 1;
  toastGenerations.set(toast, generation);
  const priorTimer = toastTimers.get(toast);
  if (priorTimer) clearTimeout(priorTimer);

  toast.textContent = message;
  toast.hidden = false;
  toast.dataset.visible = 'true';
  void animateElement(toast, {
    opacity: [0, 1],
    y: [FSD_MOTION.distance, 0],
  }, { duration: FSD_MOTION.shortDuration });

  const timer = setTimeout(async () => {
    if (toastGenerations.get(toast) !== generation || !toast.isConnected) return;
    await animateElement(toast, {
      opacity: [1, 0],
      y: [0, FSD_MOTION.distance],
    }, { duration: FSD_MOTION.shortDuration });
    if (toastGenerations.get(toast) !== generation || !toast.isConnected) return;
    toast.hidden = true;
    delete toast.dataset.visible;
    toastTimers.delete(toast);
  }, 2400);
  toastTimers.set(toast, timer);
}

export function setStickyAddBarVisible(sticky, visible) {
  if (!sticky?.isConnected) return;
  const wasVisible = !sticky.hidden && sticky.dataset.motionVisible === 'true';
  const generation = (stickyGenerations.get(sticky) || 0) + 1;
  stickyGenerations.set(sticky, generation);
  sticky.dataset.motionVisible = String(visible);

  if (visible) {
    if (wasVisible) return;
    sticky.hidden = false;
    sticky.setAttribute('aria-hidden', 'false');
    void animateElement(sticky, {
      opacity: [0, 1],
      y: [FSD_MOTION.distance, 0],
    }, { duration: FSD_MOTION.shortDuration });
    return;
  }

  if (sticky.hidden) return;
  if (sticky.contains(sticky.ownerDocument?.activeElement)) {
    sticky.dataset.motionVisible = 'true';
    if (!wasVisible) {
      void animateElement(sticky, {
        opacity: [0, 1],
        y: [FSD_MOTION.distance, 0],
      }, { duration: FSD_MOTION.shortDuration });
    }
    return;
  }

  void animateElement(sticky, {
    opacity: [1, 0],
    y: [0, FSD_MOTION.distance],
  }, { duration: FSD_MOTION.shortDuration }).then(() => {
    if (stickyGenerations.get(sticky) !== generation || sticky.dataset.motionVisible !== 'false') return;
    sticky.hidden = true;
    sticky.setAttribute('aria-hidden', 'true');
  });
}

function rowStaggerDelay(row) {
  const container = row.closest('.fsd-product-grid, .product-grid') || row.parentElement;
  if (!container) return 0;
  const siblings = [...container.children].filter(element => element.matches(ROW_SELECTOR));
  const index = siblings.indexOf(row);
  return Math.max(0, index) * FSD_MOTION.rowStagger;
}

function mountRowObserver(documentRef) {
  const view = documentRef.defaultView;
  const reducedMotion = view?.matchMedia?.('(prefers-reduced-motion: reduce)');
  if (!view?.IntersectionObserver || prefersReducedMotion(view)) return null;

  const observer = new view.IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      void animateElement(entry.target, {
        opacity: [0, 1],
        y: [FSD_MOTION.distance, 0],
      }, {
        duration: FSD_MOTION.duration,
        delay: rowStaggerDelay(entry.target),
      });
    }
  }, { rootMargin: '0px 0px -5% 0px', threshold: 0.08 });
  return observer;
}

export function mountStorefrontMotion(documentRef = globalThis.document) {
  if (!documentRef?.body || documentRef.documentElement.dataset.fsdMotionMounted === 'true') {
    return () => {};
  }
  documentRef.documentElement.dataset.fsdMotionMounted = 'true';

  let rowObserver = mountRowObserver(documentRef);
  const collectTargets = node => {
    if (!node || node.nodeType !== 1) return;
    if (node.matches(ROW_SELECTOR) && rowObserver && !observedRows.has(node)) {
      observedRows.add(node);
      rowObserver.observe(node);
    }
    if (node.matches('[data-product-rotation]')) void mountRotationViewer(node);
    node.querySelectorAll?.(ROW_SELECTOR).forEach(row => {
      if (!rowObserver || observedRows.has(row)) return;
      observedRows.add(row);
      rowObserver.observe(row);
    });
    node.querySelectorAll?.('[data-product-rotation]').forEach(viewer => void mountRotationViewer(viewer));
  };
  const cleanRemovedTargets = node => {
    if (!node || node.nodeType !== 1) return;
    const cleanViewer = viewer => {
      mountedRotations.get(viewer)?.();
      mountedRotations.delete(viewer);
    };
    if (node.matches('[data-product-rotation]')) cleanViewer(node);
    node.querySelectorAll?.('[data-product-rotation]').forEach(cleanViewer);
  };

  const mutationObserver = new documentRef.defaultView.MutationObserver(records => {
    for (const record of records) {
      record.addedNodes.forEach(collectTargets);
      record.removedNodes.forEach(cleanRemovedTargets);
    }
  });
  mutationObserver.observe(documentRef.body, { childList: true, subtree: true });
  collectTargets(documentRef.body);

  const motionIntent = event => {
    if (prefersReducedMotion(documentRef.defaultView)) return;
    if (!event.target.closest?.(
      '[data-division], [data-group-index], [data-subcategory-index], [data-close-dialog], [data-product-id], [data-product], [data-bag-add], .fsd-catalog-detail__bag, .fsd-concept-details summary',
    )) return;
    void loadMotion().catch(reportMotionFailure);
    documentRef.removeEventListener('pointerover', motionIntent, true);
    documentRef.removeEventListener('pointerdown', motionIntent, true);
    documentRef.removeEventListener('focusin', motionIntent, true);
  };
  documentRef.addEventListener('pointerover', motionIntent, true);
  documentRef.addEventListener('pointerdown', motionIntent, true);
  documentRef.addEventListener('focusin', motionIntent, true);

  const summaryForDetails = event => {
    const summary = event.target.closest?.('details[data-motion-details] > summary');
    if (!summary) return;
    const details = summary.parentElement;
    const panel = details.querySelector('[data-motion-details-content]');
    if (!panel) return;
    event.preventDefault();

    if (details.open) {
      void animateElement(panel, {
        opacity: [1, 0],
        y: [0, -8],
      }, { duration: FSD_MOTION.shortDuration }).then(() => {
        details.open = false;
      });
      return;
    }

    details.open = true;
    void animateElement(panel, {
      opacity: [0, 1],
      y: [8, 0],
    }, { duration: FSD_MOTION.shortDuration });
  };
  documentRef.addEventListener('click', summaryForDetails);

  const motionPreference = documentRef.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)');
  const onMotionPreferenceChange = event => {
    rowObserver?.disconnect();
    rowObserver = event.matches ? null : mountRowObserver(documentRef);
    if (rowObserver) collectTargets(documentRef.body);
  };
  motionPreference?.addEventListener?.('change', onMotionPreferenceChange);

  return () => {
    mutationObserver.disconnect();
    rowObserver?.disconnect();
    motionPreference?.removeEventListener?.('change', onMotionPreferenceChange);
    documentRef.removeEventListener('pointerover', motionIntent, true);
    documentRef.removeEventListener('pointerdown', motionIntent, true);
    documentRef.removeEventListener('focusin', motionIntent, true);
    documentRef.removeEventListener('click', summaryForDetails);
    delete documentRef.documentElement.dataset.fsdMotionMounted;
    documentRef.querySelectorAll('[data-product-rotation]').forEach(cleanRemovedTargets);
  };
}
