import assert from 'node:assert/strict';
import { existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { products } from '../src/catalogue-data.js';
import {
  createVelocityHijabPreview,
  velocityHijabPreviewRecord,
} from '../src/velocity-hijab-campaign.js';
import { velocityHijabPreviewPath } from '../src/velocity-hijab-preview-path.js';
import { privateAssetsSkip } from './private-assets.js';

test('private Velocity hijab preview reuses the existing product and supplied images', { skip: privateAssetsSkip }, () => {
  const preview = createVelocityHijabPreview();
  assert.equal(velocityHijabPreviewPath, '/__catalogue-preview/velocity-performance-sports-hijab/');
  assert.equal(preview.product, products.find(product => product.id === 43));
  assert.equal(preview.product.name, 'FSD Velocity Sports Hijab');
  assert.equal(preview.product.confirmedPrice, 34.99);
  assert.equal(preview.product.colourways, 'Black / Gold');
  assert.equal(preview.colour, 'Black / Gold');
  assert.equal(preview.gallery.length, 5);
  assert.deepEqual(preview.gallery.map(asset => asset.id), [
    'campaign', 'front-detail', 'rear-view', 'fabric-detail', 'branding-detail',
  ]);
  assert.deepEqual(preview.features.map(feature => feature.text), preview.product.features);
  assert.equal(preview.description, preview.product.description);
  assert.equal(preview.gallery[0].file, 'attached_assets/Main_product_listing_image_1792424117238.jpg');
  assert.equal(preview.gallery[0].src, '/__catalogue-preview/velocity-performance-sports-hijab/media/campaign');
  assert.equal(preview.product.images[0].src, '/assets/products/velocity-hijab-main-listing.jpg');
  assert.equal(preview.sideViewNote, 'The current listing uses the newer product photo set; this archived campaign gallery remains separate.');
  assert.equal(new Set(preview.gallery.map(asset => asset.file)).size, preview.gallery.length);
  for (const asset of preview.gallery) {
    const path = fileURLToPath(new URL(`../../${asset.file}`, import.meta.url));
    assert.ok(existsSync(path), `${asset.file} must exist`);
    assert.ok(statSync(path).size > 0, `${asset.file} must not be empty`);
  }
  assert.equal(velocityHijabPreviewRecord.product.id, 43);
});

test('archived campaign review retains its separate source gallery without inventing composition or care details', () => {
  const preview = velocityHijabPreviewRecord;
  assert.deepEqual(preview.features.map(feature => feature.title), [
    'Performance feature 1',
    'Performance feature 2',
    'Performance feature 3',
    'Performance feature 4',
    'Performance feature 5',
  ]);
  assert.ok(preview.gallery.some(asset => asset.id === 'fabric-detail'));
  assert.ok(preview.gallery.some(asset => asset.id === 'branding-detail'));
  assert.equal('materials' in preview.product, false);
  assert.equal('careInstructions' in preview.product, false);
  assert.doesNotMatch(
    [...preview.features.map(feature => `${feature.title} ${feature.text}`), preview.description].join(' '),
    /fabric composition|care instructions/i,
  );
});
