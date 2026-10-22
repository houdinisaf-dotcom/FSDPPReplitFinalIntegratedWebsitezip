import assert from 'node:assert/strict';
import test from 'node:test';
import { bindCollectionReturn } from '../src/collection-return.js';

function setup({ referrer, pathname = '/__catalogue-preview/product/', origin = 'https://fsd.test', historyLength = 3 }) {
  const listeners = new Map();
  let backCalls = 0;
  const root = {
    addEventListener(type, callback) { listeners.set(type, callback); },
    removeEventListener(type) { listeners.delete(type); },
    contains() { return true; },
  };
  globalThis.document = { referrer };
  globalThis.window = {
    location: { origin, pathname },
    history: { length: historyLength, back() { backCalls++; } },
  };
  const cleanup = bindCollectionReturn(root);
  const link = {};
  const event = {
    target: { closest: selector => selector === '[data-collection-return]' ? link : null },
    prevented: false,
    preventDefault() { this.prevented = true; },
  };
  listeners.get('click')(event);
  return { event, cleanup, backCalls: () => backCalls, listeners };
}

test('collection return restores same-site home browsing history when available', () => {
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;
  const state = setup({ referrer: 'https://fsd.test/#collections' });
  try {
    assert.equal(state.event.prevented, true);
    assert.equal(state.backCalls(), 1);
  } finally {
    state.cleanup();
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
});

test('collection return keeps its fallback link for off-site or non-home referrers', () => {
  const originalDocument = globalThis.document;
  const originalWindow = globalThis.window;
  const state = setup({ referrer: 'https://example.org/campaign' });
  try {
    assert.equal(state.event.prevented, false);
    assert.equal(state.backCalls(), 0);
  } finally {
    state.cleanup();
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
});
