import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { products } from '../src/catalogue-data.js';
import {
  aegisGiletPreviewRecord,
  aegisGiletSource,
  createAegisGiletPreview,
} from '../src/aegis-gilet-campaign.js';

test('private Aegis proof reuses the existing master product and keeps catalogue values unchanged', () => {
  const preview = createAegisGiletPreview();
  const product = products.find(candidate => candidate.id === 46);
  assert.equal(preview.product, product);
  assert.equal(product.name, 'FSD Aegis Modest Performance Gilet');
  assert.equal(product.category, 'Modest Activewear');
  assert.equal(product.audience, 'Women’s');
  assert.equal(product.colourways, 'Black / Gold');
  assert.equal(product.confirmedPrice, 69.99);
  assert.deepEqual(product.images, []);
  assert.equal(preview.path, '/__catalogue-preview/aegis-modest-performance-gilet/');
  assert.equal(aegisGiletPreviewRecord.product, product);
});

test('Aegis gallery maps ten individual lossless crops and preserves its original composite', () => {
  const preview = aegisGiletPreviewRecord;
  assert.equal(aegisGiletSource.width, 1536);
  assert.equal(aegisGiletSource.height, 1024);
  assert.deepEqual(preview.gallery.map(asset => asset.id), [
    'front-three-quarter',
    'side-profile',
    'full-rear',
    'rear-three-quarter',
    'zipper-pull',
    'mesh-panel',
    'waist-adjuster',
    'zipper-detail',
    'chest-shield',
    'sleeve-emblem',
  ]);

  const sourcePath = fileURLToPath(new URL(`../../${aegisGiletSource.file}`, import.meta.url));
  const sourceBytes = readFileSync(sourcePath);
  assert.equal(
    createHash('sha256').update(sourceBytes).digest('hex'),
    aegisGiletSource.sha256,
    'the supplied composite must remain unchanged',
  );
  for (const asset of preview.gallery) {
    const assetPath = fileURLToPath(new URL(`../../${asset.file}`, import.meta.url));
    assert.ok(existsSync(assetPath), `${asset.file} must exist`);
    assert.ok(statSync(assetPath).size > 0, `${asset.file} must not be empty`);
    assert.equal(asset.type, 'image/webp');
    assert.equal(asset.src, `${preview.path}media/${asset.id}`);
    assert.ok(asset.alt.length > 20, `${asset.id} needs descriptive alt text`);
  }
});

test('Aegis visual detail and product claims remain pending verification', () => {
  const preview = aegisGiletPreviewRecord;
  assert.match(preview.description, /have not been verified/i);
  assert.match(preview.reviewNote, /pending review/i);
  assert.match(preview.gallery.find(asset => asset.id === 'full-rear').reviewNote, /not been verified/i);
  assert.match(preview.gallery.find(asset => asset.id === 'mesh-panel').reviewNote, /not verified/i);
});
