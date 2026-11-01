import {
  SIZE_GUIDE_FIT_NOTE,
  SIZE_GUIDE_MEASURE_NOTE,
  SIZE_GUIDE_SECTIONS,
  renderSizeGuideTable,
} from './size-guide-data.js';

const root = document.querySelector('[data-size-guide-content]');
if (root) {
  root.innerHTML = `
    <p class="fsd-policy-copy">${SIZE_GUIDE_FIT_NOTE}</p>
    <p class="fsd-policy-copy">${SIZE_GUIDE_MEASURE_NOTE}</p>
    ${SIZE_GUIDE_SECTIONS.map(section => `
      <section class="fsd-policy-section" aria-labelledby="size-guide-${section.id}">
        <h2 id="size-guide-${section.id}">${section.title}</h2>
        ${renderSizeGuideTable(section)}
      </section>
    `).join('')}`;
}
