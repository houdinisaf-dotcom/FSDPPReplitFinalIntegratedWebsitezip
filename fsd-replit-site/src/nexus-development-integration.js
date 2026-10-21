import { getNexusPreviewAsset } from './nexus-campaign.js';
import { nexusPreviewPath } from './nexus-preview-path.js';

const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

export function createNexusDevelopmentIntegration() {
  const appScreen = getNexusPreviewAsset('app-interface');
  if (!appScreen) throw new Error('The approved FSD NEXUS app-screen image is missing.');

  const collectionCard = `<article class="fsd-product-card fsd-product-card--private-preview" data-nexus-draft-card>
    <a class="fsd-product-media fsd-product-media--private-preview" href="${nexusPreviewPath}"
      aria-label="Open the private FSD NEXUS concept preview">
      <img loading="lazy" src="${escapeHTML(appScreen.src)}" alt="${escapeHTML(appScreen.alt)}" width="${appScreen.width}" height="${appScreen.height}"/>
      <span>PRIVATE CONCEPT REFERENCE</span>
    </a>
    <div class="fsd-product-meta"><span>FSD BIO-LAB™</span><span>WEARABLE TECHNOLOGY</span></div>
    <h4>FSD NEXUS</h4>
    <p class="fsd-product-description">Static app mock-up only. The displayed 87 score is illustrative, not live data.</p>
    <p class="fsd-product-status">PRIVATE DRAFT · PENDING APPROVAL</p>
    <p class="fsd-preview-status">CONCEPT ONLY · NOT A CURRENT PRODUCT · NO CHECKOUT</p>
    <a class="fsd-product-link fsd-product-link--private-preview" href="${nexusPreviewPath}">REVIEW CONCEPT <span aria-hidden="true">↗</span></a>
  </article>`;

  return Object.freeze({
    collectionCard,
    collectionCardPlacement: Object.freeze({
      id: 'fsd-nexus-private-concept',
      divisionId: 'bio-lab',
      groupId: 'bio-lab-concepts',
      heading: 'PRIVATE DRAFT CONCEPTS',
    }),
  });
}
