import assert from 'node:assert/strict';
import test from 'node:test';
import {
  productActionImageForDisplay,
  productImagesForDisplay,
  products,
} from '../src/data/products.js';

test('card action reveal selects a mapped training image from the exact primary colourway', () => {
  const product = products.find(item => item.name === 'FSD Aeroforge Training Tee');
  assert.ok(product, 'the existing Aeroforge training tee should remain in the catalogue');

  const images = productImagesForDisplay(product);
  const primaryImage = images[0];
  const actionImage = productActionImageForDisplay(product, primaryImage);

  assert.ok(actionImage, 'an approved training view should be mapped for the default colourway');
  assert.notEqual(actionImage.src, primaryImage.src);
  assert.equal(actionImage.colourway, primaryImage.colourway);
  assert.match(actionImage.label, /\btraining\b/i);
  assert.equal(
    productActionImageForDisplay(product, { ...primaryImage, colourway: 'Unmapped colourway' }),
    null,
    'a training photo from another or unknown colourway must not appear as the card reveal',
  );
  assert.equal(
    productActionImageForDisplay(product, { ...primaryImage, colourway: '' }),
    null,
    'the reveal must stay hidden when the primary image has no confirmed colourway',
  );
});
