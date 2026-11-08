import { productColourwayOptions } from './product-card-media.js';

export const normaliseGalleryColourway = value => String(value || '')
  .toLocaleLowerCase('en-GB').replace(/[^a-z0-9]+/g, ' ').trim();

export function imageColourwayIndex(product, image) {
  const mapped = normaliseGalleryColourway(image?.colourway || image?.variant || image?.label);
  return productColourwayOptions(product).findIndex(value => normaliseGalleryColourway(value) === mapped);
}

const COLOUR_NEUTRAL_DETAIL = /\b(detail|close.?up|fabric|texture|branding|logo|crest|panel|seam|pocket|hardware)\b/i;
const EXPLICIT_NEUTRAL_COLOURWAY = /^(?:all colours?|all colourways|colour[- ]neutral|color[- ]neutral|universal detail)$/;

export function isColourNeutralProductDetail(product, image) {
  if (!image || imageColourwayIndex(product, image) >= 0) return false;
  const metadata = normaliseGalleryColourway(image.colourway || image.variant);
  const explicitlyNeutral = image.colourwayNeutral === true
    || image.colorwayNeutral === true
    || EXPLICIT_NEUTRAL_COLOURWAY.test(metadata);
  return explicitlyNeutral && COLOUR_NEUTRAL_DETAIL.test(String(image.label || ''));
}

export function galleryIndexesForVariant(product, images, variant = {}) {
  const colours = productColourwayOptions(product);
  const selected = normaliseGalleryColourway(variant.colourway);
  return images.flatMap((image, index) => {
    if (image.size && image.size !== variant.size) return [];
    const mappedIndex = imageColourwayIndex(product, image);
    if (mappedIndex >= 0) {
      if (colours.length < 2 && !selected) return [index];
      const mapped = colours[mappedIndex];
      return !selected || normaliseGalleryColourway(mapped) === selected ? [index] : [];
    }
    if (isColourNeutralProductDetail(product, image)) return [index];
    // Products without colour variants keep their existing curated image set.
    if (colours.length < 2) return [index];
    return [];
  });
}
