import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { products } from '../src/catalogue-data.js';
import { alightPreviewRecord, createAlightPreview } from '../src/alight-campaign.js';
import { createAlightDevelopmentIntegration } from '../src/alight-development-integration.js';
import { alightPreviewPath } from '../src/alight-preview-path.js';
import { createNavigationModel, getNavigationFeature } from '../src/site-navigation.js';
import { privateAssetsSkip } from './private-assets.js';

const sourcePath = relativePath => fileURLToPath(new URL(`../../${relativePath}`, import.meta.url));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

test('ALIGHT preview preserves the supplied image archive and all twelve source files', { skip: privateAssetsSkip }, () => {
  const preview = createAlightPreview();
  const archivePath = sourcePath(preview.sourceArchive);
  const archiveBytes = readFileSync(archivePath);
  const archiveEntries = execFileSync('unzip', ['-Z1', archivePath], { encoding: 'utf8' })
    .trim()
    .split('\n');

  assert.equal(digest(archiveBytes), preview.sourceArchiveSha256);
  assert.equal(preview.gallery.length, 12);
  assert.equal(preview.sourceImageCount, 12);
  assert.deepEqual(preview.gallery, alightPreviewRecord.gallery);

  for (const image of preview.gallery) {
    const copyPath = sourcePath(image.file);
    const copiedBytes = readFileSync(copyPath);
    assert.ok(statSync(copyPath).size > 0, `${image.file} must not be empty`);
    assert.ok(
      archiveEntries.some(entry => entry === image.archiveEntry || entry.endsWith(`/${image.archiveEntry}`)),
      `${image.archiveEntry} must remain present in the original ZIP`,
    );
    assert.equal(digest(copiedBytes), image.sourceSha256, `${image.archiveEntry} must remain byte-identical`);
    assert.equal(image.type, 'image/jpeg');
    assert.equal(image.src, `${alightPreviewPath}media/${image.id}`);
    assert.match(image.reviewNote, /concept|campaign|pending|not .*photo|not verified|unverified/i);
    assert.ok(image.alt.length > 20, `${image.id} needs descriptive alternative text`);
  }
});

test('ALIGHT is a private concept preview and does not alter the master catalogue', () => {
  const productsBefore = JSON.stringify(products);
  const preview = createAlightPreview();

  assert.equal(preview.path, alightPreviewPath);
  assert.equal(preview.product.name, 'FSD ALIGHT');
  assert.equal(preview.product.subtitle, 'Posture Awareness Wearable');
  assert.equal(preview.product.price, null);
  assert.equal(preview.product.id, undefined);
  assert.equal(preview.product.sku, undefined);
  assert.equal(products.some(product => /FSD ALIGHT/i.test(product.name)), false);
  assert.equal(JSON.stringify(products), productsBefore);
  assert.match(preview.product.status, /COMING SOON.*PENDING APPROVAL/);
  assert.match(preview.reviewBoundary, /not independent product photographs/i);
  assert.match(preview.reviewBoundary, /embedded claims.*verified product facts/i);
  assert.match(preview.campaignSupport, /pending technical verification/i);
  assert.deepEqual(preview.missingPhotography.map(item => item.match(/front|rear|side/i)?.[0]?.toLowerCase()), [
    'front',
    'rear',
    'side',
  ]);
  assert.equal(preview.pendingFeatures.length, 7);
  assert.ok(preview.pendingFeatures.every(feature => feature.status === 'Pending Technical Verification'));
  assert.ok(preview.pendingSpecifications.length >= 5);
});

test('ALIGHT appears in the private Bio-Lab collection while remaining separate from the master catalogue', () => {
  const publicBioLab = createNavigationModel().find(section => section.id === 'bio-lab');
  assert.ok(publicBioLab);
  assert.equal(publicBioLab.groups.some(group => group.items.some(item => /FSD ALIGHT/.test(item.title))), false);

  const integration = createAlightDevelopmentIntegration();
  const previewBioLab = createNavigationModel({
    includeDraftPreviews: true,
    draftMenuItems: integration.draftMenuItems,
  }).find(section => section.id === 'bio-lab');
  const group = previewBioLab.groups.find(entry => entry.id === 'bio-lab-concepts');
  const index = group.items.findIndex(item => item.title === 'FSD ALIGHT — Posture Awareness Wearable');
  const draft = group.items[index];

  assert.ok(draft);
  assert.equal(draft.kind, 'draft-product');
  assert.equal(draft.previewOnly, true);
  assert.equal(draft.href, alightPreviewPath);
  assert.equal(draft.featureImageSrc, alightPreviewRecord.productVisual.src);
  assert.equal(integration.draftPreviewTargets.get(draft.href), draft.featureImageSrc);
  assert.match(integration.draftProductCard, /data-alight-draft-card/);
  assert.equal(integration.collectionCardPlacement.divisionId, 'bio-lab');
  assert.equal(integration.collectionCardPlacement.groupId, 'bio-lab-concepts');
  assert.doesNotMatch(integration.draftProductCard, />\s*(?:CONCEPT|DRAFT|PREVIEW|PENDING REVIEW|PRIVATE VIEWING)\b/i);
  assert.doesNotMatch(integration.draftProductCard, /PRIVATE DRAFT|NO CHECKOUT|NOT AVAILABLE TO PURCHASE/);
  const mainSource = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  assert.ok(mainSource.includes('setDraftProductCard(alight.draftProductCard, alight.collectionCardPlacement)'));
  assert.match(mainSource, /if \(import\.meta\.env\.DEV\)[\s\S]*setDraftProductCard\(alight\.draftProductCard/);
  assert.match(draft.description, /posture-awareness wearable/i);
  assert.equal(draft.record, undefined);
  assert.equal(draft.productId, undefined);
  assert.equal(products.some(product => product.name === draft.title), false);
  assert.deepEqual(getNavigationFeature(previewBioLab, 0, index).imageSources, []);
});

test('ALIGHT keeps its campaign gallery while presenting a restrained development note', () => {
  const html = readFileSync(new URL('../alight-preview.html', import.meta.url), 'utf8');
  const previewSource = readFileSync(new URL('../src/alight-preview-ui/alight-preview.js', import.meta.url), 'utf8');
  const pluginSource = readFileSync(new URL('../scripts/draft-review-plugin.mjs', import.meta.url), 'utf8');

  assert.match(html, /noindex, nofollow, noarchive/);
  assert.match(html, /FSD ALIGHT/);
  assert.match(previewSource, /CAMPAIGN IMAGE/);
  assert.doesNotMatch(previewSource, /NOT PRODUCT PHOTOGRAPHY/);
  assert.doesNotMatch(previewSource, />\s*(?:CONCEPT|DRAFT|PREVIEW|PENDING REVIEW|PRIVATE VIEWING)\b/i);
  assert.match(previewSource, /BACK TO COLLECTION/);
  assert.match(previewSource, /data-alight-enlarge/);
  assert.match(previewSource, /data-alight-thumb=/);
  assert.doesNotMatch(previewSource, /PRIVATE PRODUCT PROOF|PRIVATE CONCEPT REVIEW|DRAFT \/ PENDING APPROVAL|alight-review-panel|IMAGE GAPS|Specifications to confirm/);
  assert.doesNotMatch(previewSource, /ADD TO CART|BUY NOW|CHECKOUT|£\d/i);
  assert.match(pluginSource, /name: 'fsd-weighted-rope-private-draft-review'[\s\S]*apply: 'serve'/);
  assert.match(pluginSource, /alightPreviewPath/);
  assert.match(pluginSource, /noindex, nofollow, noarchive/);
  assert.match(pluginSource, /Read-only product preview/);
});
