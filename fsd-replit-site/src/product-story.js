import { safe } from './catalogue-data.js';

const STORY_PRODUCTS = new Set([43]);

export function renderProductStory(product, price) {
  if (!STORY_PRODUCTS.has(product.id) || !product.images?.[0]) return '';
  const lead = product.images[0];
  const facts = [
    ['CATEGORY', product.category],
    ['COLOURWAY', product.colourways],
    ['COLLECTION', product.collection],
    [price.label.toLocaleUpperCase('en-GB'), price.value],
  ].filter(([, value]) => String(value ?? '').trim());
  return `<section class="product-story" aria-labelledby="product-story-title">
    <header class="product-story-heading">
      <p class="product-story-kicker">FSD / PRODUCT RECORD · ${String(product.id).padStart(2, '0')} · PRE-LAUNCH</p>
      <h3 id="product-story-title">${safe(product.name)}</h3>
    </header>
    <div class="product-story-lead">
      <figure><img loading="lazy" src="${safe(lead.src)}" alt="${safe(product.name)} — ${safe(lead.label)}; design concept" decoding="async"/>
        <figcaption>${safe(lead.label)} · DESIGN CONCEPT</figcaption></figure>
      <div class="product-story-sequence" aria-label="Product record details">
        ${facts.map(([label, value], index) => `<div class="product-story-fact">
          <span>${String(index + 1).padStart(2, '0')} / ${safe(label)}</span><strong>${safe(value)}</strong>
        </div>`).join('')}
      </div>
    </div>
    <p class="product-story-note">PRE-LAUNCH · This record is not available to purchase. Sizing, materials, specifications and availability are unconfirmed.</p>
    <a class="product-story-return" href="#product-details">RETURN TO PRODUCT DETAILS <span aria-hidden="true">↑</span></a>
  </section>`;
}
