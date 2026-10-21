const MAX_PENDING = 1;

function initHeroHighlight(root) {
  const button = root.querySelector('.hero-actions .primary-btn');
  if (!button) return;
  let finePointer;
  let reducedMotion;
  try {
    finePointer = window.matchMedia?.('(pointer: fine) and (hover: hover)');
    reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  } catch {
    return;
  }
  const canTrackPointer = () => Boolean(finePointer?.matches && !reducedMotion?.matches);
  let frame = 0;
  let latest = null;
  const flush = () => {
    frame = 0;
    if (!latest || !button.isConnected) return;
    const rect = button.getBoundingClientRect();
    const x = Math.max(12, Math.min(88, ((latest.x - rect.left) / rect.width) * 100));
    const y = Math.max(12, Math.min(88, ((latest.y - rect.top) / rect.height) * 100));
    button.style.setProperty('--metal-x', `${x}%`);
    button.style.setProperty('--metal-y', `${y}%`);
    button.style.setProperty('--arrow-shift', `${latest.x > rect.left + rect.width / 2 ? 3 : 1}px`);
    latest = null;
  };
  button.addEventListener('pointermove', event => {
    if (!canTrackPointer() || (event.pointerType !== 'mouse' && event.pointerType !== 'pen')) {
      reset();
      return;
    }
    latest = { x: event.clientX, y: event.clientY };
    if (!frame && MAX_PENDING) frame = window.requestAnimationFrame(flush);
  }, { passive: true });
  const reset = () => {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    latest = null;
    button.style.removeProperty('--metal-x');
    button.style.removeProperty('--metal-y');
    button.style.removeProperty('--arrow-shift');
  };
  button.addEventListener('pointerleave', reset, { passive: true });
  button.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch') reset();
  }, { passive: true });
  button.addEventListener('blur', reset);
  const onPreferenceChange = () => {
    if (!canTrackPointer()) reset();
  };
  if (finePointer?.addEventListener) finePointer.addEventListener('change', onPreferenceChange);
  else finePointer?.addListener?.(onPreferenceChange);
  if (reducedMotion?.addEventListener) reducedMotion.addEventListener('change', onPreferenceChange);
  else reducedMotion?.addListener?.(onPreferenceChange);
}

export function initSignatureUI(root = document) {
  if (!root || root.__fsdSignatureUI) return;
  root.__fsdSignatureUI = true;
  initHeroHighlight(root);
}
