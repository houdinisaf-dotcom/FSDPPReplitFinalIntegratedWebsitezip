import test from 'node:test';
import assert from 'node:assert/strict';
import { audiences, categories, products } from '../src/data/products.js';
import { filterProducts } from '../src/data/products.js';
import { productBelongsToLine } from '../src/clothing-lines.js';
import {
  GARMENT_CATEGORY_DEFINITIONS,
  garmentCategoriesForProduct,
  garmentCategoryOptions,
  productHasGarmentCategory,
} from '../src/data/garment-category-map.js';
import {
  WOMENS_BRANDING_ASSIGNMENT_STATUS,
  WOMENS_BRANDING_PENDING_PRODUCT_IDS,
  WOMENS_PRODUCT_BRANDING_ASSIGNMENTS,
} from '../src/brand/product-branding.js';

test('garment browsing keeps the active master catalogue and its approved values intact', () => {
  assert.equal(products.length, 73);
  assert.equal(new Set(products.map(product => product.id)).size, 73);
  assert.equal(categories.length, 18);
  assert.deepEqual(audiences, ['Men’s', 'Unisex', 'Women’s']);

  const audienceCounts = Object.fromEntries(audiences.map(audience => [
    audience,
    products.filter(product => product.audience === audience).length,
  ]));
  assert.deepEqual(audienceCounts, { 'Men’s': 23, 'Women’s': 20, Unisex: 27 });
  assert.equal(products.filter(product => !product.audience).length, 3);
});

test('every product type tab is populated and only includes explicitly mapped products', () => {
  const tabs = garmentCategoryOptions(products);
  assert.equal(tabs[0].id, 'all');
  assert.equal(tabs[0].count, products.length);
  assert.equal(tabs.length, GARMENT_CATEGORY_DEFINITIONS.length + 1);
  assert.ok(tabs.slice(1).every(tab => tab.count > 0));

  for (const tab of tabs.slice(1)) {
    const matching = products.filter(product => productHasGarmentCategory(product, tab.id));
    assert.equal(matching.length, tab.count);
    assert.equal(new Set(matching.map(product => product.id)).size, matching.length);
  }

  assert.deepEqual(products.filter(product => productHasGarmentCategory(product, 'sports-hijabs'))
    .map(product => product.id), [42, 43, 44, 45]);
  assert.deepEqual(products.filter(product => productHasGarmentCategory(product, 'rash-guards'))
    .map(product => product.id), [33]);
  assert.deepEqual(products.filter(product => productHasGarmentCategory(product, 'leggings'))
    .map(product => product.id), [40, 73, 74, 75]);
  assert.equal(productHasGarmentCategory(products[0], 'not-a-category'), false);
});

test('audience filters show only populated product-type tabs without reassigning audience', () => {
  for (const audience of audiences) {
    const scopedProducts = filterProducts('All', '', audience);
    const tabs = garmentCategoryOptions(scopedProducts);
    assert.equal(tabs[0].count, scopedProducts.length);
    assert.ok(tabs.slice(1).every(tab => tab.count > 0));
    assert.ok(scopedProducts.every(product => product.audience === audience));
  }
});

test('audience, clothing line, and product type combine against existing products only', () => {
  const women = filterProducts('All', '', 'Women’s');
  const womenAeroforge = women.filter(product => productBelongsToLine(product, 'aeroforge'));
  assert.deepEqual(womenAeroforge.map(product => product.id), [38, 39, 51]);
  assert.deepEqual(
    womenAeroforge.filter(product => productHasGarmentCategory(product, 'leggings')),
    [],
  );
});

test('women’s logo concepts remain unassigned until product-level approval is recorded', () => {
  const pendingIds = new Set(WOMENS_BRANDING_PENDING_PRODUCT_IDS);
  const expectedIds = products.filter(product => product.audience === 'Women’s'
    || (product.id === 18 && product.alsoShowIn.includes('Women’s Performance')))
    .map(product => product.id);
  assert.deepEqual([...pendingIds].sort((a, b) => a - b), expectedIds.sort((a, b) => a - b));
  assert.equal(WOMENS_BRANDING_ASSIGNMENT_STATUS, 'BRANDING ASSIGNMENT PENDING');
  assert.ok([...pendingIds].every(id => WOMENS_PRODUCT_BRANDING_ASSIGNMENTS[id]?.concept === null));
  assert.ok(products.every(product => garmentCategoriesForProduct(product).length > 0));
});
