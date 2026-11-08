import { useState } from 'react';
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from 'motion/react';
import '../CatalogList.css';
import { ImagePlaceholder } from './ImagePlaceholder.jsx';
import { SafeImage } from './SafeImage.jsx';
import { customerFacingCategory } from '../catalogue-data.js';
import { imageSwatchBackground, productImagesForDisplay } from '../data/products.js';
import { productColourwayImageIndex, productColourwayOptions } from '../product-card-media.js';
import { FSD_MOTION } from '../motion-config.js';

function isActionRevealImage(image) {
  const label = String(image?.label || '').toLocaleLowerCase('en-GB');
  return /\b(action|training|sparring|in[-\s]motion|in[-\s]use)\b/.test(label)
    && !/\b(fabric|detail|product detail)\b/.test(label);
}

function isStudioProductImage(image) {
  const label = String(image?.label || '').toLocaleLowerCase('en-GB');
  if (/\bstudio\b/.test(label)) return true;
  return /\bfront\b/.test(label)
    && !/\b(lifestyle|action|training|sparring|in[-\s]motion|in[-\s]use|fabric|detail|packaging)\b/.test(label);
}

function imagesForColourway(images, hasColourways, colourway) {
  return hasColourways
    ? images.filter(image => productColourwayImageIndex([image], colourway) === 0)
    : images;
}

function preferredCardImageIndex(images) {
  if (!images.some(isActionRevealImage)) return 0;
  const studioIndex = images.findIndex(isStudioProductImage);
  return studioIndex >= 0 ? studioIndex : 0;
}

function VisualProductCard({ product, onProductSelect }) {
  const images = productImagesForDisplay(product);
  const colourways = productColourwayOptions(product);
  const hasColourways = colourways.length > 1;
  const initialColourway = colourways[0] || '';
  const [cardColourway, setSelectedColourway] = useState(initialColourway);
  const selectedColourway = cardColourway;
  const [activeIndex, setActiveIndex] = useState(
    preferredCardImageIndex(imagesForColourway(images, hasColourways, initialColourway)),
  );
  const visibleImages = imagesForColourway(images, hasColourways, selectedColourway);
  const activeImage = visibleImages.length ? visibleImages[activeIndex % visibleImages.length] : null;
  const actionImage = activeImage
    ? visibleImages.find((image, index) => index !== activeIndex && isActionRevealImage(image))
    : null;
  const updateImage = nextIndex => {
    if (!visibleImages.length) return;
    setActiveIndex((nextIndex + visibleImages.length) % visibleImages.length);
  };

  return (
    <motion.article
      layout
      exit={{ opacity: 0, y: -8 }}
      transition={{ layout: { duration: FSD_MOTION.duration, ease: FSD_MOTION.ease } }}
      className="product-card fsd-catalog-row product-card--visual"
      data-motion-presence
    >
      <button
        className="product-row__trigger"
        type="button"
        data-product={product.id}
        data-can-add-to-bag={Boolean(product.canAddToBag)}
        aria-haspopup="dialog"
        aria-controls="product-dialog"
        aria-label={`View product details for ${product.name}`}
        onClick={event => {
          event.preventDefault();
          event.stopPropagation();
          onProductSelect?.(product.id, event.currentTarget, { colourway: selectedColourway });
        }}
      >
        <span className={`catalogue-card__media${activeImage ? '' : ' catalogue-card__media--pending'}`} aria-live="polite">
          {activeImage ? (
              <motion.span className="catalogue-card__shared-image">
                <SafeImage
                  data-catalogue-card-image
                  src={activeImage.src}
                  alt={`${product.name} — ${activeImage.label}`}
                  placeholderTitle={product.name}
              variantLabel={activeImage.colourway || activeImage.variant || ''}
                />
              </motion.span>
          ) : (
            <ImagePlaceholder
              title={product.name}
              variantLabel={hasColourways ? selectedColourway : product.galleryPlaceholders?.[0] || colourways[0] || ''}
              kind="product"
              viewLabel="Product view"
              pendingLabel="[ASSET PENDING]"
              showTitle
              className="catalogue-card__image-empty"
            />
          )}
          {actionImage && actionImage.src !== activeImage?.src && (
            <span className="catalogue-card__hover-action" aria-hidden="true">
              <SafeImage
                data-card-action-image
                src={actionImage.src}
                alt=""
                placeholderTitle={product.name}
                variantLabel={actionImage.colourway || actionImage.variant || ''}
              />
            </span>
          )}
          {product.badge && <span className="catalogue-card__badge">{product.badge}</span>}
        </span>
        <span className="catalogue-card__copy">
          <span className="product-row__meta">
            <span>{customerFacingCategory(product.category)}</span>{product.audience && <span>{product.audience}</span>}
          </span>
          <span className="product-row__name">{product.name}</span>
          {/^pre[\s-]?launch$/i.test(product.commercialStatus || '') && (
            <span className="product-row__meta">Pre-launch · Availability unconfirmed</span>
          )}
          {product.rowSummary && <span className="product-row__summary">{product.rowSummary}</span>}
          {(product.rowPrice?.label || product.rowPrice?.value) && (
            <span className="product-row__price">
              {product.rowPrice.label && <small>{product.rowPrice.label}</small>}
              {product.rowPrice.value && <strong>{product.rowPrice.value}</strong>}
            </span>
          )}
          <span className="catalogue-card__action">VIEW DETAILS <span aria-hidden="true">↗</span></span>
        </span>
      </button>
      <button
        className="catalogue-card__quick-view"
        type="button"
        data-product-quick-view={product.id}
        aria-haspopup="dialog"
        aria-controls="product-dialog"
        aria-label={`Quick view of ${product.name}`}
      >
        QUICK VIEW <span aria-hidden="true">↗</span>
      </button>
      {hasColourways && (
        <div className="catalogue-card__swatches" role="group" aria-label={`Colour options for ${product.name}`}>
          {colourways.map(colourway => {
            const swatch = imageSwatchBackground(colourway, product.colourwayPalette);
            return (
              <button
                key={`${product.id}-${colourway}`}
                type="button"
                aria-label={`Choose ${colourway} for ${product.name}`}
                aria-pressed={selectedColourway === colourway}
                onClick={() => {
                  setSelectedColourway(colourway);
                  setActiveIndex(preferredCardImageIndex(imagesForColourway(images, hasColourways, colourway)));
                }}
              >
                <span aria-hidden="true" style={swatch ? { '--catalogue-swatch': swatch } : undefined} />
                <span className="sr-only">{colourway}</span>
              </button>
            );
          })}
          <span aria-live="polite">{selectedColourway}</span>
        </div>
      )}
      {!hasColourways && <div className="catalogue-card__swatches catalogue-card__swatches--empty" aria-hidden="true" />}
      {visibleImages.length > 1 && (
        <div className="catalogue-card__carousel" role="group" aria-label={`Image carousel for ${product.name}`}>
          <button
            type="button"
            data-catalogue-card-prev
            aria-label={`Previous image of ${product.name}`}
            onClick={() => updateImage(activeIndex - 1)}
          >
            ‹
          </button>
          <span className="catalogue-card__dots">
            {visibleImages.map((image, index) => (
              <button
                key={`${product.id}-${image.label}-${index}`}
                type="button"
                data-catalogue-card-slide={index}
                aria-label={`Show ${image.label}`}
                aria-pressed={index === activeIndex}
                onClick={() => updateImage(index)}
              />
            ))}
          </span>
          <button
            type="button"
            data-catalogue-card-next
            aria-label={`Next image of ${product.name}`}
            onClick={() => updateImage(activeIndex + 1)}
          >
            ›
          </button>
        </div>
      )}
      <span className="sr-only" aria-live="polite">
        {activeImage ? `${activeImage.label}, image ${activeIndex + 1} of ${visibleImages.length}` : 'No mapped image for this colour'}
      </span>
    </motion.article>
  );
}

export function CatalogList({ products = [], onProductSelect }) {

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
      <MotionConfig reducedMotion="user">
        <LayoutGroup id="fsd-catalogue-product-images">
          <AnimatePresence initial={false}>
          {products.map(product => (
            <VisualProductCard
              key={product.id}
              product={product}
              onProductSelect={onProductSelect}
            />
          ))}
          </AnimatePresence>
        </LayoutGroup>
      </MotionConfig>
    </>
  );
}
