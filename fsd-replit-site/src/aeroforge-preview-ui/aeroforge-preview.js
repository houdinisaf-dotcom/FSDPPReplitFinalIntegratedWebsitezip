const colourOrder = ['Black', 'Grey', 'Navy', 'Olive', 'Mauve', 'White'];
const swatchColours = {
  black: '#171819',
  grey: '#85868a',
  navy: '#1d2a3e',
  olive: '#62654a',
  mauve: '#a27e86',
  white: '#e5e2dc',
};
const routeHash = {
  collection: '#aeroforge-collection',
  top: '#aeroforge-training-top',
  joggers: '#aeroforge-performance-joggers',
};
let instanceCount = 0;

const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));
const keyFor = value => String(value ?? '').toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
const firstBy = (items, predicate) => (Array.isArray(items) ? items : []).find(predicate);
const productKind = product => /jogger/i.test(`${product?.id ?? ''} ${product?.name ?? ''}`) ? 'joggers' : 'top';
const safeSwatch = value => /^#[\da-f]{3,8}$/i.test(String(value ?? '')) ? value : '#77736b';

export function mountAeroForgePreview(root, data) {
  if (!root || !data?.collection || !Array.isArray(data.products)) {
    throw new TypeError('AeroForge preview requires a root, collection, and products array.');
  }
  const collection = data.collection;
  const products = {
    top: firstBy(data.products, product => productKind(product) === 'top'),
    joggers: firstBy(data.products, product => productKind(product) === 'joggers'),
  };
  const id = `af-selector-${++instanceCount}`;
  let activeDialog = null;
  let returnFocus = null;
  let destroyed = false;

  const variantsFor = product => colourOrder.map(colour => {
    const variant = firstBy(product?.variants, item => keyFor(item.colour) === keyFor(colour));
    return variant ? { ...variant, colour, src: variant.src || '' } : null;
  }).filter(Boolean);

  root.innerHTML = `
    <div class="af-preview">
      <div class="af-shell">
        <nav class="af-crumb" aria-label="Breadcrumb"><a href="/#collections">FSD</a><span>/</span><span>AEROFORGE</span></nav>
        <div class="af-ribbon"><span><i aria-hidden="true"></i> FSD APPAREL / MODEST ACTIVEWEAR</span><span>AEROFORGE COLLECTION</span></div>
      </div>
      <main class="af-main" id="af-main"></main>
      <footer class="af-footer"><div class="af-shell">
        <span class="af-footer-brand">FSD <i>/</i> AEROFORGE</span>
        <span>CONCEPT</span>
      </div></footer>
    </div>`;

  const main = root.querySelector('#af-main');
  const dialogs = new Map();

  function renderCollection() {
    const hero = collection.hero || {};
    const headlineWords = String(collection.headline || 'MOVE WITH CONFIDENCE.').trim().split(/\s+/);
    const headlineHighlight = headlineWords.pop() || '';
    const headlineLead = headlineWords.join(' ');
    main.innerHTML = `
      <section class="af-shell af-collection" aria-labelledby="af-collection-title">
        <div class="af-collection-copy">
          <p class="af-eyebrow">FSD / AEROFORGE</p>
          <p class="af-kicker">${escapeHTML(collection.name || 'AeroForge Modest Activewear')}</p>
          <h1 id="af-collection-title"><span>${escapeHTML(headlineLead)}</span><br><em>${escapeHTML(headlineHighlight)}</em></h1>
          <p class="af-tagline">${escapeHTML(collection.supportingText || '')}</p>
          <p class="af-description">${escapeHTML(collection.description || '')}</p>
          <p class="af-prelaunch-note"><span aria-hidden="true">—</span><span><strong>DEVELOPMENT</strong><small>Product details are being finalised.</small></span></p>
        </div>
        <figure class="af-campaign">
          <div class="af-campaign-image"><img src="${escapeHTML(hero.src || '')}" alt="FSD AeroForge collection campaign image" loading="eager"></div>
          <figcaption><span>AEROFORGE COLLECTION</span><span>CAMPAIGN IMAGE</span></figcaption>
        </figure>
      </section>
      <section class="af-shell af-products" aria-labelledby="af-products-heading">
        <div class="af-section-heading"><div><p class="af-eyebrow">THE COLLECTION</p><h2 id="af-products-heading">Choose your<br><em>piece.</em></h2></div>
          <p>Explore each product separately.</p></div>
        <div class="af-product-links">
          ${renderChoice('top', products.top, '01 / TRAINING TOP')}
          ${renderChoice('joggers', products.joggers, '02 / JOGGERS')}
        </div>
      </section>`;
  }

  function renderChoice(kind, product, indexLabel) {
    if (!product) return '';
    const firstVariant = variantsFor(product)[0];
    const image = firstVariant?.src
      ? `<img class="af-product-card-image" src="${escapeHTML(firstVariant.src)}" alt="${escapeHTML(kind === 'joggers' ? `FSD AeroForge joggers in ${firstVariant.colour}, shown as part of a coordinated outfit` : `FSD AeroForge training top in ${firstVariant.colour}, shown in a coordinated outfit`)}" loading="lazy">`
      : '<span class="af-product-card-image af-card-image-pending" aria-hidden="true"></span>';
    return `<button type="button" class="af-product-link" data-af-open="${kind}" aria-haspopup="dialog" aria-controls="${id}-${kind}">
      ${image}<span class="af-product-number">${indexLabel}</span>
      <span class="af-product-title">${escapeHTML(product.name)}</span>
      <span class="af-product-description">${escapeHTML(product.description || '')}</span>
      <span class="af-link-action">EXPLORE PRODUCT <b aria-hidden="true">↗</b></span>
    </button>`;
  }

  function renderSelector(kind, product) {
    if (!product) return null;
    const variants = variantsFor(product);
    const initial = variants[0];
    const variantButtons = variants.map(variant => `
      <button class="af-selector__swatch" type="button" data-af-variant="${escapeHTML(variant.id)}"
        aria-label="Select ${escapeHTML(variant.colour)}" aria-pressed="${String(variant === initial)}">
        <span class="af-selector__swatch-dot" aria-hidden="true" style="--af-swatch:${escapeHTML(safeSwatch(variant.swatch))}"></span>
        <span class="af-selector__swatch-name">${escapeHTML(variant.colour)}</span>
      </button>`).join('');
    const details = kind === 'top' ? (Array.isArray(product.details) ? product.details.filter(detail => detail.src) : []) : [];
    const dialog = document.createElement('dialog');
    dialog.className = 'af-selector';
    dialog.id = `${id}-${kind}`;
    dialog.setAttribute('aria-labelledby', `${id}-${kind}-title`);
    dialog.innerHTML = `<div class="af-selector__layout">
      <div class="af-selector__visual">
        ${initial?.src ? `<img class="af-selector__image" data-af-image src="${escapeHTML(initial.src)}" alt="${escapeHTML(imageAlt(kind, initial))}">` : '<div class="af-selector__image af-selector__image-pending" aria-hidden="true"></div>'}
        <span class="af-selector__visual-note" data-af-image-note>${escapeHTML(imageLabel(kind, initial))}</span>
      </div>
      <section class="af-selector__details">
        <button class="af-selector__close" type="button" data-af-close aria-label="Close product details"><span aria-hidden="true">×</span></button>
        <p class="af-eyebrow">FSD <span aria-hidden="true">/</span> AEROFORGE</p>
        <h2 class="af-selector__title" id="${id}-${kind}-title">${escapeHTML(product.name)}</h2>
        <p class="af-selector__description">${escapeHTML(product.description || '')}</p>
        <p class="af-product-pending">Product details are being finalised.</p>
        <hr class="af-selector__rule">
        <div class="af-selector__colour-heading"><span>Colour</span><span class="af-selector__current-colour" data-af-colour>${escapeHTML(initial?.colour || '')}</span></div>
        <div class="af-selector__swatches" role="group" aria-label="Choose a colour">${variantButtons}</div>
        ${details.length ? `<section class="af-selector__supplied-details" aria-label="Supplied detail images">
          <p>DETAIL VIEWS</p><div>${details.map(detail => `<button type="button" data-af-detail="${escapeHTML(detail.id)}">${escapeHTML(detail.label)}</button>`).join('')}</div>
        </section>` : ''}
        <span class="af-selector__live" aria-live="polite" aria-atomic="true" data-af-dialog-live></span>
      </section></div>`;

    const image = dialog.querySelector('[data-af-image]');
    const colourLabel = dialog.querySelector('[data-af-colour]');
    const imageNote = dialog.querySelector('[data-af-image-note]');
    const closeButton = dialog.querySelector('[data-af-close]');
    const liveRegion = dialog.querySelector('[data-af-dialog-live]');
    dialog.querySelectorAll('[data-af-variant]').forEach(button => {
      button.addEventListener('click', () => {
        const variant = variants.find(item => String(item.id) === button.dataset.afVariant);
        if (!variant?.src || !image) return;
        image.src = variant.src;
        image.alt = imageAlt(kind, variant);
        imageNote.textContent = imageLabel(kind, variant);
        colourLabel.textContent = variant.colour;
        liveRegion.textContent = `${variant.colour} selected. ${imageLabel(kind, variant)}`;
        dialog.querySelectorAll('[data-af-variant]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
        dialog.querySelectorAll('[data-af-detail]').forEach(item => item.setAttribute('aria-pressed', 'false'));
      });
    });
    dialog.querySelectorAll('[data-af-detail]').forEach(button => {
      button.addEventListener('click', () => {
        const detail = details.find(item => String(item.id) === button.dataset.afDetail);
        if (!detail?.src || !image) return;
        image.src = detail.src;
        image.alt = detail.alt || detail.label;
        imageNote.textContent = `${detail.label} · supplied detail image`;
        liveRegion.textContent = `${detail.label} detail image selected`;
        dialog.querySelectorAll('[data-af-detail]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
        dialog.querySelectorAll('[data-af-variant]').forEach(item => item.setAttribute('aria-pressed', 'false'));
      });
    });
    dialog.addEventListener('click', event => {
      if (event.target === dialog) closeSelector();
      if (event.target.closest('[data-af-close]')) closeSelector();
    });
    dialog.addEventListener('cancel', event => {
      event.preventDefault();
      closeSelector();
    });
    dialog.addEventListener('close', restoreFocus);
    root.append(dialog);
    return { dialog, closeButton, kind };
  }

  function imageAlt(kind, variant) {
    return kind === 'joggers'
      ? `FSD AeroForge joggers in ${variant.colour}, shown as part of a coordinated outfit.`
      : `FSD AeroForge training top in ${variant.colour}, shown in a coordinated outfit.`;
  }

  function imageLabel(kind, variant) {
    if (!variant) return 'Product image';
    return `${variant.colour} · OUTFIT REFERENCE`;
  }

  function restoreFocus() {
    if (destroyed) return;
    const opener = returnFocus;
    returnFocus = null;
    activeDialog = null;
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  }

  function openSelector(kind, opener) {
    const selector = dialogs.get(kind);
    if (!selector || selector.dialog.open) return;
    returnFocus = opener;
    activeDialog = selector;
    selector.dialog.showModal();
    selector.closeButton.focus({ preventScroll: true });
    if (window.location.hash !== routeHash[kind]) {
      window.history.pushState({ aeroforge: kind }, '', `${window.location.pathname}${window.location.search}${routeHash[kind]}`);
    }
  }

  function closeSelector() {
    if (!activeDialog?.dialog.open) return;
    const shouldGoBack = window.location.hash === routeHash[activeDialog.kind];
    activeDialog.dialog.close();
    if (shouldGoBack) window.history.back();
  }

  for (const [kind, product] of Object.entries(products)) {
    if (product) dialogs.set(kind, renderSelector(kind, product));
  }
  renderCollection();

  const onRootClick = event => {
    const opener = event.target.closest?.('[data-af-open]');
    if (opener && root.contains(opener)) openSelector(opener.dataset.afOpen, opener);
  };
  const onPopState = () => {
    const route = Object.keys(routeHash).find(key => routeHash[key] === window.location.hash);
    if (activeDialog && route !== activeDialog.kind) activeDialog.dialog.close();
    else if (!activeDialog && (route === 'top' || route === 'joggers')) {
      const opener = root.querySelector(`[data-af-open="${route}"]`);
      openSelector(route, opener);
    }
  };
  const onHashChange = () => {
    const route = Object.keys(routeHash).find(key => routeHash[key] === window.location.hash);
    if (activeDialog && route !== activeDialog.kind) activeDialog.dialog.close();
    else if (!activeDialog && (route === 'top' || route === 'joggers')) openSelector(route, root.querySelector(`[data-af-open="${route}"]`));
  };
  root.addEventListener('click', onRootClick);
  window.addEventListener('popstate', onPopState);
  window.addEventListener('hashchange', onHashChange);

  const initialRoute = Object.keys(routeHash).find(key => routeHash[key] === window.location.hash);
  if (initialRoute === 'top' || initialRoute === 'joggers') {
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${routeHash.collection}`);
    openSelector(initialRoute, root.querySelector(`[data-af-open="${initialRoute}"]`));
  }

  return {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      root.removeEventListener('click', onRootClick);
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('hashchange', onHashChange);
      for (const selector of dialogs.values()) {
        selector.dialog.removeEventListener('close', restoreFocus);
        if (selector.dialog.open) selector.dialog.close();
        selector.dialog.remove();
      }
      root.replaceChildren();
    },
    navigate(route) {
      if (route === 'collection') closeSelector();
      else if (route === 'top' || route === 'joggers') openSelector(route, root.querySelector(`[data-af-open="${route}"]`));
    },
  };
}
