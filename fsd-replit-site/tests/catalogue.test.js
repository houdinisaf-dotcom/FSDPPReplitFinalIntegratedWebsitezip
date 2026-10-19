import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import master from '../src/master-products.json' with { type: 'json' };
import { products, heldProducts, categories, filterProducts, priceInfo, safe } from '../src/catalogue-data.js';
import { catalogueSection, roadmapSection, innovationsSection, initCatalogue } from '../src/catalogue.js';

test('all 68 master records are retained and explicit holds are excluded', () => {
  assert.equal(master.length, 68);
  assert.equal(new Set(master.map(p => p.id)).size, 68);
  assert.equal(products.length, 65);
  assert.deepEqual(heldProducts.map(p => p.id), [36, 37, 68]);
  assert.equal(categories.length, 9);
  assert.ok(products.every(p => !heldProducts.some(h => h.id === p.id)));
  assert.equal(products.filter(p => p.confirmedPrice !== null).length, 34);
  assert.equal(products.filter(p => p.suggestedPrice !== null).length, 24);
});

test('prices distinguish confirmed, suggested and genuinely unset values', () => {
  assert.deepEqual(priceInfo(products.find(p => p.id === 1)), { label: 'Confirmed list price', value: '£39.99' });
  assert.deepEqual(priceInfo(products.find(p => p.id === 2)), { label: 'Suggested · to confirm', value: '£39.99' });
  assert.deepEqual(priceInfo(products.find(p => p.id === 59)), { label: 'Price not set', value: 'To be confirmed' });
});

test('category cross-listing, alternate names, colourways and case-insensitive search work', () => {
  assert.ok(filterProducts('Men’s Performance and Training').some(p => p.id === 23));
  assert.equal(filterProducts('All', '  FSD Short-Sleeve Performance Training T-Shirt  ')[0].id, 16);
  assert.ok(filterProducts('All', 'electric cobalt').some(p => p.id === 1));
  assert.equal(filterProducts('Smart Tech').length, 7);
  assert.equal(filterProducts('Sports Hijabs').length, 4);
  assert.equal(filterProducts('Smart Tech', 'training socks').length, 0);
});

test('colourways share one record, verified image references exist, and unknown mappings stay empty', () => {
  assert.equal(products.filter(p => p.name === 'FSD Cheetah Windrunner').length, 1);
  assert.equal(products.find(p => p.id === 10).images.length, 3);
  assert.equal(products.find(p => p.id === 1).images.length, 2);
  assert.ok(products.filter(p => p.images.length).length === 2);
  for (const p of products) for (const image of p.images) {
    assert.ok(existsSync(new URL(`../public${image.src}`, import.meta.url)));
  }
});

test('rendered sections follow the master list, escape content, and do not promote held products', () => {
  const sections = catalogueSection() + roadmapSection() + innovationsSection();
  assert.match(sections, /65 products in development across 9 categories/);
  assert.match(sections, /FSD STRIDE \(smart product, type to confirm\)/);
  assert.doesNotMatch(sections, /smartwatch|Shilajit|Championship Belt|Ring Corner Post/i);
  assert.equal(safe('<script>"x"&</script>'), '&lt;script&gt;&quot;x&quot;&amp;&lt;/script&gt;');
});

test('catalogue UI handlers paginate, filter, reset, open details and close the dialog', () => {
  // Minimal DOM surface checks the real event handlers without a browser dependency.
  const elements = new Map();
  const handlers = new Map();
  const element = selector => {
    if (!elements.has(selector)) elements.set(selector, {
      value: '', innerHTML: '', textContent: '', open: false,
      addEventListener(type, callback) { handlers.set(`${selector}:${type}`, callback); },
      setAttribute() {}, scrollIntoView() {}, focus() {},
      showModal() { this.open = true; }, close() { this.open = false; },
    });
    return elements.get(selector);
  };
  globalThis.document = {
    querySelector: element,
    addEventListener(type, callback) { handlers.set(`document:${type}`, callback); },
  };
  const click = (selector, data) => handlers.get('document:click')({
    target: { closest: requested => requested === selector ? data : null },
  });
  try {
    initCatalogue();
    assert.equal(element('#catalogue-count').textContent, 'Showing 1–12 of 65 products');
    click('[data-page]', { dataset: { page: '2' }, disabled: false });
    assert.equal(element('#catalogue-count').textContent, 'Showing 13–24 of 65 products');

    element('#catalogue-category').value = 'Smart Tech';
    handlers.get('#catalogue-category:change')();
    assert.equal(element('#catalogue-count').textContent, 'Showing 1–7 of 7 products');
    assert.equal(element('#catalogue-pagination').innerHTML, '');
    element('#search').value = 'no match at all';
    handlers.get('#search:input')();
    assert.match(element('#catalogue-grid').innerHTML, /Clear filters/);

    click('[data-clear-filters]', {});
    assert.equal(element('#catalogue-count').textContent, 'Showing 1–12 of 65 products');
    click('[data-category-link]', { dataset: { categoryLink: 'Sports Hijabs' } });
    assert.equal(element('#catalogue-count').textContent, 'Showing 1–4 of 4 products');

    click('[data-product]', { dataset: { product: '10' } });
    assert.equal(element('#product-dialog').open, true);
    assert.equal((element('#dialog-body').innerHTML.match(/<figure>/g) ?? []).length, 3);
    assert.match(element('#dialog-body').innerHTML, /Confirmed list price/);
    handlers.get('#close-dialog:click')();
    assert.equal(element('#product-dialog').open, false);
    click('[data-product]', { dataset: { product: '59' } });
    assert.match(element('#dialog-body').innerHTML, /To be confirmed/);
    assert.doesNotMatch(element('#dialog-body').innerHTML, /£0|undefined|null/);
  } finally {
    delete globalThis.document;
  }
});
