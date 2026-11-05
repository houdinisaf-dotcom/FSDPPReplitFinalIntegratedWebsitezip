import './_group.css';
import { ASSET } from './_shared/ProposalShell';

const explore = [
  ['Collections', '/#collections'], ['Full catalogue', '/#products'], ['The House', '/the-house.html'], ['Our Story', '/story'],
  ['Fight Promotions', '/fight-promotions.html'], ['Investor Relations', '/investor.html'], ['FSD Global', '/#fsd-division-global'],
  ['FSD Universe', '/#fsd-house-archive'], ['Bio-Lab™', '/#bio-lab-archive'], ['Hardware', '/#hardware-editorial'],
  ['VIP Access', '/#contact'], ['BEGIN AN ENQUIRY', '/enquiries.html'], ['Private Enquiries', '/enquiries.html'],
];
const support = [['Contact', '/contact.html'], ['Delivery & Returns', '/delivery-returns.html'], ['Size Guide', '/size-guide.html'], ['Privacy', '/privacy.html'], ['Terms', '/terms.html']];
function Links({ title, links }: { title: string; links: string[][] }) {
  return <nav><h2>{title}</h2><ul>{links.map(([label, href]) => <li key={label}><a href={href}>{label}</a></li>)}</ul></nav>;
}
export function Footer() {
  return <main className="ffp-page ffp-footer-screen">
    <footer className="ffp-footer-large">
      <div className="ffp-footer-large__mark">
        <section className="ffp-footer-large__brand"><img src={`${ASSET}approved-shield.png`} alt="FSD approved shield" /><h1>Made to Move,<br />Made to Belong.</h1><p>FITNESS &amp; SELF-DEFENCE</p></section>
        <Links title="EXPLORE" links={explore} />
        <Links title="SUPPORT" links={support} />
        <section className="ffp-newsletter"><h2>NEWSLETTER</h2><label className="sr-only" htmlFor="ffp-newsletter-email">Email address</label><input id="ffp-newsletter-email" type="email" placeholder="Email address" disabled aria-disabled="true" /><button type="button" disabled aria-disabled="true">JOIN</button><p>Sign-up is unavailable until email delivery and privacy details are in place.</p></section>
      </div>
      <div className="ffp-footer-large__bottom"><small>© {new Date().getFullYear()} FSD. Fitness &amp; Self-Defence.</small><span>LEGAL / PRIVACY / TERMS</span><a href="#top">BACK TO TOP ↑</a></div>
    </footer>
  </main>;
}
