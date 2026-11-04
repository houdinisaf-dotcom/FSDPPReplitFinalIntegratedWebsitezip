// Only populate with an approved, complete sequence: consistent camera, lighting,
// product and colourway, 24–36 distinct photographs. No simulated frames.
export const ROTATION_FRAMES_BY_PRODUCT = Object.freeze({
  43: Object.freeze([]),
});

export function rotationFramesForProduct(productId) {
  const frames = ROTATION_FRAMES_BY_PRODUCT[productId] || [];
  return frames.length >= 24 && frames.length <= 36
    && new Set(frames).size === frames.length
    && frames.every(source => typeof source === 'string' && /\.webp(?:[?#].*)?$/i.test(source))
    ? frames : [];
}
