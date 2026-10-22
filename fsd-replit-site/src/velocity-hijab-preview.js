import { collectionDivisions } from './collection-divisions.js';
import { products, priceInfo } from './catalogue-data.js';
import { renderNavigationHeader, mountNavigation } from './site-navigation.js';
import { bindCollectionReturn } from './collection-return.js';
import { createVelocityHijabPreview } from './velocity-hijab-campaign.js';
import { velocityHijabMediaPrefix, velocityHijabPreviewPath } from './velocity-hijab-preview-path.js';
import approvedFsdHeaderLogo from '../brand-review/shield-refined-matte/assets/website-shield-lockup-defence.png';

const preview = createVelocityHijabPreview();
const productPrice = {
  ...priceInfo(preview.product),
  label: 'Reference only · not for sale',
};
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
const campaign = asset('campaign');
const root = document.querySelector('#velocity-hijab-root');

root.innerHTML = `
  <a class="fsd-collection-return" href="/#collections" data-collection-return>
    <span aria-hidden="true">←</span> BACK TO COLLECTION
  </a>
  <nav class="velocity-hijab-breadcrumb" aria-label="Breadcrumb">
    <a href="/#home">Home</a><span aria-hidden="true">›</span>
    <a href="/#collections">Women</a><span aria-hidden="true">›</span>
    <span>Accessories</span><span aria-hidden="true">›</span>
    <span aria-current="page">${escapeHTML(preview.product.name)}</span>
  </nav>
  <div class="velocity-hijab-proof-label"><span>FSD / WOMEN’S PERFORMANCE</span><span>FSD VELOCITY</span></div>
  <section class="velocity-hijab-layout" aria-labelledby="velocity-hijab-title">
    <div class="velocity-gallery" aria-label="Product image gallery">
      <div class="velocity-gallery-mosaic velocity-gallery-mosaic--single">
        <figure class="velocity-gallery-main">
          <img id="velocity-gallery-main-image" src="${imageSource(campaign)}"
            alt="${escapeHTML(campaign.alt)}" fetchpriority="high"/>
          <figcaption id="velocity-gallery-caption" aria-live="polite">${escapeHTML(campaign.label)}</figcaption>
        </figure>
      </div>
      <div class="velocity-gallery-thumbnails" role="group" aria-label="Choose a product image">${galleryMarkup}</div>
    </div>
    <div class="velocity-product-copy">
      <p class="velocity-product-kicker">FSD / WOMEN’S MODEST ACTIVEWEAR</p>
      <h1 id="velocity-hijab-title">${escapeHTML(preview.product.name)}</h1>
      <p class="velocity-product-tagline">CONCEPT</p>
      <p class="velocity-product-description">An FSD performance sports hijab concept in ${escapeHTML(preview.colour)}.</p>
      <div><span class="velocity-product-label">Colour</span>
        <p class="velocity-colour"><span class="velocity-colour-swatch" aria-hidden="true"></span>${escapeHTML(preview.colour)}</p>
      </div>
      <div class="velocity-product-price"><span>${escapeHTML(productPrice.label)}</span><strong>${escapeHTML(productPrice.value)}</strong></div>
      <div class="velocity-accordions">
        <details><summary>Product details</summary><p>Product information will be shared before release.</p></details>
      </div>
      <p class="velocity-product-disclaimer">Product details will be shared before release.</p>
    </div>
  </section>
  <footer class="velocity-proof-footer"><span>FSD / VELOCITY</span><span>WOMEN’S MODEST ACTIVEWEAR</span></footer>`;

bindCollectionReturn(root);

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
