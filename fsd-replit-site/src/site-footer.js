const FOOTER_GROUPS = [
  {
    label: 'Shop',
    links: [
      ['Collections', '/#collections'],
      ['Full catalogue', '/#products'],
    ],
  },
  {
    label: 'The House',
    links: [
      ['The House', '/the-house.html'],
      ['Our Story', '/story'],
      ['Fight Promotions', '/fight-promotions.html'],
      ['Investor Relations', '/investor.html'],
      ['FSD Global', '/#fsd-division-global'],
    ],
  },
  {
    label: 'Explore',
    links: [
      ['FSD Universe', '/#fsd-house-archive'],
      ['Bio-Lab™', '/#bio-lab-archive'],
      ['Hardware', '/#hardware-editorial'],
    ],
  },
  {
    label: 'Private access',
    links: [
      ['VIP Access', '/#contact'],
      ['Private Enquiries', '/enquiries.html'],
    ],
  },
  {
    label: 'Customer care',
    links: [
      ['Contact', '/contact.html'],
      ['Delivery & Returns', '/delivery-returns.html'],
      ['Size Guide', '/size-guide.html'],
      ['Privacy', '/privacy.html'],
      ['Terms', '/terms.html'],
    ],
  },
];

const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
})[character]);

export function renderSiteFooter({
  storyLinkMarkup = '<a href="/story">THE HOUSE / OUR STORY</a>',
  homeHref = '#home',
  year = new Date().getFullYear(),
} = {}) {
  const groups = FOOTER_GROUPS.map(({ label, links }) => {
    const items = links.map(([text, href]) => {
      if (text === 'Our Story') return `<li>${storyLinkMarkup}</li>`;
      const destination = href;
      return `<li><a href="${escapeHtml(destination)}">${escapeHtml(text)}</a></li>`;
    }).join('');
    return `<nav class="fsd-site-footer__group" aria-label="${escapeHtml(label)}">
      <h3>${escapeHtml(label)}</h3><ul>${items}</ul>
    </nav>`;
  }).join('');

  return `<footer class="fsd-site-footer" aria-label="FSD footer">
    <div class="fsd-site-footer__inner">
      <div class="fsd-site-footer__top">
        <div class="fsd-site-footer__brand">
          <a class="fsd-site-footer__logo" href="/" aria-label="FSD home">
            <span data-fsd-logo-slot="footer"></span>
          </a>
          <p class="fsd-site-footer__motto">STRENGTH / DISCIPLINE / CONFIDENCE</p>
          <p class="fsd-site-footer__name">FITNESS &amp; SELF-DEFENCE</p>
          <div class="fsd-site-footer__ctas">
            <a class="fsd-cta fsd-cta--primary" href="/#collections">EXPLORE THE COLLECTIONS <span aria-hidden="true">↗</span></a>
            <a class="fsd-cta fsd-cta--text" href="/enquiries.html">BEGIN AN ENQUIRY <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <div class="fsd-site-footer__links">${groups}</div>
      </div>
      <div id="fsd-react-footer-utilities"></div>
      <div class="fsd-site-footer__bottom">
        <small>© ${escapeHtml(year)} FSD. Fitness &amp; Self-Defence.</small>
        <a href="${escapeHtml(homeHref)}">BACK TO TOP <span aria-hidden="true">↑</span></a>
      </div>
    </div>
  </footer>`;
}
