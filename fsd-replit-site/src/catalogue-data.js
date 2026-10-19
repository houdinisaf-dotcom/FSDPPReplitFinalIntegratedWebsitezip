import masterProducts from './master-products.json' with { type: 'json' };

// Keep held records in the source file, but never promote them as catalogue items.
const heldNames = new Set([
  'FSD Boxing & MMA Championship Belt (concept)',
  'FSD Boxing Ring Corner Post (concept)',
  'FSD Premium Shilajit & Lion’s Mane Gummies (60-Pack)',
]);

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
};

export const heldProducts = masterProducts.filter(p => heldNames.has(p['Product name']));
export const products = masterProducts
  .filter(p => !heldNames.has(p['Product name']))
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
    notes: p.Notes.trim(),
    images: imageReferences[p['Product name']] ?? [],
  }));

export const categories = [...new Set(products.flatMap(p => [p.category, ...p.alsoShowIn]))];

export function filterProducts(category = 'All', query = '') {
  const term = query.trim().toLocaleLowerCase('en-GB');
  return products.filter(p =>
    (category === 'All' || p.category === category || p.alsoShowIn.includes(category)) &&
    [p.name, p.alias, p.category, ...p.alsoShowIn, p.colourways, p.audience, p.collection]
      .join(' ').toLocaleLowerCase('en-GB').includes(term)
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
