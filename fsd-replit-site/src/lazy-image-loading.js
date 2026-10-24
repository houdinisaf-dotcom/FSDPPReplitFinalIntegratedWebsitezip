const LAZY_IMAGE_SELECTOR = 'img[loading="lazy"]';

export function mountLazyImageLoading(documentRef = globalThis.document) {
  if (!documentRef?.documentElement) return () => {};

  const view = documentRef.defaultView || globalThis;
  const registeredImages = new WeakSet();
  const imageObserver = typeof view.IntersectionObserver === 'function'
    ? new view.IntersectionObserver(entries => {
      for (const entry of entries) {
        const image = entry.target;
        if (!image.isConnected) {
          imageObserver.unobserve(image);
          continue;
        }
        if (entry.isIntersecting && image.dataset.fsdImageState === 'loading') {
          image.dataset.fsdImageSkeleton = 'true';
        } else if (!entry.isIntersecting) {
          image.removeAttribute('data-fsd-image-skeleton');
        }
      }
    }, { rootMargin: '220px 0px' })
    : null;

  const registerImage = image => {
    if (!image?.matches?.(LAZY_IMAGE_SELECTOR) || registeredImages.has(image)) return;
    registeredImages.add(image);
    image.decoding = 'async';
    image.dataset.fsdImageState = image.complete && image.naturalWidth > 0
      ? 'loaded'
      : 'loading';
    if (image.dataset.fsdImageState === 'loaded') return;

    if (imageObserver) {
      imageObserver.observe(image);
      return;
    }

    const bounds = image.getBoundingClientRect();
    if (bounds.bottom >= -220 && bounds.top <= (view.innerHeight || 0) + 220) {
      image.dataset.fsdImageSkeleton = 'true';
    }
  };

  const scanNode = node => {
    if (node?.nodeType !== 1) return;
    registerImage(node);
    node.querySelectorAll?.(LAZY_IMAGE_SELECTOR).forEach(registerImage);
  };

  const finishImage = (event, state) => {
    const image = event.target;
    if (!image?.matches?.(LAZY_IMAGE_SELECTOR)) return;
    image.dataset.fsdImageState = state;
    image.removeAttribute('data-fsd-image-skeleton');
    imageObserver?.unobserve(image);
  };

  const onLoad = event => finishImage(event, 'loaded');
  const onError = event => finishImage(event, 'error');
  documentRef.addEventListener('load', onLoad, true);
  documentRef.addEventListener('error', onError, true);

  const mutationObserver = typeof view.MutationObserver === 'function'
    ? new view.MutationObserver(records => {
      for (const record of records) {
        record.addedNodes.forEach(scanNode);
      }
    })
    : null;
  mutationObserver?.observe(documentRef.documentElement, { childList: true, subtree: true });
  scanNode(documentRef.documentElement);

  return () => {
    documentRef.removeEventListener('load', onLoad, true);
    documentRef.removeEventListener('error', onError, true);
    mutationObserver?.disconnect();
    imageObserver?.disconnect();
  };
}
