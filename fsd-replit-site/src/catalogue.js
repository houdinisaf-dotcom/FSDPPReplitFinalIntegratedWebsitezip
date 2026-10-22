import { audiences, categories, products, productsWithUsableImages, filterProducts, priceInfo, safe, shopCollections } from './catalogue-data.js';

const pageSize = 12;
let activeCategory = 'All';
let activeAudience = 'All';
let activeCollection = 'All';
let query = '';
let sort = 'featured';
let view = 'grid';
let page = 1;
let activeDialogProduct = null;
let dialogReturnFocus = null;
let searchEditing = false;
let searchCommitTimer = null;

const sortOptions = [
  ['featured', 'Featured'],
  ['name-asc', 'Name A–Z'],
  ['price-asc', 'Price: low to high'],
  ['price-desc', 'Price: high to low'],
];
const viewOptions = ['grid', 'visual'];
const imageReadyProductIds = new Set(productsWithUsableImages.map(product => String(product.id)));
const failedProductImageIds = new Set();
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
    view: viewOptions.includes(requestedView) ? requestedView : 'grid',
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
    ['view', view, 'grid'],
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
      const aPrice = a.confirmedPrice ?? a.suggestedPrice;
      const bPrice = b.confirmedPrice ?? b.suggestedPrice;
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
  const hasOtherState = sort !== 'featured' || view !== 'grid';
  const wrapper = document.querySelector('#catalogue-active-filters');
  if (!wrapper) return;
  wrapper.innerHTML = chips.length || hasOtherState
    ? `<div class="catalogue-chip-list" aria-label="Active filters">
        ${chips.map(([key, value, label]) => `<button type="button" class="catalogue-chip" data-remove-filter="${safe(key)}" data-filter-value="${safe(value)}">
          ${safe(label)} <span aria-hidden="true">×</span><span class="sr-only">Remove filter</span>
        </button>`).join('')}
        ${hasOtherState ? `<span class="catalogue-view-state">${sort !== 'featured' ? `SORT: ${safe(sortOptions.find(([value]) => value === sort)?.[1] || sort)}` : ''}${view === 'visual' ? ' · VISUAL VIEW' : ''}</span>` : ''}
        <button type="button" class="catalogue-clear-all" data-clear-filters>Clear all</button>
      </div>`
    : '';
}

function imagePlaceholder(product, failed = false) {
  return `<div class="catalogue-placeholder" role="status">
    <strong>${failed ? 'This product image could not be loaded.' : 'A product image is not shown for this item.'}</strong>
    <small>${safe(product.category)}</small></div>`;
}

function displayPrice(product) {
  const price = priceInfo(product);
  return Number(product.id) === 43
    ? { ...price, label: 'Reference only · not for sale' }
    : price;
}

function card(product) {
  const price = displayPrice(product);
  const image = product.images[0];
  return `<article class="product-card">
    <div class="product-image">${image
      ? `<img data-catalogue-card-image="${product.id}" loading="lazy" src="${safe(image.src)}" alt="${safe(product.name)} — ${safe(image.label)}; design concept"/>`
      : imagePlaceholder(product)}<span class="chip">PREVIEW</span></div>
    <div class="product-meta"><span>${safe(product.category)}</span><span>${safe(product.audience)}</span></div>
    <h3>${safe(product.name)}</h3>
     ${product.colourways ? `<p class="catalogue-colourways">${safe(product.colourways)}</p>` : ''}
    <div class="catalogue-price">${price.label ? `<span>${price.label}</span>` : ''}<strong>${price.value}</strong></div>
    ${product.priceBasis ? `<p class="catalogue-colourways">${safe(product.priceBasis)}</p>` : ''}
    <button class="text-link" data-product="${product.id}">VIEW DETAILS ↗<span class="sr-only"> for ${safe(product.name)}</span></button>
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
      <div class="catalogue-control-bottom">
        <div class="catalogue-view-controls" role="group" aria-label="Product display">
          <span>VIEW</span>
          <button type="button" data-catalogue-view="grid" aria-pressed="true">Grid</button>
          <button type="button" data-catalogue-view="visual" aria-pressed="false">Visual</button>
        </div>
        <div id="catalogue-active-filters"></div>
      </div>
    </div>
    <p id="catalogue-count" class="catalogue-count" role="status" aria-live="polite"></p>
    <div class="product-grid" id="catalogue-grid" data-view="grid"></div>
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
    <p class="section-kicker">FUTURE INNOVATIONS / SMART TECH</p><h2>BEYOND APPAREL<span class="period">.</span></h2>
    </div><p>Ideas for future FSD training technology.</p></div>
    <div class="planned-grid">${innovations.map(p => `<div class="planned-row"><span>↗</span><div>
       <strong>${safe(p.name)}</strong><small>FSD SMART TECH CONCEPT</small>
      </div><button class="text-link" data-product="${p.id}">DETAILS<span class="sr-only"> for ${safe(p.name)}</span></button></div>`).join('')}</div>
     <p class="disclaimer">Ideas shown as part of the FSD innovation collection.</p>
    </section>`;
}

function renderResults() {
  const filtered = sortedProducts(filterProducts(activeCategory, query, activeAudience, activeCollection)
    .filter(product => imageReadyProductIds.has(String(product.id)) && !failedProductImageIds.has(String(product.id))));
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
  if (!keepView) view = 'grid';
  page = 1;
}

export function navigateCatalogue({
  category = 'All',
  audience = 'All',
  collection = 'All',
  query: nextQuery = '',
  sort: nextSort = 'featured',
  view: nextView = 'grid',
} = {}) {
  if (category !== 'All' && !categories.includes(category)) return false;
  if (audience !== 'All' && !audiences.includes(audience)) return false;
  if (collection !== 'All' && !shopCollections.some(item => item.id === collection)) return false;
  activeCategory = category;
  activeAudience = audience;
  activeCollection = collection;
  query = nextQuery;
  sort = sortOptions.some(([value]) => value === nextSort) ? nextSort : 'featured';
  view = viewOptions.includes(nextView) ? nextView : 'grid';
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

export function showProduct(id, { fromHistory = false } = {}) {
  const p = products.find(product => product.id === id);
  if (!p) return;
  const dialog = document.querySelector('#product-dialog');
  if (!fromHistory && isBrowser()) {
    const currentProductId = Number.parseInt(new URLSearchParams(window.location.search).get('product') || '', 10);
    if (currentProductId !== p.id) {
      openShopArchive();
      writeStateToURL({ mode: 'push', productId: p.id });
    }
  }
  if (!activeDialogProduct) dialogReturnFocus = document.activeElement;
  activeDialogProduct = p;
  const price = displayPrice(p);
  const detail = (label, value) => value ? `<dt>${label}</dt><dd>${safe(value)}</dd>` : '';
  const confirmedAlias = /^confirmed\b/i.test(p.aliasStatus) ? p.alias : '';
  const displaySpecifications = p.specificationStatus ? '' : p.specifications;
  const images = Array.isArray(p.images) ? p.images : [];
  const initialImage = images[0];
  const imageExperience = initialImage
    ? `<div class="catalogue-selector__visual">
        <figure class="catalogue-selector__main" aria-live="polite">
          <img data-catalogue-main-image src="${safe(initialImage.src)}"
            alt="${safe(p.name)} — ${safe(initialImage.label)}; design concept"/>
          <figcaption data-catalogue-main-caption>${safe(initialImage.label)}</figcaption>
        </figure>
        ${images.length > 1 ? `<div class="catalogue-selector__thumbs" role="group" aria-label="Select an image of ${safe(p.name)}">
          ${images.map((image, index) => `<button type="button" class="catalogue-selector__thumb"
            data-catalogue-image-index="${index}" aria-label="Show ${safe(image.label)}"
            aria-pressed="${index === 0}">
            <img src="${safe(image.src)}" alt="" loading="lazy"/><span>${safe(image.label)}</span>
          </button>`).join('')}
        </div>` : ''}
      </div>`
    : `<div class="catalogue-selector__visual catalogue-selector__visual--empty">${imagePlaceholder(p)}</div>`;
  document.querySelector('#dialog-body').innerHTML = `${imageExperience}<div class="dialog-copy">
    <nav class="catalogue-breadcrumbs" aria-label="Breadcrumb"><ol>
      <li><a href="#home" data-home-breadcrumb>Home</a></li>
      <li><a href="#products" data-shop-breadcrumb>Shop</a></li>
      <li><a href="#products" data-category-link="${safe(p.category)}">${safe(p.category)}</a></li>
      <li aria-current="page">${safe(p.name)}</li>
    </ol></nav>
    <button class="catalogue-back" type="button" data-catalogue-back><span aria-hidden="true">←</span> BACK TO COLLECTION</button>
     <p class="section-kicker">${safe(p.category)} / COLLECTION</p><h2 id="product-title">${safe(p.name)}</h2>
    <dl class="catalogue-details">
      ${detail('Colourways', p.colourways)}
      ${detail('Audience', p.audience)}
      ${detail('Collection line', p.collection)}
      ${detail('Also shown in', p.alsoShowIn.join('; '))}
      ${detail('Also appears as', confirmedAlias)}
      ${detail('Coverage', p.coverage)}
      ${detail('Specifications', displaySpecifications)}
      ${detail('Price basis', p.priceBasis)}
     </dl><div class="dialog-price">${price.label ? `<span>${price.label}</span>` : ''}<strong>${price.value}</strong></div>
    </div>`;
  document.documentElement?.classList?.add('fsd-modal-open');
  if (dialog && !dialog.open) dialog.showModal();
  dialog?.querySelector?.('#close-dialog')?.focus?.({ preventScroll: true });
}

function closeProductFromUI() {
  if (!activeDialogProduct) return;
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
  document.querySelector('#product-dialog')?.close();
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

export function initCatalogue({ onProductSelect = showProduct } = {}) {
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
    const imageButton = event.target.closest('[data-catalogue-image-index]');
    if (imageButton && dialogBody.contains(imageButton) && activeDialogProduct) {
      const index = Number(imageButton.dataset.catalogueImageIndex);
      const image = activeDialogProduct.images?.[index];
      if (image) {
        const mainImage = dialogBody.querySelector('[data-catalogue-main-image]');
        const caption = dialogBody.querySelector('[data-catalogue-main-caption]');
        if (mainImage && caption) {
          mainImage.src = image.src;
          mainImage.alt = `${activeDialogProduct.name} — ${image.label}; design concept`;
          caption.textContent = image.label;
          dialogBody.querySelectorAll('[data-catalogue-image-index]').forEach(button => {
            button.setAttribute('aria-pressed', String(button === imageButton));
          });
        }
      }
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
    const product = event.target.closest('[data-product]');
    if (product) {
      onProductSelect(Number(product.dataset.product));
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
      view = viewOptions.includes(viewButton.dataset.catalogueView) ? viewButton.dataset.catalogueView : 'grid';
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
  document.addEventListener('error', event => {
    const image = event.target.closest?.('[data-catalogue-card-image]');
    if (!image) return;
    failedProductImageIds.add(String(image.dataset.catalogueCardImage));
    renderResults();
  }, true);
  document.querySelector('#close-dialog').addEventListener('click', closeProductFromUI);
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    closeProductFromUI();
  });
  dialog.addEventListener('click', event => {
    if (event.target === dialog) closeProductFromUI();
  });
  dialog.addEventListener('close', () => {
    const productId = activeDialogProduct?.id;
    const focusTarget = dialogReturnFocus?.isConnected
      ? dialogReturnFocus
      : productId
        ? document.querySelector(`#catalogue-grid [data-product="${productId}"]`)
        : null;
    activeDialogProduct = null;
    document.documentElement?.classList?.remove('fsd-modal-open');
    focusTarget?.focus?.({ preventScroll: true });
    dialogReturnFocus = null;
  });
  if (isBrowser()) window.addEventListener('popstate', event => restoreFromURL({
    scrollY: event.state?.fsdShop?.scrollY,
  }));
  renderResults();
  if (initialState.productId && products.some(product => product.id === initialState.productId)) {
    showProduct(initialState.productId, { fromHistory: true });
  }
}
