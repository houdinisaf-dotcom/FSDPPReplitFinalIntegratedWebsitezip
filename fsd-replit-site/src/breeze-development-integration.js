import './breeze-development-integration.css';
import { createBreezeDraftData } from './breeze-campaign.js';

const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

export function createBreezeDevelopmentIntegration() {
  const { product, variants } = createBreezeDraftData();
  const front = variants[0].views.find(view => view.id === 'front');
  const escapedSrc = escapeHTML(front.src);
  const escapedAlt = escapeHTML(`${product.name}, ${variants[0].label} colourway, ${front.label} view`);
  const collectionCard = `<article class="fsd-product-card fsd-breeze-draft-card" data-fsd-breeze-card data-master-product-id="${product.masterProductId}">
    <a class="fsd-product-media fsd-breeze-draft-media" href="#fsd-breeze"
      data-fsd-breeze-open aria-haspopup="dialog" aria-expanded="false"
      aria-label="Open the FSD Breeze product selector">
      <img loading="lazy" src="${escapedSrc}" alt="FSD BREEZE overshirt front view" width="${front.width}" height="${front.height}"/>
      <span>FSD BREEZE · MODEST ACTIVEWEAR</span>
    </a>
    <div class="fsd-product-meta"><span>FSD APPAREL</span><span>MODEST ACTIVEWEAR</span></div>
    <h4>${escapeHTML(product.name)}</h4>
    <p class="fsd-product-description">One overshirt. Other garments shown as styling context are not included.</p>
    <a class="fsd-product-link fsd-product-link--private-preview" href="#fsd-breeze"
      data-fsd-breeze-open aria-haspopup="dialog" aria-expanded="false">
      SELECT A COLOUR <span aria-hidden="true">↗</span>
    </a>
  </article>`;

  return Object.freeze({
    collectionCard,
    productData: product,
    variants,
    collectionCardPlacement: Object.freeze({
      id: 'fsd-breeze-private-draft',
      divisionId: 'apparel',
      groupId: 'womens-modest-combat',
      heading: 'FSD BREEZE',
      replacesProductId: product.masterProductId,
      showOnlyInAllProducts: true,
    }),
  });
}
