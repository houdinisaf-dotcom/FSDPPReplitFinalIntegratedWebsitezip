import { priceInfo } from '../catalogue-data.js';
import { aegisGiletPreviewPath } from '../aegis-gilet-preview-path.js';

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
  return `<button id="fsd-division-${id}" class="fsd-showcase-banner fsd-showcase-banner--${id}" type="button"
      data-division="${id}" aria-haspopup="dialog" aria-controls="fsd-showcase-dialog" aria-expanded="false">
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
  return `<section class="fsd-showcase" id="universe" aria-labelledby="fsd-showcase-title">
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
    <p class="fsd-showcase-note"><span>FSD</span> Products, technologies and locations shown may be proposed concepts and are not represented as operational or available to purchase.</p>
    <dialog id="fsd-showcase-dialog" class="fsd-showcase-dialog" aria-label="FSD collection details" data-showcase-dialog>
      <div class="fsd-dialog-frame">
        <header class="fsd-dialog-header">
          <div class="fsd-dialog-brandline"><span class="fsd-dialog-mark" aria-hidden="true">F</span><span>FSD / COLLECTIONS</span><span class="fsd-dialog-live">COLLECTION PREVIEW</span></div>
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
  const hasFilter = categories.length || audiences.length || terms.length;
  return Boolean(hasFilter) &&
    (!categories.length || categoryMatch) &&
    (!audiences.length || audienceMatch) &&
    (!terms.length || termMatch);
}

function productCard(product) {
  const isAegisPreview = import.meta.env.DEV && Number(product.id) === 46;
  const catalogueImage = Array.isArray(product.images) ? product.images[0] : null;
  const image = isAegisPreview
    ? {
      src: `${aegisGiletPreviewPath}media/front-three-quarter`,
      label: 'Aegis campaign image',
    }
    : catalogueImage;
  const category = product.category || 'FSD COLLECTION';
  const audience = product.audience ? `<span>${escapeHTML(product.audience)}</span>` : '';
  const masterPrice = priceInfo(product);
  const price = isAegisPreview
    ? { ...masterPrice, label: 'Catalogue reference' }
    : Number(product.id) === 43 && import.meta.env.DEV
    ? { ...masterPrice, label: 'Catalogue reference' }
    : masterPrice;
  const colourways = Number(product.id) === 43 && import.meta.env.DEV
    ? 'Black / Champagne Gold'
    : product.colourways;
  const description = product.coverage || product.priceBasis ||
    (colourways ? `Colourways: ${colourways}` : 'Explore product details.');
  const media = image
    ? isAegisPreview
      ? `<a class="fsd-product-media fsd-product-media--aegis-preview" href="${aegisGiletPreviewPath}" aria-label="Explore ${escapeHTML(product.name)}"><img loading="lazy" src="${escapeHTML(image.src)}" alt="${escapeHTML(image.label)}"><span>FSD AEGIS / CAMPAIGN</span></a>`
      : `<div class="fsd-product-media"><img loading="lazy" src="${escapeHTML(image.src)}" alt="${escapeHTML(product.name)} — ${escapeHTML(image.label || 'design concept')}"><span>DESIGN CONCEPT</span></div>`
    : `<div class="fsd-product-media fsd-product-media--placeholder" aria-hidden="true"><span class="fsd-placeholder-code">FSD<br/>/ /</span><span>${escapeHTML(category)}</span></div>`;
  const productTitle = isAegisPreview
    ? `<a class="fsd-aegis-preview-title" href="${aegisGiletPreviewPath}">${escapeHTML(product.name)}</a>`
    : escapeHTML(product.name);
  return `<article class="fsd-product-card">
    ${media}
    <div class="fsd-product-meta"><span>${escapeHTML(category)}</span>${audience}</div>
    <h4>${productTitle}</h4>
    <p class="fsd-product-description">${escapeHTML(description)}</p>
    <p class="fsd-product-reference">${price.label ? `${escapeHTML(price.label)} ` : ''}<strong>${escapeHTML(price.value)}</strong></p>
    <button class="fsd-product-link" type="button" data-product-id="${escapeHTML(product.id)}">VIEW DETAILS <span aria-hidden="true">↗</span><span class="fsd-sr-only"> for ${escapeHTML(product.name)}</span></button>
  </article>`;
}

function conceptCard(concept) {
  return `<article class="fsd-concept-card">
    <span class="fsd-concept-index" aria-hidden="true">FSD / CONCEPT</span>
    <h4>${escapeHTML(concept)}</h4>
    <span class="fsd-concept-tag">COLLECTION CONCEPT</span>
    <details class="fsd-concept-details"><summary>EXPLORE CONCEPT ↗</summary>
      <p>A design direction within the FSD collection.</p>
    </details>
  </article>`;
}


export function groupProducts(group, products, subcategory = null) {
  return products.filter(product => matchesGroup(product, group) &&
    (!subcategory || matchesGroup(product, subcategory)));
}

function modalContent(division, group, products, activeGroupIndex, activeSubcategoryIndex, draftProductCards) {
  const subcategory = group.subcategories?.[activeSubcategoryIndex] || null;
  const matchingDraftCards = draftProductCards.filter(card =>
    card.divisionId === division.id &&
    (card.groupId === '*' || card.groupId === group.id) &&
    (!card.showOnlyInAllProducts || activeSubcategoryIndex === -1));
  const replacedProductIds = new Set(matchingDraftCards
    .map(card => card.replacesProductId)
    .filter(id => id !== undefined && id !== null)
    .map(String));
  const foundProducts = groupProducts(group, products, subcategory)
    .filter(product => !replacedProductIds.has(String(product.id)));
  const concepts = subcategory ? (subcategory.concepts || []) :
    [...(group.concepts || []), ...(group.subcategories || []).flatMap(item => item.concepts || [])];
  const title = group.title || division.title;
  const conceptMarkup = concepts.length
    ? `<div class="fsd-modal-subhead"><span>02</span><h4>PROPOSED CONCEPTS</h4><i></i></div>
       <div class="fsd-concept-grid">${concepts.map(conceptCard).join('')}</div>`
    : '';
  const collectionProductMarkup = [
    ...foundProducts.map(productCard),
    ...matchingDraftCards.map(card => card.markup),
  ].join('');
  const collectionProductCount = foundProducts.length + matchingDraftCards.length;
  const productsMarkup = collectionProductCount
    ? `<div class="fsd-modal-subhead"><span>01</span><h4>THE COLLECTION</h4><i></i><small>${collectionProductCount} ${collectionProductCount === 1 ? 'ITEM' : 'ITEMS'}</small></div>
       <div class="fsd-product-grid">${collectionProductMarkup}</div>`
    : '';
  const emptyMarkup = !foundProducts.length && !concepts.length && !matchingDraftCards.length
    ? `<div class="fsd-showcase-empty"><span>FSD / ${String(activeGroupIndex + 1).padStart(2, '0')}</span><h4>Explore the collection.</h4><p>More items from this collection will appear here.</p></div>`
    : '';
  return `<div class="fsd-modal-hero fsd-modal-hero--${escapeHTML(division.visual || division.id)}">
      <span class="fsd-modal-kicker">${escapeHTML(division.title)} <span>/</span> DIVISION ${String(activeGroupIndex + 1).padStart(2, '0')}</span>
      <h2>${escapeHTML(title)}</h2>
      <p>${escapeHTML(division.tagline)}</p>
    </div>
    <nav class="fsd-group-nav" aria-label="Explore ${escapeHTML(division.title)} collections">
      ${(division.groups || []).map((item, index) => `<button type="button" class="fsd-group-tab${item.prominent ? ' fsd-group-tab--prominent' : ''}${index === activeGroupIndex ? ' is-active' : ''}" data-group-index="${index}" aria-pressed="${index === activeGroupIndex}">
        <span>${String(index + 1).padStart(2, '0')}</span>${escapeHTML(item.title)}
      </button>`).join('')}
    </nav>
    ${group.subcategories?.length ? `<nav class="fsd-subcategory-nav" aria-label="Product subcategories">
      <button type="button" data-subcategory-index="-1" aria-pressed="${activeSubcategoryIndex === -1}">ALL ${escapeHTML(group.title)}</button>
      ${group.subcategories.map((item, index) => `<button type="button" data-subcategory-index="${index}" aria-pressed="${index === activeSubcategoryIndex}">${escapeHTML(item.title)}</button>`).join('')}
    </nav>` : ''}
    <div class="fsd-modal-body">
      <div class="fsd-modal-description"><span>COLLECTION OVERVIEW</span><p>${escapeHTML(division.description)}</p></div>
      ${foundProducts.length ? '<button class="fsd-explore-collection" type="button" data-explore-collection>EXPLORE COLLECTION <span aria-hidden="true">↗</span></button>' : ''}
      ${productsMarkup}${conceptMarkup}${emptyMarkup}
      <p class="fsd-modal-disclaimer">FSD is developing its collection. Supplied list prices are catalogue references, not an offer to sell. Proposed concepts do not confirm specifications, availability or operational status. Product visuals appear only where mapped to that product record.</p>
    </div>`;
}

export function mountCollectionShowcase({
  root,
  divisions,
  products = [],
  onProductSelect = () => {},
  onExploreCollection = () => {},
  draftProductCard = '',
}) {
  if (!root || typeof root.insertAdjacentHTML !== 'function') {
    throw new TypeError('mountCollectionShowcase requires a DOM root element.');
  }
  const safeDivisions = Array.isArray(divisions) ? divisions : [];
  const safeProducts = Array.isArray(products) ? products : [];
  const activeDraftProductCards = draftProductCard
    ? [{
      id: 'initial-bio-lab-draft',
      divisionId: 'bio-lab',
      groupId: 'bio-lab-concepts',
      heading: 'FSD COLLECTION',
      markup: String(draftProductCard),
    }]
    : [];
  if (!root.querySelector('.fsd-showcase')) {
    root.insertAdjacentHTML('beforeend', renderCollectionShowcase(safeDivisions));
  }
  const sections = root.querySelectorAll('.fsd-showcase');
  const section = sections[sections.length - 1];
  if (!section) return () => {};

  const dialog = section.querySelector('[data-showcase-dialog]');
  const content = section.querySelector('[data-dialog-content]');
  let activeDivision = null;
  let activeGroupIndex = 0;
  let activeSubcategoryIndex = -1;
  let returnFocus = null;
  let afterClose = null;
  const page = root.ownerDocument?.documentElement || document.documentElement;

  const renderDialog = () => {
    if (!activeDivision) return;
    const group = activeDivision.groups?.[activeGroupIndex] || { title: activeDivision.title };
    content.innerHTML = modalContent(
      activeDivision,
      group,
      safeProducts,
      activeGroupIndex,
      activeSubcategoryIndex,
      activeDraftProductCards,
    );
    content.scrollTop = 0;
  };

  const open = (division, opener) => {
    if (!division) return;
    if (returnFocus && returnFocus !== opener) {
      returnFocus.setAttribute('aria-expanded', 'false');
      returnFocus.classList.remove('is-selected');
    }
    afterClose = null;
    activeDivision = division;
    activeGroupIndex = 0;
    activeSubcategoryIndex = -1;
    returnFocus = opener;
    returnFocus?.setAttribute('aria-expanded', 'true');
    returnFocus?.classList.add('is-selected');
    renderDialog();
    page.classList.add('fsd-modal-open');
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
      activeSubcategoryIndex = -1;
      renderDialog();
      dialog.querySelector(`[data-group-index="${activeGroupIndex}"]`)?.focus({ preventScroll: true });
      return;
    }
    const subcategoryButton = event.target.closest('[data-subcategory-index]');
    if (subcategoryButton && dialog.contains(subcategoryButton)) {
      activeSubcategoryIndex = Number(subcategoryButton.dataset.subcategoryIndex);
      renderDialog();
      dialog.querySelector(`[data-subcategory-index="${activeSubcategoryIndex}"]`)?.focus({ preventScroll: true });
      return;
    }
    const productButton = event.target.closest('[data-product-id]');
    if (productButton && dialog.contains(productButton)) {
      const selectedProduct = safeProducts.find(product => String(product.id) === productButton.dataset.productId);
      if (!selectedProduct) return;
      afterClose = () => onProductSelect(selectedProduct.id);
      dialog.close();
      return;
    }
    if (event.target.closest('[data-explore-collection]') && activeDivision) {
      const group = activeDivision.groups[activeGroupIndex];
      const subcategory = group.subcategories?.[activeSubcategoryIndex];
      afterClose = () => onExploreCollection({ ...group, query: subcategory?.productTerms?.[0] || '' });
      dialog.close();
    }
  };

  const onDialogClick = event => {
    if (event.target === dialog) dialog.close();
  };
  const onDialogClose = () => {
    // Native close events are queued; ignore an old event if already reopened.
    if (dialog.open) return;
    activeDivision = null;
    page.classList.remove('fsd-modal-open');
    returnFocus?.setAttribute('aria-expanded', 'false');
    returnFocus?.classList.remove('is-selected');
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
    const action = afterClose;
    afterClose = null;
    action?.();
  };
  const onKeyDown = event => {
    const current = event.target.closest('[data-group-index]');
    if (!current || !activeDivision || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const length = activeDivision.groups.length;
    activeGroupIndex = event.key === 'Home' ? 0 : event.key === 'End' ? length - 1 :
      (activeGroupIndex + (event.key === 'ArrowRight' ? 1 : -1) + length) % length;
    activeSubcategoryIndex = -1;
    renderDialog();
    dialog.querySelector(`[data-group-index="${activeGroupIndex}"]`)?.focus({ preventScroll: true });
  };

  section.addEventListener('click', onClick);
  dialog.addEventListener('click', onDialogClick);
  dialog.addEventListener('close', onDialogClose);
  dialog.addEventListener('keydown', onKeyDown);

  const unmount = () => {
    section.removeEventListener('click', onClick);
    dialog.removeEventListener('click', onDialogClick);
    dialog.removeEventListener('close', onDialogClose);
    dialog.removeEventListener('keydown', onKeyDown);
    if (dialog.open) {
      page.classList.remove('fsd-modal-open');
      dialog.close();
    }
    section.remove();
  };
  unmount.setDraftProductCard = (html, placement = {}) => {
    const id = String(placement.id || 'bio-lab-private-draft');
    const existingIndex = activeDraftProductCards.findIndex(card => card.id === id);
    if (!html) {
      if (existingIndex >= 0) activeDraftProductCards.splice(existingIndex, 1);
    } else {
      const card = {
        id,
        divisionId: String(placement.divisionId || 'bio-lab'),
        groupId: String(placement.groupId || 'bio-lab-concepts'),
        heading: String(placement.heading || 'FSD COLLECTION'),
        markup: String(html),
        ...(placement.replacesProductId !== undefined && placement.replacesProductId !== null
          ? { replacesProductId: String(placement.replacesProductId) }
          : {}),
        showOnlyInAllProducts: placement.showOnlyInAllProducts === true,
      };
      if (existingIndex >= 0) activeDraftProductCards[existingIndex] = card;
      else activeDraftProductCards.push(card);
    }
    if (dialog.open && activeDivision) renderDialog();
  };
  return unmount;
}
