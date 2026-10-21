import test from 'node:test';
import assert from 'node:assert/strict';
import { products } from '../src/catalogue-data.js';
import { collectionDivisions } from '../src/collection-divisions.js';
import { renderCollectionShowcase, groupProducts } from '../src/collection-showcase/index.js';
import { featuredProducts, featuredInnovationsSection, vipAccessSection } from '../src/showroom-sections.js';

test('the showroom renders four accessible division controls and one reusable dialog', () => {
  const markup = renderCollectionShowcase(collectionDivisions);
  assert.equal((markup.match(/data-division=/g) || []).length, 4);
  assert.equal((markup.match(/<dialog/g) || []).length, 1);
  assert.match(markup, /id="fsd-showcase-dialog"/);
  assert.equal((markup.match(/aria-controls="fsd-showcase-dialog"/g) || []).length, 4);
  assert.equal((markup.match(/aria-expanded="false"/g) || []).length, 4);
  assert.match(markup, /The future of training, in development\./);
  assert.doesNotMatch(markup, /STRIDE|Shilajit|checkout|add to cart/i);
  assert.deepEqual(collectionDivisions.map(division => division.id), ['apparel', 'bio-lab', 'hardware', 'global']);
});

test('group filters constrain category, audience and terms rather than leaking unrelated products', () => {
  const apparel = collectionDivisions[0];
  const men = groupProducts(apparel.groups[0], products);
  const women = groupProducts(apparel.groups[1], products);
  assert.ok(men.length && men.every(product => ['Men’s', 'Unisex'].includes(product.audience)));
  assert.ok(women.length && women.every(product => product.audience === 'Women’s'));
  assert.ok(women.some(product => product.id === 43));
  const hardware = collectionDivisions[2];
  assert.deepEqual(groupProducts(hardware.groups[0], products).map(product => product.id), [69, 70, 71, 72]);
  assert.deepEqual(groupProducts(hardware.groups[2], products), []);
  assert.deepEqual(groupProducts({}, products), []);
  assert.ok(groupProducts(hardware.groups[1], products).every(product => /gloves|mitts|mouthguard|gear kit/i.test(product.name)));
  assert.ok(groupProducts(collectionDivisions[3].groups[0], products).length === 0);
});

test('apparel subcategories select genuine records and distinguish new concepts', () => {
  const women = collectionDivisions[0].groups[1];
  const hijabs = groupProducts(women, products, women.subcategories[0]);
  assert.ok(hijabs.some(product => product.id === 43));
  assert.ok(hijabs.every(product => /hijab/i.test(product.name)));
  const men = collectionDivisions[0].groups[0];
  const volcanic = men.subcategories.find(item => /Volcanic/.test(item.title));
  assert.equal(groupProducts(men, products, volcanic).length, 0);
  assert.deepEqual(volcanic.concepts, ['Volcanic Amber Capsule']);
});

test('features reuse active master records and the approved Velocity main image', () => {
  assert.equal(featuredProducts.length, 4);
  assert.ok(featuredProducts.every(product => products.includes(product)));
  const markup = featuredInnovationsSection();
  assert.match(markup, /fsd-velocity-performance-sports-hijab\.jpg/);
  assert.match(markup, /£699\.99/);
  assert.doesNotMatch(markup, /STRIDE|Shilajit|checkout/i);
});

test('deferred VIP access cannot collect or pretend to submit personal data', () => {
  const markup = vipAccessSection();
  assert.match(markup, /REQUEST VIP ACCESS/);
  assert.match(markup, /disabled aria-describedby="vip-status"/);
  assert.match(markup, /not collecting sign-ups yet/);
  assert.doesNotMatch(markup, /<form|<input|mailto:|action=|subscribe/i);
});
