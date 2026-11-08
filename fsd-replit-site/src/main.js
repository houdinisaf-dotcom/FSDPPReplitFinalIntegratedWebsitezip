import { catalogueSection, initCatalogue, navigateCatalogue, showProduct } from './catalogue.js';
import { products } from './catalogue-data.js';
import { collectionDivisions } from './collection-divisions.js';
import { renderCollectionShowcase, mountCollectionShowcase } from './collection-showcase/index.js';
import { beyondProductSection, featuredInnovationsSection, houseConnectionSection, vipAccessSection, initCatalogueNavigation, mountGarmentStudies } from './showroom-sections.js';
import { divisionLandingPaths, primaryNavigation, renderNavigationHeader } from './site-navigation.js';
import { mountClientBag } from './bag.js';
import { FSD_HOUSE_PAGE_PATH, FSD_STORY_PATH, resolveFsdRoute } from './react-router.js';
import { CATALOGUE_COLLECTIONS } from './catalogue-collections.js';
import { seoEntryForPath } from './site-seo.js';
import { flagshipPageHashes, renderBioLabPlaceholderPages, renderInnovationHubIndex, renderStrategicConceptDetail } from './flagship-pages.js';
import { renderStrategicConceptIndex } from './strategic-concepts.js';
import { mountStorefrontMotion } from './motion-runtime.js';
import { installImageErrorFallbacks } from './image-placeholder.js';
import { HOUSE_PAGE_REGISTRY } from './data/house-page-readiness.js';
import { renderHouseDestinationIndex } from './house-pages/house-destination-index.js';
import { ourStorySection } from './story-section.js';
import { renderSiteFooter } from './site-footer.js';
import { renderHomepageFaq } from './homepage-faq.js';
import './style.css';
import './catalogue.css';
import './product-detail.css';
import './collection-showcase/collection-showcase.css';
import './showroom.css';
import './story-section.css';
import './site-navigation.css';
import './visual-system.css';
import './flagship-pages.css';
import './bag.css';
import './globals.css';
import './motion-effects.css';
import './image-placeholders.css';
import './homepage-phase3.css';
import './showroom-phase8.css';
import './immersive-product-gallery.css';
import './house-pages/house-destination-index.css';
import './site-cta.css';
import './site-footer.css';
import './ui-interactions.css';
import './flagship-redesign.css';
import './premium-visual-refinement.css';

if (typeof document !== 'undefined') installImageErrorFallbacks(document);

const housePagePaths = new Set(HOUSE_PAGE_REGISTRY.map(page => page.path));
const homeDivisionNotes = Object.freeze({
  collections: 'Established collections and product records',
  universe: 'The wider FSD vision and community',
  'bio-lab': 'Research concepts and material exploration',
  hardware: 'Catalogued training equipment',
  house: 'The FSD story and its divisions',
  'private-access': 'Enquiry information; access remains unavailable',
});

function renderHomeDivisionGateway() {
  const cards = primaryNavigation.map((division, index) => {
    const href = divisionLandingPaths[division.id];
    if (!href) throw new Error(`Missing destination for the ${division.label} division.`);
    return `<a class="fsd-home-division-card" href="${href}">
      <span class="fsd-home-division-card__index">${String(index + 1).padStart(2, '0')}</span>
      <span class="fsd-home-division-card__copy">
        <strong>${division.label}</strong>
        <small>${homeDivisionNotes[division.id]}</small>
      </span>
      <span class="fsd-home-division-card__arrow" aria-hidden="true">↗</span>
    </a>`;
  }).join('');

  return `<section class="fsd-home-division-gateway" aria-labelledby="fsd-home-division-title">
    <div class="fsd-home-division-gateway__heading">
      <p>FSD / SIX DIVISIONS</p>
      <h2 id="fsd-home-division-title">Choose your<br/><em>next direction.</em></h2>
      <span>01 — 06</span>
    </div>
    <nav class="fsd-home-division-grid" aria-label="Explore the six FSD divisions">
      ${cards}
    </nav>
  </section>`;
}

export function renderStorefrontHeader() {
  const currentBrandMarkup = '<span data-fsd-logo-slot="header"></span>';
  return renderNavigationHeader(currentBrandMarkup);
}

function openProduct(id, onRouteChange = () => {}, returnFocus = null, initialVariant = {}) {
  onRouteChange({ view: 'product', target: String(id) });
  showProduct(id, { returnFocus, initialVariant });
}

export function renderStorefrontMarkup() {
  const storyFooterLink = housePagePaths.has(FSD_STORY_PATH)
    && import.meta.env.PROD
    ? '<a aria-disabled="true" tabindex="-1">THE HOUSE / OUR STORY</a>'
    : `<a href="${FSD_STORY_PATH}">THE HOUSE / OUR STORY</a>`;

  return `<main id="home">
  <div data-home-hero-slot></div>
  ${renderHomeDivisionGateway()}
</main>
<div id="collections">
  ${renderCollectionShowcase(collectionDivisions, { editorial: true, products })}
  <div class="fsd-clothing-discover">
    <span>THE APPAREL ARCHIVE / SEVEN ESTABLISHED LINES</span>
    <a href="#clothing-lines">DISCOVER THE CLOTHING LINES <span aria-hidden="true">↗</span></a>
  </div>
</div>
  <section
    class="showroom-engineering showroom-engineering--campaign"
    id="hardware-editorial"
    aria-labelledby="hardware-editorial-title"
    data-fsd-react-section="hardware-editorial"
  ></section>
  <section class="fsd-editorial-divider" aria-label="FSD design philosophy">
    <p>THE REFINEMENT OF LUXURY FASHION. THE ENERGY OF ELITE SPORT. THE PRECISION OF PERFORMANCE ENGINEERING. THE INNOVATION OF MODERN TECHNOLOGY.</p>
  </section>
  ${featuredInnovationsSection()}
  ${beyondProductSection()}
  ${houseConnectionSection()}
  ${renderHomepageFaq()}
  <div data-fsd-clothing-lines-slot></div>
  ${ourStorySection()}
  <details class="showroom-archive showroom-archive--discover" id="fsd-house-archive">
    <summary>DISCOVER THE FSD HOUSE</summary>
    <div class="showroom-archive-content">
      ${renderHouseDestinationIndex()}
      ${import.meta.env.DEV ? '<div data-dev-review-slot></div>' : ''}
      ${vipAccessSection()}
    </div>
  </details>
  <details class="showroom-archive showroom-archive--catalogue" id="bio-lab-archive">
    <summary>FSD BIO-LAB™ / INNOVATION HUB</summary>
    <div class="showroom-archive-content">
      ${renderInnovationHubIndex()}
      ${renderBioLabPlaceholderPages()}
    </div>
  </details>
  <details class="showroom-archive showroom-archive--catalogue" id="fsd-strategic-concepts">
    <summary>DISCOVER THE TWELVE FSD STRATEGIC CONCEPTS</summary>
    <div class="showroom-archive-content">
      ${renderStrategicConceptIndex()}
      ${renderStrategicConceptDetail('civic-response-auxiliary')}
      ${renderStrategicConceptDetail('tactical-shield-membership')}
    </div>
  </details>
  <details class="showroom-archive showroom-archive--catalogue" id="catalogue-archive">
    <summary>BROWSE THE FULL CATALOGUE</summary>
    ${catalogueSection()}
  </details>
  <div id="prelaunch-signup" data-prelaunch-signup-slot></div>
  ${renderSiteFooter({ storyLinkMarkup: storyFooterLink, homeHref: '#home' })}
  <dialog id="product-dialog" aria-labelledby="product-title"><button id="close-dialog" aria-label="Close product details">✕</button><div id="dialog-body"></div></dialog>`;
}

function showCatalogueDestination(state = {}) {
  return navigateCatalogue(state);
}

function scrollBehavior() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

export function navigateFsdSelection(selection, onRouteChange = () => {}) {
  const { menu, group, item } = selection;

  if (item?.kind === 'draft-product') {
    onRouteChange(resolveFsdRoute(selection));
    window.location.assign(item.href);
    return;
  }

  if (item?.record) {
    openProduct(item.record.id, onRouteChange);
    return;
  }

  if (menu?.id === 'collections'
    && (['clothing-line', 'clothing-lines', 'catalogue-collection'].includes(item?.kind)
      || (['clothing-lines', 'catalogue-collections'].includes(group?.id) && !item))) {
    const destination = item?.href || group?.href;
    const url = new URL(destination, window.location.origin);
    const validCollectionPath = url.origin === window.location.origin
      && seoEntryForPath(url.pathname)?.route?.view === 'collection';
    const validHash = url.origin === window.location.origin
      && url.pathname === '/'
      && (['#clothing-lines', '#technical-collections-archive'].includes(url.hash)
        || CATALOGUE_COLLECTIONS.some(collection => collection.kind === 'clothing-line'
          && `#line-${collection.id}` === url.hash)
        || CATALOGUE_COLLECTIONS.some(collection =>
          new URL(collection.href, window.location.origin).hash === url.hash));
    if (!validCollectionPath && !validHash) return;
    window.history.pushState(window.history.state || {}, '', url.href);
    if (validCollectionPath) {
      onRouteChange(resolveFsdRoute(selection));
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    return;
  }

  onRouteChange(resolveFsdRoute(selection));

  if (menu?.id === 'collections') {
    if (group?.id === 'shop-all-products' || item?.kind === 'shop-all') {
      showCatalogueDestination();
      return;
    }
    const hasShowcaseSource = Number.isInteger(item?.sourceGroupIndex ?? group?.sourceGroupIndex)
      && Boolean(item?.sourceDivisionId || group?.sourceDivisionId);
    if (!hasShowcaseSource && item?.kind === 'category') {
      showCatalogueDestination({
        category: item.source?.categories?.[0] || item.title,
        audience: item.source?.audiences?.[0] || 'All',
      });
      return;
    }
  }

  if (item?.kind === 'category' && menu?.id !== 'collections') {
    showCatalogueDestination({
      category: item.source?.categories?.[0] || item.title,
      audience: item.source?.audiences?.[0] || 'All',
    });
    return;
  }

  const destination = item?.href || group?.href;
  if (destination) {
    if (destination === '/fight-promotions.html'
      || destination === '/live-events.html'
      || destination === '/broadcast-ppv.html'
      || destination === '/athlete-development.html'
      || destination === '/academy-grassroots.html'
      || destination === '/fsd-pods.html'
      || destination === '/autonomous-popups.html'
      || destination === '/mobile-testing-labs.html'
      || destination === '/local-micro-manufacturing.html'
      || destination === '/genetic-microbiome.html'
      || destination === '/community-co-creation.html'
      || destination === '/performance-partnerships.html'
      || destination === '/circular-trade-in.html'
      || destination === '/community-first-aid.html'
      || destination === '/security-vision.html'
      || destination === '/enquiries.html'
      || destination === '/investor.html'
      || housePagePaths.has(destination)
      || destination === FSD_HOUSE_PAGE_PATH
      || destination.startsWith(`${FSD_HOUSE_PAGE_PATH}#`)) {
      window.location.assign(destination);
      return;
    }
    if ((flagshipPageHashes.has(destination) || resolveFsdRoute({ item: { href: destination } }).view === 'page')
      && typeof window !== 'undefined'
      && window.history?.pushState) {
      const url = new URL(window.location.href);
      if (url.hash !== destination) {
        url.hash = destination;
        window.history.pushState(window.history.state || {}, '', url);
      }
    }
    const target = document.querySelector(destination);
    for (let parent = target?.parentElement; parent; parent = parent.parentElement) {
      if (parent instanceof HTMLDetailsElement) parent.open = true;
    }
    target?.scrollIntoView({
      behavior: scrollBehavior(),
      block: 'start',
    });
    return;
  }

  const divisionId = item?.sourceDivisionId || group?.sourceDivisionId || menu?.divisionId;
  const opener = document.querySelector(`[data-division="${divisionId}"]`);
  if (!opener) return;
  opener.click();

  const dialog = document.querySelector('#fsd-showcase-dialog');
  if (!dialog) return;
  const groupIndex = item?.sourceGroupIndex ?? group?.sourceGroupIndex ?? 0;
  dialog.querySelector(`[data-group-index="${groupIndex}"]`)?.click();
  const subcategoryIndex = item?.sourceSubcategoryIndex ?? -1;
  if (subcategoryIndex >= 0) {
    requestAnimationFrame(() => dialog.querySelector(`[data-subcategory-index="${subcategoryIndex}"]`)?.click());
  }
}

function startMainExperience(clientBag, onRouteChange = () => {}) {
  initCatalogue({
    onProductSelect: (id, returnFocus, variant) => openProduct(id, onRouteChange, returnFocus, variant),
    onAddToBag: clientBag.addToBag,
  });
  const collectionShowcase = mountCollectionShowcase({
    root: document.querySelector('#collections'),
    divisions: collectionDivisions,
    products,
    onProductSelect: (id, returnFocus, variant) => openProduct(id, onRouteChange, returnFocus, variant),
    onExploreCollection(group) {
      onRouteChange({ view: 'collection', target: group.id });
      showCatalogueDestination({
        collection: ['mens-luxury-performance', 'womens-modest-combat'].includes(group.id) ? group.id : 'All',
        category: ['mens-luxury-performance', 'womens-modest-combat'].includes(group.id)
          ? 'All'
          : group.categories?.[0] || 'All',
        query: group.query || '',
      });
    },
  });
  initCatalogueNavigation();
  mountGarmentStudies();
  return collectionShowcase;
}

export function mountStorefrontRuntime({ onRouteChange = () => {} } = {}) {
  const clientBag = mountClientBag({ products });
  const collectionShowcase = startMainExperience(clientBag, onRouteChange);
  mountStorefrontMotion(document);

  if (import.meta.env.DEV) {
  import('./alight-development-integration.js')
    .then(({ createAlightDevelopmentIntegration }) => {
      const alight = createAlightDevelopmentIntegration();
      collectionShowcase.setDraftProductCard(alight.draftProductCard, alight.collectionCardPlacement);
    })
    .catch(error => {
      console.error('The private ALIGHT collection card could not be loaded.', error);
      throw error;
    });

  import('./motion-development-integration.js')
    .then(({ createMotionDevelopmentIntegration }) => {
      const motion = createMotionDevelopmentIntegration();
      collectionShowcase.setDraftProductCard(motion.collectionCard, motion.collectionCardPlacement);
    })
    .catch(error => {
      console.error('The private FSD MOTION collection card could not be loaded.', error);
      throw error;
    });

  import('./nexus-development-integration.js')
    .then(({ createNexusDevelopmentIntegration }) => {
      const nexus = createNexusDevelopmentIntegration();
      collectionShowcase.setDraftProductCard(nexus.collectionCard, nexus.collectionCardPlacement);
    })
    .catch(error => {
      console.error('The private FSD NEXUS concept card could not be loaded.', error);
      throw error;
    });

  import('./aeroforge-development-integration.js')
    .then(({ createAeroForgeDevelopmentIntegration }) => {
      const aeroforge = createAeroForgeDevelopmentIntegration();
      for (const card of aeroforge.collectionCards) {
        collectionShowcase.setDraftProductCard(card.markup, card.placement);
      }
    })
    .catch(error => {
      console.error('The private AeroForge collection card could not be loaded.', error);
      throw error;
    });

  Promise.all([
    import('./modest-flow-development-integration.js'),
    import('./modest-flow-preview-ui/modest-flow-preview.js'),
  ])
    .then(([{ createModestFlowDevelopmentIntegration }, { mountModestFlowSelector }]) => {
      const modestFlow = createModestFlowDevelopmentIntegration();
      collectionShowcase.setDraftProductCard(modestFlow.collectionCard, modestFlow.collectionCardPlacement);
      mountModestFlowSelector({
        root: document.body,
        product: modestFlow.productData,
        setComponents: modestFlow.productData.setComponents,
        variants: modestFlow.variants,
      });
    })
    .catch(error => {
      console.error('The private FSD Modest Flow selector could not be loaded.', error);
      throw error;
    });

  }

  return collectionShowcase;
}
