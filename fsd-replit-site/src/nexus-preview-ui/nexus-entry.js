import { collectionDivisions } from '../collection-divisions.js';
import { products } from '../catalogue-data.js';
import { renderNavigationHeader, mountNavigation } from '../site-navigation.js';
import { bindCollectionReturn } from '../collection-return.js';
import { createNexusPreview } from '../nexus-campaign.js';
import { renderNexusPreview } from './nexus-preview.js';
import approvedFsdHeaderLogo from '../../brand-review/shield-refined-matte/assets/website-shield-lockup-defence.png';
import '../site-navigation.css';
import './nexus-preview.css';

const root = document.querySelector('#nexus-preview-root');
if (!root) throw new TypeError('The FSD NEXUS preview mount is missing.');

const preview = createNexusPreview();
const headerHtml = renderNavigationHeader(
  `<img class="fsd-brand-logo" src="${approvedFsdHeaderLogo}" alt="" aria-hidden="true"/>`,
);
document.title = `${preview.name} | Concept`;
document.querySelector('meta[name="description"]')
  ?.setAttribute('content', 'Explore the FSD NEXUS wearable-technology concept. Not a current product or commercial commitment.');
document.querySelector('.fsd-brand')?.setAttribute('href', '/');

root.innerHTML = renderNexusPreview({ headerHtml, preview });
bindCollectionReturn(root);

mountNavigation({
  root: root.querySelector('[data-navigation-shell]'),
  divisions: collectionDivisions,
  products,
  includeDraftPreviews: true,
  onNavigate() {
    window.location.assign('/#collections');
  },
});

const assetById = new Map(preview.assets.map(asset => [asset.id, asset]));
const activeImage = root.querySelector('[data-nexus-active-image]');
const activeCaption = root.querySelector('[data-nexus-active-caption]');
const activeNote = root.querySelector('[data-nexus-active-note]');
const mainImageButton = root.querySelector('[data-nexus-enlarge]');
const lightbox = root.querySelector('[data-nexus-dialog]');
const lightboxImage = lightbox?.querySelector('[data-nexus-dialog-image]');
const lightboxCaption = lightbox?.querySelector('[data-nexus-dialog-caption]');
let selectedAsset = assetById.get('app-interface');

function selectAsset(asset, selectedButton) {
  if (!asset || !activeImage) return;
  selectedAsset = asset;
  activeImage.src = asset.src;
  activeImage.alt = asset.alt;
  activeImage.width = asset.width;
  activeImage.height = asset.height;
  if (activeCaption) activeCaption.textContent = asset.label;
    if (activeNote) activeNote.textContent = asset.id === 'app-interface'
      ? 'STATIC INTERFACE CONCEPT'
      : asset.id === 'proposed-features' ? 'FEATURE CONCEPT' : 'RESPONSIBLE DEVELOPMENT';
  mainImageButton?.setAttribute('aria-label', `Enlarge ${asset.label}`);
  root.querySelectorAll('[data-nexus-gallery-select]').forEach(button => {
    button.setAttribute('aria-pressed', String(button === selectedButton));
  });
}

root.addEventListener('click', event => {
  const galleryButton = event.target.closest('[data-nexus-gallery-select]');
  if (galleryButton && root.contains(galleryButton)) {
    selectAsset(assetById.get(galleryButton.dataset.nexusGallerySelect), galleryButton);
    return;
  }
  if (event.target.closest('[data-nexus-enlarge]') && lightbox && selectedAsset) {
    lightboxImage.src = selectedAsset.src;
    lightboxImage.alt = selectedAsset.alt;
    lightboxCaption.textContent = `${selectedAsset.label} — CONCEPT ARTWORK REFERENCE`;
    if (!lightbox.open) lightbox.showModal();
    return;
  }
  if (event.target.closest('[data-nexus-close]') && lightbox?.open) {
    lightbox.close();
    return;
  }
  if (event.target === lightbox && lightbox?.open) lightbox.close();
});
