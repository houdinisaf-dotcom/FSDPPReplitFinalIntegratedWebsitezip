import assert from 'node:assert/strict';
import test from 'node:test';
import { FSD_MOTION } from '../src/motion-config.js';

test('FSD motion tokens match the storefront interaction timings', () => {
  assert.equal(FSD_MOTION.microDuration, 0.18);
  assert.equal(FSD_MOTION.shortDuration, 0.18);
  assert.equal(FSD_MOTION.overlayDuration, 0.25);
  assert.equal(FSD_MOTION.tabDuration, 0.25);
  assert.equal(FSD_MOTION.routeDuration, 0.3);
  assert.equal(FSD_MOTION.revealDuration, 0.4);
  assert.equal(FSD_MOTION.revealDistance, 20);
  assert.equal(FSD_MOTION.revealThreshold, 0.2);
  assert.equal(FSD_MOTION.rowStagger, 0.06);
});
