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
  const preference = view.matchMedia?.('(prefers-reduced-motion: reduce)');
  const coarsePointer = view.matchMedia?.('(pointer: coarse)');
  preference?.addEventListener?.('change', sync);
  coarsePointer?.addEventListener?.('change', sync);
  void sync();

  return () => {
    disposed = true;
    generation += 1;
    preference?.removeEventListener?.('change', sync);
    coarsePointer?.removeEventListener?.('change', sync);
    lenis?.destroy();
    lenis = null;
    delete documentRef.documentElement.dataset.fsdLenisActive;
  };
}
