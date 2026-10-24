import test from 'node:test';
import assert from 'node:assert/strict';
import {
  brandTokens,
  COLOURWAYS,
  ENABLE_GOLD_CURSOR,
  GOLD,
  MARK_NAMES,
  OBSIDIAN,
  WOMENS_LINES,
} from '../src/brand/tokens.js';

test('FSD brand palette and named colourways stay centralized', () => {
  assert.equal(GOLD, '#D4AF37');
  assert.equal(OBSIDIAN, '#0a0a0a');
  assert.equal(brandTokens.colors.gold, GOLD);
  assert.equal(brandTokens.colors.ink, OBSIDIAN);
  assert.deepEqual(Object.keys(COLOURWAYS), [
    'core', 'earth', 'modest', 'tech', 'performance', 'combat',
  ]);
  assert.equal(COLOURWAYS.core.name, 'Onyx Black');
  assert.equal(COLOURWAYS.performance.name, 'Midnight Navy');
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
