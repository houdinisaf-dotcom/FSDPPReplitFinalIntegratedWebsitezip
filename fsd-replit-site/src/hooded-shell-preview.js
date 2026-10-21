import { collectionDivisions } from './collection-divisions.js';
import { products } from './catalogue-data.js';
import { renderNavigationHeader, mountNavigation } from './site-navigation.js';

function icon() {
  return `<svg viewBox="0 0 100 100" fill="none" aria-hidden="true"><path d="M50 6 85 20 80 62 50 91 20 62 15 20Z" stroke="currentColor" stroke-width="5"/><path d="M20 65 68 20 51 56 83 38 36 81 49 48Z" fill="currentColor"/></svg>`;
}

const currentBrandMarkup = `<span class="brand-icon">${icon()}</span><span class="brand-type"><strong>FSD</strong><small>FITNESS & SELF DEFENCE</small></span>`;
const headerRoot = document.querySelector('#shell-site-header');
headerRoot.innerHTML = renderNavigationHeader(currentBrandMarkup);

mountNavigation({
  root: headerRoot.querySelector('[data-navigation-shell]'),
  divisions: collectionDivisions,
  products,
  includeDraftPreviews: true,
  onNavigate({ item, group }) {
    if (item?.kind === 'draft-product' && item.href) {
      window.location.assign(item.href);
      return;
    }

    const destination = item?.href || group?.href;
    if (destination?.startsWith('#')) {
      window.location.assign(`/${destination}`);
      return;
    }

    window.location.assign('/#collections');
  },
});
