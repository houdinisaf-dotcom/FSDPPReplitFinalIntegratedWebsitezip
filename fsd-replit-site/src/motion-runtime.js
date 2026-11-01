import { FSD_MOTION, loadMotion, prefersReducedMotion } from './motion-config.js';

const playbackByElement = new WeakMap();
const generationByElement = new WeakMap();
const addButtonTimers = new WeakMap();
const toastTimers = new WeakMap();
const toastGenerations = new WeakMap();
const stickyGenerations = new WeakMap();
const mountedRotations = new WeakMap();
const completedReveals = new WeakSet();
let motionFailureReported = false;

const ROW_SELECTOR = '.fsd-product-card, .product-card, .fsd-editorial-card, .fsd-featured-card';
const SECTION_SELECTOR = '#home > section, .showroom-archive-content > section';
const HEADING_SELECTOR = '#home h1, #home h2, #home h3, .showroom-archive-content h2, .showroom-archive-content h3';
const REVEAL_SELECTOR = `${ROW_SELECTOR}, ${SECTION_SELECTOR}, ${HEADING_SELECTOR}`;
const CARD_SELECTOR = '.fsd-editorial-card, .fsd-featured-card, .fsd-product-card, .product-card';
const ARROW_SELECTOR = '.fsd-editorial-card__action b, .product-row__action span, .catalogue-card__action span, .fsd-catalog-detail__actions a span:last-child';

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
  button.textContent = '✓ ADDED';
  void animateElement(button, {
    opacity: [0.86, 1],
    scale: [1, 1.035, 1],
  }, { duration: FSD_MOTION.shortDuration });

  const timer = setTimeout(() => {
    if (!button.isConnected) return;
    button.textContent = originalLabel;
    delete button.dataset.cartState;
    addButtonTimers.delete(button);
  }, 1500);
  addButtonTimers.set(button, timer);

  const status = button.closest('#dialog-body')?.querySelector('[data-product-action-status]');
  if (status?.textContent.trim()) {
    void animateElement(status, {
      opacity: [0, 1],
      y: [8, 0],
    }, { duration: FSD_MOTION.shortDuration });
  }
}

export function animateWishlistHeart(icon) {
  if (!icon?.isConnected) return;
  void animateElement(icon, {
    opacity: [0.65, 1],
    scale: [0.72, 1.2, 1],
  }, {
    duration: FSD_MOTION.microDuration,
    ease: FSD_MOTION.stateEase,
  });
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

function mountRevealObserver(documentRef, onReveal) {
  const view = documentRef.defaultView;
  if (!view?.IntersectionObserver || prefersReducedMotion(view)) return null;

  const observer = new view.IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      onReveal(entry.target);
      void animateElement(entry.target, {
        opacity: [0, 1],
        y: [FSD_MOTION.revealDistance, 0],
      }, {
        duration: FSD_MOTION.revealDuration,
        delay: rowStaggerDelay(entry.target),
      });
    }
  }, { threshold: FSD_MOTION.revealThreshold });
  return observer;
}

export function mountStorefrontMotion(documentRef = globalThis.document) {
  if (!documentRef?.body || documentRef.documentElement.dataset.fsdMotionMounted === 'true') {
    return () => {};
  }
  documentRef.documentElement.dataset.fsdMotionMounted = 'true';

  let rowObserver = null;
  let observedTargets = new WeakSet();
  const collectTargets = node => {
    if (!node || node.nodeType !== 1) return;
    const observeReveal = target => {
      if (!rowObserver || completedReveals.has(target) || observedTargets.has(target)) return;
      observedTargets.add(target);
      rowObserver.observe(target);
    };
    if (node.matches(REVEAL_SELECTOR)) observeReveal(node);
    node.querySelectorAll?.(REVEAL_SELECTOR).forEach(observeReveal);
    if (node.matches('[data-product-rotation]')) void mountRotationViewer(node);
    node.querySelectorAll?.('[data-product-rotation]').forEach(viewer => void mountRotationViewer(viewer));
  };
  const refreshRevealObserver = () => {
    rowObserver?.disconnect();
    rowObserver = null;
    observedTargets = new WeakSet();
    if (!prefersReducedMotion(documentRef.defaultView)) {
      rowObserver = mountRevealObserver(documentRef, target => completedReveals.add(target));
    }
    collectTargets(documentRef.body);
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
  refreshRevealObserver();

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

  const hoveredCards = new WeakSet();
  const hoveredControls = new WeakSet();
  const pressedControls = new Set();
  const setCardHovered = (card, active) => {
    if (!card?.isConnected || prefersReducedMotion(documentRef.defaultView)) return;
    if (active) {
      hoveredCards.add(card);
      card.dataset.motionHovered = 'true';
    } else {
      hoveredCards.delete(card);
      delete card.dataset.motionHovered;
    }
    void animateElement(card, {
      scale: active ? [1, 1.02] : [1.02, 1],
    }, {
      duration: FSD_MOTION.microDuration,
      ease: active ? FSD_MOTION.ease : FSD_MOTION.stateEase,
    });
    const arrow = card.querySelector(ARROW_SELECTOR);
    if (arrow) {
      void animateElement(arrow, {
        x: active ? [0, 4] : [4, 0],
        y: active ? [0, -4] : [-4, 0],
      }, { duration: FSD_MOTION.microDuration });
    }
  };
  const setControlHovered = (control, active) => {
    if (!control?.isConnected || control.matches(CARD_SELECTOR) || prefersReducedMotion(documentRef.defaultView)) return;
    if (active) {
      hoveredControls.add(control);
      control.dataset.motionHovered = 'true';
    } else {
      hoveredControls.delete(control);
      delete control.dataset.motionHovered;
    }
    void animateElement(control, {
      y: active ? [0, -2] : [-2, 0],
    }, { duration: FSD_MOTION.microDuration });
  };
  const onPointerOver = event => {
    if (event.pointerType === 'touch') return;
    const card = event.target.closest?.(CARD_SELECTOR);
    if (card && !card.contains(event.relatedTarget) && !hoveredCards.has(card)) {
      setCardHovered(card, true);
    }
    const control = event.target.closest?.('button, a[role="button"], .fsd-primary-link, .fsd-primary-trigger');
    if (control && !control.contains(event.relatedTarget) && !hoveredControls.has(control)) {
      setControlHovered(control, true);
    }
  };
  const onPointerOut = event => {
    const card = event.target.closest?.(CARD_SELECTOR);
    if (card && !card.contains(event.relatedTarget)) {
      const stillActive = card.matches(':hover') || card.contains(documentRef.activeElement);
      if (!stillActive) setCardHovered(card, false);
    }
    const control = event.target.closest?.('button, a[role="button"], .fsd-primary-link, .fsd-primary-trigger');
    if (control && !control.contains(event.relatedTarget)) {
      const stillActive = control.matches(':hover') || control === documentRef.activeElement;
      if (!stillActive) setControlHovered(control, false);
    }
  };
  const onFocusIn = event => {
    const card = event.target.closest?.(CARD_SELECTOR);
    if (card && !hoveredCards.has(card)) setCardHovered(card, true);
    const control = event.target.closest?.('button, a[role="button"], .fsd-primary-link, .fsd-primary-trigger');
    if (control && !hoveredControls.has(control)) setControlHovered(control, true);
  };
  const onFocusOut = event => {
    const card = event.target.closest?.(CARD_SELECTOR);
    if (card && !card.contains(event.relatedTarget) && !card.matches(':hover')) setCardHovered(card, false);
    const control = event.target.closest?.('button, a[role="button"], .fsd-primary-link, .fsd-primary-trigger');
    if (control && !control.contains(event.relatedTarget) && !control.matches(':hover')) setControlHovered(control, false);
  };
  const pressControl = control => {
    if (!control?.isConnected || control.disabled || prefersReducedMotion(documentRef.defaultView)) return;
    pressedControls.add(control);
    void animateElement(control, {
      scale: [1, 0.98],
    }, { duration: FSD_MOTION.microDuration, ease: FSD_MOTION.stateEase });
  };
  const releaseControls = () => {
    for (const control of pressedControls) {
      if (control.isConnected) {
        void animateElement(control, {
          scale: [0.98, 1],
        }, { duration: FSD_MOTION.microDuration, ease: FSD_MOTION.stateEase });
      }
      pressedControls.delete(control);
    }
  };
  const onPointerDown = event => {
    pressControl(event.target.closest?.('button, a[role="button"]'));
  };
  const onKeyDown = event => {
    if (event.repeat || !['Enter', ' '].includes(event.key)) return;
    pressControl(event.target.closest?.('button, a[role="button"]'));
  };
  documentRef.addEventListener('pointerover', onPointerOver);
  documentRef.addEventListener('pointerout', onPointerOut);
  documentRef.addEventListener('focusin', onFocusIn);
  documentRef.addEventListener('focusout', onFocusOut);
  documentRef.addEventListener('pointerdown', onPointerDown);
  documentRef.addEventListener('pointerup', releaseControls);
  documentRef.addEventListener('pointercancel', releaseControls);
  documentRef.addEventListener('keyup', releaseControls);

  const motionPreference = documentRef.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)');
  const onMotionPreferenceChange = event => {
    refreshRevealObserver();
    if (!event.matches) return;
    documentRef.querySelectorAll('[data-motion-hovered]').forEach(element => {
      delete element.dataset.motionHovered;
      element.style.removeProperty('transform');
    });
    pressedControls.clear();
  };
  motionPreference?.addEventListener?.('change', onMotionPreferenceChange);

  return () => {
    mutationObserver.disconnect();
    rowObserver?.disconnect();
    motionPreference?.removeEventListener?.('change', onMotionPreferenceChange);
    documentRef.removeEventListener('pointerover', motionIntent, true);
    documentRef.removeEventListener('pointerdown', motionIntent, true);
    documentRef.removeEventListener('focusin', motionIntent, true);
    documentRef.removeEventListener('pointerover', onPointerOver);
    documentRef.removeEventListener('pointerout', onPointerOut);
    documentRef.removeEventListener('focusin', onFocusIn);
    documentRef.removeEventListener('focusout', onFocusOut);
    documentRef.removeEventListener('pointerdown', onPointerDown);
    documentRef.removeEventListener('pointerup', releaseControls);
    documentRef.removeEventListener('pointercancel', releaseControls);
    documentRef.removeEventListener('keyup', releaseControls);
    documentRef.removeEventListener('click', summaryForDetails);
    delete documentRef.documentElement.dataset.fsdMotionMounted;
    documentRef.querySelectorAll('[data-product-rotation]').forEach(cleanRemovedTargets);
  };
}
