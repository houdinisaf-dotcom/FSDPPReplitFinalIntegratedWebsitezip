import test from 'node:test';
import assert from 'node:assert/strict';
import { CLOTHING_LINES } from '../src/clothing-lines.js';
import { CATALOGUE_COLLECTIONS } from '../src/catalogue-collections.js';
import { OFFICIAL_LOGO_FILES } from '../src/brand/logo-assets.js';
import { resolveCollectionBranding } from '../src/brand/collection-branding.js';
import { MARK_NAMES, WOMENS_LINES, WOMENS_PRIMARY_MARK } from '../src/brand/tokens.js';
import {
  SERIES_BRANDING_PENDING_PRODUCT_IDS,
  WOMENS_BRANDING_ASSIGNMENT_STATUS,
  WOMENS_BRANDING_PENDING_PRODUCT_IDS,
  WOMENS_PRODUCT_BRANDING_ASSIGNMENTS,
  productBrandingAssignmentFor,
} from '../src/brand/product-branding.js';
import { products } from '../src/data/products.js';

test('women’s collection concepts have one reference map and are not product assignments', () => {
  const expectedCompanions = {
    aeroforge: 'ascent',
    combat: 'signature',
    flex: 'aligned',
    breeze: null,
    'modest-flow': null,
  };

  assert.equal(WOMENS_PRIMARY_MARK, 'serene');
  for (const [collectionId, companionMark] of Object.entries(expectedCompanions)) {
    const reference = resolveCollectionBranding(collectionId);
    assert.equal(reference.primaryMark, WOMENS_PRIMARY_MARK);
    assert.equal(reference.companionMark, companionMark);
    assert.equal(reference.scope, 'collection-reference-only');
    assert.equal(reference.status, WOMENS_BRANDING_ASSIGNMENT_STATUS);
    assert.equal(reference.primaryAsset, null);
    assert.equal(reference.companionAsset, null);
    assert.equal(reference.productAssignmentStatus, WOMENS_BRANDING_ASSIGNMENT_STATUS);
    const lineReference = CLOTHING_LINES.find(line => line.id === collectionId).brandReference;
    assert.deepEqual(lineReference, reference);
    assert.equal(CATALOGUE_COLLECTIONS.find(collection => collection.id === collectionId).brandReference, lineReference);
  }

  assert.deepEqual(Object.keys(OFFICIAL_LOGO_FILES), Object.keys(MARK_NAMES));
  assert.ok(Object.values(OFFICIAL_LOGO_FILES).every(asset => asset === null));
  assert.equal(WOMENS_LINES.find(line => line.id === 'breeze').companion, null);
  assert.equal(WOMENS_LINES.find(line => line.id === 'modest-flow').companion, null);
  assert.ok(CLOTHING_LINES.every(line => !Object.hasOwn(line, 'mark')));
});

test('women’s product marks remain pending and never inherit a collection concept', () => {
  const womenFacingProducts = products.filter(product => product.audience === 'Women’s'
    || (product.id === 18 && product.alsoShowIn.includes('Women’s Performance')));
  assert.deepEqual(
    WOMENS_BRANDING_PENDING_PRODUCT_IDS,
    womenFacingProducts.map(product => product.id),
  );

  for (const product of womenFacingProducts) {
    const assignment = productBrandingAssignmentFor(product);
    assert.equal(assignment.status, WOMENS_BRANDING_ASSIGNMENT_STATUS);
    assert.equal(assignment.concept, null);
  }

  const unisexAeroforgeTee = productBrandingAssignmentFor(products.find(product => product.id === 18));
  assert.equal(unisexAeroforgeTee.concept, null);
  assert.equal(unisexAeroforgeTee.status, WOMENS_BRANDING_ASSIGNMENT_STATUS);
  assert.ok(Object.values(WOMENS_PRODUCT_BRANDING_ASSIGNMENTS).every(item => item.concept === null));
});

test('Tiger and Scorpion retain only photographic patch references pending official artwork', () => {
  const expected = {
    'tiger-series': { id: 27, path: '/brand/series-references/tiger-patch.webp' },
    'scorpion-series': { id: 77, path: '/brand/series-references/scorpion-patch.webp' },
  };

  assert.deepEqual(SERIES_BRANDING_PENDING_PRODUCT_IDS, [27, 77]);
  for (const [collectionId, { id, path }] of Object.entries(expected)) {
    const reference = resolveCollectionBranding(collectionId);
    assert.equal(reference.scope, 'photographic-reference-only');
    assert.equal(reference.photographicPatchReference, path);
    assert.equal(reference.officialAsset, null);
    assert.equal(reference.status, WOMENS_BRANDING_ASSIGNMENT_STATUS);
    assert.equal(productBrandingAssignmentFor(products.find(product => product.id === id)).concept, null);
  }
});
