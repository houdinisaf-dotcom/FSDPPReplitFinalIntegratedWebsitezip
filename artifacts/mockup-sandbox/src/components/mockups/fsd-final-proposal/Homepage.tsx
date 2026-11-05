import { useState } from 'react';
import './_group.css';
import '../../../../../../fsd-replit-site/src/standalone-navigation.css';
import '../../../../../../fsd-replit-site/src/showroom.css';
import '../../../../../../fsd-replit-site/src/homepage-phase3.css';
import approvedFsdHeaderLogo from '../../../../../../fsd-replit-site/brand-review/shield-refined-matte/assets/website-shield-lockup-defence.png';
import defaultShopFeature from '../../../../../../fsd-replit-site/public/fsd-assets/8ffe2fd45a06.webp';
import { ASSET } from './_shared/ProposalShell';
// @ts-expect-error The source navigation model is JavaScript without a declaration file.
import { createNavigationModel, primaryNavigation } from '../../../../../../fsd-replit-site/src/site-navigation.js';

const shopModel = createNavigationModel({ includeDraftPreviews: import.meta.env.DEV })
  .find((menu: any) => menu.id === 'collections') as any;
const defaultItemIndex = Math.max(0, shopModel.groups[0].items.findIndex(
  (item: any) => item.title === shopModel.defaultItemTitle,
));

const currentHomeOverrides = `
.ffp-current-home{--fsd-navigation-announcement-height:22px;--fsd-navigation-shell-height:62px;--fsd-navigation-stack-height:84px;min-height:100dvh;background:#090a0c;color:#f1eee7}
.ffp-current-home .announcement.fsd-announcement{position:relative;top:auto;z-index:61;height:22px;min-height:22px;padding:5px 12px;border-bottom:1px solid rgba(199,169,111,.18);background:#090a0c;color:#d2bd92;font-size:9px;line-height:11px;letter-spacing:.3em;text-align:center}
.ffp-current-home .fsd-navigation-shell{position:fixed;top:22px;right:0;left:0;z-index:60;width:100%;background:#090a0c}
.ffp-current-home .header.fsd-header{height:62px;justify-content:flex-start;gap:0;padding:0 24vw 0 52px;border-bottom:1px solid rgba(215,207,189,.12);background:#090a0c}
.ffp-current-home .header.fsd-header .fsd-brand-logo{width:86px;max-height:49px;object-fit:contain}
.ffp-current-home .header.fsd-header .fsd-brand{margin-right:80px}
.ffp-current-home .header.fsd-header .fsd-primary-nav{flex:0 0 auto;gap:17px;margin:0}
.ffp-current-home .fsd-primary-trigger{min-height:42px;font-size:9px;letter-spacing:.17em}
.ffp-current-home .fsd-header-note{margin-left:74px;font-size:6.5px;letter-spacing:.13em}
.ffp-current-home .header.fsd-header .fsd-search-trigger,.ffp-current-home .header.fsd-header .fsd-bag-toggle{min-height:36px;gap:6px;padding:0 4px;font-size:8px;letter-spacing:.12em}
.ffp-current-home .header.fsd-header .fsd-search-trigger{margin-left:3px}
.ffp-current-home .header.fsd-header .fsd-bag-toggle{min-width:69px;border:1px solid rgba(215,207,189,.22)}
.ffp-current-home .header.fsd-header .fsd-bag-toggle{margin-left:0}
.ffp-current-home .fsd-search-icon{width:15px;height:15px}
.ffp-current-home .fsd-boxing-bag-icon{width:13px;height:20px;color:#c8aa72}
.ffp-current-home .fsd-boxing-bag-icon__chain,.ffp-current-home .fsd-boxing-bag-icon__body,.ffp-current-home .fsd-boxing-bag-icon__seam,.ffp-current-home .fsd-boxing-bag-icon__highlight{stroke:currentColor;stroke-width:1.1}
.ffp-current-home .fsd-bag-count{display:grid;min-width:14px;height:14px;place-items:center;border-radius:50%;background:#292821;color:#d8d1bf;font-size:7px}
.ffp-current-home .ffp-current-search{display:inline-flex;align-items:center;gap:5px;color:#d8d4cb;text-decoration:none}
.ffp-current-home .ffp-current-search:hover{color:#e7cb98}
.ffp-current-home .fsd-navigation-spacer{height:62px}
.ffp-current-home .ffp-current-frame{position:relative;margin:14px 14px 0;overflow:hidden;border:1px solid rgba(229,219,199,.2);background:#090a0c}
.ffp-current-home .fsd-phase3-hero{min-height:clamp(680px,calc(100svh - 30px),900px)}
.ffp-current-home .fsd-phase3-hero .fsd-home-hero__content{position:absolute;top:52px;left:57px;width:calc(100% - 114px);margin:0;padding:0}
.ffp-current-home .fsd-phase3-hero .fsd-home-kicker{font-size:8px;letter-spacing:.21em}
.ffp-current-home .fsd-phase3-hero .fsd-home-kicker span{width:27px}
.ffp-current-home .fsd-phase3-hero h1{max-width:650px;margin:29px 0 19px;font-size:clamp(64px,6.6vw,84px);line-height:.9;letter-spacing:-.085em}
.ffp-current-home .fsd-phase3-hero .fsd-home-intro{font-size:12px;line-height:1.8}
.ffp-current-home .fsd-phase3-hero .fsd-home-actions{margin-top:31px}
.ffp-current-home .fsd-phase3-hero .fsd-home-primary{min-height:42px;gap:16px;padding:0 14px;font-size:8px;letter-spacing:.12em}
.ffp-current-home .fsd-phase3-hero .fsd-home-signoff{margin-top:46px;font-size:7px;letter-spacing:.2em}
.ffp-current-home .fsd-phase3-hero__frame-line{right:27.2%}
.ffp-current-home .fsd-phase3-hero__frame-mark{right:calc(27.2% - 3px)}
.ffp-current-home .fsd-current-menu{max-height:min(580px,calc(100dvh - 84px))}
.ffp-current-home .fsd-current-menu .fsd-mega-inner{padding-top:22px;padding-bottom:22px}
.ffp-current-home .fsd-current-menu .fsd-mega-heading{min-height:51px;margin-bottom:12px}
.ffp-current-home .fsd-current-menu .fsd-nav-columns{min-height:225px}
.ffp-current-home .fsd-current-menu .fsd-feature-card{min-height:218px}
.ffp-current-home .fsd-current-menu .fsd-feature-media{min-height:218px}
.ffp-current-home .fsd-current-menu .fsd-feature-cta{cursor:pointer}
.ffp-current-home .fsd-current-menu .fsd-feature-cta:disabled{cursor:not-allowed}
.ffp-current-home .ffp-current-header-notice{position:absolute;right:18px;top:calc(100% + 8px);z-index:3;padding:8px 12px;border:1px solid rgba(200,170,114,.3);background:#0d0e10;color:#c5c2bb;font-size:9px}
@media(max-width:1100px){.ffp-current-home .fsd-header-note{display:none}.ffp-current-home .header.fsd-header{padding-inline:25px}}
@media(max-width:900px){.ffp-current-home .fsd-navigation-shell{top:22px}.ffp-current-home .header.fsd-header{height:62px}.ffp-current-home .fsd-navigation-spacer{height:62px}}
@media(max-width:760px){.ffp-current-home .ffp-current-frame{margin:10px 10px 0}.ffp-current-home .fsd-phase3-hero{min-height:clamp(590px,calc(100svh - 94px),820px)}.ffp-current-home .fsd-phase3-hero .fsd-home-hero__content{top:auto;bottom:86px;left:21px;width:calc(100% - 42px);margin:0}.ffp-current-home .fsd-phase3-hero h1{font-size:clamp(45px,11vw,68px)}.ffp-current-home .fsd-phase3-hero .fsd-home-signoff{margin-top:34px}}
`;

type ShopMenuItem = {
  title: string;
  kind?: string;
  description?: string;
  href?: string;
  featureImageSrc?: string;
  featureImageAlt?: string;
  record?: { colourways?: string[]; audiences?: string[]; audience?: string };
  source?: { colourways?: string[]; audiences?: string[] };
  sourceGroup?: { colourways?: string[]; audiences?: string[] };
};

function SearchIcon() {
  return <svg className="fsd-icon fsd-search-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>;
}

function ArrowIcon() {
  return <svg className="fsd-icon fsd-nav-arrow-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7" /><path d="M8 7h9v9" /></svg>;
}

function CurrentFsdHeader({
  shopOpen,
  onShopToggle,
  onUnavailableAction,
  onCloseMenu,
  activeGroupIndex,
  setActiveGroupIndex,
  activeItemIndex,
  setActiveItemIndex,
}: {
  shopOpen: boolean;
  onShopToggle: () => void;
  onUnavailableAction: () => void;
  onCloseMenu: () => void;
  activeGroupIndex: number;
  setActiveGroupIndex: (index: number) => void;
  activeItemIndex: number;
  setActiveItemIndex: (index: number) => void;
}) {
  const group = shopModel.groups[activeGroupIndex];
  const item: ShopMenuItem = group?.items?.[activeItemIndex] || group?.items?.[0];
  const featureImageIsMapped = item?.featureImageSrc === '/fsd-assets/8ffe2fd45a06.webp';
  const colourways = item?.record?.colourways || item?.source?.colourways || item?.sourceGroup?.colourways;
  const audiences = item?.record?.audiences || item?.record?.audience || item?.source?.audiences || item?.sourceGroup?.audiences;
  const description = item?.description || group?.description || '';
  const actionLabel = item?.kind === 'category' ? 'VIEW CATEGORY'
    : item?.kind === 'shop-all' ? 'SHOP ALL PRODUCTS'
      : item?.kind === 'clothing-lines' ? 'BROWSE ALL CLOTHING LINES'
        : item?.kind === 'clothing-line' ? 'VIEW THIS LINE'
          : item?.kind === 'product' ? 'VIEW DETAILS'
            : item?.kind === 'concept' ? 'EXPLORE COLLECTION'
              : item?.kind === 'subcategory' ? 'VIEW COLLECTION'
                : 'EXPLORE COLLECTION';

  return (
    <>
      <div className="announcement fsd-announcement">FSD / THE HOUSE OF PERFORMANCE <span>·</span> INVESTOR RELATIONS</div>
      <div className={`fsd-navigation-shell ${shopOpen ? 'is-open' : ''}`} data-navigation-shell>
        <header className="header fsd-header">
          <a className="brand fsd-brand" href="/__mockup/preview/fsd-final-proposal/Homepage" aria-label="FSD Home">
            <img className="fsd-brand-logo" src={approvedFsdHeaderLogo} alt="" aria-hidden="true" />
          </a>
          <nav className="fsd-primary-nav" aria-label="Main navigation">
            {primaryNavigation.map((entry: { id: string; label: string }) => entry.id === 'collections'
              ? <button key={entry.id} type="button" className={`fsd-primary-trigger${shopOpen ? ' is-active' : ''}`} data-nav-primary={entry.id} aria-controls="fsd-mega-menu" aria-expanded={shopOpen} onClick={onShopToggle}>{entry.label}</button>
              : <button key={entry.id} type="button" className="fsd-primary-trigger" onClick={onUnavailableAction}>{entry.label}</button>)}
          </nav>
          <span className="fsd-header-note">UNITED KINGDOM <i aria-hidden="true">·</i> FSD</span>
          <a className="fsd-search-trigger ffp-current-search" href="/__mockup/preview/fsd-final-proposal/SearchQuickView" aria-label="Search products">
            <SearchIcon /><span>SEARCH</span>
          </a>
          <button type="button" className="fsd-bag-toggle" aria-label="Open bag, 0 items" onClick={onUnavailableAction}>
            <svg className="fsd-boxing-bag-icon" viewBox="4 0 16 24" aria-hidden="true" fill="none">
              <path className="fsd-boxing-bag-icon__chain" d="M12 1.7v2.4m-2.1 0h4.2" />
              <path className="fsd-boxing-bag-icon__body" d="M9.15 5.05h5.7l1.5 2.15v9.2a2.85 2.85 0 0 1-2.85 2.85h-3a2.85 2.85 0 0 1-2.85-2.85V7.2l1.5-2.15Z" />
              <path className="fsd-boxing-bag-icon__seam" d="M7.65 9.1h8.7m-8.7 5.3h8.7" />
              <path className="fsd-boxing-bag-icon__highlight" d="M9.35 7.7v8.8" />
            </svg>
            <span>BAG</span><span className="fsd-bag-count">0</span>
          </button>
          <button type="button" className="fsd-mobile-toggle" aria-controls="fsd-mega-menu" aria-expanded={shopOpen} aria-label={shopOpen ? 'Close navigation' : 'Open navigation'} onClick={onShopToggle}>
            <span>MENU</span><i aria-hidden="true" /><i aria-hidden="true" />
          </button>
        </header>
        {shopOpen && (
          <section className="fsd-mega-menu mega-menu fsd-glass-surface fsd-current-menu" id="fsd-mega-menu" data-primary="collections" data-step="desktop" aria-label="SHOP navigation">
            <div className="fsd-mega-inner">
              <div className="fsd-mega-heading menu-header-bar">
                <div><p className="fsd-mega-eyebrow">SHOP <span>/</span> DIVISIONS</p><h2>SHOP</h2></div>
                <button type="button" className="fsd-mega-close close-menu" aria-label="Close navigation" onClick={onCloseMenu}>CLOSE <svg className="fsd-icon fsd-mega-close-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="m18 6-12 12" /><path d="M6 6l12 12" /></svg></button>
              </div>
              <div className="fsd-nav-columns menu-grid">
                <section className="fsd-nav-column fsd-nav-column--groups menu-column" aria-labelledby="fsd-current-group-heading">
                  <h3 className="menu-column-title" id="fsd-current-group-heading">COLLECTION GROUPS</h3>
                  <ul className="fsd-nav-list menu-item-list" aria-label="Collection groups">
                    {shopModel.groups.map((entry: { title: string }, index: number) => (
                      <li key={entry.title}><button type="button" className={`fsd-nav-option fsd-nav-group${index === activeGroupIndex ? ' is-active' : ''}`} aria-pressed={index === activeGroupIndex} onClick={() => { setActiveGroupIndex(index); setActiveItemIndex(0); }}>
                        <span className="fsd-nav-index">{String(index + 1).padStart(2, '0')}</span><span>{entry.title}</span><span className="fsd-nav-arrow" aria-hidden="true"><ArrowIcon /></span>
                      </button></li>
                    ))}
                  </ul>
                </section>
                <section className="fsd-nav-column fsd-nav-column--items menu-column" aria-labelledby="fsd-current-subcategory-heading">
                  <h3 className="menu-column-title" id="fsd-current-subcategory-heading">SUBCATEGORIES</h3>
                  <ul className="fsd-nav-list menu-item-list" aria-label="Subcategories">
                    {group?.items?.map((entry: ShopMenuItem, index: number) => (
                      <li key={`${entry.title}-${index}`}><button type="button" className={`fsd-nav-option fsd-nav-item${index === activeItemIndex ? ' is-active' : ''}`} aria-pressed={index === activeItemIndex} onClick={() => setActiveItemIndex(index)}>
                        <span className="fsd-nav-index">{String(index + 1).padStart(2, '0')}</span><span>{entry.title}</span><span className="fsd-nav-arrow" aria-hidden="true"><ArrowIcon /></span>
                      </button></li>
                    ))}
                  </ul>
                </section>
                <section className="fsd-nav-column fsd-nav-column--feature menu-column" aria-label="Featured collection">
                  {item && <article className="fsd-feature-card feature-card">
                    <div className="fsd-feature-media fsd-feature-media--1">
                      {featureImageIsMapped
                        ? <img src={defaultShopFeature} alt={item.featureImageAlt || item.title} />
                        : <div className="fsd-feature-media--unmapped"><span className="fsd-feature-placeholder-kicker">FSD / COLLECTION FEATURE</span><strong>{item.title}</strong><small>{description}</small></div>}
                    </div>
                    <div className="fsd-feature-copy">
                      <p className="fsd-feature-kicker">{featureImageIsMapped ? 'FSD / SELECTED RECORD' : 'FSD / COLLECTION FEATURE'}</p>
                      <h3>{item.title}</h3><p>{description}</p>
                      <dl className="fsd-feature-metadata" aria-label="Selected item details">
                        <div><dt>Colourways</dt><dd>{colourways?.join(' / ') || '—'}</dd></div>
                        <div><dt>Audience</dt><dd>{Array.isArray(audiences) ? audiences.join(' / ') : audiences || '—'}</dd></div>
                      </dl>
                      <button type="button" className="fsd-feature-cta feature-btn" onClick={onCloseMenu}>{actionLabel}<span aria-hidden="true"><ArrowIcon /></span></button>
                    </div>
                  </article>}
                </section>
              </div>
              <div className="fsd-nav-catalogue"><span>Looking for something specific?</span><a href="/#products">Browse the full catalogue <ArrowIcon /></a></div>
            </div>
          </section>
        )}
      </div>
      <div className="fsd-navigation-spacer" aria-hidden="true" />
    </>
  );
}

export function FsdCurrentHome({ initialShopOpen = false }: { initialShopOpen?: boolean }) {
  const [shopOpen, setShopOpen] = useState(initialShopOpen);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [activeItemIndex, setActiveItemIndex] = useState(defaultItemIndex);
  const [notice, setNotice] = useState('');
  const announceUnavailable = () => setNotice('This proof documents the current FSD homepage and SHOP menu.');

  return (
    <main className="ffp-page ffp-current-home">
      <style>{currentHomeOverrides}</style>
      <CurrentFsdHeader
        shopOpen={shopOpen}
        onShopToggle={() => setShopOpen(!shopOpen)}
        onUnavailableAction={announceUnavailable}
        onCloseMenu={() => setShopOpen(false)}
        activeGroupIndex={activeGroupIndex}
        setActiveGroupIndex={setActiveGroupIndex}
        activeItemIndex={activeItemIndex}
        setActiveItemIndex={setActiveItemIndex}
      />
      {notice && <p className="ffp-current-header-notice" role="status">{notice}</p>}
      <div className="ffp-current-frame">
        <section className="fsd-home-hero fsd-phase3-hero" aria-label="FSD homepage hero">
          <div className="fsd-home-hero__image" aria-hidden="true" style={{ backgroundImage: 'none' }}>
            <img className="fsd-home-hero__asset" src={`${ASSET}fsd-home-hero.webp`} alt="" />
          </div>
          <div className="fsd-home-hero__shade" aria-hidden="true" />
          <div className="fsd-phase3-hero__frame" aria-hidden="true"><span className="fsd-phase3-hero__frame-line" /><span className="fsd-phase3-hero__frame-mark" /></div>
          <div className="fsd-home-hero__content">
            <p className="fsd-home-kicker"><span /> 01 / PERFORMANCE / DISCIPLINE / IDENTITY</p>
            <h1>Made to Move,<br /><em>Made to Belong.</em></h1>
            <p className="fsd-home-intro">Fitness &amp; Self-Defence.<br />A house for those who train with purpose.</p>
            <div className="fsd-home-actions"><a className="fsd-home-primary" href="#universe">Explore the collections <span aria-hidden="true">↗</span></a></div>
            <p className="fsd-home-signoff">FSD <span>/</span> FITNESS &amp; SELF-DEFENCE</p>
          </div>
        </section>
      </div>
    </main>
  );
}

export function Homepage() {
  return <FsdCurrentHome />;
}
