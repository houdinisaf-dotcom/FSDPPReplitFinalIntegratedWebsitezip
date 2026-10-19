import { catalogueSection, roadmapSection, innovationsSection, initCatalogue } from './catalogue.js';
import { gallerySection } from './gallery.js';
import './style.css';
import './catalogue.css';

function icon() {
  return `<svg viewBox="0 0 100 100" fill="none" aria-hidden="true"><path d="M50 6 85 20 80 62 50 91 20 62 15 20Z" stroke="currentColor" stroke-width="5"/><path d="M20 65 68 20 51 56 83 38 36 81 49 48Z" fill="currentColor"/></svg>`;
}

function header() {
  return `<div class="announcement">FSD / THE NEXT ERA OF MOVEMENT <span>— PRE-LAUNCH COLLECTION</span></div>
    <header class="header"><a class="brand" href="#home" aria-label="FSD Home">
      <span class="brand-icon">${icon()}</span><span class="brand-type"><strong>FSD</strong><small>FITNESS & SELF DEFENCE</small></span>
    </a><nav aria-label="Main navigation"><a href="#collections">COLLECTIONS</a><a href="#products">PRODUCTS</a>
      <a href="#philosophy">OUR STORY</a><a href="#innovations">INNOVATIONS</a><a href="#full-gallery">DESIGN LIBRARY</a><a href="#contact">CONTACT</a>
    </nav><a class="header-cta" href="#products">EXPLORE COLLECTION <span>↗</span></a></header>`;
}

document.querySelector('#app').innerHTML = `${header()}<main id="home">
  <section class="hero"><div class="hero-image"></div><div class="hero-shade"></div><div class="hero-content">
    <p class="eyebrow">THE FSD PERFORMANCE UNIVERSE <span class="gold-line"></span> EST. UNITED KINGDOM</p>
    <h1>BUILT FOR<br/><em>THE DRIVE</em><br/>WITHIN.</h1>
    <p class="hero-copy">Performance. Discipline. Identity. Discover technical training wear, combat-inspired design and modest activewear under one unmistakable shield.</p>
    <div class="hero-actions"><a class="primary-btn" href="#products">EXPLORE THE COLLECTION <span>↗</span></a>
    <a class="ghost-btn" href="#philosophy">DISCOVER FSD →</a></div>
    <div class="hero-foot"><span>01 / 03</span><span>DESIGNED TO MOVE. BUILT TO BELONG.</span></div></div>
    <div class="vertical-label">FITNESS & SELF DEFENCE — 2026</div>
  </section>
  <section class="manifesto" id="philosophy"><p class="section-kicker">THE FSD ETHOS</p>
    <h2>ONE IDENTITY.<br/><span>EVERY WAY TO MOVE.</span></h2>
    <p>From the training floor to everyday life, FSD brings a premium design language to performance, self-defence and inclusive movement.
    Our proposed product portfolio is currently in development.</p>
    <div class="values"><span>01 / STRENGTH</span><span>02 / DISCIPLINE</span><span>03 / CONFIDENCE</span></div>
  </section>
  <section class="collections" id="collections"><div class="section-heading"><div><p class="section-kicker">DISCOVER THE UNIVERSE</p>
    <h2>COLLECTIONS<span class="period">.</span></h2></div><p>Distinct disciplines.<br/>One FSD standard.</p></div>
    <div class="collection-grid">
      <a href="#products" class="collection-tile signature"><span class="tile-no">01 / SIGNATURE</span>
      <div><p>THE FOUNDATION</p><h3>FSD<br/>SIGNATURE</h3><span>DISCOVER THE EDIT ↗</span></div></a>
      <a href="#products" data-category-link="Men’s Performance and Training" class="collection-tile performance"><span class="tile-no">02 / PERFORMANCE</span>
      <div><p>ENGINEERED FOR MOTION</p><h3>PERFORMANCE<br/>DIVISION</h3><span>DISCOVER THE EDIT ↗</span></div></a>
      <a href="#products" data-category-link="Modest Activewear" class="collection-tile modest"><span class="tile-no">03 / MODEST ACTIVEWEAR</span>
      <div><p>STRENGTH IN EVERY FORM</p><h3>MODEST<br/>MOVEMENT</h3><span>EXPLORE THE RANGE ↗</span></div></a>
    </div>
  </section>
  ${catalogueSection()}
  <section class="blue-banner"><div><p class="section-kicker">BEYOND THE EXPECTED</p>
    <h2>PERFORMANCE<br/><em>HAS NO SINGLE COLOUR.</em></h2>
    <p>Signature gold. Electric blue. Statement prints. One unified identity.</p>
    <a href="#planned" class="light-btn">SEE THE FULL ROADMAP ↗</a></div>
  </section>
  ${roadmapSection()}
  ${innovationsSection()}
  ${gallerySection()}
  <section class="newsletter" id="contact"><p class="section-kicker">THE NEXT CHAPTER</p>
    <h2>BE FIRST.<br/><em>BE FSD.</em></h2><p>Our collections are taking shape. For launch information and partnership enquiries, get in touch.</p>
    <a class="primary-btn" href="mailto:hello@example.com?subject=FSD%20Enquiry" id="email-link">CONTACT FSD ↗</a>
    <small>Replace the placeholder contact address before publishing.</small>
  </section></main>
  <footer><div class="footer-brand"><span class="brand-icon">${icon()}</span><strong>FSD</strong><small>FITNESS & SELF DEFENCE</small></div>
    <div><p>STRENGTH / DISCIPLINE / CONFIDENCE</p><span>© ${new Date().getFullYear()} FSD. Pre-launch website prototype.</span></div>
    <a href="#home">BACK TO TOP ↑</a></footer>
  <dialog id="product-dialog" aria-labelledby="product-title"><button id="close-dialog" aria-label="Close product details">✕</button><div id="dialog-body"></div></dialog>`;

initCatalogue();
document.querySelector('#gallery-search').addEventListener('input', event => {
  const query = event.target.value.toLowerCase().trim();
  let count = 0;
  document.querySelectorAll('[data-gallery-name]').forEach(element => {
    const matches = element.dataset.galleryName.includes(query);
    element.hidden = !matches;
    if (matches) count++;
  });
  document.querySelector('#gallery-count').textContent = `${count} designs`;
});
