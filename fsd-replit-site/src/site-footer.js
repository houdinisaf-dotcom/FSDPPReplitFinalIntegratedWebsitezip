import { socialProfiles } from '../site.config.js';

// Explore is grouped into three short lists so the footer reads as a wide,
// compact band instead of one long vertical column.
const EXPLORE_GROUPS = [
  ['Shop', [
    ['Collections', '/#collections'],
    ['Full catalogue', '/#products'],
    ['Hardware', '/#hardware-editorial'],
    ['Bio-Lab™', '/#bio-lab-archive'],
  ]],
  ['The House', [
    ['The House', '/the-house.html'],
    ['Our Story', '/story'],
    ['Fight Promotions', '/fight-promotions.html'],
    ['FSD Universe', '/#fsd-house-archive'],
  ]],
  ['Business', [
    ['Investor Relations', '/investor.html'],
    ['FSD Global', '/#fsd-division-global'],
    ['Members Area (coming soon)', '/private-access'],
    ['Private Enquiries', '/enquiries.html'],
  ]],
];

const SUPPORT_LINKS = [
  ['Contact', '/contact.html'],
  ['Delivery & Returns', '/delivery-returns.html'],
  ['Size Guide', '/size-guide.html'],
  ['Privacy', '/privacy.html'],
  ['Cookies', '/cookies.html'],
  ['Terms', '/terms.html'],
];

// Simple, single-colour marks drawn on a 24px grid (currentColor).
const SOCIAL_ICONS = [
  ['instagram', 'Instagram', '<rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="17.4" cy="6.6" r="1.1" fill="currentColor"/>'],
  ['tiktok', 'TikTok', '<path fill="currentColor" d="M14.6 3h2.9c.2 1.9 1.4 3.4 3.5 3.7v2.9a7 7 0 0 1-3.5-1.1v6.4a5.9 5.9 0 1 1-5.9-5.9c.3 0 .6 0 .9.1v3a3 3 0 1 0 2.1 2.8V3z"/>'],
  ['youtube', 'YouTube', '<path fill="currentColor" d="M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.6 2.6 0 0 0 2.4 7.2 27 27 0 0 0 2 12a27 27 0 0 0 .4 4.8 2.6 2.6 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8A27 27 0 0 0 22 12a27 27 0 0 0-.4-4.8zM10 15.1V8.9l5.2 3.1L10 15.1z"/>'],
  ['linkedin', 'LinkedIn', '<path fill="currentColor" d="M4.5 3.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM3 9h3v12H3zM9 9h2.9v1.7c.4-.8 1.5-1.9 3.4-1.9 3.4 0 4.2 2.2 4.2 5.1V21h-3v-6.3c0-1.5 0-3.3-2-3.3s-2.4 1.6-2.4 3.2V21H9z"/>'],
  ['x', 'X', '<path fill="currentColor" d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.8-6.3L5.4 21H2.3l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.5l11.2 14.5z"/>'],
  ['facebook', 'Facebook', '<path fill="currentColor" d="M13.5 21v-7.7h2.6l.4-3h-3V8.4c0-.9.3-1.5 1.5-1.5h1.6V4.2c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21h3.1z"/>'],
];

function isSafeProfileUrl(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

export function renderSocialIcons(profiles = socialProfiles) {
  const items = SOCIAL_ICONS.map(([id, name, paths]) => {
    const svg = `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">${paths}</svg>`;
    const url = profiles?.[id];
    if (url && isSafeProfileUrl(url)) {
      return `<li><a class="fsd-social-icon" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" aria-label="FSD on ${escapeHtml(name)}">${svg}</a></li>`;
    }
    return `<li><span class="fsd-social-icon is-pending" role="img" aria-label="${escapeHtml(name)}, coming soon" title="${escapeHtml(name)}, coming soon">${svg}</span></li>`;
  }).join('');
  const anyLive = SOCIAL_ICONS.some(([id]) => profiles?.[id] && isSafeProfileUrl(profiles[id]));
  return `<div class="fsd-site-footer__social" aria-label="FSD social channels">
          <ul>${items}</ul>
          ${anyLive ? '' : '<p class="fsd-site-footer__social-note">Socials launching soon</p>'}
        </div>`;
}

const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
})[character]);

export function renderSiteFooter({
  storyLinkMarkup = '<a href="/story">Our Story</a>',
  homeHref = '#home',
  year = new Date().getFullYear(),
} = {}) {
  const renderLinks = links => links.map(([text, href]) => {
    if (text === 'Our Story') return `<li>${storyLinkMarkup}</li>`;
    return `<li><a href="${escapeHtml(href)}">${escapeHtml(text)}</a></li>`;
  }).join('');

  return `<footer class="fsd-site-footer" id="fsd-site-footer" aria-label="FSD footer">
    <div class="fsd-site-footer__inner">
      <div class="fsd-site-footer__top">
        <div class="fsd-site-footer__brand fsd-site-footer__column">
          <a class="fsd-site-footer__logo" href="/" aria-label="FSD home">
            <span data-fsd-logo-slot="footer"></span>
          </a>
          <div class="fsd-site-footer__brand-copy">
            <p class="fsd-site-footer__tagline">Made to Move, Made to Belong.</p>
            <p class="fsd-site-footer__name">FITNESS &amp; SELF-DEFENCE</p>
            <a class="fsd-site-footer__cta" href="/enquiries.html">BEGIN AN ENQUIRY <span aria-hidden="true">↗</span></a>
            ${renderSocialIcons()}
          </div>
        </div>
        <nav class="fsd-site-footer__column fsd-site-footer__group fsd-site-footer__explore" aria-label="Explore FSD">
          ${EXPLORE_GROUPS.map(([title, links]) => `<div class="fsd-site-footer__subgroup">
            <h3>${escapeHtml(title)}</h3><ul>${renderLinks(links)}</ul>
          </div>`).join('')}
        </nav>
        <nav class="fsd-site-footer__column fsd-site-footer__group" aria-label="Support">
          <h3>SUPPORT</h3><ul>${renderLinks(SUPPORT_LINKS)}</ul>
        </nav>
        <section class="fsd-site-footer__column fsd-site-footer__newsletter" aria-labelledby="fsd-newsletter-title">
          <h3 id="fsd-newsletter-title">LAUNCH WAITLIST</h3>
          <p class="fsd-site-footer__newsletter-status" id="fsd-newsletter-status">
            Join the launch waitlist for FSD news and the AEROFORGE reveal.
          </p>
          <a class="fsd-site-footer__newsletter-link" href="/#prelaunch-signup">JOIN THE WAITLIST <span aria-hidden="true">→</span></a>
        </section>
      </div>
      <div class="fsd-site-footer__bottom">
        <small>© ${escapeHtml(year)} FSD. Fitness &amp; Self-Defence.</small>
        <div id="fsd-react-footer-utilities"></div>
        <a href="${escapeHtml(homeHref)}">BACK TO TOP <span aria-hidden="true">↑</span></a>
      </div>
    </div>
  </footer>`;
}
