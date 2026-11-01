export const FSD_MOTION = Object.freeze({
  microDuration: 0.18,
  shortDuration: 0.18,
  overlayDuration: 0.25,
  tabDuration: 0.25,
  routeDuration: 0.3,
  duration: 0.36,
  panelDuration: 0.35,
  revealDuration: 0.4,
  largeDuration: 0.55,
  distance: 16,
  revealDistance: 20,
  revealThreshold: 0.2,
  rowStagger: 0.06,
  ease: 'easeOut',
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
