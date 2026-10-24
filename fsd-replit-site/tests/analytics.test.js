import test from 'node:test';
import assert from 'node:assert/strict';
import { trackEvent } from '../src/analytics.js';

test('trackEvent safely forwards data and ignores absent or failing analytics', () => {
  const previousWindow = globalThis.window;
  const events = [];

  try {
    globalThis.window = {
      umami: {
        track: (name, data) => events.push([name, data]),
      },
    };
    trackEvent('collection_opened', { division_id: 'apparel', group_index: 0 });
    assert.deepEqual(events, [
      ['collection_opened', { division_id: 'apparel', group_index: 0 }],
    ]);

    globalThis.window = {};
    assert.doesNotThrow(() => trackEvent('bag_opened', { item_count: 0 }));

    globalThis.window = {
      umami: {
        track() {
          throw new Error('Analytics unavailable');
        },
      },
    };
    assert.doesNotThrow(() => trackEvent('product_added_to_bag', { product_id: 1 }));

    globalThis.window = undefined;
    assert.doesNotThrow(() => trackEvent('search_opened', { location: 'header' }));
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});
