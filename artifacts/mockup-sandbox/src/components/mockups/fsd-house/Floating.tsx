import { useEffect, useRef, useState } from 'react';
import './Floating.css';

type MenuKey = 'collections' | 'bio-lab' | 'hardware' | 'house' | 'private';
type Leaf = { title: string; description: string; image?: string; destination?: string; children?: Leaf[] };
type Menu = { label: string; note: string; leaves: Leaf[] };

const menus: Record<MenuKey, Menu> = {
  collections: {
    label: 'COLLECTIONS',
    note: 'Performance apparel, shaped around the way you train.',
    leaves: [
      { title: 'Men’s Luxury Performance', description: 'Technical apparel, heavyweight layers, combat shorts and walkout clothing.', image: 'mens-performance.webp', destination: 'mens' },
      { title: 'Women’s Modest Combat', description: 'Full-coverage performance layers, designed for confidence in motion.', image: 'womens-velocity-hijab.jpg', destination: 'womens' },
      { title: 'Limited Collections', description: 'Distinctive capsules and editions from the FSD design library.' },
      { title: 'New & Featured Concepts', description: 'A considered view of ideas taking shape across the house.' },
      { title: 'Men’s Performance and Training', description: 'Original catalogue category. Technical apparel and training layers.', destination: 'mens' },
      { title: 'Training Sets', description: 'Original catalogue category. Coordinated training and tracksuit concepts.', destination: 'mens' },
      { title: 'Combat and MMA', description: 'Original catalogue category. Combat apparel and training concepts.', image: 'boxing-athlete.webp', destination: 'mens' },
      { title: 'Lifestyle', description: 'Original catalogue category. Performance design beyond the training floor.', destination: 'mens' },
      { title: 'Women’s Performance', description: 'Original catalogue category. Women’s performance layers.', image: 'womens-velocity-hijab.jpg', destination: 'womens' },
      { title: 'Modest Activewear', description: 'Original catalogue category. Full-coverage movement concepts.', image: 'womens-velocity-hijab.jpg', destination: 'womens' },
      { title: 'Sports Hijabs', description: 'Original catalogue category. Performance hijab concepts.', image: 'womens-velocity-hijab.jpg', destination: 'womens' },
      { title: 'Smart Tech', description: 'Original catalogue category. Wearable and connected concepts; capabilities are unverified.', image: 'fabric-study.webp' },
      { title: 'Gym Hardware and Accessories', description: 'Original catalogue category. Text-led equipment and accessory concepts.' },
      { title: '500 GSM Hoodies & Tracksuits', description: 'Heavyweight layers and tracksuit concepts within Men’s Luxury Performance.', image: 'technical-hoodie-detail.webp', destination: 'mens' },
      { title: '2-in-1 Combat Training Shorts & Tanks', description: 'A focused training concept from the men’s performance range.' },
      { title: 'Walkout Robes & Bomber Jackets', description: 'Entrance layers informed by fight-night ritual.' },
      { title: 'Volcanic Amber Capsule', description: 'A proposed capsule in the FSD apparel universe.' },
      { title: 'Vector Camo Capsule', description: 'A graphic capsule concept within the performance collection.' },
      { title: 'Performance Hijabs', description: 'A dedicated modest performance layer. Shown here is the approved Velocity image.', image: 'womens-velocity-hijab.jpg', destination: 'womens' },
      { title: 'Longline Tunics & Half-Zips', description: 'Fuller-coverage upper layers for considered movement.', destination: 'womens' },
      { title: 'Technical Tapered Combat Trackpants', description: 'A modest combat lower-layer concept.', destination: 'womens' },
      { title: 'Full-Coverage Compression Base Layers', description: 'A proposed full-coverage base layer family.', destination: 'womens' },
    ],
  },
  'bio-lab': {
    label: 'BIO-LAB™',
    note: 'Intelligence in motion. Concepts, not validated capabilities.',
    leaves: [
      { title: 'Smartwear', description: 'Apparel concepts exploring the relationship between clothing and training.' },
      { title: 'Wearable Technology', description: 'Wearable ideas presented without claims of verified functionality.', image: 'fabric-study.webp' },
      { title: 'Recovery Innovation', description: 'Research-led directions for future recovery experiences.' },
      { title: 'Digital Integration', description: 'A proposed connected layer for the FSD performance universe.' },
      { title: 'Bio-Weave™ ECG & Hydration Compression Tops', description: 'A named concept in the FSD design library; capabilities are unverified.' },
      { title: 'FSD Aware Band™', description: 'Wearable technology concept. No specification or availability is represented.' },
      { title: 'Graphene-Infused Thermal Recovery Vests', description: 'A proposed materials direction, not a verified technical claim.' },
      { title: 'FSD Digital Pass™', description: 'A digital integration concept for a future FSD experience.' },
      { title: 'FSD VECTOR — Smartwatch', description: 'A design-library concept only.' },
      { title: 'FSD CORE — Heart Rate Sensor Strap', description: 'A design-library concept only.' },
    ],
  },
  hardware: {
    label: 'HARDWARE',
    note: 'Engineered for the demands of performance.',
    leaves: [
      { title: 'Strength Equipment', description: 'A future equipment family. No product or technical detail is confirmed.' },
      { title: 'Combat Equipment', description: 'Combat equipment concepts, framed by existing FSD fight imagery.', image: 'boxing-athlete.webp' },
      { title: 'Training Accessories', description: 'Accessories for training disciplines, presented as a considered product direction.' },
      { title: 'Recovery Equipment', description: 'Recovery concepts in the wider FSD performance system.' },
      { title: 'Performance Accessories', description: 'A proposed collection of considered training essentials.' },
      { title: 'Strength Equipment Concepts', description: 'Dumbbell families are listed in the catalogue; no approved product photograph is available.' },
      { title: 'Combat Equipment Concepts', description: 'Boxing and combat equipment remain concepts; no unapproved equipment photography is used.', image: 'boxing-campaign.webp' },
      { title: 'Recovery Concepts', description: 'Text-led concept information only; no equipment photography is approved.' },
      { title: 'Heavy Bags', description: 'Combat-equipment concept from the FSD division notes; no product image is approved.' },
      { title: 'Cryo-Zero Recovery Chambers', description: 'A named recovery concept only; no operational capability is represented.' },
      { title: 'Red Light Recovery Beds', description: 'A named recovery concept only; no operational capability is represented.' },
      { title: '7mm Knee Sleeves', description: 'A product concept from the source notes; details remain subject to confirmation.' },
    ],
  },
  house: {
    label: 'THE HOUSE',
    note: 'Luxury in its expression. Performance in its purpose.',
    leaves: [
      { title: 'Our Story', description: 'A British performance house built around discipline, identity and progress.' },
      { title: 'Flagships', description: 'Proposed locations include Dublin, Belfast, Manchester and Islamabad. None are represented as operating.' },
      { title: 'Fight Promotions', description: 'A future-facing vision for fight culture, events and athlete development.' },
      { title: 'Global Vision', description: 'From the training floor to the world stage.' },
      { title: 'Investor Relations', description: 'Investor information requires approved content before publication.' },
      { title: 'Future Global Locations', description: 'Locations are proposals, not operating facilities.' },
      { title: 'Live Events', description: 'A proposed part of the wider FSD fight-culture vision.' },
      { title: 'Broadcast & PPV Concepts', description: 'A proposed promotion format; no event is announced.' },
      { title: 'Athlete Development', description: 'A future-facing ambition within the FSD house.' },
      { title: 'Academy & Grassroots Programmes', description: 'A proposed development direction, not an active programme.' },
    ],
  },
  private: {
    label: 'PRIVATE ACCESS',
    note: 'Be part of what comes next.',
    leaves: [
      { title: 'VIP Pre-Launch Registration', description: 'Registration is deferred until an approved destination and consent details are ready.' },
      { title: 'Collection Announcements', description: 'Future announcements are not being collected or scheduled here.' },
      { title: 'Private Enquiries', description: 'Private enquiry information is pending approved contact details.' },
    ],
  },
};

const navOrder: MenuKey[] = ['collections', 'bio-lab', 'hardware', 'house', 'private'];
const asset = (name: string) => `/__mockup/images/fsd-house/${name}`;
// Retain the original labels but group them by collection rather than presenting
// a long flat list. Banner clicks can now reveal the relevant leaves immediately.
const sourceCollectionLeaves = menus.collections.leaves;
menus.collections.leaves = sourceCollectionLeaves.slice(0, 4).map((parent, index) => ({
  ...parent,
  children: index === 0
    ? [...sourceCollectionLeaves.slice(13, 18), ...sourceCollectionLeaves.slice(4, 8)]
    : index === 1
      ? [...sourceCollectionLeaves.slice(18, 22), ...sourceCollectionLeaves.slice(8, 11)]
      : index === 2 ? sourceCollectionLeaves.slice(16, 18) : sourceCollectionLeaves.slice(0, 2),
}));
menus['bio-lab'].leaves.push(sourceCollectionLeaves[11]);
menus.hardware.leaves.push(sourceCollectionLeaves[12]);

function CollectionBanner({ variant, image, eyebrow, title, copy, onClick }: {
  variant: 'mens' | 'womens'; image: string; eyebrow: string; title: string; copy: string; onClick: (trigger: HTMLElement) => void;
}) {
  return <button className={`fh-banner fh-banner--${variant}`} type="button" data-collection-banner={variant} onClick={(event) => onClick(event.currentTarget)}>
    <img src={asset(image)} alt="" loading="lazy" />
    <span className="fh-banner-shade" />
    <span className="fh-banner-copy"><small>{eyebrow}</small><strong>{title}</strong><span>{copy}</span><i>OPEN COLLECTION <b aria-hidden="true">↗</b></i></span>
  </button>;
}

export function Floating() {
  const [activeMenu, setActiveMenu] = useState<MenuKey | null>(null);
  const [selected, setSelected] = useState(0);
  const [collectionIndex, setCollectionIndex] = useState(0);
  const [destination, setDestination] = useState<string | null>(null);
  const [destinationLeaf, setDestinationLeaf] = useState<Leaf | null>(null);
  const [mobile, setMobile] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const collectionParent = menus.collections.leaves[collectionIndex];
  const visibleLeaves = activeMenu === 'collections'
    ? collectionParent.children ?? [collectionParent]
    : activeMenu ? menus[activeMenu].leaves : [];
  const activeLeaf = visibleLeaves[selected];

  const openMenu = (key: MenuKey, trigger: HTMLElement, leafIndex = 0) => {
    triggerRef.current = trigger;
    setActiveMenu(key);
    setCollectionIndex(key === 'collections' ? leafIndex : 0);
    setSelected(0);
    setMobile(window.matchMedia('(max-width: 760px)').matches);
  };
  const closeMenu = () => {
    setActiveMenu(null);
    setMobile(false);
    window.setTimeout(() => {
      const fallback = document.querySelector<HTMLElement>(
        window.matchMedia('(max-width: 760px)').matches ? '.fh-menu-toggle' : '.fh-nav [data-nav-key="collections"]',
      );
      (triggerRef.current?.isConnected ? triggerRef.current : fallback)?.focus({ preventScroll: true });
    }, 20);
  };
  const openBanner = (which: 'mens' | 'womens', trigger: HTMLElement) => {
    const index = which === 'mens' ? 0 : 1;
    openMenu('collections', trigger, index);
  };
  const explore = () => {
    if (!activeLeaf || !activeMenu) return;
    setDestinationLeaf(activeLeaf);
    setDestination(activeLeaf.destination ?? (activeMenu === 'collections' ? collectionParent.destination ?? 'collections' : activeMenu));
    closeMenu();
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  };

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('menu') === 'collections') {
      setActiveMenu('collections');
      setMobile(window.matchMedia('(max-width: 760px)').matches);
      setSelected(0);
    }
  }, []);

  useEffect(() => {
    if (!activeMenu) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () => [...(panelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input:not(:disabled)') ?? [])];
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeMenu(); return; }
      if (event.key !== 'Tab') return;
      const items = focusable().filter(element => element.getClientRects().length > 0);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    window.setTimeout(() => panelRef.current?.querySelector<HTMLElement>('[data-subcategory]')?.focus({ preventScroll: true }), 30);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [activeMenu, mobile]);

  const chooseMenu = (key: MenuKey, trigger: HTMLElement) => {
    if (activeMenu === key) closeMenu();
    else openMenu(key, trigger);
  };

  if (destination) {
    const isWomens = destination === 'womens';
    const title = isWomens ? 'WOMEN’S MODEST COMBAT' : destination === 'mens' ? 'MEN’S LUXURY PERFORMANCE' : destination === 'bio-lab' ? 'INTELLIGENCE IN MOTION.' : destination === 'hardware' ? 'ENGINEERED FOR PERFORMANCE.' : destination === 'house' ? 'BEYOND PERFORMANCE.' : menus[destination as MenuKey]?.label ?? 'THE FSD HOUSE';
    return <main className="fh-destination" data-destination={destination}>
      <header className="fh-destination-top"><button type="button" data-home onClick={() => setDestination(null)}>← <span>BACK TO THE HOUSE</span></button><img src={asset('approved-header-logo.png')} alt="FSD Fitness & Self-Defense" /></header>
      <section className={`fh-destination-hero ${isWomens ? 'fh-destination-hero--women' : ''}`}>
        <img src={asset(isWomens ? 'womens-velocity-hijab.jpg' : destination === 'mens' ? 'mens-performance.webp' : destination === 'hardware' ? 'boxing-athlete.webp' : destination === 'bio-lab' ? 'fabric-study.webp' : 'boxing-campaign.webp')} alt="" />
        <div><p className="fh-kicker">FSD / COLLECTION PREVIEW</p><h1>{title}</h1><p>{destinationLeaf?.description}</p><small>PROTOTYPE DESTINATION · NOT A PRODUCTION ROUTE</small></div>
      </section>
      <section className="fh-destination-detail"><p className="fh-kicker">A CLOSER LOOK</p><h2>{isWomens ? 'MADE FOR MOVEMENT.' : 'BUILT FOR THE DRIVE WITHIN.'}</h2><p>{isWomens ? 'Explore performance hijabs, longline tunics and half-zips, tapered combat trackpants, and full-coverage base-layer concepts.' : 'A considered performance system, with details and availability subject to confirmation.'}</p>
        <div className="fh-destination-links">{(isWomens
          ? menus.collections.leaves[1].children ?? []
          : destination === 'mens' ? menus.collections.leaves[0].children ?? []
            : menus[destination as MenuKey]?.leaves ?? [destinationLeaf!]
        ).map((item) => <article key={item.title}><span>FSD / COLLECTION</span><h3>{item.title}</h3><p>{item.description}</p></article>)}</div>
        <button className="fh-back-button" type="button" data-home onClick={() => setDestination(null)}>RETURN TO THE HOUSE</button>
      </section>
    </main>;
  }

  return <div className="fh-site">
    <div className="fh-announcement">FSD / THE HOUSE OF PERFORMANCE <span>— PRE-LAUNCH DESIGN PROOF</span></div>
    <header className="fh-header">
      <a className="fh-logo" href="#home" aria-label="FSD home"><img src={asset('approved-header-logo.png')} alt="FSD Fitness & Self-Defense" /></a>
      <nav className="fh-nav" aria-label="Primary navigation">
        {navOrder.map(key => <button key={key} type="button" data-nav-key={key} aria-expanded={activeMenu === key} onClick={(event) => chooseMenu(key, event.currentTarget)}>{menus[key].label}</button>)}
      </nav>
      <button className="fh-menu-toggle" type="button" aria-label={mobile ? 'Close navigation' : 'Open navigation'} aria-expanded={!!activeMenu} onClick={(event) => activeMenu ? closeMenu() : openMenu('collections', event.currentTarget, 0)}>MENU <span>{activeMenu ? '×' : '＋'}</span></button>
    </header>
    <main id="home">
      <section className="fh-hero">
        <img className="fh-hero-image" src={asset('boxing-campaign.webp')} alt="FSD campaign image: athlete preparing for training" />
        <div className="fh-hero-overlay" />
        <div className="fh-hero-content"><p className="fh-kicker">THE FSD PERFORMANCE HOUSE <span /> EST. UNITED KINGDOM</p><h1>BUILT FOR<br/><em>THE DRIVE</em><br/>WITHIN.</h1><p className="fh-hero-sub">Luxury in its expression.<br/>Performance in its purpose.</p><div className="fh-hero-actions">
          <button type="button" onClick={(event) => openMenu('collections', event.currentTarget)}>EXPLORE COLLECTIONS <b>↗</b></button>
          <button type="button" onClick={(event) => openMenu('house', event.currentTarget)}>DISCOVER THE HOUSE <b>↗</b></button>
        </div><span className="fh-hero-caption">DISCIPLINE / IDENTITY / PROGRESS</span></div>
        <div className="fh-hero-index">01 <span>—</span> FSD / PERFORMANCE</div>
      </section>
      <section className="fh-collections">
        <div className="fh-section-head"><div><p className="fh-kicker">THE COLLECTION SYSTEM</p><h2>MADE TO MOVE.<br/><i>MADE TO BELONG.</i></h2></div><p>Two distinct expressions.<br/>One disciplined point of view.</p></div>
        <div className="fh-banner-grid">
          <CollectionBanner variant="mens" image="mens-performance.webp" eyebrow="01 / MEN’S PERFORMANCE" title="MEN’S LUXURY PERFORMANCE" copy="Technical apparel for focused training and life beyond it." onClick={(trigger) => openBanner('mens', trigger)} />
          <CollectionBanner variant="womens" image="womens-velocity-hijab.jpg" eyebrow="02 / WOMEN’S MODEST COMBAT" title="WOMEN’S MODEST COMBAT" copy="Full-coverage layers. Strength without compromise." onClick={(trigger) => openBanner('womens', trigger)} />
        </div>
        <p className="fh-caption">A considered collection preview. Product specifications and availability are subject to confirmation.</p>
      </section>
      <section className="fh-biolab">
        <div className="fh-biolab-image"><img src={asset('fabric-study.webp')} alt="Close detail of performance fabric" /><span>FSD / BIO-LAB™ CONCEPT</span></div>
        <div className="fh-biolab-copy"><p className="fh-kicker">02 — FSD BIO-LAB™</p><h2>INTELLIGENCE<br/><i>IN MOTION.</i></h2><p>Wearable technology and smartwear concepts, explored with precision. Capabilities remain conceptual and are not represented as verified.</p><button type="button" onClick={(event) => openMenu('bio-lab', event.currentTarget)}>DISCOVER BIO-LAB™ <b>↗</b></button></div>
      </section>
      <section className="fh-hardware">
        <div className="fh-hardware-copy"><p className="fh-kicker">03 — FSD HARDWARE</p><h2>ENGINEERED FOR<br/>THE DEMANDS OF<br/><i>PERFORMANCE.</i></h2><p>Strength equipment, combat essentials, training accessories and recovery concepts. Honest about what is not yet pictured.</p><button type="button" onClick={(event) => openMenu('hardware', event.currentTarget)}>EXPLORE HARDWARE <b>↗</b></button></div>
        <figure><img src={asset('boxing-athlete.webp')} alt="FSD combat training editorial" /><figcaption>FSD / COMBAT CULTURE — EDITORIAL IMAGE</figcaption></figure>
        <div className="fh-hardware-note"><span>01</span><p>Equipment families are presented as text-led concepts where approved product photography is not available.</p></div>
      </section>
      <section className="fh-house">
        <img src={asset('boxing-campaign.webp')} alt="" loading="lazy" />
        <div className="fh-house-copy"><p className="fh-kicker">04 — THE HOUSE</p><h2>BEYOND<br/><i>PERFORMANCE.</i></h2><p>From training floors to future flagships: a British performance house with global ambition.</p><p className="fh-location-note">Proposed locations include Dublin, Belfast, Manchester and Islamabad. These are future concepts, not operating facilities.</p><button type="button" onClick={(event) => openMenu('house', event.currentTarget)}>MEET THE HOUSE <b>↗</b></button></div>
      </section>
      <section className="fh-private">
        <div><p className="fh-kicker">PRIVATE ACCESS / PRE-LAUNCH</p><h2>BE PART OF<br/><i>WHAT COMES NEXT.</i></h2><p>Future collection announcements and private access, once registration is ready.</p></div>
        <div className="fh-registration"><label htmlFor="fh-email">EMAIL ADDRESS</label><input id="fh-email" type="email" placeholder="Registration is not open" disabled /><label className="fh-consent"><input type="checkbox" disabled /> I agree to receive FSD updates. Consent details are pending approved content.</label><button type="button" disabled>REQUEST PRIVATE ACCESS <b>↗</b></button><p>Registration does not collect information in this preview.</p><details className="fh-privacy"><summary>PRIVACY INFORMATION — PENDING APPROVAL</summary><p>No email or consent is collected by this prototype. Registration will remain unavailable until the destination, privacy policy and consent wording are approved.</p></details></div>
      </section>
    </main>
    <footer className="fh-footer"><img src={asset('approved-header-logo.png')} alt="FSD Fitness & Self-Defense" /><div><p>THE REFINEMENT OF LUXURY FASHION. THE ENERGY OF ELITE SPORT. THE PRECISION OF PERFORMANCE ENGINEERING. THE INNOVATION OF MODERN TECHNOLOGY.</p><small>© FSD / PRE-LAUNCH HOMEPAGE PROTOTYPE</small></div><button type="button" onClick={(event) => openMenu('collections', event.currentTarget)}>COLLECTIONS ↗</button></footer>
    {activeMenu && <div className={`fh-menu-backdrop ${mobile ? 'is-mobile' : ''}`} onMouseDown={(event) => { if (event.target === event.currentTarget) closeMenu(); }}>
      <div className={`fh-panel ${mobile ? 'fh-panel--mobile' : ''}`} role="dialog" aria-modal="true" aria-label={`${menus[activeMenu].label} selector`} data-category-panel ref={panelRef}>
        <div className="fh-panel-top"><div><span className="fh-kicker">FSD / SELECT A COLLECTION</span><h2>{menus[activeMenu].label}</h2></div><button className="fh-close" type="button" onClick={closeMenu} aria-label="Close selector">CLOSE <b>×</b></button></div>
        <nav className="fh-panel-nav" aria-label="Choose a primary category">
          {navOrder.map((key) => <button key={key} type="button" data-nav-key={key} aria-current={activeMenu === key ? 'page' : undefined} onClick={() => { setActiveMenu(key); setSelected(0); setCollectionIndex(0); }}>{menus[key].label}</button>)}
        </nav>
        {activeMenu === 'collections' && <nav className="fh-collection-tabs" aria-label="Choose a collection">
          {menus.collections.leaves.map((parent, index) => <button key={parent.title} type="button"
            aria-pressed={collectionIndex === index}
            onClick={() => { setCollectionIndex(index); setSelected(0); }}>{parent.title}</button>)}
        </nav>}
        <div className="fh-panel-body">
          <nav className="fh-leaf-list" aria-label={`${menus[activeMenu].label} subcategories`}>
            {visibleLeaves.map((leaf, index) => <button type="button" data-subcategory={leaf.title} aria-pressed={selected === index} className={selected === index ? 'is-selected' : ''} key={leaf.title} onClick={() => setSelected(index)}><span>{String(index + 1).padStart(2, '0')}</span>{leaf.title}<b>↗</b></button>)}
          </nav>
          <aside className="fh-preview">
            {activeLeaf?.image ? <img src={asset(activeLeaf.image)} alt="" /> : <div className="fh-preview-blank"><img src={asset('approved-shield.png')} alt="" /><span>FSD / THE HOUSE OF PERFORMANCE</span></div>}
            <div className="fh-preview-copy"><span className="fh-kicker">SELECTED / {String(selected + 1).padStart(2, '0')}</span><h3>{activeLeaf?.title}</h3><p>{activeLeaf?.description}</p>
              <button type="button" data-explore-collection onClick={explore}>EXPLORE COLLECTION <b>↗</b></button>
            </div>
          </aside>
        </div>
        <div className="fh-panel-foot"><span>{menus[activeMenu].note}</span><span>ESC TO CLOSE</span></div>
      </div>
    </div>}
    <span className="fh-sr-only" aria-live="polite">{activeMenu ? `${menus[activeMenu].label} selector open` : ''}</span>
  </div>;
}
