import { motionPreviewManifest } from './motion-campaign.js';
import { motionPreviewPath } from './motion-preview-path.js';

const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

export function createMotionDevelopmentIntegration() {
  const hero = motionPreviewManifest.assets.find(asset => asset.id === 'campaign-hero');
  const collectionCard = `<article class="fsd-product-card" data-motion-draft-card>
    <a class="fsd-product-media" href="${motionPreviewPath}"
      aria-label="Explore the FSD MOTION collection">
      <img loading="lazy" src="${escapeHTML(hero.src)}" alt="FSD MOTION campaign image" width="${hero.width}" height="${hero.height}"/>
      <span>FSD MOTION</span>
    </a>
    <div class="fsd-product-meta"><span>FSD BIO-LAB™</span><span>WEARABLE TECHNOLOGY</span></div>
    <h4>FSD MOTION</h4>
    <p class="fsd-product-description">A connected-movement apparel concept for training.</p>
    <p class="fsd-preview-status">CONCEPT</p>
    <a class="fsd-product-link" href="${motionPreviewPath}">EXPLORE COLLECTION <span aria-hidden="true">↗</span></a>
  </article>`;

  return Object.freeze({
    collectionCard,
    collectionCardPlacement: Object.freeze({
      id: 'fsd-motion-private-collection',
      divisionId: 'bio-lab',
      groupId: 'bio-lab-concepts',
      heading: 'FSD MOTION',
    }),
    draftMenuItems: Object.freeze([Object.freeze({
      id: 'fsd-motion-private-collection-menu-entry',
      title: 'FSD MOTION — Smart Training Apparel',
      kind: 'draft-product',
      href: motionPreviewPath,
      previewOnly: true,
      previewKicker: 'BIO-LAB™ / WEARABLE TECHNOLOGY',
      previewActionLabel: 'EXPLORE COLLECTION',
      featureImageSrc: hero.src,
      featureImageAlt: 'FSD MOTION campaign image',
      description: 'A four-garment campaign concept from FSD MOTION.',
      sourceDivisionId: 'bio-lab',
      sourceGroupId: 'bio-lab-concepts',
      sourceGroupIndex: 0,
      sourceSubcategoryIndex: -1,
    })]),
    draftPreviewTargets: new Map([[motionPreviewPath, hero.src]]),
  });
}
