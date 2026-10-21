const assetRoot = '/__catalogue-preview/aeroforge/media/';
const suppliedOutfitAssets = {
  black: `${assetRoot}02_outfit_black.jpg`,
  grey: `${assetRoot}03_outfit_grey.jpg`,
  mauve: `${assetRoot}04_outfit_mauve_rear.jpg`,
  navy: `${assetRoot}05_outfit_navy.jpg`,
  olive: `${assetRoot}06_outfit_olive.jpg`,
  white: `${assetRoot}07_outfit_white.jpg`,
};
const suppliedDetailAssets = {
  'collar-zip': `${assetRoot}08_detail_collar_zip.jpg`,
  thumbhole: `${assetRoot}09_detail_thumbhole_cuff.jpg`,
  texture: `${assetRoot}10_detail_fabric_texture.jpg`,
  'hem-slit': `${assetRoot}11_detail_hem_side_slit.jpg`,
};
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

const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));
const keyFor = value => String(value ?? '').toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
const firstBy = (items, predicate) => (Array.isArray(items) ? items : []).find(predicate);

function productKind(product) {
  const key = `${product?.id ?? ''} ${product?.name ?? ''}`.toLowerCase();
  return /jogger/.test(key) ? 'joggers' : 'top';
}

function localVariantSource(variant) {
  const key = keyFor(variant?.colour);
  return variant?.src || suppliedOutfitAssets[key] || '';
}

function localDetailSource(detail) {
  const key = keyFor(`${detail?.id ?? ''} ${detail?.label ?? ''}`);
  const match = Object.keys(suppliedDetailAssets).find(candidate => key.includes(candidate));
  return detail?.src || suppliedDetailAssets[match] || '';
}

export function mountAeroForgePreview(root, data) {
  if (!root || !data?.collection || !Array.isArray(data.products)) {
    throw new TypeError('AeroForge preview requires a root, collection, and products array.');
  }
  const collection = data.collection;
  const top = firstBy(data.products, product => productKind(product) === 'top') || data.products[0];
  const joggers = firstBy(data.products, product => productKind(product) === 'joggers');
  let currentRoute = 'collection';
  let selectedVariant = null;
  let selectedImage = null;

  const variantsForTop = colourOrder.map(colour => {
    const found = firstBy(top?.variants, variant => keyFor(variant.colour) === keyFor(colour));
    if (found) return { ...found, colour, src: localVariantSource(found) };
    return {
      id: keyFor(colour),
      colour,
      swatch: swatchColours[keyFor(colour)],
      src: suppliedOutfitAssets[keyFor(colour)],
      alt: `${colour} FSD outfit view`,
      viewStatus: colour === 'Mauve' ? 'Rear view supplied; front view missing.' : 'Front view supplied; rear view missing.',
    };
  });
  const variantsForJoggers = colourOrder.map(colour => {
    const found = firstBy(joggers?.variants, variant => keyFor(variant.colour) === keyFor(colour));
    if (found) return { ...found, colour, src: localVariantSource(found) };
    return {
      id: keyFor(colour),
      colour,
      swatch: swatchColours[keyFor(colour)],
      src: suppliedOutfitAssets[keyFor(colour)],
      alt: `${colour} coordinated AeroForge outfit reference`,
      viewStatus: colour === 'Mauve'
        ? 'Coordinated rear outfit crop supplied; standalone jogger image and front view pending approval.'
        : 'Coordinated front outfit crop supplied; standalone jogger image and rear angle pending.',
    };
  });
  const topDetails = (Array.isArray(top?.details) ? top.details : []).map(detail => ({
    ...detail, src: localDetailSource(detail),
  })).filter(detail => detail.src);
  const imageNotes = Array.isArray(data.imageNotes) ? data.imageNotes : [];
  const missingViews = Array.isArray(data.missingViews) ? data.missingViews : [];
  const specificationNotes = Array.isArray(data.specificationNotes) ? data.specificationNotes : [];
  const assetManifest = Array.isArray(data.assetManifest) ? data.assetManifest : [];
  const hero = collection.hero || {};
  const collectionStatus = collection.status || 'PRIVATE · UNPUBLISHED DRAFT';

  const renderSwatches = (variants = variantsForTop) => variants.map((variant, index) => `
    <button class="af-swatch" type="button" data-af-variant="${escapeHTML(variant.id)}"
      aria-label="${escapeHTML(variant.colour)}" aria-pressed="${variant.id === selectedVariant?.id}"
      title="${escapeHTML(variant.colour)}" style="--af-swatch:${escapeHTML(variant.swatch || swatchColours[keyFor(variant.colour)])}">
      <span class="af-swatch-dot" aria-hidden="true"></span><span class="af-swatch-label">${escapeHTML(variant.colour)}</span>
      <span class="af-swatch-index" aria-hidden="true">0${index + 1}</span>
    </button>`).join('');

  const renderDetailButtons = () => topDetails.map((detail, index) => `
    <button class="af-detail" type="button" data-af-detail="${escapeHTML(detail.id)}" aria-pressed="false">
      <span class="af-detail-index">0${index + 1}</span><span>${escapeHTML(detail.label)}</span><span aria-hidden="true">↗</span>
    </button>`).join('');

  const renderList = items => items.map(item => `<li>${escapeHTML(typeof item === 'string' ? item : item.label || item.text || '')}</li>`).join('');
  const renderAssetManifest = () => assetManifest.map((asset, index) => `
    <li class="af-manifest-row">
      <span class="af-manifest-index">${String(index + 1).padStart(2, '0')}</span>
      <span class="af-manifest-file">${escapeHTML(asset.file)}</span>
      <span class="af-manifest-dimensions">${escapeHTML(`${asset.width} × ${asset.height}`)}</span>
      <span class="af-manifest-status">${escapeHTML(asset.status)}</span>
    </li>`).join('');

  root.innerHTML = `
    <div class="af-preview">
      <div class="af-shell">
        <nav class="af-crumb" aria-label="Breadcrumb"><a href="/#collections">FSD</a><span>/</span><span>AEROFORGE</span><span>/</span><span data-af-crumb aria-current="page">COLLECTION</span></nav>
        <div class="af-ribbon"><span><i aria-hidden="true"></i> PRIVATE PRODUCT PROOF</span><span>${escapeHTML(collectionStatus)}</span></div>
      </div>
      <main class="af-main" id="af-main"></main>
      <footer class="af-footer"><div class="af-shell">
        <span class="af-footer-brand">FSD <i>/</i> AEROFORGE</span>
        <span>PRIVATE CONCEPT REVIEW <i>·</i> NOT FOR SALE</span>
        <span>GARMENT MARKS SHOWN AS SUPPLIED — REVIEW REQUIRED</span>
      </div></footer>
      <p class="af-live" aria-live="polite" aria-atomic="true" data-af-live></p>
    </div>`;

  const main = root.querySelector('#af-main');
  const breadcrumb = root.querySelector('[data-af-crumb]');
  const live = root.querySelector('[data-af-live]');

  function renderCollection() {
    const heroSrc = hero.src || `${assetRoot}01_collection_hero_six_colourways.jpg`;
    const headlineWords = String(collection.headline || 'MOVE WITH CONFIDENCE.').trim().split(/\s+/);
    const headlineHighlight = headlineWords.pop() || '';
    const headlineLead = headlineWords.join(' ');
    main.innerHTML = `
      <section class="af-shell af-collection" aria-labelledby="af-collection-title">
        <div class="af-collection-copy">
          <p class="af-eyebrow">FSD / AEROFORGE · PRIVATE PROOF</p>
          <p class="af-kicker">${escapeHTML(collection.name || 'AeroForge Modest Activewear')}</p>
          <h1 id="af-collection-title"><span>${escapeHTML(headlineLead)}</span><br><em>${escapeHTML(headlineHighlight)}</em></h1>
          <p class="af-tagline">${escapeHTML(collection.supportingText || '')}</p>
          <p class="af-description">${escapeHTML(collection.description || '')}</p>
          <div class="af-draft-note"><span class="af-note-mark" aria-hidden="true">—</span><span><strong>DRAFT · NO CHECKOUT</strong><small>Private, unpublished product proof. Product information and imagery remain subject to review.</small></span></div>
        </div>
        <figure class="af-campaign">
          <div class="af-campaign-image"><img src="${escapeHTML(heroSrc)}" alt="${escapeHTML(hero.alt || '')}" loading="eager"></div>
          <figcaption><span>COLLECTION CAMPAIGN</span><span>SUPPLIED COMPOSITE · FIXED IMAGE</span></figcaption>
        </figure>
      </section>
      <section class="af-campaign-bar" aria-label="Collection proof status"><div class="af-shell">
        <span class="af-section-index">AEROFORGE / 01</span><p>${escapeHTML(collection.headline || collection.name || 'AeroForge')}</p>
        <span class="af-campaign-caveat">PRIVATE PROOF <i>·</i> NO CHECKOUT</span>
      </div></section>
      <section class="af-shell af-products" aria-labelledby="af-products-heading">
        <div class="af-section-heading"><div><p class="af-eyebrow">COLLECTION / PRODUCT VIEWS</p><h2 id="af-products-heading">Choose a<br><em>product view.</em></h2></div>
          <p>Supplied garment images only. Select a product to inspect its available proof assets.</p></div>
        <div class="af-product-links">
          <button type="button" class="af-product-link" data-af-route="top">
            <img class="af-product-card-image" src="${escapeHTML(localVariantSource(variantsForTop[0]))}"
              alt="Supplied Black coordinated outfit crop used as a private training-top reference." loading="lazy"/>
            <span class="af-product-number">01 / TOP</span><span class="af-product-title">${escapeHTML(top?.name || 'Training Top')}</span>
            <span class="af-product-description">${escapeHTML(top?.description || '')}</span><span class="af-link-action">VIEW PRODUCT <b aria-hidden="true">↗</b></span>
          </button>
          ${joggers ? `<button type="button" class="af-product-link" data-af-route="joggers">
            <img class="af-product-card-image" src="${escapeHTML(localVariantSource(variantsForJoggers[0]))}"
              alt="Supplied Black coordinated outfit crop; standalone jogger photography is pending." loading="lazy"/>
            <span class="af-product-number">02 / JOGGERS</span><span class="af-product-title">${escapeHTML(joggers.name)}</span>
            <span class="af-product-description">${escapeHTML(joggers.description || '')}</span><span class="af-link-action">VIEW PRODUCT <b aria-hidden="true">↗</b></span>
          </button>` : ''}
        </div>
          <p class="af-review-flag"><b>REVIEW FLAG</b> Supplied garment marks read as plain “FSD” text, unlike the approved site shield lockup. Keep as supplied; confirm before release.</p>
        <section class="af-proof-ledger" aria-labelledby="af-proof-ledger-heading">
          <div class="af-section-heading"><div><p class="af-eyebrow">PRIVATE REVIEW / ASSET & DATA STATUS</p><h2 id="af-proof-ledger-heading">Image and<br><em>detail status.</em></h2></div>
            <p>The supplied archive remains unchanged. No product imagery or catalogue values have been approved by this proof.</p></div>
          <div class="af-ledger-columns">
            <section><h3>Missing image views</h3><ul class="af-missing-list">${renderList(missingViews)}</ul></section>
            <section><h3>Pending product information</h3><ul class="af-missing-list">${renderList(specificationNotes)}</ul></section>
          </div>
          <p class="af-catalogue-note">${escapeHTML(data.catalogueNote || '')}</p>
          <details class="af-asset-manifest">
            <summary>Imported image asset manifest <span>${assetManifest.length} supplied images</span></summary>
            <ul>${renderAssetManifest()}</ul>
          </details>
        </section>
      </section>`;
    breadcrumb.textContent = 'COLLECTION';
  }

  function renderTop() {
    selectedVariant = selectedVariant || variantsForTop[0];
    selectedImage = { src: selectedVariant.src, alt: selectedVariant.alt || `${selectedVariant.colour} ${top?.name || 'Training Top'} view`, label: selectedVariant.colour, note: selectedVariant.viewStatus || '' };
    const exactDetails = topDetails;
    main.innerHTML = `
      <section class="af-shell af-product-page" aria-labelledby="af-product-title">
        <div class="af-product-copy">
          <p class="af-eyebrow">FSD / AEROFORGE · PRODUCT PROOF</p>
          <p class="af-kicker">01 / TRAINING TOP</p>
          <h1 id="af-product-title">${escapeHTML(top?.name || 'Training Top')}</h1>
          <p class="af-description">${escapeHTML(top?.description || '')}</p>
          <div class="af-draft-note"><span class="af-note-mark" aria-hidden="true">—</span><span><strong>DRAFT · NO CHECKOUT</strong><small>Private, unpublished product proof. Product information and imagery remain subject to review.</small></span></div>
          <fieldset class="af-colours"><legend>COLOUR <span aria-hidden="true">/</span> <b data-af-colour>${escapeHTML(selectedVariant.colour)}</b></legend>
            <div class="af-swatch-list" role="group" aria-label="Select colour">${renderSwatches()}</div>
          </fieldset>
          <p class="af-variant-note" data-af-variant-note>${escapeHTML(selectedVariant.viewStatus || '')}</p>
          ${exactDetails.length ? `<section class="af-details" aria-labelledby="af-details-heading">
            <h2 id="af-details-heading">SUPPLIED DETAILS <span>· SELECT TO VIEW</span></h2><div class="af-detail-list">${renderDetailButtons()}</div>
          </section>` : ''}
          <p class="af-review-flag"><b>MARK REVIEW</b> Garment marks appear as plain FSD text, unlike the approved site shield lockup. Confirm before release.</p>
        </div>
        <div class="af-product-visual">
          <div class="af-image-frame" data-af-image-frame>
            <img data-af-main-image src="${escapeHTML(selectedImage.src)}" alt="${escapeHTML(selectedImage.alt)}" loading="eager">
            <span class="af-image-label" data-af-image-label>${escapeHTML(selectedVariant.colour)} · SUPPLIED OUTFIT VIEW</span>
          </div>
          <div class="af-image-meta"><span data-af-image-note>${escapeHTML(selectedImage.note)}</span><span>SUPPLIED CROP · NOT RESIZED</span></div>
          ${imageNotes.length ? `<ul class="af-image-notes" aria-label="Image notes">${renderList(imageNotes)}</ul>` : ''}
        </div>
      </section>
      <section class="af-shell af-back-nav"><button class="af-back" type="button" data-af-route="collection"><span aria-hidden="true">←</span> BACK TO COLLECTION</button>
        <span>PRIVATE PROOF <i>·</i> NO CHECKOUT</span></section>`;
    breadcrumb.textContent = top?.name ? top.name.toUpperCase() : 'TRAINING TOP';
    bindTopControls();
  }

  function bindTopControls() {
    const image = main.querySelector('[data-af-main-image]');
    const imageLabel = main.querySelector('[data-af-image-label]');
    const imageNote = main.querySelector('[data-af-image-note]');
    const variantNote = main.querySelector('[data-af-variant-note]');
    const colour = main.querySelector('[data-af-colour]');
    const frame = main.querySelector('[data-af-image-frame]');
    main.querySelectorAll('[data-af-variant]').forEach(button => {
      button.addEventListener('click', () => {
        const next = variantsForTop.find(variant => String(variant.id) === button.dataset.afVariant);
        if (!next || !next.src) return;
        selectedVariant = next;
        selectedImage = { src: next.src, alt: next.alt || `${next.colour} ${top?.name || 'Training Top'} view`, label: next.colour, note: next.viewStatus || '' };
        image.src = selectedImage.src;
        image.alt = selectedImage.alt;
        imageLabel.textContent = `${next.colour} · SUPPLIED OUTFIT VIEW`;
        imageNote.textContent = selectedImage.note;
        variantNote.textContent = next.viewStatus || '';
        colour.textContent = next.colour;
        frame.classList.remove('is-detail');
        main.querySelectorAll('[data-af-detail]').forEach(item => item.setAttribute('aria-pressed', 'false'));
        main.querySelectorAll('[data-af-variant]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
        live.textContent = `${next.colour} selected. ${selectedImage.note}`;
      });
    });
    main.querySelectorAll('[data-af-detail]').forEach(button => {
      button.addEventListener('click', () => {
        const detail = exactDetailsForButton(button);
        if (!detail) return;
        image.src = detail.src;
        image.alt = detail.alt || detail.label;
        imageLabel.textContent = `${detail.label} · SUPPLIED DETAIL CROP`;
        imageNote.textContent = 'Supplied detail crop.';
        frame.classList.add('is-detail');
        main.querySelectorAll('[data-af-detail]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
        live.textContent = `${detail.label} detail view selected.`;
      });
    });
  }

  function exactDetailsForButton(button) {
    return topDetails.find(detail => String(detail.id) === button.dataset.afDetail);
  }

  function renderJoggers() {
    const name = joggers?.name || 'Performance Joggers';
    selectedVariant = variantsForJoggers.find(variant => variant.id === selectedVariant?.id)
      || variantsForJoggers[0];
    selectedImage = {
      src: selectedVariant.src,
      alt: selectedVariant.alt || `${selectedVariant.colour} coordinated outfit reference.`,
      label: selectedVariant.colour,
      note: selectedVariant.viewStatus || '',
    };
    const missing = missingViews.length ? missingViews : [
      'Jogger-specific standalone images have not been supplied.',
      'Other rear views are missing.',
    ];
    main.innerHTML = `
      <section class="af-shell af-product-page af-joggers" aria-labelledby="af-product-title">
        <div class="af-product-copy">
          <p class="af-eyebrow">FSD / AEROFORGE · PRODUCT PROOF</p><p class="af-kicker">02 / PERFORMANCE JOGGERS</p>
          <h1 id="af-product-title">${escapeHTML(name)}</h1><p class="af-description">${escapeHTML(joggers?.description || '')}</p>
          <div class="af-draft-note"><span class="af-note-mark" aria-hidden="true">—</span><span><strong>DRAFT · NO CHECKOUT</strong><small>Private, unpublished product proof. Product information and imagery remain subject to review.</small></span></div>
          <fieldset class="af-colours"><legend>COLOUR <span aria-hidden="true">/</span> <b data-af-colour>${escapeHTML(selectedVariant.colour)}</b></legend>
            <div class="af-swatch-list" role="group" aria-label="Select jogger colour">${renderSwatches(variantsForJoggers)}</div>
          </fieldset>
          <p class="af-variant-note" data-af-variant-note>${escapeHTML(selectedVariant.viewStatus || '')}</p>
          <p class="af-review-flag"><b>IMAGE GAP</b> The selected image shows the coordinated outfit; standalone jogger photographs and jogger-specific details are pending.</p>
          <ul class="af-missing-list">${renderList(missing)}</ul>
          <p class="af-review-flag"><b>MARK REVIEW</b> Garment marks appear as plain FSD text, unlike the approved site shield lockup. Confirm before release.</p>
        </div>
        <div class="af-product-visual">
          <div class="af-image-frame" data-af-image-frame>
            <img data-af-main-image src="${escapeHTML(selectedImage.src)}" alt="${escapeHTML(selectedImage.alt)}" loading="eager">
            <span class="af-image-label" data-af-image-label>${escapeHTML(selectedVariant.colour)} · COORDINATED OUTFIT VIEW</span>
          </div>
          <div class="af-image-meta"><span data-af-image-note>${escapeHTML(selectedImage.note)}</span><span>SUPPLIED CROP · NOT RESIZED</span></div>
          <ul class="af-image-notes" aria-label="Image notes">${renderList(imageNotes)}</ul>
        </div>
      </section>
      <section class="af-shell af-back-nav"><button class="af-back" type="button" data-af-route="collection"><span aria-hidden="true">←</span> BACK TO COLLECTION</button><span>PRIVATE PROOF <i>·</i> NO CHECKOUT</span></section>`;
    breadcrumb.textContent = name.toUpperCase();
    bindJoggersControls();
  }

  function bindJoggersControls() {
    const image = main.querySelector('[data-af-main-image]');
    const imageLabel = main.querySelector('[data-af-image-label]');
    const imageNote = main.querySelector('[data-af-image-note]');
    const variantNote = main.querySelector('[data-af-variant-note]');
    const colour = main.querySelector('[data-af-colour]');
    const frame = main.querySelector('[data-af-image-frame]');

    main.querySelectorAll('[data-af-variant]').forEach(button => {
      button.addEventListener('click', () => {
        const next = variantsForJoggers.find(variant => String(variant.id) === button.dataset.afVariant);
        if (!next || !next.src) return;
        selectedVariant = next;
        selectedImage = {
          src: next.src,
          alt: next.alt || `${next.colour} coordinated outfit reference.`,
          label: next.colour,
          note: next.viewStatus || '',
        };
        image.src = selectedImage.src;
        image.alt = selectedImage.alt;
        imageLabel.textContent = `${next.colour} · COORDINATED OUTFIT VIEW`;
        imageNote.textContent = selectedImage.note;
        variantNote.textContent = next.viewStatus || '';
        colour.textContent = next.colour;
        frame.classList.remove('is-detail');
        main.querySelectorAll('[data-af-variant]').forEach(item => {
          item.setAttribute('aria-pressed', String(item === button));
        });
        live.textContent = `${next.colour} selected. ${selectedImage.note}`;
      });
    });
  }

  function render(route, updateHash = true) {
    currentRoute = route;
    if (route === 'top') renderTop();
    else if (route === 'joggers' && joggers) renderJoggers();
    else {
      currentRoute = 'collection';
      renderCollection();
    }
    if (updateHash && window.location.hash !== routeHash[currentRoute]) {
      window.history.pushState(null, '', `${window.location.pathname}${window.location.search}${routeHash[currentRoute]}`);
    }
    root.querySelectorAll('[data-af-route]').forEach(button => {
      button.addEventListener('click', () => render(button.dataset.afRoute));
    });
  }

  const onHashChange = () => {
    const route = Object.keys(routeHash).find(key => routeHash[key] === window.location.hash) || 'collection';
    if (route !== currentRoute) render(route, false);
  };
  window.addEventListener('hashchange', onHashChange);
  window.addEventListener('popstate', onHashChange);
  const initialRoute = Object.keys(routeHash).find(key => routeHash[key] === window.location.hash) || 'collection';
  render(initialRoute, false);

  return {
    destroy() {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('popstate', onHashChange);
      root.replaceChildren();
    },
    navigate(route) {
      if (routeHash[route]) render(route);
    },
  };
}
