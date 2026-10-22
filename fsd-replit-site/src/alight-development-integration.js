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
    previewKicker: 'BIO-LAB™ / WEARABLE TECHNOLOGY',
    previewActionLabel: 'EXPLORE PRODUCT',
    featureImageSrc: image.src,
    featureImageAlt: 'FSD ALIGHT concept image',
    description: 'FSD Bio-Lab™ / Wearable Technology · A posture-awareness wearable concept.',
    sourceDivisionId: 'bio-lab',
    sourceGroupId: 'bio-lab-concepts',
    sourceGroupIndex: 0,
    sourceSubcategoryIndex: -1,
  });

  const collectionCard = `<article class="fsd-product-card" data-alight-draft-card>
    <a class="fsd-product-media" href="${alightPreviewPath}"
      aria-label="Explore FSD ALIGHT">
      <img loading="lazy" src="${escapeHTML(image.src)}" alt="FSD ALIGHT concept image" width="${image.width}" height="${image.height}"/>
      <span>FSD ALIGHT</span>
    </a>
    <div class="fsd-product-meta"><span>FSD BIO-LAB™</span><span>WEARABLE TECHNOLOGY</span></div>
    <h4>FSD ALIGHT</h4>
    <p class="fsd-product-description">Posture Awareness Wearable · concept design.</p>
    <p class="fsd-preview-status">PRE-LAUNCH CONCEPT</p>
    <a class="fsd-product-link" href="${alightPreviewPath}">EXPLORE PRODUCT <span aria-hidden="true">↗</span></a>
  </article>`;

  return Object.freeze({
    draftMenuItems: Object.freeze([draftMenuItem]),
    draftPreviewTargets: new Map([[alightPreviewPath, image.src]]),
    draftProductCard: collectionCard,
    collectionCardPlacement: Object.freeze({
      id: 'fsd-alight-product',
      divisionId: 'bio-lab',
      groupId: 'bio-lab-concepts',
      heading: 'FSD ALIGHT',
    }),
  });
}
