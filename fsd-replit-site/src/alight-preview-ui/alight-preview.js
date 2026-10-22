import { collectionDivisions } from '../collection-divisions.js';
import { products } from '../catalogue-data.js';
import { renderNavigationHeader, mountNavigation } from '../site-navigation.js';
import { alightPreviewRecord as preview } from '../alight-campaign.js';
import { createAlightDevelopmentIntegration } from '../alight-development-integration.js';
import { bindCollectionReturn } from '../collection-return.js';
import approvedFsdHeaderLogo from '../../brand-review/shield-refined-matte/assets/website-shield-lockup-defence.png';
import '../site-navigation.css';
import './alight-preview.css';

const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

const headerRoot = document.querySelector('#alight-site-header');
const root = document.querySelector('#alight-preview-root');
const developmentIntegration = createAlightDevelopmentIntegration();

if (!headerRoot || !root) {
  throw new TypeError('The FSD ALIGHT preview shell is missing its header or content mount.');
}

document.body.classList.add('alight-preview-body');
headerRoot.innerHTML = renderNavigationHeader(
  `<img class="fsd-brand-logo" src="${approvedFsdHeaderLogo}" alt="" aria-hidden="true"/>`,
);

mountNavigation({
  root: headerRoot.querySelector('[data-navigation-shell]'),
  divisions: collectionDivisions,
  products,
  includeDraftPreviews: true,
  draftMenuItems: developmentIntegration.draftMenuItems,
  draftPreviewTargets: developmentIntegration.draftPreviewTargets,
  onNavigate({ item, group }) {
    if (item?.kind === 'draft-product' && item.href) {
      window.location.assign(item.href);
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

const galleryMarkup = preview.gallery.map((image, index) => `
  <button class="alight-gallery-card" type="button" data-alight-thumb="${escapeHTML(image.id)}"
    aria-label="Show reference ${String(index + 1).padStart(2, '0')}: ${escapeHTML(image.label)}"
    aria-pressed="${image.id === preview.campaign.id}">
    <span class="alight-gallery-image">
      <img src="${escapeHTML(image.src)}" alt="" width="${image.width}" height="${image.height}" loading="eager"/>
    </span>
    <span class="alight-gallery-index">${String(index + 1).padStart(2, '0')}</span>
    <span class="alight-gallery-label">${escapeHTML(image.label)}</span>
    <span class="alight-gallery-type">${escapeHTML(image.role)}</span>
  </button>`).join('');

const storiesMarkup = preview.editorialStories.map((story, index) => {
  const image = preview.gallery.find(entry => entry.id === story.imageId);
  return `<article class="alight-story alight-story--${index + 1}">
    <div class="alight-story-image">
      <img src="${escapeHTML(image.src)}" alt="" width="${image.width}" height="${image.height}" loading="eager"/>
      <span>CAMPAIGN IMAGE</span>
    </div>
    <div class="alight-story-copy">
      <span class="alight-micro-index">0${index + 1} / CONCEPT STUDY</span>
      <h3>${escapeHTML(story.title)}</h3>
      <p>${escapeHTML(story.copy)}</p>
    </div>
  </article>`;
}).join('');

root.innerHTML = `
  <main class="alight-page">
    <div class="alight-main-wrap">
      <nav class="alight-breadcrumb" aria-label="Breadcrumb">
        <a href="/#home">FSD</a><span aria-hidden="true">/</span>
        <a class="alight-back-collection fsd-collection-return" href="/#collections" data-collection-return>← BACK TO COLLECTION</a><span aria-hidden="true">/</span>
        <span>BIO-LAB / WEARABLE TECHNOLOGY</span><span aria-hidden="true">/</span>
        <span aria-current="page">${escapeHTML(preview.product.name)}</span>
      </nav>

      <section class="alight-intro" aria-labelledby="alight-title">
        <div class="alight-intro-copy">
          <p class="alight-eyebrow">FSD / ${escapeHTML(preview.product.category)}</p>
          <p class="alight-overline">A CONCEPT IN MINDFUL MOVEMENT</p>
          <h1 id="alight-title">FSD<br><em>ALIGHT</em></h1>
          <p class="alight-subtitle">${escapeHTML(preview.product.subtitle)}</p>
          <p class="alight-description">${escapeHTML(preview.product.description)}</p>
          <div class="alight-colour">
            <span class="alight-colour-swatch" aria-hidden="true"></span>
            <span><small>DEPICTED PALETTE</small><strong>${escapeHTML(preview.product.colour)}</strong></span>
          </div>
           <p class="alight-prelaunch-note"><strong>CONCEPT</strong><small>Product details are being finalised.</small></p>
        </div>
        <div class="alight-hero-artwork">
          <button class="alight-hero-image" type="button" data-alight-enlarge aria-label="Enlarge selected campaign reference">
            <img id="alight-main-image" src="${escapeHTML(preview.campaign.src)}"
              alt="FSD ALIGHT campaign image" width="${preview.campaign.width}" height="${preview.campaign.height}" fetchpriority="high"/>
            <span class="alight-expand">OPEN REFERENCE <span aria-hidden="true">↗</span></span>
          </button>
          <div class="alight-image-meta">
            <span id="alight-image-caption" aria-live="polite">${escapeHTML(preview.campaign.label)}</span>
             <span>CAMPAIGN IMAGE</span>
          </div>
        </div>
      </section>
    </div>

    <section class="alight-campaign-line" aria-label="Campaign artwork wording">
      <div class="alight-campaign-inner">
        <span class="alight-section-index">ARTWORK / 01</span>
        <p>${escapeHTML(preview.campaignMessage)}</p>
         <span class="alight-campaign-caveat">CAMPAIGN DIRECTION</span>
      </div>
    </section>

    <section class="alight-editorial alight-main-wrap" aria-labelledby="alight-editorial-title">
      <div class="alight-section-heading">
        <div>
          <p class="alight-eyebrow">THE IDEA / IN CONTEXT</p>
          <h2 id="alight-editorial-title">Movement, in the<br><em>moments between.</em></h2>
        </div>
         <p class="alight-section-intro">An early editorial study exploring how ALIGHT might sit within work and training.</p>
      </div>
      <div class="alight-stories">${storiesMarkup}</div>
    </section>

    <section class="alight-gallery-section" aria-labelledby="alight-gallery-title">
      <div class="alight-main-wrap">
        <div class="alight-gallery-heading">
          <div>
             <p class="alight-eyebrow">CAMPAIGN IMAGERY / 12 FRAMES</p>
            <h2 id="alight-gallery-title">Campaign <em>archive.</em></h2>
          </div>
           <p>Choose a frame to explore the ALIGHT campaign direction.</p>
        </div>
        <div class="alight-gallery-grid" role="group" aria-label="Select one of twelve campaign image references">
          ${galleryMarkup}
        </div>
      </div>
    </section>

    <footer class="alight-footer">
      <div class="alight-main-wrap">
        <span class="alight-footer-brand">FSD <i>/</i> ALIGHT</span>
         <span>CONCEPT</span>
        <span>CONCEPT</span>
      </div>
    </footer>
  </main>

  <dialog class="alight-lightbox" id="alight-lightbox" aria-label="Campaign reference viewer">
    <button class="alight-lightbox-close" type="button" data-alight-close aria-label="Close enlarged reference">CLOSE <span aria-hidden="true">×</span></button>
    <img id="alight-lightbox-image" alt=""/>
    <div class="alight-lightbox-caption">
      <p id="alight-lightbox-title"></p>
      <span>CAMPAIGN IMAGE</span>
    </div>
  </dialog>`;

bindCollectionReturn(root);

const mainImage = root.querySelector('#alight-main-image');
const caption = root.querySelector('#alight-image-caption');
const lightbox = root.querySelector('#alight-lightbox');
const lightboxImage = root.querySelector('#alight-lightbox-image');
const lightboxTitle = root.querySelector('#alight-lightbox-title');
let selectedImage = preview.campaign;
let selectionRequest = 0;

root.querySelector('.alight-gallery-grid').addEventListener('click', event => {
  const button = event.target.closest('[data-alight-thumb]');
  if (!button) return;
  const image = preview.gallery.find(item => item.id === button.dataset.alightThumb);
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
    root.querySelectorAll('[data-alight-thumb]').forEach(thumb => {
      thumb.setAttribute('aria-pressed', String(thumb === button));
    });
    requestAnimationFrame(() => mainImage.classList.remove('is-switching'));
  };
  preloaded.onerror = () => {
    if (request === selectionRequest) mainImage.classList.remove('is-switching');
  };
  preloaded.src = image.src;
});

root.querySelector('[data-alight-enlarge]').addEventListener('click', () => {
  lightboxImage.src = selectedImage.src;
  lightboxImage.alt = selectedImage.alt;
  lightboxTitle.textContent = selectedImage.label;
  if (!lightbox.open) lightbox.showModal();
});
root.querySelector('[data-alight-close]').addEventListener('click', () => lightbox.close());
lightbox.addEventListener('click', event => {
  if (event.target === lightbox) lightbox.close();
});
