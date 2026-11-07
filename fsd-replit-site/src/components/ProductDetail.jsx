import { AnimatePresence, motion } from 'motion/react';
import { imageSwatchBackground, productImagesForDisplay } from '../data/products.js';
import { CLOTHING_LINES, productBelongsToLine } from '../clothing-lines.js';
import { productColourwayImageIndex, productColourwayOptions } from '../product-card-media.js';
import { productSizeOptions } from '../product-detail-page.js';
import { productSizeGuidanceForProduct } from '../size-guide-data.js';
import { ImagePlaceholder } from './ImagePlaceholder.jsx';
import { SafeImage } from './SafeImage.jsx';
import { animateAddButton } from '../motion-runtime.js';
import { FSD_MOTION } from '../motion-config.js';

function normalizedImageLabel(value) {
  return String(value || '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function matchingImageIndex(images, colourway) {
  return productColourwayImageIndex(images, colourway);
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
  const images = productImagesForDisplay(product);
  const selectedImage = images.find(image => image.label === selectedAngle) || (selectedAngle ? images[0] : null);
  const colourways = productColourwayOptions(product);
  const sizeGuidance = productSizeGuidanceForProduct(product);
  const breadcrumbLine = CLOTHING_LINES.find(line => productBelongsToLine(product, line.id));

  const chooseColourway = colourway => {
    setSelectedColor(colourway);
    const imageIndex = matchingImageIndex(images, colourway);
    setSelectedAngle(imageIndex >= 0 ? images[imageIndex].label : null);
  };

  const chooseImage = image => {
    setSelectedAngle(image.label);
      const matchingColourway = image.colourway || image.variant || colourways.find(colourway =>
      normalizedImageLabel(image.label) === normalizedImageLabel(colourway));
    if (matchingColourway) setSelectedColor(matchingColourway);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: FSD_MOTION.duration, ease: FSD_MOTION.ease }}
      className="fsd-catalog-detail"
      id={`catalogue-expanded-${product.id}`}
      aria-labelledby={`catalogue-expanded-title-${product.id}`}
    >
      <div className="fsd-catalog-detail__visual">
        <div className="fsd-catalog-detail__visual-heading">
          <span>FSD / CATALOGUE PHOTOGRAPHY</span>
          <span>RECORD {String(product.id).padStart(2, '0')} <i aria-hidden="true">/</i> {images.length ? `${String(images.length).padStart(2, '0')} MAPPED VIEWS` : 'IMAGE TO BE ADDED'}</span>
        </div>
        {selectedImage ? (
          <figure className="fsd-catalog-detail__figure" aria-live="polite" data-selected-view={selectedImage.label}>
            <motion.div
              layoutId={`catalogue-product-image-${product.id}`}
              className="fsd-catalog-detail__image-stage fsd-catalog-detail__shared-image"
            >
              <AnimatePresence initial={false} mode="sync">
                <motion.div
                  key={`${selectedImage.src}-${selectedImage.label}`}
                  className="fsd-catalog-detail__image-fade"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <SafeImage
                    data-catalogue-inline-image
                    src={selectedImage.src}
                    alt={`${product.name} — ${selectedImage.label}`}
                    placeholderTitle={product.name}
                    variantLabel={selectedImage.colourway || selectedImage.variant || selectedImage.size || ''}
                  />
                </motion.div>
              </AnimatePresence>
              <span className="fsd-catalog-detail__image-index" aria-hidden="true">
                <span>FSD / PRODUCT RECORD</span>
                <strong>{String(product.id).padStart(2, '0')}</strong>
              </span>
            </motion.div>
            <figcaption><span>{selectedImage.label}</span><span>SOURCE-MAPPED VIEW</span></figcaption>
          </figure>
        ) : (
          <ImagePlaceholder
            title={product.name}
            variantLabel={selectedColor || product.galleryPlaceholders?.[0] || ''}
            kind="detail"
            viewLabel="Front view"
            className="fsd-catalog-detail__image-empty"
          />
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
          <nav className="catalogue-breadcrumbs" aria-label="Breadcrumb">
            <ol>
              <li><a href="/#products">SHOP</a></li>
              {product.audience && <li>{product.audience}</li>}
              {breadcrumbLine
                ? <li><a href={`/collections/${breadcrumbLine.id}`}>{breadcrumbLine.title}</a></li>
                : product.category && (
                  <li>
                    <a href="#products" data-category-link={product.category}>{product.category}</a>
                  </li>
                )}
              <li aria-current="page">{product.name}</li>
            </ol>
          </nav>
          <h3 id={`catalogue-expanded-title-${product.id}`}>{product.name}</h3>
          {/^pre[\s-]?launch$/i.test(product.commercialStatus || '') && (
            <p className="fsd-catalog-detail__size-note" role="status">
              Pre-launch: availability is not confirmed. Stock by colourway and size, dispatch timing, delivery terms, and returns terms are not confirmed.
            </p>
          )}
          <dl className="fsd-catalog-detail__facts">
            {(product.rowDetails || []).map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          {sizeGuidance && (
            <section className="fsd-catalog-detail__size-guidance" data-breeze-size-guidance aria-labelledby={`catalogue-size-guidance-${product.id}`}>
              <p className="fsd-catalog-detail__size-kicker">FSD / SIZE GUIDE</p>
              <h4 id={`catalogue-size-guidance-${product.id}`}>Confirmed size range</h4>
              <ul className="fsd-catalog-detail__size-range" aria-label={`Listed sizes: ${sizeGuidance.sizes.join(', ')}`}>
                {sizeGuidance.sizes.map(size => <li key={size}>{size}</li>)}
              </ul>
              <p>{sizeGuidance.note}</p>
            </section>
          )}

          {colourways.length > 1 && (
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

        <div className="fsd-catalog-detail__purchase-foot">
          <p className="fsd-catalog-detail__purchase-note">FSD / PERFORMANCE EQUIPMENT &amp; APPAREL</p>
          <div className="fsd-catalog-detail__actions">
          <a
            data-catalogue-deep-dive
            href={deepDiveHref(product.id)}
            onClick={event => {
              event.stopPropagation();
              if (!onDeepDive) return;
              event.preventDefault();
              onDeepDive(product.id, event.currentTarget, { colourway: selectedColor });
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
                if (productSizeOptions(product).length) {
                  onDeepDive?.(product.id, event.currentTarget, { colourway: selectedColor });
                  return;
                }
                if (onAddToBag?.(product.id, { colourway: selectedColor })) animateAddButton(event.currentTarget);
              }}
            >
              {productSizeOptions(product).length ? 'Choose size' : 'Add to Bag'}
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
      </div>
    </motion.section>
  );
}
