import { categories, products, filterProducts, priceInfo, safe } from './catalogue-data.js';

const pageSize = 12;
let activeCategory = 'All';
let query = '';
let page = 1;
let activeDialogProduct = null;

function imagePlaceholder(product) {
  const label = product.imageStatus.startsWith('Image exists')
    ? ''
    : product.imageStatus.startsWith('Brief only') ? 'Visuals being finalised' : 'Imagery to follow';
  return `<div class="catalogue-placeholder"><span>FSD / COLLECTION</span>
    <strong>${safe(product.category)}</strong><small>${label}</small></div>`;
}

function card(product) {
  const price = priceInfo(product);
  const image = product.images[0];
  return `<article class="product-card">
    <div class="product-image">${image
      ? `<img loading="lazy" src="${safe(image.src)}" alt="${safe(product.name)} — ${safe(image.label)}; design concept"/>`
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
    <div class="section-heading"><div><p class="section-kicker">THE FSD MASTER COLLECTION</p>
      <h2>THE PRODUCT EDIT<span class="period">.</span></h2></div>
      <p>${products.length} products across ${categories.length} categories.<br/>
       Explore the collection by category and product.</p></div>
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
  </section>`;
}

export function roadmapSection() {
  return `<section class="planned" id="planned"><div class="section-heading"><div>
    <p class="section-kicker">THE FSD DEVELOPMENT ROADMAP</p><h2>WHAT'S COMING<span class="period">.</span></h2>
    </div><p>Explore the collection by category. Cross-listed products remain a single product record.</p></div><div class="planned-grid">
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

export function showProduct(id) {
  const p = products.find(product => product.id === id);
  if (!p) return;
  activeDialogProduct = p;
  const price = priceInfo(p);
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
  document.querySelector('#product-dialog').showModal();
}

export function initCatalogue({ onProductSelect = showProduct } = {}) {
  const category = document.querySelector('#catalogue-category');
  const search = document.querySelector('#search');
  const dialog = document.querySelector('#product-dialog');
  const dialogBody = document.querySelector('#dialog-body');
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
      dialog.close();
      return;
    }
    const product = event.target.closest('[data-product]');
    if (product) onProductSelect(Number(product.dataset.product));
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
  document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    activeDialogProduct = null;
    document.documentElement?.classList?.remove('fsd-modal-open');
  });
  renderResults();
}
