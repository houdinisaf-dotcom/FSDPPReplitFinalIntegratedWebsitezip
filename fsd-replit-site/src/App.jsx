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
import { showProduct, navigateCatalogue } from './catalogue.js';
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
import { CatalogueLoading, CatalogueErrorBoundary } from './components/CatalogueLoadState.jsx';
import 'lenis/dist/lenis.css';

const CatalogList = lazy(() => import('./components/CatalogList.jsx')
  .then(module => ({ default: module.CatalogList })));

function CataloguePortal({ target }) {
  const [products, setProducts] = useState([]);
  const [actions, setActions] = useState({});
  const [view, setView] = useState('list');
  const [archiveOpen, setArchiveOpen] = useState(false);
  const renderResults = useCallback((nextProducts, nextActions, nextView) => {
    setProducts(nextProducts);
    setActions(nextActions);
    setView(nextView);
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
  return createPortal(
    archiveOpen ? (
      <CatalogueErrorBoundary><Suspense fallback={<CatalogueLoading />}>
        <CatalogList
          products={products}
          view={view}
          onProductSelect={actions.onProductSelect}
          onAddToBag={actions.onAddToBag}
        />
      </Suspense></CatalogueErrorBoundary>
    ) : null,
    target,
  );
}

function AppRouter({ hardwareForgeExtension }) {
  const storefrontRef = useRef(null);
  const storefrontContentRef = useRef(null);
  const markup = useMemo(() => renderStorefrontMarkup(), []);
  const [route, setRoute] = useState(() => routeFromLocation(window.location));
  const previousRouteKey = useRef('');
  const [featuredCarouselPortalTarget, setFeaturedCarouselPortalTarget] = useState(null);
  const [cataloguePortalTarget, setCataloguePortalTarget] = useState(null);
  const [clothingLinesPortalTarget, setClothingLinesPortalTarget] = useState(null);
  const [homeHeroPortalTarget, setHomeHeroPortalTarget] = useState(null);
  const [womensBannerPortalTarget, setWomensBannerPortalTarget] = useState(null);
  const [footerLogoPortalTarget, setFooterLogoPortalTarget] = useState(null);
  const [prelaunchSignupPortalTarget, setPrelaunchSignupPortalTarget] = useState(null);
  const reportRoute = useCallback(nextRoute => setRoute(nextRoute), []);
  useLayoutEffect(() => {
    updateDocumentSeo(document, seoForView(route) || seoEntryForPath(window.location.pathname) || seoEntryForPath('/'));
  }, [route.view, route.target]);
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
    setClothingLinesPortalTarget(content?.querySelector('[data-fsd-clothing-lines-slot]') ?? null);
    setHomeHeroPortalTarget(
      content?.querySelector('[data-home-hero-slot]') ?? null,
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
      updateDocumentSeo(document, seoForView(routeFromLocation(window.location))
        || seoEntryForPath(window.location.pathname) || seoEntryForPath('/'));
    };
    productDialog?.addEventListener('close', restorePageSeo);
    const entry = seoEntryForPath(window.location.pathname);
    if (entry?.product) showProduct(entry.product.id);
    else if (entry?.filter) navigateCatalogue(entry.filter);
    else if (entry?.hash && !window.location.hash) window.location.hash = entry.hash;
    contentReady.current = true;
    markRuntimeReady();

    return () => {
      productDialog?.removeEventListener('close', restorePageSeo);
      window.removeEventListener('hashchange', syncHashRoute);
      window.removeEventListener('popstate', syncHashRoute);
      storefrontRef.current?.removeAttribute('data-runtime-ready');
    };
  }, [cataloguePortalTarget, markRuntimeReady, reportRoute]);

  return (
    <div
      ref={storefrontRef}
      data-fsd-storefront
      data-current-view={route.view}
      data-active-target={route.target ?? ''}
    >
      <FsdNavigation
        onNavigate={handleNavigation}
        onReady={markNavigationReady}
        hardwareForgeExtension={hardwareForgeExtension}
      />
      <div ref={storefrontContentRef} data-storefront-content dangerouslySetInnerHTML={{ __html: markup }} />
      {homeHeroPortalTarget && createPortal(<HomeHero />, homeHeroPortalTarget)}
      {womensBannerPortalTarget && createPortal(<WomensBanner />, womensBannerPortalTarget)}
      {footerLogoPortalTarget && createPortal(<FsdLogo loading="lazy" />, footerLogoPortalTarget)}
      {prelaunchSignupPortalTarget && createPortal(<PrelaunchSignup />, prelaunchSignupPortalTarget)}
      <CataloguePortal target={cataloguePortalTarget} />
      {clothingLinesPortalTarget && createPortal(
        <ClothingLinesBrowser onProductSelect={(id, returnFocus) => {
          reportRoute({ view: 'product', target: String(id) });
          showProduct(id, { returnFocus });
        }} />,
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
  return <AppRouter hardwareForgeExtension={hardwareForgeExtension} />;
}
