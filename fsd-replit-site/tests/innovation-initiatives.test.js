import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const readPublic = path => readFileSync(new URL(`../public/${path}`, import.meta.url), 'utf8');

test('all named initiatives are public and mapped to their approved platform homes', () => {
  const context = { window: {} };
  vm.runInNewContext(readPublic('innovation-initiative-data.js'), context);
  const groups = JSON.parse(JSON.stringify(context.window.FSDInnovationInitiatives));

  assert.deepEqual(Object.keys(groups), ['bioLab', 'community', 'global']);
  assert.equal(groups.bioLab.length + groups.community.length + groups.global.length, 11);
  assert.deepEqual(groups.bioLab.map(item => item.title), [
    'Adaptive Technical Fabrics',
    'Smart Apparel & NFC Authentication',
    'Genetic & Microbiome Personalisation',
  ]);
  assert.deepEqual(groups.community.map(item => item.title), [
    'Community Co-Creation',
    'Performance-Linked Partnerships',
    'Circular Trade-In Programme',
    'Community First Aid & Safety Skills',
  ]);
  assert.deepEqual(groups.global.map(item => item.title), [
    'FSD Pods',
    'Autonomous Pop-Ups & Predictive Stock',
    'Mobile Testing Labs',
    'Local Micro-Manufacturing',
  ]);
  for (const initiative of [...groups.bioLab, ...groups.community, ...groups.global]) {
    assert.ok(initiative.scope);
    assert.ok(initiative.valuePillars.length > 0);
    assert.ok(initiative.rollout.length > 0);
    assert.ok(initiative.safeguards.length > 0);
  }
});

test('public initiative copy removes exploratory labels and retains safety and privacy boundaries', () => {
  const source = readPublic('innovation-initiative-data.js');
  const router = readPublic('innovation-initiative-router.js');
  const publicPage = readPublic('fsd-pods.html');
  const context = { window: {} };
  vm.runInNewContext(source, context);
  const smartApparel = JSON.parse(JSON.stringify(context.window.FSDInnovationInitiatives)).bioLab
    .find(item => item.id === 'smart-apparel');
  const pods = JSON.parse(JSON.stringify(context.window.FSDInnovationInitiatives)).global
    .find(item => item.id === 'pods');
  const popups = JSON.parse(JSON.stringify(context.window.FSDInnovationInitiatives)).global
    .find(item => item.id === 'predictive-popups');
  const mobileLabs = JSON.parse(JSON.stringify(context.window.FSDInnovationInitiatives)).global
    .find(item => item.id === 'mobile-testing-labs');
  const manufacturing = JSON.parse(JSON.stringify(context.window.FSDInnovationInitiatives)).global
    .find(item => item.id === 'local-micro-manufacturing');
  const genetics = JSON.parse(JSON.stringify(context.window.FSDInnovationInitiatives)).bioLab
    .find(item => item.id === 'genetic-microbiome');
  const circular = JSON.parse(JSON.stringify(context.window.FSDInnovationInitiatives)).community
    .find(item => item.id === 'circular-trade-in');
  const coCreation = JSON.parse(JSON.stringify(context.window.FSDInnovationInitiatives)).community
    .find(item => item.id === 'co-creation');

  assert.doesNotMatch(source, /Concept for exploration|not a current product or commitment|exploratory concept|Design Prototype/i);
  assert.match(router, /ACTIVE INITIATIVE · ROLLOUT UNDERWAY/);
  assert.match(source, /NFC does not measure biometrics/i);
  assert.equal(smartApparel.capabilities.length, 4);
  assert.deepEqual(smartApparel.capabilities.map(item => item.title), [
    'Tap to Connect',
    'Verify Authenticity',
    'Unlock Digital Content',
    'Extended Experiences',
  ]);
  assert.match(smartApparel.scope, /No NFC-enabled garment, portal, or rewards programme is represented as available/);
  assert.match(smartApparel.safeguards.join(' '), /Member offers and events require separate approval/);
  assert.match(router, /Functional ecosystem &amp; features/);
  assert.match(router, /capabilities\.map/);
  assert.equal(pods.capabilities.length, 5);
  assert.match(pods.summary, /no FSD Pod or location is live/i);
  assert.match(pods.heroSubtitle, /Low-footprint modular infrastructure/);
  assert.match(pods.scope, /These are possible uses, not live services/i);
  assert.match(pods.capabilities.find(item => item.title === 'Nutrition Products').description, /Not in confirmed scope/);
  assert.match(pods.rollout.join(' '), /planning permission/i);
  assert.match(pods.rollout.join(' '), /local-authority licensing/i);
  assert.match(pods.rollout.join(' '), /safety, security and insurance/i);
  assert.match(pods.safeguards.join(' '), /No pod, operating location, launch date, or operating partner is confirmed/);
  assert.equal(popups.capabilities.length, 4);
  assert.match(popups.summary, /no locations or systems are live/i);
  assert.match(popups.scope, /Online stock views, click-and-collect, and location-based availability remain future possibilities only/i);
  assert.match(popups.safeguards.join(' '), /not unstaffed or cashier-less retail/i);
  assert.match(popups.safeguards.join(' '), /privacy and security review/i);
  assert.equal(mobileLabs.capabilities.length, 4);
  assert.match(mobileLabs.summary, /no unit, venue, trial, or data collection is live/i);
  assert.match(mobileLabs.scope, /Biometric sensor tracking is not in confirmed scope/);
  assert.match(mobileLabs.safeguards.join(' '), /No biometric sensor tracking or biometric data collection is in confirmed scope/);
  assert.match(mobileLabs.safeguards.join(' '), /informed participant consent/);
  assert.equal(manufacturing.capabilities.length, 4);
  assert.match(manufacturing.summary, /no partner, hub, production site, or service is live/i);
  assert.match(manufacturing.scope, /no partner, manufacturing hub, production site, or custom-order service is confirmed/i);
  assert.match(manufacturing.safeguards.join(' '), /No delivery-time, material-waste, or emissions reduction is measured or promised/);
  assert.match(manufacturing.note, /not verified results or promises/);
  assert.equal(genetics.capabilities.length, 4);
  assert.match(genetics.summary, /no testing, sample collection, data analysis, or personalised health guidance is available/i);
  assert.match(genetics.scope, /No individual interpretation, diagnosis, treatment, or health recommendation is in confirmed scope/);
  assert.match(genetics.safeguards.join(' '), /No tests, kits, sample collection, or data analysis are operating/);
  assert.match(genetics.safeguards.join(' '), /No claim is made that DNA predicts injury or optimises training/);
  assert.match(genetics.safeguards.join(' '), /No clinical or research partnership is represented as agreed/);
  assert.equal(circular.capabilities.length, 4);
  assert.match(circular.summary, /no trade-in service or partner is live/i);
  assert.match(circular.scope, /No product eligibility, trade-in credit, collection, processing, or resale terms are confirmed or available/);
  assert.match(circular.rollout.join(' '), /Define credit, funding, accounting, legal, and consumer terms/);
  assert.match(circular.safeguards.join(' '), /Trade-in credit would create a financial liability/);
  assert.match(circular.safeguards.join(' '), /No zero-waste or verified environmental-impact claim is made/);
  assert.match(circular.note, /potential aims to validate, not measured or guaranteed results/);
  assert.equal(coCreation.capabilities.length, 4);
  assert.match(coCreation.summary, /no sessions, trials, or submissions are open/i);
  assert.match(coCreation.scope, /no sessions, trials, forums, or submission portal are live/i);
  assert.match(coCreation.safeguards.join(' '), /No community feedback or participant data is being collected through this page/);
  assert.match(coCreation.safeguards.join(' '), /does not grant shares, tokens, profit-sharing, or voting rights over the company/);
  assert.match(coCreation.note, /not guaranteed outcomes/i);
  assert.match(source, /FSD is not an emergency service/i);
  assert.match(source, /No tests, kits, sample collection, or data analysis are operating/i);
  assert.match(source, /No partner is represented as agreed/i);
  assert.match(publicPage, /No FSD Pod, location, or service is currently represented as operational/);
});
