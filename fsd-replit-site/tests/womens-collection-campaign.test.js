import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import masterProducts from '../src/master-products.json' with { type: 'json' };
import {
  createWomensCollectionAudit,
  createWomensCollectionPreview,
  womensCollectionSourceManifest,
} from '../src/womens-collection-campaign.js';
import {
  validateWomensCollectionPrivateAssets,
  womensCollectionPrivatePreviewPlugin,
} from '../scripts/womens-collection-private-preview-plugin.mjs';
import { privateAssetsSkip } from './private-assets.js';

const appRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const collageIndexes = new Set([4, 5, 6, 25, 27, 28, 30, 31, 32, 33, 34, 35, 41, 51]);

test('all three product proofs are private and have no buying or publication capability', () => {
  for (const slug of ['flex', 'zip-neck', 'breeze']) {
    const preview = createWomensCollectionPreview(slug);
    assert.ok(preview);
    assert.equal(preview.status, 'private-review');
    assert.equal(preview.checkoutEnabled, false);
    assert.equal(preview.paymentsEnabled, false);
    assert.equal(preview.publicListingEnabled, false);
    assert.equal(preview.publicationAuthorized, false);
  }
  assert.equal(womensCollectionPrivatePreviewPlugin().apply, 'serve');
});

test('the three product groups use standalone photographs and keep composites out of their galleries', () => {
  const expectedCounts = { flex: 9, 'zip-neck': 12, breeze: 6 };
  for (const [slug, count] of Object.entries(expectedCounts)) {
    const preview = createWomensCollectionPreview(slug);
    const images = preview.product.variants.flatMap(variant => variant.images);
    assert.equal(images.length, count);
    assert.equal(new Set(images.map(image => image.id)).size, count);
    assert.ok(images.every(image => !collageIndexes.has(image.index)));
  }
});

test('FLEX uses only its approved photo group and excludes unconfirmed brown outfits', () => {
  const flex = createWomensCollectionPreview('flex').product;
  const master = masterProducts.find(product => product.id === 40);
  assert.equal(master['Price (£) confirmed'], '49.99');
  assert.equal(master.Colourways, 'Black / Gold');
  assert.equal(flex.price.display, '');
  assert.equal(flex.price.type, 'master-reference');
  assert.equal(flex.price.approvedForSale, false);
  assert.deepEqual(flex.variants.map(variant => variant.id), ['black-gold']);
  assert.ok(flex.variants.flatMap(variant => variant.images)
    .every(image => !['womens-52', 'womens-53'].includes(image.id)));
});

test('zip-neck top stays distinct from AEROFORGE and has no master price assigned', () => {
  const top = createWomensCollectionPreview('zip-neck').product;
  assert.equal(top.masterProductId, null);
  assert.equal(top.price.display, '');
  assert.equal(top.price.note, '');
  assert.equal(top.variants.length, 6);
  assert.equal(top.variants.reduce((sum, variant) => sum + variant.images.length, 0), 12);
  assert.equal(masterProducts.find(product => product.id === 39).id, 39);
});

test('BREEZE boards are excluded and missing standalone colour images remain explicit', () => {
  const breeze = createWomensCollectionPreview('breeze').product;
  const master = masterProducts.find(product => product.id === 49);
  assert.equal(master['Price (£) confirmed'], '64.99');
  assert.equal(breeze.price.display, '');
  assert.equal(breeze.price.approvedForSale, false);
  assert.equal(breeze.variants.length, 6);
  assert.equal(breeze.variants.filter(variant => variant.images.length > 0).length, 2);
  assert.equal(breeze.variants.filter(variant => variant.images.length === 0).length, 4);
  assert.ok(breeze.variants.every(variant => variant.approval === 'unconfirmed'));
});

test('audit accounts for all 53 images and isolates duplicates and composite boards', () => {
  assert.doesNotThrow(() => validateWomensCollectionPrivateAssets());
  const audit = createWomensCollectionAudit();
  assert.equal(audit.totalSourceImages, 53);
  assert.equal(audit.excludedOrUnassignedCount, 26);
  assert.equal(audit.references.length, 26);
  const auditOnlyIds = ['womens-01', 'womens-02', 'womens-03', 'womens-26', 'womens-52', 'womens-53'];
  assert.ok(auditOnlyIds.every(id => audit.references.some(reference =>
    reference.id === id && reference.kind === 'Audit-only outfit')));
  for (const slug of ['flex', 'zip-neck', 'breeze']) {
    const productImages = createWomensCollectionPreview(slug).product.variants
      .flatMap(variant => variant.images);
    assert.ok(auditOnlyIds.every(id => !productImages.some(image => image.id === id)));
  }
  assert.ok(auditOnlyIds.every(id =>
    womensCollectionSourceManifest.assets.find(asset => asset.id === id)?.assignment?.status === 'audit-only'));
  assert.ok(audit.references.filter(reference => auditOnlyIds.includes(reference.id))
    .every(reference => /excluded/i.test(reference.note)));
  assert.deepEqual(
    audit.references.filter(reference => reference.index >= 7 && reference.index <= 12).map(reference => reference.index),
    [7, 8, 9, 10, 11, 12],
  );
  assert.ok([30, 31, 32, 33, 34, 35, 41, 51].every(index =>
    audit.references.some(reference => reference.index === index)));
  assert.ok(audit.references.filter(reference => reference.index >= 7 && reference.index <= 12)
    .every(reference => reference.logoStatus.startsWith('Duplicate')));
  const productImageIds = ['flex', 'zip-neck', 'breeze'].flatMap(slug =>
    createWomensCollectionPreview(slug).product.variants.flatMap(variant =>
      variant.images.map(image => image.id)));
  const auditImageIds = audit.references.map(reference => reference.id);
  assert.equal(new Set([...productImageIds, ...auditImageIds]).size, womensCollectionSourceManifest.assets.length);
  assert.deepEqual(
    [...productImageIds, ...auditImageIds].sort(),
    womensCollectionSourceManifest.assets.map(asset => asset.id).sort(),
  );
});

test('the source archive and all preview media are present without modifying master data', { skip: privateAssetsSkip }, () => {
  assert.equal(womensCollectionSourceManifest.originalTiffCount, 53);
  assert.equal(
    existsSync(resolve(appRoot, '..', womensCollectionSourceManifest.sourceArchive)),
    true,
  );
  for (const asset of womensCollectionSourceManifest.assets) {
    assert.ok(existsSync(resolve(appRoot, asset.file)), `Missing private image ${asset.id}`);
  }
  assert.equal(masterProducts.find(product => product.id === 40)['Price (£) confirmed'], '49.99');
  assert.equal(masterProducts.find(product => product.id === 49)['Price (£) confirmed'], '64.99');
});
