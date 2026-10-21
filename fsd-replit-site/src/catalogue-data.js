import masterProducts from './master-products.json' with { type: 'json' };
import reviewedRecords from './catalogue-records.json' with { type: 'json' };
import { extendCatalogueProduct, integrateReviewedRecords } from './catalogue-model.js';

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
};

// Publication decisions use stable record metadata, not names that may change.
export const heldProducts = masterProducts.filter(p => p['Publication status'] === 'Hold');
export const retiredProducts = masterProducts.filter(p => ['Merged', 'Replaced'].includes(p['Publication status']));
const legacyProducts = masterProducts
  .filter(p => !p['Publication status'] || p['Publication status'] === 'Active')
  .map(p => ({
    id: p.id,
    name: p['Product name'],
    category: p.Category,
    alsoShowIn: p['Also show in'].split(';').map(s => s.trim()).filter(Boolean),
    audience: p.Audience,
    confirmedPrice: p['Price (£) confirmed'] === '' ? null : Number(p['Price (£) confirmed']),
    suggestedPrice: p['Suggested price (£) – to confirm'] === '' ? null : Number(p['Suggested price (£) – to confirm']),
    colourways: p.Colourways,
    collection: p['Collection line'],
    imageStatus: p['Image status'],
    source: p.Source,
    alias: p['Also appears as'],
    aliasStatus: p['Alias status'] ?? '',
    coverage: p.Coverage ?? '',
    specifications: p.Specifications ?? '',
    specificationStatus: p['Specification status'] ?? '',
    priceBasis: p['Price basis'] ?? '',
    notes: p.Notes.trim(),
    images: imageReferences[p['Product name']] ?? [],
  })).map(extendCatalogueProduct);

export const products = integrateReviewedRecords(legacyProducts, reviewedRecords);

export const categories = [...new Set(products.flatMap(p => [p.category, ...p.alsoShowIn]))];

const searchText = value => value.replace(/[‘’]/g, "'").toLocaleLowerCase('en-GB');

export function filterProducts(category = 'All', query = '') {
  const term = searchText(query.trim());
  return products.filter(p =>
    (category === 'All' || p.category === category || p.alsoShowIn.includes(category)) &&
    searchText([p.name, p.alias, p.category, ...p.alsoShowIn, p.colourways, p.audience, p.collection,
      p.coverage, p.specifications, p.specificationStatus, p.priceBasis].join(' ')).includes(term)
  );
}

export function priceInfo(p) {
  const format = value => new Intl.NumberFormat('en-GB', {
    style: 'currency', currency: 'GBP',
  }).format(value);
  if (p.confirmedPrice !== null) return { label: 'Confirmed list price', value: format(p.confirmedPrice) };
  if (p.suggestedPrice !== null) return { label: 'Suggested · to confirm', value: format(p.suggestedPrice) };
  return { label: 'Price not set', value: 'To be confirmed' };
}

export function safe(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
