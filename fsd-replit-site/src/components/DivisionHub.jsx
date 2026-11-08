import { useState } from 'react';
import {
  collectionDivisions,
} from '../collection-divisions.js';
import { CLOTHING_LINES, deriveClothingLineMembership } from '../clothing-lines.js';
import { STRATEGIC_CONCEPTS } from '../strategic-concepts.js';
import { HOUSE_PAGE_REGISTRY, shouldDisableHouseHref } from '../data/house-page-readiness.js';
import { flagshipPageDefinitions } from '../flagship-pages.js';
import { customerFacingCategory, priceInfo, products, productImagesForDisplay } from '../data/products.js';
import { productSeoPath } from '../product-structured-data.js';
import { ImagePlaceholder } from './ImagePlaceholder.jsx';
import { SafeImage } from './SafeImage.jsx';
import './DivisionHub.css';

const divisions = [
  { id: 'shop', label: 'SHOP', href: '/shop', intro: 'Browse the established FSD catalogue, collection lines and product records.' },
  { id: 'universe', label: 'UNIVERSE', href: '/universe', intro: 'Explore the wider FSD ecosystem, global vision and community concepts.' },
  { id: 'bio-lab', label: 'BIO-LAB™', href: '/bio-lab', intro: 'Research-led concepts in materials, connected apparel and personalisation.' },
  { id: 'hardware', label: 'HARDWARE', href: '/hardware', intro: 'Explore existing training equipment records and the FSD hardware division.' },
  { id: 'house', label: 'THE HOUSE', href: '/the-house.html', intro: 'The FSD story, its six established House divisions and mapped strategic concepts.' },
  { id: 'private-access', label: 'PRIVATE ACCESS', href: '/private-access', intro: 'Private enquiry information and access concepts. Registration and unconfigured submissions remain unavailable.' },
];

const divisionPaths = Object.freeze({
  shop: '/shop',
  universe: '/universe',
  'bio-lab': '/bio-lab',
  hardware: '/hardware',
  house: '/the-house.html',
  'private-access': '/private-access',
});

const clothingLinesWithProducts = deriveClothingLineMembership(products).lines;

function representativeImageFor(productList) {
  const images = productList.flatMap(product => productImagesForDisplay(product).map(image => ({
    ...image,
    productName: product.name,
  })));
  const image = images.find(item => /\b(lifestyle|hero|campaign|action|training)\b/i.test(item.label || ''))
    || images.find(item => /\bfront\b/i.test(item.label || ''))
    || images[0];
  if (!image) return null;
  return {
    ...image,
    fit: /\b(lifestyle|hero|campaign|action|training)\b/i.test(image.label || '') ? 'cover' : 'contain',
  };
}

function linkForConcept(concept) {
  return concept.href || '#fsd-strategic-concepts';
}

function ShopCardMedia({ card }) {
  const [failedSource, setFailedSource] = useState('');
  const pending = !card.image?.src || failedSource === card.image.src;
  const mediaClass = `fsd-division-hub-card__media${card.image?.fit ? ` is-${card.image.fit}` : ''}`;

  return (
    <span className={mediaClass}>
      {pending ? (
        <ImagePlaceholder
          title={card.title}
          kind={card.mediaKind || 'collection'}
          viewLabel={card.mediaViewLabel || 'Collection image'}
          pendingLabel="IMAGE PENDING"
          className="fsd-shop-card__placeholder"
        />
      ) : (
        <>
          <SafeImage
            src={card.image.src}
            alt={`${card.image.productName || card.title} — ${card.image.label}`}
            placeholderTitle={card.title}
            placeholderKind={card.mediaKind || 'collection'}
            className="fsd-division-hub-card__image"
            onError={() => setFailedSource(card.image.src)}
          />
          <span className="fsd-division-hub-card__image-note" aria-hidden="true">
            FSD / APPROVED PRODUCT IMAGE
          </span>
        </>
      )}
    </span>
  );
}

function getDivisionSections(id) {
  if (id === 'shop') {
    const audienceCollections = [
      {
        title: 'Women’s collections',
        href: '/collections/women',
        description: 'Browse the catalogued women’s products.',
        meta: 'WOMEN’S COLLECTIONS',
        products: products.filter(product => /^women/i.test(product.audience || '')),
      },
      {
        title: 'Men’s collections',
        href: '/collections/men',
        description: 'Browse the catalogued men’s products.',
        meta: 'MEN’S COLLECTIONS',
        products: products.filter(product => /^men/i.test(product.audience || '')),
      },
      {
        title: 'Training accessories',
        href: '/collections/accessories',
        description: 'Browse accessories in the current catalogue.',
        meta: 'TRAINING ACCESSORIES',
        products: products.filter(product => /accessor/i.test(
          [product.category, ...(product.alsoShowIn || [])].join(' '),
        )),
      },
      {
        title: 'Full catalogue',
        href: '/#products',
        description: 'Open the full catalogue and its existing filters.',
        meta: 'ALL PRODUCTS',
        products,
      },
    ];
    return [
      {
        label: 'Shop by audience',
        description: 'Shop the existing catalogue through its established audience routes.',
        gridClass: 'fsd-shop-grid--audiences',
        cards: audienceCollections.map(collection => ({
          title: collection.title,
          href: collection.href,
          description: collection.description,
          meta: collection.meta,
          image: representativeImageFor(collection.products),
          visual: true,
          mediaKind: 'collection',
          mediaViewLabel: 'Collection image',
        })),
      },
      {
        label: 'Established clothing lines',
        description: 'Seven established lines, shown with mapped product imagery where available.',
        gridClass: 'fsd-shop-grid--lines',
        cards: CLOTHING_LINES.map(line => {
          const lineProducts = clothingLinesWithProducts.find(item => item.id === line.id)?.products || [];
          return {
            title: line.title,
            href: `/collections/${line.id}`,
            description: line.eyebrow,
            meta: line.audience,
            image: representativeImageFor(lineProducts),
            visual: true,
            mediaKind: 'collection',
            mediaViewLabel: 'Clothing-line image',
          };
        }),
      },
      {
        label: 'Product records',
        description: 'A focused selection from the existing product register. Prices appear only where already confirmed.',
        gridClass: 'fsd-shop-grid--products',
        cards: products.slice(0, 8).map(product => ({
          title: product.name,
          href: productSeoPath(product),
          description: product.audience || '',
          meta: customerFacingCategory(product.category),
          price: priceInfo(product).value,
          image: representativeImageFor([product]),
          visual: true,
          mediaKind: 'product',
          mediaViewLabel: 'Product image',
        })),
      },
    ];
  }

  if (id === 'universe') {
    const globalDivision = collectionDivisions.find(item => item.id === 'global');
    const concepts = STRATEGIC_CONCEPTS.filter(concept =>
      concept.primaryDivision === 'UNIVERSE'
      || concept.crossLinks.some(link => link.division === 'UNIVERSE'));
    return [
      {
        label: 'Explore the divisions',
        description: globalDivision?.description || '',
        cards: [
          { title: 'FSD Universe overview', href: '/#universe', description: 'Open the existing global vision and community page.' },
          ...divisions.filter(item => item.id !== 'universe').map(item => ({
            title: item.label,
            href: item.href,
            description: item.intro,
          })),
        ],
      },
      {
        label: 'Mapped to UNIVERSE',
        description: 'Strategic concepts retain their existing primary division and cross-links.',
        cards: concepts.map(concept => ({
          title: concept.title,
          href: linkForConcept(concept),
          description: concept.summary,
          meta: `${concept.primaryDivision} / ${concept.primarySection}`,
          crossLinks: concept.crossLinks,
        })),
      },
      ...(globalDivision?.groups || []).map(group => ({
        label: group.title,
        description: group.overview,
        cards: (group.concepts || []).map(title => ({
          title,
          href: title === 'Professional Fight Promotions' ? '/fight-promotions.html' : '/the-house.html',
          description: group.overview,
        })),
      })),
    ];
  }

  if (id === 'bio-lab') {
    const pages = flagshipPageDefinitions.filter(page => page.bioLabConcept
      || page.id === 'adaptive-technical-fabrics');
    const concepts = STRATEGIC_CONCEPTS.filter(concept =>
      concept.primaryDivision === 'BIO-LAB™'
      || concept.crossLinks.some(link => link.division === 'BIO-LAB™'));
    return [
      {
        label: 'Research areas',
        description: 'Concept pages keep proposal status distinct from verified products, tests or services.',
        cards: [
          { title: 'BIO-LAB™ Innovation Hub', href: '/#innovation-hub', description: 'Open the existing division feature and its current editorial content.' },
          ...pages.map(page => ({
            title: page.title,
            href: page.id === 'genetic-microbiome-personalisation'
              ? '/genetic-microbiome.html'
              : `/#${page.id}`,
            description: page.summary,
            meta: page.initiative ? 'PROPOSED CONCEPT' : 'CONCEPT DETAILS',
          })),
        ],
      },
      {
        label: 'Strategic concept mapping',
        description: 'The original division placements and cross-links remain in the concept register.',
        cards: concepts.map(concept => ({
          title: concept.title,
          href: linkForConcept(concept),
          description: concept.summary,
          meta: `${concept.primaryDivision} / ${concept.primarySection}`,
          crossLinks: concept.crossLinks,
        })),
      },
    ];
  }

  if (id === 'hardware') {
    const division = collectionDivisions.find(item => item.id === 'hardware');
    const concepts = STRATEGIC_CONCEPTS.filter(concept =>
      concept.primaryDivision === 'HARDWARE'
      || concept.crossLinks.some(link => link.division === 'HARDWARE'));
    const hardwareProducts = products.filter(product =>
      /hardware|gym hardware|combat and mma/i.test(product.category || ''));
    return [
      {
        label: 'Division overview',
        description: 'The existing Hardware feature remains available alongside catalogued equipment.',
        cards: [{
          title: 'Hardware editorial overview',
          href: '/#hardware-editorial',
          description: 'Open the existing FSD Hardware feature and its approved image status.',
        }],
      },
      ...(division?.groups || []).map(group => ({
        label: group.title,
        description: group.overview,
        cards: (group.categories || []).map(category => ({
          title: category,
          href: `/#products`,
          description: 'Open the full catalogue and use its existing filters.',
        })),
      })),
      {
        label: 'Catalogued equipment',
        description: 'Only existing product records and approved mapped imagery are shown.',
        cards: hardwareProducts.slice(0, 8).map(product => ({
          title: product.name,
          href: productSeoPath(product),
          description: product.rowPrice?.value || product.price || product.category || '',
          image: productImagesForDisplay(product)[0],
        })),
      },
      ...(concepts.length ? [{
        label: 'Mapped concepts',
        description: 'Concept records are not presented as available products.',
        cards: concepts.map(concept => ({
          title: concept.title,
          href: linkForConcept(concept),
          description: concept.summary,
          meta: `${concept.primaryDivision} / ${concept.primarySection}`,
        })),
      }] : []),
    ];
  }

  if (id === 'house') {
    const concepts = STRATEGIC_CONCEPTS.filter(concept =>
      concept.primaryDivision === 'THE HOUSE'
      || concept.crossLinks.some(link => link.division === 'THE HOUSE'));
    return [
      {
        label: 'Six established divisions',
        description: 'Navigate the complete FSD website architecture.',
        cards: divisions.map(item => ({
          title: item.label,
          href: item.href,
          description: item.intro,
        })),
      },
      {
        label: 'House destinations',
        description: 'Unavailable destinations remain visibly disabled according to their existing publication readiness.',
        cards: HOUSE_PAGE_REGISTRY.map(page => ({
          title: page.title,
          href: page.path,
          description: page.division,
          disabled: shouldDisableHouseHref(page.path),
          meta: page.readiness === 'NOT_READY' ? 'PREVIEW / LINK DISABLED' : '',
        })),
      },
      {
        label: 'Mapped House concepts',
        description: 'Existing concept meanings and cross-division placements are retained.',
        cards: concepts.map(concept => ({
          title: concept.title,
          href: linkForConcept(concept),
          description: concept.summary,
          meta: `${concept.primaryDivision} / ${concept.primarySection}`,
          crossLinks: concept.crossLinks,
        })),
      },
    ];
  }

  const tacticalShield = STRATEGIC_CONCEPTS.find(concept => concept.id === 'tactical-shield-membership');
  const enquiryPage = HOUSE_PAGE_REGISTRY.find(page => page.path === '/enquiries.html');
  return [
    {
      label: 'Private enquiries',
      description: 'Private enquiries are available for information only. The submission destination is not configured; no message is collected or sent.',
      cards: [{
        title: enquiryPage?.title || 'Private Enquiries',
        href: enquiryPage?.path || '/enquiries.html',
        description: 'View the existing enquiry information and its current submission safeguards.',
        meta: 'SUBMISSION NOT CONNECTED',
      }],
    },
    {
      label: 'Access concepts',
      description: 'Registration remains closed and no member account or sign-up data is collected.',
      cards: tacticalShield ? [{
        title: tacticalShield.title,
        href: linkForConcept(tacticalShield),
        description: tacticalShield.summary,
        meta: `${tacticalShield.primaryDivision} / ${tacticalShield.primarySection} · REGISTRATION NOT OPEN`,
      }] : [],
    },
  ];
}

function DivisionCard({ card, index }) {
  const cardClassName = `fsd-division-hub-card${card.visual ? ' fsd-division-hub-card--visual' : ''}`;
  const content = (
    <>
      <span className="fsd-division-hub-card__index">{String(index + 1).padStart(2, '0')}</span>
      {card.visual && (
        <ShopCardMedia key={card.image?.src || card.title} card={card} />
      )}
      <span className="fsd-division-hub-card__copy">
        {card.meta && <small className="fsd-division-hub-card__meta">{card.meta}</small>}
        <strong>{card.title}</strong>
        {card.description && <span>{card.description}</span>}
        {card.price && <span className="fsd-division-hub-card__price">{card.price}</span>}
        {card.crossLinks?.length > 0 && (
          <small className="fsd-division-hub-card__crosslinks">
            {card.crossLinks.map(link => `${link.division} / ${link.section}`).join(' · ')}
          </small>
        )}
      </span>
      <span className="fsd-division-hub-card__arrow" aria-hidden="true">{card.disabled ? '—' : '↗'}</span>
    </>
  );

  if (card.disabled) {
    return <li><div className={`${cardClassName} is-disabled`} aria-disabled="true">{content}</div></li>;
  }
  return <li><a className={cardClassName} href={card.href}>{content}</a></li>;
}

export function DivisionHub({ divisionId = 'shop' }) {
  const current = divisions.find(item => item.id === divisionId) || divisions[0];
  const sections = getDivisionSections(current.id);

  return (
    <main
      className={`fsd-division-hub${current.id === 'shop' ? ' fsd-division-hub--shop' : ''}`}
      data-division-hub-page={current.id}
    >
      <header className="fsd-division-hub__hero">
        <p className="fsd-division-hub__eyebrow">FSD / SIX DIVISIONS <span>·</span> {current.label}</p>
        <h1>{current.label}</h1>
        <p>{current.intro}</p>
        <div className="fsd-division-hub__hero-meta">
          <span>FITNESS &amp; SELF DEFENCE</span>
          <span>{current.id === 'private-access' ? 'INFORMATION / NO SIGN-UP' : 'EXISTING FSD CONTENT &amp; ROUTES'}</span>
        </div>
      </header>

      {current.id !== 'shop' && (
        <nav className="fsd-division-hub__division-nav" aria-label="FSD divisions">
          {divisions.map(item => (
            <a key={item.id} href={item.href} aria-current={item.id === current.id ? 'page' : undefined}>
              <span>{item.label}</span><span aria-hidden="true">↗</span>
            </a>
          ))}
        </nav>
      )}

      <div className="fsd-division-hub__sections">
        {sections.map((section, sectionIndex) => (
          <section
            className="fsd-division-hub__section"
            key={`${current.id}-${section.label}`}
            aria-labelledby={`division-hub-${current.id}-${sectionIndex}`}
          >
            <header>
              <p>FSD / {current.label} · {String(sectionIndex + 1).padStart(2, '0')}</p>
              <h2 id={`division-hub-${current.id}-${sectionIndex}`}>{section.label}</h2>
              {section.description && <span>{section.description}</span>}
            </header>
            <ul className={`fsd-division-hub__grid${section.gridClass ? ` ${section.gridClass}` : ''}`}>
              {section.cards.map((card, index) => (
                <DivisionCard key={`${card.title}-${index}`} card={card} index={index} />
              ))}
            </ul>
          </section>
        ))}
      </div>
      <footer className="fsd-division-hub__footer">
        <a href="/">RETURN TO MADE TO MOVE, MADE TO BELONG <span aria-hidden="true">↗</span></a>
        <span>FSD / FITNESS &amp; SELF DEFENCE</span>
      </footer>
    </main>
  );
}

export { divisionPaths };
