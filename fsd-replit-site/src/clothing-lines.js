import { productImagesForDisplay } from './data/products.js';
import { COLLECTION_IMAGE_ASSETS } from './collection-image-config.js';

export const CLOTHING_LINES = Object.freeze([
  { id: 'aeroforge', title: 'AEROFORGE', eyebrow: 'WOMEN’S TECHNICAL PERFORMANCE', mark: null, colour: '#1C2541' },
  { id: 'combat', title: 'COMBAT', eyebrow: 'WOMEN’S COMBAT TRAINING', mark: null, colour: '#5E1A22' },
  { id: 'flex', title: 'FLEX', eyebrow: 'WOMEN’S TRAINING LEGGINGS', mark: null, colour: '#6F767D' },
  { id: 'breeze', title: 'BREEZE', eyebrow: 'WOMEN’S LIGHT LAYERS', mark: null, colour: '#4B5A3A' },
  { id: 'modest-flow', title: 'MODEST FLOW', eyebrow: 'WOMEN’S MODEST PERFORMANCE', mark: null, colour: '#A08670' },
  { id: 'tiger-series', title: 'FSD TIGER SERIES', eyebrow: 'MEN’S PERFORMANCE / TIGER', mark: null, colour: '#D4AF37' },
  { id: 'scorpion-series', title: 'FSD SCORPION SERIES', eyebrow: 'TACTICAL APPAREL / SCORPION', mark: null, colour: '#C8AA72' },
]);

// Future approved campaign/banner photographs may be configured here. Product
// photography remains the source until each replacement is explicitly approved.
// Animal marks are unredrawn photographic patch crops supplied by the owner,
// not transparent/vector artwork. Full original boards remain untouched.
export const CLOTHING_LINE_ASSETS = Object.freeze(Object.fromEntries(
  CLOTHING_LINES.map(line => [line.id, COLLECTION_IMAGE_ASSETS[line.id]]),
));

const normalized = value => String(value ?? '')
  .replace(/[‘’]/g, "'")
  .toLocaleLowerCase('en-GB');
const fields = product => [
  product?.name,
  product?.collection,
  product?.series,
  product?.collectionLine,
  product?.badge,
  product?.category,
  ...(product?.alsoShowIn || []),
].map(normalized).join(' ');
const metadataHas = (product, pattern) => pattern.test(fields(product));
const isWomen = product => /\bwomen(?:'s)?\b/.test(normalized(product?.audience))
  || (product?.alsoShowIn || []).some(value => /\bwomen(?:'s)?\b/.test(normalized(value)));
const hasCombatCategory = product => [product?.category, ...(product?.alsoShowIn || [])]
  .some(value => /\bcombat\b|\bmma\b/.test(normalized(value)));

const linePatterns = {
  aeroforge: /\baero[\s-]?forge\b/, combat: /\bcombat\b/,
  flex: /(^|[^a-z])flex([^a-z]|$)/, breeze: /\bbreeze\b/,
  'modest-flow': /\bmodest[\s-]?flow\b/, 'tiger-series': /\btiger\b/,
  'scorpion-series': /\bscorpion\b/,
};
const list = value => Array.isArray(value) ? value : String(value || '').split(/[;,]/).map(v => v.trim()).filter(Boolean);
const canonical = value => normalized(value).replace(/^(?:collection|line):/, '').replace(/^fsd[\s-]+/, '').replace(/\s+/g, '-');

// Explicit assignments win over legacy names/categories. Generic Core metadata
// is not a line assignment; legacy records without one retain their existing mapping.
export function explicitClothingLines(product) {
  const ids = list(product.collectionIds);
  if (ids.length) return new Set(ids.map(canonical));
  const direct = [product.collectionLine, product.series].filter(Boolean);
  if (direct.length) return new Set(Object.entries(linePatterns)
    .filter(([, pattern]) => direct.some(value => pattern.test(normalized(value)))).map(([id]) => id));
  const collection = Object.entries(linePatterns).filter(([, pattern]) => pattern.test(normalized(product.collection)));
  if (collection.length) return new Set(collection.map(([id]) => id));
  const tags = list(product.tags).map(canonical).filter(id => Object.hasOwn(linePatterns, id));
  if (tags.length) return new Set(tags);
  const badges = Object.entries(linePatterns).filter(([, pattern]) => pattern.test(normalized(product.badge)));
  if (badges.length) return new Set(badges.map(([id]) => id));
  return null;
}

export function productBelongsToLine(product, lineId) {
  if (!Object.hasOwn(linePatterns, lineId)) return false;
  const explicit = explicitClothingLines(product);
  if (explicit !== null) return explicit.has(lineId)
    && (lineId.endsWith('-series') || isWomen(product));
  switch (lineId) {
    case 'aeroforge':
      return metadataHas(product, /\baero[\s-]?forge\b/) && isWomen(product);
    case 'combat':
      return isWomen(product) && (metadataHas(product, /\bcombat\b/) || hasCombatCategory(product));
    case 'flex':
      return isWomen(product) && metadataHas(product, /(^|[^a-z])flex([^a-z]|$)/);
    case 'breeze':
      return isWomen(product) && metadataHas(product, /\bbreeze\b/);
    case 'modest-flow':
      return isWomen(product) && metadataHas(product, /\bmodest[\s-]?flow\b/);
    case 'tiger-series':
      return metadataHas(product, /\btiger\b/);
    case 'scorpion-series':
      return metadataHas(product, /\bscorpion\b/);
    default:
      return false;
  }
}

export function deriveClothingLineMembership(products) {
  const lines = CLOTHING_LINES.map(line => ({
    ...line,
    products: products.filter(product => productBelongsToLine(product, line.id)),
  }));
  const assignedIds = new Set(lines.flatMap(line => line.products.map(product => product.id)));
  return {
    lines,
    unassigned: products.filter(product => !assignedIds.has(product.id)),
    imageFor: product => productImagesForDisplay(product)[0] ?? null,
  };
}
