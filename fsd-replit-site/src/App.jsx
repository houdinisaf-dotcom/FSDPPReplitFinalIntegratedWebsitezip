import { createPortal } from 'react-dom';
import { lazy, Suspense, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { renderStorefrontMarkup, mountStorefrontRuntime, navigateFsdSelection } from './main.js';
import { FsdNavigation } from './FsdNavigation.jsx';
import { FSDReactUtilities } from './react-utilities.jsx';
import { CinematicCarousel } from './CinematicCarousel.jsx';
import { HomeHero } from './components/HomeHero.jsx';
import { WomensBanner } from './components/WomensBanner.jsx';
import { FsdLogo } from './brand/Logos.jsx';
import { PrelaunchSignup } from './components/PrelaunchSignup.jsx';
import { ClothingLinesBrowser } from './components/ClothingLinesBrowser.jsx';
import { TechnicalCollectionsBrowser } from './components/TechnicalCollectionsBrowser.jsx';
import { CategoryFilterTabs } from './components/CategoryFilterTabs.jsx';
import {
  readStateFromURL,
  selectCatalogueGarmentCategory,
  showProduct,
  navigateCatalogue,
} from './catalogue.js';
import { seoEntryForPath, seoForView, updateDocumentSeo } from './site-seo.js';
import { useGoldCursor } from './brand/useGoldCursor.js';
import { setCatalogueResultsRenderer } from './catalogue.js';
import { routeFromLocation } from './react-router.js';
import { mountLazyImageLoading } from './lazy-image-loading.js';
import { mountScrollParallax } from './scroll-parallax.js';
import { mountSmoothScroll } from './smooth-scroll.js';
import { animateElement } from './motion-runtime.js';
import { FSD_MOTION } from './motion-config.js';
import './tailwind.css';
import './react-utilities.css';
import './lazy-image-loading.css';
import './collection-route.css';
import { CatalogueLoading, CatalogueErrorBoundary } from './components/CatalogueLoadState.jsx';
import { LuxuryEntryOverlay } from './components/LuxuryEntryOverlay.jsx';
import { HardwareEditorialSection } from './components/HardwareEditorialSection.jsx';
import { DivisionHub } from './components/DivisionHub.jsx';
import 'lenis/dist/lenis.css';

const CatalogList = lazy(() => import('./components/CatalogList.jsx')
  .then(module => ({ default: module.CatalogList })));

function replaceHeadingTag(element, tagName) {
  const normalizedTagName = String(tagName).toUpperCase();
  if (!element || element.tagName === normalizedTagName) return element;

  const replacement = document.createElement(normalizedTagName.toLowerCase());
  for (const attribute of element.attributes) {
    replacement.setAttribute(attribute.name, attribute.value);
  }
  while (element.firstChild) replacement.append(element.firstChild);
  element.replaceWith(replacement);
  return replacement;
}

function CataloguePortal({ target, tabsTarget }) {
  const [products, setProducts] = useState([]);
  const [actions, setActions] = useState({});
  const [garmentTabs, setGarmentTabs] = useState({ categories: [], activeId: 'all' });
  const [archiveOpen, setArchiveOpen] = useState(false);
  const renderResults = useCallback((nextProducts, nextActions, _view, nextGarmentTabs) => {
    setProducts(nextProducts);
    setActions(nextActions);
    if (nextGarmentTabs) setGarmentTabs(nextGarmentTabs);
  }, []);

  useLayoutEffect(() => {
    if (!target) return undefined;
    setCatalogueResultsRenderer(renderResults);
    return () => setCatalogueResultsRenderer(null);
  }, [target, renderResults]);

  useLayoutEffect(() => {
    const archive = target?.closest('details');
    if (!archive) return undefined;
    const syncOpenState = () => setArchiveOpen(archive.open);
    archive.addEventListener('toggle', syncOpenState);
    syncOpenState();
    return () => archive.removeEventListener('toggle', syncOpenState);
  }, [target]);

  if (!target) return null;
  return (
    <>
      {archiveOpen && createPortal(
        <CatalogueErrorBoundary><Suspense fallback={<CatalogueLoading />}>
          <CatalogList
            products={products}
            onProductSelect={actions.onProductSelect}
            onAddToBag={actions.onAddToBag}
          />
        </Suspense></CatalogueErrorBoundary>,
        target,
      )}
      {archiveOpen && tabsTarget && garmentTabs.categories.length > 0 && createPortal(
        <CategoryFilterTabs
          categories={garmentTabs.categories}
          activeId={garmentTabs.activeId}
          onChange={selectCatalogueGarmentCategory}
          ariaLabel="Filter products by type"
        />,
        tabsTarget,
      )}
    </>
  );
}

function AppRouter({ hardwareForgeExtension }) {
  const storefrontRef = useRef(null);
  const storefrontContentRef = useRef(null);
  const markup = useMemo(() => renderStorefrontMarkup(), []);
  const [route, setRoute] = useState(() => routeFromLocation(window.location));
  const divisionLocation = `${window.location.pathname}${window.location.hash}`;
  const divisionHubId = useMemo(() => {
    const pathname = String(window.location.pathname || '/').replace(/\/+$/, '') || '/';
    if (pathname === '/shop') return 'shop';
    if (pathname === '/universe') return 'universe';
    if (pathname === '/bio-lab') return 'bio-lab';
    if (pathname === '/hardware') return 'hardware';
    if (pathname === '/private-access') return 'private-access';
    return null;
  }, [divisionLocation, route.view, route.target]);
  const previousRouteKey = useRef('');
  const [featuredCarouselPortalTarget, setFeaturedCarouselPortalTarget] = useState(null);
  const [cataloguePortalTarget, setCataloguePortalTarget] = useState(null);
  const [catalogueTabsPortalTarget, setCatalogueTabsPortalTarget] = useState(null);
  const [collectionBreadcrumbPortalTarget, setCollectionBreadcrumbPortalTarget] = useState(null);
  const [clothingLinesPortalTarget, setClothingLinesPortalTarget] = useState(null);
  const [homeHeroPortalTarget, setHomeHeroPortalTarget] = useState(null);
  const [hardwareEditorialPortalTarget, setHardwareEditorialPortalTarget] = useState(null);
  const [womensBannerPortalTarget, setWomensBannerPortalTarget] = useState(null);
  const [footerLogoPortalTarget, setFooterLogoPortalTarget] = useState(null);
  const [prelaunchSignupPortalTarget, setPrelaunchSignupPortalTarget] = useState(null);
  const reportRoute = useCallback(nextRoute => setRoute(nextRoute), []);
  const collectionEntry = seoEntryForPath(window.location.pathname);
  const standaloneCollectionType = collectionEntry?.route?.view === 'collection'
    ? (String(collectionEntry.route.target || '').startsWith('line-') ? 'line' : 'catalogue')
    : '';
  const standaloneLineId = standaloneCollectionType === 'line'
    ? String(collectionEntry.route.target).slice('line-'.length)
    : null;
  const hasRouteSpecificHeading = route.view === 'collection'
    || route.view === 'product'
    || route.view === 'hardware'
    || route.view === 'universe'
    || route.view === 'bio-lab'
    || (route.view === 'page' && route.target === 'innovation-hub');
  useLayoutEffect(() => {
    updateDocumentSeo(document, seoForView(route) || seoEntryForPath(window.location.pathname) || seoEntryForPath('/'));
  }, [route.view, route.target]);
  useLayoutEffect(() => {
    const isStandaloneLine = route.view === 'collection' && standaloneCollectionType === 'line';
    const catalogueHeading = storefrontContentRef.current?.querySelector(
      '#products .section-heading h1, #products .section-heading h2',
    );
    replaceHeadingTag(
      catalogueHeading,
      route.view === 'collection' && !isStandaloneLine ? 'h1' : 'h2',
    );

    const routeHeadings = [
      ['#hardware-editorial-title', route.view === 'hardware'],
      ['#fsd-showcase-title', route.view === 'universe'],
      [
        '#fsd-innovation-hub-title',
        route.view === 'bio-lab' || (route.view === 'page' && route.target === 'innovation-hub'),
      ],
    ];
    for (const [selector, isPrimary] of routeHeadings) {
      replaceHeadingTag(
        storefrontContentRef.current?.querySelector(selector),
        isPrimary ? 'h1' : 'h2',
      );
    }
  }, [route.view, route.target, standaloneCollectionType, hardwareEditorialPortalTarget]);
  const navigationReady = useRef(false);
  const contentReady = useRef(false);
  const markRuntimeReady = useCallback(() => {
    if (navigationReady.current && contentReady.current) {
      storefrontRef.current?.setAttribute('data-runtime-ready', 'true');
    }
  }, []);
  const handleNavigation = useCallback(selection => {
    navigateFsdSelection(selection, reportRoute);
  }, [reportRoute]);
  const markNavigationReady = useCallback(() => {
    navigationReady.current = true;
    markRuntimeReady();
  }, [markRuntimeReady]);

  useLayoutEffect(() => {
    const content = storefrontContentRef.current;
    setFeaturedCarouselPortalTarget(
      content?.querySelector('[data-fsd-featured-carousel-slot]') ?? null,
    );
    setCataloguePortalTarget(content?.querySelector('#catalogue-grid') ?? null);
    setCatalogueTabsPortalTarget(content?.querySelector('[data-catalogue-garment-tabs]') ?? null);
    setCollectionBreadcrumbPortalTarget(
      content?.querySelector('[data-fsd-collection-breadcrumb-slot]') ?? null,
    );
    setClothingLinesPortalTarget(content?.querySelector('[data-fsd-clothing-lines-slot]') ?? null);
    setHomeHeroPortalTarget(
      content?.querySelector('[data-home-hero-slot]') ?? null,
    );
    setHardwareEditorialPortalTarget(
      content?.querySelector('[data-fsd-react-section="hardware-editorial"]') ?? null,
    );
    setFooterLogoPortalTarget(
      content?.querySelector('[data-fsd-logo-slot="footer"]') ?? null,
    );
    setPrelaunchSignupPortalTarget(
      content?.querySelector('[data-prelaunch-signup-slot]') ?? null,
    );
  }, []);

  useLayoutEffect(() => {
    const updateWomensBannerTarget = () => {
      const nextTarget = document.querySelector('[data-showcase-dialog] [data-womens-banner-slot]');
      setWomensBannerPortalTarget(current => current === nextTarget ? current : nextTarget);
    };
    const observer = new MutationObserver(updateWomensBannerTarget);
    observer.observe(document.body, { childList: true, subtree: true });
    updateWomensBannerTarget();
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (!import.meta.env.DEV || !hardwareForgeExtension) return;
    hardwareForgeExtension.mountHardwareForgePreview(
      storefrontContentRef.current?.querySelector('[data-dev-review-slot]'),
    );
  }, [hardwareForgeExtension]);

  useLayoutEffect(() => {
    const initialRoute = routeFromLocation(window.location);
    if (initialRoute.view !== 'page' || !initialRoute.target) return;
    const target = storefrontContentRef.current?.querySelector(`#${initialRoute.target}`);
    if (!target) return;
    for (let parent = target.parentElement; parent; parent = parent.parentElement) {
      if (parent instanceof HTMLDetailsElement) parent.open = true;
    }
    const frame = requestAnimationFrame(() => target.scrollIntoView({
      behavior: 'instant',
      block: 'start',
    }));
    return () => cancelAnimationFrame(frame);
  }, []);

  useLayoutEffect(() => {
    const nextKey = `${route.view}:${route.target ?? ''}`;
    const previousKey = previousRouteKey.current;
    previousRouteKey.current = nextKey;
    if (!previousKey || previousKey === nextKey || route.view !== 'page' || !route.target) return;
    const target = document.getElementById(route.target);
    if (!target || !storefrontContentRef.current?.contains(target)) return;
    for (let parent = target.parentElement; parent; parent = parent.parentElement) {
      if (parent instanceof HTMLDetailsElement) parent.open = true;
    }
    void animateElement(target, {
      opacity: [0.86, 1],
      y: [FSD_MOTION.distance, 0],
    }, { duration: FSD_MOTION.routeDuration });
  }, [route.view, route.target]);

  useLayoutEffect(() => mountLazyImageLoading(document), []);
  useLayoutEffect(() => mountSmoothScroll(document, window), []);
  useLayoutEffect(
    () => mountScrollParallax(storefrontContentRef.current, window),
    [homeHeroPortalTarget],
  );

  useLayoutEffect(() => {
    if (!cataloguePortalTarget) return undefined;
    const syncHashRoute = () => setRoute(routeFromLocation(window.location));
    window.addEventListener('hashchange', syncHashRoute);
    window.addEventListener('popstate', syncHashRoute);
    mountStorefrontRuntime({ onRouteChange: reportRoute });
    const productDialog = document.querySelector('#product-dialog');
    const restorePageSeo = () => {
      if (productDialog?.open) return;
      replaceHeadingTag(productDialog?.querySelector('#product-title'), 'h2');
      const restoredRoute = routeFromLocation(window.location);
      setRoute(restoredRoute);
      updateDocumentSeo(document, seoForView(restoredRoute)
        || seoEntryForPath(window.location.pathname) || seoEntryForPath('/'));
    };
    productDialog?.addEventListener('close', restorePageSeo);
    contentReady.current = true;
    markRuntimeReady();

    return () => {
      productDialog?.removeEventListener('close', restorePageSeo);
      window.removeEventListener('hashchange', syncHashRoute);
      window.removeEventListener('popstate', syncHashRoute);
      storefrontRef.current?.removeAttribute('data-runtime-ready');
    };
  }, [cataloguePortalTarget, markRuntimeReady, reportRoute]);

  useLayoutEffect(() => {
    const entry = seoEntryForPath(window.location.pathname);
    if (entry?.product) showProduct(entry.product.id);
    else if (entry?.filter) {
      navigateCatalogue({ ...readStateFromURL(), ...entry.filter, historyMode: 'replace' });
    }
    // Division landing pages (/universe, /bio-lab, /hardware) render their own hub;
    // jumping to the legacy homepage anchor would re-expose the full homepage stack.
    else if (entry?.hash && !window.location.hash && !divisionHubId) window.location.hash = entry.hash;
  }, [cataloguePortalTarget, route.view, route.target, divisionHubId]);

  return (
    <div
      ref={storefrontRef}
      data-fsd-storefront
      data-current-view={route.view}
      data-active-target={route.target ?? ''}
      data-fsd-standalone-collection={standaloneCollectionType || undefined}
      data-division-hub={divisionHubId || undefined}
    >
      <FsdNavigation
        onNavigate={handleNavigation}
        onReady={markNavigationReady}
        hardwareForgeExtension={hardwareForgeExtension}
      />
      {divisionHubId && <DivisionHub divisionId={divisionHubId} />}
      <div ref={storefrontContentRef} data-storefront-content dangerouslySetInnerHTML={{ __html: markup }} />
      {homeHeroPortalTarget && createPortal(
        <HomeHero headingTag={hasRouteSpecificHeading ? 'h2' : 'h1'} />,
        homeHeroPortalTarget,
      )}
      {hardwareEditorialPortalTarget && createPortal(
        <HardwareEditorialSection
          onOpenHardware={() => {
            reportRoute({ view: 'hardware', target: 'hardware' });
            document.querySelector('#fsd-division-hardware')?.click();
          }}
        />,
        hardwareEditorialPortalTarget,
      )}
      {womensBannerPortalTarget && createPortal(<WomensBanner />, womensBannerPortalTarget)}
      {footerLogoPortalTarget && createPortal(<FsdLogo loading="lazy" />, footerLogoPortalTarget)}
      {prelaunchSignupPortalTarget && createPortal(<PrelaunchSignup />, prelaunchSignupPortalTarget)}
      <CataloguePortal target={cataloguePortalTarget} tabsTarget={catalogueTabsPortalTarget} />
      {collectionBreadcrumbPortalTarget && standaloneCollectionType === 'catalogue' && collectionEntry
        && createPortal(
          <nav className="catalogue-breadcrumbs" aria-label="Breadcrumb">
            <ol>
              <li><a href="/#products">SHOP</a></li>
              <li aria-current="page">
                {collectionEntry.route?.target === 'men'
                  ? 'MEN'
                  : collectionEntry.route?.target === 'women'
                    ? 'WOMEN'
                    : collectionEntry.route?.target === 'accessories'
                      ? 'ACCESSORIES'
                      : String(collectionEntry.title || '').replace(/\s*\|\s*FSD\s*$/i, '')}
              </li>
            </ol>
          </nav>,
          collectionBreadcrumbPortalTarget,
        )}
      {clothingLinesPortalTarget && createPortal(
        <ClothingLinesBrowser
          key={standaloneLineId || 'archive'}
          standaloneLineId={standaloneLineId}
          onProductSelect={(id, returnFocus) => {
          reportRoute({ view: 'product', target: String(id) });
          showProduct(id, { returnFocus });
          }}
        />,
        clothingLinesPortalTarget,
      )}
      {clothingLinesPortalTarget && createPortal(
        <TechnicalCollectionsBrowser onProductSelect={(id, returnFocus) => {
          reportRoute({ view: 'product', target: String(id) });
          showProduct(id, { returnFocus });
        }} />,
        clothingLinesPortalTarget,
      )}
      {featuredCarouselPortalTarget && createPortal(
        <CinematicCarousel />,
        featuredCarouselPortalTarget,
      )}
      <FSDReactUtilities />
    </div>
  );
}

export default function App({ hardwareForgeExtension }) {
  useGoldCursor();
  return (
    <>
      <LuxuryEntryOverlay />
      <AppRouter hardwareForgeExtension={hardwareForgeExtension} />
    </>
  );
}
