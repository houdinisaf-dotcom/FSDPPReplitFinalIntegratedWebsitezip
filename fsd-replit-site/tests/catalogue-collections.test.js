import test from 'node:test';
import assert from 'node:assert/strict';
import { products } from '../src/data/products.js';
import { CATALOGUE_COLLECTIONS, deriveTechnicalCollections } from '../src/catalogue-collections.js';
import { productBelongsToLine, deriveClothingLineMembership } from '../src/clothing-lines.js';
import { collectionDivisions } from '../src/collection-divisions.js';
import { createNavigationModel } from '../src/site-navigation.js';
import { routeFromHash, resolveFsdRoute } from '../src/react-router.js';

test('explicit collection identifiers outrank conflicting names, badges and category fallbacks', () => {
  const product = { name: 'FLEX training layer', audience: 'Women’s',
    collectionIds: ['breeze'], badge: 'Scorpion Series', category: 'Combat and MMA' };
  assert.equal(productBelongsToLine(product, 'breeze'), true);
  for (const id of ['flex', 'combat', 'scorpion-series']) assert.equal(productBelongsToLine(product, id), false);
  assert.equal(productBelongsToLine({ ...product, collectionIds: ['not-an-established-line'] }, 'flex'), false);
  assert.equal(productBelongsToLine({ name: 'Updated garment', audience: 'Women’s', tags: ['collection:flex'] }, 'flex'), true);
  assert.equal(productBelongsToLine({ name: 'FLEX shirt', audience: 'Women’s', series: 'Scorpion Series' }, 'flex'), false);
  assert.equal(productBelongsToLine({ name: 'FLEX shirt', audience: 'Women’s', collection: 'Women’s Flagship / FSD Breeze' }, 'flex'), false);
});

test('existing technical memberships and accessory metadata include the existing backpack without new records', () => {
  const collections = deriveTechnicalCollections(products);
  assert.deepEqual(Object.fromEntries(collections.map(c => [c.id, c.products.map(p => p.id)])), {
    'bio-lab-concepts': [59, 60, 61, 62, 63, 65],
    'strength-equipment': [69, 70, 71, 72],
    'combat-equipment': [30, 31, 32, 35],
    'performance-accessories': [52, 55, 56, 57, 60, 63, 65, 76],
  });
  for (const collection of collections) {
    assert.equal(new Set(collection.products.map(p => p.id)).size, collection.products.length);
    assert.ok(collection.products.every(p => products.includes(p)), 'original records, not copies or invented products');
    assert.equal(collection.logoAsset, null, 'no invented collection mark');
  }
});

test('future records update their collections automatically and preserve original price and availability', () => {
  const future = { ...products.find(p => p.id === 76), id: 9001, name: 'New approved accessory',
    collectionIds: ['performance-accessories'], availability: 'OutOfStock' };
  const before = JSON.stringify(products);
  const derived = deriveTechnicalCollections([...products, future]);
  const accessory = derived.find(c => c.id === 'performance-accessories');
  assert.equal(accessory.products.at(-1), future);
  assert.equal(accessory.products.at(-1).availability, 'OutOfStock');
  assert.equal(accessory.products.at(-1).confirmedPrice, future.confirmedPrice);
  assert.ok(derived.filter(c => c.id !== 'performance-accessories').every(c => !c.products.includes(future)));
  const garment = { id: 9002, name: 'New approved garment', audience: 'Women’s', collectionIds: ['flex'] };
  assert.equal(deriveClothingLineMembership([garment]).lines.find(c => c.id === 'flex').products[0], garment);
  assert.equal(JSON.stringify(products), before);
});

test('empty collections and stable configuration remain available without fabricated imagery or merchandise', () => {
  assert.equal(CATALOGUE_COLLECTIONS.length, 11);
  assert.equal(deriveTechnicalCollections([]).length, 4);
  for (const collection of deriveTechnicalCollections([])) {
    assert.deepEqual(collection.products, []);
    assert.equal(collection.bannerImage, null);
    assert.equal(collection.accentColour, '#D4AF37');
    assert.ok(collection.linkedCatalogueCollection);
  }
});

test('SHOP collection shortcuts and cold hashes resolve to the new existing-catalogue banners', () => {
  const model = createNavigationModel({ divisions: collectionDivisions, products });
  const menu = model.find(m => m.id === 'collections');
  const group = menu.groups.find(g => g.id === 'catalogue-collections');
  assert.equal(group.items.length, 4);
  for (const item of group.items) {
    const hash = item.href.slice(1);
    const route = { view: 'collection', target: hash.slice(1) };
    assert.deepEqual(routeFromHash(hash), route);
    assert.deepEqual(resolveFsdRoute({ menu, group, item }), route);
  }
});
