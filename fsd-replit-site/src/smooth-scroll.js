function mediaMatches(view, query) {
  try {
    return Boolean(view?.matchMedia?.(query)?.matches);
  } catch {
    return false;
  }
}

export function shouldEnableSmoothScroll(view = globalThis.window) {
  const maxTouchPoints = Number(view?.navigator?.maxTouchPoints || 0);
  return !mediaMatches(view, '(prefers-reduced-motion: reduce)')
    && !mediaMatches(view, '(pointer: coarse)')
    && maxTouchPoints === 0;
}

export function mountSmoothScroll(documentRef = globalThis.document, view = documentRef?.defaultView) {
  if (!documentRef?.documentElement || !view) return () => {};

  let disposed = false;
  let generation = 0;
  let lenis = null;
  let activationPending = false;
  let userIntentStarted = false;
  const sync = async () => {
    const requestGeneration = ++generation;
    if (!shouldEnableSmoothScroll(view)) {
      lenis?.destroy();
      lenis = null;
      delete documentRef.documentElement.dataset.fsdLenisActive;
      return;
    }
    if (lenis) return;

    try {
      const { default: Lenis } = await import('lenis');
      if (disposed || requestGeneration !== generation || !shouldEnableSmoothScroll(view)) return;
      lenis = new Lenis({
        autoRaf: true,
        anchors: true,
        smoothWheel: true,
        syncTouch: false,
        prevent: node => Boolean(node.closest?.('dialog[open], [data-lenis-prevent]')),
      });
      documentRef.documentElement.dataset.fsdLenisActive = 'true';
    } catch (error) {
      globalThis.console?.error?.('FSD smooth scrolling could not load; native scrolling remains available.', error);
    }
  };
  const removeIntentListeners = () => {
    documentRef.removeEventListener('wheel', startOnIntent);
    documentRef.removeEventListener('pointerdown', startOnIntent);
    documentRef.removeEventListener('keydown', startOnIntent);
  };
  const startOnIntent = () => {
    if (disposed || activationPending || lenis || !shouldEnableSmoothScroll(view)) return;
    userIntentStarted = true;
    activationPending = true;
    void sync().finally(() => {
      activationPending = false;
      if (lenis) removeIntentListeners();
    });
  };
  const onPreferenceChange = () => {
    if (!shouldEnableSmoothScroll(view)) {
      void sync();
    } else if (userIntentStarted) {
      void startOnIntent();
    }
  };
  const preference = view.matchMedia?.('(prefers-reduced-motion: reduce)');
  const coarsePointer = view.matchMedia?.('(pointer: coarse)');
  documentRef.addEventListener('wheel', startOnIntent, { passive: true });
  documentRef.addEventListener('pointerdown', startOnIntent, { passive: true });
  documentRef.addEventListener('keydown', startOnIntent);
  preference?.addEventListener?.('change', onPreferenceChange);
  coarsePointer?.addEventListener?.('change', onPreferenceChange);

  return () => {
    disposed = true;
    generation += 1;
    removeIntentListeners();
    preference?.removeEventListener?.('change', onPreferenceChange);
    coarsePointer?.removeEventListener?.('change', onPreferenceChange);
    lenis?.destroy();
    lenis = null;
    delete documentRef.documentElement.dataset.fsdLenisActive;
  };
}
