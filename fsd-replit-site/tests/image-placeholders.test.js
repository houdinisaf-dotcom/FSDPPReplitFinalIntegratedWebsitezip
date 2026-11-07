import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { imagePlaceholderMarkup } from '../src/image-placeholder.js';
import { products, productImagesForDisplay } from '../src/data/products.js';
import { siteMedia } from '../src/data/site-media.js';
import { renderCollectionShowcase } from '../src/collection-showcase/index.js';
import { collectionDivisions } from '../src/collection-divisions.js';
import { renderProductDetailPage } from '../src/product-detail-page.js';

test('named placeholders escape product and variant text and contain no substitute image', () => {
  const html = imagePlaceholderMarkup({ title: 'FSD <Test>', variantLabel: 'Black & Lime', kind: 'product' });
  assert.match(html, /FSD &lt;Test&gt;/);
  assert.match(html, /Black &amp; Lime/);
  assert.match(html, /role="img"/);
  assert.match(html, /\[ASSET PENDING\]/);
  assert.doesNotMatch(html, /<img|<script/);
});

test('unavailable and composite imagery yields empty image arrays, not removed products', () => {
  assert.deepEqual(productImagesForDisplay(undefined), []);
  const composite = products.find(product => product.id === 10);
  assert.ok(composite);
  assert.ok(composite.images.length);
  assert.deepEqual(productImagesForDisplay(composite), []);
  assert.ok(products.includes(composite));
  assert.ok(productImagesForDisplay(products.find(product => product.id === 34)).length);
});

test('the Bio-Lab collection keeps its named placeholder and active collection trigger', () => {
  assert.equal(siteMedia.collectionCards.bioLab, null);
  const html = renderCollectionShowcase(collectionDivisions, { editorial: true, products });
  assert.equal((html.match(/class="fsd-editorial-card /g) || []).length, 3);
  assert.match(html, /fsd-editorial-card--biolab/);
  assert.match(html, /BIO-LAB™ \[ASSET PENDING\]/);
  assert.match(html, /data-division="bio-lab"/);
});

test('missing colourway images keep selectors and a recoverable gallery stage', () => {
  const product = products.find(item => item.id === 34);
  const html = renderProductDetailPage({
    product,
    images: [{ src: '/assets/products/strike-shorts-front.webp', label: 'Black front', colourway: 'Black' }],
    initialImageIndex: -1,
    galleryPlaceholders: [],
    colourways: ['Missing Lime', 'Black'],
    colourwayImageIndexes: [-1, 0],
    sizes: ['XS', 'XL'],
    price: { label: '', value: '£49.99' },
    canPurchase: true,
  });
  assert.match(html, /data-catalogue-main-image/);
  assert.match(html, /data-catalogue-variant-placeholder/);
  assert.match(html, /Missing Lime/);
  assert.match(html, /data-catalogue-colourway-image-index="-1"/);
  assert.match(html, /data-product-size/);
  assert.match(html, /data-product-primary-add/);
});

test('featured records no longer depend on having a photo and placeholder styles reserve responsive stages', () => {
  const featuredSource = readFileSync(new URL('../src/showroom-sections.js', import.meta.url), 'utf8');
  assert.doesNotMatch(featuredSource, /productsWithUsableImages\.includes/);
  const css = readFileSync(new URL('../src/image-placeholders.css', import.meta.url), 'utf8');
  assert.match(css, /--fsd-placeholder-accent:\s*#D4AF37/i);
  assert.match(css, /background:\s*#0A0A0A/i);
  assert.match(css, /shield-refined\.png/);
  assert.match(css, /Space Mono.*ui-monospace/);
  assert.doesNotMatch(css, /lime|#b9ff42|185,\s*255,\s*66/i);
  assert.match(css, /aspect-ratio: 4 \/ 5/);
  assert.match(css, /max-width: 760px/);
  assert.match(css, /prefers-reduced-motion/);
});
