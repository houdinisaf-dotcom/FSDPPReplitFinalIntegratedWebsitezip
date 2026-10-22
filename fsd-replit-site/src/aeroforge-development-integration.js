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
  const collectionCard = `<article class="fsd-product-card" data-aeroforge-draft-card>
    <a class="fsd-product-media" href="${aeroforgePreviewPath}"
      aria-label="Explore the FSD AeroForge collection">
      <img loading="lazy" src="${escapeHTML(hero.src)}" alt="${escapeHTML(hero.alt)}" width="${hero.width}" height="${hero.height}"/>
      <span>FSD AEROFORGE</span>
    </a>
    <div class="fsd-product-meta"><span>FSD APPAREL</span><span>MODEST ACTIVEWEAR</span></div>
    <h4>FSD AEROFORGE</h4>
    <p class="fsd-product-description">Training Top and Joggers · six colourways.</p>
    <p class="fsd-preview-status">PRE-LAUNCH CONCEPT</p>
    <a class="fsd-product-link" href="${aeroforgePreviewPath}">EXPLORE COLLECTION <span aria-hidden="true">↗</span></a>
  </article>`;

  return Object.freeze({
    collectionCard,
    collectionCardPlacement: Object.freeze({
      id: 'aeroforge-private-collection',
      divisionId: 'apparel',
      groupId: 'womens-modest-combat',
      heading: 'AEROFORGE',
    }),
  });
}
