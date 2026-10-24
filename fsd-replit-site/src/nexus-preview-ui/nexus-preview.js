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
  return 'FSD NEXUS';
}

function galleryNote(asset) {
  if (asset?.id === 'app-interface') return 'STATIC INTERFACE';
  if (asset?.id === 'proposed-features') return 'NEXUS FEATURES';
  if (asset?.id === 'progression-conditions') return 'RESPONSIBLE DEVELOPMENT';
  return 'CAMPAIGN IMAGE';
}

function galleryAssetTitle(asset, index = 0) {
  return ({
    'app-interface': 'Companion app interface',
    'proposed-features': 'FSD NEXUS features',
    'progression-conditions': 'Product information',
  }[asset?.id] || `FSD image ${index + 1}`);
}

function galleryMarkup(assets, active) {
  if (!active) {
    return `<div class="nexus-gallery-empty" role="status">IMAGE UNAVAILABLE</div>`;
  }
  const activeSrc = esc(active.src);
  const activeLabel = esc(galleryAssetTitle(active, 0));
  const activeAlt = esc(`FSD NEXUS ${galleryAssetTitle(active, 0)}`);
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
    <div class="nexus-gallery-thumbs" role="group" aria-label="Select product imagery">
      ${assets.map((asset, index) => `<button class="nexus-thumb" type="button"
        data-nexus-gallery-select="${esc(asset.id)}" aria-pressed="${String(asset.id === active.id)}"
        aria-label="Show ${esc(galleryAssetTitle(asset, index))}">
        <span class="nexus-thumb-index">0${index + 1}</span>
        <img src="${esc(asset.src)}" alt="" loading="lazy">
        <span class="nexus-thumb-label">${esc(galleryAssetTitle(asset, index))}</span>
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
  const activeContext = compositeNotice
    ? 'FULL COMPOSITE BOARD · REFERENCE ONLY · NOT A PRODUCT PHOTO'
    : 'UNMODIFIED CAMPAIGN SOURCE · PRIVATE REVIEW ONLY';
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
          <span data-nexus-audit-active-context aria-live="polite">${esc(activeContext)}</span>
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
  const active = assets.find(asset => asset.id === 'app-interface') || assets[0];
  const appImage = assets.find(asset => asset.id === 'app-interface');
  const featureArt = assets.find(asset => asset.id === 'proposed-features');
  const progressionArt = assets.find(asset => asset.id === 'progression-conditions');
  const features = list(preview?.proposedFeatures);
  const conditions = list(preview?.progressionConditions);
  const dialogCaption = active?.label || 'FSD gallery image';
  const dialog = `<dialog class="nexus-dialog" data-nexus-dialog aria-label="FSD image viewer">
    <button class="nexus-dialog-close" type="button" data-nexus-close aria-label="Close artwork viewer">CLOSE <span aria-hidden="true">×</span></button>
    <img data-nexus-dialog-image alt="">
    <p data-nexus-dialog-caption>${esc(dialogCaption)}</p>
  </dialog>`;
  return `<div class="nexus-preview-body">
    ${headerHtml ?? ''}
    <main class="nexus-page">
      <div class="nexus-wrap">
        <nav class="nexus-crumb" aria-label="Breadcrumb">
          <span>FSD</span><span aria-hidden="true">/</span><span>COLLECTION</span><span aria-hidden="true">/</span><span>NEXUS</span>
        </nav>
        <a class="nexus-back-collection fsd-collection-return" href="/#collections" data-collection-return>← BACK TO COLLECTION</a>

        <section class="nexus-hero" aria-labelledby="nexus-title">
          <div class="nexus-hero-copy">
            <p class="nexus-kicker">FSD / ${esc(preview?.category || 'WEARABLE TECHNOLOGY')}</p>
            <p class="nexus-overline">TRAINING · RECOVERY · EVERYDAY WELLBEING</p>
            <h1 id="nexus-title" aria-label="FSD NEXUS"><em>NEXUS</em></h1>
            <p class="nexus-hero-line">${esc(preview?.headline || 'DISCREET TECHNOLOGY. DEEPER INSIGHTS.')}</p>
            <p class="nexus-intro">${esc(preview?.description || '')}</p>
            <p class="nexus-prelaunch-note"><strong>FSD NEXUS</strong><small>Training, recovery and everyday wellbeing.</small></p>
          </div>
          <div class="nexus-hero-visual" aria-label="FSD NEXUS imagery">
            <div class="nexus-orbit nexus-orbit--one" aria-hidden="true"></div>
            <div class="nexus-orbit nexus-orbit--two" aria-hidden="true"></div>
            <div class="nexus-hero-visual-copy">
               <span>NEXUS / PERFORMANCE</span>
              <strong>01<span>—</span>03</strong>
               <small>FSD NEXUS<br>CONNECTED TECHNOLOGY</small>
            </div>
            <div class="nexus-hero-index" aria-hidden="true">N / 01</div>
          </div>
        </section>

        <section class="nexus-manifesto" aria-label="FSD NEXUS">
          <div class="nexus-manifesto-index">01 / THE ENQUIRY</div>
          <p>${esc(preview?.campaignMessage || 'TRAIN. RECOVER. BALANCE. PERFORM. LIVE BETTER.')}</p>
          <small>FSD NEXUS / CONNECTED TECHNOLOGY</small>
        </section>

        <section class="nexus-evidence nexus-wrap" aria-labelledby="nexus-evidence-title">
          <div class="nexus-section-head">
            <div><p class="nexus-kicker">NEXUS DETAIL / 01</p><h2 id="nexus-evidence-title">Technology for<br><em>everyday training.</em></h2></div>
            <p>Explore FSD NEXUS product imagery and details.</p>
          </div>
          ${galleryMarkup(assets, active)}
        </section>

        <section class="nexus-app-section" aria-labelledby="nexus-app-title">
          <div class="nexus-wrap nexus-app-layout">
            <div class="nexus-app-copy">
              <p class="nexus-kicker">02 / INTERFACE</p>
              <h2 id="nexus-app-title">FSD NEXUS<br><em>app interface.</em></h2>
              <p>FSD NEXUS app imagery.</p>
              <p class="nexus-app-warning">Illustrative interface. Scores shown are not live data.</p>
              <span class="nexus-validation">FSD NEXUS</span>
            </div>
            <figure class="nexus-app-figure">
              ${appImage ? `<img src="${esc(appImage.src)}" alt="${esc(appImage.alt || appImage.label)}" loading="lazy">` : ''}
              <figcaption><span>APP INTERFACE</span><span>STATIC INTERFACE</span></figcaption>
            </figure>
          </div>
        </section>

        <section class="nexus-capabilities nexus-wrap" aria-labelledby="nexus-capabilities-title">
          <div class="nexus-capabilities-intro">
            <p class="nexus-kicker">03 / FEATURES</p>
            <h2 id="nexus-capabilities-title">Training<br><em>and recovery.</em></h2>
            <p>FSD NEXUS product features.</p>
            ${featureArt ? `<figure class="nexus-feature-art"><img src="${esc(featureArt.src)}" alt="${esc(featureArt.alt || featureArt.label)}" loading="lazy"><figcaption>NEXUS FEATURES</figcaption></figure>` : ''}
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
            <p class="nexus-kicker">04 / PRODUCT DETAILS</p>
            <h2>Designed for<br><em>everyday use.</em></h2>
            <p>FSD NEXUS information and specifications.</p>
            </div>
            <div class="nexus-gates">
              ${conditions.map((condition, index) => `<div class="nexus-gate">
                <span>0${index + 1}</span><strong>${esc(condition.name ?? condition.label ?? condition)}</strong><small>KEY CONSIDERATION</small>
              </div>`).join('')}
            </div>
            ${progressionArt ? `<figure class="nexus-progression-art"><img src="${esc(progressionArt.src)}" alt="${esc(progressionArt.alt || progressionArt.label)}" loading="lazy"><figcaption>RESPONSIBLE DEVELOPMENT</figcaption></figure>` : ''}
          </div>
        </section>

        <section class="nexus-photography nexus-wrap" aria-labelledby="nexus-photo-title">
          <div class="nexus-photo-mark" aria-hidden="true"><span></span><span></span><span></span></div>
          <div>
            <p class="nexus-kicker">05 / THE DESIGN</p>
            <h2 id="nexus-photo-title">Connected<br><em>performance.</em></h2>
            <p>FSD NEXUS product imagery.</p>
          </div>
        </section>

        <footer class="nexus-footer nexus-wrap">
          <strong>FSD / NEXUS</strong>
        </footer>
      </div>
    </main>
    ${dialog}
  </div>`;
}
