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
  hardwareFeature: Object.freeze({
    src: '/fsd-assets/8ffe2fd45a06.webp',
    alt: 'FSD athlete in modest combat training apparel, pictured during a boxing session.',
  }),
});
