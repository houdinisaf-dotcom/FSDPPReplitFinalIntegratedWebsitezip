import test from 'node:test';
import assert from 'node:assert/strict';
import {
  brandTokens,
  COLOURWAYS,
  CAMPAIGN_VOLT,
  CAMPAIGN_VOLT_LIGHT,
  ENABLE_GOLD_CURSOR,
  GOLD,
  MARK_NAMES,
  OBSIDIAN,
  WOMENS_LINES,
} from '../src/brand/tokens.js';

test('FSD brand palette and named colourways stay centralized', () => {
  assert.equal(GOLD, '#D4AF37');
  assert.equal(CAMPAIGN_VOLT, '#DFFF45');
  assert.equal(CAMPAIGN_VOLT_LIGHT, '#EAFF8C');
  assert.equal(OBSIDIAN, '#0a0a0a');
  assert.equal(brandTokens.colors.gold, GOLD);
  assert.equal(brandTokens.colors.champagne, GOLD);
  assert.equal(brandTokens.colors.campaignVolt, CAMPAIGN_VOLT);
  assert.equal(brandTokens.colors.campaignVoltLight, CAMPAIGN_VOLT_LIGHT);
  assert.equal(brandTokens.colors.ink, OBSIDIAN);
  assert.deepEqual(Object.keys(COLOURWAYS), [
    'core', 'earth', 'modest', 'tech', 'performance', 'combat',
  ]);
  assert.equal(COLOURWAYS.core.name, 'Onyx Black');
  assert.equal(COLOURWAYS.performance.name, 'Midnight Navy');
});

test('campaign and Champagne tokens remain separate while existing volt styling keeps its token', async () => {
  const { readFile } = await import('node:fs/promises');
  const flagship = await readFile(new URL('../src/flagship-redesign.css', import.meta.url), 'utf8');
  const homepage = await readFile(new URL('../src/homepage-phase3.css', import.meta.url), 'utf8');
  const visualSystem = await readFile(new URL('../src/visual-system.css', import.meta.url), 'utf8');

  assert.match(flagship, /--fsd-champagne:\s*#d4af37/i);
  assert.match(flagship, /--fsd-campaign-volt:\s*#dfff45/i);
  assert.match(flagship, /--fsd-placeholder-accent:\s*var\(--fsd-campaign-volt\)/i);
  assert.doesNotMatch(flagship, /--fsd-champagne:\s*#dfff45/i);
  assert.doesNotMatch(homepage, /var\(--fsd-champagne(?:-light)?\)/i);
  assert.doesNotMatch(visualSystem, /var\(--fsd-champagne(?:-light)?\)/i);
});

test('women’s lines use only active named marks and existing colourways', () => {
  assert.deepEqual(Object.keys(MARK_NAMES), ['serene', 'ascent', 'aligned', 'signature']);
  assert.equal(WOMENS_LINES.length, 6);
  assert.ok(WOMENS_LINES.every(line => COLOURWAYS[line.colourway]));
  assert.ok(WOMENS_LINES.every(line => line.companion === null || MARK_NAMES[line.companion]));
  assert.equal(WOMENS_LINES.find(line => line.id === 'aeroforge').companion, 'ascent');
  assert.equal(WOMENS_LINES.find(line => line.id === 'combat').companion, 'signature');
});

test('the gold cursor is enabled by the one shared brand setting', () => {
  assert.equal(ENABLE_GOLD_CURSOR, true);
});
