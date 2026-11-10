// General body-measurement guidance for the size guide drawer.
//
// These are standard UK high-street body measurements, published as general
// guidance only. They describe the wearer, not the garment. Garment
// measurements for each FSD product are confirmed with the manufacturer
// before the product goes on sale, and the drawer says so in plain words.

export const SIZE_FINDER_DISCLAIMER =
  'General UK body-measurement guidance. Garment measurements for this product are confirmed with the manufacturer before sale.';

export const WOMENS_BODY_GUIDE = Object.freeze({
  id: 'womens',
  title: 'Women’s',
  measurements: ['Bust', 'Waist', 'Hip'],
  rows: Object.freeze([
    { size: 'XS', uk: '6', values: { Bust: 78, Waist: 60, Hip: 86 } },
    { size: 'S', uk: '8', values: { Bust: 82, Waist: 64, Hip: 90 } },
    { size: 'M', uk: '10', values: { Bust: 86, Waist: 68, Hip: 94 } },
    { size: 'L', uk: '12', values: { Bust: 91, Waist: 73, Hip: 99 } },
    { size: 'XL', uk: '14', values: { Bust: 96, Waist: 78, Hip: 104 } },
    { size: 'XXL', uk: '16', values: { Bust: 101, Waist: 83, Hip: 109 } },
  ]),
});

export const MENS_BODY_GUIDE = Object.freeze({
  id: 'mens',
  title: 'Men’s',
  measurements: ['Chest', 'Waist'],
  rows: Object.freeze([
    { size: 'XS', uk: '34', values: { Chest: 86, Waist: 71 } },
    { size: 'S', uk: '36–38', values: { Chest: 94, Waist: 79 } },
    { size: 'M', uk: '39–40', values: { Chest: 100, Waist: 85 } },
    { size: 'L', uk: '41–43', values: { Chest: 106, Waist: 91 } },
    { size: 'XL', uk: '44–45', values: { Chest: 112, Waist: 98 } },
    { size: 'XXL', uk: '46–48', values: { Chest: 118, Waist: 106 } },
  ]),
});

const CM_PER_INCH = 2.54;
const LETTER_SIZES = new Set(['XS', 'S', 'M', 'L', 'XL', 'XXL']);

const escapeHtml = value => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

/** Which general guide applies to a product, limited to its own listed sizes. */
export function bodyGuideForProduct(product, sizes = []) {
  const listed = sizes.map(size => String(size).trim().toUpperCase()).filter(Boolean);
  if (!listed.length || !listed.every(size => LETTER_SIZES.has(size))) return null;
  const audience = `${product?.audience || ''} ${product?.category || ''} ${product?.name || ''}`.toLowerCase();
  const base = /women|hijab|modest|legging|bra\b/.test(audience) ? WOMENS_BODY_GUIDE : MENS_BODY_GUIDE;
  const rows = base.rows.filter(row => listed.includes(row.size));
  return rows.length ? { ...base, rows } : null;
}

export function toCentimetres(value, unit) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return null;
  return unit === 'in' ? number * CM_PER_INCH : number;
}

export function formatMeasurement(cm, unit) {
  return unit === 'in' ? `${(cm / CM_PER_INCH).toFixed(1)}` : `${Math.round(cm)}`;
}

/**
 * Recommend the smallest listed size whose body measurements cover every
 * value the visitor entered. Returns null if nothing usable was entered.
 */
export function recommendSize(guide, entered = {}, unit = 'cm') {
  if (!guide) return null;
  const values = guide.measurements
    .map(name => [name, toCentimetres(entered[name], unit)])
    .filter(([, cm]) => cm !== null);
  if (!values.length) return null;
  // A measurement belongs to a size when it is no more than ~2 cm above that size's value.
  const tolerance = 2;
  let index = 0;
  for (const [name, cm] of values) {
    let fit = guide.rows.findIndex(row => cm <= row.values[name] + tolerance);
    if (fit < 0) fit = guide.rows.length;
    index = Math.max(index, fit);
  }
  if (index >= guide.rows.length) {
    return { size: null, outOfRange: 'above', basis: values.map(([name]) => name) };
  }
  const row = guide.rows[index];
  const below = values.every(([name, cm]) => cm < guide.rows[0].values[name] - 6);
  return { size: row.size, uk: row.uk, outOfRange: below ? 'below' : '', basis: values.map(([name]) => name) };
}

function renderChart(guide, unit) {
  return `<div class="size-finder__chart" data-size-finder-chart>
    <table>
      <caption>Body measurements in ${unit === 'in' ? 'inches' : 'centimetres'}</caption>
      <thead><tr><th scope="col">Size</th><th scope="col">UK</th>${guide.measurements.map(name => `<th scope="col">${escapeHtml(name)}</th>`).join('')}</tr></thead>
      <tbody>${guide.rows.map(row => `<tr data-size-row="${escapeHtml(row.size)}"><th scope="row">${escapeHtml(row.size)}</th><td>${escapeHtml(row.uk)}</td>${guide.measurements.map(name => `<td>${formatMeasurement(row.values[name], unit)}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
  </div>`;
}

export function renderSizeFinder(product, guide, unit = 'cm') {
  const ukLabel = guide.id === 'womens' ? 'Your usual UK dress size' : 'Your usual UK chest size';
  return `<section class="size-finder" data-size-finder data-guide="${guide.id}" data-unit="${unit}" aria-labelledby="size-finder-title">
    <div class="size-finder__intro">
      <h3 id="size-finder-title">Find your size</h3>
      <p>Enter one or more measurements, or pick the UK size you usually wear.</p>
    </div>
    <div class="size-finder__units" role="radiogroup" aria-label="Units">
      <label><input type="radio" name="size-finder-unit" value="cm" data-size-finder-unit ${unit === 'cm' ? 'checked' : ''}><span>cm</span></label>
      <label><input type="radio" name="size-finder-unit" value="in" data-size-finder-unit ${unit === 'in' ? 'checked' : ''}><span>inches</span></label>
    </div>
    <div class="size-finder__fields">
      ${guide.measurements.map(name => `<label class="size-finder__field">
        <span>${escapeHtml(name)}</span>
        <input type="number" inputmode="decimal" min="0" step="0.5" data-size-finder-input="${escapeHtml(name)}"
          placeholder="${unit === 'in' ? 'in' : 'cm'}" aria-label="${escapeHtml(name)} in ${unit === 'in' ? 'inches' : 'centimetres'}">
      </label>`).join('')}
    </div>
    <label class="size-finder__field size-finder__field--select">
      <span>${ukLabel}</span>
      <select data-size-finder-uk>
        <option value="">Choose</option>
        ${guide.rows.map(row => `<option value="${escapeHtml(row.size)}">UK ${escapeHtml(row.uk)} (${escapeHtml(row.size)})</option>`).join('')}
      </select>
    </label>
    <div class="size-finder__result" data-size-finder-result role="status" aria-live="polite">
      <span>Your recommended size will appear here.</span>
    </div>
    ${renderChart(guide, unit)}
    <details class="size-finder__how">
      <summary>How to measure</summary>
      <ul>
        ${guide.id === 'womens'
          ? '<li><strong>Bust:</strong> around the fullest part of the chest, keeping the tape level.</li>'
          : '<li><strong>Chest:</strong> around the fullest part of the chest, under the arms.</li>'}
        <li><strong>Waist:</strong> around the narrowest part of the natural waist.</li>
        ${guide.measurements.includes('Hip') ? '<li><strong>Hip:</strong> around the fullest part of the hips, feet together.</li>' : ''}
        <li>Measure over light clothing and keep the tape snug, not tight. Between sizes, choose the larger for a relaxed fit.</li>
      </ul>
    </details>
    <p class="size-finder__note">${escapeHtml(SIZE_FINDER_DISCLAIMER)}</p>
  </section>`;
}

/** Wire up a rendered size finder inside `root`. Returns a cleanup function. */
export function bindSizeFinder(root, guide) {
  const finder = root?.querySelector?.('[data-size-finder]');
  if (!finder || !guide) return () => {};
  let unit = finder.dataset.unit || 'cm';
  const result = finder.querySelector('[data-size-finder-result]');
  const highlight = size => {
    for (const row of finder.querySelectorAll('[data-size-row]')) {
      row.classList.toggle('is-recommended', row.dataset.sizeRow === size);
    }
  };
  const show = (html, size = '') => {
    result.innerHTML = html;
    result.classList.toggle('has-result', Boolean(size));
    highlight(size);
  };
  const update = source => {
    const select = finder.querySelector('[data-size-finder-uk]');
    if (source !== 'measure' && select.value) {
      for (const input of finder.querySelectorAll('[data-size-finder-input]')) input.value = '';
      const row = guide.rows.find(entry => entry.size === select.value);
      show(`<small>Recommended size</small><strong>${escapeHtml(row.size)}</strong><span>Based on your usual UK ${escapeHtml(row.uk)}.</span>`, row.size);
      return;
    }
    if (source === 'measure') select.value = '';
    const entered = {};
    for (const input of finder.querySelectorAll('[data-size-finder-input]')) entered[input.dataset.sizeFinderInput] = input.value;
    const recommendation = recommendSize(guide, entered, unit);
    if (!recommendation) {
      show('<span>Your recommended size will appear here.</span>');
    } else if (!recommendation.size) {
      show('<span>Your measurements are above this product’s listed range. Contact us before ordering and we will check the garment measurements for you.</span>');
    } else {
      const extra = recommendation.outOfRange === 'below' ? ' Your measurements are below the smallest listed size, so this may fit loosely.' : '';
      show(`<small>Recommended size</small><strong>${escapeHtml(recommendation.size)}</strong><span>UK ${escapeHtml(recommendation.uk)}, based on ${escapeHtml(recommendation.basis.join(', ').toLowerCase())}.${escapeHtml(extra)}</span>`, recommendation.size);
    }
  };
  const onInput = event => {
    if (event.target.matches('[data-size-finder-input]')) update('measure');
    if (event.target.matches('[data-size-finder-uk]')) update('uk');
  };
  const onChange = event => {
    if (!event.target.matches('[data-size-finder-unit]')) return onInput(event);
    const next = event.target.value === 'in' ? 'in' : 'cm';
    if (next === unit) return undefined;
    for (const input of finder.querySelectorAll('[data-size-finder-input]')) {
      const cm = toCentimetres(input.value, unit);
      input.value = cm === null ? '' : formatMeasurement(cm, next);
      input.placeholder = next;
      input.setAttribute('aria-label', `${input.dataset.sizeFinderInput} in ${next === 'in' ? 'inches' : 'centimetres'}`);
    }
    unit = next;
    finder.dataset.unit = unit;
    const chart = finder.querySelector('[data-size-finder-chart]');
    chart.outerHTML = renderChart(guide, unit);
    update('unit');
    return undefined;
  };
  finder.addEventListener('input', onInput);
  finder.addEventListener('change', onChange);
  return () => {
    finder.removeEventListener('input', onInput);
    finder.removeEventListener('change', onChange);
  };
}
