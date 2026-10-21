const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

function chartSize() {
  const viewport = typeof window === 'undefined' ? 1440 : window.innerWidth;
  const width = viewport <= 650 ? Math.max(260, viewport - 58)
    : Math.max(300, Math.min(680, (viewport - 140) / 2));
  return {
    width, left: Math.max(44, width * .071), right: Math.max(38, width * .085),
    top: 20, bottom: 38, height: 228, font: 12,
  };
}

function validatedPoints(points) {
  return points.map((point, index) => {
    if (!point || typeof point.timestamp !== 'number' || !Number.isFinite(point.timestamp)) {
      throw new TypeError(`Chart point ${index + 1} has no valid numeric timestamp.`);
    }
    const value = point.value;
    if (value !== null && (typeof value !== 'number' || !Number.isFinite(value))) {
      throw new TypeError(`Chart point ${index + 1} has a non-finite value.`);
    }
    return { ...point, value, index };
  }).sort((a, b) => a.timestamp - b.timestamp);
}

function runSegments(points) {
  const segments = [];
  let run = [];
  points.forEach(point => {
    if (point.value === null) {
      if (run.length) segments.push(run);
      run = [];
    } else run.push(point);
  });
  if (run.length) segments.push(run);
  return segments;
}

function pointMarkup(point, index, x, y, unit) {
  const label = point.label || point.date || '';
  return `<circle class="bl-chart-point" cx="${x}" cy="${y}" r="12" data-chart-point
    data-index="${index}" data-value="${esc(point.value)}" data-label="${esc(label)}" data-unit="${esc(unit)}"
    tabindex="${point.pointTabIndex === 0 ? '0' : '-1'}" role="button"
    aria-label="${esc(label)}, ${esc(point.value)} ${esc(unit)}" />
    <circle class="bl-chart-point-visual" cx="${x}" cy="${y}" r="3.5" aria-hidden="true"/>`;
}

export function renderChart({
  title, description, points = [], kind = 'line', unit = 'min', min = 0, max: maxValue,
  format = value => String(value), analysisIndex = '01',
}) {
  const data = validatedPoints(points);
  const plotted = data.filter(point => point.value !== null);
  const { width: w, left, right, top, bottom, height: h, font } = chartSize();
  const plotW = w - left - right, plotH = h - top - bottom;
  const gaps = data.slice(1).map((point, index) => point.timestamp - data[index].timestamp).filter(gap => gap > 0).sort((a, b) => a - b);
  const medianGap = gaps.length ? gaps[Math.floor(gaps.length / 2)] : 86_400_000;
  const firstTime = data.length ? data[0].timestamp - medianGap / 2 : 0;
  const lastTime = data.length ? data[data.length - 1].timestamp + medianGap / 2 : 1;
  const timeSpan = Math.max(1, lastTime - firstTime);
  const yMin = Number(min);
  if (!Number.isFinite(yMin)) throw new TypeError('Chart minimum must be finite.');
  const inferredMax = Math.max(1, ...plotted.map(point => point.value));
  const yMax = maxValue === undefined ? inferredMax : Number(maxValue);
  if (!Number.isFinite(yMax) || yMax <= yMin) throw new TypeError('Chart maximum must be finite and greater than its minimum.');
  if (plotted.some(point => point.value < yMin || point.value > yMax)) {
    throw new RangeError('Chart data exceeds its declared scale.');
  }
  const ySpan = yMax - yMin;
  const xy = data.map(point => ({
    ...point,
    x: left + ((point.timestamp - firstTime) / timeSpan) * plotW,
    y: point.value === null ? null : top + plotH - ((point.value - yMin) / ySpan) * plotH,
  }));
  let pointTabIndex = 0;
  xy.forEach(point => {
    if (point.value !== null) point.pointTabIndex = pointTabIndex++;
  });
  const baselineY = top + plotH - ((0 - yMin) / ySpan) * plotH;
  const bars = kind === 'bar' ? xy.filter(point => point.value !== null).map((point, index, all) => {
    const before = index ? point.x - all[index - 1].x : (all[1]?.x - point.x);
    const after = index < all.length - 1 ? all[index + 1].x - point.x : before;
    const slot = Math.min(before || plotW, after || plotW);
    const barWidth = Math.max(5, Math.min(38, slot * .56));
    const height = Math.max(0, baselineY - point.y);
    return `<g class="bl-chart-mark">
      <rect class="bl-chart-bar${point.partial ? ' is-partial' : ''}" x="${point.x - barWidth / 2}" y="${point.y}" width="${barWidth}" height="${height}" rx="2"/>
      ${pointMarkup(point, index, point.x, point.y, unit)}
    </g>`;
  }).join('') : '';
  const lineSegments = runSegments(xy);
  const lines = kind === 'line' || kind === 'area'
    ? lineSegments.map(segment => {
      if (!segment.length) return '';
      const curve = segment.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
      const area = kind === 'area' && segment.length
        ? `<path class="bl-chart-area" d="${curve} L${segment.at(-1).x.toFixed(2)} ${baselineY.toFixed(2)} L${segment[0].x.toFixed(2)} ${baselineY.toFixed(2)} Z"/>`
        : '';
      return `${area}<path class="bl-chart-line" d="${curve}"/>
        ${segment.map((point, index) => `<g class="bl-chart-mark">${pointMarkup(point, index, point.x, point.y, unit)}</g>`).join('')}`;
    }).join('')
    : '';
  const ticks = [0, .5, 1].map(fraction => {
    const value = yMin + ySpan * fraction;
    const y = top + plotH * (1 - fraction);
    return `<g><line class="bl-chart-gridline" x1="${left}" y1="${y}" x2="${w - right}" y2="${y}"/>
      <text x="${left - 9}" y="${y + font * .34}" text-anchor="end">${esc(format(value))}</text></g>`;
  }).join('');
  const labelLimit = w <= 360 ? 4 : 5;
  const labelIndices = new Set(data.length <= labelLimit
    ? data.map((_, index) => index)
    : Array.from({ length: labelLimit }, (_, index) => Math.round(index * (data.length - 1) / (labelLimit - 1))));
  const labels = xy.map((point, index) => labelIndices.has(index)
    ? `<text class="bl-chart-date" x="${point.x}" y="${h - 8}" text-anchor="middle">${esc(point.shortLabel || point.label || point.date || '')}</text>`
    : '').join('');
  const axis = kind === 'bar' && baselineY < top + plotH
    ? `<line class="bl-chart-baseline" x1="${left}" y1="${baselineY}" x2="${w - right}" y2="${baselineY}"/>`
    : '';
  const empty = !plotted.length ? '<p class="bl-chart-empty">No observations in this selected range.</p>' : '';
  return `<figure class="bl-chart-card">
    <figcaption><span class="bl-chart-index">ANALYSIS / ${esc(analysisIndex)} <i>${esc(unit)}</i></span><h3>${esc(title)}</h3><p>${esc(description)}</p></figcaption>
    <div class="bl-chart-wrap" data-chart-surface>
      ${empty}
      <svg class="bl-chart" viewBox="0 0 ${w} ${h}" role="group" aria-label="${esc(title)}. ${esc(description)} Unit: ${esc(unit)}." focusable="false">
        ${ticks}${axis}${bars}${lines}${labels}
      </svg>
      <div class="bl-chart-tooltip" data-chart-tooltip role="status" aria-live="polite">Choose a plotted point to inspect its value in ${esc(unit)}.</div>
    </div>
  </figure>`;
}

export function bindCharts(root) {
  const onPoint = event => {
    const point = event.target.closest('[data-chart-point]');
    if (!point || !root.contains(point)) return;
    const surface = point.closest('[data-chart-surface]');
    const tooltip = surface?.querySelector('[data-chart-tooltip]');
    if (tooltip) tooltip.textContent = `${point.dataset.label}: ${point.dataset.value} ${point.dataset.unit}`;
  };
  const onKey = event => {
    const point = event.target.closest('[data-chart-point]');
    if (!point || !root.contains(point)) return;
    const points = [...point.closest('svg').querySelectorAll('[data-chart-point]')];
    const current = points.indexOf(point);
    let next = current;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = Math.min(points.length - 1, current + 1);
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = Math.max(0, current - 1);
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = points.length - 1;
    else return;
    event.preventDefault();
    points.forEach((item, index) => item.setAttribute('tabindex', String(index === next ? 0 : -1)));
    points[next]?.focus();
  };
  root.addEventListener('pointerover', onPoint);
  root.addEventListener('focusin', onPoint);
  root.addEventListener('click', onPoint);
  root.addEventListener('keydown', onKey);
  return () => {
    root.removeEventListener('pointerover', onPoint);
    root.removeEventListener('focusin', onPoint);
    root.removeEventListener('click', onPoint);
    root.removeEventListener('keydown', onKey);
  };
}
