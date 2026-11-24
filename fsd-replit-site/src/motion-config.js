export const FSD_MOTION = Object.freeze({
  fastDuration: 0.15,
  baseDuration: 0.3,
  slowDuration: 0.6,
  heroDuration: 0.9,
  microDuration: 0.15,
  shortDuration: 0.15,
  overlayDuration: 0.3,
  tabDuration: 0.3,
  routeDuration: 0.25,
  duration: 0.3,
  panelDuration: 0.3,
  revealDuration: 0.3,
  largeDuration: 0.6,
  distance: 16,
  revealDistance: 16,
  revealThreshold: 0.15,
  rowStagger: 0.08,
  maxStaggerItems: 6,
  imageHoverScale: 1.04,
  ease: [0.22, 1, 0.36, 1],
  stateEase: 'easeInOut',
});

let motionModulePromise;

export function loadMotion() {
  motionModulePromise ??= import('motion');
  return motionModulePromise;
}

export function prefersReducedMotion(view = globalThis.window) {
  return Boolean(view?.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}
