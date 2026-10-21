const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const PRODUCT_IMAGE_SIZES = '(max-width: 600px) 90vw, (max-width: 1000px) 55vw, 480px';

export function renderImageAttributes(image, { alt = image.alt || image.label, lazy = false, priority = false, sizes = PRODUCT_IMAGE_SIZES, attrs = '' } = {}) {
  return `src="${escape(image.src)}" alt="${escape(alt)}" decoding="async"${image.width ? ` width="${image.width}" height="${image.height}"` : ''}${image.srcset ? ` srcset="${escape(image.srcset)}" sizes="${escape(sizes)}"` : ''}${lazy ? ' loading="lazy"' : ''}${priority ? ' fetchpriority="high"' : ''}${attrs ? ` ${attrs}` : ''}`;
}

export function applyImageSource(element, image, sizes = PRODUCT_IMAGE_SIZES) {
  if (!element || !image) return;
  if (image.srcset) {
    element.sizes = sizes;
    element.srcset = image.srcset;
  } else {
    element.removeAttribute?.('srcset');
    element.removeAttribute?.('sizes');
  }
  if (image.width) {
    element.width = image.width;
    element.height = image.height;
  }
  element.alt = image.alt || image.label || '';
  element.src = image.src;
}
