export const GARMENT_CATEGORY_DEFINITIONS = Object.freeze([
  { id: 'tops', label: 'Tees & Training Tops' },
  { id: 'hoodies', label: 'Hoodies & Sweatshirts' },
  { id: 'outerwear', label: 'Jackets, Gilets & Shells' },
  { id: 'shorts', label: 'Shorts' },
  { id: 'trousers', label: 'Trousers & Joggers' },
  { id: 'leggings', label: 'Leggings' },
  { id: 'base-layers', label: 'Base Layers & Compression' },
  { id: 'rash-guards', label: 'Rash Guards' },
  { id: 'sports-hijabs', label: 'Sports Hijabs' },
  { id: 'sets', label: 'Sets & Tracksuits' },
  { id: 'combat-gear', label: 'Combat Gear' },
  { id: 'accessories', label: 'Accessories' },
  { id: 'strength-equipment', label: 'Strength Equipment' },
  { id: 'smart-tech', label: 'Smart Tech' },
]);

// Display-only browse taxonomy. Product IDs, titles, categories, prices,
// colourways, sizes and images remain in the approved master catalogue.
const PRODUCT_GARMENT_CATEGORIES = Object.freeze({
  1: ['tops'],
  2: ['tops'],
  3: ['tops'],
  4: ['tops'],
  5: ['tops'],
  6: ['hoodies'],
  7: ['hoodies'],
  8: ['outerwear'],
  9: ['outerwear'],
  10: ['outerwear'],
  11: ['outerwear'],
  12: ['outerwear'],
  13: ['outerwear'],
  14: ['base-layers', 'sets'],
  15: ['tops'],
  16: ['tops'],
  17: ['trousers'],
  18: ['tops'],
  19: ['shorts'],
  20: ['shorts'],
  22: ['shorts'],
  23: ['sets'],
  24: ['sets'],
  25: ['base-layers', 'sets'],
  26: ['sets'],
  27: ['hoodies'],
  28: ['outerwear'],
  29: ['outerwear'],
  30: ['combat-gear'],
  31: ['combat-gear'],
  32: ['combat-gear'],
  33: ['rash-guards'],
  34: ['shorts'],
  35: ['combat-gear', 'sets'],
  38: ['tops'],
  39: ['tops'],
  40: ['leggings'],
  41: ['trousers'],
  42: ['sports-hijabs'],
  43: ['sports-hijabs'],
  44: ['sports-hijabs'],
  45: ['sports-hijabs'],
  46: ['outerwear'],
  47: ['tops'],
  48: ['outerwear'],
  49: ['outerwear'],
  50: ['trousers'],
  51: ['sets'],
  52: ['accessories', 'strength-equipment'],
  54: ['strength-equipment'],
  55: ['accessories'],
  56: ['accessories'],
  57: ['accessories'],
  58: ['accessories'],
  59: ['smart-tech'],
  60: ['smart-tech'],
  61: ['smart-tech'],
  62: ['smart-tech'],
  63: ['smart-tech'],
  65: ['smart-tech'],
  66: ['hoodies'],
  67: ['sets'],
  69: ['strength-equipment'],
  70: ['strength-equipment'],
  71: ['strength-equipment'],
  72: ['strength-equipment'],
  73: ['leggings', 'outerwear', 'sets'],
  74: ['leggings'],
  75: ['leggings'],
  76: ['accessories'],
  77: ['outerwear'],
  78: ['outerwear'],
  79: ['outerwear'],
});

const categoryIds = new Set(GARMENT_CATEGORY_DEFINITIONS.map(category => category.id));

export function garmentCategoriesForProduct(product) {
  return PRODUCT_GARMENT_CATEGORIES[Number(product?.id)] || [];
}

export function productHasGarmentCategory(product, categoryId) {
  return categoryIds.has(categoryId)
    && garmentCategoriesForProduct(product).includes(categoryId);
}

export function garmentCategoryOptions(products = [], { allLabel = 'All products' } = {}) {
  return [
    { id: 'all', label: allLabel, count: products.length },
    ...GARMENT_CATEGORY_DEFINITIONS
      .map(category => ({
        ...category,
        count: products.reduce(
          (count, product) => count + Number(productHasGarmentCategory(product, category.id)),
          0,
        ),
      }))
      .filter(category => category.count > 0),
  ];
}

