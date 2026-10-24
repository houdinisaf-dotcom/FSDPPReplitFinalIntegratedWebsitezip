import { audiences, categories, imageSwatchBackground, products, filterProducts, isHardwareVisualPreviewProduct, priceInfo, safe, shopCollections } from './catalogue-data.js';
import { canAddToBag } from './bag.js';
import { crossfadeMappedImage } from './catalogue-image-gallery.js';
import { trackEvent } from './analytics.js';
import { aegisGiletPreviewPath } from './aegis-gilet-preview-path.js';

const pageSize = 12;
let activeCategory = 'All';
let activeAudience = 'All';
let activeCollection = 'All';
let query = '';
let sort = 'featured';
let view = 'list';
let page = 1;
let activeDialogProduct = null;
let dialogReturnFocus = null;
let dialogReturnFocusIsExplicit = false;
let searchEditing = false;
let searchCommitTimer = null;

const sortOptions = [
  ['featured', 'Featured'],
  ['name-asc', 'Name A–Z'],
  ['price-asc', 'Price: low to high'],
  ['price-desc', 'Price: high to low'],
];
const viewOptions = ['list'];
const isBrowser = () => typeof window !== 'undefined' && Boolean(window.history && window.location);
const scrollBehavior = () => typeof window === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  ? 'auto'
  : 'smooth';

function currentState() {
  return {
    category: activeCategory,
    audience: activeAudience,
    collection: activeCollection,
    query,
    sort,
    view,
    page,
  };
}

function readStateFromURL() {
  if (!isBrowser()) return currentState();
  const params = new URLSearchParams(window.location.search);
  const requestedCategory = params.get('category');
  const requestedAudience = params.get('audience');
  const requestedCollection = params.get('collection');
  const requestedSort = params.get('sort');
  const requestedView = params.get('view');
  return {
    category: categories.includes(requestedCategory) ? requestedCategory : 'All',
    audience: audiences.includes(requestedAudience) ? requestedAudience : 'All',
    collection: shopCollections.some(item => item.id === requestedCollection) ? requestedCollection : 'All',
    query: params.get('q') || '',
    sort: sortOptions.some(([value]) => value === requestedSort) ? requestedSort : 'featured',
    view: viewOptions.includes(requestedView) ? requestedView : 'list',
    page: Math.max(1, Number.parseInt(params.get('page') || '1', 10) || 1),
    productId: Number.parseInt(params.get('product') || '', 10) || null,
  };
}

function applyState(state) {
  activeCategory = state.category;
  activeAudience = state.audience;
  activeCollection = state.collection;
  query = state.query;
  sort = state.sort;
  view = state.view;
  page = state.page;
}

function updateControls() {
  const controls = [
    ['#catalogue-category', activeCategory],
    ['#catalogue-audience', activeAudience],
    ['#catalogue-collection', activeCollection],
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
}

function writeStateToURL({ mode = 'replace', productId = null } = {}) {
  if (!isBrowser()) return;
  const url = new URL(window.location.href);
  const params = url.searchParams;
  const values = [
    ['category', activeCategory, 'All'],
    ['audience', activeAudience, 'All'],
    ['collection', activeCollection, 'All'],
    ['q', query, ''],
    ['sort', sort, 'featured'],
    ['view', view, 'list'],
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
  if (activeCategory !== 'All') chips.push(['category', activeCategory, activeCategory]);
  if (activeAudience !== 'All') chips.push(['audience', activeAudience, activeAudience]);
  if (query.trim()) chips.push(['q', query, `Search: ${query}`]);
  const hasOtherState = sort !== 'featured';
  const wrapper = document.querySelector('#catalogue-active-filters');
  if (!wrapper) return;
  wrapper.innerHTML = chips.length || hasOtherState
    ? `<div class="catalogue-chip-list" aria-label="Active filters">
        ${chips.map(([key, value, label]) => `<button type="button" class="catalogue-chip" data-remove-filter="${safe(key)}" data-filter-value="${safe(value)}">
          ${safe(label)} <span aria-hidden="true">×</span><span class="sr-only">Remove filter</span>
        </button>`).join('')}
        ${hasOtherState ? `<span class="catalogue-view-state">SORT: ${safe(sortOptions.find(([value]) => value === sort)?.[1] || sort)}</span>` : ''}
        <button type="button" class="catalogue-clear-all" data-clear-filters>Clear all</button>
      </div>`
    : '';
}

function imagePlaceholder(product, failed = false) {
  return `<div class="catalogue-placeholder" role="note">
    <strong>${safe(product.name)}</strong>
    <small>${safe(product.category)}</small>
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
  return typeof product.colourways === 'string'
    ? product.colourways.split(/\s*;\s*/).map(option => option.trim()).filter(Boolean)
    : [];
}

function normalizedImageLabel(value) {
  return String(value || '').toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function imageIndexForColourway(images, colourway) {
  const target = normalizedImageLabel(colourway);
  return images.findIndex(image => normalizedImageLabel(image.label) === target);
}

function card(product) {
  const hardwarePreview = isHardwareVisualPreviewProduct(product);
  const price = displayPrice(product);
  const summary = !hardwarePreview
    ? product.colourways || product.priceBasis || product.coverage
    : '';
  const priceMarkup = price.label || price.value
    ? `<span class="product-row__price">${price.label ? `<small>${safe(price.label)}</small>` : ''}${price.value ? `<strong>${safe(price.value)}</strong>` : ''}</span>`
    : '';
  return `<article class="product-card">
    <button class="product-row__trigger" type="button" data-product="${product.id}"
      data-can-add-to-bag="${canShowBagAction(product)}" aria-label="View details for ${safe(product.name)}">
      <span class="product-row__index" aria-hidden="true">${String(product.id).padStart(2, '0')}</span>
      <span class="product-row__copy">
        <span class="product-row__meta"><span>${safe(product.category)}</span>${product.audience ? `<span>${safe(product.audience)}</span>` : ''}</span>
        <h3>${safe(product.name)}</h3>
        ${summary ? `<span class="product-row__summary">${safe(summary)}</span>` : ''}
      </span>
      ${priceMarkup}
      <span class="product-row__action">VIEW DETAILS <span aria-hidden="true">↗</span></span>
    </button>
  </article>`;
}

export function catalogueSection() {
  return `<section class="shop" id="products">
    <div class="section-heading"><div><p class="section-kicker">THE FSD COLLECTION</p>
      <h2>SHOP / ALL PRODUCTS<span class="period">.</span></h2></div>
      <p>Find FSD products by collection, category and audience.</p></div>
    <div class="catalogue-control-panel">
      <div class="toolbar catalogue-toolbar">
      <label>Collection<select id="catalogue-collection" aria-label="Filter by collection">
        <option value="All">All collections</option>
        ${shopCollections.map(collection => `<option value="${safe(collection.id)}">${safe(collection.label)}</option>`).join('')}
      </select></label>
      <label>Category<select id="catalogue-category" aria-label="Filter by category">
        <option value="All">All categories</option>
        ${categories.map(category => `<option value="${safe(category)}">${safe(category)}</option>`).join('')}
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
      <div class="catalogue-control-bottom"><div id="catalogue-active-filters"></div></div>
    </div>
    <p id="catalogue-count" class="catalogue-count" role="status" aria-live="polite"></p>
    <div class="product-grid" id="catalogue-grid" data-view="list"></div>
    <nav class="catalogue-pagination" id="catalogue-pagination" aria-label="Product catalogue pages"></nav>
  </section>`;
}

export function roadmapSection() {
  return `<section class="planned" id="planned"><div class="section-heading"><div>
    <p class="section-kicker">SHOP BY CATEGORY</p><h2>BROWSE THE COLLECTION<span class="period">.</span></h2>
    </div><p>Explore FSD apparel, training and technology by category.</p></div><div class="planned-grid">
    ${categories.map((category, i) => `<a class="planned-row catalogue-category-link" href="#products" data-category-link="${safe(category)}">
      <span>${String(i + 1).padStart(2, '0')}</span><div><strong>${safe(category)}</strong>
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
  const filtered = sortedProducts(filterProducts(activeCategory, query, activeAudience, activeCollection));
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  page = Math.min(page, totalPages);
  updateControls();
  activeFilterMarkup();
  const start = (page - 1) * pageSize;
  document.querySelector('#catalogue-count').textContent = filtered.length
    ? `Showing ${start + 1}–${Math.min(start + pageSize, filtered.length)} of ${filtered.length} ${filtered.length === 1 ? 'product' : 'products'}`
    : 'No matching products';
  document.querySelector('#catalogue-grid').innerHTML = filtered.length
    ? filtered.slice(start, start + pageSize).map(card).join('')
    : '<div class="empty"><p>No visual matches for these filters. Try another selection.</p><button class="filter" data-clear-filters>Clear all filters</button></div>';
  document.querySelector('#catalogue-pagination').innerHTML = filtered.length && totalPages > 1
    ? `<button class="filter" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}>Previous</button>
      <span>Page ${page} of ${totalPages}</span>
      <button class="filter" data-page="${page + 1}" ${page === totalPages ? 'disabled' : ''}>Next</button>`
    : '';
}

function clearFilters({ keepView = false } = {}) {
  activeCategory = 'All';
  activeAudience = 'All';
  activeCollection = 'All';
  query = '';
  sort = 'featured';
  view = 'list';
  page = 1;
}

export function navigateCatalogue({
  category = 'All',
  audience = 'All',
  collection = 'All',
  query: nextQuery = '',
  sort: nextSort = 'featured',
  view: nextView = 'list',
} = {}) {
  if (category !== 'All' && !categories.includes(category)) return false;
  if (audience !== 'All' && !audiences.includes(audience)) return false;
  if (collection !== 'All' && !shopCollections.some(item => item.id === collection)) return false;
  activeCategory = category;
  activeAudience = audience;
  activeCollection = collection;
  query = nextQuery;
  sort = sortOptions.some(([value]) => value === nextSort) ? nextSort : 'featured';
  view = viewOptions.includes(nextView) ? nextView : 'list';
  page = 1;
  openShopArchive();
  renderResults();
  writeStateToURL({ mode: 'push' });
  if (typeof CustomEvent === 'function') {
    document.dispatchEvent?.(new CustomEvent('fsd:navigation-active', { detail: { id: 'collections' } }));
  }
  document.querySelector('#products')?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
  focusResultCount();
  return true;
}

export function showProduct(id, { fromHistory = false, returnFocus = null } = {}) {
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
  const detail = (label, value) => value ? `<dt>${label}</dt><dd>${safe(value)}</dd>` : '';
  const confirmedAlias = /^confirmed\b/i.test(p.aliasStatus) ? p.alias : '';
  const images = isAegisPrivateProof(p)
    ? [{ label: 'Aegis campaign image', src: `${aegisGiletPreviewPath}media/front-three-quarter` }]
    : Array.isArray(p.images) ? p.images : [];
  const colourwayOptions = hardwarePreview ? [] : productColourwayOptions(p);
  const colourwayImageIndexes = colourwayOptions.map(option => imageIndexForColourway(images, option));
  const allColourwaysHaveImages = colourwayOptions.length > 1
    && images.length === colourwayOptions.length
    && colourwayImageIndexes.every(index => index >= 0)
    && new Set(colourwayImageIndexes).size === colourwayOptions.length;
  const initialImageIndex = allColourwaysHaveImages ? colourwayImageIndexes[0] : 0;
  const dialogBody = document.querySelector('#dialog-body');
  const initialImage = images[initialImageIndex];
  const detailRows = hardwarePreview
    ? detail('Category', p.category)
    : [
      detail('Colourways', p.colourways),
      detail('Audience', p.audience),
      detail('Collection line', p.collection),
      detail('Also shown in', p.alsoShowIn.join('; ')),
      detail('Also appears as', confirmedAlias),
      detail('Coverage', p.coverage),
      detail('Set configuration', p.priceBasis),
    ].join('');
  const imageExperience = initialImage
    ? `<div class="catalogue-selector__visual">
        <figure class="catalogue-selector__main" aria-live="polite">
          <div class="catalogue-selector__image-stage">
          <img class="mapped-gallery-image" data-mapped-gallery-active="true" data-catalogue-main-image
            src="${safe(initialImage.src)}" alt="${safe(p.name)} — ${safe(initialImage.label)}"
            loading="eager" fetchpriority="high" decoding="async"/>
          </div>
          <figcaption data-catalogue-main-caption>${safe(initialImage.label)}</figcaption>
        </figure>
        ${images.length > 1 && !allColourwaysHaveImages ? `<div class="catalogue-selector__thumbs" role="group" aria-label="Select an image view of ${safe(p.name)}">
          ${images.map((image, index) => `<button type="button" class="catalogue-selector__thumb"
            data-catalogue-image-index="${index}" aria-label="Show ${safe(image.label)}"
            aria-pressed="${index === initialImageIndex}">
            <img src="${safe(image.src)}" alt="" loading="lazy"/><span>${safe(image.label)}</span>
          </button>`).join('')}
        </div>` : ''}
      </div>`
    : `<div class="catalogue-selector__visual catalogue-selector__visual--empty">${imagePlaceholder(p)}</div>`;
  dialogBody.innerHTML = `${imageExperience}<div class="dialog-copy">
    <nav class="catalogue-breadcrumbs" aria-label="Breadcrumb"><ol>
      <li><a href="#home" data-home-breadcrumb>Home</a></li>
      <li><a href="#products" data-shop-breadcrumb>Shop</a></li>
      <li><a href="#products" data-category-link="${safe(p.category)}">${safe(p.category)}</a></li>
      <li aria-current="page">${safe(p.name)}</li>
    </ol></nav>
    <button class="catalogue-back" type="button" data-catalogue-back><span aria-hidden="true">←</span> BACK TO COLLECTION</button>
     <p class="section-kicker">${safe(p.category)} / COLLECTION</p><h2 id="product-title">${safe(p.name)}</h2>
    <dl class="catalogue-details">
      ${detailRows}
      </dl>
       ${colourwayOptions.length > 1 ? `<fieldset class="catalogue-colourway-selector">
         <legend>COLOURWAY</legend>
         <div class="catalogue-colourway-selector__options" role="group" aria-label="Choose a colourway">
           ${colourwayOptions.map((option, index) => {
             const swatch = imageSwatchBackground(option);
             return `<button type="button" data-catalogue-colourway-index="${index}"
               data-catalogue-colourway-image-index="${colourwayImageIndexes[index]}"
               aria-pressed="${index === 0}">
               ${swatch ? `<span class="catalogue-swatch-dot" aria-hidden="true" style="--catalogue-swatch:${safe(swatch)}"></span>` : ''}
               <span>${safe(option)}</span>
             </button>`;
           }).join('')}
         </div>
         <p data-catalogue-selected-colourway aria-live="polite">${safe(colourwayOptions[0])}</p>
       </fieldset>` : ''}
      ${hardwarePreview ? '' : `<div data-product-specifications-root data-product-id="${safe(p.id)}"></div>`}
      ${price.label || price.value ? `<div class="dialog-price">${price.label ? `<span>${price.label}</span>` : ''}${price.value ? `<strong>${price.value}</strong>` : ''}</div>` : ''}
     ${!hardwarePreview && canShowBagAction(p) ? `<button class="catalogue-bag-add" type="button" data-bag-add="${p.id}" aria-label="Add ${safe(p.name)} to bag">ADD TO BAG</button>` : ''}
    </div>`;
  if (!hardwarePreview && typeof document.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
    document.dispatchEvent(new CustomEvent('fsd:product-specifications-open', {
      detail: { productId: p.id },
    }));
  }
  document.documentElement?.classList?.add('fsd-modal-open');
  if (dialog && !dialog.open) dialog.showModal();
  dialog?.querySelector?.('#close-dialog')?.focus?.({ preventScroll: true });
  if (!fromHistory && dialog?.open) {
    trackEvent('product_detail_opened', {
      product_id: p.id,
      product_category: p.category,
    });
  }
}

function closeProductFromUI() {
  if (!activeDialogProduct) return;
  const dialog = document.querySelector('#product-dialog');
  if (isBrowser()) {
    const params = new URLSearchParams(window.location.search);
    const urlProduct = Number.parseInt(params.get('product') || '', 10);
    if (urlProduct === activeDialogProduct.id &&
        window.history.state?.fsdShop?.productId === activeDialogProduct.id) {
      window.history.back();
      return;
    }
    params.delete('product');
    const url = new URL(window.location.href);
    url.search = params.toString();
    window.history.replaceState({
      ...(window.history.state || {}),
      fsdShop: { ...currentState(), productId: null, scrollY: window.scrollY || 0 },
    }, '', url);
  }
  dialog?.close();
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
  dialog?.close();
}

function restoreFromURL({ scrollY } = {}) {
  const state = readStateFromURL();
  applyState(state);
  openShopArchive();
  const archive = document.querySelector('#catalogue-archive');
  const hasShopState = isBrowser() && [...new URLSearchParams(window.location.search).keys()]
    .some(key => ['category', 'audience', 'collection', 'q', 'sort', 'view', 'page', 'product'].includes(key));
  if (archive) archive.open = hasShopState || (isBrowser() && window.location.hash === '#products');
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
  const sortSelect = document.querySelector('#catalogue-sort');
  const search = document.querySelector('#search');
  const dialog = document.querySelector('#product-dialog');
  const dialogBody = document.querySelector('#dialog-body');
  const initialState = readStateFromURL();
  applyState(initialState);
  const initialShopState = isBrowser() && [...new URLSearchParams(window.location.search).keys()]
    .some(key => ['category', 'audience', 'collection', 'q', 'sort', 'view', 'page', 'product'].includes(key));
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

  const selectDialogImage = index => {
    const image = activeDialogProduct?.images?.[index];
    const mainImage = dialogBody.querySelector('[data-catalogue-main-image]');
    const caption = dialogBody.querySelector('[data-catalogue-main-caption]');
    if (!image || !mainImage || !caption) return;
    crossfadeMappedImage(mainImage, image.src, `${activeDialogProduct.name} — ${image.label}`);
    caption.textContent = image.label;
    dialogBody.querySelectorAll('[data-catalogue-image-index]').forEach(button => {
      button.setAttribute('aria-pressed', String(Number(button.dataset?.catalogueImageIndex) === index));
    });
    const matchedColourway = productColourwayOptions(activeDialogProduct)
      .findIndex(option => imageIndexForColourway(activeDialogProduct.images, option) === index);
    if (matchedColourway >= 0) {
      dialogBody.querySelectorAll('[data-catalogue-colourway-index]').forEach(button => {
        button.setAttribute('aria-pressed', String(Number(button.dataset?.catalogueColourwayIndex) === matchedColourway));
      });
      const selectedColourway = dialogBody.querySelector('[data-catalogue-selected-colourway]');
      if (selectedColourway) selectedColourway.textContent = productColourwayOptions(activeDialogProduct)[matchedColourway];
    }
  };

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

  document.addEventListener('click', event => {
    const colourwayButton = event.target.closest('[data-catalogue-colourway-index]');
    if (colourwayButton && dialogBody.contains(colourwayButton) && activeDialogProduct) {
      const index = Number(colourwayButton.dataset.catalogueColourwayIndex);
      const colourway = productColourwayOptions(activeDialogProduct)[index];
      if (!colourway) return;
      dialogBody.querySelectorAll('[data-catalogue-colourway-index]').forEach(button => {
        button.setAttribute('aria-pressed', String(button === colourwayButton));
      });
      const selectedColourway = dialogBody.querySelector('[data-catalogue-selected-colourway]');
      if (selectedColourway) selectedColourway.textContent = colourway;
      const imageIndex = Number(colourwayButton.dataset.catalogueColourwayImageIndex);
      if (imageIndex >= 0) selectDialogImage(imageIndex);
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
      onAddToBag(Number(bagButton.dataset.bagAdd));
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
      view = viewOptions.includes(viewButton.dataset.catalogueView) ? viewButton.dataset.catalogueView : 'list';
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
    const productDialog = document.querySelector('#product-dialog');
    const hasOpenParentDialog = [...document.querySelectorAll('dialog[open]')]
      .some(openDialog => openDialog !== productDialog);
    if (!productDialog?.open || !hasOpenParentDialog) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    closeProductFromUI();
  }, true);
  dialog.addEventListener('close', () => {
    const productId = activeDialogProduct?.id;
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
    const restoreFocus = () => focusTarget?.focus?.({ preventScroll: true });
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
