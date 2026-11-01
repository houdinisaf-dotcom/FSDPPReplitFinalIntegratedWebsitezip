import test from 'node:test';
import assert from 'node:assert/strict';
import { products } from '../src/catalogue-data.js';
import {
  productSizeOptions,
  renderProductDetailPage,
  renderSizeGuideDialog,
} from '../src/product-detail-page.js';

const productFixture = {
  ...products.find(product => product.id === 43),
  name: 'FSD Test Leggings',
  category: "Women's / Performance Bottoms",
  description: 'A supplied catalogue description.',
  sizes: 'XS; S; M; L; XL; XXL',
  confirmedPrice: 65,
};

test('product detail markup includes accessible size choices and missing-data labels', () => {
  assert.deepEqual(productSizeOptions(productFixture), ['XS', 'S', 'M', 'L', 'XL', 'XXL']);

  const markup = renderProductDetailPage({
    product: productFixture,
    images: [{ label: 'Front view', src: '/product-front.jpg' }],
    initialImageIndex: 0,
    galleryPlaceholders: [],
    colourways: ['Obsidian Black', 'Sage Green'],
    colourwayImageIndexes: [-1, -1],
    sizes: productSizeOptions(productFixture),
    price: { label: '', value: '£65.00' },
    canPurchase: true,
  });

  assert.match(markup, /Choose a size/);
  assert.match(markup, /data-product-size/);
  assert.match(markup, /Availability by size: <strong>\[TO CONFIRM\]/);
  assert.match(markup, /data-size-guide/);
  assert.match(markup, /Front view/);
  assert.match(markup, /alt="FSD Test Leggings — Front view"/);
  assert.match(markup, /Concepts, capabilities, specifications, pricing and availability are not confirmed/);
  assert.match(markup, /UK delivery: \[TO CONFIRM\]/);
});

test('product JSON-LD omits offers until availability has a verified value', () => {
  const markup = renderProductDetailPage({
    product: productFixture,
    images: [{ label: 'Front view', src: '/product-front.jpg' }],
    initialImageIndex: 0,
    galleryPlaceholders: [],
    colourways: ['Obsidian Black'],
    colourwayImageIndexes: [-1],
    sizes: productSizeOptions(productFixture),
    price: { label: '', value: '£65.00' },
    canPurchase: true,
  });
  const json = markup.match(/<script type="application\/ld\+json" data-product-jsonld>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(json);
  const schema = JSON.parse(json);
  assert.equal(schema['@type'], 'ProductGroup');
  assert.equal(schema.name, 'FSD Test Leggings');
  assert.deepEqual(schema.size, ['XS', 'S', 'M', 'L', 'XL', 'XXL']);
  assert.equal('offers' in schema, false);
});

test('notification state collects no email when no notification provider is connected', () => {
  const markup = renderProductDetailPage({
    product: productFixture,
    images: [],
    initialImageIndex: 0,
    galleryPlaceholders: ['Front view'],
    colourways: [],
    colourwayImageIndexes: [],
    sizes: [],
    price: { label: '', value: '' },
    canPurchase: false,
  });
  assert.match(markup, /Email notifications are not connected\. No email is collected/);
  assert.doesNotMatch(markup, /type="email"/);
  assert.doesNotMatch(markup, /data-bag-add=/);
});

test('related products stay within the same category and audience', () => {
  const product = products.find(item => item.id === 60);
  const markup = renderProductDetailPage({
    product,
    images: [],
    initialImageIndex: 0,
    galleryPlaceholders: [],
    colourways: [],
    colourwayImageIndexes: [],
    sizes: [],
    price: { label: '', value: '' },
    canPurchase: false,
  });

  assert.match(markup, /Related products/);
  assert.match(markup, /data-related-product="59"/);
  assert.doesNotMatch(markup, /data-related-product="1"/);
});

test('size guide leaves measurements and body-versus-garment basis unconfirmed', () => {
  const guide = renderSizeGuideDialog(productFixture, productSizeOptions(productFixture));
  assert.match(guide, /Body measurements describe the person; garment measurements describe the item/);
  assert.match(guide, /Model height: \[TO CONFIRM\]/);
  assert.match(guide, /<td(?:\s+[^>]*)?>\[TO CONFIRM\]<\/td>/);
  assert.match(guide, /<th scope="col">Waist<\/th>/);
});
