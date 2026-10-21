import { alightPreviewRecord } from './alight-campaign.js';
import { alightPreviewPath } from './alight-preview-path.js';

const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

export function createAlightDevelopmentIntegration() {
  const image = alightPreviewRecord.productVisual;
  const draftMenuItem = Object.freeze({
    id: 'fsd-alight-draft-menu-entry',
    title: 'FSD ALIGHT — Posture Awareness Wearable',
    kind: 'draft-product',
    href: alightPreviewPath,
    previewOnly: true,
    previewKicker: 'BIO-LAB™ / PRIVATE DRAFT',
    previewActionLabel: 'EXPLORE PRODUCT',
    featureImageSrc: image.src,
    featureImageAlt: image.alt,
    description: 'FSD Bio-Lab™ / Wearable Technology · Campaign references only. Product photography and specifications are pending approval.',
    sourceDivisionId: 'bio-lab',
    sourceGroupId: 'bio-lab-concepts',
    sourceGroupIndex: 0,
    sourceSubcategoryIndex: -1,
  });

  const collectionCard = `<article class="fsd-product-card fsd-product-card--private-preview" data-alight-draft-card>
    <a class="fsd-product-media fsd-product-media--private-preview" href="${alightPreviewPath}"
      aria-label="Open the private FSD ALIGHT preview">
      <img loading="lazy" src="${escapeHTML(image.src)}" alt="${escapeHTML(image.alt)}" width="${image.width}" height="${image.height}"/>
      <span>PRIVATE CAMPAIGN REFERENCE</span>
    </a>
    <div class="fsd-product-meta"><span>FSD BIO-LAB™</span><span>WEARABLE TECHNOLOGY</span></div>
    <h4>FSD ALIGHT</h4>
    <p class="fsd-product-description">Posture Awareness Wearable · concept visuals only.</p>
    <p class="fsd-product-status">COMING SOON · PENDING APPROVAL</p>
    <p class="fsd-preview-status">PRIVATE PREVIEW · NOT AVAILABLE TO PURCHASE</p>
    <a class="fsd-product-link fsd-product-link--private-preview" href="${alightPreviewPath}">EXPLORE PRODUCT <span aria-hidden="true">↗</span></a>
  </article>`;

  return Object.freeze({
    draftMenuItems: Object.freeze([draftMenuItem]),
    draftPreviewTargets: new Map([[alightPreviewPath, image.src]]),
    draftProductCard: collectionCard,
  });
}
