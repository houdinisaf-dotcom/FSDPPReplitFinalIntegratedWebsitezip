import { HOUSE_PAGE_REGISTRY, getHousePageRecord } from '../data/house-page-readiness.js';
import { mountDeclaredHouseMedia, mountHouseEditorial } from './house-editorial.js';

const housePagePaths = new Set([
  ...HOUSE_PAGE_REGISTRY
    .map(page => page.path),
]);

function setPageStatus(page) {
  const root = document.documentElement;
  if (page?.readiness === 'NOT_READY') {
    root.setAttribute('data-fsd-status', 'NOT READY');
  } else {
    root.removeAttribute('data-fsd-status');
  }
}

export function mountHousePageRuntime({
  root = globalThis.document,
  pathname = globalThis.location?.pathname,
  development = import.meta.env?.DEV === true,
} = {}) {
  if (!root || !housePagePaths.has(pathname)) return { mounted: false, unmount() {} };

  const page = getHousePageRecord(pathname);
  setPageStatus(page);

  const reviewSlots = page?.readiness === 'NOT_READY' && page?.heroMedia
    ? [{ target: '.hero, #hero', label: page.heroMedia }]
    : [];

  const editorial = mountHouseEditorial({
    root,
    development,
    reviewSlots,
  });
  const media = mountDeclaredHouseMedia(root);

  return {
    mounted: editorial.mounted,
    unmount() {
      editorial.unmount();
      media.forEach(figure => {
        figure._fsdCleanup?.();
        figure.remove();
      });
    },
  };
}
