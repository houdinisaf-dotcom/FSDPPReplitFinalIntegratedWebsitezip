import { imageSwatchBackground } from '../data/products.js';
import { SafeImage } from './SafeImage.jsx';

function colourwaysFor(product) {
  return Array.isArray(product.rowColourways) ? product.rowColourways : [];
}

function normalizedImageLabel(value) {
  return String(value || '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function matchingImageIndex(images, colourway) {
  return images.findIndex(image => normalizedImageLabel(image.colourway || image.label) === normalizedImageLabel(colourway));
}

function deepDiveHref(productId) {
  if (typeof window === 'undefined') return `?product=${encodeURIComponent(productId)}#products`;
  const url = new URL(window.location.href);
  url.searchParams.set('product', String(productId));
  url.hash = 'products';
  return `${url.pathname}${url.search}${url.hash}`;
}

export function ProductDetail({
  product,
  selectedAngle,
  setSelectedAngle,
  selectedColor,
  setSelectedColor,
  onDeepDive,
  onAddToBag,
  onCollapse,
}) {
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
    const matchingColourway = image.colourway || colourways.find(colourway =>
      normalizedImageLabel(image.label) === normalizedImageLabel(colourway));
    if (matchingColourway) setSelectedColor(matchingColourway);
  };

  return (
    <section className="fsd-catalog-detail" id={`catalogue-expanded-${product.id}`} aria-labelledby={`catalogue-expanded-title-${product.id}`}>
      <div className="fsd-catalog-detail__visual">
        {selectedImage ? (
          <figure className="fsd-catalog-detail__figure" aria-live="polite">
            <div className="fsd-catalog-detail__image-stage">
              <SafeImage
                data-catalogue-inline-image
                src={selectedImage.src}
                alt={`${product.name} — ${selectedImage.label}`}
                fallbackLabel="IMAGE NOT AVAILABLE"
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
                  const swatch = imageSwatchBackground(colourway, product?.colourwayPalette);
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
