const swapsByStage = new WeakMap();

export function crossfadeMappedImage(currentImage, src, alt) {
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
    previousSwap.incoming.remove();
    previousSwap.current.classList.remove('mapped-gallery-image--hidden');
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

  let activated = false;
  const activate = () => {
    if (activated) return;
    activated = true;
    if (!stage.isConnected) return;
    stage.append(incoming);
    const beginFade = () => {
      incoming.classList.add('mapped-gallery-image--visible');
      currentImage.classList.add('mapped-gallery-image--hidden');
    };
    if (view.requestAnimationFrame) view.requestAnimationFrame(beginFade);
    else setTimeout(beginFade, 0);

    const timer = setTimeout(() => {
      if (currentImage.isConnected) currentImage.remove();
      incoming.classList.remove('mapped-gallery-image--incoming', 'mapped-gallery-image--visible');
      incoming.dataset.mappedGalleryActive = 'true';
      swapsByStage.delete(stage);
    }, 220);
    swapsByStage.set(stage, { current: currentImage, incoming, timer });
  };

  incoming.addEventListener('load', activate, { once: true });
  incoming.addEventListener('error', () => incoming.remove(), { once: true });
  incoming.src = src;
  if (incoming.complete && incoming.naturalWidth > 0) activate();
  return true;
}
