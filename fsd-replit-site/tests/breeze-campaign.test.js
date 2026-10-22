import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { createBreezeDraftData } from '../src/breeze-campaign.js';
import draft from '../content/fsd-breeze-private/draft.json' with { type: 'json' };
import imageManifest from '../content/fsd-breeze-private/image-manifest.json' with { type: 'json' };
import masterProducts from '../src/master-products.json' with { type: 'json' };

const appRoot = resolve(new URL('..', import.meta.url).pathname);

function jpegDimensions(buffer) {
  const startOfFrame = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset++;
      continue;
    }
    while (buffer[offset] === 0xff) offset++;
    const marker = buffer[offset++];
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    const length = buffer.readUInt16BE(offset);
    if (startOfFrame.has(marker)) {
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5),
      };
    }
    offset += length;
  }
  throw new Error('Could not locate JPEG frame dimensions.');
}

test('Breeze draft links to the existing master record without changing it', () => {
  const { draft: returnedDraft, product, variants, masterProduct } = createBreezeDraftData();
  assert.equal(returnedDraft.masterProductId, 49);
  assert.equal(returnedDraft.status, 'DRAFT');
  assert.equal(returnedDraft.visibility, 'development-only');
  assert.equal(product.name, 'FSD Breeze Lightweight Modest Overshirt');
  assert.equal(product.masterProductId, 49);
  assert.equal(product.priceLabel, '£64.99');
  assert.match(returnedDraft.sourcePriceConflict, /draft specification labels price unverified/i);
  assert.equal(masterProduct['Price (£) confirmed'], '64.99');
  assert.equal(masterProduct.Colourways, 'Black / Gold');
  assert.equal(masterProduct['Image status'], 'No image confirmed');
  assert.equal(masterProduct['Product name'], 'FSD Women\'s Lightweight Modest Training Overshirt');
  assert.equal(masterProducts.filter(record => Number(record.id) === 49).length, 1);

  const modestFlow = masterProducts.find(record => Number(record.id) === 50);
  assert.equal(modestFlow['Product name'], 'FSD Modest Flow Training Trousers');
  assert.equal(modestFlow['Price (£) confirmed'], '54.99');
});

test('Breeze has six draft colour concepts and four mapped views per colour', () => {
  const { variants } = createBreezeDraftData();
  assert.equal(variants.length, 6);
  assert.deepEqual(variants.map(variant => variant.label), [
    'Onyx Black — Core',
    'Deep Olive — Earth',
    'Warm Taupe — Modest',
    'Slate Grey — Tech',
    'Midnight Navy — Performance',
    'Deep Burgundy — Combat',
  ]);
  for (const variant of variants) {
    assert.equal(variant.views.length, 4);
    assert.deepEqual(variant.views.map(view => view.id).sort(), ['back', 'detail', 'front', 'side']);
    assert.match(variant.approvalStatus, /DRAFT/);
    assert.match(variant.brandStatus, /UNVERIFIED/);
  }
});

test('all 24 private JPEGs match the supplied manifest, hashes, and native dimensions', () => {
  const assets = imageManifest.variants.flatMap(variant =>
    variant.assets.map(asset => ({ variant, asset })));
  assert.equal(assets.length, 24);
  assert.equal(new Set(assets.map(({ asset }) => asset.id)).size, 24);

  for (const { variant, asset } of assets) {
    const buffer = readFileSync(resolve(appRoot, 'content/fsd-breeze-private/assets', asset.file));
    const hash = createHash('sha256').update(buffer).digest('hex');
    assert.equal(hash, asset.sha256, `${asset.id} must remain byte-identical to its source`);
    assert.deepEqual(jpegDimensions(buffer), { width: asset.width, height: asset.height });
    assert.equal(asset.width, 256, `${asset.id} must not be upscaled`);
    assert.ok(asset.file.startsWith(`${variant.id}/fsd-breeze_${variant.id}_`));
  }
});

test('Breeze remains a development-only proof with no invented hero or contact-sheet gallery', () => {
  assert.equal(draft.commercial.checkoutEnabled, false);
  assert.equal(draft.commercial.paymentsEnabled, false);
  assert.equal(draft.commercial.published, false);
  assert.equal(draft.imagePolicy.campaignHeroAsset, null);
  assert.equal(draft.imagePolicy.newCampaignBanner, false);
  assert.equal(imageManifest.sourceContactSheet.routeServed, false);
  assert.equal(imageManifest.assetQuality.upscaled, false);
});
