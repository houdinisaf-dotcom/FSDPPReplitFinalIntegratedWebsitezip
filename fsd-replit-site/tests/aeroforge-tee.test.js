import test from 'node:test';
import assert from 'node:assert/strict';
import master from '../src/master-products.json' with { type: 'json' };
import { getVerifiedProductSpecifications, products } from '../src/catalogue-data.js';
import { productSizeOptions, renderProductDetailPage } from '../src/product-detail-page.js';

const expectedColourways = [
  'White / Green',
  'All Black',
  'Black / Grey',
  'Sage / Black',
  'Charcoal / Orange',
  'Navy / Blue',
];

test('Aeroforge Training Tee public master record uses the supplied approved values', () => {
  const source = master.find(product => product.id === 18);
  const product = products.find(item => item.id === 18);
  const specifications = getVerifiedProductSpecifications(18);

  assert.ok(source);
  assert.ok(product);
  assert.equal(source['Product name'], 'FSD Aeroforge Training Tee');
  assert.equal(source['Price (£) confirmed'], '39.99');
  assert.equal(source.SKU, 'FSD-AF-T01');
  assert.deepEqual(source.Colourways.split('; ').map(value => value.trim()), expectedColourways);
  assert.deepEqual(productSizeOptions(product), ['S', 'M', 'L', 'XL', 'XXL']);
  assert.equal(source['Image status'], 'No image confirmed');
  assert.equal(source['Specification status'], 'verified');
  assert.deepEqual(source['Care instructions'], [
    'Machine wash cold at 30°C',
    'Do not tumble dry',
    'Do not iron directly on graphics',
  ]);
  assert.deepEqual(specifications.materials, ['88% Recycled Technical Polyester; 12% Elastane Poly-Blend']);
  assert.equal(specifications.technicalSpecs.fabricWeight, '180 GSM');
  assert.match(specifications.technicalSpecs.care, /Machine wash cold at 30°C/);
  assert.equal(specifications.benefits.length, 4);
  assert.equal(Object.hasOwn(product, 'tier'), false);
});

test('Aeroforge Training Tee product details render its variants without inventing images or stock', () => {
  const product = products.find(item => item.id === 18);
  const colourways = product.colourways.split(/\s*;\s*/).filter(Boolean);
  const sizes = productSizeOptions(product);
  const markup = renderProductDetailPage({
    product,
    images: [],
    initialImageIndex: 0,
    galleryPlaceholders: [],
    colourways,
    colourwayImageIndexes: colourways.map(() => -1),
    sizes,
    price: { label: '', value: '£39.99' },
    canPurchase: true,
  });

  assert.equal((markup.match(/data-catalogue-colourway-index=/g) || []).length, 6);
  assert.equal((markup.match(/data-product-size/g) || []).length, 5);
  assert.match(markup, /£39\.99/);
  assert.match(markup, /Product code:<\/strong> FSD-AF-T01/);
  assert.match(markup, /88% Recycled Technical Polyester/);
  assert.match(markup, /Fabric weight:<\/strong> 180 GSM/);
  assert.match(markup, /Targeted Ventilation/);
  assert.match(markup, /Machine wash cold at 30°C/);
  assert.match(markup, /Availability by size: <strong>\[TO CONFIRM\]/);
  assert.match(markup, /fsd-image-placeholder/);
  assert.match(markup, /Image to be added/);
  assert.doesNotMatch(markup, /Sample \/ Launch Development Tier|InStock|data-catalogue-main-image/);
});
