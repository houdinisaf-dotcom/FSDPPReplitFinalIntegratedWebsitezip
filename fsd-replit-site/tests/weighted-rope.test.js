import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { products } from '../src/catalogue-data.js';
import {
  createWeightedRopeDraft,
  weightedRopeManifest,
  weightedRopeRecord,
} from '../src/draft-catalogue.js';

const workspaceRoot = resolve(process.cwd(), '..');

test('the recovered rope draft retains its key, has no public ID, and stays outside the active catalogue', () => {
  const { product } = createWeightedRopeDraft();
  assert.equal(product.key, 'weighted-skipping-rope');
  assert.equal(product.id, null);
  assert.equal(product.editorialStatus, 'Draft');
  assert.equal(product.purchaseEnabled, false);
  assert.equal(product.category, 'Gym Hardware and Accessories');
  assert.deepEqual(product.placement, {
    division: 'hardware',
    groupId: 'strength-equipment',
    subcategory: null,
    needsApproval: false,
  });
  assert.equal(product.missing.includes('Exact Hardware subcategory approval'), false);
  assert.equal(product.confirmedPrice, null);
  assert.equal(product.suggestedPrice, null);
  assert.equal(product.contentApproval, null);
  assert.equal(product.publishAuthorisation, null);
  assert.equal(products.some(item => item.name === product.name), false);
  assert.equal(product.variants.length, 8);
  assert.equal(new Set(product.assetIds).size, 9);
});

test('the fixed campaign and eight complete source boards map to the correct ordered colour editions', () => {
  const { product, campaignHero } = createWeightedRopeDraft();
  assert.equal(weightedRopeManifest.imageCount, 9);
  assert.equal(campaignHero.id, 'weighted-rope-campaign');
  assert.equal(campaignHero.width, 1672);
  assert.equal(campaignHero.height, 941);
  assert.deepEqual(product.variants.map(variant => variant.colour), [
    'Matte Obsidian',
    'Crimson Red',
    'Deep Ultraviolet Plum',
    'Electric Cobalt Blue',
    'Electric Fuchsia',
    'Electric Green',
    'Hyper Flame Orange',
    'Sunbeam Yellow',
  ]);
  assert.deepEqual(product.variants.map(variant => variant.imageSrc), [
    'weighted-rope-matte-obsidian',
    'weighted-rope-crimson-red',
    'weighted-rope-deep-ultraviolet-plum',
    'weighted-rope-electric-cobalt-blue',
    'weighted-rope-electric-fuchsia',
    'weighted-rope-electric-green',
    'weighted-rope-hyper-flame-orange',
    'weighted-rope-sunbeam-yellow',
  ].map(id => `/__catalogue-preview/weighted-skipping-rope/media/${id}`));
  assert.equal(weightedRopeManifest.boardLayout.keepAsOneImage, true);
  assert.equal(weightedRopeManifest.boardLayout.cropped, false);
  assert.equal(weightedRopeManifest.boardLayout.split, false);
});

test('the nine supplied PNG originals match their recorded hashes and dimensions', async () => {
  const sources = [
    weightedRopeManifest.campaign,
    ...weightedRopeManifest.variants,
  ];
  assert.equal(sources.length, 9);
  for (const source of sources) {
    const bytes = await readFile(resolve(workspaceRoot, source.file));
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(createHash('sha256').update(bytes).digest('hex'), source.sha256, source.file);
    assert.equal(bytes.readUInt32BE(16), source.width, source.file);
    assert.equal(bytes.readUInt32BE(20), source.height, source.file);
  }
});

test('draft validation rejects publication, purchase, duplicate, and split-board changes', () => {
  assert.throws(() => createWeightedRopeDraft({ ...weightedRopeRecord, id: 88 }), /unassigned, unpublished draft/);
  assert.throws(() => createWeightedRopeDraft({ ...weightedRopeRecord, purchaseEnabled: true }), /unassigned, unpublished draft/);
  assert.throws(() => createWeightedRopeDraft({
    ...weightedRopeRecord,
    placement: { ...weightedRopeRecord.placement, groupId: 'combat-equipment' },
  }), /approved Hardware placement/);
  assert.throws(() => createWeightedRopeDraft(
    { ...weightedRopeRecord, assetIds: [...weightedRopeRecord.assetIds, 'extra-detail'] },
  ), /exactly its nine supplied source images/);
  const splitManifest = structuredClone(weightedRopeManifest);
  splitManifest.boardLayout = { ...splitManifest.boardLayout, split: true };
  assert.throws(() => createWeightedRopeDraft(weightedRopeRecord, splitManifest), /intact edition boards/);
});
