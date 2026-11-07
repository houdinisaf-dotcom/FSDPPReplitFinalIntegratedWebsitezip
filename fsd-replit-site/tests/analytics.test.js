import test from 'node:test';
import assert from 'node:assert/strict';
import {
  trackCompletedMemberRegistration,
  trackCompletedMemberSignIn,
  trackCompletedPurchase,
  trackEvent,
} from '../src/analytics.js';

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

test('completed purchases include only the approved GBP value after payment succeeds', () => {
  const previousWindow = globalThis.window;
  const events = [];

  try {
    globalThis.window = {
      umami: {
        track: (name, data) => events.push([name, data]),
      },
    };

    for (const paymentStatus of ['pending', 'failed', 'canceled', 'abandoned']) {
      trackCompletedPurchase({ paymentStatus, orderValueMinor: 1250, currency: 'GBP' });
    }
    trackCompletedPurchase({ paymentStatus: 'succeeded', orderValueMinor: 0, currency: 'GBP' });
    trackCompletedPurchase({ paymentStatus: 'succeeded', orderValueMinor: 1250, currency: 'USD' });
    trackCompletedPurchase({
      paymentStatus: 'succeeded',
      orderValueMinor: 1250,
      currency: 'GBP',
      customerEmail: 'not-for-analytics@example.com',
      paymentMethod: 'not-for-analytics',
    });

    assert.deepEqual(events, [
      ['purchase_completed', { order_value: 12.5, currency: 'GBP' }],
    ]);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});

test('member analytics records only confirmed outcomes without account or auth details', () => {
  const previousWindow = globalThis.window;
  const events = [];

  try {
    globalThis.window = {
      umami: {
        track: (name, data) => events.push([name, data]),
      },
    };

    trackCompletedMemberSignIn({ signInStatus: 'pending' });
    trackCompletedMemberSignIn({ signInStatus: 'failed' });
    trackCompletedMemberRegistration({ registrationStatus: 'pending' });
    trackCompletedMemberRegistration({ registrationStatus: 'failed' });

    trackCompletedMemberSignIn({
      signInStatus: 'succeeded',
      email: 'member@example.test',
      name: 'Private Member',
      accessToken: 'private-token',
    });
    trackCompletedMemberRegistration({
      registrationStatus: 'succeeded',
      email: 'member@example.test',
      password: 'private-password',
      sessionId: 'private-session',
    });

    assert.deepEqual(events, [
      ['member_sign_in_completed', undefined],
      ['member_registration_completed', undefined],
    ]);
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
});
