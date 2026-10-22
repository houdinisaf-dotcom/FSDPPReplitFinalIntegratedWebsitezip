import { catalogueSection, initCatalogue, navigateCatalogue, showProduct } from './catalogue.js';
import { products } from './catalogue-data.js';
import { collectionDivisions } from './collection-divisions.js';
import { renderCollectionShowcase, mountCollectionShowcase } from './collection-showcase/index.js';
import { featuredInnovationsSection, vipAccessSection, initFeaturedCarousel, initCatalogueNavigation } from './showroom-sections.js';
import { renderNavigationHeader, mountNavigation } from './site-navigation.js';
import { ourStorySection } from './story-section.js';
import approvedFsdHeaderLogo from '../brand-review/shield-refined-matte/assets/website-shield-lockup-defence.png';
import { velocityHijabPreviewPath } from './velocity-hijab-preview-path.js';
import { aegisGiletPreviewPath } from './aegis-gilet-preview-path.js';
import './style.css';
import './catalogue.css';
import './collection-showcase/collection-showcase.css';
import './showroom.css';
import './story-section.css';
import './site-navigation.css';

function header() {
  const currentBrandMarkup = `<img class="fsd-brand-logo" src="${approvedFsdHeaderLogo}" alt="" aria-hidden="true"/>`;
  return renderNavigationHeader(currentBrandMarkup);
}

function openProduct(id) {
  if (import.meta.env.DEV && Number(id) === 43) {
    window.location.assign(velocityHijabPreviewPath);
    return;
  }
  if (import.meta.env.DEV && Number(id) === 46) {
    window.location.assign(aegisGiletPreviewPath);
    return;
  }
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
        <li><span>04</span> Recovery equipment concepts</li>
      </ol>
      <button class="showroom-engineering-link" type="button" data-open-hardware>EXPLORE HARDWARE <span aria-hidden="true">↗</span></button>
    </div>
    <figure class="showroom-engineering-media">
      <img src="/fsd-assets/8ffe2fd45a06.webp" alt="FSD athlete in modest combat training apparel, pictured during a boxing session." loading="eager" fetchpriority="low" width="1024" height="1024"/>
      <figcaption><span>FSD COMBAT / TRAINING CAMPAIGN</span><span>APPAREL & MOVEMENT</span></figcaption>
    </figure>
  </section>`;
}

function shellCampaignEditorialSection() {
  return `<section class="showroom-shell-campaign" id="shell-campaign" aria-labelledby="shell-campaign-title">
    <figure class="showroom-shell-campaign-media">
      <img src="/__catalogue-preview/hooded-running-shell/media/hooded-shell-campaign" alt="Woman wearing the orange FSD Hooded Running Shell outdoors in a mountain landscape." loading="eager" fetchpriority="low" width="1672" height="941"/>
    </figure>
    <div class="showroom-shell-campaign-copy">
      <p class="section-kicker">APPAREL CAMPAIGN <span class="period">/</span> OUTERWEAR</p>
      <h2 id="shell-campaign-title">FSD Hooded<br/>Running Shell</h2>
      <p>A campaign image of the FSD Hooded Running Shell, presented in the FSD performance setting.</p>
      <a class="showroom-shell-campaign-link" href="/__catalogue-preview/hooded-running-shell/">VIEW CAMPAIGN <span aria-hidden="true">↗</span></a>
    </div>
  </section>`;
}

document.querySelector('#app').innerHTML = `${header()}<main id="home">
  <section class="hero"><div class="hero-image"></div><div class="hero-shade"></div><div class="hero-content">
    <p class="eyebrow">THE FSD PERFORMANCE UNIVERSE <span class="gold-line"></span> EST. UNITED KINGDOM</p>
    <h1>BUILT FOR<br/><em>THE DRIVE</em><br/>WITHIN.</h1>
    <p class="hero-copy">Performance. Discipline. Identity. Discover technical training wear, combat-inspired design and modest activewear under one unmistakable shield.</p>
    <div class="hero-actions"><a class="primary-btn" href="#products">SHOP ALL PRODUCTS <span>↗</span></a>
    <a class="ghost-btn" href="#universe">DISCOVER THE FSD UNIVERSE →</a></div>
    <div class="hero-foot"><span>01 / 03</span><span>DESIGNED TO MOVE. BUILT TO BELONG.</span></div></div>
    <div class="vertical-label">FITNESS & SELF DEFENCE — 2026</div>
  </section>
  <div id="collections">
    ${renderCollectionShowcase(collectionDivisions)}
    <div class="showroom-archives" id="planned">
      <details class="showroom-archive" id="catalogue-archive"><summary>SHOP / ALL PRODUCTS · ${products.length} RECORDS</summary>${catalogueSection()}</details>
    </div>
  </div>
  ${hardwareEditorialSection()}
  ${import.meta.env.DEV ? shellCampaignEditorialSection() : ''}
  ${featuredInnovationsSection()}
  ${ourStorySection()}
  ${vipAccessSection()}
  </main>
  <footer><div class="footer-brand"><img class="fsd-brand-logo" src="${approvedFsdHeaderLogo}" alt="FSD Fitness & Self-Defence"/></div>
    <div><p>STRENGTH / DISCIPLINE / CONFIDENCE</p><span>© ${new Date().getFullYear()} FSD. Website prototype.</span>
      <nav class="footer-links" aria-label="Footer navigation"><a href="#universe">FSD UNIVERSE</a><a href="#products">SHOP / ALL PRODUCTS</a>
      <a href="#contact">VIP ACCESS</a></nav>
      <nav class="footer-links" aria-label="Corporate navigation"><a href="#philosophy">THE HOUSE / OUR STORY</a><a href="#fsd-division-global">FSD GLOBAL</a></nav>
      <small class="footer-pending">Investor information and legal pages require approved content before launch.</small></div>
    <a href="#home">BACK TO TOP ↑</a></footer>
  <dialog id="product-dialog" aria-labelledby="product-title"><button id="close-dialog" aria-label="Close product details">✕</button><div id="dialog-body"></div></dialog>`;

function showCatalogueDestination(state = {}) {
  return navigateCatalogue(state);
}

function startMainExperience() {
  initCatalogue({ onProductSelect: openProduct });
  const collectionShowcase = mountCollectionShowcase({
    root: document.querySelector('#collections'),
    divisions: collectionDivisions,
    products,
    onProductSelect: openProduct,
    onExploreCollection(group) {
      showCatalogueDestination({
        collection: ['mens-luxury-performance', 'womens-modest-combat'].includes(group.id) ? group.id : 'All',
        category: ['mens-luxury-performance', 'womens-modest-combat'].includes(group.id)
          ? 'All'
          : group.categories?.[0] || 'All',
        query: group.query || '',
      });
    },
  });
  mountNavigation({
    root: document.querySelector('[data-navigation-shell]'),
    divisions: collectionDivisions,
    products,
    includeDraftPreviews: import.meta.env.DEV,
    onNavigate({ menu, group, item }) {
      if (item?.kind === 'draft-product') {
        window.location.assign(item.href);
        return;
      }

      if (item?.record) {
        openProduct(item.record.id);
        return;
      }

      if (menu?.id === 'collections') {
        const shopCollection = ['mens-luxury-performance', 'womens-modest-combat'].includes(group?.id)
          ? group.id
          : 'All';
        if (group?.id === 'shop-all-products' || item?.kind === 'shop-all') {
          showCatalogueDestination();
          return;
        }
        if (shopCollection !== 'All') {
          if (!item) {
            showCatalogueDestination({ collection: shopCollection });
            return;
          }
          if (item.kind === 'subcategory' || item.kind === 'category') {
            showCatalogueDestination({
              collection: shopCollection,
              category: item.kind === 'category' ? item.source?.categories?.[0] || 'All' : 'All',
              audience: 'All',
              query: item.kind === 'subcategory' ? item.source?.productTerms?.[0] || '' : '',
            });
            return;
          }
        }
        if (item?.kind === 'category') {
          showCatalogueDestination({
            category: item.source?.categories?.[0] || item.title,
            audience: item.source?.audiences?.[0] || 'All',
          });
          return;
        }
      }

      if (item?.kind === 'category') {
        showCatalogueDestination({
          category: item.source?.categories?.[0] || item.title,
          audience: item.source?.audiences?.[0] || 'All',
        });
        return;
      }

      const destination = item?.href || group?.href;
      if (destination) {
        document.querySelector(destination)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    },
  });
  initFeaturedCarousel(document.querySelector('#innovations'));
  initCatalogueNavigation();
  document.querySelector('[data-open-hardware]')?.addEventListener('click', () => {
    document.querySelector('#fsd-division-hardware')?.click();
  });
  return collectionShowcase;
}

const collectionShowcase = startMainExperience();
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
