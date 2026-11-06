import { products } from './catalogue-data.js';
import { collectionDivisions } from './collection-divisions.js';
import { mountNavigation, renderNavigationHeader } from './site-navigation.js';
import { mountHousePageRuntime } from './house-pages/house-page-runtime.js';
import { mountHousePageEnrichment } from './house-pages/house-page-enrichment.js';
import approvedFsdHeaderLogo from '../brand-review/shield-refined-matte/assets/website-shield-lockup-defence.png';
import './standalone-navigation.css';
import './flagship-redesign.css';

const host = document.querySelector('[data-fsd-standalone-navigation]');

if (host) {
  host.innerHTML = renderNavigationHeader(
    `<img class="fsd-brand-logo" src="${approvedFsdHeaderLogo}" alt="" aria-hidden="true"/>`,
  );
  const navigationRoot = host.querySelector('[data-navigation-shell]');

  mountNavigation({
    root: navigationRoot,
    divisions: collectionDivisions,
    products,
    onNavigate: ({ menu, group, item }) => {
      let destination = item?.href || group?.href;
      if (!destination) return;
      if (menu.id === 'private-access' && destination.startsWith('#')) {
        destination = `/${destination}`;
      }
      window.location.assign(destination);
    },
  });
}

mountHousePageRuntime();
mountHousePageEnrichment();
