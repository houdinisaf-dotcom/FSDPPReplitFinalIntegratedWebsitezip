import assert from 'node:assert/strict';
import test from 'node:test';
import { renderHomepageFaq } from '../src/homepage-faq.js';

test('homepage FAQ uses only current site information and existing routes', () => {
  const markup = renderHomepageFaq();
  assert.equal((markup.match(/<details /g) || []).length, 4);
  assert.match(markup, /FSD stands for Fitness &amp; Self-Defence/);
  assert.match(markup, /href="#collections"/);
  assert.match(markup, /does not currently accept membership, training, or club bookings/);
  assert.doesNotMatch(markup, /ButterEase|\$85|Training Space [A-C]|DEMO BAG/i);
});
