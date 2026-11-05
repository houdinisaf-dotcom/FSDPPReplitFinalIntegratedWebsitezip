import { useState } from 'react';
import './_group.css';
import { ProposalHeader, teeFront, teeRear } from './_shared/ProposalShell';

const options = ['White / Green', 'All Black', 'Black / Grey', 'Sage / Black', 'Charcoal / Orange', 'Navy / Blue'];
export function MobilePDP() {
  const [size, setSize] = useState('');
  const [colour, setColour] = useState(options[0]);
  return <main className="ffp-page ffp-mobile-pdp">
    <ProposalHeader />
    <p className="ffp-breadcrumb ffp-mobile-pdp__crumb">FSD <span>/</span> WOMEN <span>/</span> AEROFORGE <span>/</span> TEE</p>
    <div className="ffp-mobile-pdp__gallery"><img src={teeFront} alt="Aeroforge Training Tee, White / Green — front view" /><img src={teeRear} alt="Aeroforge Training Tee, White / Green — back view" /></div>
    <section className="ffp-mobile-pdp__content">
      <p className="ffp-overline">AEROFORGE / TRAINING</p><h1>FSD Aeroforge Training Tee</h1><p className="ffp-pdp__price">£39.99</p>
      <p className="ffp-pdp__summary">Engineered for high-output performance and elite combat training. Built with advanced micro-perforated structural knit and targeted ventilation.</p>
      <fieldset className="ffp-selector"><legend>COLOUR — {colour}</legend><div className="ffp-selector__swatches">{options.map((item, i) => <button key={item} className={`ffp-swatch ffp-swatch--${['green','black','grey','sage','orange','navy'][i]}`} type="button" aria-label={item} title={item} aria-pressed={colour === item} onClick={() => setColour(item)} />)}</div><p className="ffp-selector__selected">{colour}</p></fieldset>
      <fieldset className="ffp-selector"><legend>SIZE {size && `— ${size}`}</legend><div className="ffp-sizes">{['S','M','L','XL','XXL'].map((item) => <button type="button" key={item} aria-pressed={size === item} onClick={() => setSize(item)}>{item}</button>)}</div><button className="ffp-size-guide" type="button" onClick={(e) => { const node = e.currentTarget.nextElementSibling; if (node instanceof HTMLElement) node.hidden = !node.hidden; }}>Size guide</button><p hidden className="ffp-selector__selected">Product-specific measurements are not available in this proposal.</p></fieldset>
      <p className="ffp-demo-note">Mockup only. Bag and checkout actions are disabled.</p>
      <div className="ffp-accordions"><details><summary>Product details</summary><p>Engineered for high-output performance and elite combat training. Built with advanced micro-perforated structural knit and targeted ventilation.</p></details><details><summary>Fabric &amp; care</summary><p>88% Recycled Technical Polyester; 12% Elastane Poly-Blend. 180 GSM. Machine wash cold at 30°C. Do not tumble dry. Do not iron directly on graphics.</p></details><details><summary>Fit &amp; sizing</summary><p>Sizes S–XXL.</p></details></div>
    </section>
    <div className="ffp-mobile-pdp__sticky"><strong>£39.99 {size ? `· ${size}` : '· Select size'}</strong><button type="button" disabled>ADD TO BAG</button></div>
  </main>;
}
