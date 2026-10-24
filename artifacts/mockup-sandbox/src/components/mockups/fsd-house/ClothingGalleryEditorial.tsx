import { useRef, useState } from 'react';
import './ClothingGalleryEditorial.css';

type CollectionKey = 'mens' | 'womens';
type Subcategory = { title: string; items: string[]; concepts?: string[] };

const hijabImage = '/__mockup/images/fsd-house/velocity-hijab.jpg';

const collections: Record<CollectionKey, { title: string; kicker: string; subcategories: Subcategory[] }> = {
  mens: {
    title: 'MEN’S LUXURY PERFORMANCE',
    kicker: 'PERFORMANCE APPAREL & COMBAT TRAINING',
    subcategories: [
      {
        title: '500 GSM Hoodies & Tracksuits',
        items: ['FSD 500 GSM Combat Hoodie', 'FSD Technical Tracksuit', 'FSD Low-Light Reflective Tracksuit'],
      },
      {
        title: '2-in-1 Combat Training Shorts & Tanks',
        items: [],
        concepts: ['2-in-1 Combat Training Shorts & Tanks'],
      },
      {
        title: 'Walkout Robes & Bomber Jackets',
        items: ['FSD Tiger-Slash 550 GSM Walkout Hoodie', 'FSD Championship Walkout Bomber', 'FSD Signature Walkout Jacket'],
        concepts: ['Walkout Robes'],
      },
      { title: 'Volcanic Amber Capsule', items: [], concepts: ['Volcanic Amber Capsule'] },
      { title: 'Vector Camo Capsule', items: ['FSD Vector-Camo Windrunner'] },
    ],
  },
  womens: {
    title: 'WOMEN’S MODEST COMBAT',
    kicker: 'PERFORMANCE APPAREL & MODEST MOVEMENT',
    subcategories: [
      {
        title: 'Performance Hijabs',
        items: [
          'FSD Velocity Performance Sports Hijab',
          'FSD Performance Sports Hijab',
          'FSD Flow Running Hijab (Presentation Box Edition)',
          'FSD Cover Extended-Coverage Sports Hijab',
        ],
        concepts: ['Pro Combat Magnetic Performance Hijabs'],
      },
      {
        title: 'Longline Tunics & Half-Zips',
        items: [
          "FSD Form Women's Modest Training Top",
          "FSD Women's Lightweight Modest Training Overshirt",
        ],
      },
      {
        title: 'Technical Tapered Combat Trackpants',
        items: ['FSD Modest Flow Training Trousers'],
        concepts: ['Technical Tapered Combat Trackpants'],
      },
      {
        title: 'Full-Coverage Compression Base Layers',
        items: [],
        concepts: ['Full-Coverage Compression Base Layers'],
      },
    ],
  },
};

export default function ClothingGalleryEditorial() {
  const [collection, setCollection] = useState<CollectionKey>('womens');
  const [activeIndex, setActiveIndex] = useState(0);
  const catalogueRef = useRef<HTMLElement>(null);
  const activeCollection = collections[collection];
  const activeSubcategory = activeCollection.subcategories[activeIndex];
  const isHijabContext = collection === 'womens' && activeSubcategory.title === 'Performance Hijabs';

  const selectCollection = (key: CollectionKey) => {
    setCollection(key);
    setActiveIndex(0);
  };

  return (
    <main className="clothing-editorial">
      <div className="ce-topline">
        <span>FSD / COLLECTIONS</span>
        <span className="ce-topline-center">PERFORMANCE · DISCIPLINE · IDENTITY</span>
        <span>PREVIEW — NOT FOR SALE</span>
      </div>

      <header className={`ce-hero ${isHijabContext ? 'ce-hero--image' : 'ce-hero--type'}`}>
        <div className="ce-hero-copy">
          <p className="ce-eyebrow"><i /> THE FSD CLOTHING COLLECTION</p>
          <p className="ce-hero-index">COLLECTION STUDY&nbsp; / &nbsp;01—02</p>
          <h1>Built for<br /><em>the drive within.</em></h1>
          <p className="ce-hero-description">
            Performance apparel, combat training, and modest movement.
          </p>
          <button className="ce-hero-cta" type="button" onClick={() => catalogueRef.current?.scrollIntoView()}>
            <span>EXPLORE THE COLLECTION</span>
            <span aria-hidden="true">↓</span>
          </button>
        </div>
        <div className="ce-hero-media">
          {isHijabContext ? (
            <>
              <img src={hijabImage} alt="FSD Velocity Performance Sports Hijab — black and gold sports hijab with matching performance top" />
              <span className="ce-image-caption">FSD VELOCITY / PERFORMANCE HIJABS</span>
              <span className="ce-image-counter">01 <i /> 01</span>
            </>
          ) : (
            <div className="ce-hero-typography" aria-hidden="true">
              <span>F</span><i />
              <small>FORM FOLLOWS<br />DISCIPLINE</small>
            </div>
          )}
        </div>
        <span className="ce-hero-side-label">FSD APPAREL&nbsp; / &nbsp;REFERENCE EDITION</span>
      </header>

      <section className="ce-catalogue" aria-label="Clothing collection catalogue" ref={catalogueRef}>
        <div className="ce-collection-row">
          <div className="ce-section-label"><span>01</span> COLLECTIONS</div>
          <nav className="ce-collection-tabs" aria-label="Clothing collections">
            {(Object.keys(collections) as CollectionKey[]).map((key, index) => (
              <button
                key={key}
                type="button"
                className={collection === key ? 'is-active' : ''}
                aria-pressed={collection === key}
                onClick={() => selectCollection(key)}
              >
                <span>0{index + 1}</span>{collections[key].title}
              </button>
            ))}
          </nav>
        </div>

        <div className="ce-catalogue-heading">
          <div>
            <p className="ce-eyebrow"><i /> {activeCollection.kicker}</p>
            <h2>{activeCollection.title}</h2>
          </div>
          <p className="ce-catalogue-note">A considered index of the FSD apparel collection.</p>
        </div>

        <div className="ce-content-grid">
          <nav className="ce-subcategory-list" aria-label={`${activeCollection.title} subcategories`}>
            {activeCollection.subcategories.map((subcategory, index) => (
              <button
                key={subcategory.title}
                type="button"
                className={activeIndex === index ? 'is-active' : ''}
                aria-pressed={activeIndex === index}
                onClick={() => setActiveIndex(index)}
              >
                <span className="ce-sub-index">0{index + 1}</span>
                <span>{subcategory.title}</span>
                <span className="ce-sub-arrow" aria-hidden="true">↗</span>
              </button>
            ))}
          </nav>

          <div className="ce-gallery" key={`${collection}-${activeIndex}`}>
            <div className="ce-gallery-head">
              <div>
                <span className="ce-gallery-kicker">FSD APPAREL&nbsp; / &nbsp;{String(activeIndex + 1).padStart(2, '0')}</span>
                <h3>{activeSubcategory.title}</h3>
              </div>
              <span className="ce-gallery-count">{String(activeSubcategory.items.length + (activeSubcategory.concepts?.length ?? 0) || 1).padStart(2, '0')} ENTRIES</span>
            </div>

            {isHijabContext ? (
              <div className="ce-product-layout">
                <article className="ce-feature-product">
                  <div className="ce-feature-image">
                    <img src={hijabImage} alt="FSD Velocity Performance Sports Hijab — black and gold sports hijab with matching performance top" />
                    <span className="ce-image-caption">FSD VELOCITY / PERFORMANCE HIJABS</span>
                  </div>
                  <div className="ce-feature-meta">
                    <span>PREVIEW / REFERENCE ONLY</span>
                    <span>NOT FOR SALE</span>
                  </div>
                  <h4>FSD Velocity<br />Performance Sports Hijab</h4>
                  <p>Reference only · not for sale</p>
                </article>
                <div className="ce-text-index">
                  <p className="ce-index-heading">COLLECTION INDEX <span>01—05</span></p>
                  {activeSubcategory.items.filter(name => name !== 'FSD Velocity Performance Sports Hijab').map((name, index) => (
                    <article className="ce-index-item" key={name}>
                      <span>0{index + 2}</span>
                      <h4>{name}</h4>
                      <small>TEXT REFERENCE / NO PRODUCT IMAGE</small>
                    </article>
                  ))}
                  {activeSubcategory.concepts?.map((concept) => (
                    <article className="ce-index-item ce-index-item--concept" key={concept}>
                      <span>0{activeSubcategory.items.length + 1}</span>
                      <h4>{concept}</h4>
                      <small>COLLECTION CONCEPT</small>
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <div className="ce-text-gallery">
                {[...activeSubcategory.items, ...(activeSubcategory.concepts || [])].length ? (
                  [...activeSubcategory.items, ...(activeSubcategory.concepts || [])].map((entry, index) => (
                    <article className={`ce-editorial-entry ${index % 3 === 1 ? 'ce-editorial-entry--offset' : ''}`} key={entry}>
                      <span className="ce-entry-number">0{index + 1} / {activeSubcategory.concepts?.includes(entry) ? 'CONCEPT' : 'COLLECTION INDEX'}</span>
                      <h4>{entry}</h4>
                      <span className="ce-entry-note">
                        {activeSubcategory.concepts?.includes(entry) ? 'COLLECTION CONCEPT' : 'TEXT REFERENCE / NO PRODUCT IMAGE'}
                      </span>
                    </article>
                  ))
                ) : (
                  <article className="ce-editorial-entry ce-editorial-entry--statement">
                    <span className="ce-entry-number">FSD / COLLECTION CONCEPT</span>
                    <h4>{activeSubcategory.title}</h4>
                    <span className="ce-entry-note">No product image mapped for this collection.</span>
                  </article>
                )}
              </div>
            )}
            <p className="ce-gallery-footnote">Images are shown only with their mapped products.</p>
          </div>
        </div>
      </section>

      <footer className="ce-disclaimer">
        <span className="ce-disclaimer-mark">FSD</span>
        <p>Prices shown are for reference only and are not offers to sell. Concepts do not confirm specifications, availability or operational status. Images are shown only with their mapped products.</p>
        <span className="ce-disclaimer-code">COLLECTIONS / PREVIEW</span>
      </footer>
    </main>
  );
}
