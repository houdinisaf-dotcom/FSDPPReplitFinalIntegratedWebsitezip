import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { hardwareForgeItems, renderHardwareForgePreview } from '../src/hardware-forge-preview.js';
import { hardwareForgePrivatePreviewPlugin } from '../scripts/hardware-forge-private-preview-plugin.mjs';
import { createNavigationModel } from '../src/site-navigation.js';
import { routeFromHash } from '../src/react-router.js';
import { configureHardwareForgeMenu, registerHardwareForgeRoute } from '../src/hardware-forge-development-metadata.js';

test('hardware review presents only the four approved master record IDs', () => {
  assert.deepEqual(hardwareForgeItems.map(item => item.id), [69, 70, 52, 54]);
  assert.equal(new Set(hardwareForgeItems.map(item => item.id)).size, 4);
});

test('review remains absent outside development and includes no commercial claims', async () => {
  assert.equal(renderHardwareForgePreview(), '');
  assert.deepEqual(routeFromHash('#hardware-forge-preview'), { view: 'home', target: null });
  const markup = renderHardwareForgePreview({ development: true });
  assert.equal((markup.match(/data-master-id="/g) || []).length, 4);
  assert.match(markup, /id="hardware-forge-preview"/);
  assert.match(markup, /FSD Olympic Bar &amp; 5-Cutout Bumper Plate Set/);
  assert.doesNotMatch(markup, /£\s?\d|add.to.bag|purchase|checkout|shipping|COGS|margin/i);
  const source = await readFile(new URL('../src/hardware-forge-preview.js', import.meta.url), 'utf8');
  assert.match(source, /development = import\.meta\.env\?\.DEV/);
  assert.match(source, /if \(!development\) return ''/);
  assert.doesNotMatch(source, /price|£\s?\d|add.to.bag|purchase|checkout|shipping|COGS|margin/i);
  assert.doesNotMatch(source, /4_panel|collage|hero_knurled_shaft_detail|precision_barbell_collar_[23]/i);
  assert.doesNotMatch(markup, />\s*(?:CONCEPT|DRAFT|PREVIEW|PENDING REVIEW|PRIVATE VIEWING)\b/i);
  assert.doesNotMatch(source, /CONCEPT \/ REVIEW ONLY/i);
});

test('private image middleware has an explicit two-image allowlist', async () => {
  const plugin = hardwareForgePrivatePreviewPlugin();
  assert.equal(plugin.apply, 'serve');
  let middleware;
  plugin.configureServer({ middlewares: { use: handler => { middleware = handler; } } });
  const request = key => {
    const response = {
      headers: {},
      setHeader(name, value) { this.headers[name] = value; },
      end() {},
    };
    middleware({ url: `/__hardware-forge-preview/media/${key}`, method: 'HEAD' }, response, () => {});
    return response;
  };
  assert.equal(request('obsidian-gold').statusCode, 200);
  assert.equal(request('precision-collars').statusCode, 200);
  assert.equal(request('aureus-board').statusCode, 404);
  const source = await readFile(new URL('../scripts/hardware-forge-private-preview-plugin.mjs', import.meta.url), 'utf8');
  assert.match(source, /'obsidian-gold'.*fsd_obsidian_gold_dumbbells_1792747503293\.png/s);
  assert.match(source, /'precision-collars'.*precision_barbell_collar_1_1792747503292\.png/s);
  assert.doesNotMatch(source, /precision_barbell_collar_[23]|4_panel|hero_knurled_shaft_detail/i);
  assert.match(source, /apply: 'serve'/);
  assert.match(source, /if \(!asset\) return reply\(response, 404/);
});

test('development-only Hardware menu and route are wired to the review hash', async () => {
  const productionHardwareMenu = createNavigationModel()
    .find(menu => menu.id === 'hardware');
  const developmentHardwareMenu = createNavigationModel({ configureMenus: configureHardwareForgeMenu })
    .find(menu => menu.id === 'hardware');
  assert.equal(productionHardwareMenu.groups.flatMap(group => group.items)
    .some(item => item.href === '#hardware-forge-preview'), false);
  assert.equal(developmentHardwareMenu.groups.flatMap(group => group.items)
    .some(item => item.href === '#hardware-forge-preview'), true);
  registerHardwareForgeRoute();
  assert.deepEqual(routeFromHash('#hardware-forge-preview'), {
    view: 'page', target: 'hardware-forge-preview',
  });
  const navigation = await readFile(new URL('../src/site-navigation.js', import.meta.url), 'utf8');
  const main = await readFile(new URL('../src/main.jsx', import.meta.url), 'utf8');
  assert.match(navigation, /configureMenus/);
  assert.match(main, /import\.meta\.env\.DEV[\s\S]*import\('\.\/hardware-forge-development-integration\.js'\)/);
});
