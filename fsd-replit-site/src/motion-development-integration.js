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
  const collectionCard = `<article class="fsd-product-card fsd-product-card--private-preview" data-motion-draft-card>
    <a class="fsd-product-media fsd-product-media--private-preview" href="${motionPreviewPath}"
      aria-label="Open the private FSD MOTION collection preview">
      <img loading="lazy" src="${escapeHTML(hero.src)}" alt="${escapeHTML(hero.alt)}" width="${hero.width}" height="${hero.height}"/>
      <span>PRIVATE CAMPAIGN REFERENCE</span>
    </a>
    <div class="fsd-product-meta"><span>FSD APPAREL</span><span>SMART TRAINING APPAREL</span></div>
    <h4>FSD MOTION</h4>
    <p class="fsd-product-description">A connected-movement apparel concept. All technical claims remain pending verification.</p>
    <p class="fsd-product-status">DRAFT · PENDING APPROVAL</p>
    <p class="fsd-preview-status">PRIVATE PREVIEW · NOT AVAILABLE TO PURCHASE</p>
    <a class="fsd-product-link fsd-product-link--private-preview" href="${motionPreviewPath}">EXPLORE COLLECTION <span aria-hidden="true">↗</span></a>
  </article>`;

  return Object.freeze({
    collectionCard,
    collectionCardPlacement: Object.freeze({
      id: 'fsd-motion-private-collection',
      divisionId: 'apparel',
      groupId: '*',
      heading: 'PRIVATE DRAFT COLLECTION',
    }),
    draftMenuItems: Object.freeze([Object.freeze({
      id: 'fsd-motion-private-collection-menu-entry',
      title: 'FSD MOTION — Smart Training Apparel',
      kind: 'draft-product',
      href: motionPreviewPath,
      previewOnly: true,
      previewKicker: 'APPAREL / PRIVATE DRAFT',
      previewActionLabel: 'EXPLORE COLLECTION',
      featureImageSrc: hero.src,
      featureImageAlt: hero.alt,
      description: 'A four-garment campaign concept. Product photos and technical specifications are pending verification.',
      sourceDivisionId: 'apparel',
      sourceGroupIndex: 0,
      sourceSubcategoryIndex: -1,
    })]),
    draftPreviewTargets: new Map([[motionPreviewPath, hero.src]]),
  });
}
