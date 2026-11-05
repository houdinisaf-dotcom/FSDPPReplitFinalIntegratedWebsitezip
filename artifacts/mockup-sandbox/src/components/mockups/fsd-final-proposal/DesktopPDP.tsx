import { useState } from 'react';
import './_group.css';
import { Breadcrumb, ProposalHeader, teeFront, teeRear } from './_shared/ProposalShell';

const colourways = [
  ['White / Green', 'green'], ['All Black', 'black'], ['Black / Grey', 'grey'],
  ['Sage / Black', 'sage'], ['Charcoal / Orange', 'orange'], ['Navy / Blue', 'navy'],
];
const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
const features = [
  'Targeted Ventilation: Ergonomic dot-matrix gradient mesh paneling mapped across the shoulders and side body for high-output airflow and heat dissipation.',
  'Geometric Weave Body: Advanced micro-perforated structural knit engineered for moisture-wicking and quick-dry performance.',
  'Ergonomic Raglan Construction: Designed for unrestricted mobility during heavy lifting, combat training, and dynamic movement.',
  'Branding & Details: High-definition heat-pressed neon FSD chest logo, structured inner collar ribbing, and a custom woven FSD Aeroforge size/branding label.',
];
export function DesktopPDP() {
  const [colour, setColour] = useState('White / Green');
  const [size, setSize] = useState('');
  return <main className="ffp-page">
    <div className="ffp-desktop-only-header"><ProposalHeader /></div>
    <section className="ffp-pdp">
      <div className="ffp-pdp__layout">
        <div className="ffp-pdp__gallery" aria-label="Aeroforge Training Tee, White / Green, front and rear product views">
          <figure><img src={teeFront} alt="FSD Aeroforge Training Tee — White / Green — front product view" /><figcaption>01 / FRONT · WHITE / GREEN</figcaption></figure>
          <figure><img src={teeRear} alt="FSD Aeroforge Training Tee — White / Green — rear product view" /><figcaption>02 / REAR · WHITE / GREEN</figcaption></figure>
        </div>
        <aside className="ffp-pdp__panel">
          <Breadcrumb>WOMEN / AEROFORGE</Breadcrumb>
          <h1>FSD Aeroforge Training Tee</h1><p className="ffp-pdp__price">£39.99</p>
          <p className="ffp-pdp__summary">Engineered for high-output performance and elite combat training. Built with advanced micro-perforated structural knit and targeted ventilation.</p>
          <fieldset className="ffp-selector"><legend>COLOUR — {colour.toUpperCase()}</legend><div className="ffp-selector__swatches">{colourways.map(([name, cls]) => <button key={name} className={`ffp-swatch ffp-swatch--${cls}`} type="button" title={name} aria-label={name} aria-pressed={colour === name} onClick={() => setColour(name)} />)}</div><p className="ffp-selector__selected">{colour}</p></fieldset>
          <fieldset className="ffp-selector"><legend>SIZE {size && `— ${size}`}</legend><div className="ffp-sizes">{sizes.map((item) => <button type="button" key={item} aria-pressed={size === item} onClick={() => setSize(item)}>{item}</button>)}</div><button type="button" className="ffp-size-guide" onClick={(e) => { const node = e.currentTarget.nextElementSibling; if (node instanceof HTMLElement) node.hidden = !node.hidden; }}>Size guide</button><p hidden className="ffp-selector__selected">Product-specific measurements are not available in this proposal.</p></fieldset>
          <button className="ffp-add" disabled type="button">ADD TO BAG</button>
          <p className="ffp-demo-note">{size ? `Selected size ${size}.` : 'Choose a size to continue.'} Mockup only; bag and checkout actions are disabled.</p>
          <div className="ffp-accordions">
            <details><summary>Product details</summary><ul>{features.map((f) => <li key={f}>{f}</li>)}</ul></details>
            <details><summary>Fabric &amp; care</summary><p>88% Recycled Technical Polyester; 12% Elastane Poly-Blend. 180 GSM. Machine wash cold at 30°C. Do not tumble dry. Do not iron directly on graphics.</p></details>
            <details><summary>Fit &amp; sizing</summary><p>Sizes: S, M, L, XL, XXL. Ergonomic raglan construction.</p></details>
          </div>
        </aside>
        <div className="ffp-pdp__details"><h2>FSD / AEROFORGE</h2><p>FSD-AF-T01</p><p>Current approved media is mapped only to the White / Green colourway. Selecting another swatch changes the label only; no unconfirmed gallery is implied.</p></div>
      </div>
    </section>
  </main>;
}
