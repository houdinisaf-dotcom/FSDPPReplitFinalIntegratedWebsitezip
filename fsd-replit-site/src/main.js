import { catalogueSection, initCatalogue, showProduct } from './catalogue.js';
import { gallerySection, galleryProducts } from './gallery.js';
import { products } from './catalogue-data.js';
import { collectionDivisions } from './collection-divisions.js';
import { renderCollectionShowcase, mountCollectionShowcase } from './collection-showcase/index.js';
import { featuredInnovationsSection, vipAccessSection, initFeaturedCarousel, initArchiveNavigation } from './showroom-sections.js';
import { renderNavigationHeader, mountNavigation } from './site-navigation.js';
import approvedFsdHeaderLogo from '../brand-review/shield-refined-matte/assets/website-shield-lockup-refined.png';
import { velocityHijabPreviewPath } from './velocity-hijab-preview-path.js';
import { aegisGiletPreviewPath } from './aegis-gilet-preview-path.js';
import './style.css';
import './catalogue.css';
import './collection-showcase/collection-showcase.css';
import './showroom.css';
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
      <p>Equipment should earn its place in training. Where product photography is not approved, the reference stays clear — not an invented product.</p>
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
      <p class="section-kicker">PRIVATE CAMPAIGN REVIEW <span class="period">/</span> APPAREL</p>
      <h2 id="shell-campaign-title">FSD Hooded<br/>Running Shell</h2>
      <p>A private review of the supplied campaign image, presented in the same FSD editorial language. This is a campaign proof only; no product options or purchase flow are available.</p>
      <p class="showroom-shell-campaign-note">COLOUR SELECTION DEFERRED · PRICE AND SPECIFICATIONS NOT CONFIRMED · CHECKOUT DISABLED</p>
      <a class="showroom-shell-campaign-link" href="/__catalogue-preview/hooded-running-shell/">OPEN PRIVATE CAMPAIGN <span aria-hidden="true">↗</span></a>
    </div>
  </section>`;
}

document.querySelector('#app').innerHTML = `${header()}<main id="home">
  <section class="hero"><div class="hero-image"></div><div class="hero-shade"></div><div class="hero-content">
    <p class="eyebrow">THE FSD PERFORMANCE UNIVERSE <span class="gold-line"></span> EST. UNITED KINGDOM</p>
    <h1>BUILT FOR<br/><em>THE DRIVE</em><br/>WITHIN.</h1>
    <p class="hero-copy">Performance. Discipline. Identity. Discover technical training wear, combat-inspired design and modest activewear under one unmistakable shield.</p>
    <div class="hero-actions"><a class="primary-btn" href="#collections">EXPLORE THE COLLECTION <span>↗</span></a>
    <a class="ghost-btn" href="#philosophy">DISCOVER FSD →</a></div>
    <div class="hero-foot"><span>01 / 03</span><span>DESIGNED TO MOVE. BUILT TO BELONG.</span></div></div>
    <div class="vertical-label">FITNESS & SELF DEFENCE — 2026</div>
  </section>
  <div id="collections">
    ${renderCollectionShowcase(collectionDivisions)}
    <div class="showroom-archives" id="planned">
      <details class="showroom-archive" id="catalogue-archive"><summary>FULL PRODUCT CATALOGUE · ${products.length} RECORDS</summary>${catalogueSection()}</details>
      <details class="showroom-archive" id="gallery-archive"><summary>DESIGN REFERENCE LIBRARY · ${galleryProducts.length} IMAGES</summary>${gallerySection()}</details>
    </div>
  </div>
  ${hardwareEditorialSection()}
  ${import.meta.env.DEV ? shellCampaignEditorialSection() : ''}
  ${featuredInnovationsSection()}
  <section class="manifesto" id="philosophy"><p class="section-kicker">THE FSD PHILOSOPHY</p>
    <h2>FITNESS. DISCIPLINE.<br/><span>PROGRESS. A STRONGER YOU.</span></h2>
    <p>From the training floor to everyday life, FSD brings a premium design language to performance, self-defence and inclusive movement.
    Our product portfolio is taking shape for its next launch.</p>
    <div class="values"><span>01 / STRENGTH</span><span>02 / DISCIPLINE</span><span>03 / CONFIDENCE</span></div>
  </section>
  ${vipAccessSection()}
  </main>
  <footer><div class="footer-brand"><img class="fsd-brand-logo" src="${approvedFsdHeaderLogo}" alt="FSD Fitness & Self-Defense"/></div>
    <div><p>STRENGTH / DISCIPLINE / CONFIDENCE</p><span>© ${new Date().getFullYear()} FSD. Pre-launch website prototype.</span>
      <nav class="footer-links" aria-label="Footer navigation"><a href="#collections">FOUR DIVISIONS</a><a href="#products">PRODUCT CATALOGUE</a>
      <a href="#full-gallery">DESIGN LIBRARY</a><a href="#contact">VIP ACCESS</a></nav>
      <nav class="footer-links" aria-label="Corporate navigation"><a href="#philosophy">FSD STORY</a><a href="#fsd-division-global">PROPOSED FLAGSHIPS & PROMOTIONS</a></nav>
      <small class="footer-pending">Investor information and legal pages require approved content before launch.</small></div>
    <a href="#home">BACK TO TOP ↑</a></footer>
  <dialog id="product-dialog" aria-labelledby="product-title"><button id="close-dialog" aria-label="Close product details">✕</button><div id="dialog-body"></div></dialog>`;

function showCatalogueDestination({ category = 'All', query = '' } = {}) {
  const archive = document.querySelector('#catalogue-archive');
  const select = document.querySelector('#catalogue-category');
  const search = document.querySelector('#search');
  const productSection = document.querySelector('#products');
  if (!archive || !select || !search || !productSection) return false;
  if (category !== 'All' && ![...select.options].some(option => option.value === category)) return false;

  archive.open = true;
  select.value = category;
  search.value = query;
  select.dispatchEvent(new Event('change', { bubbles: true }));
  search.dispatchEvent(new Event('input', { bubbles: true }));
  productSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const count = document.querySelector('#catalogue-count');
  count?.setAttribute('tabindex', '-1');
  count?.focus({ preventScroll: true });
  return true;
}

initCatalogue({ onProductSelect: openProduct });
mountCollectionShowcase({
  root: document.querySelector('#collections'),
  divisions: collectionDivisions,
  products,
  onProductSelect: openProduct,
  onExploreCollection(group) {
    showCatalogueDestination({
      category: group.categories?.[0] || 'All',
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

    if (item?.kind === 'category') {
      showCatalogueDestination({ category: item.source?.categories?.[0] || item.title });
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
initArchiveNavigation();
document.querySelector('[data-open-hardware]')?.addEventListener('click', () => {
  document.querySelector('#fsd-division-hardware')?.click();
});
document.querySelector('#gallery-search').addEventListener('input', event => {
  const query = event.target.value.toLowerCase().trim();
  let count = 0;
  document.querySelectorAll('[data-gallery-name]').forEach(element => {
    const matches = element.dataset.galleryName.includes(query);
    element.hidden = !matches;
    if (matches) count++;
  });
  document.querySelector('#gallery-count').textContent = `${count} designs`;
});
