import test from 'node:test';
import assert from 'node:assert/strict';
import { products, priceInfo } from '../src/catalogue-data.js';
import { collectionDivisions } from '../src/collection-divisions.js';
import { renderCollectionShowcase, groupProducts, matchesDraftCardScope } from '../src/collection-showcase/index.js';
import { featuredProducts, featuredInnovationsSection, vipAccessSection } from '../src/showroom-sections.js';

test('the showroom renders four accessible division controls and one reusable dialog', () => {
  const markup = renderCollectionShowcase(collectionDivisions);
  assert.equal((markup.match(/data-division=/g) || []).length, 4);
  assert.equal((markup.match(/<dialog/g) || []).length, 1);
  assert.match(markup, /id="fsd-showcase-dialog"/);
  assert.equal((markup.match(/aria-controls="fsd-showcase-dialog"/g) || []).length, 4);
  assert.equal((markup.match(/aria-expanded="false"/g) || []).length, 4);
  assert.match(markup, /Training technology and connected apparel\./);
  for (const label of ['EXPLORE APPAREL', 'EXPLORE BIO-LAB™', 'EXPLORE HARDWARE', 'EXPLORE GLOBAL']) {
    assert.ok(markup.includes(label));
  }
  assert.doesNotMatch(markup, /fsd-showcase-index|fsd-banner-index|OPEN DIVISION/);
  assert.doesNotMatch(markup, /STRIDE|Shilajit|checkout|add to cart/i);
  assert.deepEqual(collectionDivisions.map(division => division.id), ['apparel', 'bio-lab', 'hardware', 'global']);
});

test('the editorial home keeps the three primary destinations concise and opens the correct groups', () => {
  const markup = renderCollectionShowcase(collectionDivisions, { editorial: true });
  assert.match(markup, /Men’s Luxury Performance/);
  assert.match(markup, /Women’s Modest Combat/);
  assert.match(markup, /Intelligence in Motion/);
  assert.match(markup, /Training technology and recovery\./);
  assert.match(markup, /data-division="apparel"[\s\S]*?data-group-index="0"/);
  assert.match(markup, /data-division="apparel"[\s\S]*?data-group-index="1"/);
  assert.match(markup, /data-division="bio-lab"[\s\S]*?data-group-index="0"/);
  assert.match(markup, /id="fsd-division-hardware"[^>]*data-division="hardware"/);
  assert.match(markup, /id="fsd-division-global"[^>]*data-division="global"/);
  assert.equal((markup.match(/<dialog/g) || []).length, 1);
  assert.doesNotMatch(markup, /fsd-showcase-banner|SHOP ALL PRODUCTS|ADD TO BAG/i);
});

test('group filters constrain category, audience and terms rather than leaking unrelated products', () => {
  const apparel = collectionDivisions[0];
  const men = groupProducts(apparel.groups[0], products);
  const women = groupProducts(apparel.groups[1], products);
  assert.ok(men.length && men.every(product => ['Men’s', 'Unisex'].includes(product.audience)));
  const expectedWomenIds = products
    .filter(product => product.audience === 'Women’s')
    .map(product => product.id)
    .sort((a, b) => a - b);
  assert.deepEqual(women.map(product => product.id).sort((a, b) => a - b), expectedWomenIds);
  assert.ok(women.some(product => product.id === 43));
  const hardware = collectionDivisions[2];
  assert.deepEqual(groupProducts(hardware.groups[0], products).map(product => product.id), [69, 70, 71, 72]);
  assert.deepEqual(groupProducts(hardware.groups[2], products), []);
  assert.deepEqual(groupProducts({}, products), []);
  assert.ok(groupProducts(hardware.groups[1], products).every(product => /gloves|mitts|mouthguard|gear kit/i.test(product.name)));
  assert.ok(groupProducts(collectionDivisions[3].groups[0], products).length === 0);
});

test('women’s sub-lines cover the existing catalogue without unfilled concept placeholders', () => {
  const women = collectionDivisions[0].groups[1];
  const hijabs = groupProducts(women, products, women.subcategories[0]);
  assert.ok(hijabs.some(product => product.id === 43));
  assert.ok(hijabs.every(product => /hijab/i.test(product.name)));
  const longline = groupProducts(women, products, women.subcategories.find(subcategory =>
    subcategory.title === 'Longline Tunics & Training Jackets',
  ));
  assert.deepEqual(longline.map(product => product.id).sort((a, b) => a - b), [47, 48]);
  const leggings = groupProducts(women, products, women.subcategories.find(subcategory =>
    subcategory.title === 'Performance Leggings & Strikeflex Trousers',
  ));
  assert.deepEqual(leggings.map(product => product.id).sort((a, b) => a - b), [40, 41, 74, 75]);
  assert.ok(women.subcategories.every(subcategory => !subcategory.concepts?.length));
  const sublineProductIds = [...new Set(women.subcategories.flatMap(subcategory =>
    groupProducts(women, products, subcategory).map(product => product.id),
  ))].sort((a, b) => a - b);
  const allWomenProductIds = products
    .filter(product => product.audience === 'Women’s')
    .map(product => product.id)
    .sort((a, b) => a - b);
  assert.deepEqual(sublineProductIds, allWomenProductIds);
  const men = collectionDivisions[0].groups[0];
  const volcanic = men.subcategories.find(item => /Volcanic/.test(item.title));
  assert.equal(groupProducts(men, products, volcanic).length, 0);
  assert.deepEqual(volcanic.concepts, ['Volcanic Amber Capsule']);
});

test('draft previews stay in their assigned group view unless a subcategory is explicitly mapped', () => {
  const groupDraft = { divisionId: 'apparel', groupId: 'womens-modest-combat' };
  assert.equal(matchesDraftCardScope(groupDraft, 'apparel', 'womens-modest-combat', -1), true);
  assert.equal(matchesDraftCardScope(groupDraft, 'apparel', 'womens-modest-combat', 0), false);
  assert.equal(matchesDraftCardScope(groupDraft, 'apparel', 'mens-luxury-performance', -1), false);

  const mappedDraft = { ...groupDraft, subcategoryIndex: 0 };
  assert.equal(matchesDraftCardScope(mappedDraft, 'apparel', 'womens-modest-combat', 0), true);
  assert.equal(matchesDraftCardScope(mappedDraft, 'apparel', 'womens-modest-combat', 1), false);
  assert.equal(matchesDraftCardScope(mappedDraft, 'apparel', 'womens-modest-combat', -1), false);
});

test('featured carousel uses only catalogue records with a public RRP and mapped product assets', () => {
  assert.deepEqual(featuredProducts.map(product => product.id), [1, 10]);
  assert.ok(featuredProducts.every(product => products.includes(product)));
  assert.ok(featuredProducts.every(product => {
    const price = priceInfo(product);
    return product.images.length > 0 && Boolean(price.value) && !price.label;
  }));
  const markup = featuredInnovationsSection();
  assert.match(markup, /id="innovations"/);
  assert.match(markup, /data-fsd-featured-carousel-slot/);
  assert.doesNotMatch(markup, /Breeze|Nexus|Apex|£|fsd-velocity-performance-sports-hijab/i);
  assert.doesNotMatch(markup, /STRIDE|Shilajit|checkout/i);
});

test('deferred VIP access cannot collect or pretend to submit personal data', () => {
  const markup = vipAccessSection();
  assert.match(markup, /REQUEST VIP ACCESS/);
  assert.match(markup, /disabled aria-describedby="vip-status"/);
  assert.match(markup, /not collecting sign-ups yet/);
  assert.doesNotMatch(markup, /<form|<input|mailto:|action=|subscribe/i);
});
