import { useLayoutEffect, useMemo, useRef } from 'react';
import { products } from './catalogue-data.js';
import { collectionDivisions } from './collection-divisions.js';
import { renderStorefrontHeader } from './main.js';
import { mountNavigation } from './site-navigation.js';
import { FsdSearchModal } from './FsdSearchModal.jsx';

export function FsdNavigation({ onNavigate, onReady, hardwareForgeExtension }) {
  const containerRef = useRef(null);
  const markup = useMemo(() => renderStorefrontHeader(), []);

  useLayoutEffect(() => {
    const root = containerRef.current?.querySelector('[data-navigation-shell]');
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
      <div
        ref={containerRef}
        data-fsd-react-navigation
        style={{ display: 'contents' }}
        dangerouslySetInnerHTML={{ __html: markup }}
      />
      <FsdSearchModal />
    </>
  );
}
