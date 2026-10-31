import { flagshipPageHashRoutes } from './flagship-pages.js';

export const FSD_STORY_PATH = '/story';
export const FSD_STORY_HASH = '#philosophy';
export const FSD_HOUSE_PAGE_PATH = '/the-house.html';

const hashRoutes = new Map([
  ['#products', { view: 'collection', target: 'all-products' }],
  ['#universe', { view: 'universe', target: 'global' }],
  ['#fsd-division-global', { view: 'universe', target: 'global' }],
  ['#hardware-editorial', { view: 'hardware', target: 'hardware' }],
  ['#innovations', { view: 'bio-lab', target: 'bio-lab' }],
  ['#innovation-hub', { view: 'page', target: 'innovation-hub' }],
  ['#philosophy', { view: 'story', target: 'our-story' }],
  ['#contact', { view: 'private-access', target: 'contact' }],
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
  if (destination?.startsWith('/__catalogue-preview/')) {
    return { view: 'preview', target: destination };
  }
  if (destination?.replace(/\/+$/, '') === FSD_STORY_PATH) {
    return { view: 'story', target: 'our-story' };
  }
  if (destination === FSD_HOUSE_PAGE_PATH || destination?.startsWith(`${FSD_HOUSE_PAGE_PATH}#`)) {
    return {
      view: 'house',
      target: destination === FSD_HOUSE_PAGE_PATH
        ? 'the-house-page'
        : destination.slice(FSD_HOUSE_PAGE_PATH.length + 1),
    };
  }
  return routeFromHash(destination);
}

export function routeFromLocation(location = {}) {
  if (location.hash) return routeFromHash(location.hash);

  const pathname = String(location.pathname || '/').replace(/\/+$/, '') || '/';
  if (pathname === FSD_STORY_PATH) return { view: 'story', target: 'our-story' };
  if (pathname === FSD_HOUSE_PAGE_PATH) return { view: 'house', target: 'the-house-page' };
  return routeFromHash('');
}

export function resolveFsdRoute({ menu, group, item } = {}) {
  if (item?.kind === 'draft-product') {
    return { view: 'preview', target: item.href || item.id || null };
  }

  if (item?.record) {
    return { view: 'product', target: String(item.record.id) };
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
