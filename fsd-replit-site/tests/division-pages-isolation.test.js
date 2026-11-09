import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('../src/components/DivisionHub.css', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const hub = readFileSync(new URL('../src/components/DivisionHub.jsx', import.meta.url), 'utf8');

test('division landing pages hide the homepage stack but keep the footer and dialogs', () => {
  assert.match(css, /\[data-fsd-storefront\]\[data-division-hub\] \[data-storefront-content\] > :not\(\.fsd-site-footer\):not\(dialog\)/);
  // The old rule depended on data-current-view="division-hub", which a hash jump could change.
  assert.doesNotMatch(css, /\[data-division-hub\]\[data-current-view="division-hub"\] \[data-storefront-content\] \{/);
});

test('The House page shows only the House archive, footer and dialogs', () => {
  assert.match(css, /\[data-current-view="house"\]:not\(\[data-division-hub\]\) \[data-storefront-content\] > :not\(#fsd-house-archive\):not\(\.fsd-site-footer\):not\(dialog\)/);
});

test('division landing pages do not jump to legacy homepage anchors', () => {
  assert.match(app, /entry\?\.hash && !window\.location\.hash && !divisionHubId/);
});

test('division pages keep a dark, legible header', () => {
  assert.match(css, /\[data-division-hub\] \.fsd-navigation-shell \.header\.fsd-header \{\s*background: #111318;/);
});

test('division hub copy does not double-escape ampersands', () => {
  assert.doesNotMatch(hub, /'[^'\n]*&amp;[^'\n]*'/);
});

test('the circle emblem (logo concept 3) is not used anywhere on the site', async () => {
  const { readdirSync } = await import('node:fs');
  const crops = readdirSync(new URL('../public/brand/logo-panel-crops/', import.meta.url));
  assert.ok(!crops.some(name => /concept-3|circle/i.test(name)), 'circle emblem asset must not be shipped');
  const config = readFileSync(new URL('../src/config/priority-three.json', import.meta.url), 'utf8');
  assert.doesNotMatch(config, /concept-3|circle emblem/i);
});

test('homepage shows the launch waitlist', () => {
  const refinement = readFileSync(new URL('../src/premium-visual-refinement.css', import.meta.url), 'utf8');
  assert.match(refinement, /:not\(#home\):not\(#prelaunch-signup\)/);
});
