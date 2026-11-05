import { useMemo, useState } from 'react';
import './_group.css';
import { ASSET, ProposalHeader, teeFront, teeRear } from './_shared/ProposalShell';

const catalogue = [
  { name: 'FSD Aeroforge Training Tee', type: 'PRODUCT · MEN’S PERFORMANCE AND TRAINING', href: '/?product=18#products', image: teeFront, price: '£39.99' },
  { name: 'FSD Aeroforge Hybrid Short', type: 'PRODUCT · MEN’S PERFORMANCE AND TRAINING', href: '/?product=19#products', image: `${ASSET}aeroforge-hybrid-short-black-green-lifestyle.webp`, price: '£44.99' },
  { name: 'FSD Aeroforge Tech Set (Zip Hoodie & Joggers)', type: 'PRODUCT · TRAINING SETS', href: '/?product=26#products', image: `${ASSET}aeroforge-tech-set-black-green-front.webp`, price: '£119.99' },
  { name: 'Brand Story', type: 'THE HOUSE / EDITORIAL', href: '/story' },
];
export function SearchQuickView() {
  const [query, setQuery] = useState('Aeroforge');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColour, setSelectedColour] = useState('White / Green');
  const [open, setOpen] = useState(true);
  const results = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('en-GB');
    return term ? catalogue.filter((p) => `${p.name} ${p.type}`.toLocaleLowerCase('en-GB').includes(term)) : [];
  }, [query]);
  return <main className="ffp-page">
    <ProposalHeader />
    <section className="ffp-search-screen">
      <div className="ffp-search-grid">
        <section className="ffp-search-box" id="search"><p className="ffp-overline">FSD / PRODUCT SEARCH</p><h1>Search the FSD house.</h1>
          <label className="ffp-search-input"><input aria-label="Search products, collections, and pages" placeholder="TYPE A PRODUCT OR CATEGORY..." value={query} onChange={(e) => setQuery(e.target.value)} /><button type="button" aria-label="Clear search" onClick={() => setQuery('')}>×</button></label>
          <p className="ffp-search-meta" aria-live="polite">{query.trim() ? `${results.length} matching catalogue destinations` : 'Search products, collections, and the FSD story.'}</p>
          {query.trim() && results.length === 0 && <p className="ffp-search-meta">No matching products or collections.</p>}
          {results.length > 0 && <ul className="ffp-search-results">{results.map((item) => <li key={item.name}><a href={item.href}><span className={item.image ? '' : 'ffp-search-thumb'}>{item.image ? <img src={item.image} alt="" /> : 'FSD'}</span><span><small>{item.type}</small><strong>{item.name}</strong></span><em>{item.price || '↗'}</em></a></li>)}</ul>}
        </section>
        <aside className="ffp-quick" aria-label="Quick View: FSD Aeroforge Training Tee">
          <div className="ffp-quick__head"><span>QUICK VIEW / PRODUCT 18</span><button type="button" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? '−' : '+'}</button></div>
          {open && <>
            <div className="ffp-quick__images"><img src={teeFront} alt="White / Green tee front product view" /><img src={teeRear} alt="White / Green tee rear product view" /></div>
            <h2>FSD Aeroforge Training Tee</h2><p className="ffp-quick__price">£39.99</p>
            <p className="ffp-pdp__summary">Engineered for high-output performance and elite combat training. Built with advanced micro-perforated structural knit and targeted ventilation.</p>
            <fieldset className="ffp-selector"><legend>COLOUR — {selectedColour.toUpperCase()}</legend><div className="ffp-selector__swatches">{[['White / Green','green'],['All Black','black'],['Black / Grey','grey'],['Sage / Black','sage'],['Charcoal / Orange','orange'],['Navy / Blue','navy']].map(([name, color]) => <button key={name} className={`ffp-swatch ffp-swatch--${color}`} type="button" aria-label={name} aria-pressed={selectedColour === name} onClick={() => setSelectedColour(name)} />)}</div><p className="ffp-selector__selected">{selectedColour}</p></fieldset>
            <fieldset className="ffp-selector"><legend>SIZE {selectedSize && `— ${selectedSize}`}</legend><div className="ffp-sizes">{['S','M','L','XL','XXL'].map((size) => <button key={size} type="button" aria-pressed={selectedSize === size} onClick={() => setSelectedSize(size)}>{size}</button>)}</div></fieldset>
            <div className="ffp-quick__links"><a href="/?product=18#products">VIEW FULL PRODUCT</a><button type="button" disabled>{selectedSize ? 'ADD TO BAG' : 'SELECT A SIZE'}</button></div><p className="ffp-demo-note">Preview state only. Checkout and bag submission are disabled.</p>
          </>}
        </aside>
      </div>
    </section>
  </main>;
}
