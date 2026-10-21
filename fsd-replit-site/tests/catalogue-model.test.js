import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { products } from '../src/catalogue-data.js';
import { colourNames, EDITORIAL_STATUSES, IMAGE_ROLES, getVariantGallery, validateContentRecord, validateAssetManifest, integrateReviewedRecords } from '../src/catalogue-model.js';
import assets from '../src/catalogue-assets.json' with { type: 'json' };
import records from '../content/catalogue.json' with { type: 'json' };
import { productPageInfo, productRouteMatch, isProductPath } from '../src/product-seo.js';
import { renderProductOptions, productVariants } from '../src/product-options.js';
const product = id => products.find(record => record.id === id);
const copy = value => structuredClone(value);

test('existing IDs, pricing and source records remain authoritative; private preparations are not new listings', () => {
  assert.equal(products.length, 66);
  assert.equal(product(38).confirmedPrice, 39.99);
  assert.equal(product(39).confirmedPrice, 49.99);
  assert.equal(product(43).confirmedPrice, 29.99);
  assert.equal(product(56).confirmedPrice, 79.99);
  assert.equal(product(57).confirmedPrice, 19.99);
  assert.ok(!products.some(record => /weighted skipping/i.test(record.name)));
  assert.equal(records.records.find(record => record.key === 'weighted-skipping-rope').id, null);
  assert.deepEqual(records.records.find(record => record.key === 'weighted-skipping-rope').variants, []);
  for (const record of products) {
    assert.equal(record.catalogue.purchaseEnabled, false);
    assert.equal(record.catalogue.legacyListed, true);
    assert.equal(record.catalogue.contentApproval, null);
    assert.notEqual(record.catalogue.editorialStatus, 'Published');
  }
});
test('colour parsing respects composite finishes and only splits actual catalogue lists', () => {
  assert.equal(product(18).catalogue.variants.length, 12);
  assert.equal(product(38).catalogue.variants.length, 4);
  assert.equal(product(10).catalogue.variants.length, 3);
  assert.equal(product(52).catalogue.variants.length, 1);
  assert.deepEqual(colourNames(product(59)), []);
  assert.equal(product(43).catalogue.variants[0].colour, 'Black / Gold');
  assert.deepEqual(product(43).catalogue.sizes, []);
  assert.ok(product(38).catalogue.placement.needsApproval);
  assert.equal(product(43).catalogue.placement.subcategory, 'Performance Hijabs');
});
test('variant imagery is approved and belongs only to the chosen colour', () => {
  for (const record of products) for (const variant of record.catalogue.variants) {
    const gallery = getVariantGallery(record, variant.id);
    for (const image of gallery) {
      assert.equal(image.productId, record.id);
      assert.equal(image.variantId, variant.id);
      assert.ok(image.approved && image.approval);
    }
    assert.equal(variant.sku, null);
    assert.equal(variant.stock, null);
    assert.deepEqual(variant.sizes, []);
  }
  assert.deepEqual(getVariantGallery(product(38), 'colour-1'), []);
  assert.deepEqual(getVariantGallery(product(10), 'unknown'), []);
  assert.equal(getVariantGallery(product(10), 'colour-2')[0].src, '/images/windrunner-white.png');
});
test('all named optional image roles exist without invented placeholders or altered originals', () => {
  assert.deepEqual(Object.keys(product(43).catalogue.imageRoles), IMAGE_ROLES);
  assert.deepEqual(product(43).catalogue.imageRoles.back, []);
  assert.deepEqual(validateAssetManifest(assets), []);
  for (const asset of assets) {
    assert.ok(asset.alt.includes('FSD'));
    assert.ok(asset.responsive.length > 1);
    assert.ok(asset.width && asset.height && asset.sourceSha256);
    assert.ok(readFileSync(new URL(`../public${asset.src}`, import.meta.url)).length);
  }
});
test('asset validation rejects unapproved associations, unsafe paths, bad roles and cross-colour substitution', () => {
  for (const change of [{src:'/images/../secret.png'}, {roles:['invented']}, {alt:''}, {approval:''}, {id:'../../escape'}]) {
    assert.ok(validateAssetManifest([{...assets[0], ...change}]).length);
  }
  assert.ok(validateAssetManifest([assets[0], {...assets[0], id:'different-id', variantId:'colour-99'}]).length);
});
test('all five editorial statuses are supported but approval and publishing are separate gates', () => {
  assert.equal(EDITORIAL_STATUSES.length, 5);
  const draft = copy(records.records[0]);
  assert.deepEqual(validateContentRecord(draft, products.map(p => p.id)), []);
  draft.editorialStatus = 'Approved';
  assert.ok(validateContentRecord(draft).some(message => /approval reference/.test(message)));
  draft.contentApproval = 'TEST FIXTURE ONLY';
  assert.deepEqual(validateContentRecord(draft), []);
  draft.editorialStatus = 'Published';
  assert.ok(validateContentRecord(draft).some(message => /publication authorisation/.test(message)));
  draft.purchaseEnabled = true;
  assert.ok(validateContentRecord(draft).some(message => /Purchasing/.test(message)));
});
test('draft copies stay hidden and approved reviews cannot replace prices or duplicate source IDs', () => {
  assert.deepEqual(integrateReviewedRecords(products, records.records), products);
  const overlay = copy(records.records[2]);
  overlay.editorialStatus = 'Approved';
  overlay.contentApproval = 'TEST FIXTURE ONLY';
  const merged = integrateReviewedRecords(products, [overlay]);
  assert.equal(merged.length, products.length);
  assert.equal(merged.find(p => p.id === 43).catalogue.editorialStatus, 'Approved');
  overlay.confirmedPrice = 1;
  assert.throws(() => integrateReviewedRecords(products, [overlay]), /cannot overwrite/);
});
test('options render known sizes/SKU only, identify unavailable variants and expose honest image gaps', () => {
  const record = copy(product(38));
  assert.doesNotMatch(renderProductOptions(record), /data-size-option(?:\s|=|>)|data-selected-sku/);
  assert.match(renderProductOptions(record), /AWAITING IMAGES/);
  assert.match(renderProductOptions(record), /image|imagery/i);
  record.catalogue.variants[0].sku = 'TEST-ONLY';
  record.catalogue.variants[0].sizes = ['S','M'];
  record.catalogue.variants[0].stock = 0;
  const output = renderProductOptions(record);
  assert.match(output, /TEST-ONLY/);
  assert.match(output, /data-size-option(?:\s|=|>)/);
  assert.match(output, /unavailable/i);
  assert.equal(productVariants(record).length, 4);
});
test('SEO URLs are clean while legacy product routes remain compatible', () => {
  const info = productPageInfo(product(43));
  assert.equal(info.url, '/products/43/fsd-velocity-performance-sports-hijab/');
  assert.match(info.title, /FSD Velocity/);
  assert.match(info.description, /not available to purchase/);
  assert.equal(Number(productRouteMatch({pathname:info.url,hash:''})[1]), 43);
  assert.equal(Number(productRouteMatch({pathname:'/',hash:'#product/10'})[1]), 10);
  assert.equal(productRouteMatch({pathname:'/',hash:'#bio-lab/training'}), null);
  assert.ok(isProductPath({pathname:info.url}));
});
