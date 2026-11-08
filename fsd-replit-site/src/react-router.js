import { flagshipPageHashRoutes } from './flagship-pages.js';
import { seoEntryForPath } from './site-seo.js';
import { CATALOGUE_COLLECTIONS } from './catalogue-collections.js';

export const FSD_STORY_PATH = '/story';
export const FSD_STORY_HASH = '#philosophy';
export const FSD_HOUSE_PAGE_PATH = '/the-house.html';

const divisionLandingRoutes = new Map([
  ['/shop', 'shop'],
  ['/universe', 'universe'],
  ['/bio-lab', 'bio-lab'],
  ['/hardware', 'hardware'],
  ['/private-access', 'private-access'],
]);

const hashRoutes = new Map([
  ['#products', { view: 'collection', target: 'all-products' }],
  ['#universe', { view: 'universe', target: 'global' }],
  ['#fsd-division-global', { view: 'universe', target: 'global' }],
  ['#hardware-editorial', { view: 'hardware', target: 'hardware' }],
  ['#innovations', { view: 'bio-lab', target: 'bio-lab' }],
  ['#innovation-hub', { view: 'page', target: 'innovation-hub' }],
  ['#fsd-house-archive', { view: 'house', target: 'house-hub' }],
  ['#philosophy', { view: 'story', target: 'our-story' }],
  ['#contact', { view: 'private-access', target: 'contact' }],
  ['#clothing-lines', { view: 'collection', target: 'clothing-lines' }],
  ['#technical-collections-archive', { view: 'collection', target: 'technical-collections-archive' }],
  ...CATALOGUE_COLLECTIONS.filter(collection => collection.kind === 'catalogue-collection')
    .map(collection => [`#collection-${collection.id}`, { view: 'collection', target: `collection-${collection.id}` }]),
  ...['aeroforge', 'combat', 'flex', 'breeze', 'modest-flow', 'tiger-series', 'scorpion-series']
    .map(id => [`#line-${id}`, { view: 'collection', target: `line-${id}` }]),
  ...flagshipPageHashRoutes,
]);

export function registerFsdHashRoute(hash, route) {
  if (typeof hash !== 'string' || !hash.startsWith('#') || !route || typeof route.view !== 'string') {
    throw new TypeError('A valid FSD hash route is required.');
  }
  hashRoutes.set(hash, route);
}

export function routeFromHash(hash = '') {
  return hashRoutes.get(hash) || { view: 'home', target: null };
}

function routeFromDestination(destination) {
  const pathname = destination?.split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/';
  if (destination === pathname && divisionLandingRoutes.has(pathname)) {
    return { view: 'division-hub', target: divisionLandingRoutes.get(pathname) };
  }
  if (pathname === FSD_HOUSE_PAGE_PATH) return { view: 'house', target: 'house-hub' };
  if (destination?.startsWith('/__catalogue-preview/')) {
    return { view: 'preview', target: destination };
  }
  if (destination?.replace(/\/+$/, '') === FSD_STORY_PATH) {
    return { view: 'story', target: 'our-story' };
  }
  if (destination?.startsWith('/collections/')) {
    const pathname = destination.split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/';
    const entry = seoEntryForPath(pathname);
    if (entry) return entry.route;
  }
  return routeFromHash(destination);
}

export function routeFromLocation(location = {}) {
  if (location.hash) return routeFromHash(location.hash);

  const pathname = String(location.pathname || '/').replace(/\/+$/, '') || '/';
  if (pathname === FSD_HOUSE_PAGE_PATH) return { view: 'house', target: 'house-hub' };
  if (divisionLandingRoutes.has(pathname)) {
    return { view: 'division-hub', target: divisionLandingRoutes.get(pathname) };
  }
  if (pathname === FSD_STORY_PATH) return { view: 'story', target: 'our-story' };
  const entry = seoEntryForPath(pathname);
  if (entry) return entry.route;
  return routeFromHash('');
}

export function resolveFsdRoute({ menu, group, item } = {}) {
  if (group?.id === 'catalogue-collections' || item?.kind === 'catalogue-collection') {
    const destination = item?.href || group?.href || '';
    if (destination.startsWith('/collections/')) return routeFromDestination(destination);
    return routeFromHash(destination.slice(destination.indexOf('#')));
  }
  if (item?.kind === 'draft-product') {
    return { view: 'preview', target: item.href || item.id || null };
  }

  if (item?.record) {
    return { view: 'product', target: String(item.record.id) };
  }

  if (group?.id === 'clothing-lines'
    || item?.kind === 'clothing-lines'
    || item?.kind === 'clothing-line') {
    return routeFromDestination(item?.href || group?.href);
  }

  if (item?.kind === 'category' || item?.kind === 'subcategory' || item?.kind === 'shop-all'
    || menu?.id === 'collections') {
    return {
      view: 'collection',
      target: item?.id || group?.id || 'all-products',
    };
  }

  const destination = item?.href || group?.href;
  if (destination) return routeFromDestination(destination);

  const divisionId = item?.sourceDivisionId || group?.sourceDivisionId || menu?.divisionId;
  const target = item?.id || group?.id || divisionId || null;

  switch (menu?.id) {
    case 'universe':
      return { view: 'universe', target };
    case 'bio-lab':
      return { view: 'bio-lab', target };
    case 'hardware':
      return { view: 'hardware', target };
    case 'house':
      return divisionId
        ? { view: 'universe', target: item?.id || group?.id || divisionId }
        : { view: 'house', target };
    case 'private-access':
      return { view: 'private-access', target: target || 'contact' };
    default:
      return divisionId
        ? { view: 'universe', target: item?.id || group?.id || divisionId }
        : { view: 'home', target: null };
  }
}
