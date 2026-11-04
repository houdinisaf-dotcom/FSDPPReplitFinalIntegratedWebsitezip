import test from 'node:test';
import assert from 'node:assert/strict';
import { canAddToBag, createClientBag } from '../src/bag.js';
import { products } from '../src/catalogue-data.js';

function createStorage(initial = null) {
  const values = new Map(initial ? [['fsd-client-bag-v1', initial]] : []);
  return {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
    value(key = 'fsd-client-bag-v1') { return values.get(key) ?? null; },
  };
}

test('bag only accepts current master records with a confirmed non-reference price', () => {
  assert.equal(canAddToBag(products.find(product => product.id === 1)), true);
  assert.equal(canAddToBag(products.find(product => product.id === 43)), true);
  assert.equal(canAddToBag(products.find(product => product.id === 57)), true);
  assert.equal(canAddToBag(products.find(product => product.id === 2)), false);
  assert.equal(canAddToBag({ id: 777, confirmedPrice: 0 }), false);
  assert.equal(canAddToBag({ id: 778, confirmedPrice: 12.5, priceBasis: 'Reference only' }), false);
});

test('bag adds, updates quantity, removes lines, and calculates GBP totals in pence', () => {
  const storage = createStorage();
  const bag = createClientBag(products, storage);

  assert.equal(bag.add(1), true);
  assert.equal(bag.add(1, 2), true);
  assert.equal(bag.itemCount(), 3);
  assert.equal(bag.subtotal(), 11997);
  assert.equal(JSON.parse(storage.value())['1'], 3);

  assert.equal(bag.setQuantity(1, 2), true);
  assert.equal(bag.subtotal(), 7998);
  assert.equal(bag.setQuantity(1, 0), true);
  assert.equal(bag.items().length, 0);
  assert.equal(bag.subtotal(), 0);
});

test('bag adds the requested quantity to the selected product variant', () => {
  const bag = createClientBag(products, createStorage());
  const variant = { size: 'M', colourway: 'Obsidian Black' };

  assert.equal(bag.add(43, 4, variant), true);
  assert.deepEqual(
    bag.items().map(({ productId, size, colourway, quantity }) => [productId, size, colourway, quantity]),
    [[43, 'M', 'Obsidian Black', 4]],
  );
});

test('bag rejects invalid items and restores only valid, bounded persisted quantities', () => {
  const storage = createStorage('{"1":4,"43":2,"2":8,"777":1,"10":300}');
  const bag = createClientBag(products, storage);

  assert.deepEqual(
    bag.items().map(item => [item.product.id, item.quantity]),
    [[1, 4], [10, 99], [43, 2]],
  );
  assert.equal(bag.add(43), true);
  assert.equal(bag.add(2), false);
  assert.equal(bag.add(777), false);

  const malformed = createClientBag(products, createStorage('not-json'));
  assert.equal(malformed.itemCount(), 0);
});

test('bag keeps size and colourway variants as separate legacy-compatible lines', () => {
  const storage = createStorage();
  const bag = createClientBag(products, storage);

  assert.equal(bag.add(43, 1, { size: 'M', colourway: 'Black / Gold' }), true);
  assert.equal(bag.add(43, 1, { size: 'L', colourway: 'Black / Gold' }), true);
  assert.equal(bag.add(43, 1, { size: 'M', colourway: 'Sage Green' }), true);
  assert.equal(bag.itemCount(), 3);
  assert.equal(bag.items().length, 3);
  assert.deepEqual(
    bag.items().map(({ size, colourway }) => [size, colourway]),
    [
      ['M', 'Black / Gold'],
      ['L', 'Black / Gold'],
      ['M', 'Sage Green'],
    ],
  );

  const restored = createClientBag(products, storage);
  assert.equal(restored.itemCount(), 3);
  const line = restored.items().find(item => item.size === 'L');
  assert.equal(restored.setQuantity(line.lineId, 2), true);
  assert.equal(restored.itemCount(), 4);
  assert.equal(restored.remove(line.lineId), true);
  assert.equal(restored.items().some(item => item.size === 'L'), false);
});
