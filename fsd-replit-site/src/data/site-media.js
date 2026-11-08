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
  // Homepage campaign scenes, keyed by the id in home-hero-experiences.js.
  // The approved boxer photo (homeHero) opens the page, so each campaign
  // scene has its own image. All four are original AI-generated concept
  // images (no real people, no third-party marks); swap them for
  // commissioned photography before launch.
  campaigns: Object.freeze({
    heroes: Object.freeze({
      src: '/fsd-assets/campaigns/heroes.webp',
      alt: 'Kickboxer in FSD black and gold kit at full extension of a high kick',
    }),
    stronger: Object.freeze({
      src: '/fsd-assets/campaigns/stronger.webp',
      alt: 'Athlete in FSD black and gold kit locking out a barbell overhead',
    }),
    disciplined: Object.freeze({
      src: '/fsd-assets/campaigns/disciplined.webp',
      alt: 'Fighter in FSD kit wrapping his hands before training',
    }),
    together: Object.freeze({
      src: '/fsd-assets/campaigns/together.webp',
      alt: 'A diverse group of FSD members standing together in black and gold kit',
    }),
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
