import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { readImageDimensions, reviewProductImages } from '../src/asset-curation.js';

test('asset review retains every input and only returns non-binding recommendations', () => {
  const assets = [
    {
      filename: 'campaign-grid.webp',
      name: 'Campaign board grid',
      url: '/fsd-assets/campaign-grid.webp',
      width: 900,
      height: 1200,
      sha256: 'a'.repeat(64),
    },
    {
      filename: 'campaign-copy.webp',
      name: 'Front detail',
      url: '/fsd-assets/campaign-copy.webp',
      width: 1200,
      height: 1600,
      tags: ['hero'],
      sha256: 'a'.repeat(64),
    },
    {
      filename: 'athlete-bokeh.webp',
      name: 'Editorial portrait',
      url: '/fsd-assets/athlete-bokeh.webp',
      width: 1600,
      height: 2200,
      sha256: 'b'.repeat(64),
    },
  ];

  const report = reviewProductImages(assets);

  assert.equal(report.reviewOnly, true);
  assert.equal(report.selectedHero, null);
  assert.equal(report.assets.length, assets.length);
  assert.deepEqual(report.assets.map(asset => asset.url), assets.map(asset => asset.url));
  assert.deepEqual(report.duplicateGroups, [{
    sha256: 'a'.repeat(64),
    count: 2,
    filenames: ['campaign-grid.webp', 'campaign-copy.webp'],
  }]);
  assert.ok(report.assets[0].reviewFlags.includes('possible-composite-name'));
  assert.ok(report.assets[0].reviewFlags.includes('below-1000px-review-threshold'));
  assert.ok(report.assets[0].reviewFlags.includes('exact-byte-duplicate-group'));
  assert.ok(report.assets[1].reviewFlags.includes('possible-copy-name'));
  assert.ok(report.assets[1].reviewFlags.includes('exact-byte-duplicate-group'));
  assert.deepEqual(report.heroCandidates.map(asset => asset.filename), [
    'campaign-copy.webp',
    'athlete-bokeh.webp',
  ]);
});

test('dimensions are read from the repository WebP and PNG headers without image conversion', async () => {
  const webp = await readFile(new URL('../public/fsd-assets/01946b45e43e.webp', import.meta.url));
  assert.deepEqual(readImageDimensions(webp), { width: 875, height: 1050 });

  const png = Buffer.alloc(24);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(png, 0);
  png.writeUInt32BE(1200, 16);
  png.writeUInt32BE(1800, 20);
  assert.deepEqual(readImageDimensions(png), { width: 1200, height: 1800 });
});

test('asset review marks missing dimensions instead of silently dropping the record', () => {
  const report = reviewProductImages([{ filename: 'unknown.bin', url: '/fsd-assets/unknown.bin' }]);
  assert.equal(report.assets.length, 1);
  assert.ok(report.assets[0].reviewFlags.includes('dimensions-unavailable'));
});
