import { collectionDivisions } from './collection-divisions.js';
import { products, priceInfo } from './catalogue-data.js';
import { renderNavigationHeader, mountNavigation } from './site-navigation.js';
import { createVelocityHijabPreview } from './velocity-hijab-campaign.js';
import { velocityHijabMediaPrefix, velocityHijabPreviewPath } from './velocity-hijab-preview-path.js';
import approvedFsdHeaderLogo from '../brand-review/shield-refined-matte/assets/website-shield-lockup-refined.png';

const preview = createVelocityHijabPreview();
const productPrice = priceInfo(preview.product);
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

const headerRoot = document.querySelector('#velocity-hijab-site-header');
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
    if (item?.record?.id === preview.product.id) {
      window.location.assign(velocityHijabPreviewPath);
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

const asset = id => preview.gallery.find(image => image.id === id);
const imageSource = image => escapeHTML(image.src);
const galleryMarkup = preview.gallery.map(image => `
  <button class="velocity-gallery-thumb" type="button" data-hijab-thumb="${escapeHTML(image.id)}"
    aria-label="Show ${escapeHTML(image.label)}" aria-pressed="${image.id === 'campaign'}">
    <img src="${imageSource(image)}" alt="" loading="${image.id === 'campaign' ? 'eager' : 'lazy'}"/>
    <span>${escapeHTML(image.label)}</span>
  </button>`).join('');
const featureMarkup = preview.features.map(feature => `
  <li class="velocity-feature">
    <span class="velocity-feature-mark" aria-hidden="true"></span>
    <div><strong>${escapeHTML(feature.title)}</strong><p>${escapeHTML(feature.text)}</p></div>
  </li>`).join('');
const campaign = asset('campaign');
const frontDetail = asset('front-detail');
const rearView = asset('rear-view');
const root = document.querySelector('#velocity-hijab-root');

root.innerHTML = `
  <nav class="velocity-hijab-breadcrumb" aria-label="Breadcrumb">
    <a href="/#home">Home</a><span aria-hidden="true">›</span>
    <a href="/#collections">Women</a><span aria-hidden="true">›</span>
    <span>Accessories</span><span aria-hidden="true">›</span>
    <span aria-current="page">${escapeHTML(preview.product.name)}</span>
  </nav>
  <div class="velocity-hijab-proof-label"><span>FSD / PRIVATE PRODUCT PREVIEW</span><span>PRE-LAUNCH · NOT AVAILABLE TO PURCHASE</span></div>
  <section class="velocity-hijab-layout" aria-labelledby="velocity-hijab-title">
    <div class="velocity-gallery" aria-label="Product image gallery">
      <div class="velocity-gallery-mosaic">
        <figure class="velocity-gallery-main">
          <img id="velocity-gallery-main-image" src="${imageSource(campaign)}"
            alt="${escapeHTML(campaign.alt)}" fetchpriority="high"/>
          <figcaption id="velocity-gallery-caption" aria-live="polite">${escapeHTML(campaign.label)}</figcaption>
        </figure>
        <figure class="velocity-gallery-support">
          <img src="${imageSource(frontDetail)}" alt="${escapeHTML(frontDetail.alt)}" loading="lazy"/>
          <figcaption>${escapeHTML(frontDetail.label)}</figcaption>
        </figure>
        <figure class="velocity-gallery-support">
          <img src="${imageSource(rearView)}" alt="${escapeHTML(rearView.alt)}" loading="lazy"/>
          <figcaption>${escapeHTML(rearView.label)}</figcaption>
        </figure>
      </div>
      <div class="velocity-gallery-thumbnails" role="group" aria-label="Choose a product image">${galleryMarkup}</div>
      <p class="velocity-gallery-note">${escapeHTML(preview.sideViewNote)}</p>
    </div>
    <div class="velocity-product-copy">
      <p class="velocity-product-kicker">FSD / WOMEN’S MODEST PERFORMANCE</p>
      <h1 id="velocity-hijab-title">${escapeHTML(preview.product.name)}</h1>
      <p class="velocity-product-tagline">Coverage. Comfort. Performance.</p>
      <p class="velocity-product-description">${escapeHTML(preview.description)}</p>
      <div><span class="velocity-product-label">Colour</span>
        <p class="velocity-colour"><span class="velocity-colour-swatch" aria-hidden="true"></span>${escapeHTML(preview.colour)}</p>
      </div>
      <div class="velocity-product-price"><span>${escapeHTML(productPrice.label)}</span><strong>${escapeHTML(productPrice.value)}</strong></div>
      <p class="velocity-purchase-disabled" role="status">PRIVATE PREVIEW · PURCHASING DISABLED</p>
      <ul class="velocity-feature-list" aria-label="Product features">${featureMarkup}</ul>
      <div class="velocity-accordions">
        <details><summary>Materials &amp; care</summary><p>Material composition and care instructions have not been supplied for this product.</p></details>
        <details><summary>Delivery &amp; returns</summary><p>Delivery and returns are not available for this private preview. Purchase and policy details are not confirmed.</p></details>
      </div>
      <p class="velocity-product-disclaimer">Feature language is reproduced from the supplied design reference; materials and performance claims have not been independently verified. Product details remain subject to sample review.</p>
    </div>
  </section>
  <footer class="velocity-proof-footer"><span>FSD / PRIVATE PRODUCT REVIEW</span><span>No checkout · No publication · Supplied image files unchanged</span></footer>`;

const mainImage = root.querySelector('#velocity-gallery-main-image');
const caption = root.querySelector('#velocity-gallery-caption');
root.querySelectorAll('[data-hijab-thumb]').forEach(button => {
  button.addEventListener('click', () => {
    const selected = asset(button.dataset.hijabThumb);
    if (!selected || mainImage.src.endsWith(`/${selected.id}`)) return;
    root.querySelectorAll('[data-hijab-thumb]').forEach(thumb => {
      thumb.setAttribute('aria-pressed', String(thumb === button));
    });
    mainImage.classList.add('is-switching');
    const nextImage = new Image();
    nextImage.onload = () => {
      mainImage.src = nextImage.src;
      mainImage.alt = selected.alt;
      caption.textContent = selected.label;
      requestAnimationFrame(() => mainImage.classList.remove('is-switching'));
    };
    nextImage.onerror = () => mainImage.classList.remove('is-switching');
    nextImage.src = selected.src;
  });
});
