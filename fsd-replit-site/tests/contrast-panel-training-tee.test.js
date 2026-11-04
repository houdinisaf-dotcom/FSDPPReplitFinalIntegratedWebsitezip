import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { products, productImagesForDisplay } from '../src/data/products.js';
import { priceInfo } from '../src/catalogue-data.js';
import { canAddToBag } from '../src/bag.js';

const colourway = 'Luminous aqua / deep teal navy / white';
const product = products.find(item => item.id === 2);

test('Contrast-Panel Training Tee uses the supplied gallery only for its recorded colourway', async () => {
  const images = productImagesForDisplay(product);

  assert.equal(images.length, 9);
  assert.ok(images.every(image => image.colourway === colourway));
  assert.deepEqual(images.map(image => image.label.split(' / ').at(-1)), [
    'Front view',
    'Back view',
    'Lifestyle hero',
    'Alternate front view',
    'Side profile',
    'Training view',
    'Branding detail',
    'Panel and sleeve detail',
    'Fabric detail',
  ]);

  await Promise.all(images.map(image =>
    access(fileURLToPath(new URL(`../public${image.src}`, import.meta.url)))));
});

test('Contrast-Panel Training Tee retains unconfirmed purchase values', () => {
  assert.equal(product.confirmedPrice, null);
  assert.deepEqual(priceInfo(product), { label: '', value: '' });
  assert.equal(canAddToBag(product), false);
});
