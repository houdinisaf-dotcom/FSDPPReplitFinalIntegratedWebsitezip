import { products, priceInfo } from './catalogue-data.js';
import { FSD_STORY_HASH, FSD_STORY_PATH } from './react-router.js';
import { shouldDisableHouseHref } from './data/house-page-readiness.js';
import { siteMedia } from './data/site-media.js';
import { imagePlaceholderMarkup } from './image-placeholder.js';

const featuredProductIds = [33, 34];

export const featuredProducts = products.filter(product => {
  const price = priceInfo(product);
  return featuredProductIds.includes(product.id)
    && price.value
    && !price.label;
});

export function featuredInnovationsSection() {
  return `<section class="showroom-featured" id="innovations" aria-labelledby="featured-title">
    <div data-fsd-featured-carousel-slot></div>
  </section>`;
}

export function beyondProductSection() {
  const initiatives = [
    {
      group: 'TRAIN & BELONG',
      concepts: [
        ['Tactical Shield Membership', 'PROPOSAL · REGISTRATION NOT OPEN', 'Proposal only; no membership service or registration is available.', null],
        ['Community Co-Creation', 'OPERATING OR ROLLOUT UNDERWAY', 'No workshops, trials, portal, or submission channel is open.', '/community-co-creation.html'],
        ['Community Resilience', 'OPERATING OR ROLLOUT UNDERWAY', 'No provider, venue, or training programme is confirmed.', '/community-first-aid.html'],
      ],
    },
    {
      group: 'WEAR',
      concepts: [
        ['Smart Apparel', 'OPERATING OR ROLLOUT UNDERWAY', 'No live NFC authentication, content portal, rewards, or data collection.', '#smart-apparel-nfc'],
        ['Adaptive Technical Fabrics', 'OPERATING OR ROLLOUT UNDERWAY', 'Material research only; no fabric product is represented as available.', '#adaptive-technical-fabrics'],
        ['Circular Trade-In', 'OPERATING OR ROLLOUT UNDERWAY', 'No return service, eligibility, collection, or credit terms are available.', '/circular-trade-in.html'],
      ],
    },
    {
      group: 'BUILT CLOSER',
      concepts: [
        ['Autonomous Pop-Ups & Predictive Stock', 'OPERATING OR ROLLOUT UNDERWAY', 'No venue, stock service, click-and-collect, or location availability is live.', '/autonomous-popups.html'],
        ['FSD Pods', 'OPERATING OR ROLLOUT UNDERWAY', 'No Pod, site, or service is operational.', '/fsd-pods.html'],
        ['Mobile Testing Labs', 'OPERATING OR ROLLOUT UNDERWAY', 'No unit, venue, test, or data collection is live.', '/mobile-testing-labs.html'],
        ['Local Micro-Manufacturing', 'OPERATING OR ROLLOUT UNDERWAY', 'No hub, production site, partner, or custom service is live.', '/local-micro-manufacturing.html'],
      ],
    },
    {
      group: 'TOGETHER & TOMORROW',
      concepts: [
        ['Performance-Linked Partnerships', 'OPERATING OR ROLLOUT UNDERWAY', 'No specific partner, live testing programme, or connected enquiry channel is represented.', '/performance-partnerships.html'],
        ['Genetic & Microbiome Personalisation', 'OPERATING OR ROLLOUT UNDERWAY · RESEARCH ONLY', 'No testing, sample collection, analysis, or personalised health guidance is available.', '/genetic-microbiome.html'],
      ],
    },
  ];

  const groupsMarkup = initiatives.map(({ group, concepts }, index) => {
    const conceptsMarkup = concepts.map(([title, status, boundary, href]) => {
      const content = `<strong>${title}</strong><span>${status}</span><small>${boundary}</small><b aria-hidden="true">↗</b>`;
      const card = href
        ? `<a href="${href}">${content}</a>`
        : `<button class="showroom-concepts__unavailable" type="button" disabled>${content}</button>`;
      return `<li>${card}</li>`;
    }).join('');
    return `<details class="showroom-concepts__group">
      <summary><span>${String(index + 1).padStart(2, '0')}</span><strong>${group}</strong><small>${String(concepts.length).padStart(2, '0')} INITIATIVES</small></summary>
      <ul>${conceptsMarkup}</ul>
    </details>`;
  }).join('');

  return `<section class="showroom-beyond" id="beyond-fsd" aria-labelledby="beyond-fsd-title">
    <div class="showroom-beyond__intro">
      <p class="section-kicker">05 / BEYOND THE PRODUCT</p>
      <h2 id="beyond-fsd-title">Explore the<br/><em>FSD universe.</em></h2>
      <p>Four connected directions across practice, apparel, community, and the systems around them. Each initiative is distinct from a currently available product or service.</p>
      <a class="showroom-beyond__hub" href="#innovation-hub">EXPLORE THE INNOVATION HUB <span aria-hidden="true">↗</span></a>
    </div>
    <div class="showroom-concepts" aria-label="FSD initiative groups">${groupsMarkup}</div>
    ${garmentStudiesSection()}
  </section>`;
}

export const garmentStudyDefinitions = [
  {
    id: 'leggings',
    title: 'Performance Leggings',
    note: 'A study in movement, fit, and technical fabric.',
    destination: '#adaptive-technical-fabrics',
  },
  {
    id: 'tank',
    title: 'Technical Tank',
    note: 'A study in training layers and connected apparel.',
    destination: '#smart-apparel-nfc',
  },
  {
    id: 'jacket',
    title: 'Run Jacket',
    note: 'A study in protection, mobility, and material response.',
    destination: '#adaptive-technical-fabrics',
  },
];

function garmentImageMarkup(garment) {
  const media = siteMedia.garmentStudies[garment.id];
  if (!media?.src) {
    return imagePlaceholderMarkup({
      title: garment.title,
      variantLabel: 'GARMENT STUDY · NOT FOR SALE',
      kind: 'detail',
      className: 'showroom-garment-study__placeholder',
    });
  }
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
  return `<img class="showroom-garment-study__image" src="${escape(media.src)}" alt="${escape(media.alt || garment.title)}"
    data-fsd-image-fallback="true" data-fsd-image-title="${escape(garment.title)}" data-fsd-image-kind="detail"
    loading="lazy" decoding="async"/>`;
}

function garmentIcon(id) {
  const paths = {
    leggings: '<path d="M8 3h16l2 25-8 1-2-15-2 15-8-1Z"/><path d="M8 7h16"/>',
    tank: '<path d="M10 3h4c0 7 4 7 4 0h4l5 9-4 2v15H9V14l-4-2Z"/>',
    jacket: '<path d="m11 3 5 3 5-3 4 4 5 15-6 2-2-10v15H10V14L8 24l-6-2L7 7Z"/><path d="M16 6v23m-5-26 5-2 5 2"/>',
  };
  return `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" aria-hidden="true">${paths[id]}</svg>`;
}

export function garmentStudiesSection() {
  const selected = garmentStudyDefinitions[0];
  return `<section class="showroom-garment-study" aria-labelledby="garment-study-title" data-garment-studies>
    <div class="showroom-garment-study__heading">
      <p class="section-kicker">GARMENT STUDIES / 01—03</p>
      <h3 id="garment-study-title">Ideas in <em>motion.</em></h3>
      <p>Three considered studies, not purchasable or customisable garments.</p>
    </div>
    <div class="showroom-garment-study__body">
      <div class="showroom-garment-study__preview" data-garment-preview aria-live="polite">
        ${garmentImageMarkup(selected)}
        <span class="showroom-garment-study__preview-label">FSD / CONCEPT STUDY</span>
      </div>
      <div class="showroom-garment-study__selection">
        <div class="showroom-garment-study__choices" role="group" aria-label="Select a garment study">
          ${garmentStudyDefinitions.map((garment, index) => `<button type="button" class="showroom-garment-study__choice" data-garment-choice="${garment.id}" aria-pressed="${index === 0}">
            <span class="showroom-garment-study__symbol">${garmentIcon(garment.id)}</span><strong>${garment.title}</strong><b aria-hidden="true">↗</b>
          </button>`).join('')}
        </div>
        <div class="showroom-garment-study__detail" data-garment-detail>
          <span>GARMENT STUDY · NOT FOR SALE</span>
          <h4 data-garment-title>${selected.title}</h4>
          <p data-garment-note>${selected.note}</p>
          <a href="${selected.destination}" data-garment-destination>RELATED MATERIAL RESEARCH <b aria-hidden="true">↗</b></a>
        </div>
      </div>
    </div>
  </section>`;
}

export function mountGarmentStudies(root = document) {
  root.querySelectorAll('[data-garment-studies]').forEach(section => {
    const choices = [...section.querySelectorAll('[data-garment-choice]')];
    const preview = section.querySelector('[data-garment-preview]');
    const title = section.querySelector('[data-garment-title]');
    const note = section.querySelector('[data-garment-note]');
    const destination = section.querySelector('[data-garment-destination]');
    choices.forEach(choice => choice.addEventListener('click', () => {
      const garment = garmentStudyDefinitions.find(item => item.id === choice.dataset.garmentChoice);
      if (!garment) return;
      choices.forEach(button => button.setAttribute('aria-pressed', String(button === choice)));
      preview.innerHTML = `${garmentImageMarkup(garment)}<span class="showroom-garment-study__preview-label">FSD / CONCEPT STUDY</span>`;
      title.textContent = garment.title;
      note.textContent = garment.note;
      destination.href = garment.destination;
    }));
  });
}

export function houseConnectionSection() {
  const storyLink = shouldDisableHouseHref(FSD_STORY_PATH)
    ? '<a aria-disabled="true" tabindex="-1">DISCOVER THE HOUSE <span aria-hidden="true">↗</span></a>'
    : `<a href="${FSD_STORY_PATH}">DISCOVER THE HOUSE <span aria-hidden="true">↗</span></a>`;

  return `<section class="showroom-house-connection" id="brand-community" aria-labelledby="brand-community-title">
    <div class="showroom-house-connection__statement">
      <p class="section-kicker">06 / COMMUNITY &amp; BRAND</p>
      <h2 id="brand-community-title">Train. Wear. Belong.<br/><em>Be Stronger Together.</em></h2>
    </div>
    <div class="showroom-house-connection__copy">
      <p>A wider FSD vision for performance, apparel and equipment, personal-safety skills, community, and future product research.</p>
      ${storyLink}
    </div>
    <span class="showroom-house-connection__mark" aria-hidden="true">FSD <i>/</i> FITNESS &amp; SELF-DEFENCE</span>
  </section>`;
}

export function vipAccessSection() {
  return `<section class="showroom-vip" id="contact" aria-labelledby="vip-title">
    <p class="section-kicker">VIP ACCESS</p><h2 id="vip-title">BE PART OF<br/><em>WHAT COMES NEXT.</em></h2>
    <p>Discover FSD collections, innovation and exclusive brand announcements.</p>
    <button class="primary-btn" type="button" disabled aria-describedby="vip-status">REQUEST VIP ACCESS <span aria-hidden="true">↗</span></button>
    <p class="showroom-vip-status" id="vip-status">Registration is not collecting sign-ups yet. It will open once the sign-up destination and approved privacy and consent details are ready.</p>
  </section>`;
}

export function initCatalogueNavigation() {
  const reveal = hash => {
    if (!hash?.startsWith('#')) return null;
    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return null;
    for (let parent = target.parentElement; parent; parent = parent.parentElement) {
      if (parent instanceof HTMLDetailsElement) parent.open = true;
    }
    return target;
  };
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (link) reveal(link.getAttribute('href'));
  });
  window.addEventListener('hashchange', () => reveal(window.location.hash));
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
  const initialHash = window.location.hash || (pathname === FSD_STORY_PATH ? FSD_STORY_HASH : '');
  const initialTarget = reveal(initialHash);
  if (initialTarget) {
    requestAnimationFrame(() => {
      if (initialTarget.isConnected) {
        initialTarget.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    });
  }
}
