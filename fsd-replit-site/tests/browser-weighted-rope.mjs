// Desktop and mobile checks for the private, dev-only weighted-rope draft review.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { once } from 'node:events';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import imageManifest from '../content/weighted-skipping-rope-images.json' with { type: 'json' };

const domain = process.env.REPLIT_DEV_DOMAIN;
assert.ok(domain, 'REPLIT_DEV_DOMAIN must identify the running development preview.');
const profile = mkdtempSync(join(tmpdir(), 'fsd-rope-browser-'));
const chrome = spawn('chromium', [
  '--headless=new', '--no-sandbox', '--disable-dev-shm-usage',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore' });
let socket;

try {
  const portFile = join(profile, 'DevToolsActivePort');
  for (let attempt = 0; !existsSync(portFile) && attempt < 100; attempt++) await delay(100);
  assert.ok(existsSync(portFile), 'Chromium did not start.');
  const port = readFileSync(portFile, 'utf8').split('\n')[0];
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  let sequence = 0;
  const pending = new Map();
  const browserErrors = [];
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const request = pending.get(message.id);
      if (!request) return;
      pending.delete(message.id);
      clearTimeout(request.timeout);
      if (message.error) request.reject(new Error(JSON.stringify(message.error)));
      else request.resolve(message.result);
    } else if (message.method === 'Runtime.exceptionThrown') {
      browserErrors.push(message.params.exceptionDetails.text);
    } else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      browserErrors.push(message.params.args.map(argument => argument.value || '').join(' '));
    }
  });

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`CDP timed out: ${method}`));
    }, 15000);
    pending.set(id, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const response = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails));
    return response.result.value;
  };
  const waitFor = async expression => {
    for (let attempt = 0; attempt < 120; attempt++) {
      if (await evaluate(expression)) return;
      await delay(100);
    }
    throw new Error(`Browser condition did not become true: ${expression}`);
  };
  const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)})?.click()`);
  const capture = async fileName => {
    if (process.env.FSD_ROPE_CAPTURE !== '1') return;
    const image = await send('Page.captureScreenshot', { format: 'jpeg', quality: 88, fromSurface: true });
    writeFileSync(join(tmpdir(), fileName), Buffer.from(image.data, 'base64'));
  };
  const previewUrl = `https://${domain}/__catalogue-preview/weighted-skipping-rope/`;
  const viewport = { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false };

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.bringToFront');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await send('Emulation.setDeviceMetricsOverride', viewport);
  await send('Page.navigate', { url: previewUrl });
  await waitFor('document.querySelector("#edition-image")?.naturalWidth === 1122 && document.querySelector("#campaign-image")?.naturalWidth === 1672');

  assert.equal(await evaluate('document.querySelector("#product-title").textContent'), 'FSD Weighted Skipping Rope');
  assert.equal(await evaluate('document.querySelector(".draft-badge").textContent.includes("DRAFT")'), true);
  assert.equal(await evaluate('document.querySelectorAll("#edition-options [data-edition]").length'), 8);
  assert.equal(await evaluate('document.querySelectorAll(".edition-frame img").length'), 1);
  assert.equal(await evaluate('document.querySelector("#edition-image").dataset.variantId'), 'matte-obsidian');
  assert.equal(await evaluate('document.querySelector("#selected-colour").textContent'), 'Matte Obsidian');
  assert.equal(await evaluate('document.querySelector("#edition-options [aria-pressed=\\"true\\"]").dataset.edition'), 'matte-obsidian');
  assert.equal(await evaluate('document.querySelectorAll("form, input, [data-add-to-cart], [data-purchase]").length'), 0);
  const fixedHero = await evaluate('document.querySelector("#campaign-image").src');
  const initialScroll = await evaluate('window.scrollY');
  await capture('fsd-rope-desktop.jpg');

  for (const variant of imageManifest.variants) {
    await click(`[data-edition="${variant.id}"]`);
    await waitFor(`document.querySelector("#edition-image").dataset.variantId === ${JSON.stringify(variant.id)}`);
    assert.equal(await evaluate('document.querySelector("#selected-colour").textContent'), variant.colour);
    assert.equal(await evaluate('document.querySelector("#edition-options [aria-pressed=\\"true\\"]")?.dataset.edition'), variant.id);
    assert.equal(await evaluate('document.querySelectorAll("#edition-options [aria-pressed=\\"true\\"]").length'), 1);
    assert.equal(await evaluate('document.querySelector("#edition-image").dataset.assetId'), variant.assetId);
    assert.equal(await evaluate('document.querySelector("#campaign-image").src'), fixedHero);
    assert.equal(await evaluate('window.scrollY'), initialScroll);
  }

  await evaluate('document.querySelector("[data-edition=\\"matte-obsidian\\"]").focus({preventScroll:true}); document.activeElement.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowRight",bubbles:true}))');
  await waitFor('document.querySelector("#edition-image").dataset.variantId === "crimson-red"');
  assert.equal(await evaluate('document.querySelector("#edition-options [aria-pressed=\\"true\\"]").dataset.edition'), 'crimson-red');
  assert.equal(await evaluate('document.querySelector("#edition-image").complete && document.querySelector("#edition-image").naturalWidth === 1122'), true);

  await send('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, deviceScaleFactor: 2, mobile: true,
  });
  await delay(150);
  assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'), true);
  assert.equal(await evaluate('document.querySelector("#campaign-image").src'), fixedHero);
  await click('[data-edition="electric-green"]');
  await waitFor('document.querySelector("#edition-image").dataset.variantId === "electric-green"');
  assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'), true);
  assert.equal(await evaluate('document.querySelectorAll(".edition-frame img").length'), 1);
  assert.equal(await evaluate('window.scrollY'), initialScroll);
  await capture('fsd-rope-mobile.jpg');

  await send('Emulation.setDeviceMetricsOverride', viewport);
  await send('Page.navigate', { url: `https://${domain}/` });
  await waitFor('!!document.querySelector(".fsd-primary-nav")');
  await click('[data-nav-primary="collections"]');
  await waitFor('[...document.querySelectorAll("#fsd-mega-menu [data-nav-item]")].some(button => button.textContent.includes("FSD Hooded Running Shell"))');
  const shellItemIndex = await evaluate('[...document.querySelectorAll("#fsd-mega-menu [data-nav-item]")].find(button => button.textContent.includes("FSD Hooded Running Shell"))?.dataset.navItem');
  assert.ok(shellItemIndex);
  await evaluate(`document.querySelector('#fsd-mega-menu [data-nav-item="${shellItemIndex}"]').dispatchEvent(new PointerEvent("pointermove",{bubbles:true,pointerType:"mouse"}))`);
  await waitFor('document.querySelector(".fsd-feature-kicker")?.textContent === "FSD / CAMPAIGN PROOF"');
  assert.equal(await evaluate('document.querySelector(".fsd-feature-cta")?.textContent.includes("OPEN CAMPAIGN PROOF")'), true);
  assert.equal(await evaluate('document.querySelector(".fsd-feature-cta")?.disabled'), false);
  await click('.fsd-feature-cta');
  await waitFor('location.pathname === "/__catalogue-preview/hooded-running-shell/"');
  await waitFor('document.querySelector("#shell-campaign-image")?.naturalWidth === 1672 && document.querySelector("#shell-campaign-image")?.naturalHeight === 941');
  assert.equal(await evaluate('document.querySelector("#shell-title").textContent.replace(/\\s+/g," ").trim()'), 'FSD Hooded Running Shell');
  assert.equal(await evaluate('document.querySelector("#shell-campaign-image").alt.includes("orange FSD Hooded Running Shell")'), true);
  assert.equal(await evaluate('document.querySelector(".shell-proof-details").innerText.includes("Colour selection is deferred.")'), true);
  assert.equal(await evaluate('document.querySelectorAll("form, input, [data-add-to-cart], [data-purchase], [data-edition]").length'), 0);
  assert.equal(await evaluate('document.querySelector(\'meta[name="robots"]\').content'), 'noindex, nofollow, noarchive');
  const privateHeaders = await evaluate('fetch(location.href).then(response => ({ robots: response.headers.get("X-Robots-Tag"), cache: response.headers.get("Cache-Control") }))');
  assert.ok(['noindex', 'nofollow', 'noarchive'].every(directive => privateHeaders.robots?.includes(directive)));
  assert.equal(privateHeaders.cache, 'no-store');
  assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'), true);
  await capture('fsd-shell-campaign-desktop.jpg');

  await send('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, deviceScaleFactor: 2, mobile: true,
  });
  await delay(150);
  assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'), true);
  assert.equal(await evaluate('document.querySelector("#shell-campaign-image").naturalWidth === 1672'), true);
  assert.equal(await evaluate('document.querySelectorAll("form, input, [data-add-to-cart], [data-purchase], [data-edition]").length'), 0);
  await capture('fsd-shell-campaign-mobile.jpg');

  await send('Page.navigate', { url: `https://${domain}/` });
  await waitFor('!!document.querySelector(".fsd-primary-nav")');
  assert.equal(await evaluate('document.body.innerText.includes("FSD Weighted Skipping Rope")'), false);
  assert.deepEqual(browserErrors, []);
  console.log('Weighted-rope and hooded-shell browser checks passed: rope preview remains intact; the shell campaign is reachable from the development-only Apparel menu and has a responsive, noindex, non-purchasable proof with colour selection deferred.');
} finally {
  socket?.close();
  const chromeExit = chrome.exitCode === null ? once(chrome, 'exit').catch(() => {}) : Promise.resolve();
  chrome.kill('SIGTERM');
  await Promise.race([chromeExit, delay(2500)]);
  try {
    rmSync(profile, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 });
  } catch (error) {
    console.warn(`Temporary Chromium profile cleanup deferred: ${error.message}`);
  }
}
