import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createNexusPreview, getNexusAuditAsset, getNexusPreviewAsset, getNexusSourceIntegrity, nexusPreviewManifest } from '../src/nexus-campaign.js';
import { nexusMediaPrefix, nexusPreviewPath } from '../src/nexus-preview-path.js';
import { createNexusDevelopmentIntegration } from '../src/nexus-development-integration.js';
import { renderNexusPreview } from '../src/nexus-preview-ui/nexus-preview.js';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

test('NEXUS keeps approved presentation imagery separate from flagged audit references', () => {
  assert.equal(nexusPreviewManifest.assets.length, 3);
  assert.deepEqual(nexusPreviewManifest.assets.map(asset => asset.id), [
    'app-interface',
    'proposed-features',
    'progression-conditions',
  ]);
  assert.equal(nexusPreviewManifest.assets[0].status, 'approved corrected image candidate');
  assert.equal(nexusPreviewManifest.assets[1].status, 'unbranded concept reference');
  assert.equal(nexusPreviewManifest.assets[2].status, 'unbranded concept reference');
  assert.equal(nexusPreviewManifest.auditAssets.length, 8);
  assert.equal(nexusPreviewManifest.brandAudit.length, 11);

  for (const asset of nexusPreviewManifest.assets) {
    assert.ok(asset.file.startsWith('attached_assets/fsd-nexus-approved/'));
    assert.equal(asset.src, `${nexusMediaPrefix}${asset.id}`);
    assert.ok(readFileSync(resolve(workspaceRoot, asset.file)).byteLength > 0, `${asset.id} asset exists`);
  }

  for (const asset of nexusPreviewManifest.auditAssets) {
    assert.ok(asset.file.startsWith('attached_assets/fsd-nexus-audit/'));
    assert.equal(asset.src, `${nexusMediaPrefix}audit/${asset.id}`);
    assert.equal(asset.type, 'image/jpeg');
    assert.match(asset.status, /BRAND CORRECTION REQUIRED|CORRECTED CANDIDATE APPROVED/);
    assert.ok(readFileSync(resolve(workspaceRoot, asset.file)).byteLength > 0, `${asset.id} audit image exists`);
  }

  assert.equal(getNexusPreviewAsset('01_full_campaign_reference'), null);
  assert.equal(getNexusPreviewAsset('ring-product-closeup'), null);
  assert.equal(getNexusPreviewAsset('ring-charging-case'), null);
  assert.ok(getNexusAuditAsset('ring-product-closeup'));
  assert.ok(getNexusAuditAsset('ring-charging-case'));
  assert.equal(getNexusPreviewAsset('10_strategic_value_concept'), null);
  assert.ok(nexusPreviewManifest.excludedAssetIds.includes('01_full_campaign_reference'));
  assert.ok(nexusPreviewManifest.excludedAssetIds.includes('08_ring_macro_detail'));
  assert.ok(nexusPreviewManifest.brandAudit.some(entry => entry.assetId === '10_strategic_value_concept'
    && /EXCLUDED/.test(entry.status)));
});

test('NEXUS source archives are identical and every copied image remains byte-for-byte unchanged', () => {
  const integrity = getNexusSourceIntegrity();
  const archiveBytes = readFileSync(resolve(workspaceRoot, integrity.archive));
  assert.equal(createHash('sha256').update(archiveBytes).digest('hex'), integrity.sha256);
  const previousArchiveBytes = readFileSync(resolve(workspaceRoot, integrity.previousArchive));
  assert.equal(createHash('sha256').update(previousArchiveBytes).digest('hex'), integrity.sha256);

  for (const [assetId, archiveEntry] of [
    ['proposed-features', '09_feature_icons.jpg'],
    ['progression-conditions', '11_conditions_before_progression.jpg'],
  ]) {
    const asset = getNexusPreviewAsset(assetId);
    const copiedBytes = readFileSync(resolve(workspaceRoot, asset.file));
    const sourceEntry = execFileSync('unzip', ['-p', integrity.archive, archiveEntry], { cwd: workspaceRoot });
    assert.equal(createHash('sha256').update(copiedBytes).digest('hex'), createHash('sha256').update(sourceEntry).digest('hex'));
  }

  for (const asset of nexusPreviewManifest.auditAssets) {
    const copiedBytes = readFileSync(resolve(workspaceRoot, asset.file));
    const sourceEntry = execFileSync('unzip', ['-p', integrity.archive, asset.file.split('/').pop()], { cwd: workspaceRoot });
    assert.equal(createHash('sha256').update(copiedBytes).digest('hex'), createHash('sha256').update(sourceEntry).digest('hex'));
  }
});

test('NEXUS is a concept-only draft with all technical features and progression conditions pending', () => {
  const preview = createNexusPreview();
  assert.equal(nexusPreviewPath, '/__catalogue-preview/fsd-nexus/');
  assert.equal(preview.name, 'FSD NEXUS');
  assert.equal(preview.price, null);
  assert.equal(preview.availability, null);
  assert.equal(preview.checkoutEnabled, false);
  assert.match(preview.status, /NOT A CURRENT PRODUCT OR COMMITMENT/);
  assert.match(preview.productPhotographyStatus, /PRIVATE AUDIT REFERENCES ONLY.*BRAND CORRECTION REQUIRED/);
  assert.match(preview.staticImageStatus, /NO LIVE DATA/);
  assert.ok(preview.proposedFeatures.length > 0);
  assert.ok(preview.proposedFeatures.every(feature => feature.status === 'PROPOSED — PENDING TECHNICAL VALIDATION'));
  assert.ok(preview.progressionConditions.every(condition => condition.status === 'NOT VERIFIED'));
  assert.equal(preview.brandAudit.length, 11);
  assert.ok(preview.brandAudit.every(entry => entry.file && entry.finding && entry.status));
  assert.match(preview.reviewBoundary, /commercial commitment/i);
  assert.equal('product' in preview, false);
  assert.equal('slug' in preview, false);
});

test('the Bio-Lab draft card links to the private concept without changing navigation or catalogue data', () => {
  const integration = createNexusDevelopmentIntegration();
  assert.equal(integration.collectionCardPlacement.divisionId, 'bio-lab');
  assert.equal(integration.collectionCardPlacement.groupId, 'bio-lab-concepts');
  assert.match(integration.collectionCard, /data-nexus-draft-card/);
  assert.match(integration.collectionCard, new RegExp(nexusPreviewPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(integration.collectionCard, /FSD NEXUS/);
  assert.match(integration.collectionCard, /NOT A CURRENT PRODUCT/);
  assert.doesNotMatch(integration.collectionCard, /£\s?\d|\bBUY\b|ADD TO CART|CHECKOUT NOW/i);
  assert.equal('draftMenuItems' in integration, false);
});

test('the rendered page separates approved artwork from the complete private brand audit', () => {
  const html = renderNexusPreview({
    headerHtml: '<header class="header fsd-header"><a class="fsd-brand"><img class="fsd-brand-logo"></a></header>',
    preview: createNexusPreview(),
  });
  assert.equal((html.match(/data-nexus-gallery-select=/g) || []).length, 3);
  assert.equal((html.match(/data-nexus-audit-gallery-select=/g) || []).length, 8);
  assert.equal((html.match(/class="nexus-audit-ledger-row"/g) || []).length, 11);
  assert.match(html, /data-nexus-active-image/);
  assert.match(html, /data-nexus-audit-active-image/);
  assert.match(html, /data-nexus-audit-active-status/);
  assert.match(html, /data-nexus-audit-active-finding/);
  assert.match(html, /data-nexus-dialog/);
  assert.match(html, /87 score is not live data or a verified measurement/);
  assert.match(html, /STATIC INTERFACE · 87 IS ILLUSTRATIVE, NOT LIVE DATA/);
  assert.match(html, /data-nexus-active-note/);
  assert.match(html, /PROPOSED — PENDING TECHNICAL VALIDATION/);
  assert.match(html, /PRIVATE REVIEW REFERENCE/);
  assert.match(html, /BRAND CORRECTION REQUIRED/);
  assert.match(html, /FULL COMPOSITE BOARD · REFERENCE ONLY · NOT A PRODUCT PHOTO/);
  assert.match(html, /unmodified source references.*not approved campaign photography/i);
  assert.match(html, /No embedded logo has been erased, overlaid or redrawn/);
  assert.doesNotMatch(html, /ADD TO CART|BUY NOW|<form\b|£\s?\d/i);
});
