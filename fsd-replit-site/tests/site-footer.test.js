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
    '/private-access',
    '/cookies.html',
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
  // No disabled look-alike form: the footer links to the working waitlist.
  assert.doesNotMatch(footer, /disabled aria-disabled="true"/);
  assert.match(footer, /href="\/#prelaunch-signup"[^>]*>JOIN THE WAITLIST/);
  assert.match(footer, /href="\/cookies\.html"/);
  assert.match(footer, /© 2026 FSD/);
  assert.doesNotMatch(footer, /\[TO CONFIRM/);
  // Social icons are shown, but never as links until a verified profile URL is configured.
  for (const name of ['Instagram', 'TikTok', 'YouTube', 'LinkedIn', 'X', 'Facebook']) {
    assert.match(footer, new RegExp(`aria-label="${name}, coming soon"`));
  }
  assert.doesNotMatch(footer, /class="fsd-social-icon"[^>]*href=/);
  assert.match(footer, /Socials launching soon/);
});

test('configured social profiles become safe external links', async () => {
  const { renderSocialIcons } = await import('../src/site-footer.js');
  const html = renderSocialIcons({ instagram: 'https://www.instagram.com/fsd', tiktok: 'javascript:alert(1)' });
  assert.match(html, /href="https:\/\/www\.instagram\.com\/fsd"[^>]*rel="noopener noreferrer"/);
  assert.match(html, /aria-label="TikTok, coming soon"/);
  assert.doesNotMatch(html, /javascript:/);
  assert.doesNotMatch(html, /launching soon/);
});
