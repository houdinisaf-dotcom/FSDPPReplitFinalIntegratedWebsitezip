import { useEffect, useRef, useState, type CSSProperties } from 'react';
import './HousePlus.css';

type NavKey = 'collections' | 'bio-lab' | 'hardware' | 'house' | 'private';
type Leaf = { title: string; description: string; image?: string; destination?: string };
type Group = Leaf & { children: Leaf[] };
type Menu = { key: NavKey; label: string; kicker: string; note: string; groups: Group[] };
type Destination = { key: string; title: string; description: string; image?: string; group: Group; leaf: Leaf };

const imageRoot = '/__mockup/images/fsd-house/';
const image = (file: string) => `${imageRoot}${file}`;
const leaf = (title: string, description: string, extra: Partial<Leaf> = {}): Leaf => ({ title, description, ...extra });
const apparelImage = 'mens-performance.webp';
const womenImage = 'womens-velocity-hijab.jpg';
const campaignImage = 'boxing-campaign.webp';
const combatEditorial = 'boxing-athlete.webp';
const fabricImage = 'fabric-study.webp';

const menus: Record<NavKey, Menu> = {
  collections: {
    key: 'collections', label: 'COLLECTIONS', kicker: 'COLLECTIONS / DIVISIONS',
    note: 'Four collection directions. One disciplined point of view.',
    groups: [
      {
        title: 'Men’s Luxury Performance',
        description: 'Technical apparel, heavyweight layers, combat shorts, walkout clothing and considered capsules.',
        image: apparelImage, destination: 'mens',
        children: [
          leaf('500 GSM Hoodies & Tracksuits', 'Heavyweight layers and tracksuit concepts within the men’s performance range.', { image: 'technical-hoodie-detail.webp', destination: 'mens' }),
          leaf('2-in-1 Combat Training Shorts & Tanks', 'A focused training concept from the men’s performance range.', { destination: 'mens' }),
          leaf('Walkout Robes & Bomber Jackets', 'Entrance layers informed by fight-night ritual.', { destination: 'mens' }),
          leaf('Volcanic Amber Capsule', 'A proposed capsule in the FSD apparel universe.', { destination: 'mens' }),
          leaf('Vector Camo Capsule', 'A graphic capsule concept within the performance collection.', { destination: 'mens' }),
          leaf('Men’s Performance and Training', 'Original catalogue category retained for FSD men’s apparel and training records.', { destination: 'mens' }),
          leaf('Training Sets', 'Original catalogue category retained for coordinated training layers.', { destination: 'mens' }),
          leaf('Combat and MMA', 'Original catalogue category retained for combat apparel records.', { image: combatEditorial, destination: 'mens' }),
          leaf('Lifestyle', 'Original catalogue category retained for FSD lifestyle records.', { destination: 'mens' }),
        ],
      },
      {
        title: 'Women’s Modest Combat',
        description: 'Refined, powerful and movement-focused performance with coverage in mind.',
        image: womenImage, destination: 'womens',
        children: [
          leaf('Performance Hijabs', 'A dedicated modest performance layer. The approved Velocity image is shown as supplied.', { image: womenImage, destination: 'womens' }),
          leaf('Longline Tunics & Half-Zips', 'Fuller-coverage upper layers for considered movement.', { destination: 'womens' }),
          leaf('Technical Tapered Combat Trackpants', 'A modest combat lower-layer concept.', { destination: 'womens' }),
          leaf('Full-Coverage Compression Base Layers', 'A proposed full-coverage base-layer family.', { destination: 'womens' }),
          leaf('Women’s Performance', 'Original catalogue category retained for FSD women’s performance records.', { destination: 'womens' }),
          leaf('Modest Activewear', 'Original catalogue category retained for FSD modest performance records.', { destination: 'womens' }),
          leaf('Sports Hijabs', 'Original catalogue category retained for FSD sports hijab records.', { destination: 'womens' }),
        ],
      },
      {
        title: 'Limited Collections',
        description: 'Capsules and editions from the FSD design library.',
        image: apparelImage, destination: 'mens',
        children: [
          leaf('Volcanic Amber Capsule', 'A proposed capsule within the FSD apparel division.', { destination: 'mens' }),
          leaf('Vector Camo Capsule', 'A considered capsule using the original Vector Camo name.', { destination: 'mens' }),
        ],
      },
      {
        title: 'New & Featured Concepts',
        description: 'Selected directions from the FSD collection system, presented as pre-launch concepts.',
        image: 'technical-hoodie-detail.webp', destination: 'mens',
        children: [
          leaf('Men’s Luxury Performance', 'Technical apparel, heavyweight layers and combat-inspired design.', { image: apparelImage, destination: 'mens' }),
          leaf('Women’s Modest Combat', 'Full-coverage performance layers designed for confidence in motion.', { image: womenImage, destination: 'womens' }),
        ],
      },
    ],
  },
  'bio-lab': {
    key: 'bio-lab', label: 'BIO-LAB™', kicker: 'BIO-LAB™ / DESIGN DIRECTIONS',
    note: 'Conceptual directions only; no technology capabilities are represented as verified.',
    groups: [
      {
        title: 'Smartwear', description: 'Apparel concepts exploring the relationship between clothing and training.',
        image: fabricImage, destination: 'bio-lab',
        children: [
          leaf('Smart Tech', 'Original catalogue category retained for FSD smart-technology records.', { image: fabricImage, destination: 'bio-lab' }),
          leaf('Bio-Weave™ ECG & Hydration Compression Tops', 'A named concept in the FSD design library; capabilities are unverified.', { image: fabricImage, destination: 'bio-lab' }),
        ],
      },
      {
        title: 'Wearable Technology', description: 'Wearable ideas presented without claims of verified functionality.',
        image: fabricImage, destination: 'bio-lab',
        children: [
          leaf('FSD Aware Band™', 'Wearable technology concept. No specification or availability is represented.', { destination: 'bio-lab' }),
          leaf('FSD VECTOR — Smartwatch', 'A design-library concept only.', { destination: 'bio-lab' }),
          leaf('FSD CORE — Heart Rate Sensor Strap', 'A design-library concept only.', { destination: 'bio-lab' }),
        ],
      },
      {
        title: 'Recovery Innovation', description: 'Future recovery directions considered through the performance lens.',
        image: fabricImage, destination: 'bio-lab',
        children: [
          leaf('Graphene-Infused Thermal Recovery Vests', 'A proposed materials direction, not a verified technical claim.', { destination: 'bio-lab' }),
          leaf('Recovery concepts', 'A design direction only; operational details and capabilities are not confirmed.', { destination: 'bio-lab' }),
        ],
      },
      {
        title: 'Digital Integration', description: 'A proposed connected layer for future FSD experiences.',
        image: fabricImage, destination: 'bio-lab',
        children: [
          leaf('FSD Digital Pass™', 'A digital integration concept for a future FSD experience.', { destination: 'bio-lab' }),
        ],
      },
    ],
  },
  hardware: {
    key: 'hardware', label: 'HARDWARE', kicker: 'HARDWARE / TRAINING SYSTEMS',
    note: 'Text-led equipment groups where approved product photography is not available.',
    groups: [
      {
        title: 'Strength Equipment', description: 'Strength equipment concepts. No unapproved equipment photography is used.',
        destination: 'hardware',
        children: [
          leaf('Dumbbell collections', 'Strength-equipment groups from the FSD catalogue; no product image is approved.', { destination: 'hardware' }),
          leaf('Gym Hardware and Accessories', 'Original catalogue category retained for FSD equipment and accessory records.', { destination: 'hardware' }),
        ],
      },
      {
        title: 'Combat Equipment', description: 'Existing boxing editorial sets the combat context; it is not product photography.',
        image: combatEditorial, destination: 'hardware',
        children: [
          leaf('Boxing and combat equipment', 'Equipment concepts shown as text; the adjacent image is FSD boxing editorial context.', { image: combatEditorial, destination: 'hardware' }),
          leaf('Heavy Bags', 'A combat-equipment concept from the source notes; no product image is approved.', { destination: 'hardware' }),
        ],
      },
      {
        title: 'Training Accessories', description: 'Training accessory groups, without invented product visuals.',
        destination: 'hardware',
        children: [
          leaf('Training accessories', 'A considered group of training essentials; no availability is represented.', { destination: 'hardware' }),
          leaf('Weighted skipping ropes', 'A text-led concept only; no approved product photograph is available.', { destination: 'hardware' }),
        ],
      },
      {
        title: 'Recovery Equipment', description: 'Recovery concepts are not represented as operational or verified.',
        destination: 'hardware',
        children: [
          leaf('Recovery Technology', 'Original division group retained as a text-led recovery concept.', { destination: 'hardware' }),
          leaf('Cryo-Zero Recovery Chambers', 'A named recovery concept only; no operating capability is represented.', { destination: 'hardware' }),
          leaf('Red Light Recovery Beds', 'A named recovery concept only; no operating capability is represented.', { destination: 'hardware' }),
          leaf('7mm Knee Sleeves', 'A source concept; details remain subject to confirmation.', { destination: 'hardware' }),
        ],
      },
      {
        title: 'Performance Accessories', description: 'Original division group retained for proposed performance accessories.',
        destination: 'hardware',
        children: [
          leaf('Gym Hardware and Accessories', 'Original catalogue category retained for FSD equipment and accessory records.', { destination: 'hardware' }),
          leaf('Performance accessories', 'Text-led accessory concepts only; no availability is represented.', { destination: 'hardware' }),
        ],
      },
    ],
  },
  house: {
    key: 'house', label: 'THE HOUSE', kicker: 'THE HOUSE / FSD',
    note: 'A British performance house with proposed global ambitions.',
    groups: [
      {
        title: 'Our Story', description: 'A British performance house shaped by discipline, identity and purposeful design.',
        image: campaignImage, destination: 'house',
        children: [
          leaf('Luxury in its expression.', 'Performance in its purpose.', { image: campaignImage, destination: 'house' }),
          leaf('Fitness. Discipline. Progress.', 'A philosophy for a stronger you.', { destination: 'house' }),
        ],
      },
      {
        title: 'Flagships', description: 'Future locations are proposed concepts, not operating sites.',
        destination: 'house',
        children: [
          leaf('Dublin', 'A proposed flagship location; not represented as operating.', { destination: 'house' }),
          leaf('Belfast', 'A proposed flagship location; not represented as operating.', { destination: 'house' }),
          leaf('Manchester', 'A proposed flagship location; not represented as operating.', { destination: 'house' }),
          leaf('Islamabad', 'A proposed flagship location; not represented as operating.', { destination: 'house' }),
          leaf('Future Global Locations', 'A proposed global vision; locations are not operating facilities.', { destination: 'house' }),
        ],
      },
      {
        title: 'Fight Promotions', description: 'A future-facing vision for fight culture and athlete development.',
        image: combatEditorial, destination: 'house',
        children: [
          leaf('Professional Fight Promotions', 'A proposed platform; no event is announced.', { image: combatEditorial, destination: 'house' }),
          leaf('Live Events', 'A proposed part of the wider FSD fight-culture vision.', { destination: 'house' }),
          leaf('Broadcast & PPV Concepts', 'A proposed promotion format; no event is announced.', { destination: 'house' }),
          leaf('Athlete Development', 'A future-facing ambition within the FSD house.', { destination: 'house' }),
          leaf('Academy & Grassroots Programmes', 'A proposed development direction, not an active programme.', { destination: 'house' }),
        ],
      },
      {
        title: 'Global Vision', description: 'An international ambition grounded in the FSD house philosophy.',
        destination: 'house',
        children: [leaf('From the training floor to the world stage.', 'A future-facing FSD vision, not an operating footprint.', { destination: 'house' })],
      },
      {
        title: 'Investor Relations', description: 'Investor information requires approved content before it can be shared.',
        destination: 'house',
        children: [leaf('Investor information', 'Information is pending approved content.', { destination: 'house' })],
      },
    ],
  },
  private: {
    key: 'private', label: 'PRIVATE ACCESS', kicker: 'PRIVATE ACCESS / PRE-LAUNCH',
    note: 'Registration is deferred. This preview does not collect or store contact details.',
    groups: [
      {
        title: 'VIP Pre-Launch Registration', description: 'Registration is deferred until approved destination, privacy and consent content are ready.',
        destination: 'private',
        children: [leaf('Registration preview', 'Non-collecting preview only. Email, consent and registration controls remain disabled.', { destination: 'private' })],
      },
      {
        title: 'Collection Announcements', description: 'A future channel for collection updates; no release timing is promised.',
        destination: 'private',
        children: [leaf('Collection updates', 'No announcement schedule or availability is promised.', { destination: 'private' })],
      },
      {
        title: 'Private Enquiries', description: 'A private enquiry destination is a prototype only; approved contact details are pending.',
        destination: 'private',
        children: [leaf('Private enquiry preview', 'No enquiry information is collected in this proof.', { destination: 'private' })],
      },
    ],
  },
};

const navOrder: NavKey[] = ['collections', 'bio-lab', 'hardware', 'house', 'private'];
const collectionHero = 'Luxury in its expression. Performance in its purpose.';

function Banner({ audience, src, label, title, copy, onOpen }: {
  audience: 'mens' | 'womens'; src: string; label: string; title: string; copy: string; onOpen: (trigger: HTMLElement) => void;
}) {
  return (
    <button className={`hp-banner hp-banner--${audience}`} type="button" data-collection-banner={audience} onClick={(event) => onOpen(event.currentTarget)}>
      <img src={image(src)} alt="" loading="lazy" />
      <span className="hp-banner-overlay" />
      <span className="hp-banner-index">{label}</span>
      <span className="hp-banner-copy"><strong>{title}</strong><span>{copy}</span><i>OPEN COLLECTION <b aria-hidden="true">↗</b></i></span>
    </button>
  );
}

export function HousePlus() {
  const isMobileQuery = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 760px)').matches;
  const initialMenu = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('menu') === 'collections'
    ? 'collections' as NavKey : null;
  const [activeMenu, setActiveMenu] = useState<NavKey | null>(initialMenu);
  const [isMobile, setIsMobile] = useState(isMobileQuery);
  const [closing, setClosing] = useState(false);
  const [groupIndex, setGroupIndex] = useState(0);
  const [leafIndex, setLeafIndex] = useState(0);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [panelTop, setPanelTop] = useState(96);
  const headerRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const openFocusTimerRef = useRef<number | null>(null);
  const groups = activeMenu ? menus[activeMenu].groups : [];
  const activeGroup = groups[groupIndex] ?? groups[0];
  const leaves = activeGroup?.children ?? [];
  const activeLeaf = leaves[leafIndex] ?? leaves[0];
  const panelOpen = activeMenu !== null;

  const measurePanelTop = () => {
    const rect = headerRef.current?.getBoundingClientRect();
    if (rect) setPanelTop(Math.max(0, Math.round(rect.bottom)));
  };

  const showMenu = (key: NavKey, trigger?: HTMLElement, group = 0) => {
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    if (openFocusTimerRef.current !== null) window.clearTimeout(openFocusTimerRef.current);
    closeTimerRef.current = null;
    openFocusTimerRef.current = null;
    if (trigger) triggerRef.current = trigger;
    setClosing(false);
    setActiveMenu(key);
    setGroupIndex(group);
    setLeafIndex(0);
    measurePanelTop();
  };

  const closeMenu = (restoreFocus = true) => {
    if (!activeMenu || closing) return;
    if (openFocusTimerRef.current !== null) window.clearTimeout(openFocusTimerRef.current);
    openFocusTimerRef.current = null;
    setClosing(true);
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 220;
    closeTimerRef.current = window.setTimeout(() => {
      setActiveMenu(null);
      setClosing(false);
      closeTimerRef.current = null;
      if (restoreFocus) {
        const fallback = headerRef.current?.querySelector<HTMLElement>(
          window.matchMedia('(max-width: 760px)').matches ? '.hp-mobile-menu' : '.hp-nav [data-nav-key="collections"]',
        );
        (triggerRef.current?.isConnected ? triggerRef.current : fallback)?.focus({ preventScroll: true });
      }
    }, delay);
  };

  const toggleMenu = (key: NavKey, trigger: HTMLElement) => {
    if (activeMenu === key && !closing) {
      triggerRef.current = trigger;
      closeMenu();
    } else showMenu(key, trigger);
  };

  const openBanner = (audience: 'mens' | 'womens', trigger: HTMLElement) => {
    showMenu('collections', trigger, audience === 'mens' ? 0 : 1);
  };

  const explore = () => {
    if (!activeMenu || !activeGroup || !activeLeaf) return;
    const targetKey = activeLeaf.destination ?? activeGroup.destination ?? activeMenu;
    const targetGroup = targetKey === 'womens' ? menus.collections.groups[1]
      : targetKey === 'mens' ? menus.collections.groups[0] : activeGroup;
    const targetImage = targetKey === 'womens' ? womenImage
      : targetKey === 'mens' ? 'mens-windrunner.webp'
        : activeLeaf.image ?? activeGroup.image;
    const targetTitle = targetKey === 'womens' ? 'WOMEN’S MODEST COMBAT'
      : targetKey === 'mens' ? 'MEN’S LUXURY PERFORMANCE'
        : activeLeaf.title;
    const targetDescription = targetKey === 'womens'
      ? 'Full-coverage performance layers, designed for confidence in motion.'
      : targetKey === 'mens'
        ? 'Technical apparel, heavyweight layers, combat shorts and walkout clothing.'
        : activeLeaf.description;
    setDestination({
      key: targetKey,
      title: targetTitle,
      description: targetDescription,
      image: targetImage,
      group: targetGroup,
      leaf: activeLeaf,
    });
    closeMenu(false);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
  };

  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)');
    const onChange = () => {
      setIsMobile(media.matches);
      measurePanelTop();
    };
    media.addEventListener('change', onChange);
    window.addEventListener('resize', measurePanelTop);
    return () => {
      media.removeEventListener('change', onChange);
      window.removeEventListener('resize', measurePanelTop);
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!panelOpen) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    measurePanelTop();
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
      if (event.key !== 'Tab' || !isMobile || !panelRef.current) return;
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), summary')]
        .filter((item) => item.getClientRects().length > 0);
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
    openFocusTimerRef.current = window.setTimeout(() => {
      if (!closing) panelRef.current?.querySelector<HTMLElement>('[data-subcategory]')?.focus({ preventScroll: true });
    }, 20);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      if (openFocusTimerRef.current !== null) {
        window.clearTimeout(openFocusTimerRef.current);
        openFocusTimerRef.current = null;
      }
    };
  }, [panelOpen, isMobile]);

  const goHome = () => {
    setDestination(null);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const destinationImage = destination?.image
    ? image(destination.image)
    : destination?.key === 'bio-lab' ? image(fabricImage)
      : destination?.key === 'hardware' ? image(combatEditorial)
        : destination?.key === 'house' ? image(campaignImage)
          : destination?.key === 'private' ? image('approved-shield.png')
            : image(apparelImage);

  return (
    <div className="hp-site">
      <div className="hp-announcement">FSD / THE HOUSE OF PERFORMANCE <span>— PRE-LAUNCH DESIGN PROOF</span></div>
      <header className="hp-header" ref={headerRef}>
        <button className="hp-brand" type="button" aria-label="FSD home" data-home onClick={goHome}>
          <img src={image('approved-header-logo.png')} alt="FSD Fitness & Self-Defense" />
        </button>
        <nav className="hp-nav" aria-label="Primary navigation">
          {navOrder.map((key) => <button key={key} type="button" data-nav-key={key} aria-expanded={activeMenu === key}
            onClick={(event) => toggleMenu(key, event.currentTarget)}>{menus[key].label}</button>)}
        </nav>
        <span className="hp-header-note">UNITED KINGDOM · PRE-LAUNCH</span>
        <button className="hp-mobile-menu" type="button" aria-label={panelOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={panelOpen} onClick={(event) => panelOpen ? closeMenu() : showMenu('collections', event.currentTarget)}>
          <span>{panelOpen ? 'CLOSE' : 'MENU'}</span><i aria-hidden="true" />
        </button>

        {panelOpen && (
          <section className={`hp-panel ${closing ? 'is-closing' : 'is-open'} ${isMobile ? 'hp-panel--mobile' : ''} ${activeMenu === 'private' ? 'hp-panel--private' : ''}`}
            style={{ '--hp-panel-top': `${panelTop}px` } as CSSProperties & { '--hp-panel-top': string }}
            data-category-panel data-state={closing ? 'closing' : 'open'}
            role="dialog" aria-modal={isMobile} aria-label={`${menus[activeMenu].label} selector`} ref={panelRef}>
            <div className="hp-panel-inner">
              <div className="hp-panel-heading">
                <div><p className="hp-kicker">{menus[activeMenu].kicker}</p><h2>{menus[activeMenu].label}</h2></div>
                <button className="hp-close" type="button" onClick={() => closeMenu()} aria-label="Close category selector">CLOSE <b aria-hidden="true">×</b></button>
              </div>
              <nav className="hp-panel-primary" aria-label="Choose a primary category">
                {navOrder.map((key) => <button type="button" key={key} data-nav-key={key}
                  aria-pressed={activeMenu === key} onClick={() => showMenu(key)}>{menus[key].label}</button>)}
              </nav>
              <nav className="hp-group-tabs" aria-label={`Choose a ${menus[activeMenu].label} group`}>
                {groups.map((group, index) => <button type="button" key={group.title} aria-pressed={groupIndex === index}
                  onClick={() => { setGroupIndex(index); setLeafIndex(0); }}>{group.title}</button>)}
              </nav>
              <div className="hp-panel-content">
                <nav className="hp-group-list" aria-label={`${menus[activeMenu].label} groups`}>
                  <p className="hp-list-heading">COLLECTION GROUPS</p>
                  {groups.map((group, index) => <button type="button" key={group.title}
                    aria-pressed={groupIndex === index} className={groupIndex === index ? 'is-selected' : ''}
                    onClick={() => { setGroupIndex(index); setLeafIndex(0); }}>
                    <span>{String(index + 1).padStart(2, '0')}</span>{group.title}<b aria-hidden="true">↗</b>
                  </button>)}
                </nav>
                <nav className="hp-leaf-list" aria-label={`${activeGroup?.title ?? menus[activeMenu].label} subcategories`}>
                  <p className="hp-list-heading">SUBCATEGORIES</p>
                  {leaves.map((item, index) => <button type="button" key={item.title} data-subcategory={item.title}
                    aria-pressed={leafIndex === index} className={leafIndex === index ? 'is-selected' : ''}
                    onClick={() => setLeafIndex(index)}><span>{String(index + 1).padStart(2, '0')}</span>{item.title}<b aria-hidden="true">↗</b></button>)}
                </nav>
                <aside className="hp-preview" aria-live="polite">
                  {activeLeaf?.image || activeGroup?.image
                    ? <img src={image(activeLeaf?.image ?? activeGroup?.image ?? '')} alt="" />
                    : <div className="hp-preview-mark"><img src={image('approved-shield.png')} alt="" /><span>THE HOUSE OF PERFORMANCE</span></div>}
                  <div className="hp-preview-copy">
                    <span className="hp-preview-index">FSD / {String(leafIndex + 1).padStart(2, '0')}</span>
                    <h3>{activeLeaf?.title}</h3>
                    <p>{activeLeaf?.description}</p>
                    {activeMenu === 'private' && <p className="hp-pending-note">Registration remains non-collecting. Privacy information is pending approved content.</p>}
                    <button type="button" data-explore-collection onClick={explore}>EXPLORE COLLECTION <b aria-hidden="true">↗</b></button>
                  </div>
                </aside>
              </div>
              <div className="hp-panel-foot"><span>{menus[activeMenu].note}</span><span>ESC TO CLOSE</span></div>
            </div>
          </section>
        )}
      </header>
      {isMobile && panelOpen && <button className="hp-mobile-scrim" style={{ '--hp-scrim-top': `${panelTop}px` } as CSSProperties & { '--hp-scrim-top': string }} type="button" aria-label="Close navigation" onClick={() => closeMenu()} />}

      {destination ? (
        <main className="hp-destination" data-destination={destination.key}>
          <section className="hp-destination-hero">
            <img src={destinationImage} alt={destination.key === 'womens' ? 'Approved FSD Velocity modest performance image' : destination.key === 'mens' ? 'FSD Cheetah Windrunner supplied apparel image' : destination.key === 'hardware' ? 'FSD boxing editorial context' : ''} />
            <div className="hp-destination-shade" />
            <div className="hp-destination-copy">
              <p className="hp-kicker">FSD / COLLECTION PREVIEW</p>
              <h1>{destination.title}</h1>
              <p>{destination.description}</p>
              <span>PROTOTYPE DESTINATION · NOT A PRODUCTION ROUTE</span>
            </div>
            <div className="hp-destination-mark">FSD <i>—</i> THE HOUSE OF PERFORMANCE</div>
          </section>
          <section className="hp-destination-detail">
            <div>
              <p className="hp-kicker">{destination.key === 'womens' ? 'WOMEN’S MODEST COMBAT' : destination.group.title}</p>
              <h2>{destination.key === 'womens' ? 'MADE FOR MOVEMENT.' : destination.key === 'mens' ? 'BUILT FOR THE DRIVE WITHIN.' : destination.leaf.title}</h2>
              <p>{destination.key === 'womens'
                ? 'Performance hijabs, longline tunics and half-zips, tapered combat trackpants, and full-coverage base-layer concepts.'
                : destination.description}</p>
            </div>
            <div className="hp-destination-items">
              {destination.group.children.map((item) => <article key={item.title}><span>FSD / COLLECTION</span><h3>{item.title}</h3><p>{item.description}</p></article>)}
            </div>
            <p className="hp-destination-disclaimer">Concepts, capabilities, specifications, pricing and availability are not confirmed. This view is a design prototype only.</p>
            <button className="hp-return-home" type="button" data-home onClick={goHome}>← RETURN TO THE HOUSE</button>
          </section>
        </main>
      ) : (
        <main id="home">
          <section className="hp-hero" aria-labelledby="hp-hero-title">
            <img className="hp-hero-image" src={image(campaignImage)} alt="FSD boxing campaign editorial" />
            <div className="hp-hero-shade" />
            <div className="hp-hero-content">
              <p className="hp-hero-eyebrow"><span /> THE FSD PERFORMANCE HOUSE · UNITED KINGDOM</p>
              <h1 id="hp-hero-title">BUILT FOR<br /><em>THE DRIVE</em><br />WITHIN.</h1>
              <p className="hp-hero-philosophy">{collectionHero}</p>
              <div className="hp-hero-actions">
                <button className="hp-primary-action" type="button" data-primary-action onClick={(event) => showMenu('collections', event.currentTarget)}>EXPLORE COLLECTIONS <b aria-hidden="true">↗</b></button>
                <button className="hp-secondary-action" type="button" onClick={(event) => showMenu('house', event.currentTarget)}>DISCOVER THE HOUSE <b aria-hidden="true">↗</b></button>
              </div>
              <p className="hp-hero-footnote">DISCIPLINE / IDENTITY / PROGRESS</p>
            </div>
            <div className="hp-hero-index"><span>01</span> — FSD / PERFORMANCE</div>
          </section>

          <section className="hp-collections" aria-labelledby="hp-collections-title">
            <div className="hp-section-head">
              <div><p className="hp-kicker">THE COLLECTION SYSTEM</p><h2 id="hp-collections-title">MADE TO MOVE.<br /><em>MADE TO BELONG.</em></h2></div>
              <p>Two distinct expressions.<br />One disciplined point of view.</p>
            </div>
            <div className="hp-banner-grid">
              <Banner audience="mens" src={apparelImage} label="01 / MEN’S PERFORMANCE" title="MEN’S LUXURY PERFORMANCE" copy="Technical apparel for focused training and life beyond it." onOpen={(trigger) => openBanner('mens', trigger)} />
              <Banner audience="womens" src={womenImage} label="02 / WOMEN’S MODEST COMBAT" title="WOMEN’S MODEST COMBAT" copy="Full-coverage layers. Strength without compromise." onOpen={(trigger) => openBanner('womens', trigger)} />
            </div>
            <p className="hp-editorial-note">A considered collection preview. Supplied product names and imagery remain unchanged.</p>
          </section>

          <section className="hp-biolab" aria-labelledby="hp-biolab-title">
            <div className="hp-biolab-image"><img src={image(fabricImage)} alt="FSD fabric study, a material editorial" loading="lazy" /><span>FSD / MATERIAL STUDY</span></div>
            <div className="hp-biolab-copy">
              <p className="hp-kicker">FSD BIO-LAB™ / DESIGN DIRECTIONS</p>
              <h2 id="hp-biolab-title">INTELLIGENCE<br /><em>IN MOTION.</em></h2>
              <p>Wearable technology and smartwear concepts explored with precision. Capabilities remain conceptual and are not represented as verified.</p>
              <div className="hp-biolab-meta"><span>SMARTWEAR</span><span>WEARABLE TECHNOLOGY</span><span>RECOVERY INNOVATION</span><span>DIGITAL INTEGRATION</span></div>
              <button type="button" data-nav-key="bio-lab" onClick={(event) => showMenu('bio-lab', event.currentTarget)}>EXPLORE BIO-LAB™ <b aria-hidden="true">↗</b></button>
            </div>
          </section>

          <section className="hp-hardware" aria-labelledby="hp-hardware-title">
            <div className="hp-hardware-copy">
              <p className="hp-kicker">FSD HARDWARE / TRAINING SYSTEMS</p>
              <h2 id="hp-hardware-title">ENGINEERED FOR<br />THE DEMANDS OF<br /><em>PERFORMANCE.</em></h2>
              <p>Equipment should earn its place in training. Where product photography is not approved, we show the training context—not an invented product.</p>
              <ul>
                <li><span>01</span> Strength equipment · dumbbell collections</li>
                <li><span>02</span> Boxing and combat equipment</li>
                <li><span>03</span> Training accessories · weighted skipping ropes</li>
                <li><span>04</span> Recovery equipment concepts</li>
              </ul>
              <button type="button" data-nav-key="hardware" onClick={(event) => showMenu('hardware', event.currentTarget)}>EXPLORE HARDWARE <b aria-hidden="true">↗</b></button>
            </div>
            <figure className="hp-hardware-image"><img src={image(combatEditorial)} alt="FSD boxing editorial representing the combat training context" loading="lazy" /><figcaption>FSD / COMBAT CULTURE — EDITORIAL IMAGE</figcaption></figure>
          </section>

          <section className="hp-house" aria-labelledby="hp-house-title">
            <div className="hp-house-intro">
              <img src={image('approved-shield.png')} alt="" />
              <div><p className="hp-kicker">THE FSD HOUSE / PHILOSOPHY</p><h2 id="hp-house-title">BEYOND<br /><em>PERFORMANCE.</em></h2>
                <p>A British luxury performance house built around discipline, craft and the belief that confidence is earned in motion.</p>
              </div>
            </div>
            <div className="hp-house-values">
              <div><span>01 / PRINCIPLE</span><p>Luxury in its expression.</p></div>
              <div><span>02 / PURPOSE</span><p>Performance in its purpose.</p></div>
              <div><span>03 / PRACTICE</span><p>Fitness. Discipline. Progress. A stronger you.</p></div>
              <div><span>04 / HORIZON</span><p>Global ambitions and athlete development.</p></div>
              <p className="hp-locations">Proposed flagship studies: Dublin · Belfast · Manchester · Islamabad. None are represented as operating.</p>
              <button type="button" data-nav-key="house" onClick={(event) => showMenu('house', event.currentTarget)}>MEET THE HOUSE <b aria-hidden="true">↗</b></button>
            </div>
          </section>

          <section className="hp-private" aria-labelledby="hp-private-title">
            <div className="hp-private-copy"><p className="hp-kicker">PRIVATE ACCESS / PRE-LAUNCH</p><h2 id="hp-private-title">BE PART OF<br /><em>WHAT COMES NEXT.</em></h2><p>A registration experience preview only. Registration is deferred; this page does not collect contact details.</p></div>
            <form className="hp-registration" onSubmit={(event) => event.preventDefault()}>
              <label htmlFor="hp-email">EMAIL ADDRESS</label>
              <input id="hp-email" type="email" placeholder="Registration preview — unavailable" disabled />
              <label className="hp-consent"><input type="checkbox" disabled /> Consent wording is pending approved content. This disabled control does not store information.</label>
              <button type="button" disabled>REGISTRATION PREVIEW <b aria-hidden="true">↗</b></button>
              <details className="hp-privacy"><summary>Privacy information — pending approval</summary><p>No email or consent is collected by this prototype. Registration will remain unavailable until the destination, privacy policy and consent wording are approved.</p></details>
            </form>
          </section>
        </main>
      )}

      <footer className="hp-footer"><img src={image('approved-header-logo.png')} alt="FSD Fitness & Self-Defense" /><p>THE REFINEMENT OF LUXURY FASHION. THE ENERGY OF ELITE SPORT. THE PRECISION OF PERFORMANCE ENGINEERING. THE INNOVATION OF MODERN TECHNOLOGY.</p><span>© FSD / DESIGN PROOF · NOT A LIVE STORE</span></footer>
    </div>
  );
}

export default HousePlus;
