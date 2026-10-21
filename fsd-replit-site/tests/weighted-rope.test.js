import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import records from '../content/catalogue.json' with { type:'json' };
import { products } from '../src/catalogue-data.js';
import { createWeightedRopeDraft } from '../src/draft-catalogue.js';
import { prepareRopeImages, workspaceRoot, readRopeRecipe, plannedRopeAssets } from '../scripts/weighted-rope-images.mjs';

const record = records.records.find(record => record.key === 'weighted-skipping-rope');
const manifest = await prepareRopeImages();
test('one unpublished rope has exactly eight approved editions, four own-colour views and an independent campaign', async () => {
  const {product,campaignHero} = createWeightedRopeDraft(record,manifest);
  assert.equal(product.sourceId,null);
  assert.equal(record.id,null);
  assert.equal(record.editorialStatus,'Draft');
  assert.equal(product.catalogue.purchaseEnabled,false);
  assert.equal(product.confirmedPrice,null);
  assert.equal(product.suggestedPrice,null);
  assert.equal(product.specifications,'');
  assert.equal(product.images.length,32);
  assert.equal(product.catalogue.variants.length,8);
  assert.ok(!products.some(product => product.name === record.name));
  for (const variant of product.catalogue.variants) {
    assert.equal(variant.sku,null);
    assert.equal(variant.stock,null);
    assert.deepEqual(variant.sizes,[]);
    assert.equal(variant.images.length,4);
    assert.ok(variant.images.every(image => image.variantId === variant.id && image.approved && image.approval));
    assert.ok(!variant.images.some(image => image.id === campaignHero.id));
  }
  const planned = plannedRopeAssets(await readRopeRecipe());
  assert.deepEqual(new Set(record.assetIds),new Set(planned.map(asset => asset.id)));
});
test('all nine supplied originals are byte-identical and all 32 PNG crops preserve source pixels exactly', async () => {
  for (const [file,hash] of Object.entries(manifest.sourceHashes)) {
    assert.equal(createHash('sha256').update(await readFile(resolve(workspaceRoot,file))).digest('hex'),hash);
  }
  for (const image of manifest.images) {
    const {x,y,width,height} = image.crop;
    const file = manifest.files.find(file => file.src === image.src);
    assert.ok(file);
    execFileSync('magick', ['compare','-metric','AE','(',resolve(workspaceRoot,image.sourceBoard),
      '-crop',`${width}x${height}+${x}+${y}`,'+repage',')',resolve(workspaceRoot,file.file),'null:'],
    {stdio:'pipe'});
  }
});
test('a changed publication state, missing view or campaign-as-variant cannot pass draft review', () => {
  assert.throws(()=>createWeightedRopeDraft({...record,editorialStatus:'Published'},manifest),/unpublished draft/);
  assert.throws(()=>createWeightedRopeDraft({...record,id:999},manifest),/unpublished draft/);
  assert.throws(()=>createWeightedRopeDraft(record,{...manifest,images:manifest.images.slice(1)}),/four views/);
  const wrong = structuredClone(manifest);
  wrong.images[0].variantId = record.variants[1].id;
  assert.throws(()=>createWeightedRopeDraft(record,wrong),/Four approved/);
});
