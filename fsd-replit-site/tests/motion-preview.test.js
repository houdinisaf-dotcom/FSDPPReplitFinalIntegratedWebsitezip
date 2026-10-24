import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMotionPreview, motionPreviewManifest } from '../src/motion-campaign.js';
import { motionPreviewPath, motionProductPath } from '../src/motion-preview-path.js';
import { createMotionDevelopmentIntegration } from '../src/motion-development-integration.js';
import { renderMotionPreview } from '../src/motion-preview-ui/motion-preview.js';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('FSD MOTION is a private 15-image campaign reference, not catalogue data', () => {
  assert.equal(motionPreviewManifest.sourceImageCount, 15);
  assert.equal(motionPreviewManifest.assets.length, 15);
  assert.equal(new Set(motionPreviewManifest.assets.map(asset => asset.id)).size, 15);
  assert.equal(motionPreviewManifest.collection.status, 'DRAFT / PENDING APPROVAL');
  assert.equal(motionPreviewManifest.collection.price, null);
  assert.equal(motionPreviewManifest.collection.hero.id, 'campaign-hero');
  assert.equal(motionPreviewManifest.collection.heroTextEmbedded, true);
  assert.match(motionPreviewManifest.collection.headline, /REAL MOVEMENT/);
  assert.match(motionPreviewManifest.reviewBoundary, /crops or a composite/);

  for (const asset of motionPreviewManifest.assets) {
    assert.equal(asset.status, 'private campaign reference');
    assert.equal(asset.type, 'image/jpeg');
    assert.ok(asset.file.startsWith('attached_assets/fsd-motion-reference/FSD_MOTION_Website_Images/'));
    assert.ok(readFileSync(resolve(workspaceRoot, asset.file)).byteLength > 0, `${asset.id} source file exists`);
  }

  const archiveBytes = readFileSync(resolve(workspaceRoot, motionPreviewManifest.sourceArchive));
  assert.equal(
    createHash('sha256').update(archiveBytes).digest('hex'),
    motionPreviewManifest.sourceArchiveSha256,
    'the original user-supplied archive remains unchanged',
  );
});

test('each supported concept has a separate private proof and an image-matched gallery', () => {
  const { products, assets, pendingFeatures, pendingSpecifications } = motionPreviewManifest;
  assert.equal(products.length, 4);
  assert.deepEqual(products.map(item => item.slug), [
    'mens-performance-training-top',
    'womens-performance-sports-bra',
    'performance-training-shorts',
    'smart-training-arm-sleeves',
  ]);

  for (const item of products) {
    assert.equal(item.status, 'DRAFT / PENDING APPROVAL');
    assert.equal(item.price, null);
    assert.equal(item.path, motionProductPath(item.slug));
    assert.equal(item.assetIds[0], item.mainAssetId);
    assert.ok(item.assetIds.length >= 3);
    assert.ok(item.assetIds.every(id => assets.some(asset => asset.id === id)));
    assert.ok(item.missingPhotographs.length > 0);
    assert.match(item.technicalStatus, /PENDING/);

    const preview = createMotionPreview(item.slug);
    assert.equal(preview.product.slug, item.slug);
    assert.equal(preview.collection.status, 'DRAFT / PENDING APPROVAL');
    assert.ok(preview.pendingSpecifications.length > 0);
  }

  assert.ok(pendingFeatures.length > 0);
  assert.ok(pendingFeatures.every(feature => feature.status === 'PENDING TECHNICAL VERIFICATION'));
  assert.ok(pendingSpecifications.some(item => /pricing|stock|availability/i.test(item)));
  assert.equal(createMotionPreview('not-a-product'), null);
  assert.equal(createMotionPreview().collection.name, 'FSD MOTION');
});

test('the draft card links into the development-only collection route without purchase details', () => {
  const integration = createMotionDevelopmentIntegration();
  assert.equal(motionPreviewPath, '/__catalogue-preview/fsd-motion/');
  assert.equal(integration.collectionCardPlacement.divisionId, 'bio-lab');
  assert.equal(integration.collectionCardPlacement.groupId, 'bio-lab-concepts');
  assert.match(integration.collectionCard, /FSD BIO-LAB™/);
  assert.match(integration.collectionCard, /FSD MOTION/);
  assert.doesNotMatch(integration.collectionCard, />\s*(?:CONCEPT|DRAFT|PREVIEW|PENDING REVIEW|PRIVATE VIEWING)\b/i);
  assert.doesNotMatch(integration.collectionCard, /£\s?\d|\bBUY\b|\bADD TO CART\b/i);
  assert.equal(integration.draftMenuItems[0].href, motionPreviewPath);
  assert.equal(integration.draftMenuItems[0].previewKicker, 'BIO-LAB™ / WEARABLE TECHNOLOGY');
  assert.equal(integration.draftMenuItems[0].sourceDivisionId, 'bio-lab');
  assert.equal(integration.draftMenuItems[0].sourceGroupId, 'bio-lab-concepts');
});

test('MOTION keeps campaign galleries and collection return links without customer-facing audit panels', () => {
  const collection = createMotionPreview();
  const collectionHtml = renderMotionPreview({
    collection: collection.collection,
    products: collection.products,
    assets: collection.assets,
    stories: collection.stories,
  });
  assert.match(collectionHtml, /BACK TO COLLECTION/);
  assert.doesNotMatch(collectionHtml, />\s*(?:CONCEPT|DRAFT|PREVIEW|PENDING REVIEW|PRIVATE VIEWING)\b/i);
  assert.equal((collectionHtml.match(/data-motion-gallery-select=/g) || []).length, 15);
  assert.equal((collectionHtml.match(/data-motion-product-link=/g) || []).length, 4);
  assert.doesNotMatch(collectionHtml, /PRIVATE PRODUCT PROOF|PRIVATE CONCEPT REVIEW|DRAFT \/ PENDING APPROVAL|motion-review-columns|Standalone views|Awaiting confirmation/);
  assert.doesNotMatch(collectionHtml, /ADD TO CART|BUY NOW|CHECKOUT NOW|£\s?\d/i);

  const product = createMotionPreview('mens-performance-training-top');
  const productHtml = renderMotionPreview({
    collection: product.collection,
    product: product.product,
    products: product.products,
    assets: product.assets,
    stories: product.stories,
  });
  assert.match(productHtml, /BACK TO MOTION COLLECTION/);
  assert.doesNotMatch(productHtml, /Product details are being finalised\./);
  assert.doesNotMatch(productHtml, />\s*(?:CONCEPT|DRAFT|PREVIEW|PENDING REVIEW|PRIVATE VIEWING)\b/i);
  assert.ok((productHtml.match(/data-motion-gallery-select=/g) || []).length >= 3);
  assert.doesNotMatch(productHtml, /PRIVATE PRODUCT PROOF|PRIVATE CONCEPT REVIEW|DRAFT \/ PENDING APPROVAL|motion-review-columns/);
});
