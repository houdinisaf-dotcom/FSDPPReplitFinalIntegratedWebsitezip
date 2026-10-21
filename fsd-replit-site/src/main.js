import { catalogueSection, initCatalogue, showProduct } from './catalogue.js';
import { gallerySection, galleryProducts } from './gallery.js';
import { products } from './catalogue-data.js';
import { collectionDivisions } from './collection-divisions.js';
import { renderCollectionShowcase, mountCollectionShowcase } from './collection-showcase/index.js';
import { featuredInnovationsSection, vipAccessSection, initFeaturedCarousel, initArchiveNavigation } from './showroom-sections.js';
import { renderNavigationHeader, mountNavigation } from './site-navigation.js';
import './style.css';
import './catalogue.css';
import './collection-showcase/collection-showcase.css';
import './showroom.css';
import './site-navigation.css';

function icon() {
  return `<svg viewBox="0 0 100 100" fill="none" aria-hidden="true"><path d="M50 6 85 20 80 62 50 91 20 62 15 20Z" stroke="currentColor" stroke-width="5"/><path d="M20 65 68 20 51 56 83 38 36 81 49 48Z" fill="currentColor"/></svg>`;
}

function header() {
  const currentBrandMarkup = `<span class="brand-icon">${icon()}</span><span class="brand-type"><strong>FSD</strong><small>FITNESS & SELF DEFENCE</small></span>`;
  return renderNavigationHeader(currentBrandMarkup);
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
  ${featuredInnovationsSection()}
  <section class="manifesto" id="philosophy"><p class="section-kicker">THE FSD PHILOSOPHY</p>
    <h2>FITNESS. DISCIPLINE.<br/><span>PROGRESS. A STRONGER YOU.</span></h2>
    <p>From the training floor to everyday life, FSD brings a premium design language to performance, self-defence and inclusive movement.
    Our product portfolio is taking shape for its next launch.</p>
    <div class="values"><span>01 / STRENGTH</span><span>02 / DISCIPLINE</span><span>03 / CONFIDENCE</span></div>
  </section>
  ${vipAccessSection()}
  </main>
  <footer><div class="footer-brand"><span class="brand-icon">${icon()}</span><strong>FSD</strong><small>FITNESS & SELF DEFENCE</small></div>
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

initCatalogue();
mountCollectionShowcase({
  root: document.querySelector('#collections'),
  divisions: collectionDivisions,
  products,
  onProductSelect: showProduct,
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
  onNavigate({ menu, group, item }) {
    if (item?.record) {
      showProduct(item.record.id);
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
