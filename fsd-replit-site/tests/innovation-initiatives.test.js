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
    'Genetic & Microbiome Personalisation',
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
  const publicPage = readPublic('the-house.html');
  const context = { window: {} };
  vm.runInNewContext(source, context);
  const smartApparel = JSON.parse(JSON.stringify(context.window.FSDInnovationInitiatives)).bioLab
    .find(item => item.id === 'smart-apparel');
  const pods = JSON.parse(JSON.stringify(context.window.FSDInnovationInitiatives)).global
    .find(item => item.id === 'pods');
  const popups = JSON.parse(JSON.stringify(context.window.FSDInnovationInitiatives)).global
    .find(item => item.id === 'predictive-popups');

  assert.doesNotMatch(source, /Concept for exploration|not a current product or commitment|Potential value|Conditions before progression/i);
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
  assert.match(source, /FSD is not an emergency service/i);
  assert.match(source, /No tests, kits or data collection are operating/i);
  assert.match(source, /No partner is represented as agreed/i);
  assert.doesNotMatch(publicPage, /No location, service, event or product described is represented as operational or available for sale/i);
});
