import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import master from '../src/master-products.json' with { type: 'json' };
import { products } from '../src/catalogue-data.js';
import { productColourwayImageIndex, productColourwayOptions, productCardImageMarkup } from '../src/product-card-media.js';
import { productSizeOptions, renderProductDetailPage } from '../src/product-detail-page.js';

test('Aeroforge Hybrid Short photo is mapped only to its existing Black/Green variant', () => {
  const source = master.find(item => item.id === 19);
  const product = products.find(item => item.id === 19);
  const images = product.images;
  const colourways = productColourwayOptions(product);
  const imageIndexes = colourways.map(colourway => productColourwayImageIndex(images, colourway));
  const image = images[0];

  assert.ok(source);
  assert.ok(product);
  assert.equal(source['Product name'], 'FSD Aeroforge Hybrid Short');
  assert.equal(source['Price (£) confirmed'], '44.99');
  assert.equal(source['Image status'], 'Approved product photography');
  assert.equal(source.Colourways, 'Black/Green, Black/Red, Black/Grey, Navy/Blue, Olive/Black, White/Green');
  assert.equal(products.filter(item => item.name === 'FSD Aeroforge Hybrid Short').length, 1);
  assert.deepEqual(colourways, ['Black/Green', 'Black/Red', 'Black/Grey', 'Navy/Blue', 'Olive/Black', 'White/Green']);
  assert.deepEqual(imageIndexes, [0, -1, -1, -1, -1, -1]);
  assert.equal(image.colourway, 'Black/Green');
  assert.ok(image.label);
  assert.ok(existsSync(join(process.cwd(), 'public', image.src.slice(1))));

  assert.match(productCardImageMarkup(product, { colourway: 'Black/Green' }), /<img/);
  const unphotographedVariant = productCardImageMarkup(product, { colourway: 'Black/Red' });
  assert.match(unphotographedVariant, /fsd-image-placeholder/);
  assert.doesNotMatch(unphotographedVariant, /<img/);

  const markup = renderProductDetailPage({
    product,
    images,
    initialImageIndex: 0,
    galleryPlaceholders: [],
    colourways,
    colourwayImageIndexes: imageIndexes,
    sizes: productSizeOptions(product),
    price: { label: '', value: '£44.99' },
    canPurchase: true,
  });
  assert.equal((markup.match(/data-catalogue-colourway-index=/g) || []).length, 6);
  assert.match(markup, /data-catalogue-colourway-image-index="-1"/);
  assert.match(markup, /data-catalogue-main-image/);
  assert.match(markup, /FSD Aeroforge Hybrid Short — Black\/Green \/ Front lifestyle view/);
});
