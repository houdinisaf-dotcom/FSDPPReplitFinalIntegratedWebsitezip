import { useEffect, useRef } from 'react';
import { catalogueSection, initCatalogue } from './_shared/catalogue.js';
import './_group.css';

export function Current() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    root.innerHTML = `
      <details class="showroom-archive showroom-archive--catalogue" id="catalogue-archive" open>
        <summary>BROWSE THE FULL CATALOGUE</summary>
        ${catalogueSection()}
      </details>
      <dialog id="product-dialog" aria-labelledby="product-title">
        <button id="close-dialog" aria-label="Close product details">✕</button>
        <div id="dialog-body"></div>
      </dialog>
    `;
    initCatalogue();
    root.querySelector<HTMLDetailsElement>('#catalogue-archive')?.setAttribute('open', '');

    return () => root.replaceChildren();
  }, []);

  return <div className="fsd-catalogue-preview min-h-screen" ref={rootRef} />;
}
