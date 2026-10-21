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

const sourcePath = relativePath => fileURLToPath(new URL(`../../${relativePath}`, import.meta.url));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

test('ALIGHT preview preserves the supplied image archive and all twelve source files', () => {
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

test('ALIGHT appears only as a development-menu draft, separate from the catalogue', () => {
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
  assert.match(integration.draftProductCard, /NOT AVAILABLE TO PURCHASE/);
  assert.match(draft.description, /specifications are pending approval/i);
  assert.equal(draft.record, undefined);
  assert.equal(draft.productId, undefined);
  assert.equal(products.some(product => product.name === draft.title), false);
  assert.deepEqual(getNavigationFeature(previewBioLab, 0, index).imageSources, [draft.featureImageSrc]);
});

test('ALIGHT source artwork is explicitly marked as a private, unverified campaign reference', () => {
  const html = readFileSync(new URL('../alight-preview.html', import.meta.url), 'utf8');
  const previewSource = readFileSync(new URL('../src/alight-preview-ui/alight-preview.js', import.meta.url), 'utf8');
  const pluginSource = readFileSync(new URL('../scripts/draft-review-plugin.mjs', import.meta.url), 'utf8');

  assert.match(html, /noindex, nofollow, noarchive/);
  assert.match(html, /FSD ALIGHT/);
  assert.match(previewSource, /CAMPAIGN REFERENCE/);
  assert.match(previewSource, /NOT PRODUCT PHOTOGRAPHY/);
  assert.match(previewSource, /All product and technical information remains pending verification/i);
  assert.doesNotMatch(previewSource, /ADD TO CART|BUY NOW|CHECKOUT|£\d/i);
  assert.match(pluginSource, /name: 'fsd-weighted-rope-private-draft-review'[\s\S]*apply: 'serve'/);
  assert.match(pluginSource, /alightPreviewPath/);
  assert.match(pluginSource, /noindex, nofollow, noarchive/);
  assert.match(pluginSource, /Read-only product preview/);
});
