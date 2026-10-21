import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import masterProducts from '../src/master-products.json' with { type: 'json' };
import {
  createHoodedShellCampaignPreview,
  hoodedShellCampaign,
  hoodedShellPreviewRecord,
} from '../src/hooded-shell-campaign.js';

const workspaceRoot = resolve(process.cwd(), '..');

test('the campaign proof reuses the existing shell record without mutating the catalogue', () => {
  const before = structuredClone(masterProducts);
  const preview = createHoodedShellCampaignPreview();
  const source = masterProducts.find(product => product.id === 9);

  assert.equal(source['Product name'], 'FSD Hooded Running Shell');
  assert.equal(preview.sourceProductId, source.id);
  assert.equal(preview.sourceProductName, source['Product name']);
  assert.equal(preview.previewProductId, null);
  assert.equal(preview.editorialStatus, 'Private campaign proof');
  assert.equal(preview.purchaseEnabled, false);
  assert.equal(preview.colourSelection, 'deferred');
  assert.equal(preview.confirmedPrice, null);
  assert.equal(preview.confirmedSpecifications, null);
  assert.equal(preview.campaignHero.src, '/__catalogue-preview/hooded-running-shell/media/hooded-shell-campaign');
  assert.deepEqual(masterProducts, before);
});

test('the campaign proof maps only the supplied clean hero file with its recorded hash and dimensions', async () => {
  const bytes = await readFile(resolve(workspaceRoot, hoodedShellCampaign.file));
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(createHash('sha256').update(bytes).digest('hex'), hoodedShellCampaign.sha256);
  assert.equal(bytes.readUInt32BE(16), 1672);
  assert.equal(bytes.readUInt32BE(20), 941);
  assert.equal(hoodedShellPreviewRecord.campaign.alt.includes('orange FSD Hooded Running Shell'), true);
});

test('the campaign proof rejects any change that enables purchasing or invents confirmed details', () => {
  assert.throws(() => createHoodedShellCampaignPreview({
    ...hoodedShellPreviewRecord,
    purchaseEnabled: true,
  }), /private, non-purchasable campaign proof/);
  assert.throws(() => createHoodedShellCampaignPreview({
    ...hoodedShellPreviewRecord,
    confirmedPrice: 79.99,
  }), /private, non-purchasable campaign proof/);
  assert.throws(() => createHoodedShellCampaignPreview({
    ...hoodedShellPreviewRecord,
    colourSelection: 'available',
  }), /private, non-purchasable campaign proof/);
});
