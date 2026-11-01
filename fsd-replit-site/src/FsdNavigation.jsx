import { createPortal } from 'react-dom';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { products } from './data/products.js';
import { collectionDivisions } from './collection-divisions.js';
import { renderStorefrontHeader } from './main.js';
import { mountNavigation } from './site-navigation.js';
import { FsdSearchModal } from './FsdSearchModal.jsx';
import { FsdLogo } from './brand/Logos.jsx';

export function FsdNavigation({ onNavigate, onReady, hardwareForgeExtension }) {
  const containerRef = useRef(null);
  const [logoTarget, setLogoTarget] = useState(null);
  const markup = useMemo(() => renderStorefrontHeader(), []);

  useLayoutEffect(() => {
    const container = containerRef.current;
    setLogoTarget(container?.querySelector('[data-fsd-logo-slot="header"]') ?? null);
    const root = container?.querySelector('[data-navigation-shell]');
    if (!root) throw new TypeError('FSD navigation shell is missing.');

    const unmount = mountNavigation({
      root,
      divisions: collectionDivisions,
      products,
      includeDraftPreviews: import.meta.env.DEV,
      configureMenus: hardwareForgeExtension?.configureHardwareForgeMenu,
      onNavigate,
    });
    onReady?.();

    return () => unmount?.();
  }, [onNavigate, onReady]);

  return (
    <>
      <a className="fsd-skip-link" href="#home">Skip to content</a>
      <div
        ref={containerRef}
        data-fsd-react-navigation
        style={{ display: 'contents' }}
        dangerouslySetInnerHTML={{ __html: markup }}
      />
      {logoTarget && createPortal(
        <FsdLogo alt="" aria-hidden="true" loading="eager" />,
        logoTarget,
      )}
      <FsdSearchModal />
    </>
  );
}
