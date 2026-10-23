import { createRoot } from 'react-dom/client';
import { useEffect, useMemo } from 'react';
import { renderStorefrontMarkup, mountStorefrontRuntime } from './main.js';
import { FSDReactUtilities } from './react-utilities.jsx';
import './tailwind.css';
import './react-utilities.css';

function StorefrontApp() {
  const markup = useMemo(() => renderStorefrontMarkup(), []);

  useEffect(() => {
    mountStorefrontRuntime();
  }, []);

  return (
    <>
      <div data-fsd-storefront dangerouslySetInnerHTML={{ __html: markup }} />
      <FSDReactUtilities />
    </>
  );
}

const root = document.getElementById('app');
if (!root) throw new Error('FSD storefront root is missing.');

createRoot(root).render(<StorefrontApp />);
