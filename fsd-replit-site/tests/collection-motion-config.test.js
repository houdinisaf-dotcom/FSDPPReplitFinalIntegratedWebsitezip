import test from 'node:test';
import assert from 'node:assert/strict';
import { COLLECTION_MOTION_CONFIG as config, getCollectionMotionEntry, resolveCollectionLogo } from '../src/collection-motion-config.js';
import { CLOTHING_LINES } from '../src/clothing-lines.js';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

test('Priority 3 preserves original-artwork boundaries and exact supplied interaction values', () => {
  assert.equal(config.priority, 3);
  assert.deepEqual(config.theme, { background: '#0a0a0a', primaryAccent: '#D4AF37' });
  assert.equal(config.interaction.transitionDurationMs, 240);
  assert.equal(config.interaction.scrollDetection, 'IntersectionObserver');
  assert.equal(config.interaction.respectReducedMotion, true);
  assert.equal(config.rules.allowLogoRedesign, false);
  assert.equal(config.rules.allowGeneratedReplacements, false);
  assert.equal(config.rules.showLogoBesideProductRows, false);
  assert.equal(config.rules.logoPosition, 'far-right-end-of-existing-banner');
  assert.deepEqual(config.rules.excludedConcepts, [3]);
  assert.equal(Object.isFrozen(config.collections[0]), true);
});

test('approved panel crops do not infer any women assignments or replace missing identities', () => {
  assert.equal(Object.keys(config.logos).length, 7);
  for (const key of ['master', 'serene', 'tiger', 'scorpion']) assert.equal(config.logos[key].asset, null);
  for (const key of ['ascent', 'aligned', 'signature']) {
    assert.match(config.logos[key].asset, /^\/brand\/logo-panel-crops\/concept-[245]-/);
  }
  for (const line of CLOTHING_LINES.slice(0, 5)) {
    const resolved = resolveCollectionLogo(line.id);
    assert.equal(resolved.key, null);
    assert.equal(resolved.src, null);
    assert.equal(resolved.status, 'unassigned');
  }
  for (const id of ['tiger-series', 'scorpion-series']) {
    assert.equal(resolveCollectionLogo(id).status, 'missing');
    assert.equal(resolveCollectionLogo(id).src, null);
  }
});

test('approved raster crops match recorded dimensions and hashes without any Concept 3 output', () => {
  const manifest = JSON.parse(readFileSync(new URL('../handoff/approved-logo-crops.json', import.meta.url)));
  assert.deepEqual(manifest.excludedConcepts, [3]);
  assert.deepEqual(manifest.assets.map(asset=>asset.key), ['ascent', 'aligned', 'signature', null]);
  for (const asset of manifest.assets) {
    const bytes = readFileSync(new URL(`../public${asset.asset}`, import.meta.url));
    assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
    assert.equal(bytes.readUInt32BE(16), asset.crop.width);
    assert.equal(bytes.readUInt32BE(20), asset.crop.height);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.assetSha256);
    if (asset.key) assert.equal(config.logos[asset.key].asset, asset.asset);
    assert.equal(asset.source.includes('03.35'), false, 'excluded Concept 3 board is never cropped');
  }
  assert.equal(Object.hasOwn(config.logos, 'concept3'), false);
});

test('user animal IDs resolve to existing public collection IDs without creating new routes', () => {
  assert.equal(getCollectionMotionEntry('tiger-series').id, 'tiger');
  assert.equal(getCollectionMotionEntry('scorpion-series').id, 'scorpion');
  assert.deepEqual(resolveCollectionLogo('tiger'), resolveCollectionLogo('tiger-series'));
  assert.equal(resolveCollectionLogo('unknown').status, 'unassigned');
});

test('only explicitly assigned original files resolve; existing null assignments never inherit a mark', () => {
  const fixture = structuredClone(config);
  fixture.logos.serene.asset = '/brand/originals/approved-serene.svg';
  assert.equal(resolveCollectionLogo('breeze', fixture).src, null);
  fixture.collections.find(entry=>entry.id==='breeze').logo = 'serene';
  assert.equal(resolveCollectionLogo('breeze', fixture).src, '/brand/originals/approved-serene.svg');
  assert.equal(resolveCollectionLogo('breeze', fixture).status, 'ready');
  fixture.logos.tiger.asset = '/brand/originals/approved-tiger.png';
  assert.equal(resolveCollectionLogo('tiger-series', fixture).status, 'ready');
  assert.equal(resolveCollectionLogo('scorpion-series', fixture).status, 'missing');
  assert.equal(config.logos.serene.asset, null);
});

test('unknown or excluded concepts and non-file replacement sources cannot become logos', () => {
  const fixture = structuredClone(config);
  const entry = fixture.collections[0];
  entry.logo = 'concept3';
  fixture.logos.concept3 = { name: 'Concept 3', asset: '/brand/originals/concept3.svg' };
  assert.equal(resolveCollectionLogo(entry.id, fixture).status, 'excluded');
  entry.logo = 'ascent';
  fixture.rules.excludedConcepts.push(2);
  fixture.logos.ascent.asset = '/brand/originals/ascent.svg';
  assert.equal(resolveCollectionLogo(entry.id, fixture).status, 'excluded');
  const animalEntry = fixture.collections.find(collection=>collection.id==='tiger');
  for (const source of ['data:image/svg+xml,<svg/>', 'javascript:alert(1)', '//unapproved.example/logo.png', 'https://unapproved.example/logo.png', '/brand/logo.html']) {
    fixture.logos.tiger.asset = source;
    assert.equal(resolveCollectionLogo(animalEntry.id, fixture).src, null);
  }
});

test('women and animal identities cannot be substituted for each other', () => {
  const fixture = structuredClone(config);
  fixture.logos.serene.asset = '/brand/originals/serene.svg';
  fixture.logos.tiger.asset = '/brand/originals/tiger.svg';
  fixture.collections.find(entry=>entry.id==='tiger').logo = 'serene';
  fixture.collections.find(entry=>entry.id==='breeze').logo = 'tiger';
  assert.equal(resolveCollectionLogo('tiger-series', fixture).status, 'excluded');
  assert.equal(resolveCollectionLogo('breeze', fixture).status, 'excluded');
});
