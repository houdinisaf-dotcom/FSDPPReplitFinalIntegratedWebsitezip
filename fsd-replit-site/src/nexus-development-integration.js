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

  const collectionCard = `<article class="fsd-product-card" data-nexus-draft-card>
    <a class="fsd-product-media" href="${nexusPreviewPath}"
      aria-label="Explore the FSD NEXUS concept">
      <img loading="lazy" src="${escapeHTML(appScreen.src)}" alt="${escapeHTML(appScreen.alt)}" width="${appScreen.width}" height="${appScreen.height}"/>
      <span>FSD NEXUS</span>
    </a>
    <div class="fsd-product-meta"><span>FSD BIO-LAB™</span><span>WEARABLE TECHNOLOGY</span></div>
    <h4>FSD NEXUS</h4>
    <p class="fsd-product-description">A smart ring concept with an illustrative app interface.</p>
    <p class="fsd-preview-status">CONCEPT</p>
    <a class="fsd-product-link" href="${nexusPreviewPath}">EXPLORE CONCEPT <span aria-hidden="true">↗</span></a>
  </article>`;

  return Object.freeze({
    collectionCard,
    collectionCardPlacement: Object.freeze({
      id: 'fsd-nexus-private-concept',
      divisionId: 'bio-lab',
      groupId: 'bio-lab-concepts',
      heading: 'FSD NEXUS',
    }),
  });
}
