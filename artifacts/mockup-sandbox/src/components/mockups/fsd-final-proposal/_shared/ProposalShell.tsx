import { useState } from 'react';

export const ASSET = '/__mockup/images/fsd-final-proposal/';
export const teeFront = `${ASSET}aeroforge-white-green-front-product.webp`;
export const teeRear = `${ASSET}aeroforge-white-green-rear-product.webp`;

export function ProposalHeader({ light = false }: { light?: boolean }) {
  const [open, setOpen] = useState(false);
  const links = ['SHOP', 'UNIVERSE', 'BIO-LAB™', 'HARDWARE', 'THE HOUSE', 'PRIVATE ACCESS'];
  return (
    <header className={`ffp-header ${light ? 'ffp-header--light' : ''}`}>
      <a className="ffp-logo" href="/__mockup/preview/fsd-final-proposal/Homepage" aria-label="FSD home">
        <img src={`${ASSET}approved-shield.png`} alt="FSD Fitness & Self-Defence shield" />
      </a>
      <nav className="ffp-nav" aria-label="Primary navigation">
        {links.map((label) => <a key={label} href={label === 'SHOP' ? '#shop' : label === 'THE HOUSE' ? '#the-house' : '#'}>{label}</a>)}
      </nav>
      <div className="ffp-tools"><a href="/__mockup/preview/fsd-final-proposal/SearchQuickView">SEARCH <span>⌕</span></a><a href="#bag">BAG (0)</a></div>
      <button className="ffp-menu-toggle" type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? 'Close navigation' : 'Open navigation'}>{open ? 'CLOSE ×' : 'MENU +'}</button>
      {open && <nav className="ffp-mobile-menu" aria-label="Mobile navigation">{links.map((label) => <a key={label} href={label === 'SHOP' ? '/__mockup/preview/fsd-final-proposal/ShopMenu' : label === 'THE HOUSE' ? '/__mockup/preview/fsd-final-proposal/House' : '#'} onClick={() => setOpen(false)}>{label}<span>↗</span></a>)}<a href="/__mockup/preview/fsd-final-proposal/SearchQuickView" onClick={() => setOpen(false)}>SEARCH<span>⌕</span></a></nav>}
    </header>
  );
}

export function Breadcrumb({ children }: { children: string }) {
  return <p className="ffp-breadcrumb">FSD <span>/</span> {children}</p>;
}

export function AssetPending({ title }: { title: string }) {
  return <div className="ffp-pending" role="img" aria-label={`${title} [ASSET PENDING]`}><span>FSD / PRODUCT MEDIA</span><strong>{title}</strong><small>[ASSET PENDING]</small></div>;
}

export function ProposalFooter() {
  return <footer className="ffp-mini-footer"><img src={`${ASSET}approved-shield.png`} alt="FSD shield" /><span>FITNESS &amp; SELF-DEFENCE</span><a href="#top">BACK TO TOP ↑</a></footer>;
}
