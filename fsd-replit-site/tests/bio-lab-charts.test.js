import test from 'node:test';
import assert from 'node:assert/strict';
import { renderChart } from '../src/bio-lab/charts.js';
import { getDemoSnapshot } from '../src/bio-lab/demo-provider.js';

const day = 86_400_000;
const points = [
  { timestamp: 0, value: 10, label: 'Day zero' },
  { timestamp: day, value: 20, label: 'Day one' },
  { timestamp: 7 * day, value: 30, label: 'Day seven' },
];
const render = overrides => renderChart({ title: 'Simulated minutes', description: 'Fictional observations', points, unit: 'min', ...overrides });

test('temporal charts preserve elapsed time rather than equidistant point indices', () => {
  const chart = render();
  const x = [...chart.matchAll(/<circle class="bl-chart-point" cx="([^"]+)"/g)].map(match => Number(match[1]));
  assert.equal(x.length, 3);
  assert.ok(Math.abs((x[1] - x[0]) / (x[2] - x[0]) - 1 / 7) < 0.001);
  for (const point of points) assert.ok(chart.includes(`data-value="${point.value}"`));
});

test('volume areas use a zero baseline and null values form genuine line gaps', () => {
  assert.match(render({ kind: 'area' }), /class="bl-chart-area"/);
  const chart = render({ points: points.map((point, index) => ({ ...point, value: index === 1 ? null : point.value })) });
  assert.equal((chart.match(/class="bl-chart-line"/g) || []).length, 2);
  assert.equal((chart.match(/data-chart-point/g) || []).length, 2);
  assert.doesNotMatch(chart, /data-value="null"|NaN|Infinity/);
});

test('invalid numbers, timestamps or declared scales fail explicitly', () => {
  for (const value of [undefined, NaN, Infinity, '25']) {
    assert.throws(() => render({ points: [{ timestamp: 0, value }] }), /non-finite/);
  }
  assert.throws(() => render({ points: [{ timestamp: '2026-10-20', value: 20 }] }), /timestamp/);
  assert.throws(() => render({ min: 20, max: 25 }), /scale/);
});

test('period charts plot the actual daily and aggregated values without truncation', () => {
  for (const period of [7, 30, 90]) {
    const snapshot = getDemoSnapshot(period);
    const chart = render({ kind: 'bar', points: snapshot.weekly.map(week => ({
      timestamp: Date.parse(week.start), value: week.sessionCount, label: week.label,
    })), unit: 'sessions' });
    assert.equal((chart.match(/data-chart-point/g) || []).length, snapshot.weekly.length);
    const values = [...chart.matchAll(/data-value="([^"]+)"/g)].map(match => Number(match[1]));
    assert.equal(values.reduce((sum, value) => sum + value, 0), snapshot.summary.sessionCount);
    assert.match(chart, /role="status"/);
  }
});
