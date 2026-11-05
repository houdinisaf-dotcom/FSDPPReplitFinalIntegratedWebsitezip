import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { products, priceInfo, productImagesForDisplay } from '../data/products.js';
import { deriveClothingLineMembership, CLOTHING_LINE_ASSETS, CLOTHING_LINES } from '../clothing-lines.js';
import { SafeImage } from './SafeImage.jsx';
import { CategoryFilterTabs } from './CategoryFilterTabs.jsx';
import { WOMENS_BRANDING_ASSIGNMENT_STATUS } from '../brand/product-branding.js';
import {
  garmentCategoryOptions,
  productHasGarmentCategory,
} from '../data/garment-category-map.js';
import { confirmedCollectionText } from '../catalogue-collections.js';
import { COLLECTION_MOTION_CONFIG, getCollectionMotionEntry, resolveCollectionLogo } from '../collection-motion-config.js';
import './ClothingLinesBrowser.css';

const money = product => priceInfo(product).value;
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function CollectionLogoLayer({ logo, lineTitle, className = '', onImageError }) {
  if (logo.src) {
    return <img className={className} src={logo.src} alt="" onError={onImageError} />;
  }
  return (
    <span className={`${className} fsd-clothing-nav__logo-text`}>
      <span>{logo.collectionName || lineTitle}</span>
      <small className="sr-only">{logo.status === 'unassigned'
        ? WOMENS_BRANDING_ASSIGNMENT_STATUS
        : logo.status === 'excluded' ? 'LOGO EXCLUDED'
          : logo.status === 'broken' ? 'LOGO UNAVAILABLE' : 'ORIGINAL LOGO PENDING'}</small>
    </span>
  );
}

export function ActiveCollectionMark({ line, reducedMotion, transitionDuration, config = COLLECTION_MOTION_CONFIG }) {
  const logo = resolveCollectionLogo(line.id, config);
  const [previous, setPrevious] = useState(null);
  const lastActive = useRef({ id: line.id, logo, title: line.title });
  const timer = useRef(null);
  const [failedSource, setFailedSource] = useState(null);
  const broken = Boolean(logo.src && failedSource === logo.src);

  useLayoutEffect(() => {
    if (lastActive.current.id !== line.id) {
      if (timer.current) window.clearTimeout(timer.current);
      setFailedSource(null);
      if (!reducedMotion) {
        setPrevious(lastActive.current);
        timer.current = window.setTimeout(() => {
          setPrevious(null);
          timer.current = null;
        }, transitionDuration);
      } else {
        setPrevious(null);
      }
      lastActive.current = { id: line.id, logo, title: line.title };
    }
  }, [line.id, line.title, logo, reducedMotion, transitionDuration]);

  useEffect(() => {
    if (!reducedMotion) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    setPrevious(null);
    return undefined;
  }, [reducedMotion]);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const status = broken ? 'broken' : logo.status;
  const label = `${logo.collectionName || line.title} collection logo: ${
    status === 'ready' ? 'approved original artwork' :
      status === 'broken' ? 'approved original artwork could not be loaded' :
      status === 'unassigned' ? WOMENS_BRANDING_ASSIGNMENT_STATUS.toLocaleLowerCase('en-GB') :
          status === 'excluded' ? 'not approved for display' : 'original artwork pending'
  }`;

  return (
    <span
      className={`fsd-clothing-nav__mark-stack${reducedMotion ? ' is-reduced-motion' : ''}`}
      role="img"
      aria-label={label}
      data-active-collection={logo.collectionId}
      data-logo-state={status}
      data-branding-assignment={status === 'unassigned' ? WOMENS_BRANDING_ASSIGNMENT_STATUS : undefined}
      data-logo-key={logo.key || ''}
      style={{ '--collection-transition-duration': `${transitionDuration}ms` }}
    >
      {previous && (
        <span key={`outgoing-${previous.id}`} className="fsd-clothing-nav__mark-layer is-leaving" aria-hidden="true">
          <CollectionLogoLayer logo={previous.logo} lineTitle={previous.title} className="fsd-clothing-nav__logo" />
        </span>
      )}
      <span key={`incoming-${line.id}`} className={`fsd-clothing-nav__mark-layer${previous && !reducedMotion ? ' is-entering' : ''}`} aria-hidden="true">
        <CollectionLogoLayer
          logo={broken ? { ...logo, src: null, status: 'broken' } : logo}
          lineTitle={line.title}
          className="fsd-clothing-nav__logo"
          onImageError={() => {
            setFailedSource(logo.src);
            if (lastActive.current.id === line.id) {
              lastActive.current = { ...lastActive.current, logo: { ...logo, src: null, status: 'broken' } };
            }
          }}
        />
      </span>
    </span>
  );
}

export function ClothingLinesBrowser({ onProductSelect, standaloneLineId = null }) {
  const [expanded, setExpanded] = useState(Boolean(standaloneLineId));
  const [activeLine, setActiveLine] = useState(standaloneLineId || 'aeroforge');
  const [activeGarmentCategory, setActiveGarmentCategory] = useState('all');
  const [motionReady, setMotionReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => reduceMotion());
  const archiveRef = useRef(null);
  const memberships = deriveClothingLineMembership(products);
  const lines = memberships.lines;
  const isStandaloneLine = Boolean(standaloneLineId);
  const LineHeading = isStandaloneLine ? 'h1' : 'h2';
  const isOpen = expanded || isStandaloneLine;
  const linesToRender = isStandaloneLine
    ? lines.filter(line => line.id === standaloneLineId)
    : lines;
  const transitionDuration = Number(COLLECTION_MOTION_CONFIG.interaction.transitionDurationMs);

  useEffect(() => {
    setActiveGarmentCategory('all');
  }, [activeLine]);

  useEffect(() => {
    const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!preference) return undefined;
    const updatePreference = event => setReducedMotion(event.matches);
    setReducedMotion(preference.matches);
    if (preference.addEventListener) preference.addEventListener('change', updatePreference);
    else preference.addListener?.(updatePreference);
    return () => {
      if (preference.removeEventListener) preference.removeEventListener('change', updatePreference);
      else preference.removeListener?.(updatePreference);
    };
  }, []);

  const scrollTo = useCallback((targetId, updateHash = true) => {
    if (!targetId) return;
    if (!isOpen) setExpanded(true);
    const hash = `#${targetId}`;
    if (updateHash && window.location.hash !== hash) {
      window.history.pushState(window.history.state || {}, '', hash);
    }
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      const target = targetId === 'clothing-lines'
        ? document.getElementById('clothing-lines')
        : document.getElementById(targetId);
      target?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
    }));
  }, [isOpen]);

  useEffect(() => {
    const syncHash = ({ initial = false } = {}) => {
      const targetId = window.location.hash.slice(1);
      if (targetId === 'clothing-lines' || CLOTHING_LINES.some(line => `line-${line.id}` === targetId)) {
        setExpanded(true);
        window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
          document.getElementById(targetId)?.scrollIntoView({
            behavior: initial || reduceMotion() ? 'instant' : 'smooth',
            block: 'start',
          });
        }));
      }
    };
    window.addEventListener('hashchange', syncHash);
    window.addEventListener('popstate', syncHash);
    syncHash({ initial: true });
    return () => {
      window.removeEventListener('hashchange', syncHash);
      window.removeEventListener('popstate', syncHash);
    };
  }, []);

  useEffect(() => {
    const handleDiscoverClick = event => {
      const link = event.target.closest?.('a[href="#clothing-lines"]');
      if (!link) return;
      event.preventDefault();
      scrollTo('clothing-lines');
    };
    document.addEventListener('click', handleDiscoverClick);
    return () => document.removeEventListener('click', handleDiscoverClick);
  }, [scrollTo]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const sections = CLOTHING_LINES.map(line => document.getElementById(`line-${line.id}`)).filter(Boolean);
    if (!sections.length) return undefined;
    let frame = 0;
    const updateActive = () => {
      frame = 0;
      const lineY = (document.querySelector('.fsd-clothing-nav')?.getBoundingClientRect().bottom || 0) + 18;
      const measured = sections.map(section => ({
        id: section.id.replace(/^line-/, ''),
        rect: section.getBoundingClientRect(),
      }));
      const underLine = measured.filter(entry => entry.rect.top <= lineY && entry.rect.bottom > lineY);
      const candidates = underLine.length
        ? underLine
        : measured.filter(entry => entry.rect.bottom > 0 && entry.rect.top < window.innerHeight);
      if (candidates.length) {
        candidates.sort((a, b) => Math.abs(a.rect.top - lineY) - Math.abs(b.rect.top - lineY));
        setActiveLine(current => current === candidates[0].id ? current : candidates[0].id);
      }
    };
    const scheduleUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateActive);
    };
    const observer = 'IntersectionObserver' in window
      ? new IntersectionObserver(scheduleUpdate, {
        root: null,
        rootMargin: '-110px 0px -45% 0px',
        threshold: [0, 0.08, 0.3, 0.6],
      })
      : null;
    sections.forEach(section => observer?.observe(section));
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    scheduleUpdate();
    return () => {
      observer?.disconnect();
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const selected = document.querySelector('.fsd-clothing-nav [aria-current="location"]');
    const rail = selected?.parentElement;
    if (!selected || !rail) return;
    const item = selected.getBoundingClientRect();
    const viewport = rail.getBoundingClientRect();
    const left = item.left < viewport.left ? item.left - viewport.left - 8
      : item.right > viewport.right ? item.right - viewport.right + 8 : 0;
    if (left) rail.scrollBy({ left, behavior: reduceMotion() ? 'instant' : 'smooth' });
  }, [activeLine, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setMotionReady(false);
      return undefined;
    }
    const root = archiveRef.current;
    const motionPreference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!root || !('IntersectionObserver' in window) || motionPreference?.matches) {
      setMotionReady(false);
      return undefined;
    }
    let observer;
    try {
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.remove('is-reveal-pending');
          entry.target.classList.add('is-revealed');
          try {
            window.sessionStorage.setItem(`fsd-line-reveal:${entry.target.dataset.revealKey}`, 'seen');
          } catch { /* Storage can be unavailable in private browsing. */ }
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

      root.querySelectorAll('[data-reveal-key]').forEach(element => {
        let alreadySeen = false;
        try {
          alreadySeen = window.sessionStorage.getItem(`fsd-line-reveal:${element.dataset.revealKey}`) === 'seen';
        } catch { /* Reveal normally when storage is unavailable. */ }
        if (!alreadySeen) {
          element.classList.add('is-reveal-pending');
          observer.observe(element);
        } else {
          element.classList.add('is-revealed');
        }
      });
      setMotionReady(true);
    } catch {
      setMotionReady(false);
    }

    const onPreferenceChange = event => {
      if (!event.matches) return;
      root.querySelectorAll('.is-reveal-pending').forEach(element => {
        element.classList.remove('is-reveal-pending');
        element.classList.add('is-revealed');
      });
      observer?.disconnect();
      setMotionReady(false);
    };
    motionPreference?.addEventListener?.('change', onPreferenceChange);
    return () => {
      observer?.disconnect();
      motionPreference?.removeEventListener?.('change', onPreferenceChange);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !window.matchMedia?.('(pointer: fine) and (min-width: 761px)').matches
      || reducedMotion) return undefined;
    const visuals = [...(archiveRef.current?.querySelectorAll('.fsd-clothing-line__visual') || [])];
    if (!visuals.length || !('IntersectionObserver' in window)) return undefined;
    const visible = new Set();
    let frame = 0;
    const update = () => {
      frame = 0;
      visible.forEach(visual => {
        const rect = visual.getBoundingClientRect();
        const offset = Math.max(-7, Math.min(7, (window.innerHeight * 0.5 - (rect.top + rect.height * 0.5)) * -0.018));
        visual.style.setProperty('--banner-drift', `${offset.toFixed(2)}px`);
      });
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) visible.add(entry.target);
        else {
          visible.delete(entry.target);
          entry.target.style.setProperty('--banner-drift', '0px');
        }
      });
      schedule();
    }, { rootMargin: '80px 0px', threshold: 0 });
    visuals.forEach(visual => observer.observe(visual));
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) window.cancelAnimationFrame(frame);
      visuals.forEach(visual => visual.style.removeProperty('--banner-drift'));
    };
  }, [isOpen, reducedMotion]);

  return (
    <details
      ref={archiveRef}
      className={`showroom-archive fsd-clothing-archive${motionReady ? ' fsd-motion-ready' : ''}`}
      id="clothing-lines-archive"
      open={isOpen}
      onToggle={event => {
        if (isStandaloneLine && !event.currentTarget.open) {
          event.currentTarget.open = true;
          return;
        }
        setExpanded(event.currentTarget.open);
      }}
    >
      <summary
        id="clothing-lines"
        onClick={event => {
          event.preventDefault();
          setExpanded(value => !value);
        }}
      >
        <span>THE CLOTHING LINES</span>
        <small>Seven established collections / public catalogue only</small>
      </summary>
      {isOpen && (
        <div className="fsd-clothing-browser">
          <nav className="fsd-clothing-nav" aria-label="Clothing line sections" style={{
            '--collection-transition-duration': `${transitionDuration}ms`,
            '--collection-background': COLLECTION_MOTION_CONFIG.theme.background,
            '--collection-accent': COLLECTION_MOTION_CONFIG.theme.primaryAccent,
          }}>
            <div className="fsd-clothing-nav__links">
              {lines.map(line => {
                const logo = resolveCollectionLogo(line.id);
                const configured = getCollectionMotionEntry(line.id);
                const collectionName = configured?.name || logo.collectionName || line.title;
                const className = activeLine === line.id ? 'is-active' : '';
                const style = { '--line-accent': COLLECTION_MOTION_CONFIG.theme.primaryAccent };
                return isStandaloneLine ? (
                  <a
                    key={line.id}
                    className={className}
                    style={style}
                    href={`/collections/${line.id}`}
                    aria-current={activeLine === line.id ? 'page' : undefined}
                  >
                    {collectionName}
                  </a>
                ) : (
                  <button
                    key={line.id}
                    type="button"
                    className={className}
                    style={style}
                    aria-current={activeLine === line.id ? 'location' : undefined}
                    onClick={() => scrollTo(`line-${line.id}`)}
                  >
                    {collectionName}
                  </button>
                );
              })}
            </div>
            <span className="fsd-clothing-nav__active-mark">
              <ActiveCollectionMark
                line={lines.find(line => line.id === activeLine) || lines[0]}
                reducedMotion={reducedMotion}
                transitionDuration={transitionDuration}
              />
            </span>
          </nav>
          <p className="fsd-clothing-intro">
            Existing apparel, gathered by line. Every detail opens through the current product experience.
          </p>

          {linesToRender.map(line => {
            const index = lines.findIndex(item => item.id === line.id);
            const featureProduct = line.products.find(product => memberships.imageFor(product)) || line.products[0];
            const featureImage = featureProduct ? memberships.imageFor(featureProduct) : null;
            const bannerAsset = CLOTHING_LINE_ASSETS[line.id]?.banner;
            const mobileBannerAsset = CLOTHING_LINE_ASSETS[line.id]?.mobileBanner;
            const categoryOptions = garmentCategoryOptions(line.products);
            const visibleProducts = line.products.filter(product => activeGarmentCategory === 'all'
              || productHasGarmentCategory(product, activeGarmentCategory));
            return (
              <section
                key={line.id}
                id={`line-${line.id}`}
                className="fsd-clothing-line"
                style={{ '--line-accent': line.colour }}
                aria-labelledby={`line-title-${line.id}`}
              >
                {isStandaloneLine && (
                  <nav className="catalogue-breadcrumbs" aria-label="Breadcrumb">
                    <ol>
                      <li><a href="/#products">SHOP</a></li>
                      {line.audience && <li>{line.audience}</li>}
                      <li aria-current="page">{line.title}</li>
                    </ol>
                  </nav>
                )}
                <header className="fsd-clothing-line__banner">
                  <div className="fsd-clothing-line__copy">
                    <p className="fsd-clothing-line__eyebrow">
                      {String(index + 1).padStart(2, '0')} / {line.eyebrow}
                    </p>
                    <LineHeading id={`line-title-${line.id}`} data-reveal-key={`${line.id}:headline`}>{line.title}</LineHeading>
                    <p className="fsd-clothing-line__count">
                      {line.products.length} {line.products.length === 1 ? 'catalogue piece' : 'catalogue pieces'}
                    </p>
                    {line.products.length > 0 && (
                      <button type="button" className="fsd-clothing-line__shop" onClick={() => {
                        const firstCard = document.getElementById(`line-products-${line.id}`);
                        firstCard?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
                      }}>
                        VIEW THE LINE <span aria-hidden="true">↓</span>
                      </button>
                    )}
                  </div>
                  <div
                    className="fsd-clothing-line__visual"
                    data-reveal-key={`${line.id}:visual`}
                    data-banner-status={bannerAsset ? 'APPROVED' : 'CONTENT PENDING'}
                    data-mobile-banner-status={mobileBannerAsset ? 'APPROVED' : 'CONTENT PENDING'}
                  >
                    <SafeImage
                      className="fsd-clothing-line__image"
                      src={bannerAsset || mobileBannerAsset || featureImage?.src}
                      mobileSrc={mobileBannerAsset}
                      alt={bannerAsset || mobileBannerAsset
                        ? `${line.title} collection image`
                        : featureImage ? `${featureProduct.name} — ${featureImage.label}` : `${line.title} collection image`}
                      placeholderTitle={line.title}
                      placeholderKind="banner"
                    />
                    {(bannerAsset || featureImage) && (
                      <span className="fsd-clothing-line__visual-caption">
                        {bannerAsset ? 'COLLECTION IMAGE' : 'PUBLIC CATALOGUE PHOTOGRAPHY'}
                      </span>
                    )}
                  </div>
                </header>

                {line.products.length ? (
                  <>
                    <div className="fsd-clothing-line__category-browser">
                      <p className="fsd-clothing-line__category-label">Filter by product type</p>
                      <CategoryFilterTabs
                        categories={categoryOptions}
                        activeId={activeGarmentCategory}
                        onChange={setActiveGarmentCategory}
                        ariaLabel={`Filter ${line.title} products by type`}
                      />
                    </div>
                    <div className="fsd-clothing-products" id={`line-products-${line.id}`}>
                    {visibleProducts.map(product => {
                      const image = memberships.imageFor(product);
                      const price = money(product);
                      return (
                        <article className="fsd-clothing-product" key={product.id} data-clothing-product-id={product.id} data-reveal-key={`${line.id}:product:${product.id}`}>
                          <button
                            type="button"
                            className="fsd-clothing-product__open"
                            onClick={event => onProductSelect?.(product.id, event.currentTarget)}
                            aria-label={`View ${product.name}`}
                          >
                            <span
                              className="fsd-clothing-product__media"
                              data-content-status={image ? 'APPROVED' : 'CONTENT PENDING'}
                            >
                              {image ? (
                                <SafeImage
                                  src={image.src}
                                  alt={`${product.name} — ${image.label}`}
                                  placeholderTitle={product.name}
                                  placeholderKind="product"
                                />
                              ) : (
                                <span className="fsd-clothing-product__placeholder">
                                  <span>FSD / PRODUCT IMAGE</span>
                                  <strong>{product.name}</strong>
                                  <small className="sr-only">CONTENT PENDING</small>
                                </span>
                              )}
                            </span>
                            <span className="fsd-clothing-product__meta">
                              <span>{product.category}</span>
                              {product.audience && <span>{product.audience}</span>}
                            </span>
                            <strong className="fsd-clothing-product__name">{product.name}</strong>
                            {confirmedCollectionText(product.colourways) && <span className="fsd-clothing-product__meta">{confirmedCollectionText(product.colourways)}</span>}
                            {confirmedCollectionText(product.availability || product.stockStatus) && <span className="fsd-clothing-product__meta">{confirmedCollectionText(product.availability || product.stockStatus)}</span>}
                            {price && <span className="fsd-clothing-product__price">{price}</span>}
                            <span className="fsd-clothing-product__action">VIEW DETAILS <span aria-hidden="true">↗</span></span>
                          </button>
                          {(() => {
                            const mappedImages = productImagesForDisplay(product);
                            const seenSources = new Set([image?.src]);
                            const detailImages = mappedImages.filter(item => {
                              if (seenSources.has(item.src)) return false;
                              seenSources.add(item.src);
                              return true;
                            }).slice(0, 4);
                            if (detailImages.length < 1) return null;
                            return (
                              <div className="fsd-clothing-product__views" aria-label={`${product.name} additional product photographs`}>
                                <p className="fsd-clothing-product__views-title">MORE VIEWS <span>· {mappedImages.length} mapped photographs</span></p>
                                <div className="fsd-clothing-product__views-rail" role="group" aria-label={`View photographs for ${product.name}`}>
                                  {detailImages.map((view, viewIndex) => (
                                    <button
                                      className="fsd-clothing-product__view"
                                      key={`${view.src}-${viewIndex}`}
                                      type="button"
                                      onClick={event => onProductSelect?.(product.id, event.currentTarget)}
                                      aria-label={`View product: ${product.name} — ${[view.colourway, view.label].filter(Boolean).join(', ')}`}
                                      title={`View product — ${[view.colourway, view.label].filter(Boolean).join(' / ')}`}
                                    >
                                      <SafeImage src={view.src} alt="" loading="lazy" placeholderTitle={product.name} placeholderKind="product" />
                                      <span>{[view.colourway, view.label].filter(Boolean).join(' / ')}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </article>
                      );
                    })}
                    </div>
                  </>
                ) : (
                  <p className="fsd-clothing-line__empty">
                    No public catalogue pieces are assigned to this line yet. The collection remains open for future verified products.
                  </p>
                )}
              </section>
            );
          })}

          <details className="fsd-clothing-unassigned">
            <summary>OTHER CATALOGUE PIECES / {memberships.unassigned.length} PRODUCTS</summary>
            <p>These products are not assigned to the seven named clothing lines above. They remain available in their existing categories and the full catalogue.</p>
            <ul>{memberships.unassigned.map(product => <li key={product.id}>{product.name}</li>)}</ul>
          </details>
        </div>
      )}
    </details>
  );
}
