import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import master from '../src/master-products.json' with { type: 'json' };
import additional from '../src/additional-catalog.json' with { type: 'json' };
import { galleryProductIds, galleryProducts } from '../src/gallery.js';
import { products, heldProducts, retiredProducts, categories, filterProducts, priceInfo, safe } from '../src/catalogue-data.js';
import { catalogueSection, roadmapSection, innovationsSection, initCatalogue } from '../src/catalogue.js';
import { collectionDivisions } from '../src/collection-divisions.js';
import { renderCollectionShowcase } from '../src/collection-showcase/index.js';
import { featuredInnovationsSection, vipAccessSection } from '../src/showroom-sections.js';
import { renderNavigationHeader } from '../src/site-navigation.js';
import { ourStorySection } from '../src/story-section.js';

test('original source records and approved set tiers are retained; holds and retired entries are excluded', () => {
  assert.equal(master.length, 72);
  assert.equal(new Set(master.map(p => p.id)).size, 72);
  for (let id = 1; id <= 68; id++) assert.ok(master.some(p => p.id === id));
  assert.equal(products.length, 66);
  assert.deepEqual(heldProducts.map(p => p.id), [36, 37, 64, 68]);
  assert.deepEqual(retiredProducts.map(p => p.id), [21, 53]);
  assert.equal(categories.length, 9);
  assert.ok(products.every(p => !heldProducts.some(h => h.id === p.id)));
  assert.ok(products.every(p => !retiredProducts.some(r => r.id === p.id)));
  assert.equal(products.filter(p => p.confirmedPrice !== null).length, 37);
  assert.equal(products.filter(p => p.suggestedPrice !== null).length, 23);
});

test('prices distinguish confirmed, suggested and genuinely unset values', () => {
  assert.deepEqual(priceInfo(products.find(p => p.id === 1)), { label: '', value: '£39.99' });
  assert.deepEqual(priceInfo(products.find(p => p.id === 2)), { label: 'Expected', value: '£39.99' });
  assert.deepEqual(priceInfo(products.find(p => p.id === 59)), { label: '', value: 'Price at launch' });
});

test('category cross-listing, alternate names, colourways and case-insensitive search work', () => {
  assert.ok(filterProducts('Men’s Performance and Training').some(p => p.id === 23));
  assert.equal(filterProducts('All', '  FSD Strike Men’s Training T-Shirt  ')[0].id, 16);
  assert.ok(filterProducts('All', 'electric cobalt').some(p => p.id === 1));
  assert.equal(filterProducts('Smart Tech').length, 6);
  assert.equal(filterProducts('Sports Hijabs').length, 4);
  assert.equal(filterProducts('Smart Tech', 'training socks').length, 0);
});

test('colourways share one record, verified image references exist, and unknown mappings stay empty', () => {
  assert.equal(products.filter(p => p.name === 'FSD Cheetah Windrunner').length, 1);
  assert.equal(products.find(p => p.id === 10).images.length, 3);
  assert.equal(products.find(p => p.id === 1).images.length, 2);
  assert.equal(products.filter(p => p.images.length).length, 3);
  for (const p of products) for (const image of p.images) {
    assert.ok(existsSync(new URL(`../public${image.src}`, import.meta.url)));
    if (p.id === 43) {
      assert.equal(p.colourways, 'Black / Gold');
      assert.match(image.label, /Black and gold/i);
    } else {
      assert.ok(p.colourways.split(';').map(value => value.trim()).includes(image.label));
    }
  }
});

test('product images use only supplied assets explicitly mapped to products', () => {
  assert.deepEqual(products.filter(p => p.images.length).map(p => p.id), [1, 10, 43]);
  assert.deepEqual(products.find(p => p.id === 1).images.map(image => image.src), [
    '/images/ombre-indigo.png', '/images/ombre-blue.png',
  ]);
  assert.deepEqual(products.find(p => p.id === 10).images.map(image => image.src), [
    '/images/windrunner-yellow.png', '/images/windrunner-white.png', '/images/windrunner-khaki.png',
  ]);
  assert.deepEqual(products.find(p => p.id === 43).images, [{
    src: '/images/fsd-velocity-performance-sports-hijab.jpg',
    label: 'Black and gold sports hijab with matching performance top',
  }]);
  assert.equal(products.find(p => p.id === 43).imageStatus, 'User-supplied main product image');
  assert.ok(existsSync(new URL('../public/images/fsd-velocity-performance-sports-hijab.jpg', import.meta.url)));
  for (const id of [42, 45, 60, 61, 62, 63, 65]) {
    assert.deepEqual(products.find(p => p.id === id).images, []);
  }
});

test('rendered sections follow the master list, escape content, and do not promote held products', () => {
  const sections = catalogueSection() + roadmapSection() + innovationsSection();
  assert.match(sections, /66 products across 9 categories/);
  assert.doesNotMatch(sections, /in development/i);
  assert.doesNotMatch(sections, /STRIDE|smartwatch|Shilajit|Championship Belt|Ring Corner Post/i);
  assert.doesNotMatch(sections, /Upcoming collection|Prices and details|Join VIP Access/);
  assert.doesNotMatch(sections, /add to (cart|basket)|buy now|checkout|payment|<form/i);
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
      contains() { return false; },
      querySelector() { return null; },
      querySelectorAll() { return []; },
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
  assert.equal(element('#catalogue-count').textContent, 'Showing 1–12 of 66 products');
    assert.match(element('#catalogue-grid').innerHTML, /\/images\/ombre-indigo.png/);
    assert.match(element('#catalogue-grid').innerHTML, /; design concept/);
    assert.doesNotMatch(element('#catalogue-grid').innerHTML, /Concept image\s+mapping pending/);
    click('[data-page]', { dataset: { page: '2' }, disabled: false });
    assert.equal(element('#catalogue-count').textContent, 'Showing 13–24 of 66 products');

    element('#catalogue-category').value = 'Smart Tech';
    handlers.get('#catalogue-category:change')();
    assert.equal(element('#catalogue-count').textContent, 'Showing 1–6 of 6 products');
    assert.equal(element('#catalogue-pagination').innerHTML, '');
    element('#search').value = 'no match at all';
    handlers.get('#search:input')();
    assert.match(element('#catalogue-grid').innerHTML, /Clear filters/);

    click('[data-clear-filters]', {});
    assert.equal(element('#catalogue-count').textContent, 'Showing 1–12 of 66 products');
    click('[data-category-link]', { dataset: { categoryLink: 'Sports Hijabs' } });
    assert.equal(element('#catalogue-count').textContent, 'Showing 1–4 of 4 products');

    click('[data-product]', { dataset: { product: '10' } });
    assert.equal(element('#product-dialog').open, true);
    assert.equal((element('#dialog-body').innerHTML.match(/<figure\b/g) ?? []).length, 1);
    assert.equal((element('#dialog-body').innerHTML.match(/data-catalogue-image-index/g) ?? []).length, 3);
    for (const image of products.find(p => p.id === 10).images) {
      assert.ok(element('#dialog-body').innerHTML.includes(image.src));
      assert.ok(element('#dialog-body').innerHTML.includes(image.label));
    }
    assert.match(element('#dialog-body').innerHTML, /design concept/);
    assert.ok(element('#dialog-body').innerHTML.includes(priceInfo(products.find(p => p.id === 10)).value));
    assert.doesNotMatch(element('#dialog-body').innerHTML, /Confirmed list price/);

    const dialogBody = element('#dialog-body');
    const mainImage = {};
    const mainCaption = {};
    const thumbnailButtons = [0, 1, 2].map(() => ({ setAttribute() {} }));
    dialogBody.contains = () => true;
    dialogBody.querySelector = selector => selector === '[data-catalogue-main-image]' ? mainImage : mainCaption;
    dialogBody.querySelectorAll = () => thumbnailButtons;
    click('[data-catalogue-image-index]', {
      dataset: { catalogueImageIndex: '1' },
      setAttribute() {},
    });
    assert.equal(mainImage.src, products.find(p => p.id === 10).images[1].src);
    assert.equal(mainCaption.textContent, products.find(p => p.id === 10).images[1].label);

    handlers.get('#close-dialog:click')();
    assert.equal(element('#product-dialog').open, false);
    click('[data-product]', { dataset: { product: '1' } });
    assert.equal((element('#dialog-body').innerHTML.match(/<figure\b/g) ?? []).length, 1);
    assert.equal((element('#dialog-body').innerHTML.match(/data-catalogue-image-index/g) ?? []).length, 2);
    assert.match(element('#dialog-body').innerHTML, /Vintage indigo fading to jet black/);
    assert.match(element('#dialog-body').innerHTML, /Electric cobalt fading to jet black/);
    for (const id of [42, 45, 60, 61, 62, 63, 65]) {
      click('[data-product]', { dataset: { product: String(id) } });
      assert.match(element('#dialog-body').innerHTML, /Imagery to follow/);
      assert.doesNotMatch(element('#dialog-body').innerHTML, /Image status in master list|Development notes/);
      assert.doesNotMatch(element('#dialog-body').innerHTML, /<img /);
    }
    click('[data-product]', { dataset: { product: '59' } });
    assert.match(element('#dialog-body').innerHTML, /Price at launch/);
    assert.doesNotMatch(element('#dialog-body').innerHTML, /£0|undefined|null/);

    click('[data-product]', { dataset: { product: '47' } });
    assert.match(element('#dialog-body').innerHTML, /Mid-Hip Modest Coverage \(Regular Tunic Length\)/);
    assert.match(element('#dialog-body').innerHTML, /Also appears as/);
    assert.doesNotMatch(element('#dialog-body').innerHTML, /identity to confirm/);
    click('[data-product]', { dataset: { product: '69' } });
    assert.match(element('#dialog-body').innerHTML, /£699.99/);
    assert.match(element('#dialog-body').innerHTML, /Complete 10–50kg set\./);
    assert.doesNotMatch(element('#dialog-body').innerHTML, /Exact weight increments, quantities and total set weight pending/);
    assert.doesNotMatch(element('#dialog-body').innerHTML, /32mm/);
    click('[data-product]', { dataset: { product: '54' } });
    assert.match(element('#dialog-body').innerHTML, /5-Cutout/);
    assert.doesNotMatch(element('#dialog-body').innerHTML, /Not decided: bar weight/);
    const beforeHeldAttempt = element('#dialog-body').innerHTML;
    for (const id of [21, 36, 37, 53, 64, 68]) {
      click('[data-product]', { dataset: { product: String(id) } });
      assert.equal(element('#dialog-body').innerHTML, beforeHeldAttempt);
    }

    click('[data-category-link]', { dataset: { categoryLink: 'Gym Hardware and Accessories' } });
    assert.match(element('#catalogue-grid').innerHTML, /Complete 10–50kg set\./);
    assert.doesNotMatch(element('#catalogue-grid').innerHTML, /Exact weight increments/);
    assert.doesNotMatch(element('#catalogue-grid').innerHTML, /£129.99/);
  } finally {
    delete globalThis.document;
  }
});

test('approved aliases find unified entries without merging distinct product lines', () => {
  for (const [alias, id] of [
    ['FSD Strike Training Short', 19],
    ['FSD Aeroforge Hybrid Training Short', 19],
    ['FSD Performance Training Shorts', 20],
    ['FSD CORE Everyday Sports Hijab', 42],
    ['FSD Modest Longline Training Top / Tunic', 47],
    ['FSD Modest Longline Training Jacket', 48],
    ['FSD Women’s Training Trousers / Joggers', 50],
    ['FSD CARRY Performance Sports Bag', 56],
    ['FSD Strike Terrain Combat Shorts - Olive/Bronze', 34],
  ]) assert.deepEqual(filterProducts('All', alias).map(p => p.id), [id]);

  assert.ok(products.some(p => p.id === 16 && p.confirmedPrice === 39.99));
  assert.ok(products.some(p => p.id === 38 && p.confirmedPrice === 39.99));
  assert.ok(products.some(p => p.id === 55 && p.confirmedPrice === 89.99));
  assert.ok(products.some(p => p.id === 56 && p.confirmedPrice === 79.99));
  assert.equal(filterProducts('All', 'STRIDE').length, 0);
  assert.equal(products.find(p => p.id === 19).confirmedPrice, 44.99);
  assert.equal(products.find(p => p.id === 19).suggestedPrice, null);
  assert.equal(products.find(p => p.id === 34).confirmedPrice, 49.99);
  assert.equal(products.find(p => p.id === 19).colourways, 'Black/Green, Black/Red, Black/Grey, Navy/Blue, Olive/Black, White/Green');
  assert.match(products.find(p => p.id === 34).colourways, /Signature.*Pulse.*Performance.*Terrain/);
});

test('approved category placements, coverage and palette exception are consistent', () => {
  for (const id of [16, 34]) {
    assert.ok(filterProducts('Combat and MMA').some(p => p.id === id));
    assert.ok(filterProducts('Men’s Performance and Training').some(p => p.id === id));
  }
  for (const id of [18, 38, 39, 40, 56, 57]) {
    assert.ok(filterProducts('Women’s Performance').some(p => p.id === id));
  }
  for (const id of [42, 43, 44, 45]) {
    assert.ok(filterProducts('Modest Activewear').some(p => p.id === id));
    assert.ok(filterProducts('Sports Hijabs').some(p => p.id === id));
  }
  assert.equal(products.find(p => p.id === 47).coverage, 'Mid-Hip Modest Coverage (Regular Tunic Length)');
  assert.match(products.find(p => p.id === 39).specifications, /Standalone athletic layer/);
  assert.ok(!filterProducts('Training Sets').some(p => p.id === 39));
  assert.equal(products.find(p => p.id === 35).confirmedPrice, 149.99);
  assert.match(products.find(p => p.id === 35).notes, /Approved forest-green palette exception/);
});

test('hardware prices buy complete approved set tiers without invented weight breakdowns', () => {
  const tiers = products.filter(p => p.id >= 69);
  assert.equal(tiers.length, 4);
  assert.deepEqual(tiers.map(p => p.confirmedPrice), [699.99, 599.99, 399.99, 299.99]);
  for (const p of tiers) {
    assert.equal(p.suggestedPrice, null);
    assert.equal(p.priceBasis, 'Complete 10–50kg set.');
    assert.match(p.specificationStatus, /increments, quantities and total set weight pending/);
    assert.match(p.notes, /not evidence of manufactured materials or verified performance/);
    assert.deepEqual(p.images, []);
  }
  assert.equal(master.find(p => p.id === 21)['Merged into'], 19);
  assert.deepEqual(master.find(p => p.id === 53)['Replaced by'], tiers.map(p => p.id));
  assert.equal(products.find(p => p.id === 54).confirmedPrice, 349.99);
  assert.match(products.find(p => p.id === 54).specificationStatus, /Not decided/);
  assert.doesNotMatch(products.find(p => p.id === 54).alias, /Tri-Grip/);
});

test('the complete public page excludes held imagery while retaining internal source references', () => {
  const withheldImages = additional.gallery.filter(g => [64, 68].includes(galleryProductIds.get(g.url)));
  assert.equal(withheldImages.length, 2);
  assert.equal(additional.gallery.length, 76);
  assert.equal(galleryProducts.length, 74);
  for (const image of withheldImages) {
    assert.ok(existsSync(new URL(`../public${image.url}`, import.meta.url)));
    assert.ok(!galleryProducts.includes(image));
  }
  // Run the real entrypoint against a minimal DOM, with bundler-only syntax resolved.
  // This covers the entire composed page, not just isolated catalogue sections.
  const source = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8')
    .replace(/^import .+;\r?\n/gm, '')
    .replaceAll('import.meta.env.DEV', 'false');
  const elements = new Map();
  const document = {
    querySelector(selector) {
      if (!elements.has(selector)) elements.set(selector, {
        innerHTML: '', textContent: '', value: '',
        addEventListener() {}, setAttribute() {}, scrollIntoView() {}, focus() {},
      });
      return elements.get(selector);
    },
    addEventListener() {},
    querySelectorAll() { return []; },
  };
  globalThis.document = document;
  try {
    const dependencies = {
      catalogueSection, initCatalogue, products,
      collectionDivisions, renderCollectionShowcase, featuredInnovationsSection, vipAccessSection,
      renderNavigationHeader, approvedFsdHeaderLogo: '/assets/website-shield-lockup-defence.png',
      ourStorySection,
      mountCollectionShowcase() {}, mountNavigation() {}, initFeaturedCarousel() {},
      initCatalogueNavigation() {}, showProduct() {},
    };
    new Function('document', ...Object.keys(dependencies), source)(document, ...Object.values(dependencies));
    const page = document.querySelector('#app').innerHTML;
    assert.match(page, /DESIGN PREVIEW/);
    assert.match(page, /id="catalogue-archive"/);
    assert.doesNotMatch(page, /id="gallery-archive"|id="full-gallery"|DESIGN LIBRARY|IMAGE ARCHIVE/i);
    assert.doesNotMatch(page, /FSD PRODUCT DESIGN LIBRARY|THE FULL VISUAL EDIT|74 designs/i);
    assert.equal((page.match(/class="fsd-brand-logo"/g) || []).length, 2);
    assert.match(page, /website-shield-lockup-defence\.png/);
    assert.doesNotMatch(page, /brand-icon|brand-type/);
    assert.match(page, /The future of training, in development\./);
    assert.match(page, /Engineered for<br\/><span>the Work\.<\/span>/);
    assert.match(page, /AEROFORGE, is in development/);
    assert.doesNotMatch(page, /Sign up today/i);
    assert.doesNotMatch(page, /<form|type="email"/i);
    assert.ok(page.indexOf('class="hero"') < page.indexOf('class="fsd-showcase"'));
    assert.ok(page.indexOf('class="fsd-showcase"') < page.indexOf('id="innovations"'));
    assert.ok(page.indexOf('id="innovations"') < page.indexOf('id="philosophy"'));
    assert.ok(page.indexOf('id="philosophy"') < page.indexOf('id="contact"'));
    assert.doesNotMatch(page, /STRIDE|Shilajit|Championship Belt|Ring Corner Post|add to cart|checkout/i);
    for (const image of withheldImages) {
      assert.ok(!page.includes(image.name));
      assert.ok(!page.includes(image.url));
    }
  } finally {
    delete globalThis.document;
  }
});
