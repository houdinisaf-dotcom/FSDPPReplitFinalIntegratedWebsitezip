const swapsByStage = new WeakMap();

export function cancelMappedImageSwap(image) {
  const stage = image?.parentElement;
  const previous = stage && swapsByStage.get(stage);
  if (!previous) return;
  clearTimeout(previous.timer);
  previous.cleanup?.();
  previous.incoming?.remove();
  previous.current.classList.remove('mapped-gallery-image--hidden');
  stage.removeAttribute('aria-busy');
  swapsByStage.delete(stage);
}

export function crossfadeMappedImage(currentImage, src, alt, onError, options = {}) {
  if (!currentImage || !src) return false;

  const stage = currentImage.parentElement;
  const documentRef = currentImage.ownerDocument || globalThis.document;
  const view = documentRef?.defaultView;
  const ImageConstructor = view?.Image;

  if (!stage || !currentImage.isConnected || !ImageConstructor) {
    currentImage.src = src;
    currentImage.alt = alt;
    return true;
  }

  const previousSwap = swapsByStage.get(stage);
  if (previousSwap) {
    clearTimeout(previousSwap.timer);
    previousSwap.cleanup?.();
    previousSwap.incoming?.remove();
    previousSwap.current.classList.remove('mapped-gallery-image--hidden');
  }

  if (options.immediate) {
    const swap = { current: currentImage, incoming: null, timer: null, cleanup: null };
    swapsByStage.set(stage, swap);
    stage.setAttribute('aria-busy', 'true');
    const isCurrent = () => swapsByStage.get(stage) === swap && stage.isConnected;
    const finish = () => {
      if (!isCurrent()) return;
      swap.cleanup?.();
      stage.removeAttribute('aria-busy');
      swapsByStage.delete(stage);
    };
    const fail = () => {
      if (!isCurrent()) return;
      swap.cleanup?.();
      stage.removeAttribute('aria-busy');
      swapsByStage.delete(stage);
      onError?.();
    };
    swap.cleanup = () => {
      currentImage.removeEventListener('load', finish);
      currentImage.removeEventListener('error', fail);
    };

    currentImage.alt = alt;
    currentImage.dataset.mappedGalleryActive = 'true';
    if (options.variant !== undefined) currentImage.dataset.fsdImageVariant = options.variant;
    currentImage.classList.remove('mapped-gallery-image--hidden', 'mapped-gallery-image--incoming', 'mapped-gallery-image--visible');
    currentImage.addEventListener('load', finish, { once: true });
    currentImage.addEventListener('error', fail, { once: true });
    currentImage.src = src;
    if (currentImage.complete && currentImage.naturalWidth > 0) finish();
    return true;
  }

  const incoming = new ImageConstructor();
  [...currentImage.attributes].forEach(attribute => {
    if (!['src', 'alt', 'class'].includes(attribute.name)) {
      incoming.setAttribute(attribute.name, attribute.value);
    }
  });
  incoming.className = `${currentImage.className} mapped-gallery-image--incoming`;
  incoming.alt = alt;
  incoming.loading = 'eager';
  incoming.decoding = 'async';
  incoming.dataset.mappedGalleryIncoming = 'true';
  if (options.variant !== undefined) incoming.dataset.fsdImageVariant = options.variant;

  // Register before loading: an older, slower request must never replace a
  // newer selected view/colourway, including when neither has loaded yet.
  const swap = { current: currentImage, incoming, timer: null };
  swapsByStage.set(stage, swap);
  stage.setAttribute('aria-busy', 'true');
  if (options.retainPrevious === false) currentImage.classList.add('mapped-gallery-image--hidden');
  const isCurrent = () => swapsByStage.get(stage) === swap && stage.isConnected;
  const finish = () => {
    if (!isCurrent()) return;
    if (currentImage.isConnected) currentImage.remove();
    incoming.classList.remove('mapped-gallery-image--incoming', 'mapped-gallery-image--visible');
    incoming.dataset.mappedGalleryActive = 'true';
    delete incoming.dataset.mappedGalleryIncoming;
    stage.removeAttribute('aria-busy');
    swapsByStage.delete(stage);
  };

  let activated = false;
  const activate = () => {
    if (activated) return;
    activated = true;
    if (!isCurrent()) return;
    stage.append(incoming);
    if (view.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      finish();
      return;
    }
    const beginFade = () => {
      if (!isCurrent()) return;
      incoming.classList.add('mapped-gallery-image--visible');
      currentImage.classList.add('mapped-gallery-image--hidden');
    };
    if (view.requestAnimationFrame) view.requestAnimationFrame(beginFade);
    else setTimeout(beginFade, 0);

    swap.timer = setTimeout(finish, 220);
  };

  incoming.addEventListener('load', activate, { once: true });
  incoming.addEventListener('error', () => {
    if (!isCurrent()) return;
    incoming.remove();
    stage.removeAttribute('aria-busy');
    swapsByStage.delete(stage);
    onError?.();
  }, { once: true });
  incoming.src = src;
  if (incoming.complete && incoming.naturalWidth > 0) activate();
  return true;
}
