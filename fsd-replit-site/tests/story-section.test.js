import test from 'node:test';
import assert from 'node:assert/strict';
import { ourStorySection } from '../src/story-section.js';

test('Story & Archive presents all four supplied chapters and five House Codes without opening sign-ups', () => {
  const html = ourStorySection();

  assert.match(html, /Capability is not a costume\.<br\/><span>It is a practice\.<\/span>/);
  assert.match(html, /founded by a lifelong athlete/);
  assert.match(html, /We are not building an image of capability\. We are building the conditions for it\./);
  assert.match(html, /00 \/ THE QUESTION/);
  assert.match(html, /Capability over theatre/);
  assert.match(html, /01 \/ THE PRACTICE/);
  assert.match(html, /Train the whole day/);
  assert.match(html, /02 \/ THE SYSTEM/);
  assert.match(html, /Make the parts speak/);
  assert.match(html, /03 \/ THE HOUSE/);
  assert.match(html, /Keep it close to place/);
  for (const code of ['Discipline', 'Composure', 'Protection', 'Responsibility', 'Progress']) {
    assert.match(html, new RegExp(`<h4>${code}<\\/h4>`));
  }
  assert.match(html, /Manchester, Dublin and Belfast are points of reference—not a claim of operating FSD sites/);
  assert.match(html, /Membership, apparel, hardware and education are part of the FSD community/);
  assert.match(html, /AEROFORGE represents FSD’s direction in technical training apparel/);
  assert.doesNotMatch(html, /in development|pre-launch/i);
  assert.match(html, /The Road Ahead/);
  assert.match(html, /A NOTE ON HONESTY/);
  assert.match(html, /VIP Access will be shared when they are ready/);
  assert.doesNotMatch(html, /Sign up today|<form|type="email"/i);
  assert.doesNotMatch(html, /self-defense/i);
});
