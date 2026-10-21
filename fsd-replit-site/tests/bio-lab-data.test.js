import test from 'node:test';
import assert from 'node:assert/strict';
import { DEMO_META, DEMO_PERIODS, getDemoSnapshot, createDemoProvider, validateDemoDataset } from '../src/bio-lab/demo-provider.js';

const sum = (rows, key) => rows.reduce((total, row) => total + row[key], 0);
const rounded = value => Number(value.toFixed(1));
for (const period of DEMO_PERIODS) {
  test(`${period}-day demo summaries reconcile with daily, session and weekly data`, () => {
    const snapshot = getDemoSnapshot(period);
    const { rows, previousRows, summary, sessions, weekly, recovery } = snapshot;
    assert.equal(snapshot.mode, 'demo');
    assert.equal(snapshot.simulated, true);
    assert.equal(rows.length, period);
    assert.equal(previousRows.length, period);
    assert.equal(summary.durationMinutes, sum(rows, 'durationMinutes'));
    assert.equal(summary.durationMinutes, sum(sessions, 'durationMinutes'));
    assert.equal(summary.durationMinutes, sum(weekly, 'durationMinutes'));
    assert.equal(summary.sessionCount, sessions.length);
    assert.equal(summary.sessionCount, sum(rows, 'sessionCount'));
    assert.equal(summary.sessionCount, sum(weekly, 'sessionCount'));
    assert.equal(summary.activeDays, rows.filter(row => row.sessionCount).length);
    assert.equal(summary.consistencyPercent, rounded(summary.activeDays / period * 100));
    assert.equal(summary.goalPercent, rounded(summary.durationMinutes / (240 * period / 7) * 100));
    assert.equal(summary.volumeChangePercent, rounded((summary.durationMinutes - sum(previousRows, 'durationMinutes')) / sum(previousRows, 'durationMinutes') * 100));
    assert.equal(summary.loadUnits, sessions.reduce((load, session) => load + session.durationMinutes * session.intensity, 0));
    assert.equal(summary.loadUnits, sum(rows, 'loadUnits'));
    assert.equal(summary.loadUnits, sum(weekly, 'loadUnits'));
    assert.equal(summary.meanIntensity, rounded(sum(sessions, 'intensity') / sessions.length));
    assert.equal(recovery.restDays, period - summary.activeDays);
    assert.equal(recovery.restDays, sum(weekly, 'restDays'));
    assert.equal(recovery.indicator, rows.at(-1).recoveryIndicator);
    assert.equal(recovery.rows.length, period);
    assert.equal(recovery.illustrative, true);
    assert.match(recovery.label, /not a validated/);
    assert.match(snapshot.methodology.recovery, /arbitrary fictional/);
    assert.match(snapshot.methodology.volumeChange, /not physiological/);
    assert.ok(recovery.restHours >= 0);
    assert.equal(recovery.restHours, rounded((Date.parse(DEMO_META.asOf) - Date.parse(sessions.at(-1).start) - sessions.at(-1).durationMinutes * 60_000) / 3_600_000));
    assert.equal(snapshot.range.start, rows[0].date);
    assert.equal(snapshot.range.end, rows.at(-1).date);
    assert.equal(Date.parse(`${rows[0].date}T00:00:00Z`) - Date.parse(`${previousRows.at(-1).date}T00:00:00Z`), 86_400_000);
    for (let i = 1; i < rows.length; i++) {
      assert.equal(Date.parse(rows[i].date) - Date.parse(rows[i - 1].date), 86_400_000);
    }
    for (const row of rows) {
      assert.ok(row.recoveryIndicator >= 55 && row.recoveryIndicator <= 89);
      assert.equal(row.intensity === null, row.sessionCount === 0);
      if (row.intensity !== null) assert.ok(row.intensity >= 1 && row.intensity <= 10);
    }
    for (const week of weekly) {
      assert.equal(week.partial, week.days < 7);
      assert.equal(new Date(week.start).getUTCDay(), 1);
      assert.ok(week.from >= snapshot.range.start && week.to <= snapshot.range.end);
    }
  });
}

test('periods use nested but genuinely different data and remain deterministic', async () => {
  const provider = createDemoProvider();
  assert.equal(provider.mode, 'demo');
  const seven = await provider.load(7);
  const thirty = await provider.load(30);
  const ninety = await provider.load(90);
  assert.deepEqual(seven.rows, thirty.rows.slice(-7));
  assert.deepEqual(thirty.rows, ninety.rows.slice(-30));
  assert.notEqual(seven.summary.durationMinutes, thirty.summary.durationMinutes);
  assert.notEqual(thirty.summary.durationMinutes, ninety.summary.durationMinutes);
  assert.deepEqual(await provider.load(30), thirty);
  assert.match(ninety.profile.name, /Sample Athlete/);
  assert.match(DEMO_META.disclaimer, /SIMULATED DATA/);
  assert.doesNotMatch(JSON.stringify(ninety), /email|password|heartRate|bloodPressure|latitude|oauth|accessToken/);
});

test('provider rejects unsupported periods rather than silently fabricating a fallback', async () => {
  for (const period of [0, 1, 14, -7, 91, '30', NaN, null, Infinity]) {
    assert.throws(() => getDemoSnapshot(period), /must be 7, 30 or 90/);
    await assert.rejects(createDemoProvider().load(period), /must be 7, 30 or 90/);
  }
  assert.throws(() => validateDemoDataset({ rows: [], sessions: [] }), /180/);
});

test('consumers cannot corrupt future snapshots or the immutable demo metadata', () => {
  const baseline = getDemoSnapshot(90);
  const changed = getDemoSnapshot(90);
  changed.rows[0].durationMinutes = 9999;
  changed.sessions[0].intensity = 999;
  changed.summary.sessionCount = 999;
  changed.profile.name = 'Changed';
  changed.methodology.recovery = 'Changed';
  assert.deepEqual(getDemoSnapshot(90), baseline);
  assert.equal(Object.isFrozen(DEMO_META), true);
  assert.equal(Object.isFrozen(DEMO_META.profile), true);
});
