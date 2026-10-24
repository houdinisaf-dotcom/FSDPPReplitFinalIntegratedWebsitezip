import test from 'node:test';
import assert from 'node:assert/strict';
import { mountScrollParallax } from '../src/scroll-parallax.js';

function makeHarness({ reducedMotion = false } = {}) {
  const styles = new Map();
  const listeners = new Map();
  const mediaListeners = new Set();
  const pendingFrames = new Map();
  let nextFrame = 1;
  const layer = {
    rect: { top: 100, bottom: 700, height: 600 },
    style: { setProperty: (name, value) => styles.set(name, value) },
    getBoundingClientRect() { return this.rect; },
  };
  const media = {
    matches: reducedMotion,
    addEventListener: (name, listener) => mediaListeners.add(listener),
    removeEventListener: (name, listener) => mediaListeners.delete(listener),
  };
  const windowRef = {
    innerHeight: 800,
    matchMedia: () => media,
    addEventListener: (name, listener) => listeners.set(name, listener),
    removeEventListener: name => listeners.delete(name),
    requestAnimationFrame(callback) {
      const id = nextFrame++;
      pendingFrames.set(id, callback);
      return id;
    },
    cancelAnimationFrame(id) { pendingFrames.delete(id); },
  };
  const root = { querySelectorAll: selector => selector === '[data-fsd-parallax]' ? [layer] : [] };
  const flushFrame = () => {
    const [id, callback] = pendingFrames.entries().next().value || [];
    if (!callback) return;
    pendingFrames.delete(id);
    callback();
  };
  return { layer, styles, listeners, media, mediaListeners, pendingFrames, windowRef, root, flushFrame };
}

test('scroll parallax updates a marked background in a single animation frame and cleans up', () => {
  const harness = makeHarness();
  const dispose = mountScrollParallax(harness.root, harness.windowRef);
  assert.equal(harness.pendingFrames.size, 1);
  harness.flushFrame();
  const initialOffset = harness.styles.get('--fsd-parallax-y');
  assert.equal(Number.parseFloat(initialOffset), 0);

  harness.layer.rect = { top: -100, bottom: 500, height: 600 };
  harness.listeners.get('scroll')();
  assert.equal(harness.pendingFrames.size, 1);
  harness.flushFrame();
  assert.ok(Number.parseFloat(harness.styles.get('--fsd-parallax-y')) < Number.parseFloat(initialOffset));

  dispose();
  assert.equal(harness.listeners.size, 0);
  assert.equal(harness.mediaListeners.size, 0);
});

test('reduced motion keeps layers still and disables scheduled parallax updates', () => {
  const harness = makeHarness({ reducedMotion: true });
  mountScrollParallax(harness.root, harness.windowRef);
  assert.equal(harness.pendingFrames.size, 0);
  assert.equal(harness.styles.size, 0);

  harness.media.matches = false;
  for (const listener of harness.mediaListeners) listener();
  assert.equal(harness.pendingFrames.size, 1);
  harness.media.matches = true;
  for (const listener of harness.mediaListeners) listener();
  assert.equal(harness.pendingFrames.size, 0);
  assert.equal(harness.styles.get('--fsd-parallax-y'), '0px');
});
