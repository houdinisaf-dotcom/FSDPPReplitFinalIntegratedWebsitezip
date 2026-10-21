const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

const list = value => Array.isArray(value) ? value : [];
const labelOf = item => item?.label ?? item?.title ?? item?.name ?? '';
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
  const title = esc(labelOf(asset) || `Campaign reference ${index + 1}`);
  const src = esc(sourceOf(asset));
  return `<button class="motion-reference" type="button" data-motion-gallery-select="${id}" aria-pressed="${String(String(asset.id ?? '') === String(activeId))}">
    <span class="motion-ref-media"><img src="${src}" alt="${esc(asset.alt ?? '')}" loading="lazy"></span>
    <span class="motion-ref-meta"><small>${String(index + 1).padStart(2, '0')} / CAMPAIGN CROP</small><strong>${title}</strong></span>
    <span class="motion-ref-note">COMPOSITE ARTWORK · NOT STANDALONE PHOTOGRAPHY</span>
  </button>`;
}

function productLink(product, index, assets) {
  const refs = refsFor(product, assets);
  const visual = refs[0];
  const href = `/__catalogue-preview/fsd-motion/products/${encodeURIComponent(slugOf(product))}/`;
  return `<a class="motion-product" href="${href}" data-motion-product-link="${esc(slugOf(product))}">
    <span class="motion-product-visual">${visual ? `<img src="${esc(sourceOf(visual))}" alt="${esc(visual.alt ?? '')}" loading="lazy">` : `<span class="motion-no-photo">CLEAN PRODUCT<br>PHOTOGRAPH<br>NOT SUPPLIED</span>`}
      <span class="motion-product-index">0${index + 1}</span>
    </span>
    <span class="motion-product-copy"><small>${esc(product.category ?? product.type ?? 'FSD MOTION')}</small>
      <strong>${esc(product.name ?? product.title ?? '')}</strong>
      <span>${esc(product.subtitle ?? '')}</span>
      <span class="motion-status">${esc(product.status ?? 'DRAFT / PENDING APPROVAL')}</span>
      <span class="motion-link-label">OPEN PRIVATE PROOF <i aria-hidden="true">↗</i></span>
    </span>
  </a>`;
}

function renderReferences(references, activeId) {
  if (!references.length) return '';
  return `<section class="motion-archive" aria-labelledby="motion-archive-title">
    <div class="motion-section-head"><div><p class="motion-kicker">SUPPLIED SOURCE ARTWORK</p><h2 id="motion-archive-title">Reference <em>archive.</em></h2></div>
      <p>Every image shown is a crop from one composite campaign artwork. These are not independent studio photographs.</p></div>
    <div class="motion-reference-grid">${references.map((asset, index) => imageCard(asset, index, activeId)).join('')}</div>
  </section>`;
}

function renderProductGallery(references, activeId, productName) {
  if (!references.length) return '';
  return `<div class="motion-product-gallery" role="group" aria-label="${esc(productName)} campaign image selections">
    ${references.map((asset, index) => `<button class="motion-gallery-thumb" type="button"
      data-motion-gallery-select="${esc(asset.id)}" aria-pressed="${String(asset.id === activeId)}"
      aria-label="Show campaign reference: ${esc(labelOf(asset))}">
      <img src="${esc(sourceOf(asset))}" alt="" loading="lazy">
      <span>${esc(labelOf(asset) || `Reference ${index + 1}`)}</span>
    </button>`).join('')}
  </div>`;
}

export function renderMotionPreview({ headerHtml, collection, product, products, assets, stories, pendingFeatures, pendingSpecifications, missingPhotographs }) {
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
          <nav class="motion-crumb" aria-label="Breadcrumb"><span>FSD</span><i>/</i><span>PRIVATE CONCEPT PREVIEW</span><i>/</i><span>${esc(title)}</span></nav>
          <div class="motion-proof"><span><i></i> PRIVATE APPAREL CONCEPT</span><strong>DRAFT / PENDING APPROVAL</strong></div>
          <section class="motion-collection-hero">
            <div class="motion-hero-copy"><p class="motion-kicker">FSD / TRAINING APPAREL</p><p class="motion-overline">GYM · OUTDOORS · SELF-DEFENCE</p>
              <h1>FSD<br><em>MOTION</em></h1><p class="motion-hero-subtitle">${esc(collection?.subtitle ?? title)}</p>
              ${collection?.introduction ? `<p class="motion-hero-introduction">${esc(collection.introduction)}</p>` : ''}
              <div class="motion-concept-note"><span class="motion-note-mark">!</span><div><strong>PRIVATE CONCEPT REVIEW</strong><small>Proposed apparel. Product details and all performance statements remain pending approval.</small></div></div>
            </div>
            <div class="motion-hero-art">
              ${heroSrc ? `<button class="motion-hero-image motion-hero-image--campaign" type="button" data-motion-image="${esc(hero.id ?? '')}" data-motion-enlarge aria-label="Enlarge active campaign artwork"><img data-motion-active-image src="${esc(heroSrc)}" alt="${esc(hero?.alt ?? '')}"><span>CAMPAIGN ARTWORK · OPEN REFERENCE</span></button>` : `<div class="motion-no-photo">CAMPAIGN ARTWORK NOT PROVIDED</div>`}
              <p class="motion-art-caption" data-motion-active-caption aria-live="polite">${esc(labelOf(hero) || 'Supplied campaign reference')} <span>COMPOSITE CROP · NOT PRODUCT PHOTOGRAPHY</span></p>
            </div>
          </section>
        </div>
        <section class="motion-manifesto"><div class="motion-wrap"><span>01 / THE PROPOSAL</span><p>${esc(collection?.supportingMessage ?? 'TRAIN SMARTER. MOVE BETTER. GO FURTHER.')}</p><small>CAMPAIGN CONCEPT ONLY · NOT A VERIFIED PERFORMANCE CLAIM</small></div></section>
        <section class="motion-lineup motion-wrap" aria-labelledby="motion-lineup-title">
          <div class="motion-section-head"><div><p class="motion-kicker">PRIVATE PRODUCT PROOFS / 04</p><h2 id="motion-lineup-title">The proposed <em>line-up.</em></h2></div>
            <p>Four apparel concepts for training across gym, outdoor and self-defence contexts. Status remains draft.</p></div>
          <div class="motion-product-grid">${allProducts.map((item, index) => productLink(item, index, sourceAssets)).join('')}</div>
        </section>
        ${stories?.length ? `<section class="motion-stories motion-wrap"><div class="motion-section-head"><div><p class="motion-kicker">CAMPAIGN CONTEXT</p><h2>Built around <em>movement.</em></h2></div></div><div class="motion-story-grid">${list(stories).map((story, index) => `<article class="motion-story"><span>0${index + 1} / ${esc(story.context ?? story.label ?? 'CONCEPT')}</span><h3>${esc(story.title ?? story.name ?? '')}</h3><p>${esc(story.copy ?? story.description ?? '')}</p></article>`).join('')}</div></section>` : ''}
        <section class="motion-pending-band"><div class="motion-wrap motion-pending-inner"><div><p class="motion-kicker">TECHNOLOGY / PERFORMANCE</p><h2>Every claim<br><em>still pending.</em></h2><p>Campaign wording and feature concepts are unverified. No capability or operational performance is represented as established.</p></div>
          <ul>${list(pendingFeatures).map((feature, index) => `<li><span>0${index + 1}</span><strong>${esc(feature.label ?? feature.name ?? feature)}</strong><small>${esc(feature.status ?? 'PENDING VERIFICATION')}</small></li>`).join('')}</ul>
        </div></section>
        <section class="motion-review motion-wrap"><div><p class="motion-kicker">REVIEW BOUNDARY</p><h2>What is shown.<br><em>What is missing.</em></h2><p>All source images are supplied crops of one composite campaign artwork. Clean standalone product photographs have not been supplied.</p></div>
          <div class="motion-review-columns"><article><small>01 / PHOTOGRAPHY</small><h3>Standalone views</h3><ul>${list(missingPhotographs).map(item => `<li>${esc(item)}</li>`).join('')}</ul></article><article><small>02 / SPECIFICATIONS</small><h3>Awaiting confirmation</h3><ul>${list(pendingSpecifications).map(item => `<li>${esc(item.label ?? item)}</li>`).join('')}</ul></article></div>
        </section>
        ${renderReferences(sourceAssets, hero?.id)}
        <footer class="motion-footer motion-wrap"><strong>FSD <i>/</i> MOTION</strong><span>PRIVATE CONCEPT REVIEW · NOT FOR SALE</span><span>DRAFT / PENDING APPROVAL</span></footer>
      </main>${dialog}</div>`;
  }

  const productRefs = refs;
  const image = refs.find(asset => asset.id === product.mainAssetId) ?? active;
  const slug = slugOf(product);
  const features = list(pendingFeatures);
  return `<div class="motion-preview-body">${headerHtml ?? ''}
    <main class="motion-page motion-detail">
      <div class="motion-wrap">
        <nav class="motion-crumb" aria-label="Breadcrumb"><a href="/__catalogue-preview/fsd-motion/" data-motion-product-link="collection">FSD MOTION</a><i>/</i><span>PRIVATE PRODUCT PROOF</span><i>/</i><span>${esc(product.name ?? product.title ?? '')}</span></nav>
        <div class="motion-proof"><span><i></i> PRIVATE PRODUCT PROOF</span><strong>${esc(product.status ?? 'DRAFT / PENDING APPROVAL')}</strong></div>
        <section class="motion-detail-hero">
          <div class="motion-detail-art">
            ${image ? `<button class="motion-hero-image" type="button" data-motion-image="${esc(image.id ?? '')}" style="aspect-ratio:${Number(image.width) || 1} / ${Number(image.height) || 1}" data-motion-enlarge aria-label="Enlarge active campaign artwork"><img data-motion-active-image src="${esc(sourceOf(image))}" alt="${esc(image.alt ?? '')}"><span>CAMPAIGN ARTWORK · OPEN REFERENCE</span></button>
              <p class="motion-art-caption" data-motion-active-caption aria-live="polite">${esc(labelOf(image))}<span>SUPPLIED CAMPAIGN CROP · NOT STANDALONE PHOTOGRAPHY</span></p>
              ${renderProductGallery(productRefs, image?.id, product.name ?? product.title ?? 'FSD MOTION')}` : `<div class="motion-no-photo">CLEAN STANDALONE PRODUCT PHOTOGRAPH NOT SUPPLIED</div>`}
          </div>
          <div class="motion-detail-copy"><p class="motion-kicker">FSD MOTION / PRIVATE CONCEPT</p><p class="motion-overline">${esc(product.category ?? product.type ?? 'SMART TRAINING APPAREL')}</p>
            <h1>${esc(product.name ?? product.title ?? '')}</h1><p class="motion-detail-subtitle">${esc(product.subtitle ?? '')}</p>
            ${product.description ? `<p class="motion-description">${esc(product.description)}</p>` : ''}
            <div class="motion-concept-note"><span class="motion-note-mark">!</span><div><strong>DRAFT / PENDING APPROVAL</strong><small>Not available for purchase. Technical and performance statements are unverified concepts.</small></div></div>
          </div>
        </section>
      </div>
      ${features.length ? `<section class="motion-pending-band"><div class="motion-wrap motion-pending-inner"><div><p class="motion-kicker">PROPOSED CONCEPT FEATURES</p><h2>Not a promise.<br><em>Pending review.</em></h2><p>All technology and performance statements remain unverified.</p></div><ul>${features.map((feature, index) => `<li><span>0${index + 1}</span><strong>${esc(feature.label ?? feature.name ?? feature)}</strong><small>${esc(feature.status ?? 'PENDING VERIFICATION')}</small></li>`).join('')}</ul></div></section>` : ''}
      <section class="motion-review motion-wrap"><div><p class="motion-kicker">PRODUCT REVIEW / ${esc(slug)}</p><h2>Proof, not<br><em>product photography.</em></h2><p>These visuals are crops from one composite campaign artwork and do not show independent studio photographs.</p></div>
        <div class="motion-review-columns"><article><small>01 / PHOTOGRAPHY</small><h3>Standalone views</h3><ul>${list(missingPhotographs).map(item => `<li>${esc(item)}</li>`).join('')}</ul></article><article><small>02 / SPECIFICATIONS</small><h3>Pending verification</h3><ul>${list(pendingSpecifications).map(item => `<li>${esc(item.label ?? item)}</li>`).join('')}</ul></article></div>
      </section>
      ${stories?.length ? `<section class="motion-stories motion-wrap"><div class="motion-section-head"><div><p class="motion-kicker">CAMPAIGN CONTEXT</p><h2>In the <em>field.</em></h2></div></div><div class="motion-story-grid">${list(stories).map((story, index) => `<article class="motion-story"><span>0${index + 1} / ${esc(story.context ?? story.label ?? 'CONCEPT')}</span><h3>${esc(story.title ?? story.name ?? '')}</h3><p>${esc(story.copy ?? story.description ?? '')}</p></article>`).join('')}</div></section>` : ''}
      <section class="motion-next motion-wrap"><p class="motion-kicker">OTHER PRIVATE PROOFS</p><div>${allProducts.filter(item => item.slug !== product.slug).map((item, index) => productLink(item, index, sourceAssets)).join('')}</div></section>
      <footer class="motion-footer motion-wrap"><strong>FSD <i>/</i> MOTION</strong><span>PRIVATE CONCEPT REVIEW · NOT FOR SALE</span><span>DRAFT / PENDING APPROVAL</span></footer>
    </main>${dialog}</div>`;
}
