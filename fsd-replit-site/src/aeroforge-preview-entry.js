import { collectionDivisions } from './collection-divisions.js';
import { products } from './catalogue-data.js';
import { renderNavigationHeader, mountNavigation } from './site-navigation.js';
import { aeroforgeDataPath } from './aeroforge-preview-path.js';
import { mountAeroForgePreview } from './aeroforge-preview-ui/aeroforge-preview.js';
import approvedFsdHeaderLogo from '../brand-review/shield-refined-matte/assets/website-shield-lockup-refined.png';
import './style.css';
import './site-navigation.css';
import './aeroforge-preview-ui/aeroforge-preview.css';

const headerRoot = document.querySelector('#aeroforge-site-header');
const contentRoot = document.querySelector('#aeroforge-preview-root');

if (!headerRoot || !contentRoot) {
  throw new TypeError('The private AeroForge preview shell is missing its header or content mount.');
}

headerRoot.innerHTML = renderNavigationHeader(
  `<img class="fsd-brand-logo" src="${approvedFsdHeaderLogo}" alt="" aria-hidden="true"/>`,
);

mountNavigation({
  root: headerRoot.querySelector('[data-navigation-shell]'),
  divisions: collectionDivisions,
  products,
  includeDraftPreviews: true,
  onNavigate({ item }) {
    if (item?.kind === 'draft-product' && item.href) {
      window.location.assign(item.href);
      return;
    }
    window.location.assign('/#collections');
  },
});

async function loadPrivateProof() {
  try {
    const response = await fetch(aeroforgeDataPath, { cache: 'no-store' });
    if (!response.ok) throw new Error('Private draft data unavailable.');
    const data = await response.json();
    if (data.collection?.editorialStatus !== 'Draft'
      || data.collection?.purchaseEnabled !== false
      || data.collection?.publicationAuthorized !== false
      || data.products?.length !== 2
      || data.products.some(product => product.editorialStatus !== 'Draft'
        || product.purchaseEnabled !== false
        || product.publicationAuthorized !== false)) {
      throw new Error('Private draft status validation failed.');
    }
    mountAeroForgePreview(contentRoot, data);
  } catch (error) {
    console.error('The private AeroForge proof could not be loaded.', error);
    contentRoot.textContent = 'The private AeroForge proof is unavailable. No product data, purchasing, or publication has been changed.';
  }
}

loadPrivateProof();
