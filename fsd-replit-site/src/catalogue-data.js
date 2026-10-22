import masterProducts from './master-products.json' with { type: 'json' };
import { collectionDivisions } from './collection-divisions.js';

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
export const products = masterProducts
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
  }));

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
      p.coverage, p.specifications, p.specificationStatus, p.priceBasis].join(' ')).includes(term)
  );
}

export function priceInfo(p) {
  const format = value => new Intl.NumberFormat('en-GB', {
    style: 'currency', currency: 'GBP',
  }).format(value);
  if (p.confirmedPrice !== null) return { label: '', value: format(p.confirmedPrice) };
  if (p.suggestedPrice !== null) return { label: 'Expected', value: format(p.suggestedPrice) };
  return { label: '', value: 'Price at launch' };
}

export function safe(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
