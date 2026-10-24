import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { renderStorefrontMarkup, mountStorefrontRuntime, navigateFsdSelection } from './main.js';
import { FsdNavigation } from './FsdNavigation.jsx';
import { FSDReactUtilities } from './react-utilities.jsx';
import { CinematicCarousel } from './CinematicCarousel.jsx';
import { FSDCatalogView } from './FSDCatalogView.jsx';
import { setCatalogueResultsRenderer } from './catalogue.js';
import { routeFromLocation } from './react-router.js';
import { mountLazyImageLoading } from './lazy-image-loading.js';
import { mountScrollParallax } from './scroll-parallax.js';
import './tailwind.css';
import './react-utilities.css';
import './lazy-image-loading.css';

function FSDCatalogPortal({ target }) {
  const [products, setProducts] = useState([]);
  const [actions, setActions] = useState({});
  const renderResults = useCallback((nextProducts, nextActions) => {
    setProducts(nextProducts);
    setActions(nextActions);
  }, []);

  useLayoutEffect(() => {
    if (!target) return undefined;
    setCatalogueResultsRenderer(renderResults);
    return () => setCatalogueResultsRenderer(null);
  }, [target, renderResults]);

  if (!target) return null;
  return createPortal(
    <FSDCatalogView
      products={products}
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
      // Direct links should land immediately; the global smooth-scroll rule is for in-page navigation.
      behavior: 'instant',
      block: 'start',
    }));
    return () => cancelAnimationFrame(frame);
  }, []);

  useLayoutEffect(() => mountLazyImageLoading(document), []);
  useLayoutEffect(() => mountScrollParallax(storefrontContentRef.current, window), []);

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
      <FSDCatalogPortal target={cataloguePortalTarget} />
      {featuredCarouselPortalTarget && createPortal(
        <CinematicCarousel />,
        featuredCarouselPortalTarget,
      )}
      <FSDReactUtilities />
    </div>
  );
}

const root = document.getElementById('app');
if (!root) throw new Error('FSD storefront root is missing.');
const reactRoot = import.meta.hot?.data?.reactRoot ?? createRoot(root);
if (import.meta.hot) {
  import.meta.hot.dispose(data => {
    data.reactRoot = reactRoot;
  });
}

const hardwareForgeExtensionPromise = import.meta.env.DEV
  ? import('./hardware-forge-development-integration.js')
  : Promise.resolve(null);

hardwareForgeExtensionPromise.then(hardwareForgeExtension => {
  hardwareForgeExtension?.registerHardwareForgeRoute();
  reactRoot.render(<AppRouter hardwareForgeExtension={hardwareForgeExtension} />);
});
