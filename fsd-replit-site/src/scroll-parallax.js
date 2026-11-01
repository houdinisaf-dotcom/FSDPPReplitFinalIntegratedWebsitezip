const PARALLAX_SELECTOR = '[data-fsd-parallax]';
const MAX_PARALLAX_OFFSET = 18;

export function mountScrollParallax(root, windowRef = globalThis.window) {
  if (!root || !windowRef) return () => {};

  const layers = [...root.querySelectorAll(PARALLAX_SELECTOR)];
  if (!layers.length || typeof windowRef.matchMedia !== 'function') return () => {};

  const motionPreference = windowRef.matchMedia('(prefers-reduced-motion: reduce)');
  const mobilePreference = windowRef.matchMedia('(max-width: 767px)');
  const motionDisabled = () => motionPreference.matches || mobilePreference.matches;
  let frame = 0;
  let destroyed = false;

  const resetLayers = () => {
    layers.forEach(layer => layer.style.setProperty('--fsd-parallax-y', '0px'));
  };

  const update = () => {
    frame = 0;
    if (destroyed || motionDisabled()) return;

    const viewportHeight = windowRef.innerHeight || 1;
    layers.forEach(layer => {
      const rect = layer.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.top >= viewportHeight) {
        layer.style.setProperty('--fsd-parallax-y', '0px');
        return;
      }
      const progress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
      const offset = (0.5 - progress) * MAX_PARALLAX_OFFSET * 2;
      layer.style.setProperty('--fsd-parallax-y', `${offset.toFixed(2)}px`);
    });
  };

  const scheduleUpdate = () => {
    if (!frame && !destroyed && !motionDisabled()) {
      frame = windowRef.requestAnimationFrame(update);
    }
  };

  const handlePreferenceChange = () => {
    if (motionDisabled()) {
      if (frame) windowRef.cancelAnimationFrame(frame);
      frame = 0;
      resetLayers();
      return;
    }
    scheduleUpdate();
  };

  windowRef.addEventListener('scroll', scheduleUpdate, { passive: true });
  windowRef.addEventListener('resize', scheduleUpdate, { passive: true });
  motionPreference.addEventListener?.('change', handlePreferenceChange);
  mobilePreference.addEventListener?.('change', handlePreferenceChange);
  if (motionDisabled()) resetLayers();
  else scheduleUpdate();

  return () => {
    destroyed = true;
    if (frame) windowRef.cancelAnimationFrame(frame);
    windowRef.removeEventListener('scroll', scheduleUpdate);
    windowRef.removeEventListener('resize', scheduleUpdate);
    motionPreference.removeEventListener?.('change', handlePreferenceChange);
    mobilePreference.removeEventListener?.('change', handlePreferenceChange);
  };
}
