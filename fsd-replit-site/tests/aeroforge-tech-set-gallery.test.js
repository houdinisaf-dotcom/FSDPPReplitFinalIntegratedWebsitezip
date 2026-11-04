import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import masterProducts from '../src/master-products.json' with { type: 'json' };
import { products, productImagesForDisplay } from '../src/data/products.js';
import { productColourwayOptions } from '../src/product-card-media.js';
import { galleryIndexesForVariant } from '../src/product-gallery-model.js';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const techSet = products.find(product => product.id === 26);
const masterTechSet = masterProducts.find(product => product.id === 26);

test('AeroForge Tech Set keeps its existing price and six colourways', () => {
  assert.equal(masterTechSet?.['Product name'], 'FSD Aeroforge Tech Set (Zip Hoodie & Joggers)');
  assert.equal(masterTechSet?.['Price (£) confirmed'], '119.99');
  assert.equal(masterTechSet?.Colourways, 'Black/Green, Black/Grey, Navy/Blue, Olive/Black, Grey/Black, White/Green');
  assert.deepEqual(productColourwayOptions(techSet), [
    'Black/Green',
    'Black/Grey',
    'Navy/Blue',
    'Olive/Black',
    'Grey/Black',
    'White/Green',
  ]);
});

test('the approved standalone gallery maps only to Black/Green', () => {
  const images = productImagesForDisplay(techSet);
  assert.equal(images.length, 14);
  assert.ok(images.every(image => image.colourway === 'Black/Green'));
  assert.ok(images.every(image => image.src.endsWith('.webp')));
  assert.ok(images.every(image => existsSync(resolve(projectRoot, 'public', image.src.slice(1)))));
  assert.ok(images.every(image => !/collage|composite|board/i.test(image.src)));
  assert.deepEqual(
    galleryIndexesForVariant(techSet, images, { colourway: 'Black/Green' }),
    images.map((_, index) => index),
  );
  assert.deepEqual(
    galleryIndexesForVariant(techSet, images, { colourway: 'Black/Grey' }),
    [],
  );
});
