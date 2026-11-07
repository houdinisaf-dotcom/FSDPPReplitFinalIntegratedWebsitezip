import strategicConceptData from './data/strategic-concepts.json' with { type: 'json' };

export const STRATEGIC_CONCEPTS = Object.freeze(strategicConceptData.concepts);
export const STRATEGIC_CONCEPT_STATUS = strategicConceptData.statusPolicy;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

export function conceptItem(concept, { id = `strategic-concept-${concept.id}` } = {}) {
  return {
    id,
    title: concept.title,
    kind: 'initiative',
    href: concept.href,
    status: 'Strategic concept',
    description: `${concept.summary} No product or service is represented as live or available.`,
  };
}

export function conceptsForPlacement(division, section) {
  return STRATEGIC_CONCEPTS.filter(concept =>
    (concept.primaryDivision === division && concept.primarySection === section)
    || concept.crossLinks.some(link => link.division === division && link.section === section));
}

export function renderStrategicConceptIndex() {
  const cards = STRATEGIC_CONCEPTS.map((concept, index) => `<a class="fsd-innovation-card" href="${escapeHtml(concept.href)}" data-strategic-concept="${escapeHtml(concept.id)}">
    <span class="fsd-innovation-card-index">${String(index + 1).padStart(2, '0')}</span>
    <span class="fsd-innovation-card-copy">
      <strong>${escapeHtml(concept.title)}</strong>
      <small>${escapeHtml(concept.primaryDivision)} / ${escapeHtml(concept.primarySection)}</small>
      ${concept.crossLinks.map(link => `<small class="fsd-innovation-card-crosslink">Also in: ${escapeHtml(link.division)} / ${escapeHtml(link.section)}</small>`).join('')}
      <small>${escapeHtml(concept.summary)}</small>
    </span>
    <span class="fsd-innovation-card-arrow" aria-hidden="true">↗</span>
  </a>`).join('');

  return `<section class="fsd-innovation-hub fsd-strategic-concept-index" aria-labelledby="fsd-strategic-concepts-title">
    <div class="fsd-page-shell">
      <p class="fsd-page-eyebrow">FSD / STRATEGIC CONCEPTS</p>
      <div class="fsd-hub-heading">
        <div>
          <h2 id="fsd-strategic-concepts-title">Twelve concepts. One connected FSD.</h2>
          <p>Each concept has a defined place in the six-division website architecture and links to its detailed framework.</p>
          <p class="fsd-page-intro fsd-page-disclaimer">${escapeHtml(STRATEGIC_CONCEPT_STATUS)}</p>
        </div>
      </div>
      <nav class="fsd-innovation-grid" aria-label="Twelve FSD strategic concepts">${cards}</nav>
    </div>
  </section>`;
}
