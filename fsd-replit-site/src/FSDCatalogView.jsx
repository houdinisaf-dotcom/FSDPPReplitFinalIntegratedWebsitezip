import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { imageSwatchBackground } from './catalogue-data.js';
import './FSDCatalogView.css';

function colourwaysFor(product) {
  if (!Array.isArray(product.rowColourways)) return [];
  return product.rowColourways;
}

function matchingImageIndex(images, colourway) {
  const normalized = value => String(value || '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  return images.findIndex(image => normalized(image.label) === normalized(colourway));
}

function deepDiveHref(productId) {
  if (typeof window === 'undefined') return `?product=${encodeURIComponent(productId)}#products`;
  const url = new URL(window.location.href);
  url.searchParams.set('product', String(productId));
  url.hash = 'products';
  return `${url.pathname}${url.search}${url.hash}`;
}

function ProductDetail({ product, selectedAngle, setSelectedAngle, selectedColor, setSelectedColor, onDeepDive, onAddToBag, onCollapse }) {
  const images = Array.isArray(product.images) ? product.images : [];
  const selectedImage = images.find(image => image.label === selectedAngle) || images[0];
  const colourways = colourwaysFor(product);

  const chooseColourway = colourway => {
    setSelectedColor(colourway);
    const imageIndex = matchingImageIndex(images, colourway);
    if (imageIndex >= 0) setSelectedAngle(images[imageIndex].label);
  };

  const chooseImage = image => {
    setSelectedAngle(image.label);
    const matchingColourway = colourways.find(colourway => matchingImageIndex(images, colourway) >= 0
      && images[matchingImageIndex(images, colourway)].label === image.label);
    if (matchingColourway) setSelectedColor(matchingColourway);
  };

  return (
    <section className="fsd-catalog-detail" id={`catalogue-expanded-${product.id}`} aria-labelledby={`catalogue-expanded-title-${product.id}`}>
      <div className="fsd-catalog-detail__visual">
        {selectedImage ? (
          <figure className="fsd-catalog-detail__figure" aria-live="polite">
            <div className="fsd-catalog-detail__image-stage">
              <img
                data-catalogue-inline-image
                src={selectedImage.src}
                alt={`${product.name} — ${selectedImage.label}`}
              />
            </div>
            <figcaption>{selectedImage.label}</figcaption>
          </figure>
        ) : (
          <div className="fsd-catalog-detail__image-empty" role="note">
            <span>IMAGE NOT AVAILABLE</span>
            <strong>{product.name}</strong>
          </div>
        )}

        {images.length > 1 && (
          <div className="fsd-catalog-detail__views" role="group" aria-label={`Available image views of ${product.name}`}>
            {images.map(image => (
              <button
                key={`${product.id}-${image.label}`}
                data-catalogue-inline-view
                type="button"
                aria-pressed={selectedImage?.label === image.label}
                onClick={event => {
                  event.stopPropagation();
                  chooseImage(image);
                }}
              >
                {image.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="fsd-catalog-detail__copy">
        <div>
          {product.collection && <p className="fsd-catalog-detail__eyebrow">{product.collection}</p>}
          <h3 id={`catalogue-expanded-title-${product.id}`}>{product.name}</h3>
          <dl className="fsd-catalog-detail__facts">
            {(product.rowDetails || []).map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          {colourways.length > 0 && (
            <fieldset className="fsd-catalog-detail__colourways">
              <legend>COLOURWAY EDITION</legend>
              <div>
                {colourways.map(colourway => {
                  const swatch = imageSwatchBackground(colourway);
                  return (
                    <button
                      key={colourway}
                      data-catalogue-inline-colourway
                      type="button"
                      aria-pressed={selectedColor === colourway}
                      onClick={event => {
                        event.stopPropagation();
                        chooseColourway(colourway);
                      }}
                    >
                      {swatch && <span aria-hidden="true" style={{ '--catalogue-swatch': swatch }} />}
                      {colourway}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {(product.rowPrice?.label || product.rowPrice?.value) && (
            <p className="fsd-catalog-detail__price">
              {product.rowPrice.label && <span>{product.rowPrice.label}</span>}
              {product.rowPrice.value && <strong>{product.rowPrice.value}</strong>}
            </p>
          )}
        </div>

        <div className="fsd-catalog-detail__actions">
          <a
            data-catalogue-deep-dive
            href={deepDiveHref(product.id)}
            onClick={event => {
              event.stopPropagation();
              if (!onDeepDive) return;
              event.preventDefault();
              onDeepDive(product.id, event.currentTarget);
            }}
          >
            <span>Click here for more</span><span aria-hidden="true">→</span>
          </a>
          {product.canAddToBag && (
            <button
              type="button"
              className="fsd-catalog-detail__bag"
              onClick={event => {
                event.stopPropagation();
                onAddToBag?.(product.id);
              }}
            >
              Add to Bag
            </button>
          )}
          <button
            className="fsd-catalog-row__collapse"
            type="button"
            onClick={onCollapse}
          >
            Collapse Row
          </button>
        </div>
      </div>
    </section>
  );
}

export function FSDCatalogView({ products = [], onProductSelect, onAddToBag }) {
  const [activeProductId, setActiveProductId] = useState(null);
  const [selectedAngle, setSelectedAngle] = useState('front');
  const [selectedColor, setSelectedColor] = useState('');
  const pendingScrollY = useRef(null);
  const pendingFocusId = useRef(null);
  const visibleProductIds = useMemo(() => products.map(product => product.id).join(','), [products]);

  useLayoutEffect(() => {
    if (pendingScrollY.current === null) return;
    const scrollY = pendingScrollY.current;
    const focusId = pendingFocusId.current;
    pendingScrollY.current = null;
    pendingFocusId.current = null;
    window.scrollTo({ top: scrollY, behavior: 'auto' });
    if (focusId !== null) {
      document.querySelector(`[data-product="${focusId}"]`)?.focus({ preventScroll: true });
    }
  }, [activeProductId]);

  useLayoutEffect(() => {
    if (activeProductId === null || products.some(product => product.id === activeProductId)) return;
    pendingScrollY.current = window.scrollY;
    setActiveProductId(null);
  }, [activeProductId, visibleProductIds, products]);

  const toggleProduct = (product, event, shouldRestoreFocus = false) => {
    event.stopPropagation();
    pendingScrollY.current = window.scrollY;
    const nextId = activeProductId === product.id ? null : product.id;
    pendingFocusId.current = shouldRestoreFocus ? product.id : null;
    if (nextId !== null) {
      setSelectedAngle(product.images?.[0]?.label || 'front');
      setSelectedColor(colourwaysFor(product)[0] || '');
    }
    setActiveProductId(nextId);
  };

  if (products.length === 0) {
    return (
      <div className="fsd-catalog-empty" role="status">
        <p>No visual matches for these filters. Try another selection.</p>
        <button className="filter" type="button" data-clear-filters>Clear all filters</button>
      </div>
    );
  }

  return (
    <>
      {products.map(product => {
        const isOpen = activeProductId === product.id;
        return (
          <article className="product-card fsd-catalog-row" key={product.id}>
            <button
              className="product-row__trigger"
              type="button"
              data-product={product.id}
              data-can-add-to-bag={Boolean(product.canAddToBag)}
              aria-expanded={isOpen}
              aria-controls={`catalogue-expanded-${product.id}`}
              aria-label={`${isOpen ? 'Collapse' : 'View details for'} ${product.name}`}
              onClick={event => toggleProduct(product, event)}
            >
              <span className="product-row__index" aria-hidden="true">{String(product.id).padStart(2, '0')}</span>
              <span className="product-row__copy">
                <span className="product-row__meta">
                  <span>{product.category}</span>{product.audience && <span>{product.audience}</span>}
                </span>
                <span className="product-row__name">{product.name}</span>
                {product.rowSummary && <span className="product-row__summary">{product.rowSummary}</span>}
              </span>
              {(product.rowPrice?.label || product.rowPrice?.value) && (
                <span className="product-row__price">
                  {product.rowPrice.label && <small>{product.rowPrice.label}</small>}
                  {product.rowPrice.value && <strong>{product.rowPrice.value}</strong>}
                </span>
              )}
              <span className="product-row__action">{isOpen ? 'COLLAPSE ROW' : 'VIEW DETAILS'} <span aria-hidden="true">↗</span></span>
            </button>
            {isOpen && (
              <ProductDetail
                product={product}
                selectedAngle={selectedAngle}
                setSelectedAngle={setSelectedAngle}
                selectedColor={selectedColor}
                setSelectedColor={setSelectedColor}
                onDeepDive={onProductSelect}
                onAddToBag={onAddToBag}
                onCollapse={event => toggleProduct(product, event, true)}
              />
            )}
          </article>
        );
      })}
    </>
  );
}
