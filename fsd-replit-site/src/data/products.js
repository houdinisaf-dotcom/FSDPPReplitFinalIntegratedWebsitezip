import masterProducts from '../master-products.json' with { type: 'json' };
import { collectionDivisions } from '../collection-divisions.js';

const imageReferences = {
  'FSD Ombré Slash Tee': [
    { src: '/images/ombre-indigo.png', label: 'Vintage indigo fading to jet black' },
    { src: '/images/ombre-blue.png', label: 'Electric cobalt fading to jet black' },
  ],
  'FSD Cheetah Windrunner': [
    { src: '/images/windrunner-yellow.png', label: 'Sunshine yellow / jet black' },
    { src: '/images/windrunner-white.png', label: 'Blizzard ice-white grey camo / black' },
    { src: '/images/windrunner-khaki.png', label: 'Savannah khaki camo / black' },
  ],
  'FSD Velocity Performance Sports Hijab': [
    { src: '/images/fsd-velocity-performance-sports-hijab.jpg', label: 'Black and gold sports hijab with matching performance top' },
  ],
  'FSD Breeze Overshirt & Engineered Leggings Set': [
    { src: '/fsd-assets/breeze-set-onyx-black-full-length.webp', label: 'Onyx Black · full-length view', colourway: 'Onyx Black' },
    { src: '/fsd-assets/breeze-set-onyx-black-front.webp', label: 'Onyx Black · straight-on view', colourway: 'Onyx Black' },
    { src: '/fsd-assets/breeze-set-onyx-black-trouser-view.webp', label: 'Onyx Black · alternate full-length view', colourway: 'Onyx Black' },
    { src: '/fsd-assets/breeze-set-onyx-black.webp', label: 'Onyx Black · full-set view', colourway: 'Onyx Black' },
    { src: '/fsd-assets/breeze-set-onyx-black-side.webp', label: 'Onyx Black · alternate view', colourway: 'Onyx Black' },
    { src: '/fsd-assets/breeze-set-deep-olive.webp', label: 'Deep Olive · full-set view', colourway: 'Deep Olive' },
    { src: '/fsd-assets/breeze-set-warm-taupe-full-length.webp', label: 'Warm Taupe · full-length view', colourway: 'Warm Taupe' },
    { src: '/fsd-assets/breeze-set-slate-grey-full-length.webp', label: 'Slate Grey · full-length view', colourway: 'Slate Grey' },
    { src: '/fsd-assets/breeze-set-slate-grey.webp', label: 'Slate Grey · full-set view', colourway: 'Slate Grey' },
    { src: '/fsd-assets/breeze-set-midnight-navy.webp', label: 'Midnight Navy · full-set view', colourway: 'Midnight Navy' },
    { src: '/fsd-assets/breeze-set-deep-burgundy-full-length.webp', label: 'Deep Burgundy · full-length view', colourway: 'Deep Burgundy' },
    { src: '/fsd-assets/breeze-set-deep-burgundy-alt-full-length.webp', label: 'Deep Burgundy · alternate full-length view', colourway: 'Deep Burgundy' },
    { src: '/fsd-assets/breeze-set-deep-burgundy.webp', label: 'Deep Burgundy · full-set view', colourway: 'Deep Burgundy' },
  ],
};

// Publication decisions use stable record metadata, not names that may change.
export const heldProducts = masterProducts.filter(p => p['Publication status'] === 'Hold');
export const retiredProducts = masterProducts.filter(p => ['Merged', 'Replaced'].includes(p['Publication status']));
export const products = masterProducts
  .filter(p => !p['Publication status'] || p['Publication status'] === 'Active')
  .map(p => ({
    id: p.id,
    name: p['Product name'],
    category: p.Category,
    alsoShowIn: p['Also show in'].split(';').map(s => s.trim()).filter(Boolean),
    audience: p.Audience,
    confirmedPrice: p['Price (£) confirmed'] === '' ? null : Number(p['Price (£) confirmed']),
    colourways: p.Colourways,
    collection: p['Collection line'],
    imageStatus: p['Image status'],
    source: p.Source,
    alias: p['Also appears as'],
    aliasStatus: p['Alias status'] ?? '',
    description: p.Description ?? '',
    shortDescription: p['Short description'] ?? '',
    setContents: p['Set contents'] ?? '',
    sizes: p.Sizes ?? '',
    coverage: p.Coverage ?? '',
    specifications: p.Specifications ?? '',
    specificationStatus: p['Specification status'] ?? '',
    priceBasis: p['Price basis'] ?? '',
    notes: p.Notes.trim(),
    images: imageReferences[p['Product name']] ?? [],
  }));

// Add records here only after the complete specification set has been verified.
export const verifiedProductSpecifications = Object.freeze({
  73: {
    approvalStatus: 'verified',
    materials: [
      'Primary fabric: 88% Performance Polyester, 12% Elastane mechanical-stretch weave.',
      'Panels: laser-etched geometric jacquard micro-mesh.',
      'Hardware: anodized matte-black and champagne-gold auto-lock zippers with FSD custom pullers.',
    ],
    benefits: [
      'Four-way mechanical stretch engineered for dynamic combat sports and agility training.',
      'Breathable airflow zoning through laser-etched jacquard detailing.',
      'Extended hi-low hem and integrated hood structure for complete, distraction-free coverage.',
      'Premium matte technical fabric with moisture-wicking properties.',
    ],
    technicalSpecs: {
      composition: '88% Performance Polyester and 12% Elastane mechanical-stretch weave, with laser-etched geometric jacquard micro-mesh panels.',
      fit: 'Full-coverage set with a lightweight tactical overshirt, half-zip entry, side ventilation and engineered performance leggings.',
      care: 'Machine wash cold on delicate cycle inside out. Hang dry only. Do not tumble dry. Do not iron metallic hardware.',
    },
  },
});

const verifiedTextList = value => Array.isArray(value)
  ? value.filter(item => typeof item === 'string' && item.trim()).map(item => item.trim())
  : [];

export function normalizeVerifiedSpecifications(record) {
  if (!record || record.approvalStatus !== 'verified') return null;
  const technicalSource = record.technicalSpecs && typeof record.technicalSpecs === 'object'
    ? record.technicalSpecs
    : {};
  const technicalSpecs = Object.fromEntries(
    ['composition', 'fit', 'care']
      .map(key => [key, typeof technicalSource[key] === 'string' ? technicalSource[key].trim() : ''])
      .filter(([, value]) => value),
  );
  const materials = verifiedTextList(record.materials);
  const benefits = verifiedTextList(record.benefits);
  if (!materials.length && !benefits.length && !Object.keys(technicalSpecs).length) return null;
  return { materials, benefits, technicalSpecs };
}

export function getVerifiedProductSpecifications(productId) {
  const id = typeof productId === 'string' && productId.trim() ? Number(productId) : productId;
  if (!Number.isSafeInteger(id)) return null;
  const product = products.find(item => item.id === id);
  if (!product) return null;
  const status = product.specificationStatus.trim();
  if (status && !/^(?:verified|approved)$/i.test(status)) return null;
  return normalizeVerifiedSpecifications(verifiedProductSpecifications[id]);
}

export const categories = [...new Set(products.flatMap(p => [p.category, ...p.alsoShowIn]))];
export const audiences = [...new Set(products.map(product => product.audience).filter(Boolean))];

const apparelDivision = collectionDivisions.find(division => division.id === 'apparel');
export const shopCollections = (apparelDivision?.groups || [])
  .filter(group => ['mens-luxury-performance', 'womens-modest-combat'].includes(group.id))
  .map(group => ({
    id: group.id,
    label: group.title,
    categories: group.categories || [],
    audiences: group.audiences || [],
  }));

const searchText = value => value.replace(/[‘’]/g, "'").toLocaleLowerCase('en-GB');

const hasStandaloneProductImage = product => {
  const imageStatus = String(product.imageStatus ?? '');
  if (/\bconcept board\b|crop single panels|contact sheet|collage/i.test(imageStatus)) {
    return false;
  }
  return Array.isArray(product.images) &&
    product.images.some(image => typeof image?.src === 'string' && image.src.trim().length > 0);
};

export const productsWithUsableImages = Object.freeze(products.filter(hasStandaloneProductImage));
export const productsMissingUsableImages = Object.freeze(products.filter(product => !hasStandaloneProductImage(product)));

export function isHardwareVisualPreviewProduct(product) {
  const collection = String(product?.collection || '').trim().toLocaleLowerCase('en-GB');
  return collection.startsWith('hardware division /');
}

export function filterProducts(category = 'All', query = '', audience = 'All', collection = 'All') {
  const term = searchText(query.trim());
  const selectedCollection = shopCollections.find(item => item.id === collection);
  return products.filter(p =>
    (category === 'All' || p.category === category || p.alsoShowIn.includes(category)) &&
    (audience === 'All' || p.audience === audience) &&
    (!selectedCollection || (
      selectedCollection.categories.some(value => p.category === value || p.alsoShowIn.includes(value)) &&
      selectedCollection.audiences.includes(p.audience)
    )) &&
    searchText([p.name, p.alias, p.category, ...p.alsoShowIn, p.colourways, p.audience, p.collection,
      p.description, p.shortDescription, p.setContents, p.sizes, p.coverage, p.specifications,
      p.specificationStatus, p.priceBasis].join(' ')).includes(term)
  );
}

export function priceInfo(p) {
  const format = value => new Intl.NumberFormat('en-GB', {
    style: 'currency', currency: 'GBP',
  }).format(value);
  if (Number(p?.id) === 43) {
    return { label: 'Reference only · not for sale', value: '' };
  }
  if (Number.isFinite(p?.confirmedPrice) && p.confirmedPrice > 0) {
    return { label: '', value: format(p.confirmedPrice) };
  }
  return { label: '', value: '' };
}

const swatchPalette = [
  [/\bonxy black\b/i, '#090A0C'],
  [/\bdeep olive\b/i, '#4A5340'],
  [/\bwarm taupe\b/i, '#8C7A6B'],
  [/\bslate grey\b/i, '#2A3547'],
  [/\bmidnight navy\b/i, '#1D4ED8'],
  [/\bdeep burgundy\b/i, '#581C1C'],
  [/\bindigo\b/i, '#35415f'],
  [/\b(cobalt|blue)\b/i, '#2862c5'],
  [/\b(yellow|amber)\b/i, '#e1b642'],
  [/\b(ice[- ]?white|white)\b/i, '#e7e4dc'],
  [/\b(grey|gray)\b/i, '#81858a'],
  [/\bkhaki\b/i, '#857956'],
  [/\b(burgundy|maroon)\b/i, '#672a37'],
  [/\bred\b/i, '#b3202d'],
  [/\bblack\b/i, '#171819'],
  [/\bgold\b/i, '#c8aa72'],
];

export function imageSwatchBackground(label) {
  const text = String(label ?? '');
  const colours = swatchPalette
    .filter(([pattern]) => pattern.test(text))
    .map(([, colour]) => colour)
    .slice(0, 3);
  if (!colours.length) return '';
  if (colours.length === 1) return colours[0];
  const stop = 100 / colours.length;
  return `linear-gradient(135deg, ${colours.map((colour, index) =>
    `${colour} ${Math.round(index * stop)}% ${Math.round((index + 1) * stop)}%`).join(', ')})`;
}

export function safe(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
