import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldEnableSmoothScroll } from '../src/smooth-scroll.js';

function viewWith({ reduced = false, coarse = false, touchPoints = 0 } = {}) {
  return {
    navigator: { maxTouchPoints: touchPoints },
    matchMedia(query) {
      return { matches: query.includes('prefers-reduced-motion') ? reduced : coarse };
    },
  };
}

test('smooth scrolling is limited to non-touch users without reduced motion', () => {
  assert.equal(shouldEnableSmoothScroll(viewWith()), true);
  assert.equal(shouldEnableSmoothScroll(viewWith({ reduced: true })), false);
  assert.equal(shouldEnableSmoothScroll(viewWith({ coarse: true })), false);
  assert.equal(shouldEnableSmoothScroll(viewWith({ touchPoints: 1 })), false);
});
