// Compatibility entry point while legacy storefront modules adopt data/products.js.
export * from './data/products.js';

import { productImagesForDisplay } from './data/products.js';

const detailGalleryImageHolds = new Set([33, 34]);

export function productDetailImagesForDisplay(product) {
  if (detailGalleryImageHolds.has(product?.id)) return [];
  return productImagesForDisplay(product);
}
