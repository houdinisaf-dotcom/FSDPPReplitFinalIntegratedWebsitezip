import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import '../CatalogList.css';
import { ProductDetail } from './ProductDetail.jsx';

function colourwaysFor(product) {
  return Array.isArray(product.rowColourways) ? product.rowColourways : [];
}

export function CatalogList({ products = [], onProductSelect, onAddToBag }) {
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

  const toggleProduct = (product, event, shouldRestoreFocus = false) => {
    event.stopPropagation();
    pendingScrollY.current = window.scrollY;
    const nextId = activeProductId === product.id ? null : product.id;
    pendingFocusId.current = shouldRestoreFocus ? product.id : null;
    if (nextId !== null) {
      pendingRowAnchor.current = {
        element: event.currentTarget,
        top: event.currentTarget.getBoundingClientRect().top,
      };
      setSelectedAngle(product.images?.[0]?.label || 'front');
      setSelectedColor(colourwaysFor(product)[0] || '');
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
