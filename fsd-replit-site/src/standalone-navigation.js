import { products } from './catalogue-data.js';
import { collectionDivisions } from './collection-divisions.js';
import { mountNavigation, renderNavigationHeader } from './site-navigation.js';
import './standalone-navigation.css';

const host = document.querySelector('[data-fsd-standalone-navigation]');

if (host) {
  host.innerHTML = renderNavigationHeader('<span class="fsd-standalone-wordmark">FSD</span>');
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
