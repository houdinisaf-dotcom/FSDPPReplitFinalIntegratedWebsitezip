import additional from './additional-catalog.json' with { type: 'json' };
import { heldProducts, retiredProducts, safe } from './catalogue-data.js';

// Associations here enforce publication holds only; they do not approve imagery.
export const galleryProductIds = new Map([
  ['/fsd-assets/0501359107c5.webp', 64], // Named Smart Tech STRIDE reference
  ['/fsd-assets/631f50075012.webp', 68], // Named supplement reference
]);
const excludedIds = new Set([...heldProducts, ...retiredProducts].map(p => p.id));
export const galleryProducts = additional.gallery.filter(g => !excludedIds.has(galleryProductIds.get(g.url)));

export function gallerySection() {
  return `<section class="fsd-expanded fsd-gallery" id="full-gallery"><div class="section-heading"><div>
    <p class="section-kicker">FSD PRODUCT DESIGN LIBRARY</p><h2>THE FULL VISUAL EDIT<span class="period">.</span></h2></div>
    <p>Supplied imagery covering apparel, modest training, accessories and brand development.
    These working references are not approved product-to-image mappings.</p></div>
    <div class="fsd-gallery-tools"><input id="gallery-search" aria-label="Search design library" placeholder="Search all designs and colourways...">
    <span id="gallery-count" role="status" aria-live="polite">${galleryProducts.length} designs</span></div>
    <div class="fsd-gallery-grid" id="fsd-gallery-grid">${galleryProducts.map(g => `
      <figure class="fsd-gallery-card" data-gallery-name="${safe(g.name.toLowerCase())}">
      <img loading="lazy" src="${safe(g.url)}" alt="${safe(g.name)}"><figcaption>${safe(g.name)}</figcaption></figure>`).join('')}</div>
    <p class="disclaimer">Design-library images are reference material, not an additional product register.
    Images are design renders, not evidence of completed manufacture, stock availability or verified technical performance.</p>
    </section>`;
}
