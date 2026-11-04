// Replace null only with an approved public asset path after uploading the file.
// Null banners resolve to existing approved product photography, then named
// placeholders. These are image slots, not new logo or product assignments.
// Original clothing-line logo assignments now live in config/priority-three.json.
// The legacy animal paths below are photographic references only, never
// automatic substitutes for original artwork in the Priority 3 switcher.
export const COLLECTION_IMAGE_ASSETS = Object.freeze({
  aeroforge: Object.freeze({ banner: null, logo: null }),
  combat: Object.freeze({ banner: null, logo: null }),
  flex: Object.freeze({ banner: null, logo: null }),
  breeze: Object.freeze({ banner: null, logo: null }),
  'modest-flow': Object.freeze({ banner: null, logo: null }),
  'tiger-series': Object.freeze({ banner: null, logo: '/brand/series-references/tiger-patch.webp' }),
  'scorpion-series': Object.freeze({ banner: null, logo: '/brand/series-references/scorpion-patch.webp' }),
  'bio-lab-concepts': Object.freeze({ banner: null, logo: null }),
  'strength-equipment': Object.freeze({ banner: null, logo: null }),
  'combat-equipment': Object.freeze({ banner: null, logo: null }),
  'performance-accessories': Object.freeze({ banner: null, logo: null }),
});
