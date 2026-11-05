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
    '/#products',
    '/the-house.html',
    '/story',
    '/fight-promotions.html',
    '/investor.html',
    '/#fsd-division-global',
    '/#fsd-house-archive',
    '/#bio-lab-archive',
    '/#hardware-editorial',
    '/#contact',
    '/enquiries.html',
    '/contact.html',
    '/delivery-returns.html',
    '/size-guide.html',
    '/privacy.html',
    '/terms.html',
  ]) assert.ok(footer.includes(`href="${path}"`), `Expected existing footer destination ${path}.`);

  assert.equal((footer.match(/fsd-site-footer__column/g) || []).length, 4);
  assert.match(footer, /data-fsd-logo-slot="footer"/);
  assert.match(footer, /BEGIN AN ENQUIRY/);
  assert.match(footer, /Made to Move, Made to Belong\./);
  assert.match(footer, /id="fsd-newsletter-email"[^>]*disabled aria-disabled="true"/);
  assert.match(footer, /<button type="button" disabled aria-disabled="true">JOIN<\/button>/);
  assert.match(footer, /Sign-up is unavailable until email delivery and privacy details are in place\./);
  assert.match(footer, /© 2026 FSD/);
  assert.doesNotMatch(footer, /\[TO CONFIRM|Facebook|Instagram|TikTok|YouTube|LinkedIn/);
});
