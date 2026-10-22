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
  const escapedAlt = escapeHTML(front.alt);
  const priceMarkup = product.priceLabel
    ? `<p class="fsd-product-reference"><strong>${escapeHTML(product.priceLabel)}</strong><span>Catalogue reference only</span></p>`
    : '<p class="fsd-product-reference">Price at launch</p>';

  const collectionCard = `<article class="fsd-product-card fsd-breeze-draft-card" data-fsd-breeze-card data-master-product-id="${product.masterProductId}">
    <a class="fsd-product-media fsd-breeze-draft-media" href="#fsd-breeze"
      data-fsd-breeze-open aria-haspopup="dialog" aria-expanded="false"
      aria-label="Open private FSD Breeze visual preview">
      <img loading="lazy" src="${escapedSrc}" alt="${escapedAlt}" width="${front.width}" height="${front.height}"/>
      <span>DRAFT CONCEPT · BRANDING UNVERIFIED</span>
    </a>
    <div class="fsd-product-meta"><span>FSD APPAREL</span><span>MODEST ACTIVEWEAR</span></div>
    <h4>${escapeHTML(product.name)}</h4>
    <p class="fsd-product-description">One overshirt concept. Other clothing shown is styling context and is not included.</p>
    ${priceMarkup}
    <p class="fsd-product-status">PRIVATE VISUAL DRAFT · DETAILS PENDING</p>
    <p class="fsd-preview-status">NO CHECKOUT · NOT PUBLISHED</p>
    <a class="fsd-product-link fsd-product-link--private-preview" href="#fsd-breeze"
      data-fsd-breeze-open aria-haspopup="dialog" aria-expanded="false">
      OPEN VISUAL PREVIEW <span aria-hidden="true">↗</span>
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
      heading: 'MODEST ACTIVEWEAR · PRIVATE DRAFT',
      replacesProductId: product.masterProductId,
      showOnlyInAllProducts: true,
    }),
  });
}
