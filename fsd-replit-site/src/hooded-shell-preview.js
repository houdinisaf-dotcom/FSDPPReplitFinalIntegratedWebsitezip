import { collectionDivisions } from './collection-divisions.js';
import { products } from './catalogue-data.js';
import { renderNavigationHeader, mountNavigation } from './site-navigation.js';
import approvedFsdHeaderLogo from '../brand-review/shield-refined-matte/assets/website-shield-lockup-refined.png';

const currentBrandMarkup = `<img class="fsd-brand-logo" src="${approvedFsdHeaderLogo}" alt="" aria-hidden="true"/>`;
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
