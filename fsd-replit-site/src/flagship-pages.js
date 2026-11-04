import { alightPreviewPath } from './alight-preview-path.js';
import { motionPreviewPath } from './motion-preview-path.js';
import { nexusPreviewPath } from './nexus-preview-path.js';
import { siteMedia } from './data/site-media.js';

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
    summary: 'Active Bio-Lab initiative exploring NFC garment authentication, product information, and digital content.',
    modules: ['Garment authentication', 'Care, sizing & digital content', 'Privacy, security & manufacturing gates'],
    initiative: true,
    houseRoute: 'bio-lab/smart-apparel',
    action: 'VIEW SMART APPAREL INITIATIVE',
    actionHref: '#smart-apparel-nfc',
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
    eyebrow: 'FSD / THE HOUSE · TACTICAL SHIELD MEMBERSHIP',
    heroSubtitle: 'Practical skills. Greater confidence. Stronger communities.',
    summary: 'A proposed membership combining personal-safety education, practical training, online learning, and member support. Terms, benefits, service scope, and access details are not confirmed; registration is not open and this page collects no sign-up data.',
    action: 'REGISTRATION NOT OPEN',
  },
  {
    id: 'fsd-pods',
    title: 'FSD Pods',
    eyebrow: 'FSD / GLOBAL VISION & OPERATIONS',
    heroSubtitle: 'Low-footprint modular training, retail, and community infrastructure.',
    summary: 'Active infrastructure initiative exploring transportable spaces for training, limited apparel display, product testing, and community education. No Pod or site is live.',
    modules: ['Training & Product Testing', 'Limited Apparel Display', 'Community Education', 'Site, Safety & Operating Model'],
    action: 'VIEW GLOBAL VISION & OPERATIONS',
    actionHref: '/fsd-pods.html',
    initiative: true,
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
    eyebrow: page.initiative
      ? 'FSD BIO-LAB™ / ACTIVE INITIATIVE'
      : 'FSD BIO-LAB™ / PRODUCT RANGE',
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

function renderAssetSlot(title, variant = 'editorial', description = 'FSD product and editorial imagery.') {
  const image = siteMedia.pageMedia[title];
  if (image?.src) {
    return `<figure class="fsd-asset-slot fsd-asset-slot--${variant}" aria-label="${escapeHTML(title)}">
      <img src="${escapeHTML(image.src)}" alt="${escapeHTML(image.alt || title)}"
        data-fsd-image-fallback="true" data-fsd-image-title="${escapeHTML(title)}" data-fsd-image-kind="banner"
        loading="lazy" decoding="async"/>
    </figure>`;
  }
  return `<figure class="fsd-asset-slot fsd-asset-slot--${variant} fsd-image-placeholder fsd-image-placeholder--banner" aria-label="Visual placeholder for ${escapeHTML(title)}">
    <div class="fsd-asset-slot-content">
      <span class="fsd-asset-slot-kicker">FSD / PERFORMANCE</span>
      <strong>${escapeHTML(title)}</strong>
      <small>${escapeHTML(description)}</small>
      <small class="fsd-image-placeholder__note">Image to be added</small>
    </div>
  </figure>`;
}

const tacticalShieldPillars = [
  {
    title: 'Online Learning',
    description: 'Access practical personal-safety education, situational-awareness guidance, and training resources through a dedicated member area.',
  },
  {
    title: 'Practical Training',
    description: 'Proposed in-person and online sessions with qualified instructors, focused on real-world skills and confidence in everyday situations.',
  },
  {
    title: 'Member Support',
    description: 'A proposed community environment with peer support, expert guidance, and ongoing practical advice to help build confidence and resilience.',
  },
  {
    title: 'Real-World Relevance',
    description: 'Practical guidance for daily life, travel, work, and university, designed to support greater awareness and personal safety.',
  },
];

const tacticalShieldValuePillars = [
  'Recurring Membership Revenue',
  'Stronger Customer Loyalty',
  'Community Engagement',
  'Enhanced Brand Credibility',
];

const tacticalShieldProgressionConditions = [
  'Qualified Providers & Instructors',
  'Safeguarding Arrangements',
  'Legal Scope & Insurance Cover',
  'Clear Customer Terms & Boundaries',
];

function renderTacticalShieldContent() {
  const membershipCards = tacticalShieldPillars.map(pillar => `<article class="fsd-shield-card">
    <h4>${escapeHTML(pillar.title)}</h4>
    <p>${escapeHTML(pillar.description)}</p>
  </article>`).join('');
  const valueCards = tacticalShieldValuePillars.map(value =>
    `<li class="fsd-shield-badge">${escapeHTML(value)}</li>`).join('');
  const conditionCards = tacticalShieldProgressionConditions.map(condition =>
    `<li class="fsd-shield-badge">${escapeHTML(condition)}</li>`).join('');

  return `<div class="fsd-shield-content">
    <section class="fsd-shield-section" aria-labelledby="tactical-shield-framework-title">
      <p class="fsd-shield-kicker">01 / THE CORE FRAMEWORK</p>
      <h3 id="tactical-shield-framework-title">Practical readiness through structured learning</h3>
      <p>The proposal is built upon the belief that safety and capability stem from structured discipline, situational awareness, and accessible training. It describes mental and physical tools to support everyday readiness, without guaranteeing personal safety or protection.</p>
      <p>Designed for individuals seeking personal development and community security awareness, the proposed platform would connect digital learning resources with physical, instructor-led environments, subject to confirmed providers and safeguards.</p>
    </section>

    <section class="fsd-shield-section" aria-labelledby="tactical-shield-pillars-title">
      <p class="fsd-shield-kicker">02 / MEMBERSHIP PILLARS &amp; ARCHITECTURE</p>
      <h3 id="tactical-shield-pillars-title">Four proposed areas of support</h3>
      <div class="fsd-shield-card-grid">${membershipCards}</div>
    </section>

    <div class="fsd-shield-visual-grid" aria-label="Illustrative image placeholders">
      ${renderAssetSlot('Digital platform interface', 'detail', 'Illustrative portal mock-up only; no live member area is available.')}
      ${renderAssetSlot('Practical training scene', 'detail', 'Illustrative training imagery only; no class or provider is confirmed.')}
    </div>

    <section class="fsd-shield-section" aria-labelledby="tactical-shield-value-title">
      <p class="fsd-shield-kicker">03 / POTENTIAL STRATEGIC VALUE</p>
      <h3 id="tactical-shield-value-title">Possible value if the membership progresses</h3>
      <ul class="fsd-shield-badge-grid">${valueCards}</ul>
    </section>

    <section class="fsd-shield-section" aria-labelledby="tactical-shield-conditions-title">
      <p class="fsd-shield-kicker">04 / CONDITIONS BEFORE PROGRESSION</p>
      <h3 id="tactical-shield-conditions-title">Requirements before any launch</h3>
      <p>These requirements are not represented as complete. Providers, governance, insurance, and customer terms must be confirmed before services or registration are offered.</p>
      <ul class="fsd-shield-badge-grid">${conditionCards}</ul>
    </section>

    <aside class="fsd-shield-notice" aria-label="Membership proposal status">
      <p class="fsd-shield-kicker">PROPOSAL STATUS</p>
      <p><strong>Proposal notice:</strong> This is a proposal for exploration, not a current product or commitment. Operational rollout, instructor accreditation, and service availability are subject to formal legal review, governance structuring, and insurance validation.</p>
      <p>Terms, benefits, providers, and access details are unconfirmed. Registration is not open, and this page collects no sign-up data.</p>
    </aside>
    <footer class="fsd-shield-footer">FSD · Fitness &amp; Self-Defence Ecosystem</footer>
  </div>`;
}

export function renderInnovationHubIndex({ includePrivatePreviews = false } = {}) {
  const conceptLinks = innovationHubPages.map(page => `<a class="fsd-innovation-card" href="#${escapeHTML(page.id)}">
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
          <p class="fsd-page-intro fsd-page-disclaimer">Initiative workstreams may be underway; related concepts and design prototypes are for exploration, not current products or commitments.</p>
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
  const isTacticalShieldPage = page.id === 'tactical-shield-membership';
  const returnHref = isInnovationPage ? '#innovation-hub' : '#universe';
  const returnLabel = isInnovationPage ? 'RETURN TO INNOVATION HUB' : 'RETURN TO FSD UNIVERSE';
  const modules = (page.modules || []).map((moduleTitle, index) =>
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
        ${page.heroSubtitle ? `<p class="fsd-page-subtitle">${escapeHTML(page.heroSubtitle)}</p>` : ''}
        <p class="fsd-page-intro">${escapeHTML(page.summary)}</p>
        ${page.initiative ? '<span class="fsd-page-status">ACTIVE INITIATIVE · ROLLOUT UNDERWAY</span>' : ''}
        ${page.initiative ? '<p class="fsd-page-intro fsd-page-disclaimer">Related concepts and design prototypes are for exploration, not current products or commitments.</p>' : ''}
      </header>
      ${renderAssetSlot(
    `${page.title} / Editorial`,
    'hero',
    isTacticalShieldPage
      ? 'Illustrative hero placeholder; no current membership service is represented.'
      : undefined,
  )}
      ${isTacticalShieldPage
    ? renderTacticalShieldContent()
    : `<div class="fsd-page-module-grid">${modules}</div>`}
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

export function renderBioLabPlaceholderPages() {
  return innovationHubPages.map(renderPage).join('');
}
