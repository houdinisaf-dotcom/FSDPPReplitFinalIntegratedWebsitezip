import { useState } from 'react';
import './_group.css';
import { AssetPending, ProposalHeader, teeFront } from './_shared/ProposalShell';

const products: { id: number; name: string; price: string; image?: string; alt?: string; imageKind?: string }[] = [
  { id: 18, name: 'FSD Aeroforge Training Tee', price: '£39.99', image: teeFront, alt: 'White / Green Aeroforge Training Tee — front product view', imageKind: 'studio' },
  { id: 38, name: 'FSD Aeroforge Women’s Performance Training Top (Short Sleeve)', price: '£39.99' },
  { id: 39, name: 'FSD Aeroforge Women’s Performance Top (Long Sleeve)', price: '£49.99' },
  { id: 51, name: 'FSD Aeroforge Modest Tunic & Jogger Set', price: '£89.99' },
];

export function WomensCollection() {
  const [active, setActive] = useState('ALL');
  const visible = products.filter((p) => active === 'ALL' || (active === 'WITH MAPPED IMAGERY' ? Boolean(p.image) : !p.image));
  return <main className="ffp-page">
    <ProposalHeader />
    <section className="ffp-collection">
      <div className="ffp-collection__intro"><div><p className="ffp-overline">WOMEN’S TECHNICAL PERFORMANCE</p><h1>AEROFORGE</h1></div><p>Engineered movement, brought into focus. Browse the existing women’s collection records.</p></div>
      <div className="ffp-collection__toolbar"><div className="ffp-collection__filters" aria-label="Collection filters">{['ALL', 'WITH MAPPED IMAGERY', 'ASSET PENDING'].map((filter) => <button key={filter} type="button" aria-pressed={active === filter} onClick={() => setActive(filter)}>{filter}</button>)}</div><span className="ffp-collection__count">{visible.length} PRODUCTS</span></div>
      <div className="ffp-products">{visible.map((product) => <article className="ffp-product-card" key={product.id}>
        <a className={`ffp-product-card__media ${product.image ? 'ffp-product-card__media--square' : ''}`} href={`/?product=${product.id}#products`} aria-label={`View ${product.name}`}>
          {product.image ? <img src={product.image} alt={product.alt} /> : <AssetPending title={product.name} />}
        </a>
        <div className="ffp-product-card__copy"><div><h2>{product.name}</h2>{product.image && <p>White / Green</p>}</div><span className="ffp-product-card__price">{product.price}</span></div>
      </article>)}</div>
      <p className="ffp-collection__asset-note">No AEROFORGE collection banner is mapped. Three product-image groups are missing; no other product photography is substituted.</p>
    </section>
  </main>;
}
