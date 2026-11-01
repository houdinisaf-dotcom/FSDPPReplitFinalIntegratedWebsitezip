export const FSD_MOTION = Object.freeze({
  duration: 0.32,
  shortDuration: 0.24,
  distance: 12,
  rowStagger: 0.04,
  ease: 'easeOut',
});

let motionModulePromise;

export function loadMotion() {
  motionModulePromise ??= import('motion');
  return motionModulePromise;
}

export function prefersReducedMotion(view = globalThis.window) {
  return Boolean(view?.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}
