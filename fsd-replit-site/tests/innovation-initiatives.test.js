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

  assert.doesNotMatch(source, /Concept for exploration|not a current product or commitment|Potential value|Conditions before progression/i);
  assert.match(router, /ACTIVE INITIATIVE · ROLLOUT UNDERWAY/);
  assert.match(source, /NFC does not measure biometrics/i);
  assert.match(source, /FSD is not an emergency service/i);
  assert.match(source, /No tests, kits or data collection are operating/i);
  assert.match(source, /No partner is represented as agreed/i);
  assert.doesNotMatch(publicPage, /No location, service, event or product described is represented as operational or available for sale/i);
});
