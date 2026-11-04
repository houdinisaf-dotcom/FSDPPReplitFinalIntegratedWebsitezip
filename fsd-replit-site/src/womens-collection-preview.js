import './draft-preview.css';
import './womens-collection-preview.css';
import { validateProofData } from './proof-data-validation.js';

const basePath = '/__catalogue-preview/fsd-womens-collection/';
const main = document.querySelector('#womens-review');
const errorMessage = document.querySelector('#preview-error');
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

function currentPage() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  const slug = parts.at(-1);
  return ['flex', 'zip-neck', 'breeze', 'references'].includes(slug) ? slug : null;
}

function renderHeaderLinks(links) {
  return `
    <nav class="proof-links" aria-label="Private product proofs">
      <a href="${escapeHtml(links.flex)}">FSD FLEX</a>
      <a href="${escapeHtml(links.zipNeck)}">ZIP-NECK TOP</a>
      <a href="${escapeHtml(links.breeze)}">FSD BREEZE</a>
      <a href="${basePath}references/">IMAGE AUDIT</a>
    </nav>`;
}

function renderProduct(data) {
  const product = data.product;
  const price = product.price;
  main.innerHTML = `
    <section class="review-intro womens-intro">
      <p class="eyebrow">WOMEN’S COLLECTION / PRIVATE PRODUCT PROOF</p>
      <div class="intro-row">
        <h1 id="product-title">${escapeHtml(product.brand)}<br/><span>${escapeHtml(product.title)}</span></h1>
        <p class="intro-note">Visual and layout review only.<br/>No product can be ordered.</p>
      </div>
      <p class="draft-status">${escapeHtml(product.description)}</p>
      ${renderHeaderLinks(data.links)}
    </section>

    <section class="womens-product-gallery" aria-labelledby="gallery-heading">
      <div class="section-heading">
        <div><p class="eyebrow">SUPPLIED PHOTOGRAPHY</p><h2 id="gallery-heading">Product image gallery</h2></div>
        <span class="section-index" id="gallery-count"></span>
      </div>
      <div class="edition-layout womens-edition-layout">
        <div class="womens-gallery-column">
          <figure class="edition-frame womens-main-frame">
            <img id="main-image" class="edition-image" alt="" width="1122" height="1402" fetchpriority="high"/>
            <div id="gallery-empty" class="gallery-empty" hidden></div>
            <figcaption>
              <span>Selected image reference</span>
              <span id="selected-image-caption" class="selected-edition" aria-live="polite"></span>
            </figcaption>
          </figure>
          <div id="gallery-thumbnails" class="womens-thumbnails" role="group" aria-label="Select a product photograph"></div>
        </div>
        <aside class="selection-panel womens-selection-panel" aria-label="Product selection and price reference">
          <p class="eyebrow">${escapeHtml(product.category)}</p>
          <h3>${escapeHtml(product.brand)}</h3>
          <p class="womens-selection-title">${escapeHtml(product.title)}</p>
          <p class="selection-copy">Choose an image colour reference. Appearance and variant availability are not confirmed.</p>
          <div id="variant-options" class="edition-options womens-swatch-list" role="group" aria-label="Visual colour references"></div>
          <p id="variant-note" class="selection-status" role="status" aria-live="polite"></p>
          ${price.approvedForSale && price.display
            ? `<div class="womens-price-box"><span class="eyebrow">PRICE</span><strong>${escapeHtml(price.display)}</strong></div>`
            : ''}
          <p class="womens-no-order">Private review only · checkout and payments are disabled.</p>
        </aside>
      </div>
    </section>

    <section class="womens-detail-grid" aria-label="Product information">
      <article class="womens-detail-card">
        <p class="eyebrow">PRODUCT INFORMATION</p>
        <h2>Identity and imagery</h2>
        <p>${escapeHtml(product.identityNote)}</p>
        <p class="womens-status-line"><span class="status-dot" aria-hidden="true"></span>${escapeHtml(product.brandReviewStatus)}</p>
      </article>
      <article class="womens-detail-card">
        <p class="eyebrow">BENEFITS</p>
        <h2>Pending verification</h2>
        <p>${escapeHtml(product.benefitsNote)}</p>
      </article>
    </section>

    <section class="womens-specifications" aria-labelledby="specifications-heading">
      <div class="section-heading">
        <div><p class="eyebrow">PRODUCT DETAILS</p><h2 id="specifications-heading">Specifications</h2></div>
        <span class="section-index">AWAITING VERIFICATION</span>
      </div>
      <dl class="womens-spec-list">
        ${product.specifications.map(item => `
          <div><dt>${escapeHtml(item.label)}</dt><dd>${escapeHtml(item.value)}</dd></div>
        `).join('')}
      </dl>
    </section>

    <section class="womens-image-audit-callout">
      <p class="eyebrow">IMAGE AND BRAND REVIEW</p>
      <p>Source photographs are shown without edits. Composite boards and uncertain references are kept separate from this product gallery.</p>
      <a class="womens-audit-link" href="${basePath}references/">Review excluded images and audit notes <span aria-hidden="true">↗</span></a>
    </section>
    <footer class="review-footer"><span>FSD / WOMEN’S COLLECTION</span><span>PRIVATE REVIEW · NO ORDERING</span></footer>`;

  const image = document.querySelector('#main-image');
  const emptyState = document.querySelector('#gallery-empty');
  const thumbnails = document.querySelector('#gallery-thumbnails');
  const variants = document.querySelector('#variant-options');
  const variantNote = document.querySelector('#variant-note');
  const caption = document.querySelector('#selected-image-caption');
  const galleryCount = document.querySelector('#gallery-count');

  function selectImage(selected, variant) {
    image.hidden = false;
    emptyState.hidden = true;
    image.src = selected.src;
    image.alt = selected.alt;
    caption.textContent = `IMAGE ${String(selected.index).padStart(2, '0')} · ${variant.label}`;
    thumbnails.querySelectorAll('.womens-thumbnail').forEach(button => {
      const isCurrent = button.dataset.imageId === selected.id;
      button.setAttribute('aria-pressed', String(isCurrent));
    });
  }

  function selectVariant(variant, button) {
    variants.querySelectorAll('.womens-swatch').forEach(item => {
      item.setAttribute('aria-pressed', String(item === button));
    });
    variantNote.textContent = `${variant.sourceLabel}. ${variant.note}`;
    thumbnails.replaceChildren();
    galleryCount.textContent = `${variant.images.length} INDIVIDUAL PHOTO${variant.images.length === 1 ? '' : 'S'}`;
    if (variant.images.length === 0) {
      image.hidden = true;
      image.removeAttribute('src');
      caption.textContent = 'NO STANDALONE IMAGE SUPPLIED';
      emptyState.hidden = false;
      emptyState.textContent = 'No individual photograph is available for this visual reference. The composite source board is kept on the separate image audit page.';
      return;
    }
    variant.images.forEach((photo, index) => {
      const thumbnail = document.createElement('button');
      thumbnail.type = 'button';
      thumbnail.className = 'womens-thumbnail';
      thumbnail.dataset.imageId = photo.id;
      thumbnail.setAttribute('aria-label', `Show image ${photo.index}`);
      thumbnail.setAttribute('aria-pressed', String(index === 0));
      thumbnail.innerHTML = `<img src="${escapeHtml(photo.src)}" alt="" loading="lazy"/>`;
      thumbnail.addEventListener('click', () => selectImage(photo, variant));
      thumbnails.append(thumbnail);
    });
    selectImage(variant.images[0], variant);
  }

  product.variants.forEach((variant, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'womens-swatch';
    button.style.setProperty('--swatch', variant.swatch);
    button.setAttribute('aria-label', `${variant.label}. ${variant.sourceLabel}`);
    button.setAttribute('aria-pressed', 'false');
    button.dataset.variantId = variant.id;
    button.innerHTML = `<span class="swatch-disc" aria-hidden="true"></span><span class="swatch-label">${escapeHtml(variant.label)}</span><span class="swatch-index">${String(index + 1).padStart(2, '0')}</span>`;
    button.addEventListener('click', () => selectVariant(variant, button));
    variants.append(button);
  });
  if (product.variants[0]) {
    const firstButton = variants.querySelector('.womens-swatch');
    selectVariant(product.variants[0], firstButton);
  }
}

function renderAudit(data) {
  main.innerHTML = `
    <section class="review-intro womens-intro">
      <p class="eyebrow">WOMEN’S COLLECTION / SOURCE AUDIT</p>
      <div class="intro-row">
        <h1>Image audit<br/><span>and exclusions</span></h1>
        <p class="intro-note">Private review only.<br/>All original archive files remain unchanged.</p>
      </div>
      <p class="draft-status">53 supplied photographs reviewed. Individual product photographs are shown on the product proofs; duplicate, composite and unassigned references remain separate below.</p>
      ${renderHeaderLinks(data.links)}
      <div class="audit-summary">
        <span><strong>29</strong> individual photos used in proofs</span>
        <span><strong>${data.excludedOrUnassignedCount}</strong> duplicate, composite or unassigned references below</span>
      </div>
    </section>
    <section class="womens-audit-section" aria-labelledby="audit-heading">
      <div class="section-heading">
        <div><p class="eyebrow">REFERENCE IMAGES</p><h2 id="audit-heading">Held separate from product galleries</h2></div>
        <span class="section-index">SOURCE ORDER</span>
      </div>
      <div class="womens-audit-grid">
        ${data.references.map(reference => `
          <article class="womens-audit-card">
            <a class="womens-audit-image-link" href="${escapeHtml(reference.src)}" target="_blank" rel="noopener noreferrer" aria-label="View image ${String(reference.index).padStart(2, '0')} at full size">
              <img src="${escapeHtml(reference.src)}" alt="${escapeHtml(reference.alt)}" loading="lazy" width="${reference.width}" height="${reference.height}"/>
            </a>
            <div class="womens-audit-card-copy">
              <div class="audit-title-row"><span class="audit-number">IMAGE ${String(reference.index).padStart(2, '0')}</span><span class="audit-kind">${escapeHtml(reference.kind)}</span></div>
              <p class="audit-source-name">${escapeHtml(reference.sourceName)}</p>
              <p>${escapeHtml(reference.note)}</p>
              <small>${escapeHtml(reference.logoStatus)}</small>
            </div>
          </article>
        `).join('')}
      </div>
    </section>
    <section class="womens-image-audit-callout">
      <p class="eyebrow">SOURCE PRESERVATION</p>
      <p>The uploaded ZIP and its TIFF originals were not edited. Browser copies use separate WebP files; the six exact Modest Flow duplicates are displayed from their existing PNG files.</p>
    </section>
    <footer class="review-footer"><span>FSD / WOMEN’S COLLECTION</span><span>PRIVATE REVIEW · NO ORDERING</span></footer>`;
}

async function loadPage() {
  const slug = currentPage();
  if (!slug) throw new Error('Unknown private review page.');
  const response = await fetch(`${basePath}data/${slug}.json`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('The private review data could not be loaded.');
  const data = validateProofData(await response.json());
  if (data.checkoutEnabled !== false || data.paymentsEnabled !== false || data.publicationAuthorized !== false) {
    throw new Error('The private-review access safeguards are invalid.');
  }
  if (slug === 'references') renderAudit(data);
  else renderProduct(data);
}

loadPage().catch(error => {
  errorMessage.hidden = false;
  errorMessage.textContent = error.message || 'The private review could not be loaded.';
});
