import {
  HOUSE_PAGE_REGISTRY,
  shouldDisableHouseHref,
} from '../data/house-page-readiness.js';

const DIVISIONS = Object.freeze([
  'Our Story',
  'Flagships',
  'Fight Promotions',
  'Global Vision & Operations',
  'Investor Relations',
  'Community & Culture',
]);

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function destinationMarkup(page, production) {
  const title = escapeHtml(page.title);
  const disabled = shouldDisableHouseHref(page.path, production);
  const status = page.readiness === 'NOT_READY'
    ? '<span class="house-destination-index__status">NOT READY</span>'
    : '';
  const content = `<span class="house-destination-index__title">${title}</span>${status}`;

  if (disabled) {
    return `<span class="house-destination-index__link is-disabled" aria-disabled="true">${content}</span>`;
  }

  return `<a class="house-destination-index__link" href="${escapeHtml(page.path)}" data-house-destination="${escapeHtml(page.id)}">${content}</a>`;
}

export function renderHouseDestinationIndex({ production = import.meta.env?.PROD === true } = {}) {
  const groups = DIVISIONS.map((division, index) => {
    const pages = HOUSE_PAGE_REGISTRY.filter(page => page.division === division);
    if (!pages.length) return '';
    const sectionId = `house-division-${index + 1}`;
    return `<section class="house-destination-index__division" id="${sectionId}" data-house-division="${index + 1}" aria-labelledby="${sectionId}-title">
      <p class="house-destination-index__index">FSD / THE HOUSE · ${String(index + 1).padStart(2, '0')}</p>
      <h3 id="${sectionId}-title">${escapeHtml(division)}</h3>
      <ul>${pages.map(page => `<li>${destinationMarkup(page, production)}</li>`).join('')}</ul>
    </section>`;
  }).join('');

  return `<nav class="house-destination-index" aria-label="The House destinations">
    <div class="house-destination-index__grid">${groups}</div>
  </nav>`;
}
