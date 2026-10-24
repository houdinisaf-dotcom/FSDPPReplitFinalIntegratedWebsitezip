import { catalogueSection, initCatalogue, navigateCatalogue, showProduct } from './catalogue.js';
import { products } from './catalogue-data.js';
import { collectionDivisions } from './collection-divisions.js';
import { renderCollectionShowcase, mountCollectionShowcase } from './collection-showcase/index.js';
import { featuredInnovationsSection, vipAccessSection, initCatalogueNavigation } from './showroom-sections.js';
import { renderNavigationHeader } from './site-navigation.js';
import { ourStorySection } from './story-section.js';
import { mountClientBag } from './bag.js';
import { FSD_STORY_HASH, FSD_STORY_PATH, resolveFsdRoute } from './react-router.js';
import { flagshipPageHashes, renderFlagshipPlaceholderPages, renderInnovationHubIndex } from './flagship-pages.js';
import approvedFsdHeaderLogo from '../brand-review/shield-refined-matte/assets/website-shield-lockup-defence.png';
import { velocityHijabPreviewPath } from './velocity-hijab-preview-path.js';
import { aegisGiletPreviewPath } from './aegis-gilet-preview-path.js';
import './style.css';
import './catalogue.css';
import './collection-showcase/collection-showcase.css';
import './showroom.css';
import './story-section.css';
import './site-navigation.css';
import './visual-system.css';
import './flagship-pages.css';
import './bag.css';
import './boxing-glove-cursor.css';

export function renderStorefrontHeader() {
  const currentBrandMarkup = `<img class="fsd-brand-logo" src="${approvedFsdHeaderLogo}" alt="" aria-hidden="true"/>`;
  return renderNavigationHeader(currentBrandMarkup);
}

function openProduct(id, onRouteChange = () => {}) {
  if (import.meta.env.DEV && Number(id) === 43) {
    onRouteChange({ view: 'preview', target: velocityHijabPreviewPath });
    window.location.assign(velocityHijabPreviewPath);
    return;
  }
  if (import.meta.env.DEV && Number(id) === 46) {
    onRouteChange({ view: 'preview', target: aegisGiletPreviewPath });
    window.location.assign(aegisGiletPreviewPath);
    return;
  }
  onRouteChange({ view: 'product', target: String(id) });
  showProduct(id);
}

function hardwareEditorialSection() {
  return `<section class="showroom-engineering" id="hardware-editorial" aria-labelledby="hardware-editorial-title">
    <div class="showroom-engineering-copy">
      <p class="section-kicker">FSD HARDWARE <span class="period">/</span> COMBAT SYSTEMS</p>
      <h2 id="hardware-editorial-title">ENGINEERED FOR<br/>THE DEMANDS OF<br/><span>PERFORMANCE.</span></h2>
       <p>Equipment that earns its place in your training.</p>
      <ol class="showroom-engineering-list">
        <li><span>01</span> Strength equipment · dumbbell collections</li>
        <li><span>02</span> Boxing and combat equipment</li>
        <li><span>03</span> Training accessories · weighted skipping ropes</li>
        <li><span>04</span> Recovery equipment</li>
      </ol>
      <button class="showroom-engineering-link" type="button" data-open-hardware>EXPLORE HARDWARE <span aria-hidden="true">↗</span></button>
    </div>
    <figure class="showroom-engineering-media">
      <img src="/fsd-assets/8ffe2fd45a06.webp" alt="FSD athlete in modest combat training apparel, pictured during a boxing session." loading="lazy" fetchpriority="low" width="1050" height="960"/>
      <figcaption><span>FSD COMBAT / TRAINING CAMPAIGN</span><span>APPAREL & MOVEMENT</span></figcaption>
    </figure>
  </section>`;
}

export function renderStorefrontMarkup() {
  return `<main id="home">
  <section class="fsd-home-hero" aria-labelledby="fsd-home-title">
    <div class="fsd-home-hero__image" data-fsd-parallax aria-hidden="true"></div>
    <div class="fsd-home-hero__shade" aria-hidden="true"></div>
    <div class="fsd-home-hero__content">
      <p class="fsd-home-kicker"><span></span> PERFORMANCE / DISCIPLINE / IDENTITY</p>
      <h1 id="fsd-home-title">Made to Move,<br/><em>Made to Belong.</em></h1>
      <p class="fsd-home-intro">Fitness &amp; Self-Defence.<br/>A house for those who train with purpose.</p>
      <div class="fsd-home-actions">
        <a class="fsd-home-primary" href="#universe">Explore the collections <span aria-hidden="true">↗</span></a>
        <a class="fsd-home-secondary" href="#products">Browse the catalogue</a>
      </div>
      <p class="fsd-home-signoff">FSD <span>/</span> FITNESS &amp; SELF-DEFENCE</p>
    </div>
    <p class="fsd-home-caption">MADE TO MOVE <span>—</span> MADE TO BELONG</p>
  </section>
  <div id="collections">
    ${renderCollectionShowcase(collectionDivisions, { editorial: true })}
    <details class="showroom-archive showroom-archive--catalogue" id="catalogue-archive">
      <summary>BROWSE THE FULL CATALOGUE</summary>${catalogueSection()}
    </details>
  </div>
  <section class="fsd-editorial-divider" aria-label="FSD design philosophy">
    <p>THE REFINEMENT OF LUXURY FASHION. THE ENERGY OF ELITE SPORT. THE PRECISION OF PERFORMANCE ENGINEERING. THE INNOVATION OF MODERN TECHNOLOGY.</p>
  </section>
  ${hardwareEditorialSection()}
  <details class="showroom-archive showroom-archive--discover" id="fsd-house-archive">
    <summary>DISCOVER THE FSD HOUSE</summary>
    <div class="showroom-archive-content">
      ${featuredInnovationsSection()}
      ${ourStorySection()}
      ${renderInnovationHubIndex({ includePrivatePreviews: import.meta.env.DEV })}
      ${renderFlagshipPlaceholderPages()}
      ${import.meta.env.DEV ? '<div data-dev-review-slot></div>' : ''}
      ${vipAccessSection()}
    </div>
  </details>
  </main>
  <footer><div class="footer-brand"><img class="fsd-brand-logo" src="${approvedFsdHeaderLogo}" alt="FSD Fitness & Self-Defence" loading="lazy" decoding="async"/></div>
    <div><p>STRENGTH / DISCIPLINE / CONFIDENCE</p><span>© ${new Date().getFullYear()} FSD. Website prototype.</span>
      <nav class="footer-links" aria-label="Footer navigation"><a href="#universe">FSD COLLECTIONS</a><a href="#products">BROWSE CATALOGUE</a>
      <a href="#contact">VIP ACCESS</a></nav>
      <nav class="footer-links" aria-label="Corporate navigation"><a href="${FSD_STORY_PATH}">THE HOUSE / OUR STORY</a><a href="#fsd-division-global">FSD GLOBAL</a></nav>
      <div id="fsd-react-footer-utilities"></div>
      <small class="footer-pending">Investor information and legal pages require approved content before launch.</small></div>
    <a href="#home">BACK TO TOP ↑</a></footer>
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
    if (destination.replace(/\/+$/, '') === FSD_STORY_PATH) {
      const storyUrl = new URL(FSD_STORY_PATH, window.location.origin);
      if (window.location.pathname.replace(/\/+$/, '') !== FSD_STORY_PATH || window.location.hash) {
        window.history.pushState(window.history.state || {}, '', storyUrl);
      }
      const storyTarget = document.querySelector(FSD_STORY_HASH);
      for (let parent = storyTarget?.parentElement; parent; parent = parent.parentElement) {
        if (parent instanceof HTMLDetailsElement) parent.open = true;
      }
      storyTarget?.scrollIntoView({
        behavior: scrollBehavior(),
        block: 'start',
      });
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
    onProductSelect: id => openProduct(id, onRouteChange),
    onAddToBag: clientBag.addToBag,
  });
  const collectionShowcase = mountCollectionShowcase({
    root: document.querySelector('#collections'),
    divisions: collectionDivisions,
    products,
    onProductSelect: id => openProduct(id, onRouteChange),
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
  document.querySelector('[data-open-hardware]')?.addEventListener('click', () => {
    onRouteChange({ view: 'hardware', target: 'hardware' });
    document.querySelector('#fsd-division-hardware')?.click();
  });
  return collectionShowcase;
}

export function mountStorefrontRuntime({ onRouteChange = () => {} } = {}) {
  const clientBag = mountClientBag({ products });
  const collectionShowcase = startMainExperience(clientBag, onRouteChange);

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
      collectionShowcase.setDraftProductCard(aeroforge.collectionCard, aeroforge.collectionCardPlacement);
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
        variants: modestFlow.variants,
      });
    })
    .catch(error => {
      console.error('The private FSD Modest Flow selector could not be loaded.', error);
      throw error;
    });

  Promise.all([
    import('./breeze-development-integration.js'),
    import('./breeze-preview-ui/breeze-preview.js'),
  ])
    .then(([{ createBreezeDevelopmentIntegration }, { mountBreezePreview }]) => {
      const breeze = createBreezeDevelopmentIntegration();
      collectionShowcase.setDraftProductCard(breeze.collectionCard, breeze.collectionCardPlacement);
      mountBreezePreview({
        root: document.body,
        product: breeze.productData,
        variants: breeze.variants,
      });
    })
    .catch(error => {
      console.error('The private FSD Breeze selector could not be loaded.', error);
      throw error;
    });
  }

  return collectionShowcase;
}
