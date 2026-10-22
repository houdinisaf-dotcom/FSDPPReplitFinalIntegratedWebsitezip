import { collectionDivisions } from './collection-divisions.js';
import { products, priceInfo } from './catalogue-data.js';
import { renderNavigationHeader, mountNavigation } from './site-navigation.js';
import { bindCollectionReturn } from './collection-return.js';
import { aegisGiletPreviewRecord as preview } from './aegis-gilet-campaign.js';
import { aegisGiletPreviewPath } from './aegis-gilet-preview-path.js';
import approvedFsdHeaderLogo from '../brand-review/shield-refined-matte/assets/website-shield-lockup-defence.png';
import './site-navigation.css';
import './aegis-gilet-preview.css';

const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

const price = {
  ...priceInfo(preview.product),
  label: 'Catalogue reference',
};

const headerRoot = document.querySelector('#aegis-site-header');
headerRoot.innerHTML = renderNavigationHeader(
  `<img class="fsd-brand-logo" src="${approvedFsdHeaderLogo}" alt="" aria-hidden="true"/>`,
);

mountNavigation({
  root: headerRoot.querySelector('[data-navigation-shell]'),
  divisions: collectionDivisions,
  products,
  includeDraftPreviews: true,
  onNavigate({ item, group }) {
    if (item?.kind === 'draft-product' && item.href) {
      window.location.assign(item.href);
      return;
    }
    if (Number(item?.record?.id) === preview.product.id) {
      window.location.assign(aegisGiletPreviewPath);
      return;
    }
    const destination = item?.href || group?.href;
    if (destination?.startsWith('#')) {
      window.location.assign(`/${destination}`);
      return;
    }
    window.location.assign('/#collections');
  },
});

const galleryMarkup = preview.gallery.map(image => `
  <button class="aegis-gallery-thumb" type="button" data-aegis-thumb="${escapeHTML(image.id)}"
    aria-label="Show ${escapeHTML(image.label)}" aria-pressed="${image.id === preview.campaign.id}">
    <img src="${escapeHTML(image.src)}" alt="" width="${image.width}" height="${image.height}" loading="lazy"/>
    <span>${escapeHTML(image.label)}</span>
  </button>`).join('');

const root = document.querySelector('#aegis-gilet-root');
root.innerHTML = `
  <a class="fsd-collection-return" href="/#collections" data-collection-return>
    <span aria-hidden="true">←</span> BACK TO COLLECTION
  </a>
  <nav class="aegis-breadcrumb" aria-label="Breadcrumb">
    <a href="/#home">Home</a><span aria-hidden="true">›</span>
    <a href="/#collections">Women</a><span aria-hidden="true">›</span>
    <span>Modest Activewear</span><span aria-hidden="true">›</span>
    <span aria-current="page">${escapeHTML(preview.product.name)}</span>
  </nav>
  <div class="aegis-proof-label">
    <span>FSD / AEGIS</span>
    <span>WOMEN’S MODEST ACTIVEWEAR</span>
  </div>
  <section class="aegis-product-layout" aria-labelledby="aegis-gilet-title">
    <div class="aegis-gallery" aria-label="Aegis gilet image gallery">
      <figure class="aegis-gallery-figure">
        <button class="aegis-gallery-stage" type="button" data-aegis-enlarge aria-label="Enlarge selected Aegis visual">
          <img id="aegis-main-image" src="${escapeHTML(preview.campaign.src)}"
            alt="FSD Aegis modest outerwear campaign image"
            width="${preview.campaign.width}" height="${preview.campaign.height}" fetchpriority="high"/>
          <span class="aegis-enlarge-hint">ENLARGE IMAGE ↗</span>
        </button>
        <figcaption id="aegis-image-caption" aria-live="polite">${escapeHTML(preview.campaign.label)}</figcaption>
      </figure>
      <div class="aegis-gallery-thumbnails" data-aegis-thumbnails role="group" aria-label="Choose a gilet image">
        ${galleryMarkup}
      </div>
    </div>
    <div class="aegis-product-copy">
      <p class="aegis-product-kicker">FSD / WOMEN’S MODEST ACTIVEWEAR</p>
      <h1 id="aegis-gilet-title">${escapeHTML(preview.product.name)}</h1>
      <p class="aegis-product-status">PRE-LAUNCH CONCEPT</p>
      <p class="aegis-product-description">A visual concept for the FSD modest outerwear collection.</p>
      ${preview.product.colourways ? `<div class="aegis-product-option">
        <span class="aegis-product-label">Catalogue colour reference</span>
        <p class="aegis-product-colour"><span aria-hidden="true"></span>${escapeHTML(preview.product.colourways)}</p>
      </div>` : ''}
      <div class="aegis-product-price">
        <span>${escapeHTML(price.label)}</span><strong>${escapeHTML(price.value)}</strong>
      </div>
      <div class="aegis-accordions">
        <details>
          <summary>Materials, sizing and care</summary>
          <p>Product details will be updated before release.</p>
        </details>
        <details>
          <summary>Price and release</summary>
          <p>Price and release timing will be shared when confirmed.</p>
        </details>
      </div>
      <p class="aegis-disclaimer">Product details are being finalised.</p>
    </div>
  </section>
  <footer class="aegis-proof-footer">
    <span>FSD / AEGIS</span>
    <span>WOMEN’S MODEST ACTIVEWEAR</span>
  </footer>
  <dialog class="aegis-lightbox" id="aegis-image-lightbox" aria-label="Enlarged Aegis image">
    <button class="aegis-lightbox-close" type="button" data-aegis-lightbox-close aria-label="Close enlarged image">CLOSE ×</button>
    <img id="aegis-lightbox-image" alt=""/>
    <p id="aegis-lightbox-caption"></p>
  </dialog>`;

bindCollectionReturn(root);

const mainImage = root.querySelector('#aegis-main-image');
const caption = root.querySelector('#aegis-image-caption');
const lightbox = root.querySelector('#aegis-image-lightbox');
const lightboxImage = root.querySelector('#aegis-lightbox-image');
const lightboxCaption = root.querySelector('#aegis-lightbox-caption');
let selectedImage = preview.campaign;
let selectionRequest = 0;

root.querySelector('[data-aegis-thumbnails]').addEventListener('click', event => {
  const button = event.target.closest('[data-aegis-thumb]');
  if (!button) return;
  const image = preview.gallery.find(item => item.id === button.dataset.aegisThumb);
  if (!image || image.id === selectedImage.id) return;

  const request = ++selectionRequest;
  const preloaded = new Image();
  mainImage.classList.add('is-switching');
  preloaded.onload = () => {
    if (request !== selectionRequest) return;
    selectedImage = image;
    mainImage.src = image.src;
    mainImage.alt = image.alt;
    mainImage.width = image.width;
    mainImage.height = image.height;
    caption.textContent = image.label;
    root.querySelectorAll('[data-aegis-thumb]').forEach(thumb => {
      thumb.setAttribute('aria-pressed', String(thumb === button));
    });
    requestAnimationFrame(() => mainImage.classList.remove('is-switching'));
  };
  preloaded.onerror = () => {
    if (request === selectionRequest) mainImage.classList.remove('is-switching');
  };
  preloaded.src = image.src;
});

root.querySelector('[data-aegis-enlarge]').addEventListener('click', () => {
  lightboxImage.src = selectedImage.src;
  lightboxImage.alt = selectedImage.alt;
  lightboxCaption.textContent = selectedImage.label;
  if (!lightbox.open) lightbox.showModal();
});
root.querySelector('[data-aegis-lightbox-close]').addEventListener('click', () => lightbox.close());
lightbox.addEventListener('click', event => {
  if (event.target === lightbox) lightbox.close();
});
