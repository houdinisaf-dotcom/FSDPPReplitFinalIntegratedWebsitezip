import { createAeroForgeDraftData } from './aeroforge-campaign.js';
import { aeroforgePreviewPath } from './aeroforge-preview-path.js';

const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

export function createAeroForgeDevelopmentIntegration() {
  const { collection } = createAeroForgeDraftData();
  const hero = collection.hero;
  const collectionCard = `<article class="fsd-product-card fsd-product-card--private-preview" data-aeroforge-draft-card>
    <a class="fsd-product-media fsd-product-media--private-preview" href="${aeroforgePreviewPath}"
      aria-label="Open the private FSD AeroForge collection proof">
      <img loading="lazy" src="${escapeHTML(hero.src)}" alt="${escapeHTML(hero.alt)}" width="${hero.width}" height="${hero.height}"/>
      <span>PRIVATE COLLECTION REFERENCE</span>
    </a>
    <div class="fsd-product-meta"><span>FSD APPAREL</span><span>MODEST ACTIVEWEAR</span></div>
    <h4>FSD AEROFORGE</h4>
    <p class="fsd-product-description">Modest Training Top & Performance Joggers · six colourways.</p>
    <p class="fsd-product-status">DRAFT · PENDING APPROVAL</p>
    <p class="fsd-preview-status">PRIVATE PREVIEW · NO CHECKOUT · NOT PUBLISHED</p>
    <a class="fsd-product-link fsd-product-link--private-preview" href="${aeroforgePreviewPath}">OPEN COLLECTION PROOF <span aria-hidden="true">↗</span></a>
  </article>`;

  return Object.freeze({
    collectionCard,
    collectionCardPlacement: Object.freeze({
      id: 'aeroforge-private-collection',
      divisionId: 'apparel',
      groupId: 'womens-modest-combat',
      heading: 'PRIVATE DRAFT COLLECTION',
    }),
  });
}
