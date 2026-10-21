import { renderChart, bindCharts } from './charts.js';
import { revealDemoElements } from './motion.js';

const TABS = ['overview', 'training', 'recovery', 'devices', 'insights'];
const PERIODS = [7, 30, 90];
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDuration = minutes => {
  const value = Math.max(0, Number(minutes) || 0);
  const hours = Math.floor(value / 60);
  const remainder = value % 60;
  return hours ? `${hours}h ${remainder}m` : `${remainder} min`;
};
const fmtDate = value => {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.valueOf()) ? String(value) : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(date);
};
const fmtLongDate = value => {
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(date.valueOf()) ? String(value) :
    new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
};
const dateTimestamp = value => Date.parse(`${value}T00:00:00.000Z`);
const periodText = p => `${p} DAYS`;
const signed = n => `${Number(n) > 0 ? '+' : ''}${Number(n || 0).toFixed(1)}%`;

function progressRing(value, label, suffix = '%', className = '') {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) throw new TypeError(`${label} progress must be finite.`);
  const percent = Math.max(0, Math.min(100, numeric));
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  return `<div class="bl-progress-ring ${className}" role="img" aria-label="${esc(label)}: ${esc(Math.round(numeric))}${esc(suffix)}">
    <svg viewBox="0 0 84 84" aria-hidden="true">
      <circle class="bl-ring-track" cx="42" cy="42" r="${radius}"/>
      <circle class="bl-ring-value" cx="42" cy="42" r="${radius}" stroke-dasharray="${circumference.toFixed(2)}"
        stroke-dashoffset="${(circumference * (1 - percent / 100)).toFixed(2)}" transform="rotate(-90 42 42)"/>
    </svg><span>${Math.round(numeric)}${esc(suffix)}</span>
  </div>`;
}

function profileBlock(snapshot) {
  return `<section class="bl-profile">
    <div class="bl-profile-mark" aria-hidden="true">S</div><div><span>DEMO PROFILE · FICTIONAL</span>
      <h2>${esc(snapshot.profile.name)}</h2><p>Objective · ${esc(snapshot.profile.objective)}</p></div>
    <div class="bl-profile-period"><small>OBSERVATION WINDOW</small><strong>${periodText(snapshot.period)}</strong></div>
  </section>`;
}

function metricCard(id, label, value, unit, note, index, ring = '') {
  return `<article class="bl-metric" data-bio-lab-metric="${id}" style="--bl-card-order:${index}">
    <span class="bl-metric-index">0${index + 1}</span><p>${label}</p><div class="bl-metric-value-row"><strong>${value}</strong>${ring}</div>
    <span class="bl-metric-unit">${unit}</span><small>${note}</small>
  </article>`;
}

function dataTable(title, headings, rows, caption) {
  return `<details class="bl-data-details"><summary>VIEW DATA TABLE <span>${esc(title)}</span></summary>
    <div class="bl-table-scroll"><table><caption>${esc(caption)}</caption><thead><tr>${headings.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${rows.length ? rows.map(row => `<tr>${row.map((cell, i) => i === 0
      ? `<th scope="row">${esc(cell)}</th>` : `<td>${esc(cell)}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${headings.length}">No data in this range.</td></tr>`}</tbody></table></div>
  </details>`;
}

function weeklyChart(weekly, field, unit, title, description) {
  return renderChart({
    title, description, kind: 'bar', unit, max: Math.max(1, ...weekly.map(item => item[field] || 0)),
    format: value => Math.round(value),
    points: weekly.map(item => ({
      timestamp: dateTimestamp(item.start),
      value: item[field], label: `Week ${item.start}–${item.end}${item.partial ? ` · partial observations ${item.from}–${item.to}` : ''}`,
      shortLabel: fmtDate(item.start), partial: item.partial,
    })),
    analysisIndex: title === 'Weekly activity' ? '01' : title === 'Training frequency' ? '04' : '02',
  });
}

function trainingCharts(snapshot) {
  const weekly = snapshot.weekly || [];
  const durationSeries = snapshot.period === 7
    ? (snapshot.rows || []).map(row => ({ timestamp: dateTimestamp(row.date), date: row.date, label: row.date, shortLabel: fmtDate(row.date), value: row.durationMinutes }))
    : weekly.map(item => ({ timestamp: dateTimestamp(item.start), date: item.start, label: `Week ${item.start}–${item.end}${item.partial ? ` · partial observations ${item.from}–${item.to}` : ''}`, shortLabel: fmtDate(item.start), value: item.durationMinutes }));
  const intensity = snapshot.period === 7
    ? (snapshot.rows || []).map(row => ({ timestamp: dateTimestamp(row.date), date: row.date, label: row.date, shortLabel: fmtDate(row.date), value: row.intensity }))
    : weekly.map(item => ({ timestamp: dateTimestamp(item.start), date: item.start, label: `Week ${item.start}–${item.end}${item.partial ? ` · partial observations ${item.from}–${item.to}` : ''}`, shortLabel: fmtDate(item.start), value: item.meanIntensity }));
  const duration = renderChart({
    title: 'Duration over time', description: snapshot.period === 7 ? 'Daily recorded minutes; zero-based scale.' : 'Weekly totals; partial calendar weeks are labelled.',
    points: durationSeries, kind: 'area', unit: 'min', min: 0, analysisIndex: '02',
  });
  const intensityChart = renderChart({
    title: 'Session intensity', description: 'Fictional ordinal score, 1–10. It is not a physiological measure.',
    points: intensity, kind: 'line', unit: 'score / 10', min: 1, max: 10, analysisIndex: '03',
  });
  const durationWeekly = weeklyChart(weekly, 'durationMinutes', 'min', 'Weekly activity', 'Training duration by calendar week; duration bars begin at zero. Partial weeks are marked.');
  const frequency = weeklyChart(weekly, 'sessionCount', 'sessions', 'Training frequency', 'Sessions per calendar week, shown from a zero baseline. Partial weeks are marked.');
  const durationRows = snapshot.rows.map(r => [r.date, `${r.durationMinutes} min`, r.sessionCount, r.intensity === null ? 'Not recorded' : `${r.intensity} / 10`]);
  const weeklyRows = weekly.map(item => [`${item.start}–${item.end}${item.partial ? ` · partial ${item.from}–${item.to}` : ''}`, `${item.durationMinutes} min`, item.sessionCount, item.meanIntensity === null ? '—' : Number(item.meanIntensity).toFixed(1)]);
  const sessionRows = snapshot.sessions.map(session => [session.date, session.type, `${session.durationMinutes} min`, `${session.intensity} / 10`]);
  return `<div class="bl-chart-grid">${durationWeekly}${duration}${intensityChart}${frequency}</div>
    ${dataTable('Daily observations', ['Date', 'Duration', 'Sessions', 'Fictional intensity'], durationRows, 'All daily observations in this selected range.')}
    ${dataTable('Calendar-week summaries', ['Week', 'Duration', 'Sessions', 'Mean intensity'], weeklyRows, 'Weekly summaries, including partial calendar weeks.')}
    ${dataTable('Sample session history', ['Date', 'Session type', 'Duration', 'Fictional intensity'], sessionRows, 'Every session in the selected range. Fictional records only.')}`;
}

function overview(snapshot) {
  const summary = snapshot.summary;
  return `${profileBlock(snapshot)}
    <section class="bl-metrics" aria-label="Performance summary">
      ${metricCard('duration', 'TRAINING DURATION', fmtDuration(summary.durationMinutes), 'selected range', `${summary.sessionCount} sessions recorded`, 0)}
      ${metricCard('sessions', 'SESSION COUNT', summary.sessionCount, 'sessions', `${summary.activeDays} active days`, 1)}
      ${metricCard('consistency', 'CONSISTENCY', `${Number(summary.consistencyPercent).toFixed(1)}%`, 'active days', 'Observed days with activity', 2)}
      ${metricCard('progress', 'GOAL PROGRESS', `${Number(summary.goalPercent).toFixed(1)}%`, 'of prorated sample target',
        `${summary.durationMinutes} / ${summary.goalMinutes} min · illustrative`, 3,
        progressRing(summary.goalPercent, 'Goal progress'))}
      ${metricCard('trend', 'ACTIVITY TREND', signed(summary.volumeChangePercent), 'vs previous range', `${summary.loadUnits} sample load units`, 4)}
    </section>
    <section class="bl-overview-lower"><div class="bl-overview-note"><span>PERFORMANCE / ${snapshot.period} DAY VIEW</span>
      <h3>A measured view of<br/><em>the training rhythm.</em></h3><p>Every value on this screen is generated from a deterministic sample dataset. It does not represent a connected person or validated measurement.</p>
      <a href="#bio-lab/training?period=${snapshot.period}" data-bio-lab-tab="training">EXPLORE TRAINING ANALYTICS <span aria-hidden="true">↗</span></a></div>
      <div class="bl-overview-panel"><span class="bl-section-index">A CLEARER VIEW OF THE SAMPLE</span>
        <strong>Four analytical views</strong><p>Weekly activity, daily duration, fictional intensity and session frequency.</p>
        <span>SELECTED RANGE · ${esc(snapshot.range.start)} — ${esc(snapshot.range.end)}</span></div>
    </section>`;
}

function recovery(snapshot) {
  const recovery = snapshot.recovery;
  const points = (recovery.rows || []).map(row => ({
    timestamp: dateTimestamp(row.date), date: row.date, label: row.date, shortLabel: fmtDate(row.date), value: row.indicator,
  }));
  const recoveryChart = renderChart({
    title: 'Illustrative recovery trend', description: 'Sample index from 0–100; not validated or medical advice.',
    points, kind: 'line', unit: 'illustrative points', min: 0, max: 100, analysisIndex: '01',
  });
  const rows = (recovery.rows || []).map(row => [row.date, `${row.indicator} / 100`, 'Illustrative']);
  const weeklyRows = snapshot.weekly.map(item => [
    `${item.start}–${item.end}${item.partial ? ` · partial ${item.from}–${item.to}` : ''}`,
    `${item.loadUnits} units`, item.restDays, item.sessionCount,
  ]);
  return `${profileBlock(snapshot)}<section class="bl-recovery-hero"><div><span class="bl-section-index">RECOVERY / SAMPLE VIEW</span><h2>Illustrative index</h2><p>${esc(recovery.label)} This is not a live or current readiness value.</p></div>
      ${progressRing(recovery.indicator, 'Illustrative recovery index', '/ 100', 'bl-progress-ring--recovery')}</section>
    <div class="bl-recovery-stats"><article><span>REST DAYS</span><strong>${recovery.restDays}</strong><small>in selected window</small></article>
      <article><span>HOURS SINCE LAST SAMPLE SESSION</span><strong>${recovery.restHours ?? '—'}</strong><small>gap to fixed sample time · ${esc(snapshot.asOf)} UTC</small></article>
      <article><span>TRAINING LOAD</span><strong>${recovery.loadUnits}</strong><small>sample units · not a clinical measure</small></article></div>
    <div class="bl-chart-grid">${recoveryChart}${weeklyChart(snapshot.weekly, 'loadUnits', 'units', 'Training load', 'Illustrative sample load totals, zero baseline; partial calendar weeks are identified.')}</div>
    ${dataTable('Illustrative recovery observations', ['Date', 'Indicator', 'Interpretation'], rows, 'Sample-only values. No health conclusions are represented.')}
    ${dataTable('Recovery and load week summaries', ['Week', 'Sample load', 'Rest days', 'Sessions'], weeklyRows, 'Sample weekly load and rest-day counts. No health conclusions are represented.')}`;
}

function devices(products) {
  const smart = products.filter(product => [59, 60, 61, 62, 63, 65].includes(Number(product.id)));
  return `<section class="bl-devices-intro"><span class="bl-section-index">FSD / FUTURE TECHNOLOGY CONCEPTS</span><h2>Future technology concepts.<br/><em>Not connected.</em></h2>
      <p>This concept view does not connect to hardware. No device is paired, available or represented as operational.</p></section>
    <div class="bl-device-status"><span class="bl-status-marker"></span><div><small>CONNECTION STATE</small><strong>NOT CONNECTED / CONCEPT</strong></div><span>NO DATA SOURCE</span></div>
    <h3 class="bl-subheading">SMART-TECH RECORDS <span>EXISTING CATALOGUE · PRE-LAUNCH</span></h3>
    <div class="bl-device-list">${smart.map((product, index) => `<article class="bl-device-record">
      <span class="bl-device-number">0${index + 1}</span><div><small>CONCEPT · SPECIFICATIONS UNAVAILABLE</small><h4>${esc(product.name)}</h4>
      <p>Approved imagery and product specifications are not available for this record.</p></div>
      <button type="button" data-product="${Number(product.id)}">SHOW DETAILS <span aria-hidden="true">↗</span><span class="bl-sr-only"> for ${esc(product.name)}</span></button>
    </article>`).join('')}</div>
    <p class="bl-fine-print">Existing product names only. No device imagery, capabilities, specifications, battery status or release timing is implied.</p>`;
}

function insights(snapshot) {
  const s = snapshot.summary;
  const insights = snapshot.insights || [];
  const method = snapshot.methodology || {};
  const methods = [
    ['Consistency', method.consistency], ['Weekly goal', method.goal], ['Volume change', method.volumeChange],
    ['Training load', method.load], ['Recovery', method.recovery],
  ].filter(([, text]) => text);
  return `<section class="bl-insights-heading"><span class="bl-section-index">SAMPLE-ONLY OBSERVATIONS</span><h2>Patterns, not prescriptions.</h2>
      <p>Summaries describe the deterministic demonstration dataset only. They do not recommend training, treatment or recovery actions.</p></section>
    <div class="bl-insight-list">${insights.map((item, i) => `<article class="bl-insight"><span>0${i + 1} / OBSERVATION</span><h3>${esc(item.title)}</h3><p>${esc(item.body)}</p></article>`).join('')}</div>
    <section class="bl-methodology"><span class="bl-section-index">HOW TO READ THE DEMO</span><h3>Methodology & definitions</h3>
      <dl>${methods.map(([label, text]) => `<div><dt>${esc(label)}</dt><dd>${esc(text)}</dd></div>`).join('')}
      <div><dt>Activity volume</dt><dd>${esc(s.durationMinutes)} recorded minutes and ${esc(s.sessionCount)} sessions in the selected range.</dd></div></dl>
      <p>All metrics are derived from sample-only records. Intensity uses a fictional ordinal score; load units and recovery indicators are illustrative.</p></section>`;
}

function tabContent(tab, snapshot, products) {
  if (tab === 'training') return `${profileBlock(snapshot)}${trainingCharts(snapshot)}`;
  if (tab === 'recovery') return recovery(snapshot);
  if (tab === 'devices') return devices(products);
  if (tab === 'insights') return insights(snapshot);
  return overview(snapshot);
}

export function mountDashboard(host, { route, products = [], onNavigate, onExit }) {
  let currentRoute = route;
  let snapshot = null;
  let requestId = 0;
  let provider = null;
  let unbindChartEvents = () => {};
  let stopReveals = () => {};
  let destroyed = false;
  let viewportWidth = window.innerWidth;

  function setLoading() {
    stopReveals();
    host.innerHTML = `<section class="bl-loading" aria-label="Loading demonstration data"><div class="bl-skeleton bl-skeleton-title"></div>
      <div class="bl-skeleton bl-skeleton-row"></div><div class="bl-skeleton bl-skeleton-row"></div><p>PREPARING LOCAL DEMONSTRATION DATA</p></section>`;
  }
  function renderShell() {
    if (!snapshot) return;
    stopReveals();
    const tab = currentRoute.tab;
    const tabs = TABS.map(name => `<button type="button" role="tab" data-bio-lab-tab="${name}" id="bl-tab-${name}"
      aria-selected="${tab === name}" aria-controls="bl-panel" tabindex="${tab === name ? 0 : -1}">${name.toUpperCase()}</button>`).join('');
    const periods = PERIODS.map(period => `<button type="button" data-bio-lab-period="${period}" aria-pressed="${snapshot.period === period}">${period} <span>DAYS</span></button>`).join('');
    host.innerHTML = `<div class="bl-page">
      <div class="bl-demo-banner"><span class="bl-demo-dot"></span><strong>BIO-LAB DEMO — SIMULATED DATA</strong><span>LOCAL SAMPLE · NO DEVICE CONNECTION</span></div>
      <header class="bl-heading"><div><p class="bl-eyebrow"><span>FSD</span> / BIO-LAB <i></i> PERFORMANCE INTELLIGENCE</p>
        <h1>INTELLIGENCE<br/><em>IN MOTION.</em></h1><p>Performance patterns, observed with precision.</p></div>
        <button class="bl-exit" type="button" data-bio-lab-exit>RETURN TO FSD <span aria-hidden="true">↗</span></button></header>
      <div class="bl-observation-line"><span>SELECTED SAMPLE RANGE · ${esc(fmtLongDate(snapshot.range.start))} — ${esc(fmtLongDate(snapshot.range.end))}</span>
        <span>DEMO AS OF · ${esc(snapshot.asOf)} UTC</span></div>
      <section class="bl-controls" aria-label="Dashboard navigation">
        <div class="bl-tabs" role="tablist" aria-label="Bio-Lab dashboard sections">${tabs}</div>
        <div class="bl-periods" role="group" aria-label="Select observation period">${periods}</div>
      </section>
      <section class="bl-content" id="bl-panel" role="tabpanel" aria-labelledby="bl-tab-${tab}" tabindex="-1">
        ${tabContent(tab, snapshot, products)}
      </section>
      <footer class="bl-footer"><span>FSD / BIO-LAB · PRE-LAUNCH DEMONSTRATION</span><p>${esc(provider.meta?.disclaimer || 'Every value shown is simulated and for demonstration only.')}</p>
        <small>NO HEALTH DATA · NO NETWORK TRANSMISSION · NO ACCOUNT REQUIRED</small></footer>
    </div>`;
    unbindChartEvents();
    unbindChartEvents = bindCharts(host);
    stopReveals = revealDemoElements(host);
  }

  async function load() {
    const request = ++requestId;
    setLoading();
    try {
      if (!provider) {
        const module = await import('./demo-provider.js');
        provider = { create: module.createDemoProvider, meta: module.DEMO_META };
      }
      const instance = provider.create();
      const next = await instance.load(currentRoute.period);
      if (destroyed || request !== requestId) return;
      snapshot = { ...next, asOf: provider.meta.asOf };
      renderShell();
    } catch (error) {
      if (destroyed || request !== requestId) return;
      host.innerHTML = `<div class="bl-demo-banner"><span class="bl-demo-dot"></span><strong>BIO-LAB DEMO — SIMULATED DATA</strong><span>LOCAL SAMPLE · NO DEVICE CONNECTION</span></div><section class="bl-error" role="alert"><span>FSD / BIO-LAB</span><h2>Demo data could not be loaded.</h2>
        <p>The local demonstration module is unavailable. No data was sent.</p><div><button type="button" data-bl-retry>RETRY</button>
        <button type="button" data-bio-lab-exit>RETURN TO FSD</button></div><small>${esc(error?.message || 'Loading error')}</small></section>`;
    }
  }

  function navigate(nextRoute, focusTarget = '') {
    const keepFocus = focusTarget || (host.querySelector('[role="tab"]:focus') ? `tab:${host.querySelector('[role="tab"]:focus').dataset.bioLabTab}` : '');
    currentRoute = nextRoute;
    load().then(() => {
      if (!keepFocus || destroyed) return;
      const [kind, value] = keepFocus.split(':');
      const selector = kind === 'period' ? `[data-bio-lab-period="${value}"]` : `[data-bio-lab-tab="${value}"]`;
      const control = host.querySelector(selector);
      control?.focus({ preventScroll: true });
      const tabs = control?.closest('.bl-tabs');
      if (tabs) {
        const item = control.getBoundingClientRect();
        const viewport = tabs.getBoundingClientRect();
        tabs.scrollLeft += item.left < viewport.left ? item.left - viewport.left
          : item.right > viewport.right ? item.right - viewport.right : 0;
      }
    });
  }

  const onClick = event => {
    const tab = event.target.closest('[data-bio-lab-tab]');
    if (tab && host.contains(tab)) {
      if (tab.tagName === 'A') event.preventDefault();
      const index = TABS.indexOf(tab.dataset.bioLabTab);
      const next = TABS[(index + TABS.length) % TABS.length];
      onNavigate({ tab: next, period: currentRoute.period }, `tab:${next}`);
      return;
    }
    const period = event.target.closest('[data-bio-lab-period]');
    if (period && host.contains(period)) {
      onNavigate({ tab: currentRoute.tab, period: Number(period.dataset.bioLabPeriod) }, `period:${period.dataset.bioLabPeriod}`);
      return;
    }
    if (event.target.closest('[data-bio-lab-exit]')) onExit();
    if (event.target.closest('[data-bl-retry]')) location.reload();
  };
  const onKeydown = event => {
    const tab = event.target.closest('[role="tab"]');
    if (!tab || !host.contains(tab)) return;
    let index = TABS.indexOf(tab.dataset.bioLabTab);
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') index = (index + 1) % TABS.length;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') index = (index + TABS.length - 1) % TABS.length;
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = TABS.length - 1;
    else return;
    event.preventDefault();
    onNavigate({ tab: TABS[index], period: currentRoute.period }, `tab:${TABS[index]}`);
  };
  host.addEventListener('click', onClick);
  host.addEventListener('keydown', onKeydown);
  const onResize = () => {
    if (destroyed || Math.abs(window.innerWidth - viewportWidth) < 40) return;
    viewportWidth = window.innerWidth;
    if (snapshot) renderShell();
  };
  window.addEventListener('resize', onResize);
  load();
  return {
    navigate,
    destroy() {
      destroyed = true;
      requestId++;
      unbindChartEvents();
      stopReveals();
      window.removeEventListener('resize', onResize);
      host.removeEventListener('click', onClick);
      host.removeEventListener('keydown', onKeydown);
      host.replaceChildren();
    },
  };
}
