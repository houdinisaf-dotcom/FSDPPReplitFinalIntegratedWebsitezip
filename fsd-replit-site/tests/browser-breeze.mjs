// Browser checks and optional desktop/mobile proof capture for the private FSD Breeze selector.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import draft from '../content/fsd-breeze-private/draft.json' with { type: 'json' };
import imageManifest from '../content/fsd-breeze-private/image-manifest.json' with { type: 'json' };

const domain = process.env.REPLIT_DEV_DOMAIN;
assert.ok(domain, 'REPLIT_DEV_DOMAIN must identify the running development preview.');
const captureProof = process.env.FSD_BREEZE_CAPTURE === '1';
const proofDirectory = join(process.cwd(), '../generated-artifacts/fsd-breeze-private');
if (captureProof) mkdirSync(proofDirectory, { recursive: true });
const profile = mkdtempSync(join(tmpdir(), 'fsd-breeze-browser-'));
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
    const response = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
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
    if (!captureProof) return;
    const screenshot = await send('Page.captureScreenshot', {
      format: 'jpeg',
      quality: 92,
      fromSurface: true,
      captureBeyondViewport: false,
    });
    writeFileSync(join(proofDirectory, fileName), Buffer.from(screenshot.data, 'base64'));
  };

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `https://${domain}/` });
  await waitFor('!!document.querySelector(".fsd-primary-nav") && !!document.querySelector(".breeze-preview")');

  await click('[data-division="apparel"]');
  await waitFor('document.querySelector("#fsd-showcase-dialog").open');
  await click('#fsd-showcase-dialog [data-group-index="1"]');
  await waitFor('!!document.querySelector("#fsd-showcase-dialog [data-fsd-breeze-card]")');
  assert.equal(await evaluate('document.querySelectorAll("#fsd-showcase-dialog [data-fsd-breeze-card]").length'), 1);
  assert.equal(await evaluate('document.querySelectorAll("#fsd-showcase-dialog [data-product-id=\\"49\\"]").length'), 0);
  assert.equal(await evaluate('document.querySelector("#fsd-showcase-dialog [data-fsd-breeze-card]").dataset.masterProductId'), '49');
  await evaluate('document.querySelector("#fsd-showcase-dialog [data-fsd-breeze-card]").scrollIntoView({ block: "center", behavior: "instant" })');
  await capture('collection-desktop.jpg');
  const initialScroll = await evaluate('window.scrollY');
  const opener = '#fsd-showcase-dialog [data-fsd-breeze-open]';

  await click(opener);
  await waitFor('document.querySelector(".breeze-preview").open');
  assert.equal(await evaluate('document.querySelector(".breeze-preview__title").textContent'), draft.name);
  assert.equal(await evaluate('document.querySelectorAll(".breeze-preview__swatch").length'), 6);
  assert.equal(await evaluate('document.querySelectorAll(".breeze-preview__view").length'), 4);
  assert.equal(await evaluate('document.querySelectorAll(".breeze-preview__image").length'), 1);
  assert.equal(await evaluate('document.querySelector(".breeze-preview__image").naturalWidth'), 256);
  assert.ok(await evaluate('document.querySelector(".breeze-preview__reference").textContent.includes("£64.99")'));
  assert.equal(await evaluate('document.querySelectorAll(".breeze-preview__notices").length'), 0);
  assert.ok(await evaluate('document.querySelector(".breeze-preview__product-note").textContent.includes("Product details are being finalised")'));
  assert.equal(await evaluate('document.querySelector("#fsd-showcase-dialog").open'), true);
  assert.equal(await evaluate('window.scrollY'), initialScroll);
  assert.equal(await evaluate('document.querySelectorAll(".breeze-preview form, .breeze-preview [data-purchase], .breeze-preview [data-add-to-cart]").length'), 0);
  assert.ok(await evaluate('document.querySelector(".breeze-preview__reference").textContent.includes("Reference price")'));
  await capture('desktop.jpg');

  for (const variant of imageManifest.variants) {
    await click('[data-breeze-view="front"]');
    await click(`[data-breeze-variant="${variant.id}"]`);
    for (const asset of variant.assets) {
      await click(`[data-breeze-view="${asset.view}"]`);
      await waitFor(`document.querySelector(".breeze-preview__image").src.endsWith(${JSON.stringify(`/__catalogue-preview/fsd-breeze/media/${asset.id}`)})`);
      await waitFor('document.querySelector(".breeze-preview__image").naturalWidth === 256');
      assert.equal(await evaluate('document.querySelector(".breeze-preview__current-colour").textContent'), variant.label);
      assert.equal(await evaluate('document.querySelector(".breeze-preview__current-view").textContent.toLowerCase()'), asset.view);
      assert.equal(await evaluate('document.querySelectorAll(".breeze-preview__swatch[aria-pressed=\\"true\\"]").length'), 1);
      assert.equal(await evaluate('document.querySelectorAll(".breeze-preview__view[aria-pressed=\\"true\\"]").length'), 1);
      assert.equal(await evaluate('document.querySelector(".breeze-preview__image").naturalWidth'), 256);
      assert.ok(await evaluate(`document.querySelector(".breeze-preview__image").alt.includes(${JSON.stringify(variant.label)})`));
      assert.ok(await evaluate(`document.querySelector(".breeze-preview__image").alt.toLowerCase().includes(${JSON.stringify(asset.view)})`));
      assert.doesNotMatch(await evaluate('document.querySelector(".breeze-preview__image").alt'), /draft concept image|source crop|unverified/i);
      assert.equal(await evaluate('window.scrollY'), initialScroll);
    }
  }

  const mediaCheck = await evaluate(`Promise.all([
    fetch("/__catalogue-preview/fsd-breeze/media/breeze-onyx-black-front", { method: "HEAD" }).then(response => ({
      status: response.status,
      robots: response.headers.get("X-Robots-Tag"),
      cache: response.headers.get("Cache-Control"),
      type: response.headers.get("Content-Type"),
    })),
    fetch("/__catalogue-preview/fsd-breeze/media/breeze-onyx-black-front", { method: "POST" }).then(response => response.status),
    fetch("/__catalogue-preview/fsd-breeze/media/not-a-breeze-image").then(response => response.status),
  ])`);
  assert.equal(mediaCheck[0].status, 200);
  assert.ok(mediaCheck[0].robots?.includes('noindex'));
  assert.equal(mediaCheck[0].cache, 'no-store');
  assert.ok(mediaCheck[0].type?.includes('image/jpeg'));
  assert.equal(mediaCheck[1], 405);
  assert.equal(mediaCheck[2], 404);

  await click('[data-breeze-variant="onyx-black"]');
  await click('[data-breeze-view="front"]');
  await evaluate(`(() => {
    const button = document.querySelector('[data-breeze-view="front"]');
    button.focus();
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  })()`);
  await waitFor('document.querySelector("[data-breeze-view=\\"side\\"]").getAttribute("aria-pressed") === "true"');
  assert.equal(await evaluate('document.querySelector(".breeze-preview__image").src.endsWith("/breeze-onyx-black-side")'), true);

  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await waitFor('!document.querySelector(".breeze-preview").open');
  await waitFor('document.querySelector("#fsd-showcase-dialog").open');
  await waitFor('document.activeElement.matches("[data-fsd-breeze-open]")');
  assert.equal(await evaluate('window.scrollY'), initialScroll);

  await send('Emulation.setDeviceMetricsOverride', { width: 402, height: 874, deviceScaleFactor: 1, mobile: false });
  await send('Page.reload');
  await waitFor('document.readyState === "complete"');
  await delay(300);
  await waitFor('!!document.querySelector(".fsd-primary-nav") && !!document.querySelector(".breeze-preview")');
  assert.equal(await evaluate('window.innerWidth'), 402);
  assert.ok(await evaluate('Math.abs(visualViewport.scale - 1) < 0.01'));
  await click('[data-nav-mobile-toggle]');
  await waitFor('document.body.classList.contains("fsd-mobile-nav-open")');
  await click('.fsd-mobile-primary-list [data-nav-primary="collections"]');
  await waitFor('document.querySelector("#fsd-mega-menu").dataset.step === "groups"');
  await click('#fsd-mega-menu [data-nav-group="1"]');
  await waitFor('document.querySelector("#fsd-mega-menu").dataset.step === "detail"');
  await click('#fsd-mega-menu [data-nav-item="0"]');
  await waitFor('document.querySelector("#fsd-showcase-dialog")?.open');
  await click('#fsd-showcase-dialog [data-subcategory-index="-1"]');
  await waitFor('!!document.querySelector("#fsd-showcase-dialog [data-fsd-breeze-card]")');
  await evaluate('document.querySelector("#fsd-showcase-dialog [data-fsd-breeze-card]").scrollIntoView({ block: "center", behavior: "instant" })');
  await capture('collection-mobile.jpg');
  await click(opener);
  await waitFor('document.querySelector(".breeze-preview").open');
  await click('[data-breeze-view="front"]');
  await waitFor('document.querySelector(".breeze-preview__image").naturalWidth === 256');
  await capture('mobile.jpg');
  assert.equal(await evaluate('(() => { const rect = document.querySelector(".breeze-preview").getBoundingClientRect(); return rect.left >= -1 && rect.right <= innerWidth + 1; })()'), true);
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".breeze-preview__layout")).gridTemplateColumns.trim().split(/\\s+/).length'), 1);
  assert.ok(await evaluate('document.querySelector(".breeze-preview__image").getBoundingClientRect().width <= 256.1'));
  await click('[data-breeze-variant="deep-burgundy"]');
  await waitFor('document.querySelector(".breeze-preview__image").src.endsWith("/breeze-deep-burgundy-front")');
  assert.equal(await evaluate('document.querySelector(".breeze-preview__current-colour").textContent'), 'Deep Burgundy — Combat');
  assert.equal(await evaluate('document.querySelector(".breeze-preview__current-view").textContent'), 'Front');
  await click('.breeze-preview__close');
  await waitFor('!document.querySelector(".breeze-preview").open');
  await waitFor('document.activeElement.matches("[data-fsd-breeze-open]")');
  assert.equal(await evaluate('document.body.scrollWidth <= window.innerWidth + 1'), true);
  assert.deepEqual(browserErrors, []);
  console.log('FSD Breeze browser checks passed: one linked collection record, all 24 colour/view mappings, native image size, private media, no checkout, nested Escape/focus return, and mobile layout.');
} finally {
  socket?.close();
  const chromeExit = chrome.exitCode === null ? new Promise(resolve => chrome.once('exit', resolve)) : Promise.resolve();
  chrome.kill('SIGTERM');
  await Promise.race([chromeExit, delay(2500)]);
  try {
    rmSync(profile, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 });
  } catch (error) {
    console.warn(`Temporary Chromium profile cleanup deferred: ${error.message}`);
  }
}
