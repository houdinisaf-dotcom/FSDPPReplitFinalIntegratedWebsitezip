const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

const list = value => Array.isArray(value) ? value : [];
const labelOf = item => item?.label ?? item?.title ?? item?.name ?? '';
const campaignImageLabel = (_item, index = 0) => `Campaign image ${String(index + 1).padStart(2, '0')}`;
const sourceOf = item => item?.src ?? item?.url ?? item?.path ?? item?.image ?? '';
const slugOf = item => item?.slug ?? '';
const idsOf = item => list(item?.assetIds ?? item?.referenceIds ?? item?.imageIds ?? item?.campaignReferences)
  .map(value => typeof value === 'object' ? value.id : value).filter(Boolean);

function refsFor(product, assets) {
  const ids = idsOf(product);
  const declared = list(product?.assets ?? product?.references ?? product?.images);
  if (declared.length) {
    return declared.map(ref => typeof ref === 'string'
      ? assets.find(asset => asset.id === ref)
      : assets.find(asset => asset.id && asset.id === ref?.id) ?? ref).filter(ref => ref && sourceOf(ref));
  }
  if (ids.length) {
    return ids.map(id => assets.find(asset => asset.id === id)).filter(asset => asset && sourceOf(asset));
  }
  return assets.filter(asset => {
    const assignments = list(asset?.productSlugs ?? asset?.assignedProducts ?? asset?.products)
      .map(value => typeof value === 'object' ? value.slug : value);
    return assignments.includes(product?.slug) && sourceOf(asset);
  });
}

function imageCard(asset, index, activeId = '') {
  const id = esc(asset.id ?? `reference-${index + 1}`);
  const title = esc(campaignImageLabel(asset, index));
  const src = esc(sourceOf(asset));
  return `<button class="motion-reference" type="button" data-motion-gallery-select="${id}" aria-pressed="${String(String(asset.id ?? '') === String(activeId))}">
    <span class="motion-ref-media"><img src="${src}" alt="" loading="lazy"></span>
    <span class="motion-ref-meta"><small>${String(index + 1).padStart(2, '0')} / CAMPAIGN IMAGE</small><strong>${title}</strong></span>
    <span class="motion-ref-note">FSD MOTION / CAMPAIGN</span>
  </button>`;
}

function productLink(product, index, assets) {
  const refs = refsFor(product, assets);
  const visual = refs[0];
  const href = `/__catalogue-preview/fsd-motion/products/${encodeURIComponent(slugOf(product))}/`;
  return `<a class="motion-product" href="${href}" data-motion-product-link="${esc(slugOf(product))}">
    <span class="motion-product-visual">${visual ? `<img src="${esc(sourceOf(visual))}" alt="" loading="lazy">` : `<span class="motion-no-photo">FSD MOTION</span>`}
      <span class="motion-product-index">0${index + 1}</span>
    </span>
      <span class="motion-product-copy"><small>${esc(product.category ?? product.type ?? 'FSD MOTION')}</small>
      <strong>${esc(product.name ?? product.title ?? '')}</strong>
      <span class="motion-link-label">VIEW CONCEPT <i aria-hidden="true">↗</i></span>
    </span>
  </a>`;
}

function renderReferences(references, activeId) {
  if (!references.length) return '';
  return `<section class="motion-archive" aria-labelledby="motion-archive-title">
    <div class="motion-section-head"><div><p class="motion-kicker">CAMPAIGN IMAGERY</p><h2 id="motion-archive-title">Campaign <em>archive.</em></h2></div>
      <p>Campaign imagery for the FSD MOTION collection.</p></div>
    <div class="motion-reference-grid">${references.map((asset, index) => imageCard(asset, index, activeId)).join('')}</div>
  </section>`;
}

function renderProductGallery(references, activeId, productName) {
  if (!references.length) return '';
  return `<div class="motion-product-gallery" role="group" aria-label="${esc(productName)} campaign image selections">
    ${references.map((asset, index) => `<button class="motion-gallery-thumb" type="button"
      data-motion-gallery-select="${esc(asset.id)}" aria-pressed="${String(asset.id === activeId)}"
      aria-label="Show ${esc(campaignImageLabel(asset, index))}">
      <img src="${esc(sourceOf(asset))}" alt="" loading="lazy">
      <span>${esc(campaignImageLabel(asset, index))}</span>
    </button>`).join('')}
  </div>`;
}

export function renderMotionPreview({ headerHtml, collection, product, products, assets, stories }) {
  const sourceAssets = list(assets).filter(asset => sourceOf(asset));
  const allProducts = list(products);
  const refs = product ? refsFor(product, sourceAssets) : sourceAssets;
  const active = refs[0];
  const title = collection?.name ?? collection?.title ?? 'FSD MOTION';
  const dialog = `<dialog class="motion-lightbox" data-motion-dialog aria-label="Campaign artwork viewer">
    <button class="motion-dialog-close" type="button" data-motion-close>CLOSE <span aria-hidden="true">×</span></button>
    <img data-motion-dialog-image alt=""><p data-motion-dialog-caption></p>
  </dialog>`;

  if (!product) {
    const hero = collection?.hero ?? collection?.campaign ?? sourceAssets.find(asset => /hero|campaign/i.test(`${asset.id ?? ''} ${labelOf(asset)}`)) ?? sourceAssets[0];
    const heroSrc = sourceOf(hero);
    return `<div class="motion-preview-body">${headerHtml ?? ''}
      <main class="motion-page motion-collection">
        <div class="motion-wrap">
          <nav class="motion-crumb" aria-label="Breadcrumb"><span>FSD</span><i>/</i><span>COLLECTION</span><i>/</i><span>${esc(title)}</span></nav>
          <a class="motion-back-collection fsd-collection-return" href="/#collections" data-collection-return>← BACK TO COLLECTION</a>
          <section class="motion-collection-hero">
            <div class="motion-hero-copy"><p class="motion-kicker">FSD / TRAINING APPAREL</p><p class="motion-overline">GYM · OUTDOORS · SELF-DEFENCE</p>
              <h1>FSD<br><em>MOTION</em></h1><p class="motion-hero-subtitle">${esc(collection?.subtitle ?? title)}</p>
              ${collection?.introduction ? `<p class="motion-hero-introduction">${esc(collection.introduction)}</p>` : ''}
              <p class="motion-prelaunch-note"><strong>CONCEPT</strong><small>Product details are being finalised.</small></p>
            </div>
            <div class="motion-hero-art">
              ${heroSrc ? `<button class="motion-hero-image motion-hero-image--campaign" type="button" data-motion-image="${esc(hero.id ?? '')}" data-motion-enlarge aria-label="Enlarge campaign image"><img data-motion-active-image src="${esc(heroSrc)}" alt=""><span>ENLARGE IMAGE</span></button>` : `<div class="motion-no-photo">FSD MOTION</div>`}
              <p class="motion-art-caption" data-motion-active-caption aria-live="polite">${esc(campaignImageLabel(hero))} <span>CAMPAIGN IMAGE</span></p>
            </div>
          </section>
        </div>
        <section class="motion-manifesto"><div class="motion-wrap"><span>01 / THE COLLECTION</span><p>${esc(collection?.supportingMessage ?? 'TRAIN SMARTER. MOVE BETTER. GO FURTHER.')}</p><small>FSD MOTION / CAMPAIGN DIRECTION</small></div></section>
        <section class="motion-lineup motion-wrap" aria-labelledby="motion-lineup-title">
          <div class="motion-section-head"><div><p class="motion-kicker">FSD MOTION / 04 CONCEPTS</p><h2 id="motion-lineup-title">The <em>line-up.</em></h2></div>
            <p>Four apparel concepts for training across gym, outdoor and self-defence contexts.</p></div>
          <div class="motion-product-grid">${allProducts.map((item, index) => productLink(item, index, sourceAssets)).join('')}</div>
        </section>
        ${stories?.length ? `<section class="motion-stories motion-wrap"><div class="motion-section-head"><div><p class="motion-kicker">CAMPAIGN CONTEXT</p><h2>Built around <em>movement.</em></h2></div></div><div class="motion-story-grid">${list(stories).map((story, index) => `<article class="motion-story"><span>0${index + 1} / ${esc(story.context ?? story.label ?? 'CONCEPT')}</span><h3>${esc(story.title ?? story.name ?? '')}</h3><p>${esc(story.copy ?? story.description ?? '')}</p></article>`).join('')}</div></section>` : ''}
        ${renderReferences(sourceAssets, hero?.id)}
        <footer class="motion-footer motion-wrap"><strong>FSD <i>/</i> MOTION</strong><span>CONCEPT</span></footer>
      </main>${dialog}</div>`;
  }

  const productRefs = refs;
  const image = refs.find(asset => asset.id === product.mainAssetId) ?? active;
  return `<div class="motion-preview-body">${headerHtml ?? ''}
    <main class="motion-page motion-detail">
      <div class="motion-wrap">
        <nav class="motion-crumb" aria-label="Breadcrumb"><a href="/__catalogue-preview/fsd-motion/" data-motion-product-link="collection">FSD MOTION</a><i>/</i><span>${esc(product.name ?? product.title ?? '')}</span></nav>
        <a class="motion-back-collection" href="/__catalogue-preview/fsd-motion/">← BACK TO MOTION COLLECTION</a>
        <section class="motion-detail-hero">
          <div class="motion-detail-art">
            ${image ? `<button class="motion-hero-image" type="button" data-motion-image="${esc(image.id ?? '')}" style="aspect-ratio:${Number(image.width) || 1} / ${Number(image.height) || 1}" data-motion-enlarge aria-label="Enlarge campaign image"><img data-motion-active-image src="${esc(sourceOf(image))}" alt=""><span>ENLARGE IMAGE</span></button>
              <p class="motion-art-caption" data-motion-active-caption aria-live="polite">${esc(campaignImageLabel(image))}<span>CAMPAIGN IMAGE</span></p>
              ${renderProductGallery(productRefs, image?.id, product.name ?? product.title ?? 'FSD MOTION')}` : `<div class="motion-no-photo">FSD MOTION</div>`}
          </div>
          <div class="motion-detail-copy"><p class="motion-kicker">FSD MOTION / CONCEPT</p><p class="motion-overline">${esc(product.category ?? product.type ?? 'SMART TRAINING APPAREL')}</p>
            <h1>${esc(product.name ?? product.title ?? '')}</h1>
            <p class="motion-description">A visual concept for the FSD MOTION collection.</p>
            <p class="motion-prelaunch-note"><strong>CONCEPT</strong><small>Product details are being finalised.</small></p>
          </div>
        </section>
      </div>
      ${stories?.length ? `<section class="motion-stories motion-wrap"><div class="motion-section-head"><div><p class="motion-kicker">CAMPAIGN CONTEXT</p><h2>In the <em>field.</em></h2></div></div><div class="motion-story-grid">${list(stories).map((story, index) => `<article class="motion-story"><span>0${index + 1} / ${esc(story.context ?? story.label ?? 'CONCEPT')}</span><h3>${esc(story.title ?? story.name ?? '')}</h3><p>${esc(story.copy ?? story.description ?? '')}</p></article>`).join('')}</div></section>` : ''}
      <section class="motion-next motion-wrap"><p class="motion-kicker">MORE MOTION CONCEPTS</p><div>${allProducts.filter(item => item.slug !== product.slug).map((item, index) => productLink(item, index, sourceAssets)).join('')}</div></section>
      <footer class="motion-footer motion-wrap"><strong>FSD <i>/</i> MOTION</strong><span>CONCEPT</span></footer>
    </main>${dialog}</div>`;
}
