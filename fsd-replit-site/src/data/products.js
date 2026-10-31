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
  "FSD Strike Men's Combat Shorts": [
    { src: '/assets/products/strike-shorts-hero.webp', label: 'Action Kick Hero View' },
    { src: '/assets/products/strike-shorts-front.webp', label: 'Front View' },
    { src: '/assets/products/strike-shorts-rear.webp', label: 'Rear View' },
    { src: '/assets/products/strike-shorts-side.webp', label: 'Side / Fit View' },
    { src: '/assets/products/strike-shorts-waistband-detail.webp', label: 'Detail / Waistband, Drawcord & Gold Hardware' },
    { src: '/assets/products/strike-shorts-mesh-detail.webp', label: 'Detail / Mesh Panel & Trim' },
    { src: '/assets/products/strike-shorts-kick-view.webp', label: 'Training Kick View' },
  ],
  'FLEX — High-Waisted Sculpt Leggings': [
    { src: '/assets/products/flex-leggings-obsidian-front.webp', label: 'Obsidian Black / Front Lifestyle Hero', colourway: 'Obsidian Black' },
    { src: '/assets/products/flex-leggings-obsidian-rear.webp', label: 'Obsidian Black / Rear View', colourway: 'Obsidian Black' },
    { src: '/assets/products/flex-leggings-sage-seated.webp', label: 'Sage Green / Seated Lifestyle View', colourway: 'Sage Green' },
    { src: '/assets/products/flex-leggings-sage-rear.webp', label: 'Sage Green / Rear Contour View', colourway: 'Sage Green' },
    { src: '/assets/products/flex-leggings-dusty-rose-rear.webp', label: 'Dusty Rose / Rear Lifestyle View', colourway: 'Dusty Rose' },
    { src: '/assets/products/flex-leggings-espresso-rear.webp', label: 'Espresso Brown / Rear View', colourway: 'Espresso Brown' },
    { src: '/assets/products/flex-leggings-espresso-pocket.webp', label: 'Espresso Brown / Side Pocket Detail', colourway: 'Espresso Brown' },
    { src: '/assets/products/flex-leggings-teal-rear.webp', label: 'Teal / Rear View', colourway: 'Teal' },
    { src: '/assets/products/flex-leggings-detail-pocket.webp', label: 'Technical Detail / Side Phone Pocket' },
    { src: '/assets/products/flex-leggings-detail-fabric.webp', label: 'Technical Detail / Fabric Texture' },
    { src: '/assets/products/flex-leggings-detail-flatlock-seams.webp', label: 'Technical Detail / Flatlock Seams' },
  ],
  "FSD Women's MMA Performance Rash Guard": [
    { src: '/assets/products/womens-rashguard-hero.png', label: 'Hero Lifestyle View', colourway: 'Obsidian & Satin Gold' },
    { src: '/assets/products/womens-rashguard-front.png', label: 'Front / Long Sleeve Technical View', colourway: 'Obsidian & Satin Gold' },
    { src: '/assets/products/womens-rashguard-back.png', label: 'Back / Long Sleeve Technical View', colourway: 'Obsidian & Satin Gold' },
    { src: '/assets/products/womens-rashguard-short-sleeve.png', label: 'Front / Short Sleeve Option', colourway: 'Obsidian & Satin Gold' },
    { src: '/assets/products/womens-rashguard-gusset-detail.png', label: 'Detail / Underarm Mesh Gusset', colourway: 'Obsidian & Satin Gold' },
    { src: '/assets/products/womens-rashguard-flatlock-detail.png', label: 'Detail / Reinforced Flatlock Seam', colourway: 'Obsidian & Satin Gold' },
    { src: '/assets/products/womens-rashguard-graphics-detail.png', label: 'Detail / Satin Gold Graphic', colourway: 'Obsidian & Satin Gold' },
    { src: '/assets/products/womens-rashguard-hem-detail.png', label: 'Detail / Anti-Ride-Up Hem', colourway: 'Obsidian & Satin Gold' },
    { src: '/assets/products/womens-rashguard-action-1.png', label: 'Action / Grappling View 1', colourway: 'Obsidian & Satin Gold' },
    { src: '/assets/products/womens-rashguard-action-2.png', label: 'Action / Grappling View 2', colourway: 'Obsidian & Satin Gold' },
    { src: '/assets/products/womens-rashguard-action-3.png', label: 'Combat Movement View', colourway: 'Obsidian & Satin Gold' },
    { src: '/assets/products/womens-rashguard-action-4.png', label: 'Rear Branding / Movement View', colourway: 'Obsidian & Satin Gold' },
    { src: '/assets/products/womens-rashguard-box.png', label: 'Packaging / Presentation Box', colourway: 'Obsidian & Satin Gold' },
  ],
  'FSD Velocity Sports Hijab': [
    { src: '/assets/products/velocity-hijab-main-listing.jpg', label: 'Main Product Listing / Lifestyle Hero', colourway: 'Black / Gold' },
    { src: '/assets/products/velocity-hijab-front-detail.png', label: 'Front / Hero Detail', colourway: 'Black / Gold' },
    { src: '/assets/products/velocity-hijab-rear-view.png', label: 'Rear View', colourway: 'Black / Gold' },
    { src: '/assets/products/velocity-hijab-fabric-ventilation.png', label: 'Fabric & Ventilation Detail', colourway: 'Black / Gold' },
    { src: '/assets/products/velocity-hijab-branding-detail.png', label: 'Branding / Gold Crest Detail', colourway: 'Black / Gold' },
  ],
  'FSD Performance Crew Socks': [
    { src: '/assets/products/performance-socks-side.png', label: 'Side Profile View', colourway: 'Obsidian & Satin Gold' },
    { src: '/assets/products/performance-socks-rear.png', label: 'Rear Heel View', colourway: 'Obsidian & Satin Gold' },
    { src: '/assets/products/performance-socks-detail.png', label: 'Detail / Gold Crest Embroidery', colourway: 'Obsidian & Satin Gold' },
    { src: '/assets/products/performance-socks-mesh.png', label: 'Texture / Arch Mesh Panel', colourway: 'Obsidian & Satin Gold' },
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
  'Signature Performance Sports Duffel': [
    { src: '/assets/products/signature-duffel-lifestyle.png', label: 'Lifestyle / Gym Hero', colourway: 'Obsidian & Satin Gold' },
    { src: '/assets/products/signature-duffel-overview.png', label: 'Front / Overview', colourway: 'Obsidian & Satin Gold' },
    { src: '/assets/products/signature-duffel-shoe-compartment.png', label: 'Side Compartment / Shoe Storage', colourway: 'Obsidian & Satin Gold' },
    { src: '/assets/products/signature-duffel-interior-organization.png', label: 'Interior / Organization', colourway: 'Obsidian & Satin Gold' },
    { src: '/assets/products/signature-duffel-hardware-detail.png', label: 'Hardware / Crest Close-up', colourway: 'Obsidian & Satin Gold' },
  ],
  'FSD OBSIDIAN GOLD™ ELITE SET': [
    { src: '/assets/products/obsidian-gold-elite-set.webp', label: 'Dumbbell Set / Product View' },
  ],
  'FSD VANGUARD COMMERCIAL™ PRO SET': [
    { src: '/assets/products/vanguard-commercial-set.webp', label: 'Commercial Dumbbell Set / Product View' },
  ],
  'FSD Precision Barbell Collars (Pair)': [
    { src: '/assets/products/precision-barbell-collars.webp', label: 'Precision Barbell Collars / Product View' },
  ],
};

// Publication decisions use stable record metadata, not names that may change.
export const heldProducts = masterProducts.filter(p => p['Publication status'] === 'Hold');
export const retiredProducts = masterProducts.filter(p => ['Merged', 'Replaced'].includes(p['Publication status']));
export const products = masterProducts
  .filter(p => !p['Publication status'] || p['Publication status'] === 'Active')
  .map(p => {
    const references = imageReferences[p['Product name']] ?? [];
    const colourwayImages = Array.isArray(p['Colourway palette'])
      ? p['Colourway palette'].map(colourway => ({
        src: colourway.image,
        label: `Colourway / ${colourway.name}`,
        colourway: colourway.name,
      }))
      : [];
    return ({
    id: p.id,
    name: p['Product name'],
    category: p.Category,
    alsoShowIn: p['Also show in'].split(';').map(s => s.trim()).filter(Boolean),
    audience: p.Audience,
    publicationStatus: p['Publication status'] ?? '',
    confirmedPrice: p['Price (£) confirmed'] === '' ? null : Number(p['Price (£) confirmed']),
    colourways: p.Colourways,
    collection: p['Collection line'],
    imageStatus: p['Image status'],
    source: p.Source,
    alias: p['Also appears as'],
    aliasStatus: p['Alias status'] ?? '',
    externalId: p['External ID'] ?? '',
    currency: p.Currency ?? '',
    badge: p.Badge ?? '',
    galleryPlaceholders: Array.isArray(p['Image placeholders']) ? p['Image placeholders'] : [],
    colourwayPrimary: p['Colourway primary'] ?? '',
    colourwayAccent: p['Colourway accent'] ?? '',
    colourwayPalette: Array.isArray(p['Colourway palette']) ? p['Colourway palette'] : [],
    options: Array.isArray(p.Options) ? p.Options : [],
    ...(p.Materials ? { materials: p.Materials } : {}),
    ...(Array.isArray(p.Features) && p.Features.length ? { features: p.Features } : {}),
    description: p.Description ?? '',
    shortDescription: p['Short description'] ?? '',
    setContents: p['Set contents'] ?? '',
    sizes: p.Sizes ?? '',
    coverage: p.Coverage ?? '',
    specifications: p.Specifications ?? '',
    specificationStatus: p['Specification status'] ?? '',
    priceBasis: p['Price basis'] ?? '',
    notes: p.Notes.trim(),
    images: colourwayImages.length
      ? [...references.slice(0, 1), ...colourwayImages, ...references.slice(1)]
      : references,
  });});

// Add records here only after the complete specification set has been verified.
export const verifiedProductSpecifications = Object.freeze({
  56: {
    approvalStatus: 'verified',
    materials: [products.find(product => product.id === 56)?.materials].filter(Boolean),
    benefits: products.find(product => product.id === 56)?.features ?? [],
  },
  33: {
    approvalStatus: 'verified',
    materials: [products.find(product => product.id === 33)?.materials].filter(Boolean),
    benefits: products.find(product => product.id === 33)?.features ?? [],
    technicalSpecs: {
      composition: '82% polyester, 18% elastane; 220–250 GSM.',
      fit: 'High-coverage crew neck with an ergonomic women’s grappling fit.',
    },
  },
  34: {
    approvalStatus: 'verified',
    benefits: products.find(product => product.id === 34)?.features ?? [],
  },
  43: {
    approvalStatus: 'verified',
    benefits: products.find(product => product.id === 43)?.features ?? [],
  },
  57: {
    approvalStatus: 'verified',
    benefits: products.find(product => product.id === 57)?.features ?? [],
  },
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
  74: {
    approvalStatus: 'verified',
    benefits: products.find(product => product.id === 74)?.features ?? [],
  },
  75: {
    approvalStatus: 'verified',
    benefits: products.find(product => product.id === 75)?.features ?? [],
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

export function imageSwatchBackground(label, palette = []) {
  const text = String(label ?? '');
  const normalized = text.trim().toLocaleLowerCase();
  const colourway = Array.isArray(palette)
    ? palette.find(entry => String(entry?.name ?? '').trim().toLocaleLowerCase() === normalized)
    : null;
  if (/^#[\da-f]{6}$/i.test(colourway?.primary || '') && /^#[\da-f]{6}$/i.test(colourway?.accent || '')) {
    return `linear-gradient(135deg, ${colourway.primary} 0% 68%, ${colourway.accent} 68% 100%)`;
  }
  if (/^obsidian\s*&\s*satin gold$/i.test(text)) {
    return 'linear-gradient(135deg, #0A0A0A 0% 68%, #D4AF37 68% 100%)';
  }
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
