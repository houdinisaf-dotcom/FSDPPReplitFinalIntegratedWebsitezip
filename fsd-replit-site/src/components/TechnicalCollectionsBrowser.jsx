import { useEffect, useState } from 'react';
import { deriveTechnicalCollections, confirmedCollectionText } from '../catalogue-collections.js';
import { products, priceInfo, productImagesForDisplay, productActionImageForDisplay } from '../data/products.js';
import { SafeImage } from './SafeImage.jsx';
import { ImagePlaceholder } from './ImagePlaceholder.jsx';
import { ProductColourwaySwatches } from './ProductColourwaySwatches.jsx';
import './TechnicalCollectionsBrowser.css';

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const money = product => priceInfo(product).value;

function scrollBehavior(initial = false) {
  return initial || reduceMotion() ? 'instant' : 'smooth';
}

function availabilityFor(product) {
  const value = product.availability || product.stockAvailability || product.stockStatus;
  return typeof value === 'string' ? confirmedCollectionText(value) : '';
}

function TechnicalProductCard({ product, onProductSelect }) {
  const image = productImagesForDisplay(product)[0] || null;
  const actionImage = productActionImageForDisplay(product, image);
  const price = money(product);
  const availability = availabilityFor(product);

  return (
    <article className="fsd-clothing-product" data-technical-product-id={product.id}>
      <button
        type="button"
        className="fsd-clothing-product__open"
        onClick={event => onProductSelect?.(product.id, event.currentTarget)}
        aria-label={`View ${product.name}`}
      >
        <span className="fsd-clothing-product__media">
          {image ? (
            <>
            <SafeImage
              src={image.src}
              alt={`${product.name} — ${image.label}`}
              placeholderTitle={product.name}
              placeholderKind="product"
              loading="lazy"
            />
            {actionImage && actionImage.src !== image?.src && (
              <span className="fsd-clothing-product__action-image" aria-hidden="true">
                <SafeImage
                  data-card-action-image
                  src={actionImage.src}
                  alt=""
                  loading="lazy"
                  placeholderTitle={product.name}
                  placeholderKind="product"
                />
              </span>
            )}
            </>
          ) : (
            <ImagePlaceholder title={product.name} kind="product" />
          )}
        </span>
        <span className="fsd-clothing-product__meta">
          <span>{product.category}</span>
          {product.audience && <span>{product.audience}</span>}
        </span>
        <strong className="fsd-clothing-product__name">{product.name}</strong>
        {confirmedCollectionText(product.colourways) && (
          <span className="fsd-technical-product__colourways">{confirmedCollectionText(product.colourways)}</span>
        )}
        {price && <span className="fsd-clothing-product__price">{price}</span>}
        {availability && <span className="fsd-technical-product__availability">{availability}</span>}
        <span className="fsd-clothing-product__action">VIEW DETAILS <span aria-hidden="true">↗</span></span>
      </button>
      <ProductColourwaySwatches product={product} />
    </article>
  );
}

export function TechnicalCollectionsBrowser({ onProductSelect }) {
  const [expanded, setExpanded] = useState(false);
  const collections = deriveTechnicalCollections(products);

  useEffect(() => {
    const validTarget = targetId => targetId === 'technical-collections-archive'
      || collections.some(collection => targetId === `collection-${collection.id}`);

    const syncHash = ({ initial = false } = {}) => {
      const targetId = window.location.hash.slice(1);
      if (!validTarget(targetId)) return;
      setExpanded(true);
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
        document.getElementById(targetId)?.scrollIntoView({
          behavior: scrollBehavior(initial),
          block: 'start',
        });
      }));
    };

    window.addEventListener('hashchange', syncHash);
    window.addEventListener('popstate', syncHash);
    syncHash({ initial: true });
    return () => {
      window.removeEventListener('hashchange', syncHash);
      window.removeEventListener('popstate', syncHash);
    };
  }, []);

  const handleBannerLink = (event, collection) => {
    event.preventDefault();
    const sectionId = `collection-${collection.id}`;
    const cardsId = `collection-products-${collection.id}`;
    setExpanded(true);
    if (window.location.hash !== `#${sectionId}`) {
      window.history.pushState(window.history.state || {}, '', `#${sectionId}`);
    }
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      document.getElementById(cardsId)?.scrollIntoView({
        behavior: scrollBehavior(),
        block: 'start',
      });
    }));
  };

  return (
    <details
      className="showroom-archive fsd-technical-archive"
      id="technical-collections-archive"
      open={expanded}
      onToggle={event => setExpanded(event.currentTarget.open)}
    >
      <summary
        onClick={event => {
          event.preventDefault();
          setExpanded(value => !value);
        }}
      >
        <span>ACCESSORIES &amp; TECHNICAL COLLECTIONS</span>
        <small>Four established collections / public catalogue only</small>
      </summary>
      {expanded && (
        <div className="fsd-technical-browser">
          {collections.map((collection, index) => {
            const bannerProduct = collection.products.find(product => productImagesForDisplay(product).length);
            const bannerImage = collection.bannerImage || (
              bannerProduct ? productImagesForDisplay(bannerProduct)[0] : null
            );

            return (
              <section
                key={collection.id}
                id={`collection-${collection.id}`}
                className="fsd-established-collection"
                style={{ '--line-accent': collection.accentColour || '#d4af37' }}
                aria-labelledby={`technical-title-${collection.id}`}
              >
                <header className="fsd-clothing-line__banner">
                  <div className="fsd-clothing-line__copy">
                    {collection.logoAsset && <div className="fsd-clothing-line__brand">
                      <SafeImage src={collection.logoAsset} className="fsd-clothing-line__mark"
                        alt={`${collection.title} identity`} placeholderTitle={collection.title} loading="lazy" />
                    </div>}
                    <p className="fsd-clothing-line__eyebrow">
                      {String(index + 1).padStart(2, '0')} / FSD TECHNICAL COLLECTION
                    </p>
                    <h2 id={`technical-title-${collection.id}`}>{collection.title}</h2>
                    <p className="fsd-clothing-line__count">
                      {collection.products.length} {collection.products.length === 1 ? 'catalogue piece' : 'catalogue pieces'}
                    </p>
                    <a
                      className="fsd-clothing-line__shop fsd-technical-collection-link"
                      href={collection.href}
                      onClick={event => handleBannerLink(event, collection)}
                    >
                      VIEW COLLECTION <span aria-hidden="true">↓</span>
                    </a>
                  </div>
                  <div className="fsd-clothing-line__visual">
                    {bannerImage?.src ? (
                      <SafeImage
                        className="fsd-clothing-line__image"
                        src={bannerImage.src}
                        alt={`${collection.title} — ${bannerImage.label || 'approved product image'}`}
                        placeholderTitle={collection.title}
                        placeholderKind="banner"
                         loading="lazy"
                      />
                    ) : (
                      <ImagePlaceholder
                        className="fsd-clothing-line__image-pending"
                        title={collection.title}
                        kind="banner"
                      />
                    )}
                    <span className="fsd-clothing-line__visual-caption">
                      {bannerImage?.src ? 'APPROVED PRODUCT IMAGE' : 'COLLECTION IMAGE SLOT'}
                    </span>
                  </div>
                </header>

                {collection.products.length ? (
                  <div className="fsd-clothing-products" id={`collection-products-${collection.id}`}>
                    {collection.products.map(product => (
                      <TechnicalProductCard
                        key={product.id}
                        product={product}
                        onProductSelect={onProductSelect}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="fsd-clothing-line__empty" id={`collection-products-${collection.id}`}>
                    No public catalogue pieces are assigned to this collection yet. The archive will show verified products when available.
                  </p>
                )}
              </section>
            );
          })}
        </div>
      )}
    </details>
  );
}
