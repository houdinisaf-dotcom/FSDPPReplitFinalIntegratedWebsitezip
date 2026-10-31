import { alightPreviewPath } from './alight-preview-path.js';
import { motionPreviewPath } from './motion-preview-path.js';
import { nexusPreviewPath } from './nexus-preview-path.js';

const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

export const innovationHubPages = Object.freeze([
  {
    id: 'innovation-bio-weave-ecg-hydration-compression-tops',
    title: 'Bio-Weave™ ECG & Hydration Compression Tops',
    summary: 'FSD Bio-Lab product information.',
    modules: ['Product overview', 'Materials & technology', 'Compatibility & availability'],
  },
  {
    id: 'innovation-fsd-aware-band',
    title: 'FSD Aware Band™',
    summary: 'FSD Bio-Lab product information.',
    modules: ['Product overview', 'Product & interface', 'Compatibility & availability'],
  },
  {
    id: 'innovation-graphene-infused-thermal-recovery-vests',
    title: 'Graphene-Infused Thermal Recovery Vests',
    summary: 'FSD Bio-Lab product information.',
    modules: ['Product overview', 'Materials & care', 'Technical details & availability'],
  },
  {
    id: 'innovation-fsd-digital-pass',
    title: 'FSD Digital Pass™',
    summary: 'FSD Bio-Lab product information.',
    modules: ['Product overview', 'Access & privacy', 'Compatibility & availability'],
  },
  {
    id: 'innovation-fsd-vector-smartwatch',
    title: 'FSD VECTOR — Smartwatch',
    summary: 'FSD Bio-Lab product information.',
    modules: ['Product overview', 'Product & interface', 'Specifications & compatibility'],
  },
  {
    id: 'innovation-fsd-core-heart-rate-sensor-strap',
    title: 'FSD CORE — Heart Rate Sensor Strap',
    summary: 'FSD Bio-Lab product information.',
    modules: ['Product overview', 'Product & fit', 'Specifications & compatibility'],
  },
  {
    id: 'smart-apparel-nfc',
    title: 'Smart Apparel & NFC Authentication',
    summary: 'Active Bio-Lab initiative for garment authentication, product information, and digital content.',
    modules: ['Garment authentication', 'Care, sizing & digital content', 'Privacy, security & manufacturing gates'],
    initiative: true,
    houseRoute: 'bio-lab/smart-apparel',
  },
  {
    id: 'adaptive-technical-fabrics',
    title: 'Adaptive Technical Fabrics',
    summary: 'Active Bio-Lab initiative focused on material science, moisture management, and garment durability.',
    modules: ['Material science & moisture management', 'Durability testing', 'Partner, IP & rollout gates'],
    initiative: true,
    houseRoute: 'bio-lab/adaptive-fabrics',
  },
]);

const standalonePages = Object.freeze([
  {
    id: 'tactical-shield-membership',
    title: 'Tactical Shield Membership',
    eyebrow: 'FSD / PRIVATE ACCESS',
    summary: 'A dedicated information page for the proposed membership. Terms, benefits, and access details are not confirmed; registration is not open and this page collects no sign-up data.',
    modules: ['Membership overview', 'Access & benefits', 'Registration & terms'],
    action: 'REGISTRATION NOT OPEN',
  },
  {
    id: 'fsd-pods',
    title: 'FSD Pods',
    eyebrow: 'FSD / GLOBAL VISION & OPERATIONS',
    summary: 'Active infrastructure initiative with rollout underway. The House page contains its delivery scope, value pillars, and rollout framework.',
    modules: ['Modular training and retail infrastructure', 'Operating model and site readiness', 'Safety, planning, and demand gates'],
    action: 'VIEW GLOBAL VISION & OPERATIONS',
    actionHref: '/the-house.html#global/pods',
  },
  {
    id: 'performance-linked-partnerships-security',
    title: 'Performance-Linked Partnerships',
    eyebrow: 'FSD / THE HOUSE',
    summary: 'Active House & Universe initiative with rollout underway. Partner participation and written terms remain subject to agreement.',
    modules: ['Co-created products and campaigns', 'Athlete, coach, and workplace programmes', 'Safety, measurement, and governance'],
    action: 'PARTNERSHIP ENQUIRIES NOT CONNECTED',
    initiative: true,
    houseRoute: 'community/performance-partnerships',
  },
]);

export const flagshipPageDefinitions = Object.freeze([
  ...standalonePages,
  ...innovationHubPages.map(page => ({
    ...page,
    eyebrow: 'FSD BIO-LAB™ / PRODUCT RANGE',
  })),
]);

export const flagshipPageHashRoutes = Object.freeze(
  flagshipPageDefinitions.map(page => [
    `#${page.id}`,
    { view: 'page', target: page.id },
  ]),
);

export const flagshipPageHashes = new Set(
  flagshipPageDefinitions.map(page => `#${page.id}`),
);

const innovationPageByTitle = new Map(
  innovationHubPages.map(page => [page.title, page]),
);

export function getInnovationPageForTitle(title) {
  return innovationPageByTitle.get(title) || null;
}

function renderAssetSlot(title, variant = 'editorial') {
  return `<figure class="fsd-asset-slot fsd-asset-slot--${variant}" aria-label="Visual placeholder for ${escapeHTML(title)}">
    <div class="fsd-asset-slot-content">
      <span class="fsd-asset-slot-kicker">FSD / PERFORMANCE</span>
      <strong>${escapeHTML(title)}</strong>
      <small>FSD product and editorial imagery.</small>
    </div>
  </figure>`;
}

export function renderInnovationHubIndex({ includePrivatePreviews = false } = {}) {
  const conceptLinks = innovationHubPages.map(page => `<a class="fsd-innovation-card" href="${page.initiative
    ? `${escapeHTML('/the-house.html#')}${escapeHTML(page.houseRoute)}`
    : `#${escapeHTML(page.id)}`}">
    <span class="fsd-innovation-card-index">${String(innovationHubPages.indexOf(page) + 1).padStart(2, '0')}</span>
    <span class="fsd-innovation-card-copy">
      <strong>${escapeHTML(page.title)}</strong>
      <small>${page.initiative ? 'ACTIVE BIO-LAB INITIATIVE' : 'FSD PRODUCT · DETAILS'}</small>
    </span>
    <span class="fsd-innovation-card-arrow" aria-hidden="true">↗</span>
  </a>`).join('');

  const privatePreviews = includePrivatePreviews ? `<div class="fsd-private-preview-links" aria-label="FSD product collections">
    <p class="fsd-placeholder-label">FSD PRODUCT COLLECTIONS</p>
    <a href="${escapeHTML(alightPreviewPath)}">FSD ALIGHT <span>EXPLORE ↗</span></a>
    <a href="${escapeHTML(motionPreviewPath)}">FSD MOTION <span>EXPLORE ↗</span></a>
    <a href="${escapeHTML(nexusPreviewPath)}">FSD NEXUS <span>EXPLORE ↗</span></a>
  </div>` : '';

  return `<section class="fsd-innovation-hub" id="innovation-hub" aria-labelledby="fsd-innovation-hub-title">
    <div class="fsd-page-shell">
      <p class="fsd-page-eyebrow">FSD BIO-LAB™ <span aria-hidden="true">/</span> INNOVATION HUB</p>
      <div class="fsd-hub-heading">
        <div>
          <h2 id="fsd-innovation-hub-title">Innovation Hub</h2>
          <p>Explore FSD Bio-Lab products and active material-science and connected-apparel initiatives.</p>
        </div>
        ${renderAssetSlot('Innovation Hub editorial image', 'hub')}
      </div>
      <nav class="fsd-innovation-grid" aria-label="FSD Bio-Lab products">${conceptLinks}</nav>
      ${privatePreviews}
    </div>
  </section>`;
}

function renderPageModule(page, moduleTitle, index) {
  const ratio = index === 0 ? 'editorial' : 'detail';
  return `<article class="fsd-page-module">
    <div class="fsd-page-module-copy">
      <span class="fsd-page-module-index">${String(index + 1).padStart(2, '0')}</span>
      <h3>${escapeHTML(moduleTitle)}</h3>
       <p>${page.initiative ? 'Initiative scope, value pillars, and rollout framework.' : 'Product information and supporting media.'}</p>
    </div>
    ${renderAssetSlot(`${page.title} / ${moduleTitle}`, ratio)}
  </article>`;
}

function renderPage(page) {
  const isInnovationPage = innovationHubPages.some(entry => entry.id === page.id);
  const returnHref = isInnovationPage ? '#innovation-hub' : '#universe';
  const returnLabel = isInnovationPage ? 'RETURN TO INNOVATION HUB' : 'RETURN TO FSD UNIVERSE';
  const modules = page.modules.map((moduleTitle, index) =>
    renderPageModule(page, moduleTitle, index)).join('');
  const action = page.actionHref
    ? `<a class="fsd-page-status" href="${escapeHTML(page.actionHref)}">${escapeHTML(page.action || 'VIEW INITIATIVE')}</a>`
    : page.action
      ? `<span class="fsd-page-status" aria-disabled="true">${escapeHTML(page.action)}</span>`
      : '';

  return `<section class="fsd-placeholder-page" id="${escapeHTML(page.id)}" aria-labelledby="${escapeHTML(page.id)}-title">
    <div class="fsd-page-shell">
      <header class="fsd-placeholder-page-header">
        <p class="fsd-page-eyebrow">${escapeHTML(page.eyebrow)}</p>
        <h2 id="${escapeHTML(page.id)}-title">${escapeHTML(page.title)}</h2>
        <p class="fsd-page-intro">${escapeHTML(page.summary)}</p>
        ${page.initiative ? '<span class="fsd-page-status">ACTIVE INITIATIVE · ROLLOUT UNDERWAY</span>' : ''}
      </header>
      ${renderAssetSlot(`${page.title} / Editorial`, 'hero')}
      <div class="fsd-page-module-grid">${modules}</div>
      <div class="fsd-page-actions">
        <a class="fsd-page-return" href="${returnHref}">${returnLabel} <span aria-hidden="true">↗</span></a>
        ${action}
      </div>
    </div>
  </section>`;
}

export function renderFlagshipPlaceholderPages() {
  return flagshipPageDefinitions.map(renderPage).join('');
}
