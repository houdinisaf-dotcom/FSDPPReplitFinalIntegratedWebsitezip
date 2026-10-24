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
  const { products } = createAeroForgeDraftData();
  const collectionCards = products.map(product => {
    const isJoggers = /jogger/i.test(`${product.id} ${product.name}`);
    const kind = isJoggers ? 'joggers' : 'top';
    const subcategoryIndex = isJoggers ? 2 : 1;
    const routeHash = isJoggers ? '#aeroforge-performance-joggers' : '#aeroforge-training-top';
    const image = product.variants[0];
    const href = `${aeroforgePreviewPath}${routeHash}`;
    const itemLabel = isJoggers ? 'PERFORMANCE JOGGERS' : 'MODEST TRAINING TOP';
    const markup = `<article class="fsd-product-card" data-aeroforge-draft-card data-aeroforge-product="${kind}">
      <a class="fsd-product-media" href="${href}"
        aria-label="Explore ${escapeHTML(product.name)}">
        <img loading="lazy" src="${escapeHTML(image.src)}" alt="${escapeHTML(image.alt)}" width="${image.width}" height="${image.height}"/>
        <span>FSD AEROFORGE</span>
      </a>
      <div class="fsd-product-meta"><span>FSD APPAREL</span><span>MODEST ACTIVEWEAR</span></div>
      <h4>${escapeHTML(product.name)}</h4>
      <a class="fsd-product-link" href="${href}">EXPLORE ITEM <span aria-hidden="true">↗</span></a>
    </article>`;
    return Object.freeze({
      markup,
      placement: Object.freeze({
        id: `aeroforge-private-${kind}`,
        divisionId: 'apparel',
        groupId: 'womens-modest-combat',
        subcategoryIndex,
        heading: itemLabel,
      }),
    });
  });

  return Object.freeze({
    collectionCards: Object.freeze(collectionCards),
  });
}
