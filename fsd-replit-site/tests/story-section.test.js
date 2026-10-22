import test from 'node:test';
import assert from 'node:assert/strict';
import { ourStorySection } from '../src/story-section.js';

test('Our Story presents the supplied FSD narrative without opening sign-ups or stating unverified product facts', () => {
  const html = ourStorySection();

  assert.match(html, /Engineered for<br\/><span>the Work\.<\/span>/);
  assert.match(html, /founded by a lifelong athlete/);
  assert.match(html, /What We Stand For/);
  assert.match(html, /AEROFORGE, is in development/);
  assert.match(html, /The Road Ahead/);
  assert.match(html, /A NOTE ON HONESTY/);
  assert.match(html, /VIP Access will be shared when they are ready/);
  assert.doesNotMatch(html, /Sign up today|<form|type="email"/i);
  assert.doesNotMatch(html, /self-defense/i);
});
