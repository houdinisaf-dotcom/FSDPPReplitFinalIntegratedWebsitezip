import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import masterProducts from '../src/master-products.json' with { type: 'json' };
import {
  createModestFlowDraftData,
  modestFlowDraftRecord,
  modestFlowImageManifest,
} from '../src/modest-flow-campaign.js';
import { createModestFlowDevelopmentIntegration } from '../src/modest-flow-development-integration.js';
import { modestFlowMediaPath } from '../src/modest-flow-preview-path.js';
import { privateAssetsSkip } from './private-assets.js';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const expected = [
  ['onyx-black-core', 'Onyx Black (Core)', '#0D0D0D', 'modest-flow-onyx-black'],
  ['deep-olive-earth', 'Deep Olive (Earth)', '#2B3227', 'modest-flow-deep-olive'],
  ['warm-taupe-modest', 'Warm Taupe (Modest)', '#8A7B70', 'modest-flow-warm-taupe'],
  ['slate-grey-tech', 'Slate Grey (Tech)', '#666B70', 'modest-flow-slate-grey'],
  ['midnight-navy-performance', 'Midnight Navy (Performance)', '#1B2432', 'modest-flow-midnight-navy'],
  ['deep-burgundy-combat', 'Deep Burgundy (Combat)', '#4A1521', 'modest-flow-deep-burgundy'],
];

test('Modest Flow is a six-colour, no-price private draft with a separate fixed hero', () => {
  const data = createModestFlowDraftData();
  assert.equal(data.collection.name, 'FSD Modest Flow');
  assert.equal(data.collection.category, 'Modest Activewear');
  assert.equal(data.collection.divisionId, 'apparel');
  assert.equal(data.collection.groupId, 'womens-modest-combat');
  assert.equal(data.collection.status, 'Draft');
  assert.equal(data.collection.approvalStatus, 'Approved as visual/layout proof only; private and unpublished');
  assert.equal(data.collection.purchaseEnabled, false);
  assert.equal(data.collection.publicationAuthorized, false);
  assert.equal(data.collection.priceGbp, null);
  assert.equal(data.product.editorialStatus, 'Draft');
  assert.equal(data.product.approvalStatus, 'Approved as visual/layout proof only; private and unpublished');
  assert.equal(data.product.priceGbp, null);
  assert.equal(data.product.inventory, null);
  assert.equal(data.product.sku, null);
  assert.deepEqual(data.product.setComponents, [
    'Extended-length long-sleeve tunic',
    'Relaxed wide-leg trousers',
    'Matching hijab',
  ]);
  assert.equal(data.collection.hero.id, 'modest-flow-campaign-hero');
  assert.equal(data.product.variants.length, 6);
  assert.notEqual(data.collection.hero.id, data.product.variants[0].assetId);
  assert.deepEqual(
    data.product.variants.map(variant => [variant.id, variant.colour, variant.swatch, variant.assetId]),
    expected,
  );
  assert.ok(data.product.variants.every(variant => variant.imageSrc === modestFlowMediaPath(variant.assetId)));
});

test('each supplied image copy is byte-identical to its source and matches its manifest hash', { skip: privateAssetsSkip }, () => {
  for (const asset of modestFlowImageManifest.assets) {
    const source = readFileSync(resolve(projectRoot, '..', asset.source));
    const copy = readFileSync(resolve(projectRoot, 'content/modest-flow-private/assets', asset.file));
    assert.deepEqual(copy, source, `${asset.id} differs from its uploaded original`);
    assert.equal(createHash('sha256').update(copy).digest('hex'), asset.sha256, `${asset.id} hash mismatch`);
  }
});

test('the existing trousers master record remains separate and unchanged', () => {
  const trousers = masterProducts.find(product => product.id === 50);
  assert.equal(trousers?.['Product name'], 'FSD Modest Flow Training Trousers');
  assert.equal(trousers?.['Price (£) confirmed'], '54.99');
  assert.equal(modestFlowDraftRecord.product.relatedMasterRecord.id, 50);
  assert.equal(modestFlowDraftRecord.product.masterProductId, null);
});

test('draft validation rejects checkout, price, variant and image-role changes', () => {
  const withCheckout = structuredClone(modestFlowDraftRecord);
  withCheckout.product.purchaseEnabled = true;
  assert.throws(() => createModestFlowDraftData(withCheckout), /unpublished draft/);

  const withPrice = structuredClone(modestFlowDraftRecord);
  withPrice.product.priceGbp = '49.99';
  assert.throws(() => createModestFlowDraftData(withPrice), /unpublished draft/);

  const withWrongColour = structuredClone(modestFlowDraftRecord);
  withWrongColour.product.variants[0].colour = 'Matte Black';
  assert.throws(() => createModestFlowDraftData(withWrongColour), /source image mapping/);

  const withHeroReusedAsVariant = structuredClone(modestFlowDraftRecord);
  withHeroReusedAsVariant.product.variants[0].assetId = 'modest-flow-campaign-hero';
  assert.throws(() => createModestFlowDraftData(withHeroReusedAsVariant), /fixed campaign hero/);

  const withChangedSet = structuredClone(modestFlowDraftRecord);
  withChangedSet.product.setComponents[0] = 'Training top';
  assert.throws(() => createModestFlowDraftData(withChangedSet), /unpublished draft/);
});

test('development integration places the fixed hero in the existing women’s modest apparel collection', () => {
  const integration = createModestFlowDevelopmentIntegration();
  assert.equal(integration.collectionCardPlacement.divisionId, 'apparel');
  assert.equal(integration.collectionCardPlacement.groupId, 'womens-modest-combat');
  assert.equal(integration.collectionCardPlacement.heading, 'MODEST ACTIVEWEAR');
  assert.equal(integration.variants.length, 6);
  assert.match(integration.collectionCard, /data-modest-flow-open/);
  assert.match(integration.collectionCard, /modest-flow-campaign-hero/);
  assert.match(integration.collectionCard, /COORDINATED SET/);
  for (const component of integration.productData.setComponents) {
    assert.ok(integration.collectionCard.includes(component));
  }
  assert.doesNotMatch(integration.collectionCard, />\s*(?:CONCEPT|DRAFT|PREVIEW|PENDING REVIEW|PRIVATE VIEWING)\b/i);
  assert.doesNotMatch(integration.collectionCard, /PRIVATE PREVIEW|NO CHECKOUT|NOT PUBLISHED/i);
  assert.doesNotMatch(integration.collectionCard, /<(?:form|input)\b|data-(?:purchase|add-to-cart)=/i);
});

test('private media routing is development-only and read-only', async () => {
  const { modestFlowPrivatePreviewPlugin } = await import('../scripts/modest-flow-private-preview-plugin.mjs');
  const plugin = modestFlowPrivatePreviewPlugin();
  assert.equal(plugin.apply, 'serve');
  assert.equal(plugin.name, 'fsd-modest-flow-private-draft-preview');
});
