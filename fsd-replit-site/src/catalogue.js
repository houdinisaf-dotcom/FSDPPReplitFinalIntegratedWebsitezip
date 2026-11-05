import { audiences, categories, customerFacingCategory, getVerifiedProductSpecifications, products, filterProducts, isHardwareVisualPreviewProduct, priceInfo, safe, shopCollections } from './catalogue-data.js';
import { CLOTHING_LINES } from './clothing-lines.js';
import { catalogueRelationshipFor } from './data/catalogue-relationships.js';
import { canAddToBag } from './bag.js';
import { crossfadeMappedImage, cancelMappedImageSwap } from './catalogue-image-gallery.js';
import { mountImmersiveProductGallery } from './immersive-product-gallery.js';
import { imageColourwayIndex, normaliseGalleryColourway } from './product-gallery-model.js';
import { outlineIcon } from './brand/outline-icons.js';
import { trackEvent } from './analytics.js';
import { aegisGiletPreviewPath } from './aegis-gilet-preview-path.js';
import { productSizeOptions, renderProductDetailPage, renderSizeGuideDialog } from './product-detail-page.js';
import { animateAddButton, animateElement, animateWishlistHeart, setStickyAddBarVisible } from './motion-runtime.js';
import { FSD_MOTION } from './motion-config.js';
import { productImagesForDisplay } from './data/products.js';
import {
  GARMENT_CATEGORY_DEFINITIONS,
  garmentCategoryOptions,
} from './data/garment-category-map.js';
import {
  productCardColourwaysMarkup,
  productCardImageMarkup,
  productColourwayImageIndex,
} from './product-card-media.js';

const productBelongsToLine = (product, lineId) =>
  catalogueRelationshipFor(product)?.clothingLineIds.includes(lineId) ?? false;
const productHasGarmentCategory = (product, categoryId) =>
  catalogueRelationshipFor(product)?.garmentCategoryIds.includes(categoryId) ?? false;

const pageSize = 12;
let activeCategory = 'All';
let activeAudience = 'All';
let activeCollection = 'All';
let activeLine = 'All';
let activeGarmentCategory = 'all';
let query = '';
let sort = 'featured';
let view = 'visual';
let page = 1;
let activeDialogProduct = null;
let activeDialogImages = [];
let activeDialogVariant = { size: '', colourway: '' };
let dialogReturnFocus = null;
let dialogReturnFocusIsExplicit = false;
let productStickyObserver = null;
let sizeGuideReturnFocus = null;
let searchEditing = false;
let searchCommitTimer = null;
let catalogueResultsRenderer = null;
let catalogueRowActions = {
  onProductSelect: showProduct,
  onAddToBag: () => {},
};

const sortOptions = [
  ['featured', 'Featured'],
  ['name-asc', 'Name A–Z'],
  ['price-asc', 'Price: low to high'],
  ['price-desc', 'Price: high to low'],
];
const viewOptions = ['visual'];
const isBrowser = () => typeof window !== 'undefined' && Boolean(window.history && window.location);
const scrollBehavior = () => typeof window === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  ? 'auto'
  : 'smooth';

function currentState() {
  return {
    category: activeCategory,
    audience: activeAudience,
    collection: activeCollection,
    line: activeLine,
    garmentCategory: activeGarmentCategory,
    query,
    sort,
    view,
    page,
  };
}

export function readStateFromURL() {
  if (!isBrowser()) return currentState();
  const params = new URLSearchParams(window.location.search);
  const requestedCategory = params.get('category');
  const requestedAudience = params.get('audience');
  const requestedCollection = params.get('collection');
  const requestedLine = params.get('line');
  const requestedGarmentCategory = params.get('garment');
  const requestedSort = params.get('sort');
  const requestedView = params.get('view');
  return {
    category: categories.includes(requestedCategory) ? requestedCategory : 'All',
    audience: audiences.includes(requestedAudience) ? requestedAudience : 'All',
    collection: shopCollections.some(item => item.id === requestedCollection) ? requestedCollection : 'All',
    line: CLOTHING_LINES.some(item => item.id === requestedLine) ? requestedLine : 'All',
    garmentCategory: requestedGarmentCategory === 'all'
      || GARMENT_CATEGORY_DEFINITIONS.some(category => category.id === requestedGarmentCategory)
      ? requestedGarmentCategory
      : 'all',
    query: params.get('q') || '',
    sort: sortOptions.some(([value]) => value === requestedSort) ? requestedSort : 'featured',
    view: viewOptions.includes(requestedView) ? requestedView : 'visual',
    page: Math.max(1, Number.parseInt(params.get('page') || '1', 10) || 1),
    productId: Number.parseInt(params.get('product') || '', 10) || null,
  };
}

function applyState(state) {
  activeCategory = state.category;
  activeAudience = state.audience;
  activeCollection = state.collection;
  activeLine = state.line || 'All';
  activeGarmentCategory = state.garmentCategory || 'all';
  query = state.query;
  sort = state.sort;
  view = state.view;
  page = state.page;
}

function updateControls() {
  const lineControl = document.querySelector('#catalogue-line');
  if (lineControl) {
    const lineScope = filterProducts(activeCategory, '', activeAudience, activeCollection);
    const availableLines = CLOTHING_LINES.filter(line =>
      lineScope.some(product => productBelongsToLine(product, line.id)));
    const availableLineIds = new Set(availableLines.map(line => line.id));
    const visibleLines = CLOTHING_LINES.filter(line =>
      availableLineIds.has(line.id) || line.id === activeLine);
    const options = [
      '<option value="All">All clothing lines</option>',
      ...visibleLines.map(line => `<option value="${safe(line.id)}">${safe(line.title)}${availableLineIds.has(line.id) ? '' : ' — The Collection is currently being curated.'}</option>`),
    ].join('');
    if (lineControl.innerHTML !== options) lineControl.innerHTML = options;
    lineControl.value = activeLine;
  }
  const controls = [
    ['#catalogue-category', activeCategory],
    ['#catalogue-audience', activeAudience],
    ['#catalogue-collection', activeCollection],
    ['#catalogue-line', activeLine],
    ['#search', query],
    ['#catalogue-sort', sort],
  ];
  for (const [selector, value] of controls) {
    const control = document.querySelector(selector);
    if (control && control.value !== value) control.value = value;
  }
  const grid = document.querySelector('#catalogue-grid');
  if (grid) {
    grid.dataset ||= {};
    grid.dataset.view = view;
  }
  document.querySelectorAll?.('[data-catalogue-view]')?.forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.catalogueView === view));
  });
  const heading = document.querySelector('#products .section-heading h2');
  if (heading) {
    const title = activeAudience === 'Women’s' ? 'SHOP / WOMEN’S'
      : activeAudience === 'Men’s' ? 'SHOP / MEN’S'
        : activeAudience === 'Unisex' ? 'SHOP / UNISEX'
          : 'SHOP / ALL PRODUCTS';
    heading.innerHTML = `${title}<span class="period">.</span>`;
  }
}

function writeStateToURL({ mode = 'replace', productId = null } = {}) {
  if (!isBrowser()) return;
  const url = new URL(window.location.href);
  const params = url.searchParams;
  const values = [
    ['category', activeCategory, 'All'],
    ['audience', activeAudience, 'All'],
    ['collection', activeCollection, 'All'],
    ['line', activeLine, 'All'],
    ['garment', activeGarmentCategory, 'all'],
    ['q', query, ''],
    ['sort', sort, 'featured'],
    ['view', view, 'visual'],
    ['page', String(page), '1'],
  ];
  for (const [key, value, defaultValue] of values) {
    if (value === defaultValue) params.delete(key);
    else params.set(key, value);
  }
  if (productId) params.set('product', String(productId));
  else params.delete('product');
  url.hash = 'products';
  const historyState = {
    ...(window.history.state || {}),
    fsdShop: { ...currentState(), productId, scrollY: window.scrollY || 0 },
  };
  window.history[mode === 'push' ? 'pushState' : 'replaceState'](historyState, '', url);
}

function openShopArchive() {
  const archive = document.querySelector('#catalogue-archive');
  if (archive) archive.open = true;
}

function focusResultCount() {
  const count = document.querySelector('#catalogue-count');
  count?.setAttribute('tabindex', '-1');
  count?.focus({ preventScroll: true });
}

function sortedProducts(filtered) {
  const list = [...filtered];
  if (sort === 'name-asc') {
    list.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === 'price-asc' || sort === 'price-desc') {
    const direction = sort === 'price-asc' ? 1 : -1;
    list.sort((a, b) => {
      const aPrice = a.confirmedPrice;
      const bPrice = b.confirmedPrice;
      if (aPrice === null && bPrice === null) return a.id - b.id;
      if (aPrice === null) return 1;
      if (bPrice === null) return -1;
      return (aPrice - bPrice) * direction;
    });
  }
  return list;
}

function activeFilterMarkup() {
  const chips = [];
  if (activeCollection !== 'All') {
    const collection = shopCollections.find(item => item.id === activeCollection);
    chips.push(['collection', activeCollection, collection?.label || activeCollection]);
  }
  if (activeLine !== 'All') {
    const line = CLOTHING_LINES.find(item => item.id === activeLine);
    chips.push(['line', activeLine, line?.title || activeLine]);
  }
  if (activeGarmentCategory !== 'all') {
    const category = GARMENT_CATEGORY_DEFINITIONS.find(item => item.id === activeGarmentCategory);
    chips.push(['garment', activeGarmentCategory, category?.label || activeGarmentCategory]);
  }
  if (activeCategory !== 'All') chips.push(['category', activeCategory, customerFacingCategory(activeCategory)]);
  if (activeAudience !== 'All') chips.push(['audience', activeAudience, activeAudience]);
  if (query.trim()) chips.push(['q', query, `Search: ${query}`]);
  const hasOtherState = sort !== 'featured';
  const wrapper = document.querySelector('#catalogue-active-filters');
  if (!wrapper) return;
  wrapper.innerHTML = chips.length || hasOtherState
    ? `<div class="catalogue-chip-list" aria-label="Active filters">
        ${chips.map(([key, value, label]) => `<button type="button" class="catalogue-chip" data-remove-filter="${safe(key)}" data-filter-value="${safe(value)}">
          ${safe(label)} ${outlineIcon('close', 'fsd-icon catalogue-chip__remove-icon')}<span class="sr-only">Remove filter</span>
        </button>`).join('')}
        ${hasOtherState ? `<span class="catalogue-view-state">SORT: ${safe(sortOptions.find(([value]) => value === sort)?.[1] || sort)}</span>` : ''}
        <button type="button" class="catalogue-clear-all" data-clear-filters>Clear all</button>
      </div>`
    : '';
}

function imagePlaceholder(product, failed = false) {
  return `<div class="catalogue-placeholder" role="note">
    <strong>${safe(product.name)}</strong>
    <small>${safe(customerFacingCategory(product.category))}</small>
    ${failed ? '<small>Image unavailable</small>' : ''}
  </div>`;
}

function displayPrice(product) {
  if (isHardwareVisualPreviewProduct(product) || isAegisPrivateProof(product)) {
    return { label: '', value: '' };
  }
  const price = priceInfo(product);
  return /reference only|not for sale/i.test(price.label || '')
    ? { label: '', value: '' }
    : price;
}

function isAegisPrivateProof(product) {
  return typeof import.meta.env !== 'undefined'
    && import.meta.env.DEV
    && Number(product?.id) === 46;
}

function canShowBagAction(product) {
  return !isAegisPrivateProof(product) && canAddToBag(product);
}

function productColourwayOptions(product) {
  if (Array.isArray(product.rowColourways)) {
    return product.rowColourways.map(option => String(option).trim()).filter(Boolean);
  }
  return typeof product.colourways === 'string'
    ? product.colourways.split(/\s*;\s*/).map(option => option.trim()).filter(Boolean)
    : [];
}

function verifiedSpecificationRows(product) {
  const specifications = getVerifiedProductSpecifications(product.id);
  if (!specifications) return [];
  const technicalLabels = {
    composition: 'Composition',
    fabricWeight: 'Fabric weight',
    fit: 'Fit and coverage',
    care: 'Care instructions',
  };
  return [
    ...(specifications.materials.length
      ? [['Materials and construction', specifications.materials.join(' ')]]
      : []),
    ...(specifications.benefits.length
      ? [['Performance features', specifications.benefits.join(' ')]]
      : []),
    ...Object.entries(specifications.technicalSpecs)
      .map(([key, value]) => [technicalLabels[key] || key, value]),
  ];
}

function normalizedImageLabel(value) {
  return String(value || '').toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function imageIndexForColourway(images, colourway) {
  return productColourwayImageIndex(images, colourway);
}

function card(product) {
  const hardwarePreview = isHardwareVisualPreviewProduct(product);
  const publicImages = productImagesForDisplay(product);
  const price = displayPrice(product);
  const colourways = productColourwayOptions(product);
  const hasUnmappedColourway = colourways.some(colourway => imageIndexForColourway(publicImages, colourway) < 0);
  const contentStatus = publicImages.length && !hasUnmappedColourway ? 'APPROVED' : 'CONTENT PENDING';
  const initialColourway = colourways[0] || '';
  const summary = !hardwarePreview
    ? product.colourways || product.priceBasis || product.coverage
    : '';
  const priceMarkup = price.label || price.value
    ? `<span class="product-row__price">${price.label ? `<small>${safe(price.label)}</small>` : ''}${price.value ? `<strong>${safe(price.value)}</strong>` : ''}</span>`
    : '';
  return `<article class="product-card" data-content-status="${contentStatus}">
    <button class="product-row__trigger" type="button" data-product="${product.id}"
      data-can-add-to-bag="${canShowBagAction(product)}" aria-label="View details for ${safe(product.name)}">
      <span class="product-row__media" data-product-card-image-slot data-content-status="${contentStatus}">${productCardImageMarkup(product, {
        colourway: initialColourway,
        className: 'product-row__image',
      })}</span>
      <span class="product-row__index" aria-hidden="true">${String(product.id).padStart(2, '0')}</span>
      <span class="product-row__copy">
       <span class="product-row__meta"><span>${safe(customerFacingCategory(product.category))}</span>${product.audience ? `<span>${safe(product.audience)}</span>` : ''}${product.badge ? `<span class="product-row__badge">${safe(product.badge)}</span>` : ''}</span>
        <h3>${safe(product.name)}</h3>
        ${summary ? `<span class="product-row__summary">${safe(summary)}</span>` : ''}
        ${colourways.length > 1 ? `<span class="product-row__selected-colourway" data-product-card-selected-colourway>${safe(initialColourway)}</span>` : ''}
      </span>
      ${priceMarkup}
       <span class="product-row__action">VIEW DETAILS ${outlineIcon('arrowUpRight', 'fsd-icon')}</span>
    </button>
    ${productCardColourwaysMarkup(product)}
  </article>`;
}

export function catalogueSection() {
  return `<section class="shop" id="products">
    <div data-fsd-collection-breadcrumb-slot></div>
    <div class="section-heading"><div><p class="section-kicker">THE FSD COLLECTION</p>
      <h2>SHOP / ALL PRODUCTS<span class="period">.</span></h2></div>
      <p>Find FSD products by collection, category and audience.</p></div>
    <div class="catalogue-garment-category-browser">
      <p class="catalogue-garment-category-browser__label">Browse by product type</p>
      <div id="catalogue-garment-category-tabs" data-catalogue-garment-tabs></div>
    </div>
    <div class="catalogue-control-panel">
      <div class="toolbar catalogue-toolbar">
      <label>Collection<select id="catalogue-collection" aria-label="Filter by collection">
        <option value="All">All collections</option>
        ${shopCollections.map(collection => `<option value="${safe(collection.id)}">${safe(collection.label)}</option>`).join('')}
      </select></label>
      <label>Clothing line<select id="catalogue-line" aria-label="Filter by clothing line">
        <option value="All">All clothing lines</option>
        ${CLOTHING_LINES.map(line => `<option value="${safe(line.id)}">${safe(line.title)}</option>`).join('')}
      </select></label>
      <label>Category<select id="catalogue-category" aria-label="Filter by category">
        <option value="All">All categories</option>
        ${categories.map(category => `<option value="${safe(category)}">${safe(customerFacingCategory(category))}</option>`).join('')}
      </select></label>
      <label>Audience<select id="catalogue-audience" aria-label="Filter by audience">
        <option value="All">All audiences</option>
        ${audiences.map(audience => `<option value="${safe(audience)}">${safe(audience)}</option>`).join('')}
      </select></label>
      <label>Sort<select id="catalogue-sort" aria-label="Sort products">
        ${sortOptions.map(([value, label]) => `<option value="${value}">${safe(label)}</option>`).join('')}
      </select></label>
      <label>Find a product<input id="search" type="search" placeholder="Name, colourway or alternate name…" aria-label="Search products"/></label>
      </div>
       <div class="catalogue-control-bottom">
    <div id="catalogue-active-filters"></div>
      </div>
    </div>
    <p id="catalogue-count" class="catalogue-count" role="status" aria-live="polite"></p>
     <div class="product-grid" id="catalogue-grid" data-view="visual"></div>
    <nav class="catalogue-pagination" id="catalogue-pagination" aria-label="Product catalogue pages"></nav>
  </section>`;
}

export function setCatalogueResultsRenderer(renderer) {
  if (renderer !== null && typeof renderer !== 'function') {
    throw new TypeError('Catalogue results renderer must be a function or null.');
  }
  catalogueResultsRenderer = renderer;
  if (renderer && typeof document !== 'undefined') {
    const grid = document.querySelector('#catalogue-grid');
    if (grid) grid.innerHTML = '';
    renderResults();
  }
}

export function roadmapSection() {
  return `<section class="planned" id="planned"><div class="section-heading"><div>
    <p class="section-kicker">SHOP BY CATEGORY</p><h2>BROWSE THE COLLECTION<span class="period">.</span></h2>
    </div><p>Explore FSD apparel, training and technology by category.</p></div><div class="planned-grid">
    ${categories.map((category, i) => `<a class="planned-row catalogue-category-link" href="#products" data-category-link="${safe(category)}">
      <span>${String(i + 1).padStart(2, '0')}</span><div><strong>${safe(customerFacingCategory(category))}</strong>
      <small>${filterProducts(category).length} products</small></div><span class="planned-status">EXPLORE ↗</span></a>`).join('')}
    </div></section>`;
}

export function innovationsSection() {
  const innovations = products.filter(p => p.category === 'Smart Tech');
  return `<section class="fsd-expanded" id="innovations"><div class="section-heading"><div>
    <p class="section-kicker">TRAINING TECHNOLOGY / SMART TECH</p><h2>BEYOND APPAREL<span class="period">.</span></h2>
    </div><p>FSD training technology and connected products.</p></div>
    <div class="planned-grid">${innovations.map(p => `<div class="planned-row"><span>↗</span><div>
       <strong>${safe(p.name)}</strong><small>FSD SMART TECH</small>
      </div><button class="text-link" data-product="${p.id}">DETAILS<span class="sr-only"> for ${safe(p.name)}</span></button></div>`).join('')}</div>
     <p class="disclaimer">Explore FSD training technology.</p>
    </section>`;
}

function renderResults() {
  updateControls();
  const unsearchedScope = filterProducts(activeCategory, '', activeAudience, activeCollection);
  const lineTabScope = activeLine === 'All'
    ? unsearchedScope
    : unsearchedScope.filter(product => productBelongsToLine(product, activeLine));
  const garmentTabs = garmentCategoryOptions(lineTabScope);
  const categoryScope = filterProducts(activeCategory, query, activeAudience, activeCollection);
  const lineScope = activeLine === 'All'
    ? categoryScope
    : categoryScope.filter(product => productBelongsToLine(product, activeLine));
  const filtered = sortedProducts(lineScope.filter(product => activeGarmentCategory === 'all'
    || productHasGarmentCategory(product, activeGarmentCategory)));
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  page = Math.min(page, totalPages);
  activeFilterMarkup();
  const start = (page - 1) * pageSize;
  document.querySelector('#catalogue-count').textContent = filtered.length
    ? `Showing ${start + 1}–${Math.min(start + pageSize, filtered.length)} of ${filtered.length} ${filtered.length === 1 ? 'product' : 'products'}`
    : 'The Collection is currently being curated.';
  const visibleProducts = filtered.slice(start, start + pageSize).map(product => {
    const hardwarePreview = isHardwareVisualPreviewProduct(product);
    const specificationRows = verifiedSpecificationRows(product);
    return {
      ...product,
      rowPrice: displayPrice(product),
      rowSummary: hardwarePreview ? '' : product.shortDescription || product.colourways || product.priceBasis || product.coverage || '',
      rowColourways: hardwarePreview ? [] : productColourwayOptions(product),
      rowDetails: hardwarePreview
        ? [['Category', customerFacingCategory(product.category)]]
        : [
          ...(product.description ? [['Overview', product.description]] : []),
          ...(product.setContents ? [['Set includes', product.setContents]] : []),
          ...(product.sizes ? [['Sizes', product.sizes.replaceAll(';', ' /')]] : []),
          ...(product.options?.length ? [['Sleeve options', product.options.join(' / ')]] : []),
          ['Colourways', product.colourways],
          ['Audience', product.audience],
          ['Collection line', product.collection],
          ['Coverage', product.coverage],
          ['Set configuration', product.priceBasis],
          ...specificationRows,
        ].filter(([, value]) => value),
      canAddToBag: canShowBagAction(product),
    };
  });
  const grid = document.querySelector('#catalogue-grid');
  if (catalogueResultsRenderer) {
    catalogueResultsRenderer(visibleProducts, catalogueRowActions, view, {
      categories: garmentTabs,
      activeId: activeGarmentCategory,
    });
  } else {
    grid.innerHTML = filtered.length
      ? filtered.slice(start, start + pageSize).map(card).join('')
      : '<div class="empty"><p>No visual matches for these filters. Try another selection.</p><button class="filter" data-clear-filters>Clear all filters</button></div>';
  }
  document.querySelector('#catalogue-pagination').innerHTML = filtered.length && totalPages > 1
    ? `<button class="filter" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}>${outlineIcon('arrowLeft')} Previous</button>
      <span>Page ${page} of ${totalPages}</span>
      <button class="filter" data-page="${page + 1}" ${page === totalPages ? 'disabled' : ''}>Next ${outlineIcon('arrowRight')}</button>`
    : '';
}

function clearFilters({ keepView = false } = {}) {
  activeCategory = 'All';
  activeAudience = 'All';
  activeCollection = 'All';
  activeLine = 'All';
  activeGarmentCategory = 'all';
  query = '';
  sort = 'featured';
  view = 'visual';
  page = 1;
}

export function navigateCatalogue({
  category = 'All',
  audience = 'All',
  collection = 'All',
  line = 'All',
  garmentCategory = 'all',
  query: nextQuery = '',
  sort: nextSort = 'featured',
  view: nextView = 'visual',
  historyMode = 'push',
} = {}) {
  if (category !== 'All' && !categories.includes(category)) return false;
  if (audience !== 'All' && !audiences.includes(audience)) return false;
  if (collection !== 'All' && !shopCollections.some(item => item.id === collection)) return false;
  if (line !== 'All' && !CLOTHING_LINES.some(item => item.id === line)) return false;
  if (garmentCategory !== 'all'
    && !GARMENT_CATEGORY_DEFINITIONS.some(item => item.id === garmentCategory)) return false;
  activeCategory = category;
  activeAudience = audience;
  activeCollection = collection;
  activeLine = line;
  activeGarmentCategory = garmentCategory;
  query = nextQuery;
  sort = sortOptions.some(([value]) => value === nextSort) ? nextSort : 'featured';
  view = viewOptions.includes(nextView) ? nextView : 'visual';
  page = 1;
  openShopArchive();
  renderResults();
  writeStateToURL({ mode: historyMode === 'replace' ? 'replace' : 'push' });
  if (typeof CustomEvent === 'function') {
    document.dispatchEvent?.(new CustomEvent('fsd:navigation-active', { detail: { id: 'collections' } }));
  }
  document.querySelector('#products')?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
  focusResultCount();
  return true;
}

export function selectCatalogueGarmentCategory(garmentCategory) {
  if (garmentCategory !== 'all'
    && !GARMENT_CATEGORY_DEFINITIONS.some(item => item.id === garmentCategory)) return false;
  activeGarmentCategory = garmentCategory;
  page = 1;
  renderResults();
  writeStateToURL({ mode: 'push' });
  return true;
}

function updateProductActionState(product = activeDialogProduct) {
  if (!product) return;
  const sizes = productSizeOptions(product);
  const ready = canShowBagAction(product) && (!sizes.length || Boolean(activeDialogVariant.size));
  const dialogBody = document.querySelector('#dialog-body');
  dialogBody?.querySelectorAll?.('[data-product-primary-add], [data-sticky-add]')?.forEach(button => {
    button.disabled = !ready;
    button.setAttribute('aria-disabled', String(!ready));
  });
  const help = dialogBody?.querySelector?.('[data-size-help]');
  if (help) {
    help.hidden = !sizes.length || Boolean(activeDialogVariant.size);
    help.textContent = 'Choose a size to continue.';
  }
}

function configureProductStickyBar(dialog) {
  productStickyObserver?.disconnect();
  productStickyObserver = null;
  const sticky = dialog?.querySelector('[data-sticky-add-bar]');
  const primary = dialog?.querySelector('[data-product-primary-add]');
  if (!sticky || !primary) return;
  sticky.hidden = true;
  sticky.setAttribute('aria-hidden', 'true');
  if (!window.matchMedia?.('(max-width: 767px)').matches || !('IntersectionObserver' in window)) return;
  let primaryVisible = false;
  productStickyObserver = new IntersectionObserver(([entry]) => {
    if (!entry) return;
    primaryVisible = entry.isIntersecting;
    setStickyAddBarVisible(sticky, !primaryVisible);
  }, { root: dialog, threshold: 0.12 });
  sticky.addEventListener('focusout', () => {
    window.requestAnimationFrame(() => {
      if (primaryVisible) setStickyAddBarVisible(sticky, false);
    });
  });
  productStickyObserver.observe(primary);
}

function updateProductJsonLd(dialogBody) {
  const data = dialogBody?.querySelector('[data-product-jsonld]')?.textContent;
  if (!data || !document.head || typeof document.createElement !== 'function') return;
  let script = document.querySelector('#product-detail-jsonld');
  if (!script) {
    script = document.createElement('script');
    script.id = 'product-detail-jsonld';
    script.type = 'application/ld+json';
    document.head.append(script);
  }
  script.textContent = data;
  dialogBody.querySelector('[data-product-jsonld]')?.remove();
}

function openProductSizeGuide(product) {
  let guide = document.querySelector('#fsd-size-guide-dialog');
  if (!guide) {
    guide = document.createElement('dialog');
    guide.id = 'fsd-size-guide-dialog';
    guide.className = 'size-guide-dialog';
    guide.setAttribute('aria-labelledby', 'size-guide-title');
    document.body.append(guide);
    guide.addEventListener('click', event => {
      if (event.target === guide || event.target.closest('[data-size-guide-close]')) guide.close();
    });
    guide.addEventListener('cancel', event => {
      event.preventDefault();
      guide.close();
    });
    guide.addEventListener('close', () => {
      sizeGuideReturnFocus?.focus?.({ preventScroll: true });
      sizeGuideReturnFocus = null;
    });
  }
  guide.innerHTML = renderSizeGuideDialog(product, productSizeOptions(product));
  sizeGuideReturnFocus = document.activeElement;
  if (!guide.open) guide.showModal();
  guide.querySelector('[data-size-guide-close]')?.focus({ preventScroll: true });
}

function readWishlist() {
  try {
    const saved = JSON.parse(localStorage.getItem('fsd-product-wishlist-v1') || '[]');
    return Array.isArray(saved) ? saved.map(Number).filter(Number.isInteger) : [];
  } catch {
    return [];
  }
}

function toggleWishlist(button) {
  const id = Number(button?.dataset.productWishlist);
  if (!Number.isInteger(id)) return;
  const saved = new Set(readWishlist());
  const isSaved = !saved.has(id);
  if (isSaved) saved.add(id);
  else saved.delete(id);
  try {
    localStorage.setItem('fsd-product-wishlist-v1', JSON.stringify([...saved]));
  } catch {
    // The on-page toggle still works if browser storage is unavailable.
  }
  button.setAttribute('aria-pressed', String(isSaved));
  const label = button.querySelector('[data-wishlist-label]');
  if (label) label.textContent = isSaved ? 'Saved to wishlist' : 'Add to wishlist';
  const icon = button.querySelector('[aria-hidden="true"]');
  if (icon) icon.textContent = isSaved ? '♥' : '♡';
  animateWishlistHeart(icon);
}

export function showProduct(id, { fromHistory = false, returnFocus = null, initialVariant = {} } = {}) {
  const p = products.find(product => product.id === id);
  if (!p) return;
  const dialog = document.querySelector('#product-dialog');
  if (!fromHistory && isBrowser()) {
    const currentProductId = Number.parseInt(new URLSearchParams(window.location.search).get('product') || '', 10);
    if (currentProductId !== p.id) {
      openShopArchive();
      const returnUrl = new URL(window.location.href);
      returnUrl.searchParams.delete('product');
      window.history.replaceState({
        ...(window.history.state || {}),
        fsdShop: { ...currentState(), productId: null, scrollY: window.scrollY || 0 },
      }, '', returnUrl);
      writeStateToURL({ mode: 'push', productId: p.id });
    }
  }
  if (!activeDialogProduct) {
    dialogReturnFocus = returnFocus || document.activeElement;
    dialogReturnFocusIsExplicit = Boolean(returnFocus);
  }
  activeDialogProduct = p;
  const hardwarePreview = isHardwareVisualPreviewProduct(p);
  const price = displayPrice(p);
  const images = isAegisPrivateProof(p)
    ? [{ label: 'Aegis campaign image', src: `${aegisGiletPreviewPath}media/front-three-quarter` }]
    : productImagesForDisplay(p);
  activeDialogImages = images;
  const galleryPlaceholders = Array.isArray(p.galleryPlaceholders)
    ? p.galleryPlaceholders.filter(slot => typeof slot === 'string' && slot.trim())
    : [];
  const colourwayOptions = hardwarePreview ? [] : productColourwayOptions(p);
  const colourwayImageIndexes = colourwayOptions.map(option => imageIndexForColourway(images, option));
  const firstColourwayImageIndex = colourwayImageIndexes[0] ?? -1;
  const initialImageIndex = colourwayOptions.length > 1
    ? firstColourwayImageIndex
    : colourwayOptions.length && firstColourwayImageIndex >= 0
      ? firstColourwayImageIndex
      : images.length ? 0 : -1;
  const dialogBody = document.querySelector('#dialog-body');
  const sizes = productSizeOptions(p);
  activeDialogVariant = { size: '', colourway: colourwayOptions[0] || '' };
  dialogBody.innerHTML = renderProductDetailPage({
    product: p,
    images,
    initialImageIndex,
    galleryPlaceholders,
    colourways: colourwayOptions,
    colourwayImageIndexes,
    sizes,
    price,
    canPurchase: !hardwarePreview && canShowBagAction(p),
    hardwarePreview,
  });
  const wishlistButton = dialogBody.querySelector('[data-product-wishlist]');
  const wishlistSaved = readWishlist().includes(p.id);
  wishlistButton?.setAttribute('aria-pressed', String(wishlistSaved));
  if (wishlistSaved) {
    const label = wishlistButton.querySelector('[data-wishlist-label]');
    if (label) label.textContent = 'Saved to wishlist';
    const icon = wishlistButton.querySelector('[aria-hidden="true"]');
    if (icon) icon.textContent = '♥';
  }
  updateProductJsonLd(dialogBody);
  document.documentElement?.classList?.add('fsd-modal-open');
  if (dialog && !dialog.open) dialog.showModal();
  updateProductActionState(p);
  configureProductStickyBar(dialog);
  const initialColourIndex = colourwayOptions.indexOf(initialVariant.colourway);
  if (initialColourIndex >= 0) {
    const colourInput = dialogBody.querySelector(`input[data-catalogue-colourway-index="${initialColourIndex}"]`);
    if (colourInput) {
      colourInput.checked = true;
      colourInput.dispatchEvent?.(new Event('change', { bubbles: true }));
    }
  }
  if (!hardwarePreview && typeof document.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
    document.dispatchEvent(new CustomEvent('fsd:product-specifications-open', {
      detail: { productId: p.id },
    }));
  }
  dialog?.querySelector?.('#close-dialog')?.focus?.({ preventScroll: true });
  if (!fromHistory && dialog?.open) {
    trackEvent('product_detail_opened', {
      product_id: p.id,
      product_category: p.category,
    });
  }
}

function closeProductDialogWithMotion(dialog) {
  if (!dialog?.open || dialog.dataset.fsdMotionClosing === 'true') return;
  dialog.dataset.fsdMotionClosing = 'true';
  void animateElement(dialog, {
    opacity: [1, 0],
    y: [0, 12],
  }, { duration: FSD_MOTION.panelDuration }).finally(() => {
    delete dialog.dataset.fsdMotionClosing;
    if (dialog.open) dialog.close();
  });
}

function closeProductFromUI() {
  if (!activeDialogProduct) return;
  const dialog = document.querySelector('#product-dialog');
  if (isBrowser()) {
    const params = new URLSearchParams(window.location.search);
    params.delete('product');
    const url = new URL(window.location.href);
    url.search = params.toString();
    window.history.replaceState({
      ...(window.history.state || {}),
      fsdShop: { ...currentState(), productId: null, scrollY: window.scrollY || 0 },
    }, '', url);
  }
  closeProductDialogWithMotion(dialog);
}

function closeProductForNewDestination() {
  if (!activeDialogProduct) return;
  const dialog = document.querySelector('#product-dialog');
  if (isBrowser()) {
    const url = new URL(window.location.href);
    url.searchParams.delete('product');
    window.history.replaceState({
      ...(window.history.state || {}),
      fsdShop: { ...currentState(), productId: null, scrollY: window.scrollY || 0 },
    }, '', url);
  }
  closeProductDialogWithMotion(dialog);
}

function restoreFromURL({ scrollY } = {}) {
  const state = readStateFromURL();
  applyState(state);
  openShopArchive();
  const archive = document.querySelector('#catalogue-archive');
  const hasShopState = isBrowser() && [...new URLSearchParams(window.location.search).keys()]
    .some(key => ['category', 'audience', 'collection', 'line', 'garment', 'q', 'sort', 'view', 'page', 'product'].includes(key));
  if (archive) archive.open = hasShopState
    || Number.isFinite(scrollY)
    || (isBrowser() && window.location.hash === '#products');
  renderResults();

  const dialog = document.querySelector('#product-dialog');
  if (state.productId && products.some(product => product.id === state.productId)) {
    showProduct(state.productId, { fromHistory: true });
  } else if (dialog?.open) {
    dialog.close();
  }

  if (Number.isFinite(scrollY) && isBrowser()) {
    requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: 'auto' }));
  }
}

export function initCatalogue({ onProductSelect = showProduct, onAddToBag = () => {} } = {}) {
  const category = document.querySelector('#catalogue-category');
  const audience = document.querySelector('#catalogue-audience');
  const collection = document.querySelector('#catalogue-collection');
  const line = document.querySelector('#catalogue-line');
  const sortSelect = document.querySelector('#catalogue-sort');
  const search = document.querySelector('#search');
  const dialog = document.querySelector('#product-dialog');
  const dialogBody = document.querySelector('#dialog-body');
  catalogueRowActions = { onProductSelect, onAddToBag };
  const initialState = readStateFromURL();
  applyState(initialState);
  const initialShopState = isBrowser() && [...new URLSearchParams(window.location.search).keys()]
    .some(key => ['category', 'audience', 'collection', 'line', 'garment', 'q', 'sort', 'view', 'page', 'product'].includes(key));
  const archive = document.querySelector('#catalogue-archive');
  if (archive) archive.open = initialShopState || (isBrowser() && window.location.hash === '#products');
  updateControls();

  const commitFilterChange = () => {
    searchEditing = false;
    clearTimeout(searchCommitTimer);
    page = 1;
    renderResults();
    writeStateToURL({ mode: 'push' });
  };

  const updateEditorialGalleryLayout = hasSecondary => {
    const layout = dialogBody.querySelector('.product-detail-layout');
    const featureGrid = dialogBody.querySelector('.product-detail-gallery__feature-grid');
    const panel = dialogBody.querySelector('[data-catalogue-secondary-panel]');
    if (layout) layout.dataset.catalogueHasSecondary = String(hasSecondary);
    if (featureGrid) {
      featureGrid.classList.toggle('has-secondary', hasSecondary);
      featureGrid.classList.toggle('is-single', !hasSecondary);
    }
    if (panel) panel.hidden = !hasSecondary;
  };

  const syncSecondaryGalleryImage = (primaryIndex, primaryImage, primaryColourwayIndex) => {
    const panel = dialogBody.querySelector('[data-catalogue-secondary-panel]');
    const secondaryImage = dialogBody.querySelector('[data-catalogue-secondary-image]');
    const placeholder = dialogBody.querySelector('[data-catalogue-secondary-placeholder]');
    const caption = dialogBody.querySelector('[data-catalogue-secondary-caption]');
    const colourways = productColourwayOptions(activeDialogProduct);
    if (!panel || !secondaryImage || !primaryImage) {
      updateEditorialGalleryLayout(false);
      return;
    }

    const secondaryIndex = activeDialogImages.findIndex((candidate, candidateIndex) => {
      if (candidateIndex === primaryIndex || candidate.src === primaryImage.src) return false;
      const candidateColourwayIndex = imageColourwayIndex(activeDialogProduct, candidate);
      if (colourways.length > 1) {
        return primaryColourwayIndex >= 0 && candidateColourwayIndex === primaryColourwayIndex;
      }
      return candidateColourwayIndex < 0
        || primaryColourwayIndex < 0
        || candidateColourwayIndex === primaryColourwayIndex;
    });
    if (secondaryIndex < 0) {
      updateEditorialGalleryLayout(false);
      return;
    }

    const image = activeDialogImages[secondaryIndex];
    const imageColourway = colourways[imageColourwayIndex(activeDialogProduct, image)]
      || image.colourway || image.variant || image.size || '';
    const previousImageColourway = secondaryImage.dataset.fsdImageVariant || '';
    updateEditorialGalleryLayout(true);
    secondaryImage.hidden = false;
    secondaryImage.dataset.fsdImageFallback = 'true';
    secondaryImage.dataset.fsdImageTitle = activeDialogProduct.name;
    secondaryImage.dataset.fsdImageVariant = imageColourway;
    delete secondaryImage.dataset.fsdImageFailed;
    if (placeholder) {
      placeholder.hidden = true;
      const label = placeholder.querySelector('[data-catalogue-secondary-variant]');
      if (label) label.textContent = imageColourway;
    }
    if (caption) caption.textContent = image.label;
    crossfadeMappedImage(
      secondaryImage,
      image.src,
      `${activeDialogProduct.name} — ${image.label}`,
      () => {
        secondaryImage.hidden = true;
        if (placeholder) {
          const label = placeholder.querySelector('[data-catalogue-secondary-variant]');
          if (label) label.textContent = imageColourway;
          placeholder.hidden = false;
        }
      },
      {
        variant: imageColourway,
        retainPrevious: normaliseGalleryColourway(previousImageColourway) === normaliseGalleryColourway(imageColourway),
      },
    );
  };

  const selectDialogImage = index => {
    const image = activeDialogImages[index];
    const mainImage = dialogBody.querySelector('[data-catalogue-main-image]');
    const caption = dialogBody.querySelector('[data-catalogue-main-caption]');
    if (!image || !mainImage || !caption) return;
    const matchedColourway = imageColourwayIndex(activeDialogProduct, image);
    if (productColourwayOptions(activeDialogProduct).length > 1 && matchedColourway < 0) {
      showVariantImagePlaceholder(`${activeDialogVariant.colourway} · photograph needs colourway mapping`);
      return;
    }
    const placeholder = dialogBody.querySelector('[data-catalogue-variant-placeholder]');
    const gallery = placeholder?.closest('.product-detail-gallery');
    if (mainImage.dataset.fsdImageFailed === 'true' && mainImage.getAttribute('src') === image.src) {
      showVariantImagePlaceholder(image.colourway || image.variant || image.size || image.label);
      return;
    }
    if (placeholder) placeholder.hidden = true;
    gallery?.classList.remove('has-variant-placeholder');
    mainImage.hidden = false;
    mainImage.dataset.fsdImageFallback = 'true';
    delete mainImage.dataset.fsdImageFailed;
    const zoomButton = mainImage.closest('[data-catalogue-zoom]');
    if (zoomButton) zoomButton.hidden = false;
    const mappedColourway = productColourwayOptions(activeDialogProduct)[matchedColourway]
      || image.colourway || image.variant || '';
    crossfadeMappedImage(
      mainImage,
      image.src,
      `${activeDialogProduct.name} — ${image.label}`,
      () => showVariantImagePlaceholder(image.colourway || image.variant || image.size || image.label),
      {
        variant: mappedColourway,
        retainPrevious: normaliseGalleryColourway(mainImage.dataset.fsdImageVariant) === normaliseGalleryColourway(mappedColourway),
      },
    );
    caption.textContent = image.label;
    dialogBody.querySelectorAll('[data-catalogue-image-index]').forEach(button => {
      button.setAttribute('aria-pressed', String(Number(button.dataset?.catalogueImageIndex) === index));
    });
    if (matchedColourway >= 0) {
      dialogBody.querySelectorAll('[data-catalogue-colourway-index]').forEach(input => {
        input.checked = Number(input.dataset?.catalogueColourwayIndex) === matchedColourway;
      });
      const selectedColourway = dialogBody.querySelector('[data-catalogue-selected-colourway]');
      activeDialogVariant.colourway = productColourwayOptions(activeDialogProduct)[matchedColourway];
      if (selectedColourway) selectedColourway.textContent = activeDialogVariant.colourway;
    }
    syncSecondaryGalleryImage(index, image, matchedColourway);
  };

  const showVariantImagePlaceholder = variantLabel => {
    const placeholder = dialogBody.querySelector('[data-catalogue-variant-placeholder]');
    if (!placeholder) return;
    const label = placeholder.querySelector('[data-catalogue-variant-label]');
    if (label) label.textContent = variantLabel;
    placeholder.setAttribute('aria-label', `${activeDialogProduct?.name || 'FSD product'} — ${variantLabel} image placeholder`);
    placeholder.hidden = false;

    const mainImage = dialogBody.querySelector('[data-catalogue-main-image]');
    cancelMappedImageSwap(mainImage);
    const zoomButton = mainImage?.closest('[data-catalogue-zoom]');
    if (mainImage) mainImage.hidden = true;
    if (zoomButton) zoomButton.hidden = true;
    if (!mainImage) placeholder.closest('.product-detail-gallery')?.classList.add('has-variant-placeholder');

    const caption = dialogBody.querySelector('[data-catalogue-main-caption]');
    if (caption) caption.textContent = `${variantLabel} — image to be added`;
    updateEditorialGalleryLayout(false);
  };

  mountImmersiveProductGallery({
    dialog,
    body: dialogBody,
    getProduct: () => activeDialogProduct,
    getImages: () => activeDialogImages,
    getVariant: () => activeDialogVariant,
    selectImage: selectDialogImage,
  });

  category.addEventListener('change', () => {
    activeCategory = category.value;
    commitFilterChange();
  });
  audience.addEventListener('change', () => {
    activeAudience = audience.value;
    commitFilterChange();
  });
  collection.addEventListener('change', () => {
    activeCollection = collection.value;
    commitFilterChange();
  });
  line.addEventListener('change', () => {
    activeLine = line.value;
    commitFilterChange();
  });
  sortSelect.addEventListener('change', () => {
    sort = sortSelect.value;
    commitFilterChange();
  });
  search.addEventListener('input', () => {
    if (!searchEditing) {
      writeStateToURL({ mode: 'push' });
      searchEditing = true;
    }
    query = search.value;
    page = 1;
    renderResults();
    writeStateToURL({ mode: 'replace' });
    clearTimeout(searchCommitTimer);
    searchCommitTimer = setTimeout(() => { searchEditing = false; }, 600);
  });
  search.addEventListener('change', () => { searchEditing = false; clearTimeout(searchCommitTimer); });

  document.addEventListener('change', event => {
    const colourwayInput = event.target.closest?.('input[data-catalogue-colourway-index]');
    if (colourwayInput && dialogBody.contains(colourwayInput) && activeDialogProduct) {
      const index = Number(colourwayInput.dataset.catalogueColourwayIndex);
      const colourway = productColourwayOptions(activeDialogProduct)[index];
      if (!colourway) return;
      activeDialogVariant.colourway = colourway;
      const selectedColourway = dialogBody.querySelector('[data-catalogue-selected-colourway]');
      if (selectedColourway) selectedColourway.textContent = colourway;
      const imageIndex = Number(colourwayInput.dataset.catalogueColourwayImageIndex);
      if (imageIndex >= 0) selectDialogImage(imageIndex);
      else if (productColourwayOptions(activeDialogProduct).length > 1) showVariantImagePlaceholder(colourway);
      else if (activeDialogImages.length) selectDialogImage(0);
      else showVariantImagePlaceholder(colourway);
      return;
    }
    const sizeInput = event.target.closest?.('input[data-product-size]');
    if (sizeInput && dialogBody.contains(sizeInput) && activeDialogProduct) {
      if (sizeInput.dataset.outOfStock === 'true') {
        sizeInput.checked = false;
        const previous = dialogBody.querySelectorAll('input[data-product-size]');
        previous.forEach(input => {
          input.checked = input.value === activeDialogVariant.size;
        });
        const actionStatus = dialogBody.querySelector('[data-product-action-status]');
        if (actionStatus) actionStatus.textContent = `${sizeInput.value} is out of stock. Choose another size.`;
        return;
      }
      activeDialogVariant.size = sizeInput.value;
      const sizeSpecificImages = activeDialogImages.filter(image => image.size);
      if (sizeSpecificImages.length) {
        const sizeImageIndex = activeDialogImages.findIndex(image =>
          normalizedImageLabel(image.size) === normalizedImageLabel(sizeInput.value)
          && (!image.colourway || !activeDialogVariant.colourway
            || normalizedImageLabel(image.colourway) === normalizedImageLabel(activeDialogVariant.colourway)));
        if (sizeImageIndex >= 0) selectDialogImage(sizeImageIndex);
        else showVariantImagePlaceholder([activeDialogVariant.colourway, sizeInput.value].filter(Boolean).join(' / '));
      }
      updateProductActionState(activeDialogProduct);
    }
    const quantityInput = event.target.closest?.('input[data-product-quantity]');
    if (quantityInput && dialogBody.contains(quantityInput)) {
      quantityInput.setCustomValidity('');
    }
  });

  document.addEventListener('click', event => {
    const cardSwatch = event.target.closest?.('[data-catalogue-card-colourway]');
    if (cardSwatch) {
      const swatches = cardSwatch.closest('[data-product-card-swatches]');
      const cardElement = swatches?.closest('.product-card');
      const productId = Number(swatches?.dataset.productCardSwatches);
      const product = products.find(item => item.id === productId);
      if (!product || !cardElement) return;
      const colourway = productColourwayOptions(product)[Number(cardSwatch.dataset.catalogueCardColourway)];
      if (!colourway) return;
      cardElement.querySelectorAll('[data-catalogue-card-colourway]').forEach(button => {
        button.setAttribute('aria-pressed', String(button === cardSwatch));
      });
      cardElement.querySelectorAll('[data-product-card-selected-colourway]').forEach(label => {
        label.textContent = colourway;
      });
      const imageSlot = cardElement.querySelector('[data-product-card-image-slot]');
      if (imageSlot) {
        imageSlot.innerHTML = productCardImageMarkup(product, {
          colourway,
          className: 'product-row__image',
        });
      }
      return;
    }
    const sizeGuideButton = event.target.closest('[data-size-guide]');
    if (sizeGuideButton && dialogBody.contains(sizeGuideButton) && activeDialogProduct) {
      openProductSizeGuide(activeDialogProduct);
      return;
    }
    const wishlistButton = event.target.closest('[data-product-wishlist]');
    if (wishlistButton && dialogBody.contains(wishlistButton)) {
      toggleWishlist(wishlistButton);
      return;
    }
    const zoomButton = event.target.closest('[data-catalogue-zoom]');
    if (zoomButton && dialogBody.contains(zoomButton)) {
      const zoomed = zoomButton.getAttribute('aria-pressed') === 'true';
      zoomButton.setAttribute('aria-pressed', String(!zoomed));
      zoomButton.setAttribute('aria-label', zoomed ? 'Zoom product image' : 'Zoomed product image; activate to reset');
      zoomButton.classList.toggle('is-zoomed', !zoomed);
      return;
    }
    const relatedButton = event.target.closest('[data-related-product]');
    if (relatedButton && dialogBody.contains(relatedButton)) {
      onProductSelect(Number(relatedButton.dataset.relatedProduct), relatedButton);
      return;
    }
    const imageButton = event.target.closest('[data-catalogue-image-index]');
    if (imageButton && dialogBody.contains(imageButton) && activeDialogProduct) {
      const index = Number(imageButton.dataset.catalogueImageIndex);
      selectDialogImage(index);
      return;
    }
    if (event.target.closest('[data-catalogue-back]')) {
      closeProductFromUI();
      return;
    }
    if (event.target.closest('[data-shop-breadcrumb]')) {
      event.preventDefault?.();
      closeProductFromUI();
      openShopArchive();
      return;
    }
    const homeBreadcrumb = event.target.closest('[data-home-breadcrumb]');
    if (homeBreadcrumb) {
      event.preventDefault?.();
      closeProductFromUI();
      document.querySelector('#home')?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
      return;
    }
    const bagButton = event.target.closest('[data-bag-add]');
    if (bagButton) {
      const sizeRequired = productSizeOptions(activeDialogProduct).length > 0;
      const actionStatus = dialogBody.querySelector('[data-product-action-status]');
      if (sizeRequired && !activeDialogVariant.size) {
        if (actionStatus) actionStatus.textContent = 'Choose a size before adding this item to your bag.';
        dialogBody.querySelector('input[data-product-size]')?.focus();
        return;
      }
      const quantityInput = dialogBody.querySelector('[data-product-quantity]');
      const quantity = quantityInput ? quantityInput.valueAsNumber : 1;
      const maxQuantity = Number(quantityInput?.max) || 99;
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > maxQuantity) {
        quantityInput?.setCustomValidity(`Enter a whole number from 1 to ${maxQuantity}.`);
        quantityInput?.reportValidity?.();
        quantityInput?.focus();
        if (actionStatus) actionStatus.textContent = `Choose a quantity from 1 to ${maxQuantity}.`;
        return;
      }
      quantityInput?.setCustomValidity('');
      const added = onAddToBag(Number(bagButton.dataset.bagAdd), { ...activeDialogVariant }, quantity);
      if (actionStatus) {
        actionStatus.textContent = added
          ? `${quantity > 1 ? `${quantity} items added` : 'Added'} to your bag. Checkout is disabled.`
          : 'This item could not be added to the bag.';
      }
      if (added && quantityInput) quantityInput.value = '1';
      if (added) animateAddButton(bagButton);
      return;
    }
    const product = event.target.closest('[data-product]');
    if (product) {
      onProductSelect(Number(product.dataset.product), product);
      return;
    }
    const categoryLink = event.target.closest('[data-category-link]');
    if (categoryLink) {
      event.preventDefault?.();
      const nextCategory = categoryLink.dataset.categoryLink;
      if (dialog?.open) closeProductForNewDestination();
      navigateCatalogue({ category: nextCategory });
      return;
    }
    const viewButton = event.target.closest('[data-catalogue-view]');
    if (viewButton) {
      view = viewOptions.includes(viewButton.dataset.catalogueView) ? viewButton.dataset.catalogueView : 'visual';
      page = 1;
      renderResults();
      writeStateToURL({ mode: 'push' });
      return;
    }
    const filterChip = event.target.closest('[data-remove-filter]');
    if (filterChip) {
      const key = filterChip.dataset.removeFilter;
      if (key === 'category') activeCategory = 'All';
      if (key === 'audience') activeAudience = 'All';
      if (key === 'collection') activeCollection = 'All';
      if (key === 'line') activeLine = 'All';
      if (key === 'garment') activeGarmentCategory = 'all';
      if (key === 'q') query = '';
      commitFilterChange();
      return;
    }
    const pageButton = event.target.closest('[data-page]');
    if (pageButton && !pageButton.disabled) {
      page = Number(pageButton.dataset.page);
      renderResults();
      writeStateToURL({ mode: 'push' });
      document.querySelector('#products').scrollIntoView({ block: 'start' });
      focusResultCount();
      return;
    }
    if (event.target.closest('[data-clear-filters]')) {
      clearFilters();
      renderResults();
      writeStateToURL({ mode: 'push' });
      search.focus();
    }
  });
  document.querySelector('#close-dialog').addEventListener('click', closeProductFromUI);
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    if (sizeGuideEscapePending || document.querySelector('#fsd-size-guide-dialog')?.open) return;
    closeProductFromUI();
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    const clickedOutsideCard = event.clientX < bounds.left
      || event.clientX > bounds.right
      || event.clientY < bounds.top
      || event.clientY > bounds.bottom;
    if (clickedOutsideCard) closeProductFromUI();
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const photoViewer = document.querySelector('#fsd-product-viewer');
    if (photoViewer?.open) {
      event.preventDefault();
      event.stopImmediatePropagation();
      photoViewer.close();
      return;
    }
    const sizeGuide = document.querySelector('#fsd-size-guide-dialog');
    if (sizeGuide?.open) {
      event.preventDefault();
      event.stopImmediatePropagation();
      sizeGuide.close();
      return;
    }
    const productDialog = document.querySelector('#product-dialog');
    if (!productDialog?.open) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    closeProductForNewDestination();
  }, true);
  dialog.addEventListener('close', () => {
    // Native close events can arrive after this shared dialog has reopened.
    if (dialog.open) return;
    const productId = activeDialogProduct?.id;
    productStickyObserver?.disconnect();
    productStickyObserver = null;
    document.querySelector('#product-detail-jsonld')?.remove();
    const isVisibleFocusTarget = target => target?.isConnected
      && target.getClientRects().length > 0
      && !target.closest('[hidden], details:not([open])');
    const visibleProductTrigger = productId
      ? [...document.querySelectorAll(`[data-product="${productId}"]`)].find(isVisibleFocusTarget)
      : null;
    const focusTarget = dialogReturnFocusIsExplicit && dialogReturnFocus?.isConnected
      ? dialogReturnFocus
      : isVisibleFocusTarget(dialogReturnFocus)
      ? dialogReturnFocus
      : visibleProductTrigger || document.querySelector('#catalogue-archive > summary');
    if (typeof document.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
      document.dispatchEvent(new CustomEvent('fsd:product-specifications-close'));
    }
    activeDialogProduct = null;
    if (!document.querySelectorAll('dialog[open]').length) {
      document.documentElement?.classList?.remove('fsd-modal-open');
    }
    const restoreFocus = () => {
      if (!dialog.open) focusTarget?.focus?.({ preventScroll: true });
    };
    if (document.querySelectorAll('dialog[open]').length && typeof window !== 'undefined') {
      window.setTimeout(restoreFocus, 0);
    } else if (typeof requestAnimationFrame === 'function') requestAnimationFrame(restoreFocus);
    else restoreFocus();
    dialogReturnFocus = null;
    dialogReturnFocusIsExplicit = false;
  });
  if (isBrowser()) window.addEventListener('popstate', event => restoreFromURL({
    scrollY: event.state?.fsdShop?.scrollY,
  }));
  renderResults();
  if (initialState.productId && products.some(product => product.id === initialState.productId)) {
    showProduct(initialState.productId, { fromHistory: true });
  }
}
