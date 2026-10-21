// Local, fictional demonstration only. No network, accounts, devices or storage.
const DAY = 86_400_000;
const AS_OF = '2026-10-20T20:00:00.000Z';
const END_DAY = Date.parse('2026-10-20T00:00:00.000Z');
export const DEMO_PERIODS = Object.freeze([7, 30, 90]);
export const DEMO_META = Object.freeze({
  simulated: true,
  asOf: AS_OF,
  goalMinutesPerWeek: 240,
  profile: Object.freeze({
    name: 'Sample Athlete 01',
    objective: 'Fictional demonstration goal: 240 training minutes per seven days. Not a training recommendation.',
  }),
  disclaimer: 'BIO-LAB DEMO — SIMULATED DATA. No real athlete, device or health measurements. Recovery indicators are illustrative, not validated assessments or medical advice.',
});

export const DEMO_METHODOLOGY = Object.freeze({
  consistency: 'Active days divided by calendar days in the selected period, multiplied by 100.',
  goal: 'Training minutes divided by the fictional target of 240 minutes per seven days, prorated to the selected period. Not a training recommendation.',
  volumeChange: 'Percentage difference in total training minutes compared with the immediately preceding period of the same length. This is not physiological performance improvement.',
  load: 'Illustrative load units are session minutes multiplied by a fictional intensity score (1–10), summed across sessions. Not a validated training-load model.',
  recovery: 'Recovery indicators are arbitrary fictional values between 55 and 89. They are not measurements, readiness advice, diagnoses or validated scientific scores.',
});

const iso = timestamp => new Date(timestamp).toISOString().slice(0, 10);
const round = (value, places = 1) => Number(value.toFixed(places));
const dateLabel = date => new Intl.DateTimeFormat('en-GB', {
  day: 'numeric', month: 'short', timeZone: 'UTC',
}).format(new Date(`${date}T00:00:00.000Z`));

function buildDataset() {
  const rows = [];
  const sessions = [];
  for (let index = 0; index < 180; index++) {
    const date = iso(END_DAY - (179 - index) * DAY);
    const active = [0, 1, 3, 5].includes(index % 7) && index % 29 !== 0;
    const count = active ? (index % 23 === 0 ? 2 : 1) : 0;
    const dailySessions = [];
    for (let part = 0; part < count; part++) {
      dailySessions.push(Object.freeze({
        id: `demo-session-${index}-${part}`,
        date,
        durationMinutes: 25 + ((index * 17 + part * 13) % 36),
        intensity: 3 + ((index * 5 + part * 2) % 6),
        type: ['Strength', 'Conditioning', 'Mobility', 'Mixed training'][(index + part) % 4],
        start: `${date}T${part === 0 ? '08' : '18'}:00:00.000Z`,
      }));
    }
    const durationMinutes = dailySessions.reduce((sum, session) => sum + session.durationMinutes, 0);
    const loadUnits = dailySessions.reduce((sum, session) => sum + session.durationMinutes * session.intensity, 0);
    rows.push(Object.freeze({
      date, durationMinutes, sessionCount: count,
      intensity: count ? round(dailySessions.reduce((sum, session) => sum + session.intensity, 0) / count) : null,
      loadUnits,
      recoveryIndicator: 55 + ((index * 11) % 35),
    }));
    sessions.push(...dailySessions);
  }
  return Object.freeze({ rows: Object.freeze(rows), sessions: Object.freeze(sessions) });
}

const DATASET = buildDataset();

export function validateDemoDataset(dataset) {
  if (!dataset || !Array.isArray(dataset.rows) || !Array.isArray(dataset.sessions) || dataset.rows.length !== 180) {
    throw new TypeError('The Bio-Lab demo requires 180 daily rows and a session list.');
  }
  const ids = new Set();
  for (const session of dataset.sessions) {
    if (typeof session.id !== 'string' || ids.has(session.id) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(session.date) ||
        typeof session.start !== 'string' || !session.start.startsWith(`${session.date}T`) ||
        !Number.isFinite(Date.parse(session.start)) ||
        !Number.isInteger(session.durationMinutes) || session.durationMinutes <= 0 ||
        Date.parse(session.start) + session.durationMinutes * 60_000 > Date.parse(`${session.date}T00:00:00.000Z`) + DAY ||
        !Number.isFinite(session.intensity) || session.intensity < 1 || session.intensity > 10) {
      throw new TypeError('Invalid or duplicate fictional session.');
    }
    ids.add(session.id);
  }
  dataset.rows.forEach((row, index) => {
    if (row.date !== iso(END_DAY - (179 - index) * DAY)) throw new TypeError('Demo dates must be contiguous UTC days.');
    const daySessions = dataset.sessions.filter(session => session.date === row.date);
    const minutes = daySessions.reduce((sum, session) => sum + session.durationMinutes, 0);
    const load = daySessions.reduce((sum, session) => sum + session.durationMinutes * session.intensity, 0);
    const intensity = daySessions.length
      ? round(daySessions.reduce((sum, session) => sum + session.intensity, 0) / daySessions.length) : null;
    if (row.sessionCount !== daySessions.length || row.durationMinutes !== minutes || row.loadUnits !== load ||
        row.intensity !== intensity || !Number.isInteger(row.recoveryIndicator) ||
        row.recoveryIndicator < 0 || row.recoveryIndicator > 100) {
      throw new TypeError('Fictional daily values must reconcile with their session records.');
    }
  });
  if (dataset.sessions.some(session => !dataset.rows.some(row => row.date === session.date))) {
    throw new TypeError('Every fictional session must belong to a demo day.');
  }
  return true;
}

validateDemoDataset(DATASET);

function aggregateWeeks(rows, sessions) {
  const bins = new Map();
  for (const row of rows) {
    const timestamp = Date.parse(`${row.date}T00:00:00.000Z`);
    const monday = timestamp - ((new Date(timestamp).getUTCDay() + 6) % 7) * DAY;
    const key = iso(monday);
    if (!bins.has(key)) bins.set(key, {
      start: key, end: iso(monday + 6 * DAY), from: row.date, to: row.date,
      durationMinutes: 0, sessionCount: 0, loadUnits: 0, restDays: 0, days: 0,
    });
    const bin = bins.get(key);
    bin.to = row.date;
    bin.durationMinutes += row.durationMinutes;
    bin.sessionCount += row.sessionCount;
    bin.loadUnits += row.loadUnits;
    bin.restDays += row.sessionCount === 0 ? 1 : 0;
    bin.days++;
  }
  return [...bins.values()].map(bin => {
    const subset = sessions.filter(session => session.date >= bin.from && session.date <= bin.to);
    return {
      ...bin,
      label: `${dateLabel(bin.from)}–${dateLabel(bin.to)}`,
      partial: bin.days < 7,
      meanIntensity: subset.length ? round(subset.reduce((sum, session) => sum + session.intensity, 0) / subset.length) : null,
    };
  });
}

/** A narrow provider boundary; future live adapters require separate approval. */
export function getDemoSnapshot(period = 7) {
  if (!DEMO_PERIODS.includes(period)) throw new RangeError('Demo period must be 7, 30 or 90 days.');
  const rows = DATASET.rows.slice(-period).map(row => ({ ...row }));
  const previousRows = DATASET.rows.slice(-period * 2, -period).map(row => ({ ...row }));
  const start = rows[0].date;
  const end = rows.at(-1).date;
  const sessions = DATASET.sessions.filter(session => session.date >= start && session.date <= end).map(session => ({ ...session }));
  const durationMinutes = rows.reduce((sum, row) => sum + row.durationMinutes, 0);
  const previousDuration = previousRows.reduce((sum, row) => sum + row.durationMinutes, 0);
  const activeDays = rows.filter(row => row.sessionCount > 0).length;
  const goalMinutes = DEMO_META.goalMinutesPerWeek * period / 7;
  const loadUnits = rows.reduce((sum, row) => sum + row.loadUnits, 0);
  const lastSession = sessions.at(-1);
  const lastEnd = lastSession ? Date.parse(lastSession.start) + lastSession.durationMinutes * 60_000 : null;
  const summary = {
    durationMinutes,
    sessionCount: sessions.length,
    activeDays,
    consistencyPercent: round(activeDays / period * 100),
    goalMinutes: round(goalMinutes),
    goalPercent: round(durationMinutes / goalMinutes * 100),
    volumeChangePercent: previousDuration > 0 ? round((durationMinutes - previousDuration) / previousDuration * 100) : null,
    meanIntensity: sessions.length ? round(sessions.reduce((sum, session) => sum + session.intensity, 0) / sessions.length) : null,
    loadUnits,
  };
  return {
    mode: 'demo',
    simulated: true,
    asOf: AS_OF,
    period,
    range: { start, end, previousStart: previousRows[0].date, previousEnd: previousRows.at(-1).date },
    profile: { ...DEMO_META.profile },
    rows, previousRows, summary,
    weekly: aggregateWeeks(rows, sessions),
    recovery: {
      illustrative: true,
      label: 'Illustrative only — not a validated recovery assessment or medical advice.',
      indicator: rows.at(-1).recoveryIndicator,
      restDays: period - activeDays,
      restHours: lastEnd ? round((Date.parse(AS_OF) - lastEnd) / 3_600_000) : null,
      loadUnits,
      rows: rows.map(row => ({ date: row.date, indicator: row.recoveryIndicator })),
    },
    sessions,
    insights: [
      { id: 'volume', title: 'Selected-period activity', body: `${durationMinutes} fictional training minutes across ${sessions.length} sample sessions in ${period} days.` },
      { id: 'pattern', title: 'Training and rest pattern', body: `${activeDays} active days and ${period - activeDays} rest days in this fictional period. This is a sample pattern, not advice.` },
      { id: 'comparison', title: 'Like-for-like volume comparison', body: `${durationMinutes} simulated minutes in this period versus ${previousDuration} in the immediately preceding ${period} days. This does not measure real performance improvement.` },
    ],
    methodology: { ...DEMO_METHODOLOGY },
  };
}

export function createDemoProvider() {
  return Object.freeze({
    mode: 'demo',
    async load(period = 7) { return getDemoSnapshot(period); },
  });
}
