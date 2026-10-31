import { createPortal } from 'react-dom';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { renderStorefrontMarkup, mountStorefrontRuntime, navigateFsdSelection } from './main.js';
import { FsdNavigation } from './FsdNavigation.jsx';
import { FSDReactUtilities } from './react-utilities.jsx';
import { CinematicCarousel } from './CinematicCarousel.jsx';
import { CatalogList } from './components/CatalogList.jsx';
import { HomeHero } from './components/HomeHero.jsx';
import { WomensBanner } from './components/WomensBanner.jsx';
import { FsdLogo } from './brand/Logos.jsx';
import { useGoldCursor } from './brand/useGoldCursor.js';
import { setCatalogueResultsRenderer } from './catalogue.js';
import { routeFromLocation } from './react-router.js';
import { mountLazyImageLoading } from './lazy-image-loading.js';
import { mountScrollParallax } from './scroll-parallax.js';
import './tailwind.css';
import './react-utilities.css';
import './lazy-image-loading.css';

function CataloguePortal({ target }) {
  const [products, setProducts] = useState([]);
  const [actions, setActions] = useState({});
  const [view, setView] = useState('list');
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

  if (!target) return null;
  return createPortal(
    <CatalogList
      products={products}
      view={view}
      onProductSelect={actions.onProductSelect}
      onAddToBag={actions.onAddToBag}
    />,
    target,
  );
}

function AppRouter({ hardwareForgeExtension }) {
  const storefrontRef = useRef(null);
  const storefrontContentRef = useRef(null);
  const markup = useMemo(() => renderStorefrontMarkup(), []);
  const [route, setRoute] = useState(() => routeFromLocation(window.location));
  const [featuredCarouselPortalTarget, setFeaturedCarouselPortalTarget] = useState(null);
  const [cataloguePortalTarget, setCataloguePortalTarget] = useState(null);
  const [homeHeroPortalTarget, setHomeHeroPortalTarget] = useState(null);
  const [womensBannerPortalTarget, setWomensBannerPortalTarget] = useState(null);
  const [footerLogoPortalTarget, setFooterLogoPortalTarget] = useState(null);
  const reportRoute = useCallback(nextRoute => setRoute(nextRoute), []);
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
    setHomeHeroPortalTarget(
      content?.querySelector('[data-home-hero-slot]') ?? null,
    );
    setFooterLogoPortalTarget(
      content?.querySelector('[data-fsd-logo-slot="footer"]') ?? null,
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

  useLayoutEffect(() => mountLazyImageLoading(document), []);
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
    contentReady.current = true;
    markRuntimeReady();

    return () => {
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
      <CataloguePortal target={cataloguePortalTarget} />
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
