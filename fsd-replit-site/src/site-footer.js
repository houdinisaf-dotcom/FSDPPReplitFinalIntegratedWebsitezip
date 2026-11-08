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
    ['VIP Access', '/#contact'],
    ['Private Enquiries', '/enquiries.html'],
  ]],
];

const SUPPORT_LINKS = [
  ['Contact', '/contact.html'],
  ['Delivery & Returns', '/delivery-returns.html'],
  ['Size Guide', '/size-guide.html'],
  ['Privacy', '/privacy.html'],
  ['Terms', '/terms.html'],
];

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
          <h3 id="fsd-newsletter-title">NEWSLETTER</h3>
          <div class="fsd-site-footer__newsletter-controls" role="group"
            aria-label="Newsletter sign-up" aria-describedby="fsd-newsletter-status">
            <label class="fsd-site-footer__sr-only" for="fsd-newsletter-email">Email address</label>
            <input id="fsd-newsletter-email" name="newsletter-email" type="email" autocomplete="email"
              placeholder="Email address" disabled aria-disabled="true"/>
            <button type="button" disabled aria-disabled="true">JOIN</button>
          </div>
          <p class="fsd-site-footer__newsletter-status" id="fsd-newsletter-status">
            Sign-up is unavailable until email delivery and privacy details are in place.
          </p>
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
