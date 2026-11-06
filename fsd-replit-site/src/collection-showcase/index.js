import { customerFacingCategory, isHardwareVisualPreviewProduct, priceInfo } from '../catalogue-data.js';
import {
  productCardColourwaysMarkup,
  productCardImageMarkup,
  productColourwayOptions,
} from '../product-card-media.js';
import { productImagesForDisplay } from '../data/products.js';
import { siteMedia } from '../data/site-media.js';
import { imagePlaceholderMarkup } from '../image-placeholder.js';
import { trackEvent } from '../analytics.js';
import { FSD_MOTION, prefersReducedMotion } from '../motion-config.js';
import { animateElement } from '../motion-runtime.js';

const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

const divisionNotes = {
  apparel: 'Performance apparel & modest movement',
  'bio-lab': 'Wearable technology',
  hardware: 'Strength, combat & recovery',
  global: 'Proposed flagships & fight culture',
};

const divisionDestinations = {
  apparel: 'EXPLORE APPAREL',
  'bio-lab': 'EXPLORE BIO-LAB™',
  hardware: 'EXPLORE HARDWARE',
  global: 'EXPLORE GLOBAL',
};

function renderBanner(division, index) {
  const id = escapeHTML(division.id);
  const count = String(index + 1).padStart(2, '0');
  return `<button id="fsd-division-${id}" class="fsd-showcase-banner fsd-showcase-banner--${id}" type="button"
      data-division="${id}" aria-haspopup="dialog" aria-controls="fsd-showcase-dialog" aria-expanded="false">
    ${division.id === 'apparel' ? `
      <img class="fsd-banner-image fsd-banner-image--left" src="/images/ombre-blue.png" alt="" aria-hidden="true" loading="lazy" decoding="async"/>
      <img class="fsd-banner-image fsd-banner-image--right" src="/images/fsd-velocity-performance-sports-hijab.jpg" alt="" aria-hidden="true" loading="lazy" decoding="async"/>` : ''}
    <span class="fsd-banner-art" aria-hidden="true"><i></i><i></i><i></i></span>
    <span class="fsd-banner-top"><span class="fsd-banner-number">${count} / 04</span><span class="fsd-banner-open">${escapeHTML(divisionDestinations[division.id] || 'EXPLORE COLLECTION')} <b aria-hidden="true">↗</b></span></span>
    <span class="fsd-banner-copy">
      <span class="fsd-banner-overline">${escapeHTML(divisionNotes[division.id] || 'FSD / PERFORMANCE')}</span>
      <strong>${escapeHTML(division.title)}</strong>
      <span class="fsd-banner-tagline">${escapeHTML(division.tagline)}</span>
    </span>
    <span class="fsd-banner-bottom fsd-glass-surface"><span>${escapeHTML(division.description)}</span></span>
  </button>`;
}

export function renderCollectionShowcase(divisions, { editorial = false, products = [] } = {}) {
  const list = Array.isArray(divisions) ? divisions : [];
  const dialogMarkup = `<dialog id="fsd-showcase-dialog" class="fsd-showcase-dialog" aria-label="FSD collection details" data-showcase-dialog>
      <div class="fsd-dialog-frame">
        <header class="fsd-dialog-header fsd-glass-surface">
          <div class="fsd-dialog-brandline"><span class="fsd-dialog-mark" aria-hidden="true">F</span><span>FSD / COLLECTIONS</span></div>
          <button class="fsd-dialog-close" type="button" data-close-dialog aria-label="Close collection">CLOSE <span aria-hidden="true">×</span></button>
        </header>
        <div class="fsd-dialog-content" data-dialog-content></div>
      </div>
    </dialog>`;

  if (editorial) {
    const apparel = list.find(division => division.id === 'apparel');
    const bioLab = list.find(division => division.id === 'bio-lab');
    const hardware = list.find(division => division.id === 'hardware');
    const global = list.find(division => division.id === 'global');
    const mensGroup = apparel?.groups?.[0];
    const mensProduct = (Array.isArray(products) ? products : [])
      .find(product => mensGroup && matchesGroup(product, mensGroup) && productImagesForDisplay(product).length);
    const mensImages = productImagesForDisplay(mensProduct);
    const mensCover = siteMedia.collectionCards.mens?.src
      || mensImages.find(image => /front/i.test(image.src))?.src
      || mensImages[0]?.src
      || '';
    const card = (division, groupIndex, number, eyebrow, title, note, className = '', imageSrc = '') => division
      ? `<button class="fsd-editorial-card ${className}" type="button" data-division="${escapeHTML(division.id)}"
          data-group-index="${groupIndex}" aria-haspopup="dialog" aria-controls="fsd-showcase-dialog" aria-expanded="false">
          <span class="fsd-editorial-card__media-slot">
            ${imageSrc
              ? `<img class="fsd-editorial-card__image" src="${escapeHTML(imageSrc)}" alt="${escapeHTML(title)}" data-fsd-image-fallback="true" data-fsd-image-title="${escapeHTML(title)}" data-fsd-image-kind="collection" loading="lazy" decoding="async"/>`
              : imagePlaceholderMarkup({ title, kind: 'collection', className: 'fsd-editorial-card__image-placeholder' })}
          </span>
          <span class="fsd-editorial-card__eyebrow">${number} <i aria-hidden="true">/</i> ${escapeHTML(eyebrow)}</span>
          <strong>${escapeHTML(title)}</strong>
          <span class="fsd-editorial-card__note">${escapeHTML(note)}</span>
          <span class="fsd-editorial-card__action">${title === 'MEN’S COLLECTION' ? 'EXPLORE MEN' : title === 'WOMEN’S COLLECTION' ? 'EXPLORE WOMEN' : 'EXPLORE BIO-LAB™'} <b aria-hidden="true">↗</b></span>
        </button>`
      : '';

    return `<section class="fsd-showcase fsd-showcase--editorial" id="universe" aria-label="FSD performance divisions and collections">
      <nav class="fsd-division-strip" aria-label="Explore FSD divisions">
        <button class="fsd-division-link" type="button" data-division="apparel" data-group-index="0" aria-haspopup="dialog" aria-controls="fsd-showcase-dialog">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 20 6v6c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-4Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></svg>
          <span><strong>PERFORMANCE APPAREL</strong><small>Engineered for movement.</small></span>
        </button>
        <button class="fsd-division-link" type="button" data-division="bio-lab" data-group-index="0" aria-haspopup="dialog" aria-controls="fsd-showcase-dialog">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6M10 3v6l-5.7 9.2A1.8 1.8 0 0 0 5.8 21h12.4a1.8 1.8 0 0 0 1.5-2.8L14 9V3"/><path d="M8 15h8"/></svg>
          <span><strong>BIO-LAB™</strong><small>Advanced material science.</small></span>
        </button>
        <button class="fsd-division-link" type="button" data-division="hardware" data-group-index="0" aria-haspopup="dialog" aria-controls="fsd-showcase-dialog">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></svg>
          <span><strong>HARDWARE</strong><small>Training essentials.</small></span>
        </button>
        <a class="fsd-division-link" href="/the-house.html">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1V10Z"/></svg>
          <span><strong>THE HOUSE</strong><small>Six divisions. One purpose.</small></span>
        </a>
      </nav>
      <div class="fsd-editorial-grid">
        ${card(apparel, 0, '01', 'TIGER / SCORPION', 'MEN’S COLLECTION', '', 'fsd-editorial-card--men', mensCover)}
        ${card(apparel, 1, '02', 'AEROFORGE / COMBAT / FLEX / BREEZE / MODEST FLOW', 'WOMEN’S COLLECTION', '', 'fsd-editorial-card--women', siteMedia.collectionCards.womens?.src || '')}
        ${card(bioLab, 0, '03', 'INNOVATION IN PERFORMANCE', 'BIO-LAB™', '', 'fsd-editorial-card--biolab', siteMedia.collectionCards.bioLab?.src || '')}
      </div>
      <nav class="fsd-editorial-secondary" aria-label="Other FSD divisions">
        ${hardware ? `<button id="fsd-division-hardware" type="button" data-division="hardware" data-group-index="0" aria-haspopup="dialog" aria-controls="fsd-showcase-dialog" aria-expanded="false">Explore Hardware <span aria-hidden="true">↗</span></button>` : ''}
        ${global ? `<button id="fsd-division-global" type="button" data-division="global" data-group-index="0" aria-haspopup="dialog" aria-controls="fsd-showcase-dialog" aria-expanded="false">Explore FSD Global <span aria-hidden="true">↗</span></button>` : ''}
      </nav>
      ${dialogMarkup}
    </section>`;
  }

  return `<section class="fsd-showcase" id="universe" aria-labelledby="fsd-showcase-title">
    <div class="fsd-showcase-heading">
      <div>
        <p class="fsd-showcase-kicker"><span></span> THE FSD COLLECTION SYSTEM</p>
        <h2 id="fsd-showcase-title">EXPLORE THE FSD<br/><em>UNIVERSE.</em></h2>
      </div>
      <p class="fsd-showcase-intro">Four divisions. One philosophy.<br/>Engineered for performance, discipline and progress.</p>
    </div>
    <div class="fsd-showcase-grid">
      ${list.map(renderBanner).join('')}
    </div>
    <p class="fsd-showcase-note"><span>FSD</span> Performance apparel, technology and training equipment.</p>
    ${dialogMarkup}
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
  const isHardwarePreview = isHardwareVisualPreviewProduct(product);
  const category = customerFacingCategory(product.category) || 'FSD COLLECTION';
  const audience = product.audience ? `<span>${escapeHTML(product.audience)}</span>` : '';
  const masterPrice = priceInfo(product);
  const referenceOnlyPrice = /reference only|not for sale/i.test(masterPrice.label || '');
  const price = isHardwarePreview || referenceOnlyPrice
    ? { label: '', value: '' }
    : masterPrice;
  const description = !isHardwarePreview
    ? product.coverage || product.priceBasis || (productColourwayOptions(product).length < 2 ? product.colourways : '')
    : '';
  const colourway = productColourwayOptions(product)[0] || '';
  const mediaMarkup = productCardImageMarkup(product, {
    colourway,
    className: 'fsd-product-row__image fsd-image-placeholder--compact fsd-product-row__placeholder',
  });
  return `<article class="fsd-product-card fsd-product-card--row" data-fsd-product-card="${escapeHTML(product.id)}">
    <div class="fsd-product-row">
      <button class="fsd-product-row__media" type="button" data-product-media-id="${escapeHTML(product.id)}"
        aria-label="View details for ${escapeHTML(product.name)}">
        <span data-product-card-image-slot>${mediaMarkup}</span>
      </button>
      <span class="fsd-product-row__meta"><span>${escapeHTML(category)}</span>${audience}</span>
      <span class="fsd-product-row__copy">
        <strong>${escapeHTML(product.name)}</strong>
        ${description ? `<span class="fsd-product-description">${escapeHTML(description)}</span>` : ''}
      </span>
      ${price.label || price.value ? `<span class="fsd-product-reference">${price.label ? `${escapeHTML(price.label)} ` : ''}${price.value ? `<strong>${escapeHTML(price.value)}</strong>` : ''}</span>` : ''}
      <button class="fsd-product-row__action" type="button" data-product-id="${escapeHTML(product.id)}">
        VIEW DETAILS <span aria-hidden="true">↗</span><span class="sr-only"> for ${escapeHTML(product.name)}</span>
      </button>
    </div>
    ${productCardColourwaysMarkup(product, { className: 'catalogue-card-swatches fsd-product-row__swatches', dataPrefix: 'fsd' })}
  </article>`;
}

function conceptCard(concept) {
  return `<article class="fsd-concept-card">
    <span class="fsd-concept-index" aria-hidden="true">FSD / CONCEPT</span>
    <h4>${escapeHTML(concept)}</h4>
    <span class="fsd-concept-tag">DESIGN PROTOTYPE</span>
    <p class="fsd-concept-disclaimer">Concept for exploration. Not a current product or commitment.</p>
    <details class="fsd-concept-details" data-motion-details><summary>EXPLORE DETAILS <span class="fsd-details-chevron" data-motion-details-chevron aria-hidden="true">›</span></summary>
      <div class="fsd-concept-details__content" data-motion-details-content>
        <p>Product details and availability are not confirmed.</p>
      </div>
    </details>
  </article>`;
}


export function groupProducts(group, products, subcategory = null) {
  return products.filter(product => (matchesGroup(product, group)
    || (group.additionalCategories || []).includes(product.category)) &&
    (!subcategory || matchesGroup(product, subcategory)));
}

export function matchesDraftCardScope(card, divisionId, groupId, subcategoryIndex) {
  if (!card || card.divisionId !== divisionId ||
    (card.groupId !== '*' && card.groupId !== groupId)) return false;
  if (card.showOnlyInAllProducts && subcategoryIndex !== -1) return false;
  if (!Number.isInteger(card.subcategoryIndex)) return subcategoryIndex === -1;
  return subcategoryIndex === card.subcategoryIndex;
}

function modalContent(division, group, products, activeGroupIndex, activeSubcategoryIndex, draftProductCards) {
  const subcategory = group.subcategories?.[activeSubcategoryIndex] || null;
  const isApparel = division.id === 'apparel';
  const matchingDraftCards = draftProductCards.filter(card =>
    matchesDraftCardScope(card, division.id, group.id, activeSubcategoryIndex));
  const replacedProductIds = new Set(matchingDraftCards
    .map(card => card.replacesProductId)
    .filter(id => id !== undefined && id !== null)
    .map(String));
  const foundProducts = groupProducts(group, products, subcategory)
    .filter(product => !replacedProductIds.has(String(product.id)) &&
      (Number(product.id) !== 46 || import.meta.env.DEV));
  const mappedHeroProduct = division.id === 'apparel' &&
    group.id === 'womens-modest-combat' &&
    subcategory?.title === 'Performance Hijabs'
    ? foundProducts.find(product => Number(product.id) === 43 && productImagesForDisplay(product).length)
    : null;
  const mappedHeroImage = mappedHeroProduct?.images?.[0];
  const isWomensCollection = division.id === 'apparel' &&
    group.id === 'womens-modest-combat' &&
    !subcategory;
  const heroImageMarkup = mappedHeroImage
    ? `<figure class="fsd-modal-hero__media">
        <img src="${escapeHTML(mappedHeroImage.src)}" class="fsd-modal-hero__image"
          alt="${escapeHTML(mappedHeroProduct.name)} — ${escapeHTML(mappedHeroImage.label)}"
          data-fsd-image-fallback="true" data-fsd-image-title="${escapeHTML(mappedHeroProduct.name)}"
          data-fsd-image-variant="${escapeHTML(mappedHeroImage.colourway || mappedHeroImage.variant || '')}" data-fsd-image-kind="hero"/>
        <figcaption>FSD VELOCITY / PERFORMANCE HIJABS</figcaption>
      </figure>`
    : '';
  const concepts = subcategory ? (subcategory.concepts || []) :
    [...(group.concepts || []), ...(group.subcategories || []).flatMap(item => item.concepts || [])];
  const title = subcategory?.title || group.title || division.title;
  const heroVisual = division.visual || division.id;
  const conceptMarkup = concepts.length
    ? `<div class="fsd-modal-subhead"><span>${foundProducts.length || matchingDraftCards.length ? '02' : '01'}</span><h4>ADDITIONAL FEATURES</h4><i></i></div>
       <div class="fsd-concept-grid">${concepts.map(conceptCard).join('')}</div>`
    : '';
  const collectionProductMarkup = [
    ...foundProducts.map(productCard),
    ...matchingDraftCards.map(card => card.markup),
  ].join('');
  const collectionProductCount = foundProducts.length + matchingDraftCards.length;
  const productsMarkup = collectionProductCount
    ? `<div class="fsd-modal-subhead"${isWomensCollection ? ' data-womens-products-heading' : ''}><span>01</span><h4>THE COLLECTION</h4><i></i><small>${collectionProductCount} ${collectionProductCount === 1 ? 'ITEM' : 'ITEMS'}</small></div>
       <div${isWomensCollection ? ' id="fsd-womens-product-grid"' : ''} class="fsd-product-grid${isApparel ? ' fsd-product-grid--apparel' : ''}">${collectionProductMarkup}</div>`
    : '';
  const emptyMarkup = !foundProducts.length && !concepts.length && !matchingDraftCards.length
    ? `<div class="fsd-showcase-empty"><h4>Explore the collection.</h4><p>There are no visual items to show in this section.</p></div>`
    : '';
  const womensHeroMarkup = isWomensCollection
    ? '<div data-womens-banner-slot></div>'
    : '';
  return `${womensHeroMarkup || `<div class="fsd-modal-hero fsd-modal-hero--${escapeHTML(heroVisual)}${isApparel && heroVisual !== 'apparel' ? ' fsd-modal-hero--apparel' : ''}${mappedHeroImage ? ' fsd-modal-hero--image' : ''}">
      <div class="fsd-modal-hero__copy">
        <span class="fsd-modal-kicker">${escapeHTML(division.title)} <span>/</span> DIVISION ${String(activeGroupIndex + 1).padStart(2, '0')}</span>
        <h2>${escapeHTML(title)}</h2>
        <p>${escapeHTML(division.tagline)}</p>
      </div>
      ${heroImageMarkup}
      ${mappedHeroImage ? '' : imagePlaceholderMarkup({ title, kind: 'hero', className: 'fsd-modal-hero__placeholder' })}
    </div>`}
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
      <div class="fsd-modal-description"><span>COLLECTION OVERVIEW</span><p>${escapeHTML(subcategory?.overview || group.overview || division.description)}</p></div>
      ${foundProducts.length ? '<button class="fsd-explore-collection" type="button" data-explore-collection>EXPLORE COLLECTION <span aria-hidden="true">↗</span></button>' : ''}
      ${productsMarkup}${conceptMarkup}${emptyMarkup}
      <p class="fsd-modal-disclaimer">Prices are shown where a catalogue value is recorded. Add-to-bag controls appear only for eligible products.</p>
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
  let renderGeneration = 0;
  let dialogTransitionGeneration = 0;
  let tabIndicatorX = null;
  const page = root.ownerDocument?.documentElement || document.documentElement;

  const moveTabIndicator = () => {
    const nav = content.querySelector('.fsd-group-nav');
    const activeTab = nav?.querySelector('.fsd-group-tab.is-active');
    if (!nav || !activeTab) return;
    let indicator = nav.querySelector('[data-fsd-tab-indicator]');
    if (!indicator) {
      indicator = nav.ownerDocument.createElement('span');
      indicator.className = 'fsd-group-tab-indicator';
      indicator.dataset.fsdTabIndicator = '';
      indicator.setAttribute('aria-hidden', 'true');
      nav.append(indicator);
    }
    const targetX = activeTab.offsetLeft;
    indicator.style.width = `${activeTab.offsetWidth}px`;
    void animateElement(indicator, {
      x: [tabIndicatorX ?? targetX, targetX],
    }, {
      duration: FSD_MOTION.tabDuration,
      ease: FSD_MOTION.stateEase,
    });
    tabIndicatorX = targetX;
  };

  const renderDialog = ({ crossfade = false } = {}) => {
    if (!activeDivision) return Promise.resolve(false);
    const generation = ++renderGeneration;
    const updateContent = () => {
      if (generation !== renderGeneration || !activeDivision) return false;
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
      moveTabIndicator();
      return true;
    };

    if (!crossfade || !dialog.open || prefersReducedMotion(dialog.ownerDocument?.defaultView)) {
      updateContent();
      return Promise.resolve(true);
    }

    return animateElement(content, {
      opacity: [1, 0],
      y: [0, -4],
    }, { duration: FSD_MOTION.tabDuration, ease: FSD_MOTION.stateEase }).then(async () => {
      if (!updateContent()) return false;
      await animateElement(content, {
        opacity: [0, 1],
        y: [6, 0],
      }, { duration: FSD_MOTION.tabDuration, ease: FSD_MOTION.stateEase });
      return generation === renderGeneration;
    });
  };

  const open = (division, opener, groupIndex = 0) => {
    if (!division) return;
    dialogTransitionGeneration += 1;
    delete dialog.dataset.motionClosing;
    if (returnFocus && returnFocus !== opener) {
      returnFocus.setAttribute('aria-expanded', 'false');
      returnFocus.classList.remove('is-selected');
    }
    afterClose = null;
    activeDivision = division;
    tabIndicatorX = null;
    activeGroupIndex = Number.isInteger(groupIndex) && groupIndex >= 0 &&
      groupIndex < (division.groups || []).length ? groupIndex : 0;
    activeSubcategoryIndex = -1;
    returnFocus = opener;
    returnFocus?.setAttribute('aria-expanded', 'true');
    returnFocus?.classList.add('is-selected');
    void renderDialog();
    page.classList.add('fsd-modal-open');
    if (!dialog.open) {
      dialog.dataset.motionOpening = 'true';
      dialog.showModal();
      dialog.ownerDocument.defaultView?.requestAnimationFrame?.(() => {
        dialog.ownerDocument.defaultView?.requestAnimationFrame?.(() => {
          delete dialog.dataset.motionOpening;
        });
      });
    }
    void animateElement(dialog.querySelector('.fsd-dialog-frame'), {
      opacity: [0, 1],
      y: [FSD_MOTION.distance, 0],
    }, { duration: FSD_MOTION.panelDuration });
    trackEvent('collection_opened', {
      division_id: division.id,
      group_index: activeGroupIndex,
    });
    const closeButton = dialog.querySelector('[data-close-dialog]');
    closeButton?.focus({ preventScroll: true });
  };

  const closeWithMotion = async () => {
    if (!dialog.open) return;
    const generation = ++dialogTransitionGeneration;
    dialog.dataset.motionClosing = 'true';
    await animateElement(dialog.querySelector('.fsd-dialog-frame'), {
      opacity: [1, 0],
      y: [0, FSD_MOTION.distance],
    }, { duration: FSD_MOTION.panelDuration });
    if (generation !== dialogTransitionGeneration || !dialog.open) return;
    dialog.close();
  };

  const onClick = event => {
    const opener = event.target.closest('[data-division]');
    if (opener && section.contains(opener)) {
      open(
        safeDivisions.find(division => division.id === opener.dataset.division),
        opener,
        Number(opener.dataset.groupIndex) || 0,
      );
      return;
    }
    if (event.target.closest('[data-close-dialog]')) {
      void closeWithMotion();
      return;
    }
    const tab = event.target.closest('[data-group-index]');
    if (tab && dialog.contains(tab)) {
      activeGroupIndex = Number(tab.dataset.groupIndex);
      activeSubcategoryIndex = -1;
      const selectedIndex = activeGroupIndex;
      void renderDialog({ crossfade: true }).then(() => {
        if (activeGroupIndex === selectedIndex) {
          dialog.querySelector(`[data-group-index="${selectedIndex}"]`)?.focus({ preventScroll: true });
        }
      });
      return;
    }
    const subcategoryButton = event.target.closest('[data-subcategory-index]');
    if (subcategoryButton && dialog.contains(subcategoryButton)) {
      activeSubcategoryIndex = Number(subcategoryButton.dataset.subcategoryIndex);
      const selectedIndex = activeSubcategoryIndex;
      void renderDialog({ crossfade: true }).then(() => {
        if (activeSubcategoryIndex === selectedIndex) {
          dialog.querySelector(`[data-subcategory-index="${selectedIndex}"]`)?.focus({ preventScroll: true });
        }
      });
      return;
    }
    const cardSwatch = event.target.closest('[data-fsd-card-colourway]');
    if (cardSwatch && dialog.contains(cardSwatch)) {
      const card = cardSwatch.closest('[data-fsd-product-card]');
      const product = safeProducts.find(item => String(item.id) === card?.dataset.fsdProductCard);
      const colourway = productColourwayOptions(product)[Number(cardSwatch.dataset.fsdCardColourway)];
      if (!product || !colourway) return;
      card.querySelectorAll('[data-fsd-card-colourway]').forEach(button => {
        button.setAttribute('aria-pressed', String(button === cardSwatch));
      });
      card.querySelectorAll('[data-product-card-selected-colourway]').forEach(label => {
        label.textContent = colourway;
      });
      const imageSlot = card.querySelector('[data-product-card-image-slot]');
      if (imageSlot) {
        imageSlot.innerHTML = productCardImageMarkup(product, {
          colourway,
          className: 'fsd-product-row__image fsd-image-placeholder--compact fsd-product-row__placeholder',
        });
      }
      return;
    }
    const productButton = event.target.closest('[data-product-id], [data-product-media-id]');
    if (productButton && dialog.contains(productButton)) {
      const selectedProduct = safeProducts.find(product => String(product.id) === (productButton.dataset.productId || productButton.dataset.productMediaId));
      if (!selectedProduct) return;
      onProductSelect(selectedProduct.id, productButton);
      return;
    }
    if (event.target.closest('[data-explore-collection]') && activeDivision) {
      const group = activeDivision.groups[activeGroupIndex];
      const subcategory = group.subcategories?.[activeSubcategoryIndex];
      afterClose = () => onExploreCollection({ ...group, query: subcategory?.productTerms?.[0] || '' });
      void closeWithMotion();
    }
    const womensCollectionCta = event.target.closest('[data-scroll-womens-products]');
    if (womensCollectionCta && dialog.contains(womensCollectionCta)) {
      const productGrid = content.querySelector('#fsd-womens-product-grid');
      if (productGrid) {
        const reducedMotion = page.ownerDocument?.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const top = content.scrollTop + productGrid.getBoundingClientRect().top -
          content.getBoundingClientRect().top - 20;
        content.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' });
      }
    }
  };

  const onDialogClick = event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    const clickedOutsideDialog = event.clientX < bounds.left
      || event.clientX > bounds.right
      || event.clientY < bounds.top
      || event.clientY > bounds.bottom;
    if (clickedOutsideDialog) void closeWithMotion();
  };
  const onDialogCancel = event => {
    if (section.ownerDocument.querySelector('#product-dialog')?.open) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    void closeWithMotion();
  };
  const onDialogClose = () => {
    // Native close events are queued; ignore an old event if already reopened.
    if (dialog.open) return;
    delete dialog.dataset.motionClosing;
    delete dialog.dataset.motionOpening;
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
    if (event.key === 'Tab' && dialog.open) {
      const focusable = [...dialog.querySelectorAll(
        'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      )].filter(element => !element.hidden && element.getClientRects().length);
      if (!focusable.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
      return;
    }
    const current = event.target.closest('[data-group-index]');
    if (!current || !activeDivision || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const length = activeDivision.groups.length;
    activeGroupIndex = event.key === 'Home' ? 0 : event.key === 'End' ? length - 1 :
      (activeGroupIndex + (event.key === 'ArrowRight' ? 1 : -1) + length) % length;
    activeSubcategoryIndex = -1;
    const selectedIndex = activeGroupIndex;
    void renderDialog({ crossfade: true }).then(() => {
      if (activeGroupIndex === selectedIndex) {
        dialog.querySelector(`[data-group-index="${selectedIndex}"]`)?.focus({ preventScroll: true });
      }
    });
  };

  section.addEventListener('click', onClick);
  dialog.addEventListener('click', onDialogClick);
  dialog.addEventListener('cancel', onDialogCancel);
  dialog.addEventListener('close', onDialogClose);
  dialog.addEventListener('keydown', onKeyDown);

  const unmount = () => {
    section.removeEventListener('click', onClick);
    dialog.removeEventListener('click', onDialogClick);
    dialog.removeEventListener('cancel', onDialogCancel);
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
        ...(Number.isInteger(placement.subcategoryIndex) && placement.subcategoryIndex >= 0
          ? { subcategoryIndex: placement.subcategoryIndex }
          : {}),
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
