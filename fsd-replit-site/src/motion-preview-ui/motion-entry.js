import { collectionDivisions } from '../collection-divisions.js';
import { products } from '../catalogue-data.js';
import { renderNavigationHeader, mountNavigation } from '../site-navigation.js';
import { bindCollectionReturn } from '../collection-return.js';
import { createMotionPreview } from '../motion-campaign.js';
import { motionProductsPrefix } from '../motion-preview-path.js';
import { createMotionDevelopmentIntegration } from '../motion-development-integration.js';
import { renderMotionPreview } from './motion-preview.js';
import approvedFsdHeaderLogo from '../../brand-review/shield-refined-matte/assets/website-shield-lockup-defence.png';
import '../site-navigation.css';
import './motion-preview.css';

const root = document.querySelector('#motion-preview-root');
if (!root) throw new TypeError('The FSD MOTION preview mount is missing.');

const routePath = window.location.pathname;
let productSlug = null;
if (routePath.startsWith(motionProductsPrefix)) {
  const encodedSlug = routePath.slice(motionProductsPrefix.length).replace(/\/$/, '');
  try {
    productSlug = decodeURIComponent(encodedSlug);
  } catch {
    throw new Error('The requested FSD MOTION product route is invalid.');
  }
  if (!productSlug || productSlug.includes('/')) throw new Error('The requested FSD MOTION product route is invalid.');
}

const preview = createMotionPreview(productSlug);
if (!preview) throw new Error(`Unknown FSD MOTION product preview: ${productSlug}`);

const headerHtml = renderNavigationHeader(
  `<img class="fsd-brand-logo" src="${approvedFsdHeaderLogo}" alt="" aria-hidden="true"/>`,
);
const headerBrandLink = document.querySelector('.fsd-brand');
headerBrandLink?.setAttribute('href', '/');
const integration = createMotionDevelopmentIntegration();
root.innerHTML = renderMotionPreview({
  headerHtml,
  collection: preview.collection,
  product: preview.product,
  products: preview.products,
  assets: preview.assets,
  stories: preview.stories,
  pendingFeatures: preview.pendingFeatures,
  pendingSpecifications: preview.pendingSpecifications,
  missingPhotographs: preview.product?.missingPhotographs || preview.missingPhotographs,
});

bindCollectionReturn(root);

document.title = preview.product
  ? `${preview.product.name} | FSD MOTION`
  : `${preview.collection.name} ${preview.collection.subtitle} | FSD`;
document.querySelector('meta[name="description"]')
  ?.setAttribute('content', 'Explore the FSD MOTION apparel collection and product details.');

mountNavigation({
  root: root.querySelector('[data-navigation-shell]'),
  divisions: collectionDivisions,
  products,
  includeDraftPreviews: true,
  draftMenuItems: integration.draftMenuItems,
  draftPreviewTargets: integration.draftPreviewTargets,
  onNavigate({ item }) {
    if (item?.kind === 'draft-product' && item.href) {
      window.location.assign(item.href);
      return;
    }
    window.location.assign('/#collections');
  },
});

const assetById = new Map(preview.assets.map(asset => [asset.id, asset]));
const activeImage = root.querySelector('[data-motion-active-image]');
const activeImageButton = activeImage?.closest('[data-motion-image]');
const activeCaption = root.querySelector('[data-motion-active-caption]');
const lightbox = root.querySelector('[data-motion-dialog]');
const lightboxImage = lightbox?.querySelector('[data-motion-dialog-image]');
const lightboxCaption = lightbox?.querySelector('[data-motion-dialog-caption]');
let selectedAsset = assetById.get(activeImageButton?.dataset.motionImage)
  || assetById.get(preview.product?.mainAssetId)
  || assetById.get(preview.collection.heroAssetId);
let imageRequest = 0;

function updateActiveImage(asset, selectedButton = null) {
  if (!asset || !activeImage || !activeImageButton) return;
  const request = ++imageRequest;
  activeImage.classList.add('is-switching');
  const preload = new Image();
  preload.onload = () => {
    if (request !== imageRequest) return;
    selectedAsset = asset;
    activeImage.src = asset.src;
    activeImage.alt = '';
    activeImage.width = asset.width;
    activeImage.height = asset.height;
    activeImageButton.dataset.motionImage = asset.id;
    if (preview.product) activeImageButton.style.aspectRatio = `${asset.width} / ${asset.height}`;
    const selectedLabel = selectedButton?.querySelector('.motion-ref-meta strong, .motion-gallery-thumb span')?.textContent?.trim()
      || 'FSD MOTION campaign image';
    activeCaption?.firstChild && (activeCaption.firstChild.textContent = `${selectedLabel} `);
    const note = activeCaption?.querySelector('span');
    if (note) note.textContent = 'CAMPAIGN IMAGE';
    root.querySelectorAll('[data-motion-gallery-select]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.motionGallerySelect === asset.id));
    });
    if (selectedButton) selectedButton.setAttribute('aria-pressed', 'true');
    requestAnimationFrame(() => activeImage.classList.remove('is-switching'));
  };
  preload.onerror = () => {
    if (request === imageRequest) activeImage.classList.remove('is-switching');
  };
  preload.src = asset.src;
}

root.addEventListener('click', event => {
  const galleryButton = event.target.closest('[data-motion-gallery-select]');
  if (galleryButton && root.contains(galleryButton)) {
    const asset = assetById.get(galleryButton.dataset.motionGallerySelect);
    if (asset) updateActiveImage(asset, galleryButton);
    return;
  }

  const enlargeButton = event.target.closest('[data-motion-enlarge]');
  if (enlargeButton && lightbox && selectedAsset) {
    lightboxImage.src = selectedAsset.src;
    lightboxImage.alt = '';
    lightboxCaption.textContent = `${activeCaption?.firstChild?.textContent?.trim() || 'FSD MOTION campaign image'} — CAMPAIGN IMAGE`;
    if (!lightbox.open) lightbox.showModal();
    return;
  }

  if (event.target.closest('[data-motion-close]') && lightbox?.open) {
    lightbox.close();
    return;
  }
  if (event.target === lightbox && lightbox?.open) lightbox.close();
});
