import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { priceInfo, productsWithUsableImages, shopCollections } from './catalogue-data.js';
import { navigateCatalogue, showProduct } from './catalogue.js';
import { trackEvent } from './analytics.js';
import './fsd-search-modal.css';

const publicProducts = productsWithUsableImages.filter(product => Boolean(priceInfo(product).value));
const publicProductIds = new Set(publicProducts.map(product => product.id));
const quickSearches = shopCollections;
const searchablePages = [{
  id: 'brand-story-archive',
  title: 'Brand Story & Archive',
  category: 'THE HOUSE / EDITORIAL',
  href: '/story',
  searchText: [
    'story archive history house codes discipline composure protection responsibility progress',
    'capability costume practice question whole day training fitness self defence recovery nutrition community',
    'system apparel hardware education membership founder statement founder house manchester dublin belfast',
  ].join(' '),
}];

function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[‘’]/g, "'")
    .toLocaleLowerCase('en-GB');
}

function matchesSearch(product, term) {
  const confirmedAlias = /^confirmed\b/i.test(product.aliasStatus) ? product.alias : '';
  return normalize([
    product.name,
    product.category,
    ...(product.alsoShowIn || []),
    product.audience,
    product.collection,
    confirmedAlias,
  ].join(' ')).includes(term);
}

export function FsdSearchModal() {
  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const openerRef = useRef(null);
  const closeActionRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const term = normalize(query.trim());
  const results = useMemo(() => term
    ? publicProducts.filter(product => publicProductIds.has(product.id) && matchesSearch(product, term))
    : [], [term]);
  const collectionMatches = useMemo(() => term
    ? shopCollections.filter(collection => normalize([
      collection.label,
      ...collection.categories,
    ].join(' ')).includes(term))
    : [], [term]);
  const pageMatches = useMemo(() => term
    ? searchablePages.filter(page => normalize([page.title, page.category, page.searchText].join(' ')).includes(term))
    : [], [term]);

  const closeSearch = (afterClose = null, restoreFocus = true) => {
    closeActionRef.current = { afterClose, restoreFocus };
    setIsOpen(false);
  };

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
      inputRef.current?.focus({ preventScroll: true });
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const documentRef = dialog?.ownerDocument;
    if (!dialog || !documentRef) return;

    const onTriggerClick = event => {
      const trigger = event.target.closest?.('[data-search-open]');
      if (!trigger) return;
      openerRef.current?.setAttribute('aria-expanded', 'false');
      openerRef.current = trigger;
      closeActionRef.current = null;
      trigger.setAttribute('aria-expanded', 'true');
      setQuery('');
      setIsOpen(true);
      trackEvent('search_opened', { location: 'header' });
    };
    const onCancel = event => {
      event.preventDefault();
      closeSearch();
    };
    const onClose = () => {
      setIsOpen(false);
      const closeAction = closeActionRef.current || { afterClose: null, restoreFocus: true };
      closeActionRef.current = null;
      closeAction.afterClose?.();
      if (closeAction.restoreFocus && !documentRef.querySelector('dialog[open]')) {
        openerRef.current?.focus({ preventScroll: true });
      }
      openerRef.current?.setAttribute('aria-expanded', 'false');
      openerRef.current = null;
    };

    documentRef.addEventListener('click', onTriggerClick);
    dialog.addEventListener('cancel', onCancel);
    dialog.addEventListener('close', onClose);
    return () => {
      documentRef.removeEventListener('click', onTriggerClick);
      dialog.removeEventListener('cancel', onCancel);
      dialog.removeEventListener('close', onClose);
      if (dialog.open) dialog.close();
      openerRef.current?.setAttribute('aria-expanded', 'false');
    };
  }, []);

  const trackSearchDestination = (destinationType, destinationId, selectionMethod) => {
    if (selectionMethod === 'form_submit') return;
    trackEvent('search_destination_selected', {
      destination_type: destinationType,
      destination_id: String(destinationId),
      selection_method: selectionMethod,
    });
  };
  const openProduct = (product, selectionMethod = 'result_click') => {
    trackSearchDestination('product', product.id, selectionMethod);
    closeSearch(() => showProduct(product.id), false);
  };
  const openPage = (page, selectionMethod = 'result_click') => {
    trackSearchDestination('page', page.id, selectionMethod);
    closeSearch(() => window.location.assign(page.href), false);
  };
  const browseMatches = (selectionMethod = 'view_all_click') => {
    trackSearchDestination('catalogue', 'filtered-catalogue', selectionMethod);
    closeSearch(() => navigateCatalogue({ query: query.trim() }), false);
  };
  const openCollection = (collection, selectionMethod = 'result_click') => {
    trackSearchDestination('collection', collection.id, selectionMethod);
    closeSearch(() => navigateCatalogue({ collection: collection.id }), false);
  };
  const handleSubmit = event => {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    const destinationType = results[0]
      ? 'product'
      : pageMatches[0]
        ? 'page'
        : collectionMatches[0]
          ? 'collection'
          : 'catalogue';
    trackEvent('site_search_submitted', {
      query_length: trimmedQuery.length,
      product_match_count: results.length,
      collection_match_count: collectionMatches.length,
      page_match_count: pageMatches.length,
      destination_type: destinationType,
    });
    if (results[0]) openProduct(results[0], 'form_submit');
    else if (pageMatches[0]) openPage(pageMatches[0], 'form_submit');
    else if (collectionMatches[0]) openCollection(collectionMatches[0], 'form_submit');
    else browseMatches('form_submit');
  };

  return (
    <dialog
      id="fsd-search-dialog"
      className="fsd-search-dialog"
      ref={dialogRef}
      aria-labelledby="fsd-search-title"
      onClick={event => {
        if (event.target === dialogRef.current) closeSearch();
      }}
    >
      <div className="fsd-search-panel">
        <div className="fsd-search-heading">
          <div>
            <p className="fsd-search-kicker">FSD / PRODUCT SEARCH</p>
          <h2 id="fsd-search-title">Search the FSD house.</h2>
          </div>
          <button
            type="button"
            className="fsd-search-close"
            onClick={() => closeSearch()}
            aria-label="Close product search"
          >
            <span>CLOSE</span><span aria-hidden="true">×</span>
          </button>
        </div>

        <form className="fsd-search-form" onSubmit={handleSubmit} role="search">
          <label className="sr-only" htmlFor="fsd-search-input">Search products, collections, and pages</label>
          <input
            ref={inputRef}
            id="fsd-search-input"
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="TYPE A PRODUCT OR CATEGORY..."
            autoComplete="off"
            spellCheck="false"
          />
          <button type="submit" aria-label="Search catalogue">↗</button>
        </form>

        <p className="fsd-search-status" role="status" aria-live="polite">
          {query.trim()
            ? `${results.length} product matches · ${collectionMatches.length} collection matches · ${pageMatches.length} page matches`
            : 'Search products, collections, and the FSD story.'}
        </p>

        {query.trim() ? (
          results.length || collectionMatches.length || pageMatches.length ? (
            <>
              {results.length > 0 && (
                <ul className="fsd-search-results" aria-label="Matching products">
                  {results.slice(0, 6).map(product => (
                    <li key={product.id}>
                      <button
                        type="button"
                        className="fsd-search-result"
                        data-search-result
                        data-product-id={product.id}
                        onClick={() => openProduct(product)}
                        aria-label={`View ${product.name}`}
                      >
                        {product.images[0]?.src && (
                          <img src={product.images[0].src} alt="" loading="lazy" decoding="async"/>
                        )}
                        <span className="fsd-search-result-copy">
                          <span>{product.category}</span>
                          <strong>{product.name}</strong>
                        </span>
                        <span className="fsd-search-result-arrow" aria-hidden="true">↗</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {pageMatches.length > 0 && (
                <ul className="fsd-search-results fsd-search-page-results" aria-label="Matching pages">
                  {pageMatches.map(page => (
                    <li key={page.id}>
                      <button
                        type="button"
                        className="fsd-search-result fsd-search-result--page"
                        data-search-page={page.id}
                        onClick={() => openPage(page)}
                        aria-label={`Open ${page.title}`}
                      >
                        <span className="fsd-search-page-mark" aria-hidden="true">FSD</span>
                        <span className="fsd-search-result-copy">
                          <span>{page.category}</span>
                          <strong>{page.title}</strong>
                        </span>
                        <span className="fsd-search-result-arrow" aria-hidden="true">↗</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {collectionMatches.length > 0 && (
                <div className="fsd-search-suggestions fsd-search-collection-matches">
                  <p>COLLECTIONS</p>
                  <div>
                    {collectionMatches.map(collection => (
                      <button
                        type="button"
                        key={collection.id}
                        data-search-collection={collection.id}
                        onClick={() => openCollection(collection, 'result_click')}
                      >
                        {collection.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {results.length > 0 && (
                <button className="fsd-search-all" type="button" onClick={() => browseMatches('view_all_click')}>
                  VIEW ALL RESULTS IN CATALOGUE <span aria-hidden="true">→</span>
                </button>
              )}
            </>
          ) : (
            <div className="fsd-search-empty">
              <p>No matching products or collections.</p>
              <button className="fsd-search-all" type="button" onClick={() => browseMatches('no_match_click')}>
                SEARCH THE FULL CATALOGUE <span aria-hidden="true">→</span>
              </button>
            </div>
          )
        ) : (
          <div className="fsd-search-suggestions">
            <p>EXPLORE COLLECTIONS &amp; THE HOUSE</p>
            <div>
              {quickSearches.map(collection => (
                <button
                  type="button"
                  key={collection.id}
                  data-search-collection={collection.id}
                  onClick={() => openCollection(collection, 'suggestion_click')}
                >
                  {collection.label}
                </button>
              ))}
              {searchablePages.map(page => (
                <button
                  type="button"
                  key={page.id}
                  data-search-page={page.id}
                  onClick={() => openPage(page, 'suggestion_click')}
                >
                  {page.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}
