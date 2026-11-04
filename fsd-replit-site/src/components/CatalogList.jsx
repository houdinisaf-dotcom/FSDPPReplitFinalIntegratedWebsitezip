import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from 'motion/react';
import '../CatalogList.css';
import { ProductDetail } from './ProductDetail.jsx';
import { ImagePlaceholder } from './ImagePlaceholder.jsx';
import { SafeImage } from './SafeImage.jsx';
import { customerFacingCategory } from '../catalogue-data.js';
import { imageSwatchBackground, productImagesForDisplay } from '../data/products.js';
import { productColourwayImageIndex, productColourwayOptions } from '../product-card-media.js';
import { FSD_MOTION } from '../motion-config.js';

function VisualProductCard({ product, isOpen, selectedColor, onColourChange, onToggle, children }) {
  const images = productImagesForDisplay(product);
  const colourways = productColourwayOptions(product);
  const hasColourways = colourways.length > 1;
  const [cardColourway, setSelectedColourway] = useState(colourways[0] || '');
  const selectedColourway = isOpen ? selectedColor : cardColourway;
  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    if (isOpen) setSelectedColourway(selectedColor);
  }, [isOpen, selectedColor]);
  const visibleImages = hasColourways
    ? images.filter(image => productColourwayImageIndex([image], selectedColourway) === 0)
    : images;
  const activeImage = visibleImages.length ? visibleImages[activeIndex % visibleImages.length] : null;
  const updateImage = nextIndex => {
    if (!visibleImages.length) return;
    setActiveIndex((nextIndex + visibleImages.length) % visibleImages.length);
  };

  return (
    <motion.article
      layout
      exit={{ opacity: 0, y: -8 }}
      transition={{ layout: { duration: FSD_MOTION.duration, ease: FSD_MOTION.ease } }}
      className={`product-card fsd-catalog-row product-card--visual${isOpen ? ' product-card--visual-open' : ''}`}
      data-motion-presence
    >
      <button
        className="product-row__trigger"
        type="button"
        data-product={product.id}
        data-can-add-to-bag={Boolean(product.canAddToBag)}
        aria-expanded={isOpen}
        aria-controls={`catalogue-expanded-${product.id}`}
        aria-label={`${isOpen ? 'Collapse' : 'View details for'} ${product.name}`}
        onClick={event => onToggle(event, selectedColourway)}
      >
        <span className="catalogue-card__media" aria-live="polite">
          {activeImage ? (
              <motion.span layoutId={`catalogue-product-image-${product.id}`} className="catalogue-card__shared-image">
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
              className="catalogue-card__image-empty"
            />
          )}
          {product.badge && <span className="catalogue-card__badge">{product.badge}</span>}
        </span>
        <span className="catalogue-card__copy">
          <span className="product-row__meta">
            <span>{customerFacingCategory(product.category)}</span>{product.audience && <span>{product.audience}</span>}
          </span>
          <span className="product-row__name">{product.name}</span>
          {product.rowSummary && <span className="product-row__summary">{product.rowSummary}</span>}
          {(product.rowPrice?.label || product.rowPrice?.value) && (
            <span className="product-row__price">
              {product.rowPrice.label && <small>{product.rowPrice.label}</small>}
              {product.rowPrice.value && <strong>{product.rowPrice.value}</strong>}
            </span>
          )}
          <span className="catalogue-card__action">{isOpen ? 'COLLAPSE DETAILS' : 'VIEW DETAILS'} <span aria-hidden="true">↗</span></span>
        </span>
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
                  if (isOpen) onColourChange(colourway);
                  setActiveIndex(0);
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
      {children}
    </motion.article>
  );
}

export function CatalogList({ products = [], view = 'list', onProductSelect, onAddToBag }) {
  const [activeProductId, setActiveProductId] = useState(null);
  const [selectedAngle, setSelectedAngle] = useState('front');
  const [selectedColor, setSelectedColor] = useState('');
  const pendingScrollY = useRef(null);
  const pendingFocusId = useRef(null);
  const pendingRowAnchor = useRef(null);
  const visibleProductIds = useMemo(() => products.map(product => product.id).join(','), [products]);

  useLayoutEffect(() => {
    if (pendingScrollY.current !== null) {
      const scrollY = pendingScrollY.current;
      const focusId = pendingFocusId.current;
      pendingScrollY.current = null;
      pendingFocusId.current = null;
      window.scrollTo({ top: scrollY, behavior: 'auto' });
      if (focusId !== null) {
        document.querySelector(`[data-product="${focusId}"]`)?.focus({ preventScroll: true });
      }
    }

    const rowAnchor = pendingRowAnchor.current;
    pendingRowAnchor.current = null;
    if (rowAnchor?.element?.isConnected) {
      const delta = rowAnchor.element.getBoundingClientRect().top - rowAnchor.top;
      if (delta) window.scrollBy({ top: delta, behavior: 'instant' });
    }
  }, [activeProductId]);

  useLayoutEffect(() => {
    if (activeProductId === null || products.some(product => product.id === activeProductId)) return;
    pendingScrollY.current = window.scrollY;
    setActiveProductId(null);
  }, [activeProductId, visibleProductIds, products]);

  const toggleProduct = (product, event, shouldRestoreFocus = false, initialColourway = '') => {
    event.stopPropagation();
    pendingScrollY.current = window.scrollY;
    const nextId = activeProductId === product.id ? null : product.id;
    pendingFocusId.current = shouldRestoreFocus ? product.id : null;
    if (nextId !== null) {
      pendingRowAnchor.current = {
        element: event.currentTarget,
        top: event.currentTarget.getBoundingClientRect().top,
      };
      const images = productImagesForDisplay(product);
      const colourways = productColourwayOptions(product);
      const colourway = colourways.includes(initialColourway) ? initialColourway : colourways[0] || '';
      const initialIndex = colourways.length > 1
        ? productColourwayImageIndex(images, colourway)
        : images.length ? 0 : -1;
      setSelectedAngle(initialIndex >= 0 ? images[initialIndex].label : null);
      setSelectedColor(colourway);
    } else {
      pendingRowAnchor.current = null;
    }
    setActiveProductId(nextId);
  };

  useEffect(() => {
    if (activeProductId === null) return undefined;
    const onKeyDown = event => {
      if (event.key !== 'Escape' || document.querySelector('dialog[open]')) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      pendingScrollY.current = window.scrollY;
      pendingFocusId.current = activeProductId;
      pendingRowAnchor.current = null;
      setActiveProductId(null);
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [activeProductId]);

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
          {products.map(product => {
            const isOpen = activeProductId === product.id;
            if (view === 'visual') {
              return (
                <VisualProductCard
                  key={product.id}
                  product={product}
                  isOpen={isOpen}
                  selectedColor={selectedColor}
                  onColourChange={colourway => {
                    setSelectedColor(colourway);
                    const images = productImagesForDisplay(product);
                    const index = productColourwayImageIndex(images, colourway);
                    setSelectedAngle(index >= 0 ? images[index].label : null);
                  }}
                  onToggle={(event, colourway) => toggleProduct(product, event, false, colourway)}
                >
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <ProductDetail
                        key={`detail-${product.id}`}
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
                  </AnimatePresence>
                </VisualProductCard>
              );
            }
            return (
              <motion.article
                layout
                exit={{ opacity: 0, y: -8 }}
                transition={{ layout: { duration: FSD_MOTION.duration, ease: FSD_MOTION.ease } }}
                className="product-card fsd-catalog-row"
                data-motion-presence
                key={product.id}
              >
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
                      <span>{customerFacingCategory(product.category)}</span>{product.audience && <span>{product.audience}</span>}
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
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <ProductDetail
                      key={`detail-${product.id}`}
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
                </AnimatePresence>
              </motion.article>
            );
          })}
          </AnimatePresence>
        </LayoutGroup>
      </MotionConfig>
    </>
  );
}
