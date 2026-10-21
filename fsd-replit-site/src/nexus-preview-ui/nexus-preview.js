const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

const list = value => Array.isArray(value) ? value : [];

const approvedAssetFiles = Object.freeze({
  'app-interface': 'attached_assets/fsd-nexus-approved/06_app_interface-logo-approved.png',
  'proposed-features': 'attached_assets/fsd-nexus-approved/09_feature_icons.jpg',
  'progression-conditions': 'attached_assets/fsd-nexus-approved/11_conditions_before_progression.jpg',
});

function approvedAssets(preview) {
  return list(preview?.assets).filter(asset =>
    approvedAssetFiles[asset?.id] === asset?.file &&
    typeof asset?.src === 'string'
  );
}

function featureStatus(feature) {
  return feature?.status || 'PROPOSED — PENDING TECHNICAL VALIDATION';
}

function galleryNote(asset) {
  if (asset?.id === 'app-interface') return 'STATIC INTERFACE · 87 IS ILLUSTRATIVE, NOT LIVE DATA';
  if (asset?.id === 'proposed-features') return 'UNBRANDED CONCEPT · ALL CAPABILITIES PENDING TECHNICAL VALIDATION';
  if (asset?.id === 'progression-conditions') return 'UNBRANDED CHECKLIST · NO VALIDATION GATE CONFIRMED';
  return 'CONCEPT REFERENCE · NOT PRODUCT PHOTOGRAPHY';
}

function galleryMarkup(assets, active) {
  if (!active) {
    return `<div class="nexus-gallery-empty" role="status">APPROVED CONCEPT ARTWORK NOT PROVIDED</div>`;
  }
  const activeSrc = esc(active.src);
  const activeAlt = esc(active.alt || active.label);
  const activeLabel = esc(active.label || 'Approved concept artwork');
  return `<div class="nexus-gallery" data-nexus-gallery>
    <button class="nexus-gallery-main" type="button" data-nexus-enlarge
      aria-label="Enlarge ${activeLabel}">
      <img data-nexus-active-image src="${activeSrc}" alt="${activeAlt}">
      <span class="nexus-gallery-open">OPEN ARTWORK <span aria-hidden="true">↗</span></span>
    </button>
    <div class="nexus-gallery-caption">
      <span data-nexus-active-caption aria-live="polite">${activeLabel}</span>
      <span data-nexus-active-note aria-live="polite">${esc(galleryNote(active))}</span>
    </div>
    <div class="nexus-gallery-thumbs" role="group" aria-label="Select concept artwork">
      ${assets.map((asset, index) => `<button class="nexus-thumb" type="button"
        data-nexus-gallery-select="${esc(asset.id)}" aria-pressed="${String(asset.id === active.id)}"
        aria-label="Show ${esc(asset.label || `concept artwork ${index + 1}`)}">
        <span class="nexus-thumb-index">0${index + 1}</span>
        <img src="${esc(asset.src)}" alt="" loading="lazy">
        <span class="nexus-thumb-label">${esc(asset.label || `Artwork ${index + 1}`)}</span>
      </button>`).join('')}
    </div>
  </div>`;
}

function auditStatusFor(asset, brandAudit) {
  const filename = String(asset?.file || '').split('/').pop();
  return brandAudit.find(entry => entry?.file === filename)?.status || asset?.status || 'STATUS NOT PROVIDED';
}

function auditGalleryMarkup(auditAssets, brandAudit) {
  const active = auditAssets[0];
  const statusRows = brandAudit.map((entry, index) => {
    const asset = auditAssets.find(candidate => String(candidate?.file || '').split('/').pop() === entry?.file);
    const label = asset?.label || entry?.file || entry?.assetId || `Audit item ${index + 1}`;
    return `<li class="nexus-audit-ledger-row">
      <span class="nexus-audit-ledger-index">${String(index + 1).padStart(2, '0')}</span>
      <span class="nexus-audit-ledger-name">${esc(label)}</span>
      <span class="nexus-audit-ledger-status">${esc(entry?.status || 'STATUS NOT PROVIDED')}</span>
      <span class="nexus-audit-ledger-finding">${esc(entry?.finding || 'Finding not provided.')}</span>
    </li>`;
  }).join('');
  const thumbnails = auditAssets.map((asset, index) => {
    const status = auditStatusFor(asset, brandAudit);
    const isComposite = asset.id === 'full-campaign-reference';
    return `<button class="nexus-audit-thumb" type="button"
        data-nexus-audit-gallery-select="${esc(asset.id)}"
        aria-pressed="${String(asset.id === active?.id)}"
        aria-label="Review ${esc(asset.label || `campaign reference ${index + 1}`)}. ${esc(status)}">
      <span class="nexus-audit-thumb-image"><img src="${esc(asset.src)}" alt="" loading="lazy"></span>
      <span class="nexus-audit-thumb-copy">
        <span class="nexus-audit-thumb-index">${String(index + 1).padStart(2, '0')} / ${isComposite ? 'COMPOSITE' : 'SOURCE CROP'}</span>
        <strong>${esc(asset.label || `Campaign reference ${index + 1}`)}</strong>
        <span class="nexus-audit-thumb-status">${esc(status)}</span>
        <span class="nexus-audit-thumb-flag">PRIVATE REVIEW REFERENCE · BRAND CORRECTION REQUIRED</span>
      </span>
    </button>`;
  }).join('');

  if (!active) {
    return `<section class="nexus-audit nexus-wrap" aria-labelledby="nexus-audit-title">
      <p class="nexus-kicker">PRIVATE IMAGE & BRAND REVIEW</p>
      <h2 id="nexus-audit-title">Campaign asset audit</h2>
      <div class="nexus-audit-empty" role="status">No private audit imagery was supplied. The logo audit below remains available.</div>
      <ol class="nexus-audit-ledger">${statusRows}</ol>
    </section>`;
  }

  const activeStatus = auditStatusFor(active, brandAudit);
  const activeFinding = brandAudit.find(entry => String(active.file || '').split('/').pop() === entry?.file)?.finding || active.finding || '';
  const compositeNotice = active.id === 'full-campaign-reference';
  return `<section class="nexus-audit nexus-wrap" aria-labelledby="nexus-audit-title">
    <div class="nexus-audit-heading">
      <div>
        <p class="nexus-kicker">PRIVATE IMAGE & BRAND REVIEW / 06</p>
        <h2 id="nexus-audit-title">Source material,<br><em>under audit.</em></h2>
      </div>
      <p>These are unmodified source references for owner review—not approved campaign photography. No embedded mark has been altered.</p>
    </div>
    <div class="nexus-audit-warning" role="note">
      <strong>PRIVATE REVIEW REFERENCE</strong>
      <span>BRAND CORRECTION REQUIRED</span>
      <small>Do not treat any image in this review gallery as approved product photography.</small>
    </div>
    <div class="nexus-audit-gallery" data-nexus-audit-gallery>
      <div class="nexus-audit-stage">
        <div class="nexus-audit-stage-label">
          <span>${compositeNotice ? 'FULL COMPOSITE BOARD · REFERENCE ONLY · NOT A PRODUCT PHOTO' : 'UNMODIFIED CAMPAIGN SOURCE · PRIVATE REVIEW ONLY'}</span>
          <span data-nexus-audit-active-status aria-live="polite">${esc(activeStatus)}</span>
        </div>
        <div class="nexus-audit-image-frame">
          <img data-nexus-audit-active-image src="${esc(active.src)}" alt="${esc(active.alt || active.label)}" width="${esc(active.width)}" height="${esc(active.height)}">
        </div>
        <div class="nexus-audit-stage-foot">
          <div>
            <span class="nexus-audit-active-caption" data-nexus-audit-active-caption aria-live="polite">${esc(active.label || 'Campaign source reference')}</span>
            <p data-nexus-audit-active-finding aria-live="polite">${esc(activeFinding)}</p>
          </div>
          <button class="nexus-audit-enlarge" type="button" data-nexus-audit-enlarge aria-label="Enlarge private review reference: ${esc(active.label || 'campaign source')}">ENLARGE SOURCE</button>
        </div>
        <p class="nexus-audit-no-correction">Source image displayed unchanged. Branding is intentionally visible and has not been corrected.</p>
      </div>
      <div class="nexus-audit-thumbs" role="group" aria-label="Select a private campaign reference">
        ${thumbnails}
      </div>
    </div>
    <div class="nexus-audit-ledger-heading">
      <div><p class="nexus-kicker">COMPLETE LOGO AUDIT</p><h3>11 source findings</h3></div>
      <span>MANIFEST STATUS · ALL ASSETS</span>
    </div>
    <ol class="nexus-audit-ledger" aria-label="Complete logo audit findings">
      ${statusRows}
    </ol>
    <p class="nexus-audit-ledger-note">The corrected app-screen candidate is approved as an image only. Feature statements remain pending; no finding confirms product capability or commercial readiness.</p>
  </section>`;
}

export function renderNexusPreview({ headerHtml, preview } = {}) {
  const assets = approvedAssets(preview);
  const auditAssets = list(preview?.auditAssets);
  const brandAudit = list(preview?.brandAudit);
  const active = assets.find(asset => asset.id === 'app-interface') || assets[0];
  const appImage = assets.find(asset => asset.id === 'app-interface');
  const featureArt = assets.find(asset => asset.id === 'proposed-features');
  const progressionArt = assets.find(asset => asset.id === 'progression-conditions');
  const features = list(preview?.proposedFeatures);
  const conditions = list(preview?.progressionConditions);
  const dialogCaption = active?.label || 'Approved concept artwork';
  const dialog = `<dialog class="nexus-dialog" data-nexus-dialog aria-label="Concept artwork viewer">
    <button class="nexus-dialog-close" type="button" data-nexus-close aria-label="Close artwork viewer">CLOSE <span aria-hidden="true">×</span></button>
    <img data-nexus-dialog-image alt="">
    <p data-nexus-dialog-caption>${esc(dialogCaption)}</p>
  </dialog>`;
  const status = preview?.status || 'CONCEPT FOR EXPLORATION — NOT A CURRENT PRODUCT OR COMMITMENT.';
  const photographyStatus = preview?.productPhotographyStatus ||
    'RING AND PACKAGING PHOTOGRAPHY WITHHELD — BRAND CORRECTION REQUIRED.';
  const reviewBoundary = preview?.reviewBoundary || '';

  return `<div class="nexus-preview-body">
    ${headerHtml ?? ''}
    <main class="nexus-page">
      <div class="nexus-wrap">
        <nav class="nexus-crumb" aria-label="Breadcrumb">
          <span>FSD</span><span aria-hidden="true">/</span><span>PRIVATE CONCEPT PREVIEW</span><span aria-hidden="true">/</span><span>NEXUS</span>
        </nav>
        <div class="nexus-proof">
          <span><i aria-hidden="true"></i> PRIVATE SMART-RING CONCEPT</span>
          <strong>${esc(preview?.draftStatus || 'PRIVATE CONCEPT · DRAFT / PENDING APPROVAL')}</strong>
        </div>

        <section class="nexus-hero" aria-labelledby="nexus-title">
          <div class="nexus-hero-copy">
            <p class="nexus-kicker">FSD / ${esc(preview?.category || 'WEARABLE TECHNOLOGY')}</p>
            <p class="nexus-overline">TRAINING · RECOVERY · EVERYDAY WELLBEING</p>
            <h1 id="nexus-title" aria-label="FSD NEXUS"><em>NEXUS</em></h1>
            <p class="nexus-hero-line">${esc(preview?.headline || 'DISCREET TECHNOLOGY. DEEPER INSIGHTS.')}</p>
            <p class="nexus-intro">${esc(preview?.description || '')}</p>
            <div class="nexus-concept-note">
              <span class="nexus-note-mark" aria-hidden="true">01</span>
              <div><strong>RESEARCH CONCEPT</strong><small>${esc(status)}</small></div>
            </div>
          </div>
          <div class="nexus-hero-visual" aria-label="Concept presentation artwork">
            <div class="nexus-orbit nexus-orbit--one" aria-hidden="true"></div>
            <div class="nexus-orbit nexus-orbit--two" aria-hidden="true"></div>
            <div class="nexus-hero-visual-copy">
               <span>NEXUS / CONCEPT</span>
              <strong>01<span>—</span>03</strong>
              <small>CONCEPT STUDY<br>NOT A PRODUCT RENDER</small>
            </div>
            <div class="nexus-hero-index" aria-hidden="true">N / 01</div>
          </div>
        </section>

        <section class="nexus-manifesto" aria-label="Concept direction">
          <div class="nexus-manifesto-index">01 / THE ENQUIRY</div>
          <p>${esc(preview?.campaignMessage || 'TRAIN. RECOVER. BALANCE. PERFORM. LIVE BETTER.')}</p>
          <small>AN EXPLORATION OF A POSSIBLE DIRECTION<br>NOT A HEALTH OR PERFORMANCE OUTCOME</small>
        </section>

        <section class="nexus-evidence nexus-wrap" aria-labelledby="nexus-evidence-title">
          <div class="nexus-section-head">
            <div><p class="nexus-kicker">CONCEPT MATERIAL / 01</p><h2 id="nexus-evidence-title">A direction, <em>not a device.</em></h2></div>
            <p>The approved concept gallery uses only the corrected app-screen candidate and unbranded references. Supplied branded crops appear separately below for private audit only.</p>
          </div>
          ${galleryMarkup(assets, active)}
        </section>

        <section class="nexus-app-section" aria-labelledby="nexus-app-title">
          <div class="nexus-wrap nexus-app-layout">
            <div class="nexus-app-copy">
              <p class="nexus-kicker">02 / INTERFACE STUDY</p>
              <h2 id="nexus-app-title">An interface<br>in <em>exploration.</em></h2>
              <p>The supplied screen is a static concept illustration. It does not demonstrate a functional app, connected device or verified measurement.</p>
              <p class="nexus-app-warning">Static concept illustration only; the displayed 87 score is not live data or a verified measurement.</p>
              <span class="nexus-validation">PROPOSED — PENDING TECHNICAL VALIDATION</span>
            </div>
            <figure class="nexus-app-figure">
              ${appImage ? `<img src="${esc(appImage.src)}" alt="${esc(appImage.alt || appImage.label)}" loading="lazy">` : '<div class="nexus-gallery-empty">APP CONCEPT ARTWORK NOT PROVIDED</div>'}
              <figcaption><span>APP INTERFACE CONCEPT</span><span>STATIC ARTWORK / NOT FUNCTIONAL</span></figcaption>
            </figure>
          </div>
        </section>

        <section class="nexus-capabilities nexus-wrap" aria-labelledby="nexus-capabilities-title">
          <div class="nexus-capabilities-intro">
            <p class="nexus-kicker">03 / CAPABILITY HYPOTHESES</p>
            <h2 id="nexus-capabilities-title">Ideas under<br><em>examination.</em></h2>
            <p>These are research prompts only. No sensor, software or result is confirmed.</p>
            ${featureArt ? `<figure class="nexus-feature-art"><img src="${esc(featureArt.src)}" alt="${esc(featureArt.alt || featureArt.label)}" loading="lazy"><figcaption>UNBRANDED CONCEPT REFERENCE · NOT EVIDENCE OF CAPABILITY</figcaption></figure>` : ''}
          </div>
          <ul class="nexus-feature-list">
            ${features.map((feature, index) => `<li>
              <span class="nexus-feature-no">0${index + 1}</span>
              <div><strong>${esc(feature.name ?? feature.label ?? feature)}</strong><small>${esc(featureStatus(feature))}</small></div>
              <span class="nexus-feature-arrow" aria-hidden="true">+</span>
            </li>`).join('')}
          </ul>
        </section>

        <section class="nexus-boundary">
          <div class="nexus-wrap nexus-boundary-layout">
            <div>
              <p class="nexus-kicker">04 / BEFORE ANY PROGRESSION</p>
              <h2>Open questions.<br><em>Clear boundaries.</em></h2>
              <p>Progression depends on future review. The checklist artwork is an unverified concept reference, not evidence that any gate is complete.</p>
            </div>
            <div class="nexus-gates">
              ${conditions.map((condition, index) => `<div class="nexus-gate">
                <span>0${index + 1}</span><strong>${esc(condition.name ?? condition.label ?? condition)}</strong><small>${esc(condition.status || 'NOT VERIFIED')}</small>
              </div>`).join('')}
            </div>
            ${progressionArt ? `<figure class="nexus-progression-art"><img src="${esc(progressionArt.src)}" alt="${esc(progressionArt.alt || progressionArt.label)}" loading="lazy"><figcaption>UNBRANDED CHECKLIST CONCEPT · NOT A COMPLETED VALIDATION RECORD</figcaption></figure>` : ''}
          </div>
        </section>

        <section class="nexus-photography nexus-wrap" aria-labelledby="nexus-photo-title">
          <div class="nexus-photo-mark" aria-hidden="true"><span></span><span></span><span></span></div>
          <div>
            <p class="nexus-kicker">05 / IMAGE BOUNDARY</p>
            <h2 id="nexus-photo-title">The product<br>remains <em>unpictured.</em></h2>
            <p>${esc(photographyStatus)} These original composite-board crops remain unmodified and are not approved product photographs. They are shown only in the clearly labelled owner-review audit below; no embedded logo has been erased, overlaid or redrawn.</p>
          </div>
          <span class="nexus-photo-stamp">PHOTOGRAPHY<br>WITHHELD</span>
        </section>

        ${auditGalleryMarkup(auditAssets, brandAudit)}

        <section class="nexus-review-boundary">
          <div class="nexus-wrap">
            <p class="nexus-kicker">REVIEW BOUNDARY / PRIVATE</p>
            <p>${esc(reviewBoundary)}</p>
            <strong>${esc(status)}</strong>
          </div>
        </section>
        <footer class="nexus-footer nexus-wrap">
          <strong>FSD / NEXUS</strong>
          <span>PRIVATE CONCEPT REVIEW</span>
          <span>DRAFT / PENDING APPROVAL</span>
        </footer>
      </div>
    </main>
    ${dialog}
  </div>`;
}
