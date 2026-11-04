import assert from 'node:assert/strict';
import test from 'node:test';
import { renderSiteFooter } from '../src/site-footer.js';

test('shared footer uses existing destinations and the private enquiry route', () => {
  const footer = renderSiteFooter({
    storyLinkMarkup: '<a href="/story">THE HOUSE / OUR STORY</a>',
    homeHref: '#home',
    year: 2026,
  });

  for (const path of [
    '/#collections',
    '/#catalogue-archive',
    '/the-house.html',
    '/fight-promotions.html',
    '/investor.html',
    '/#fsd-division-global',
    '/#bio-lab-archive',
    '/#hardware-editorial',
    '/enquiries.html',
    '/delivery-returns.html',
    '/privacy.html',
    '/terms.html',
  ]) assert.ok(footer.includes(`href="${path}"`), `Expected existing footer destination ${path}.`);

  assert.match(footer, /data-fsd-logo-slot="footer"/);
  assert.match(footer, /BEGIN AN ENQUIRY/);
  assert.match(footer, /© 2026 FSD/);
  assert.doesNotMatch(footer, /\[TO CONFIRM|Facebook|Instagram|TikTok|YouTube|LinkedIn/);
});
