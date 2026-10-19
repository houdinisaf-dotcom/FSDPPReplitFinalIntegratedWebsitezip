import './collection-showcase.css';

const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

const divisionNotes = {
  apparel: 'Performance apparel & modest movement',
  'bio-lab': 'Wearable technology concepts',
  hardware: 'Strength, combat & recovery',
  global: 'Proposed flagships & fight culture',
};

function renderBanner(division, index) {
  const id = escapeHTML(division.id);
  const count = String(index + 1).padStart(2, '0');
  return `<button class="fsd-showcase-banner fsd-showcase-banner--${id}" type="button"
      data-division="${id}" aria-haspopup="dialog" aria-controls="fsd-showcase-dialog">
    <span class="fsd-banner-art" aria-hidden="true"><i></i><i></i><i></i></span>
    <span class="fsd-banner-top"><span class="fsd-banner-number">${count} / 04</span><span class="fsd-banner-open">OPEN DIVISION <b aria-hidden="true">↗</b></span></span>
    <span class="fsd-banner-copy">
      <span class="fsd-banner-overline">${escapeHTML(divisionNotes[division.id] || 'FSD / PERFORMANCE')}</span>
      <strong>${escapeHTML(division.title)}</strong>
      <span class="fsd-banner-tagline">${escapeHTML(division.tagline)}</span>
    </span>
    <span class="fsd-banner-bottom"><span>${escapeHTML(division.description)}</span><span class="fsd-banner-index" aria-hidden="true">${count}</span></span>
  </button>`;
}

export function renderCollectionShowcase(divisions) {
  const list = Array.isArray(divisions) ? divisions : [];
  return `<section class="fsd-showcase" aria-labelledby="fsd-showcase-title">
    <div class="fsd-showcase-heading">
      <div>
        <p class="fsd-showcase-kicker"><span></span> THE FSD COLLECTION SYSTEM</p>
        <h2 id="fsd-showcase-title">EXPLORE THE FSD<br/><em>UNIVERSE.</em></h2>
      </div>
      <p class="fsd-showcase-intro">Four divisions. One philosophy.<br/>Engineered for performance, discipline and progress.</p>
      <span class="fsd-showcase-index" aria-hidden="true">FSD / 01—04</span>
    </div>
    <div class="fsd-showcase-grid">
      ${list.map(renderBanner).join('')}
    </div>
    <p class="fsd-showcase-note"><span>PRE-LAUNCH</span> Products, technologies and locations shown may be proposed concepts and are not represented as operational or available to purchase.</p>
    <dialog class="fsd-showcase-dialog" aria-label="FSD collection details" data-showcase-dialog>
      <div class="fsd-dialog-frame">
        <header class="fsd-dialog-header">
          <div class="fsd-dialog-brandline"><span class="fsd-dialog-mark" aria-hidden="true">F</span><span>FSD / COLLECTIONS</span><span class="fsd-dialog-live">PRE-LAUNCH SHOWROOM</span></div>
          <button class="fsd-dialog-close" type="button" data-close-dialog aria-label="Close collection">CLOSE <span aria-hidden="true">×</span></button>
        </header>
        <div class="fsd-dialog-content" data-dialog-content></div>
      </div>
    </dialog>
  </section>`;
}

function normalizedText(value) {
  return String(value ?? '').toLocaleLowerCase('en-GB').replace(/[‘’]/g, "'");
}

function matchesGroup(product, group) {
  const categories = Array.isArray(group.categories) ? group.categories : [];
  const audiences = Array.isArray(group.audiences) ? group.audiences : [];
  const terms = Array.isArray(group.productTerms) ? group.productTerms : [];
  const categoryMatch = categories.some(category =>
    product.category === category || (Array.isArray(product.alsoShowIn) && product.alsoShowIn.includes(category)));
  const audienceMatch = audiences.some(audience => product.audience === audience);
  const searchable = normalizedText([
    product.name, product.alias, product.category, ...(product.alsoShowIn || []),
    product.audience, product.collection,
  ].join(' '));
  const termMatch = terms.some(term => searchable.includes(normalizedText(term)));
  return categoryMatch || audienceMatch || termMatch;
}

function productCard(product) {
  const image = Array.isArray(product.images) ? product.images[0] : null;
  const category = product.category || 'FSD COLLECTION';
  const audience = product.audience ? `<span>${escapeHTML(product.audience)}</span>` : '';
  const media = image
    ? `<div class="fsd-product-media"><img loading="lazy" src="${escapeHTML(image.src)}" alt="${escapeHTML(product.name)} — ${escapeHTML(image.label || 'design concept')}"><span>DESIGN CONCEPT</span></div>`
    : `<div class="fsd-product-media fsd-product-media--placeholder" aria-hidden="true"><span class="fsd-placeholder-code">FSD<br/>/ /</span><span>${escapeHTML(category)}</span></div>`;
  return `<article class="fsd-product-card">
    ${media}
    <div class="fsd-product-meta"><span>${escapeHTML(category)}</span>${audience}</div>
    <h4>${escapeHTML(product.name)}</h4>
    <p class="fsd-product-status">PRE-LAUNCH RECORD <span aria-hidden="true">·</span> DETAILS SUBJECT TO CONFIRMATION</p>
    <button class="fsd-product-link" type="button" data-product-id="${escapeHTML(product.id)}">VIEW PRODUCT RECORD <span aria-hidden="true">↗</span><span class="fsd-sr-only"> for ${escapeHTML(product.name)}</span></button>
  </article>`;
}

function conceptCard(concept) {
  return `<article class="fsd-concept-card">
    <span class="fsd-concept-index" aria-hidden="true">FSD / CONCEPT</span>
    <h4>${escapeHTML(concept)}</h4>
    <span class="fsd-concept-tag">PROPOSED CONCEPT</span>
  </article>`;
}

function groupProducts(group, products) {
  return products.filter(product => matchesGroup(product, group));
}

function modalContent(division, group, products, activeGroupIndex) {
  const foundProducts = groupProducts(group, products);
  const concepts = Array.isArray(group.concepts) ? group.concepts : [];
  const title = group.title || division.title;
  const conceptMarkup = concepts.length
    ? `<div class="fsd-modal-subhead"><span>02</span><h4>PROPOSED CONCEPTS</h4><i></i></div>
       <div class="fsd-concept-grid">${concepts.map(conceptCard).join('')}</div>`
    : '';
  const productsMarkup = foundProducts.length
    ? `<div class="fsd-modal-subhead"><span>01</span><h4>PRODUCT RECORDS</h4><i></i><small>${foundProducts.length} ${foundProducts.length === 1 ? 'RECORD' : 'RECORDS'}</small></div>
       <div class="fsd-product-grid">${foundProducts.map(productCard).join('')}</div>`
    : '';
  const emptyMarkup = !foundProducts.length && !concepts.length
    ? `<div class="fsd-showcase-empty"><span>FSD / ${String(activeGroupIndex + 1).padStart(2, '0')}</span><h4>Collection details are in development.</h4><p>No product records or proposed concepts are currently listed for this selection.</p></div>`
    : '';
  return `<div class="fsd-modal-hero fsd-modal-hero--${escapeHTML(division.visual || division.id)}">
      <span class="fsd-modal-kicker">${escapeHTML(division.title)} <span>/</span> DIVISION ${String(activeGroupIndex + 1).padStart(2, '0')}</span>
      <h2>${escapeHTML(title)}</h2>
      <p>${escapeHTML(division.tagline)}</p>
    </div>
    <nav class="fsd-group-nav" aria-label="Explore ${escapeHTML(division.title)} collections">
      ${(division.groups || []).map((item, index) => `<button type="button" class="fsd-group-tab${index === activeGroupIndex ? ' is-active' : ''}" data-group-index="${index}" aria-pressed="${index === activeGroupIndex}">
        <span>${String(index + 1).padStart(2, '0')}</span>${escapeHTML(item.title)}
      </button>`).join('')}
    </nav>
    <div class="fsd-modal-body">
      <div class="fsd-modal-description"><span>COLLECTION OVERVIEW</span><p>${escapeHTML(division.description)}</p></div>
      ${productsMarkup}${conceptMarkup}${emptyMarkup}
      <p class="fsd-modal-disclaimer">FSD is a pre-launch brand. Product records and proposed concepts are for exploration only; pricing, specifications, availability and operational status are not implied. Product visuals appear only where mapped to that product record.</p>
    </div>`;
}

export function mountCollectionShowcase({ root, divisions, products = [], onProductSelect = () => {} }) {
  if (!root || typeof root.insertAdjacentHTML !== 'function') {
    throw new TypeError('mountCollectionShowcase requires a DOM root element.');
  }
  const safeDivisions = Array.isArray(divisions) ? divisions : [];
  const safeProducts = Array.isArray(products) ? products : [];
  root.insertAdjacentHTML('beforeend', renderCollectionShowcase(safeDivisions));
  const sections = root.querySelectorAll('.fsd-showcase');
  const section = sections[sections.length - 1];
  if (!section) return () => {};

  const dialog = section.querySelector('[data-showcase-dialog]');
  const content = section.querySelector('[data-dialog-content]');
  let activeDivision = null;
  let activeGroupIndex = 0;
  let returnFocus = null;

  const renderDialog = () => {
    if (!activeDivision) return;
    const group = activeDivision.groups?.[activeGroupIndex] || { title: activeDivision.title };
    content.innerHTML = modalContent(activeDivision, group, safeProducts, activeGroupIndex);
  };

  const open = (division, opener) => {
    if (!division) return;
    activeDivision = division;
    activeGroupIndex = 0;
    returnFocus = opener;
    renderDialog();
    if (!dialog.open) dialog.showModal();
    const closeButton = dialog.querySelector('[data-close-dialog]');
    closeButton?.focus({ preventScroll: true });
  };

  const onClick = event => {
    const opener = event.target.closest('[data-division]');
    if (opener && section.contains(opener)) {
      open(safeDivisions.find(division => division.id === opener.dataset.division), opener);
      return;
    }
    if (event.target.closest('[data-close-dialog]')) {
      dialog.close();
      return;
    }
    const tab = event.target.closest('[data-group-index]');
    if (tab && dialog.contains(tab)) {
      activeGroupIndex = Number(tab.dataset.groupIndex);
      renderDialog();
      dialog.querySelector(`[data-group-index="${activeGroupIndex}"]`)?.focus({ preventScroll: true });
      return;
    }
    const productButton = event.target.closest('[data-product-id]');
    if (productButton && dialog.contains(productButton)) {
      const selectedProduct = safeProducts.find(product => String(product.id) === productButton.dataset.productId);
      if (!selectedProduct) return;
      dialog.close();
      onProductSelect(selectedProduct.id);
    }
  };

  const onDialogClick = event => {
    if (event.target === dialog) dialog.close();
  };
  const onDialogClose = () => {
    activeDivision = null;
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
  };

  section.addEventListener('click', onClick);
  dialog.addEventListener('click', onDialogClick);
  dialog.addEventListener('close', onDialogClose);

  return () => {
    section.removeEventListener('click', onClick);
    dialog.removeEventListener('click', onDialogClick);
    dialog.removeEventListener('close', onDialogClose);
    section.remove();
  };
}
