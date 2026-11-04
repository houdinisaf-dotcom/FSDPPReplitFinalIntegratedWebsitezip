import test from 'node:test';
import assert from 'node:assert/strict';
import { products, productImagesForDisplay } from '../src/data/products.js';
import { deriveClothingLineMembership, productBelongsToLine } from '../src/clothing-lines.js';

const membershipIds = () => Object.fromEntries(
  deriveClothingLineMembership(products).lines.map(line => [line.id, line.products.map(product => product.id)]),
);

test('collection membership follows existing public metadata and defensible name boundaries', () => {
  const ids = membershipIds();
  assert.deepEqual(ids.aeroforge, [18, 38, 39, 51]);
  assert.deepEqual(ids.combat, [33, 41]);
  assert.deepEqual(ids.flex, [75]);
  assert.deepEqual(ids.breeze, [73]);
  assert.deepEqual(ids['modest-flow'], [50]);
  assert.deepEqual(ids['tiger-series'], [27]);
  assert.deepEqual(ids['scorpion-series'], [77]);
  assert.ok(!ids.flex.includes(41), 'Strikeflex must not be mistaken for standalone FLEX');
});

test('explicit collection metadata supports future assignments without fixed record IDs', () => {
  assert.equal(productBelongsToLine({
    name: 'Updated training layer',
    audience: 'Women’s',
    collection: 'AeroForge',
    alsoShowIn: [],
  }, 'aeroforge'), true);
  assert.equal(productBelongsToLine({
    name: 'Scorpion Series shell',
    audience: '',
    badge: 'Scorpion Series',
  }, 'scorpion-series'), true);
  assert.equal(productBelongsToLine({
    name: 'FSD Strikeflex Women’s Training Trousers',
    audience: 'Women’s',
  }, 'flex'), false);
});

test('missing collection photography is represented as absent; catalogue records remain unchanged', () => {
  const snapshot = products.map(product => ({
    id: product.id,
    name: product.name,
    confirmedPrice: product.confirmedPrice,
    imageStatus: product.imageStatus,
    images: product.images,
    options: product.options,
  }));
  const result = deriveClothingLineMembership(products);
  const aeroforge = result.lines.find(line => line.id === 'aeroforge');
  assert.equal(result.imageFor(aeroforge.products.find(product => product.id === 38)), null);
  for (const line of result.lines) {
    for (const product of line.products) {
      assert.deepEqual(productImagesForDisplay(product), productImagesForDisplay(products.find(entry => entry.id === product.id)));
    }
  }
  assert.deepEqual(products.map(product => ({
    id: product.id,
    name: product.name,
    confirmedPrice: product.confirmedPrice,
    imageStatus: product.imageStatus,
    images: product.images,
    options: product.options,
  })), snapshot);
});

test('unassigned products remain discoverable and no record is duplicated inside a line', () => {
  const { lines, unassigned } = deriveClothingLineMembership(products);
  const assigned = lines.flatMap(line => line.products);
  assert.equal(new Set(assigned.map(product => product.id)).size, assigned.length);
  assert.ok(unassigned.length > 0);
  assert.ok(unassigned.some(product => product.category === 'Gym Hardware and Accessories'));
});

test('empty lines keep their definitions and women-only lines do not absorb unrelated menswear', () => {
  const { lines } = deriveClothingLineMembership([]);
  assert.equal(lines.length, 7);
  assert.ok(lines.every(line => line.products.length === 0));
  assert.equal(productBelongsToLine({ name: 'FLEX running top', audience: 'Men’s' }, 'flex'), false);
  assert.equal(productBelongsToLine({ name: 'Breeze shirt', audience: 'Men’s' }, 'breeze'), false);
  assert.equal(productBelongsToLine({ name: 'Modest Flow top', audience: 'Women’s' }, 'modest-flow'), true);
});
