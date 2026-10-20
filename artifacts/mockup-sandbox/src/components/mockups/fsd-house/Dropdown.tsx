import { useEffect, useMemo, useRef, useState } from 'react';
import './Dropdown.css';

type NavKey = 'collections' | 'bio-lab' | 'hardware' | 'house' | 'private';
type Choice = { title: string; description: string; children?: Choice[]; image?: string };
type Menu = { key: NavKey; label: string; heading: string; choices: Choice[] };

const menus: Menu[] = [
  {
    key: 'collections', label: 'COLLECTIONS', heading: 'COLLECTIONS / DIVISIONS',
    choices: [
      {
        title: 'Men’s Luxury Performance',
        description: 'Technical apparel, heavyweight layers, combat shorts, walkout clothing and considered limited collections.',
        image: '/__mockup/images/fsd-house/mens-performance.webp',
        children: [
          { title: '500 GSM Hoodies & Tracksuits', description: 'A focused edit of heavyweight layers and training sets.' },
          { title: '2-in-1 Combat Training Shorts & Tanks', description: 'Training-led forms designed around combat movement.' },
          { title: 'Walkout Robes & Bomber Jackets', description: 'An outer-layer language for the walk to the arena.' },
          { title: 'Volcanic Amber Capsule', description: 'A limited collection concept within the FSD apparel division.' },
          { title: 'Vector Camo Capsule', description: 'A considered capsule built around the original Vector Camo name.' },
          { title: 'Men’s Performance and Training', description: 'Original catalogue category retained for FSD men’s apparel and training products.' },
          { title: 'Training Sets', description: 'Original catalogue category retained for FSD sets and coordinated training layers.' },
          { title: 'Combat and MMA', description: 'Original catalogue category retained for FSD combat apparel and equipment records.' },
          { title: 'Lifestyle', description: 'Original catalogue category retained for FSD lifestyle records.' },
        ],
      },
      {
        title: 'Women’s Modest Combat',
        description: 'Coverage-minded performance layers for training, combat and movement.',
        image: '/__mockup/images/fsd-house/womens-velocity-hijab.jpg',
        children: [
          { title: 'Performance Hijabs', description: 'Performance hijabs, including the approved Velocity visual direction.' },
          { title: 'Longline Tunics & Half-Zips', description: 'Longer coverage profiles with a training-first point of view.' },
          { title: 'Technical Tapered Combat Trackpants', description: 'A proposed tapered silhouette for full-coverage movement.' },
          { title: 'Full-Coverage Compression Base Layers', description: 'Layering concepts for coverage through the training session.' },
          { title: 'Women’s Performance', description: 'Original catalogue category retained for FSD women’s training apparel.' },
          { title: 'Modest Activewear', description: 'Original catalogue category retained for FSD modest performance apparel.' },
          { title: 'Sports Hijabs', description: 'Original catalogue category retained for FSD sports hijab records.' },
        ],
      },
      {
        title: 'Limited Collections',
        description: 'A considered home for limited-edition apparel concepts and seasonal capsules.',
        image: '/__mockup/images/fsd-house/mens-windrunner.webp',
        children: [
          { title: 'Volcanic Amber Capsule', description: 'A limited collection concept within the FSD apparel division.' },
          { title: 'Vector Camo Capsule', description: 'A considered capsule built around the original Vector Camo name.' },
        ],
      },
      {
        title: 'New & Featured Concepts',
        description: 'Selected directions from the FSD collection system, presented as pre-launch concepts.',
        image: '/__mockup/images/fsd-house/technical-hoodie-detail.webp',
        children: [
          { title: 'Men’s Luxury Performance', description: 'Technical apparel, heavyweight layers, combat shorts and walkout clothing.' },
          { title: 'Women’s Modest Combat', description: 'Coverage-minded performance layers for training, combat and movement.' },
        ],
      },
    ],
  },
  {
    key: 'bio-lab', label: 'BIO-LAB™', heading: 'BIO-LAB™ / CONCEPTS',
    choices: [
      { title: 'Smartwear', description: 'Smartwear concepts are presented as directions for exploration, not validated products.' },
      { title: 'Wearable Technology', description: 'An emerging FSD design field. Capabilities and specifications are not confirmed.' },
      { title: 'Recovery Innovation', description: 'Recovery-related ideas considered through the FSD performance lens.' },
      { title: 'Digital Integration', description: 'A proposed digital layer for future FSD experiences.' },
      { title: 'Smart Tech', description: 'Original catalogue category retained for FSD smart-technology records.' },
    ],
  },
  {
    key: 'hardware', label: 'HARDWARE', heading: 'HARDWARE / TRAINING',
    choices: [
      { title: 'Strength Equipment', description: 'Strength equipment concepts and original catalogue groups, with no equipment photography assigned here.' },
      { title: 'Combat Equipment', description: 'Combat equipment context shown through existing FSD boxing editorial imagery.' },
      { title: 'Training Accessories', description: 'Training accessory groups from the existing catalogue, presented without unapproved product imagery.' },
      { title: 'Recovery Equipment', description: 'Recovery equipment concepts remain unverified and are not presented as operational.' },
      { title: 'Gym Hardware and Accessories', description: 'Original catalogue category retained for FSD equipment and accessory records.' },
    ],
  },
  {
    key: 'house', label: 'THE HOUSE', heading: 'THE HOUSE / FSD',
    choices: [
      { title: 'Our Story', description: 'A British performance house shaped by discipline, identity and purposeful design.' },
      { title: 'Flagships', description: 'Dublin, Belfast, Manchester and Islamabad are proposed location concepts, not operating sites.' },
      { title: 'Fight Promotions', description: 'A proposed platform for fight culture, events and athlete development.' },
      { title: 'Global Vision', description: 'An international ambition grounded in the FSD house philosophy.' },
      { title: 'Investor Relations', description: 'Investor information requires approved content before it can be shared.' },
    ],
  },
  {
    key: 'private', label: 'PRIVATE ACCESS', heading: 'PRIVATE ACCESS / PRE-LAUNCH',
    choices: [
      { title: 'VIP Pre-Launch Registration', description: 'Registration is deferred. This preview does not collect or store contact details.' },
      { title: 'Collection Announcements', description: 'A future channel for collection updates; no release timing is promised.' },
      { title: 'Private Enquiries', description: 'A private enquiry destination is shown as a prototype only.' },
    ],
  },
];

const navKeys: NavKey[] = ['collections', 'bio-lab', 'hardware', 'house', 'private'];

function CollectionBanner({ audience, image, title, supporting, onActivate }: {
  audience: 'mens' | 'womens'; image: string; title: string; supporting: string; onActivate: (trigger: HTMLElement) => void;
}) {
  return (
    <button className="fd-banner" type="button" data-collection-banner={audience} onClick={(event) => onActivate(event.currentTarget)}>
      <img src={image} alt="" loading="lazy" />
      <span className="fd-banner-copy">
        <span className="fd-banner-label">FSD / COLLECTION {audience === 'mens' ? '01' : '02'}</span>
        <strong>{title}</strong>
        <span className="fd-banner-bottom">
          <span>{supporting}</span>
          <span className="fd-circle-arrow" aria-hidden="true">↗</span>
        </span>
      </span>
    </button>
  );
}

export function Dropdown() {
  const initialMenu = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('menu') === 'collections' ? 'collections' as NavKey : null;
  }, []);
  const [openMenu, setOpenMenu] = useState<NavKey | null>(initialMenu);
  const [activeChoice, setActiveChoice] = useState(0);
  const [activeLeaf, setActiveLeaf] = useState(0);
  const [destination, setDestination] = useState<{ menu: NavKey; parent: Choice; leaf: Choice } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const openMenuData = menus.find((menu) => menu.key === openMenu);
  const choice = openMenuData?.choices[activeChoice];
  const leaves = choice?.children ?? openMenuData?.choices ?? [];
  const selectedLeaf = choice?.children ? choice.children[activeLeaf] : openMenuData?.choices[activeChoice];

  const showMenu = (key: NavKey, trigger: HTMLElement, index = 0) => {
    triggerRef.current = trigger;
    setDestination(null);
    setActiveChoice(index);
    setActiveLeaf(0);
    setOpenMenu(key);
  };
  const closeMenu = () => {
    setOpenMenu(null);
    setActiveChoice(0);
    setActiveLeaf(0);
    requestAnimationFrame(() => {
      const fallback = headerRef.current?.querySelector<HTMLElement>(
        window.matchMedia('(max-width: 900px)').matches ? '.fd-menu-toggle' : '[data-nav-key="collections"]',
      );
      (triggerRef.current ?? fallback)?.focus({ preventScroll: true });
    });
  };
  const explore = () => {
    if (!openMenu || !choice || !selectedLeaf) return;
    setDestination({ menu: openMenu, parent: choice, leaf: selectedLeaf });
    setOpenMenu(null);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  };
  const openBanner = (audience: 'mens' | 'womens', trigger: HTMLElement) => {
    showMenu('collections', trigger, audience === 'mens' ? 0 : 1);
  };

  useEffect(() => {
    if (!openMenu) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const panel = panelRef.current;
    const firstFocusable = panel?.querySelector<HTMLElement>('button:not([disabled])');
    firstFocusable?.focus({ preventScroll: true });
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (headerRef.current && !headerRef.current.contains(target)) closeMenu();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const focusable = [...panel.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled])')]
        .filter(element => element.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openMenu]);

  const openMenuPanel = (key: NavKey, trigger: HTMLElement) => {
    if (openMenu === key) {
      triggerRef.current = trigger;
      closeMenu();
    } else showMenu(key, trigger);
  };

  if (destination) {
    const image = destination.parent.image
      ?? (destination.menu === 'hardware' ? '/__mockup/images/fsd-house/boxing-athlete.webp'
        : destination.menu === 'bio-lab' ? '/__mockup/images/fsd-house/fabric-study.webp'
          : destination.menu === 'house' ? '/__mockup/images/fsd-house/boxing-campaign.webp'
            : '/__mockup/images/fsd-house/mens-performance.webp');
    const isWomens = destination.parent.title === 'Women’s Modest Combat';
    const title = isWomens ? 'WOMEN’S MODEST COMBAT' : destination.leaf.title;
    const description = isWomens
      ? 'A dedicated FSD collection for refined, powerful, movement-focused modest combat. Explore performance hijabs, longline layers and full-coverage training forms.'
      : destination.leaf.description;
    return (
      <main className="fsd-drop fd-destination" data-destination>
        <div className="fd-destination-top">
          <div className="fd-container">
            <button className="fd-back-home" type="button" data-home onClick={() => setDestination(null)}>
              <span aria-hidden="true">←</span> BACK TO THE HOUSE
            </button>
          </div>
        </div>
        <div className="fd-container fd-destination-main">
          <section className="fd-destination-copy">
            <p className="fd-kicker">FSD / {isWomens ? 'WOMEN’S PERFORMANCE' : destination.parent.title.toUpperCase()}</p>
            <h1>{title}</h1>
            <p>{description}</p>
            <div className="fd-destination-subcats">
              <span>{isWomens ? 'COLLECTION SUBCATEGORIES' : 'SELECTED DIRECTION'}</span>
              {isWomens
                ? destination.parent.children?.map((item) => <b key={item.title}>{item.title}</b>)
                : <b>{destination.leaf.title}</b>}
            </div>
            <p className="fd-proposed-note">Pre-launch design prototype. Concepts, capabilities, availability and operational status are not confirmed.</p>
          </section>
          <div className="fd-destination-visual">
            <img src={image} alt={isWomens ? 'Approved FSD Velocity modest performance image' : 'FSD editorial image'} />
          </div>
        </div>
        <div className="fd-container fd-disclaimer">Prototype destination only — no production route, checkout, pricing or availability is represented.</div>
      </main>
    );
  }

  return (
    <div className="fsd-drop">
      <div className="fd-announcement">FSD / THE HOUSE OF PERFORMANCE <span>— PRE-LAUNCH DESIGN PROOF</span></div>
      <header className="fd-header" ref={headerRef}>
        <a className="fd-brand" href="#top" aria-label="FSD home">
          <img src="/__mockup/images/fsd-house/approved-header-logo.png" alt="FSD Fitness & Self-Defense" />
        </a>
        <nav className="fd-nav" aria-label="Main navigation">
          {navKeys.map((key) => {
            const item = menus.find((menu) => menu.key === key)!;
            return (
              <button key={key} type="button" data-nav-key={key} aria-haspopup="dialog" aria-controls="fd-category-selector"
                aria-expanded={openMenu === key} onClick={(event) => openMenuPanel(key, event.currentTarget)}>
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="fd-header-side">
           <span className="fd-house-note">United Kingdom · Pre-launch</span>
          <button className="fd-menu-toggle" type="button" aria-controls="fd-category-selector" aria-label={openMenu ? 'Close navigation' : 'Open navigation'}
            aria-expanded={Boolean(openMenu)} onClick={(event) => openMenuPanel('collections', event.currentTarget)}>
            <i aria-hidden="true" /> MENU
          </button>
        </div>
        {openMenu && openMenuData && (
          <div id="fd-category-selector" className="fd-menu-panel" data-category-panel role="dialog" aria-modal="true" aria-label={`${openMenuData.label} selector`} ref={panelRef}>
            <div className="fd-menu-inner">
              <div className="fd-menu-top">
                <p className="fd-menu-kicker">{openMenuData.heading}</p>
                <button className="fd-menu-close" type="button" aria-label="Close selector" onClick={closeMenu}>CLOSE <span aria-hidden="true">×</span></button>
              </div>
              <nav className="fd-sheet-primary" aria-label="Choose a primary category">
                {menus.map(item => (
                  <button key={item.key} type="button" data-nav-key={item.key}
                    aria-pressed={openMenu === item.key}
                    onClick={() => { setOpenMenu(item.key); setActiveChoice(0); setActiveLeaf(0); }}>
                    {item.label}
                  </button>
                ))}
              </nav>
              <div className="fd-menu-layout">
                <div className="fd-menu-group">
                  <p className="fd-menu-heading">{openMenu === 'collections' ? 'COLLECTIONS' : 'EXPLORE'}</p>
                  <div className="fd-menu-links">
                    {openMenuData.choices.map((item, index) => (
                      <button key={item.title} type="button" className={index === activeChoice ? 'is-selected' : ''}
                        onClick={() => { setActiveChoice(index); setActiveLeaf(0); }}>
                        <span>{item.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="fd-menu-group">
                  <p className="fd-menu-heading">{choice?.children ? 'SUBCATEGORIES' : 'DIRECTIONS'}</p>
                  <div className="fd-menu-links">
                    {leaves.map((item, index) => (
                      <button key={item.title} type="button" data-subcategory={item.title}
                        className={index === (choice?.children ? activeLeaf : activeChoice) ? 'is-selected' : ''}
                        onClick={() => choice?.children ? setActiveLeaf(index) : setActiveChoice(index)}>
                        <span>{item.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <aside className="fd-menu-detail" aria-live="polite">
                  <span className="fd-detail-index">FSD / {String((choice?.children ? activeLeaf : activeChoice) + 1).padStart(2, '0')}</span>
                  <h3>{selectedLeaf?.title ?? choice?.title}</h3>
                  <p>{selectedLeaf?.description ?? choice?.description}</p>
                  <button className="fd-explore" type="button" data-explore-collection onClick={explore}>
                    EXPLORE COLLECTION <span aria-hidden="true">↗</span>
                  </button>
                </aside>
              </div>
            </div>
          </div>
        )}
      </header>
      <main id="top">
        <section className="fd-hero" aria-labelledby="fd-hero-title">
          <div className="fd-hero-image" aria-hidden="true" />
          <div className="fd-hero-shade" aria-hidden="true" />
          <div className="fd-container fd-hero-content">
            <p className="fd-eyebrow">THE FSD PERFORMANCE HOUSE · UNITED KINGDOM</p>
            <h1 id="fd-hero-title">BUILT FOR<br /><em>THE DRIVE</em><br />WITHIN.</h1>
            <p className="fd-hero-copy">Luxury in its expression. Performance in its purpose.</p>
            <div className="fd-actions">
              <button className="fd-button-primary" type="button" onClick={(event) => showMenu('collections', event.currentTarget)}>
                EXPLORE COLLECTIONS <span aria-hidden="true">↗</span>
              </button>
              <button className="fd-button-quiet" type="button" onClick={(event) => showMenu('house', event.currentTarget)}>
                DISCOVER THE HOUSE <span aria-hidden="true">↗</span>
              </button>
            </div>
          </div>
          <div className="fd-container fd-hero-index"><span><b>FSD</b> / THE HOUSE OF PERFORMANCE</span><span>01 — 01</span></div>
        </section>

        <section className="fd-section fd-collections" aria-labelledby="fd-collections-title">
          <div className="fd-container">
            <div className="fd-section-heading">
              <div><p className="fd-kicker">THE COLLECTION SYSTEM</p><h2 id="fd-collections-title">Made to move.<br /><em>Designed to belong.</em></h2></div>
              <p>Two distinct expressions of the same FSD discipline. Select a collection to open its subcategories.</p>
            </div>
            <div className="fd-banner-grid">
              <CollectionBanner audience="mens" image="/__mockup/images/fsd-house/mens-performance.webp"
                title="MEN’S LUXURY PERFORMANCE" supporting="Technical apparel, combat training and considered layers."
                onActivate={(trigger) => openBanner('mens', trigger)} />
              <CollectionBanner audience="womens" image="/__mockup/images/fsd-house/womens-velocity-hijab.jpg"
                title="WOMEN’S MODEST COMBAT" supporting="Refined coverage. Movement without compromise."
                onActivate={(trigger) => openBanner('womens', trigger)} />
            </div>
            <p className="fd-proposed-note">Collection imagery uses supplied FSD assets. Product availability and specifications are not confirmed.</p>
          </div>
        </section>

        <section className="fd-bi-lab" aria-labelledby="fd-bio-title">
          <div className="fd-container">
            <div className="fd-bio-layout">
              <div className="fd-bio-copy">
                <p className="fd-kicker">FSD BIO-LAB™ / CONCEPTS</p>
                <h2 id="fd-bio-title">INTELLIGENCE<br />IN MOTION.</h2>
                <p>Exploring the relationship between clothing, movement and connected experiences. These are design directions, not verified technology claims.</p>
                <p className="fd-bio-note">Wearable technology · Smartwear · Recovery concepts · Digital integration</p>
                <p className="fd-bio-note">Concept names: ALIGN · MOTION · NEXUS · VECTOR · CORE</p>
                <div className="fd-bio-bottom">
                  <span>CONCEPTUAL / PRE-LAUNCH</span>
                  <button type="button" data-nav-key="bio-lab" onClick={(event) => showMenu('bio-lab', event.currentTarget)}>EXPLORE BIO-LAB™ ↗</button>
                </div>
              </div>
              <div className="fd-bio-image">
                <img src="/__mockup/images/fsd-house/technical-hoodie-detail.webp" alt="Close detail of supplied FSD technical apparel" loading="lazy" />
                <span className="fd-image-caption">MATERIAL STUDY / APPAREL DETAIL</span>
              </div>
            </div>
          </div>
        </section>

        <section className="fd-section fd-hardware" aria-labelledby="fd-hardware-title">
          <div className="fd-container fd-hardware-layout">
            <div className="fd-hardware-image">
              <img src="/__mockup/images/fsd-house/boxing-athlete.webp" alt="FSD boxing editorial, representing the combat training context" loading="lazy" />
            </div>
            <div className="fd-hardware-copy">
              <p className="fd-kicker">FSD HARDWARE / TRAINING SYSTEMS</p>
              <h2 id="fd-hardware-title">ENGINEERED FOR THE DEMANDS OF PERFORMANCE.</h2>
              <p>From strength work to combat practice, the hardware vision follows the same principle: equipment should earn its place in training. Where product photography is not approved, we show the training context—not an invented product.</p>
              <ul className="fd-hardware-list">
                <li><span>01</span> Strength equipment · dumbbell collections</li>
                <li><span>02</span> Boxing and combat equipment</li>
                <li><span>03</span> Training accessories · weighted skipping ropes</li>
                <li><span>04</span> Recovery equipment concepts</li>
              </ul>
              <div className="fd-bio-bottom">
                <span>CURATED HARDWARE GROUPS</span>
                <button type="button" data-nav-key="hardware" onClick={(event) => showMenu('hardware', event.currentTarget)}>EXPLORE HARDWARE ↗</button>
              </div>
            </div>
          </div>
        </section>

        <section className="fd-house" aria-labelledby="fd-house-title">
          <div className="fd-container fd-house-grid">
            <div>
              <p className="fd-kicker">THE FSD HOUSE / PHILOSOPHY</p>
              <h2 id="fd-house-title">BEYOND<br />PERFORMANCE.</h2>
              <p className="fd-house-lede">A British luxury performance house built around discipline, craft and the belief that confidence is earned in motion.</p>
            </div>
            <div>
              <div className="fd-house-values">
                <div><b>01 / PRINCIPLE</b><span>Luxury in its expression.</span></div>
                <div><b>02 / PURPOSE</b><span>Performance in its purpose.</span></div>
                <div><b>03 / PRACTICE</b><span>Fitness. Discipline. Progress. A stronger you.</span></div>
                <div><b>04 / HORIZON</b><span>Global ambitions and athlete development.</span></div>
              </div>
              <p className="fd-proposed-note">Proposed flagship studies: Dublin · Belfast · Manchester · Islamabad. FSD fight promotions are a future concept; none of these locations or services is represented as operating.</p>
              <div className="fd-bio-bottom">
                <span>THE FSD PHILOSOPHY</span>
                <button type="button" data-nav-key="house" onClick={(event) => showMenu('house', event.currentTarget)}>MEET THE HOUSE ↗</button>
              </div>
            </div>
          </div>
        </section>

        <section className="fd-private" aria-labelledby="fd-private-title">
          <div className="fd-container fd-private-inner">
            <div>
              <p className="fd-kicker">PRIVATE ACCESS / PRE-LAUNCH</p>
              <h2 id="fd-private-title">BE PART OF<br />WHAT COMES NEXT.</h2>
              <p className="fd-private-copy">A registration experience preview only. Registration is deferred and no contact details are collected.</p>
            </div>
            <form className="fd-registration-preview" onSubmit={(event) => event.preventDefault()}>
              <label htmlFor="fd-email-preview">EMAIL ADDRESS</label>
              <input id="fd-email-preview" type="email" placeholder="Registration preview — unavailable" disabled />
              <p className="fd-consent">Consent wording is pending approved content. This field is disabled and does not store information.</p>
              <button type="button" disabled>REGISTRATION PREVIEW</button>
              <details className="fd-privacy">
                <summary>Privacy information — pending approval</summary>
                <p>No email or consent is collected by this prototype. Registration will remain unavailable until the destination, privacy policy and consent wording are approved.</p>
              </details>
            </form>
          </div>
        </section>
      </main>
      <footer className="fd-footer">
        <div className="fd-container fd-footer-inner">
          <img className="fd-footer-logo" src="/__mockup/images/fsd-house/approved-header-logo.png" alt="FSD Fitness & Self-Defense" />
          <span>© FSD / THE HOUSE OF PERFORMANCE</span>
          <span className="fd-footer-note">DESIGN PROOF · NOT A LIVE STORE</span>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}>BACK TO TOP ↑</button>
        </div>
      </footer>
    </div>
  );
}

export default Dropdown;
