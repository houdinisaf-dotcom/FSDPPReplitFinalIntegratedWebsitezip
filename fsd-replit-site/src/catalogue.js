import { categories, products, filterProducts, priceInfo, safe } from './catalogue-data.js';

const pageSize = 12;
let activeCategory = 'All';
let query = '';
let page = 1;

function imagePlaceholder(product) {
  const label = product.imageStatus.startsWith('Image exists')
    ? 'Concept image mapping pending'
    : product.imageStatus.startsWith('Brief only') ? 'Image under review' : 'Imagery to follow';
  return `<div class="catalogue-placeholder"><span>FSD / PRE-LAUNCH</span>
    <strong>${safe(product.category)}</strong><small>${label}</small></div>`;
}

function card(product) {
  const price = priceInfo(product);
  const image = product.images[0];
  return `<article class="product-card">
    <div class="product-image">${image
      ? `<img loading="lazy" src="${safe(image.src)}" alt="${safe(product.name)} — ${safe(image.label)}; design concept"/>`
      : imagePlaceholder(product)}<span class="chip">PRE-LAUNCH</span></div>
    <div class="product-meta"><span>${safe(product.category)}</span><span>${safe(product.audience)}</span></div>
    <h3>${safe(product.name)}</h3>
    <p class="catalogue-colourways">${safe(product.colourways || 'Colourways to be confirmed')}</p>
    <div class="catalogue-price"><span>${price.label}</span><strong>${price.value}</strong></div>
    ${product.priceBasis ? `<p class="catalogue-colourways">${safe(product.priceBasis)}</p>` : ''}
    ${product.specificationStatus ? `<p class="catalogue-colourways">${safe(product.specificationStatus)}</p>` : ''}
    <button class="text-link" data-product="${product.id}">VIEW DETAILS ↗<span class="sr-only"> for ${safe(product.name)}</span></button>
  </article>`;
}

export function catalogueSection() {
  return `<section class="shop" id="products">
    <div class="section-heading"><div><p class="section-kicker">THE FSD MASTER COLLECTION</p>
      <h2>THE PRODUCT EDIT<span class="period">.</span></h2></div>
      <p>${products.length} products across ${categories.length} categories.<br/>
      Confirmed and suggested list prices are labelled separately.</p></div>
    <div class="toolbar catalogue-toolbar">
      <label>Collection<select id="catalogue-category" aria-label="Filter by category">
        <option value="All">All categories</option>
        ${categories.map(c => `<option value="${safe(c)}">${safe(c)}</option>`).join('')}
      </select></label>
      <label>Find a product<input id="search" type="search" placeholder="Name, colourway or alternate name…" aria-label="Search products"/></label>
    </div>
    <p id="catalogue-count" class="catalogue-count" role="status" aria-live="polite"></p>
    <div class="product-grid" id="catalogue-grid"></div>
    <nav class="catalogue-pagination" id="catalogue-pagination" aria-label="Product catalogue pages"></nav>
    <p class="disclaimer">Products are not available to order.
    Confirmed prices are those recorded in the master list; suggested prices still require approval.
    Images are concept references, not evidence of stock or verified performance. Colourways are grouped under one product.</p>
  </section>`;
}

export function roadmapSection() {
  return `<section class="planned" id="planned"><div class="section-heading"><div>
    <p class="section-kicker">THE FSD DEVELOPMENT ROADMAP</p><h2>WHAT'S COMING<span class="period">.</span></h2>
    </div><p>Explore the collection by category. Cross-listed products remain a single product record.<br/>
    Nothing shown is available for immediate purchase.</p></div><div class="planned-grid">
    ${categories.map((category, i) => `<a class="planned-row catalogue-category-link" href="#products" data-category-link="${safe(category)}">
      <span>${String(i + 1).padStart(2, '0')}</span><div><strong>${safe(category)}</strong>
      <small>${filterProducts(category).length} products</small></div><span class="planned-status">EXPLORE ↗</span></a>`).join('')}
    </div></section>`;
}

export function innovationsSection() {
  const innovations = products.filter(p => p.category === 'Smart Tech');
  return `<section class="fsd-expanded" id="innovations"><div class="section-heading"><div>
    <p class="section-kicker">FUTURE INNOVATIONS / PROPOSED PRODUCTS</p><h2>BEYOND APPAREL<span class="period">.</span></h2>
    </div><p>Smart Tech concepts from the master list. Capabilities, imagery and specifications require validation.</p></div>
    <div class="planned-grid">${innovations.map(p => `<div class="planned-row"><span>↗</span><div>
      <strong>${safe(p.name)}</strong><small>CONCEPT · PRICE AND SPECIFICATIONS TO BE CONFIRMED</small>
      </div><button class="text-link" data-product="${p.id}">DETAILS<span class="sr-only"> for ${safe(p.name)}</span></button></div>`).join('')}</div>
    <p class="disclaimer">Names describe working concepts, not verified capabilities. No health or performance claims are made.</p>
    </section>`;
}

function renderResults() {
  const filtered = filterProducts(activeCategory, query);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  page = Math.min(page, totalPages);
  const start = (page - 1) * pageSize;
  document.querySelector('#catalogue-count').textContent = filtered.length
    ? `Showing ${start + 1}–${Math.min(start + pageSize, filtered.length)} of ${filtered.length} products`
    : 'No matching products';
  document.querySelector('#catalogue-grid').innerHTML = filtered.length
    ? filtered.slice(start, start + pageSize).map(card).join('')
    : '<div class="empty"><p>No products match this search.</p><button class="filter" data-clear-filters>Clear filters</button></div>';
  document.querySelector('#catalogue-pagination').innerHTML = filtered.length && totalPages > 1
    ? `<button class="filter" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}>Previous</button>
      <span>Page ${page} of ${totalPages}</span>
      <button class="filter" data-page="${page + 1}" ${page === totalPages ? 'disabled' : ''}>Next</button>`
    : '';
}

function showProduct(id) {
  const p = products.find(product => product.id === id);
  if (!p) return;
  const price = priceInfo(p);
  const detail = (label, value) => value ? `<dt>${label}</dt><dd>${safe(value)}</dd>` : '';
  document.querySelector('#dialog-body').innerHTML = `<div class="catalogue-dialog-images">${p.images.length
    ? p.images.map(image => `<figure><img src="${safe(image.src)}" alt="${safe(p.name)} — ${safe(image.label)}; design concept"/><figcaption>${safe(image.label)}</figcaption></figure>`).join('')
    : imagePlaceholder(p)}</div><div class="dialog-copy">
    <p class="section-kicker">${safe(p.category)} / PRE-LAUNCH</p><h2 id="product-title">${safe(p.name)}</h2>
    <dl class="catalogue-details">
      ${detail('Colourways', p.colourways || 'To be confirmed')}
      ${detail('Audience', p.audience)}
      ${detail('Collection line', p.collection)}
      ${detail('Also shown in', p.alsoShowIn.join('; '))}
      ${detail(p.aliasStatus ? `Also appears as · ${safe(p.aliasStatus)}` : 'Also appears as · identity to confirm', p.alias)}
      ${detail('Coverage', p.coverage)}
      ${detail('Development specifications', p.specifications)}
      ${detail('Specification status', p.specificationStatus)}
      ${detail('Price basis', p.priceBasis)}
      ${detail('Image status in master list', p.imageStatus)}
      ${detail('Development notes', p.notes)}
    </dl><div class="dialog-price"><span>${price.label}</span><strong>${price.value}</strong></div>
    <small>This is a development record, not a product available to purchase. Specifications and launch availability are not confirmed.</small>
    </div>`;
  document.querySelector('#product-dialog').showModal();
}

export function initCatalogue() {
  const category = document.querySelector('#catalogue-category');
  const search = document.querySelector('#search');
  category.addEventListener('change', () => {
    activeCategory = category.value;
    page = 1;
    renderResults();
  });
  search.addEventListener('input', () => {
    query = search.value;
    page = 1;
    renderResults();
  });
  document.addEventListener('click', event => {
    const product = event.target.closest('[data-product]');
    if (product) showProduct(Number(product.dataset.product));
    const categoryLink = event.target.closest('[data-category-link]');
    if (categoryLink) {
      activeCategory = categoryLink.dataset.categoryLink;
      category.value = activeCategory;
      query = search.value = '';
      page = 1;
      renderResults();
    }
    const pageButton = event.target.closest('[data-page]');
    if (pageButton && !pageButton.disabled) {
      page = Number(pageButton.dataset.page);
      renderResults();
      document.querySelector('#products').scrollIntoView({ block: 'start' });
      document.querySelector('#catalogue-count').setAttribute('tabindex', '-1');
      document.querySelector('#catalogue-count').focus({ preventScroll: true });
    }
    if (event.target.closest('[data-clear-filters]')) {
      activeCategory = category.value = 'All';
      query = search.value = '';
      page = 1;
      renderResults();
      search.focus();
    }
  });
  document.querySelector('#close-dialog').addEventListener('click', () => document.querySelector('#product-dialog').close());
  renderResults();
}
