import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import master from '../src/master-products.json' with { type: 'json' };
import { products } from '../src/catalogue-data.js';
import { productCardImageMarkup, productColourwayImageIndex, productColourwayOptions } from '../src/product-card-media.js';
import { renderProductDetailPage } from '../src/product-detail-page.js';

test('CORE Sports Hijab gallery maps all nine supplied views only to existing Black/Gold', () => {
  const source = master.find(item => item.id === 42);
  const product = products.find(item => item.id === 42);
  const velocity = products.find(item => item.id === 43);
  const colourways = productColourwayOptions(product);
  const imageIndexes = colourways.map(colourway => productColourwayImageIndex(product.images, colourway));

  assert.ok(source);
  assert.ok(product);
  assert.equal(source['Product name'], 'CORE Sports Hijab');
  assert.equal(product.name, 'CORE Sports Hijab');
  assert.equal(source['Price (£) confirmed'], '29.99');
  assert.equal(source['Image status'], 'Approved product photography — Black/Gold only');
  assert.equal(source.Colourways, 'Black/Gold, Charcoal/Gold, Navy/Gold, Stone Grey/Bronze, Ivory/Bronze, Burgundy/Gold, Olive/Gold, Sand/Bronze');
  assert.deepEqual(colourways, ['Black/Gold', 'Charcoal/Gold', 'Navy/Gold', 'Stone Grey/Bronze', 'Ivory/Bronze', 'Burgundy/Gold', 'Olive/Gold', 'Sand/Bronze']);
  assert.deepEqual(imageIndexes, [0, -1, -1, -1, -1, -1, -1, -1]);
  assert.equal(product.images.length, 9);
  assert.deepEqual(product.images.at(-1), {
    src: '/products/sports-hijab/black-gold/editorial-portrait.webp',
    label: 'Black/Gold / Editorial portrait',
    colourway: 'Black/Gold',
  });
  assert.ok(product.images.every(image => image.colourway === 'Black/Gold' && image.label));
  assert.ok(product.images.every(image => existsSync(join(process.cwd(), 'public', image.src.slice(1)))));

  assert.match(productCardImageMarkup(product, { colourway: 'Black/Gold' }), /<img/);
  for (const colourway of colourways.filter(value => value !== 'Black/Gold')) {
    const markup = productCardImageMarkup(product, { colourway });
    assert.match(markup, /fsd-image-placeholder/);
    assert.doesNotMatch(markup, /<img/);
  }

  const detail = renderProductDetailPage({
    product,
    images: product.images,
    initialImageIndex: -1,
    galleryPlaceholders: [],
    colourways,
    colourwayImageIndexes: imageIndexes,
    sizes: [],
    price: { label: '', value: '£29.99' },
    canPurchase: true,
  });
  assert.equal((detail.match(/data-catalogue-colourway-index=/g) || []).length, 8);
  assert.match(detail, /value="Black\/Gold"[^>]*checked/);
  assert.match(detail, /data-catalogue-selected-colourway aria-live="polite">Black\/Gold/);
  assert.match(detail, /\/products\/sports-hijab\/black-gold\//);

  assert.equal(velocity.colourways, 'Black / Gold');
  assert.equal(velocity.images.length, 5);
  assert.ok(velocity.images.every(image => image.src.startsWith('/assets/products/velocity-hijab-')));
});
