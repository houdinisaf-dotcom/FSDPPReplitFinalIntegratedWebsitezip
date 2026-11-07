/**
 * Public site image map. Replace these paths with approved assets when ready.
 * Product galleries and per-colourway images are managed in src/data/products.js.
 */
export const siteMedia = Object.freeze({
  homeHero: Object.freeze({
    src: '/fsd-assets/694b62506e9f.webp',
    alt: 'FSD performance and training campaign',
  }),
  womensBanner: Object.freeze({
    src: '/fsd-assets/womens-activewear-hero.png',
    alt: 'FSD women’s activewear collection',
  }),
  // Add { src, alt } entries using the exact visual-slot title as the key.
  pageMedia: Object.freeze({}),
  collectionCards: Object.freeze({
    mens: Object.freeze({
      src: '/assets/products/strike-shorts-front.webp',
      alt: 'FSD Strike Men’s Combat Shorts, front view',
    }),
    womens: Object.freeze({
      src: '/fsd-assets/womens-modest-combat-preview.webp',
      alt: 'FSD women’s modest combat collection preview',
    }),
    bioLab: null,
  }),
  // The current mapped photo shows apparel in training, not hardware. Keep the
  // Hardware section pending until product-specific imagery is approved.
  hardwareFeature: null,
  // Approved replacement map for the homepage garment studies. Keep null until
  // product-specific concept imagery is approved; do not reuse catalogue crops.
  garmentStudies: Object.freeze({
    leggings: null,
    tank: null,
    jacket: null,
  }),
});
