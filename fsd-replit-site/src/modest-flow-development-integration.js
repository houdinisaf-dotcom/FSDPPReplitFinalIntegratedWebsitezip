import { createModestFlowDraftData } from './modest-flow-campaign.js';

const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

export function createModestFlowDevelopmentIntegration() {
  const { collection, product } = createModestFlowDraftData();
  const hero = collection.hero;
  const setComponents = product.setComponents;
  const collectionCard = `<article class="fsd-product-card fsd-product-card--private-preview" data-modest-flow-draft-card>
    <a class="fsd-product-media fsd-product-media--private-preview" href="#modest-flow"
      data-modest-flow-open aria-haspopup="dialog" aria-expanded="false"
      aria-label="Open the FSD Modest Flow colour selector">
      <img loading="lazy" src="${escapeHTML(hero.src)}" alt="${escapeHTML(hero.alt)}" width="${hero.width}" height="${hero.height}"/>
      <span>FIXED CAMPAIGN HERO · DEEP BURGUNDY</span>
    </a>
    <div class="fsd-product-meta"><span>FSD APPAREL</span><span>MODEST ACTIVEWEAR</span></div>
    <h4>${escapeHTML(product.name)}</h4>
    <p class="fsd-product-description">${escapeHTML(product.subtitle)}</p>
    <div class="fsd-product-set-summary" aria-label="FSD Modest Flow coordinated set includes">
      <span class="fsd-product-set-summary__label">COORDINATED SET</span>
      <div>${setComponents.map(component => `<span>${escapeHTML(component)}</span>`).join('')}</div>
    </div>
    <a class="fsd-product-link fsd-product-link--private-preview" href="#modest-flow"
      data-modest-flow-open aria-haspopup="dialog" aria-expanded="false">
      SELECT A COLOUR <span aria-hidden="true">↗</span>
    </a>
  </article>`;

  return Object.freeze({
    collectionCard,
    productData: Object.freeze({
      name: product.name,
      subtitle: product.subtitle,
      description: product.description,
      setComponents,
    }),
    variants: Object.freeze(product.variants.map(variant => Object.freeze({
      id: variant.id,
      colour: variant.colour,
      swatch: variant.swatch,
      imageSrc: variant.imageSrc,
      imageAlt: variant.imageAlt,
    }))),
    collectionCardPlacement: Object.freeze({
      id: 'modest-flow-private-draft',
      divisionId: collection.divisionId,
      groupId: collection.groupId,
      heading: 'MODEST ACTIVEWEAR',
    }),
  });
}
