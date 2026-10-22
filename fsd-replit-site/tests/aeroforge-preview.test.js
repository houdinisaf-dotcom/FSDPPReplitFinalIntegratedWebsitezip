import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import masterProducts from '../src/master-products.json' with { type: 'json' };
import draft from '../content/aeroforge-private/draft.json' with { type: 'json' };
import manifest from '../content/aeroforge-private/image-manifest.json' with { type: 'json' };
import { createAeroForgeDraftData } from '../src/aeroforge-campaign.js';
import { createAeroForgeDevelopmentIntegration } from '../src/aeroforge-development-integration.js';
import { aeroforgePrivatePreviewPlugin } from '../scripts/aeroforge-private-preview-plugin.mjs';

const projectRoot = resolve(new URL('..', import.meta.url).pathname);
const sourceRoot = resolve(projectRoot, 'content/aeroforge-private/assets');

test('AeroForge collection and both products stay in a non-purchasable draft layer', () => {
  assert.equal(draft.collection.editorialStatus, 'Draft');
  assert.equal(draft.collection.approvalStatus, 'Pending approval');
  assert.equal(draft.collection.purchaseEnabled, false);
  assert.equal(draft.collection.publicationAuthorized, false);
  assert.equal(draft.products.length, 2);
  assert.deepEqual(draft.products.map(product => product.name), [
    'FSD AeroForge Modest Training Top',
    'FSD AeroForge Performance Joggers',
  ]);
  for (const product of draft.products) {
    assert.equal(product.editorialStatus, 'Draft');
    assert.equal(product.id, null);
    assert.equal(product.purchaseEnabled, false);
    assert.equal(product.publicationAuthorized, false);
    assert.equal(product.priceGbp, null);
    assert.equal(product.inventory, null);
    assert.equal(product.sku, null);
    assert.equal(product.variants.length, 6);
  }
  assert.equal(draft.products[0].variants.find(variant => variant.id === 'mauve').view, 'rear');
  assert.match(draft.products[0].variants.find(variant => variant.id === 'mauve').viewStatus, /front image pending/i);
  assert.match(draft.products[0].description, /visual reference only/i);
  assert.match(draft.products[1].description, /standalone jogger photography.*pending review/i);
  assert.equal(draft.products[1].details.length, 0);
  assert.match(draft.catalogueNote, /record and its values are unchanged/i);
});

test('all supplied image files remain byte-identical to the checked manifest', () => {
  assert.equal(manifest.assets.length, 13);
  for (const asset of manifest.assets) {
    const file = readFileSync(resolve(sourceRoot, asset.file));
    assert.equal(
      createHash('sha256').update(file).digest('hex'),
      asset.sha256,
      `${asset.file} changed after import`,
    );
  }
  const archive = readFileSync(resolve(projectRoot, '../attached_assets/FSD_AeroForge_Website_Images_1792596957650.zip'));
  assert.equal(
    createHash('sha256').update(archive).digest('hex'),
    manifest.sourceArchive.sha256,
  );
  assert.match(readFileSync(resolve(sourceRoot, 'ASSET_MANIFEST.txt'), 'utf8'), /mauve is REAR view/i);
});

test('the existing master set remains separate and unchanged', () => {
  const masterSet = masterProducts.find(product => product.id === 51);
  assert.equal(masterSet?.['Product name'], 'FSD Aeroforge Modest Tunic & Jogger Set');
  assert.equal(masterSet?.['Price (£) confirmed'], '89.99');
  assert.equal(masterSet?.['Colourways'], 'Black, Grey, Navy, Olive, Mauve, White');
  assert.equal(draft.products.some(product => product.id === 51), false);
});

test('private preview data maps one fixed hero, six true colour assets, restrained details, and the asset ledger', () => {
  const preview = createAeroForgeDraftData();
  assert.equal(preview.products.length, 2);
  assert.equal(preview.collection.hero.src, '/__catalogue-preview/aeroforge/media/aeroforge-collection-hero');
  assert.equal(preview.products[0].variants.length, 6);
  assert.equal(preview.products[1].variants.length, 6);
  assert.equal(preview.products[0].details.length, 4);
  assert.equal(preview.products[1].details.length, 0);
  assert.match(preview.products[0].variants.find(variant => variant.id === 'mauve').src, /aeroforge-outfit-mauve-rear$/);
  assert.match(preview.products[0].variants.find(variant => variant.id === 'mauve').viewStatus, /front image pending/i);
  assert.equal(preview.assetManifest.length, 13);
  assert.ok(preview.imageNotes.some(note => /plain FSD text/i.test(note)));
  assert.ok(preview.specificationNotes.some(note => /composition/i.test(note)));
});

test('the development-only collection entry is normal discovery with no purchase action', () => {
  const integration = createAeroForgeDevelopmentIntegration();
  assert.match(integration.collectionCard, /data-aeroforge-draft-card/);
  assert.match(integration.collectionCard, /PRE-LAUNCH CONCEPT/);
  assert.match(integration.collectionCard, /EXPLORE COLLECTION/);
  assert.match(integration.collectionCard, /\/__catalogue-preview\/aeroforge\//);
  assert.doesNotMatch(integration.collectionCard, /ADD TO CART|BUY NOW|£\d/i);
  assert.doesNotMatch(integration.collectionCard, /PRIVATE COLLECTION REFERENCE|PENDING APPROVAL/);
  assert.equal(integration.collectionCardPlacement.divisionId, 'apparel');
  assert.equal(integration.collectionCardPlacement.groupId, 'womens-modest-combat');
  assert.equal(integration.collectionCardPlacement.heading, 'AEROFORGE');
});

test('AeroForge browsing uses separate modal product selectors and labels jogger images only as outfit references', () => {
  const source = readFileSync(resolve(projectRoot, 'src/aeroforge-preview-ui/aeroforge-preview.js'), 'utf8');
  assert.match(source, /createElement\('dialog'\)/);
  assert.match(source, /data-af-open="\$\{kind\}"/);
  assert.match(source, /coordinated outfit/i);
  assert.match(source, /OUTFIT REFERENCE/);
  assert.match(source, /Product details are being finalised\./);
  assert.doesNotMatch(source, /standalone jogger photography and product details are pending/i);
  assert.doesNotMatch(source, /01_collection_hero|suppliedOutfitAssets|af-proof-ledger|PRIVATE DRAFT/);
  assert.match(source, /dialog\.addEventListener\('cancel'/);
  assert.match(source, /opener\.focus\(\{ preventScroll: true \}\)/);
});

test('the private asset/page route is dev-serve-only', () => {
  assert.equal(aeroforgePrivatePreviewPlugin().apply, 'serve');
});
