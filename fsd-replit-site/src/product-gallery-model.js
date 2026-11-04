import { productColourwayOptions } from './product-card-media.js';

export const normaliseGalleryColourway = value => String(value || '')
  .toLocaleLowerCase('en-GB').replace(/[^a-z0-9]+/g, ' ').trim();

export function imageColourwayIndex(product, image) {
  const mapped = normaliseGalleryColourway(image?.colourway || image?.variant || image?.label);
  return productColourwayOptions(product).findIndex(value => normaliseGalleryColourway(value) === mapped);
}

export function galleryIndexesForVariant(product, images, variant = {}) {
  const colours = productColourwayOptions(product);
  return images.flatMap((image, index) => {
    if (image.size && image.size !== variant.size) return [];
    if (colours.length < 2) return [index];
    const mapped = colours[imageColourwayIndex(product, image)];
    return mapped && normaliseGalleryColourway(mapped) === normaliseGalleryColourway(variant.colourway)
      ? [index] : [];
  });
}
