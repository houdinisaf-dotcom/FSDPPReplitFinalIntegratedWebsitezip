import { useState } from 'react';
import './PDPReferencePriority.css';

const logo = '/__mockup/images/fsd-house/approved-header-logo.png';
const productMedia = '/__mockup/images/fsd-final-proposal/';
const frontPhoto = `${productMedia}aeroforge-white-green-front-product.webp`;
const rearPhoto = `${productMedia}aeroforge-white-green-rear-product.webp`;
const colourways = ['White / Green', 'All Black', 'Black / Grey', 'Sage / Black', 'Charcoal / Orange', 'Navy / Blue'];
const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
const colourwayFronts: Record<string, string> = {
  'All Black': `${productMedia}aeroforge-all-black-front.webp`,
  'Black / Grey': `${productMedia}aeroforge-black-grey-front.webp`,
  'Sage / Black': `${productMedia}aeroforge-sage-black-front.webp`,
  'Charcoal / Orange': `${productMedia}aeroforge-charcoal-orange-front.webp`,
  'Navy / Blue': `${productMedia}aeroforge-navy-blue-front.webp`,
};

const navItems = ['SHOP', 'UNIVERSE', 'BIO-LAB™', 'HARDWARE', 'THE HOUSE', 'PRIVATE ACCESS'];

export function PDPReferencePriority() {
  const [colour, setColour] = useState(colourways[0]);
  const [size, setSize] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [zoomedPhoto, setZoomedPhoto] = useState('');
  const activePhoto = colour === 'White / Green' ? frontPhoto : colourwayFronts[colour];
  const photos = colour === 'White / Green'
    ? [{ src: frontPhoto, label: 'FRONT VIEW', alt: 'front product view' }, { src: rearPhoto, label: 'REAR VIEW', alt: 'rear product view' }]
    : [{ src: activePhoto, label: 'FRONT VIEW', alt: 'front product view' }];

  return (
    <main className="pdp-ref">
      <header className="pdp-ref__header">
        <a className="pdp-ref__brand" href="#product" aria-label="FSD — Fitness & Self-Defence">
          <img src={logo} alt="FSD — Fitness & Self-Defence" />
        </a>
        <nav className="pdp-ref__nav" aria-label="Primary navigation">
          {navItems.map((item) => <a href="#product" key={item}>{item}</a>)}
        </nav>
        <button
          className="pdp-ref__menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="pdp-ref-mobile-nav"
          onClick={() => setMenuOpen((value) => !value)}
        >
          {menuOpen ? 'CLOSE' : 'MENU'}
        </button>
        <div className="pdp-ref__header-mark">FITNESS &amp; SELF-DEFENCE</div>
        {menuOpen && (
          <nav className="pdp-ref__mobile-nav" id="pdp-ref-mobile-nav" aria-label="Mobile navigation">
            {navItems.map((item) => <a href="#product" key={item} onClick={() => setMenuOpen(false)}>{item}</a>)}
          </nav>
        )}
      </header>

      <div className="pdp-ref__crumbs" aria-label="Breadcrumb">
        <span>SHOP</span><i>/</i><span>MEN’S PERFORMANCE &amp; TRAINING</span><i>/</i><span>AEROFORGE</span>
      </div>

      <section className="pdp-ref__product" id="product">
        <div className={`pdp-ref__gallery${photos.length === 1 ? ' pdp-ref__gallery--single' : ''}`} aria-label={`FSD Aeroforge Training Tee, ${colour}, product views`}>
          {photos.map((photo, index) => (
            <figure className="pdp-ref__photo" key={photo.src}>
              <button type="button" onClick={() => setZoomedPhoto(photo.src)} aria-label={`Enlarge ${photo.label.toLowerCase()} product photo`}>
                <img src={photo.src} alt={`FSD Aeroforge Training Tee in ${colour} — ${photo.alt}`} />
              </button>
              <figcaption><span>{String(index + 1).padStart(2, '0')}</span> {photo.label} <span className="pdp-ref__caption-colour">{colour.toUpperCase()}</span></figcaption>
            </figure>
          ))}
        </div>

        <aside className="pdp-ref__purchase" aria-labelledby="pdp-ref-title">
          <p className="pdp-ref__eyebrow"><span /> AEROFORGE / TRAINING</p>
          <h1 id="pdp-ref-title">FSD Aeroforge<br className="pdp-ref__desktop-break" /> Training Tee</h1>
          <div className="pdp-ref__price-row"><p className="pdp-ref__price">£39.99</p><span>FSD-AF-T01</span></div>
          <p className="pdp-ref__description">Engineered for high-output performance and elite combat training. Built with advanced micro-perforated structural knit and targeted ventilation.</p>

          <fieldset className="pdp-ref__selector">
            <legend>Colour <span>{colour}</span></legend>
            <div className="pdp-ref__colour-options">
              {colourways.map((item) => (
                <button key={item} type="button" aria-pressed={colour === item} onClick={() => setColour(item)}>
                  {item}
                </button>
              ))}
            </div>
            <p className="pdp-ref__selection-note" aria-live="polite">
              {colour === 'White / Green'
                ? 'Front and rear product views shown.'
                : `${colour} selected. Only a single front product view is mapped for this colourway.`}
            </p>
          </fieldset>

          <fieldset className="pdp-ref__selector pdp-ref__selector--sizes">
            <legend>Size <span>{size || 'Select a size'}</span></legend>
            <div className="pdp-ref__size-options">
              {sizes.map((item) => (
                <button key={item} type="button" aria-pressed={size === item} onClick={() => setSize(item)}>{item}</button>
              ))}
            </div>
            <details className="pdp-ref__size-guide">
              <summary>Size guide</summary>
              <p>Product-specific measurements are not available.</p>
            </details>
          </fieldset>

          <button className="pdp-ref__add" type="button" disabled aria-disabled="true">ADD TO BAG</button>
          <p className="pdp-ref__disabled-note" role="status">Checkout is currently disabled. This proposal does not add items to a bag or submit an order.</p>
          <div className="pdp-ref__accordions">
            <details>
              <summary>Product description</summary>
              <p>Engineered for high-output performance and elite combat training. Built with advanced micro-perforated structural knit and targeted ventilation.</p>
            </details>
            <details>
              <summary>Fabric &amp; care</summary>
              <p>88% Recycled Technical Polyester; 12% Elastane Poly-Blend. 180 GSM.</p>
              <ul>
                <li>Machine wash cold at 30°C</li>
                <li>Do not tumble dry</li>
                <li>Do not iron directly on graphics</li>
              </ul>
            </details>
            <details>
              <summary>Available sizes</summary>
              <p>S, M, L, XL, XXL</p>
            </details>
          </div>
        </aside>
      </section>

      <footer className="pdp-ref__footer">
        <span>FSD / FITNESS &amp; SELF-DEFENCE</span>
        <span>PRODUCT 18 <b>·</b> AEROFORGE</span>
      </footer>

      <div className="pdp-ref__sticky">
        <span><strong>£39.99</strong><i>·</i>{size || 'Select size'}</span>
        <button type="button" disabled aria-disabled="true">ADD TO BAG</button>
      </div>

      {zoomedPhoto && (
          <div className="pdp-ref__lightbox" role="dialog" aria-modal="true" aria-label="Product photograph" onClick={() => setZoomedPhoto('')}>
          <button type="button" onClick={() => setZoomedPhoto('')} aria-label="Close enlarged photo">CLOSE</button>
          <img src={zoomedPhoto} alt={`FSD Aeroforge Training Tee in ${colour} — product view`} />
        </div>
      )}
    </main>
  );
}
