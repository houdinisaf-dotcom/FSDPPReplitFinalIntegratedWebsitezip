// Browser checks for the development-only Modest Flow selector.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import draft from '../content/modest-flow-private/draft.json' with { type: 'json' };

const domain = process.env.REPLIT_DEV_DOMAIN;
assert.ok(domain, 'REPLIT_DEV_DOMAIN must identify the running development preview.');
const profile = mkdtempSync(join(tmpdir(), 'fsd-modest-flow-browser-'));
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

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `https://${domain}/` });
  await waitFor('!!document.querySelector(".fsd-primary-nav") && !!document.querySelector(".mf-selector")');

  await click('[data-division="apparel"]');
  await waitFor('document.querySelector("#fsd-showcase-dialog").open');
  await click('#fsd-showcase-dialog [data-group-index="1"]');
  await waitFor('!!document.querySelector("#fsd-showcase-dialog [data-modest-flow-draft-card]")');
  const heroSrc = await evaluate('document.querySelector("[data-modest-flow-draft-card] img").src');
  assert.ok(heroSrc.endsWith('/modest-flow/media/modest-flow-campaign-hero'));
  const initialScroll = await evaluate('window.scrollY');

  const opener = '#fsd-showcase-dialog [data-modest-flow-open]';
  await click(opener);
  await waitFor('document.querySelector(".mf-selector").open');
  assert.equal(await evaluate('document.querySelector(".mf-selector__title").textContent'), 'FSD Modest Flow');
  assert.equal(await evaluate('document.querySelector(".mf-selector__subtitle").textContent'), "Women's Modest Performance Activewear Set");
  assert.equal(await evaluate('document.querySelectorAll(".mf-selector__swatch").length'), 6);
  assert.equal(await evaluate('document.querySelectorAll(".mf-selector__image").length'), 1);
  assert.equal(await evaluate('document.querySelector(".mf-selector__image").src.endsWith("/modest-flow/media/modest-flow-onyx-black")'), true);
  assert.equal(await evaluate('document.querySelector("#fsd-showcase-dialog").open'), true);
  assert.equal(await evaluate('document.querySelector("[data-modest-flow-draft-card] img").src'), heroSrc);
  assert.equal(await evaluate('window.scrollY'), initialScroll);
  assert.equal(await evaluate('document.querySelectorAll(".mf-selector form, .mf-selector input, .mf-selector [data-purchase], .mf-selector [data-add-to-cart]").length'), 0);

  for (const variant of draft.product.variants) {
    await click(`[data-mf-variant="${variant.id}"]`);
    await waitFor(`document.querySelector(".mf-selector__image").src.endsWith(${JSON.stringify(`/modest-flow/media/${variant.assetId}`)})`);
    await waitFor('document.querySelector(".mf-selector__image").naturalWidth === 1122');
    assert.equal(await evaluate('document.querySelector(".mf-selector__current-colour").textContent'), variant.colour);
    assert.equal(await evaluate('document.querySelectorAll(".mf-selector__swatch[aria-pressed=\\"true\\"]").length'), 1);
    assert.equal(await evaluate(`document.querySelector('[data-mf-variant="${variant.id}"]').getAttribute("aria-pressed")`), 'true');
    assert.equal(await evaluate('document.querySelector("[data-modest-flow-draft-card] img").src'), heroSrc);
    assert.equal(await evaluate('document.querySelectorAll(".mf-selector__image").length'), 1);
    assert.equal(await evaluate('window.scrollY'), initialScroll);
  }

  const mediaCheck = await evaluate(`Promise.all([
    fetch(${JSON.stringify(heroSrc)}, { method: "HEAD" }).then(response => ({
      status: response.status,
      robots: response.headers.get("X-Robots-Tag"),
      cache: response.headers.get("Cache-Control"),
    })),
    fetch("/__catalogue-preview/modest-flow/media/modest-flow-onyx-black", { method: "POST" }).then(response => response.status),
  ])`);
  assert.equal(mediaCheck[0].status, 200);
  assert.ok(mediaCheck[0].robots?.includes('noindex'));
  assert.equal(mediaCheck[0].cache, 'no-store');
  assert.equal(mediaCheck[1], 405);

  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await waitFor('!document.querySelector(".mf-selector").open');
  await delay(200);
  console.log('Focus after Escape:', await evaluate('({tag: document.activeElement.tagName, className: document.activeElement.className, id: document.activeElement.id, label: document.activeElement.getAttribute("aria-label"), expanded: document.querySelector("[data-modest-flow-open]")?.getAttribute("aria-expanded"), parentOpen: document.querySelector("#fsd-showcase-dialog").open})'));
  assert.equal(await evaluate('document.activeElement.matches("[data-modest-flow-open]")'), true);
  assert.equal(await evaluate('window.scrollY'), initialScroll);

  await send('Emulation.setDeviceMetricsOverride', { width: 402, height: 874, deviceScaleFactor: 2, mobile: true });
  await click(opener);
  await waitFor('document.querySelector(".mf-selector").open');
  await waitFor('document.querySelector(".mf-selector__image").naturalWidth === 1122');
  assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'), true);
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".mf-selector__layout")).gridTemplateColumns.trim().split(/\\s+/).length'), 1);
  assert.equal(await evaluate('document.querySelectorAll(".mf-selector__swatch").length'), 6);
  await click('[data-mf-variant="deep-olive-earth"]');
  await waitFor('document.querySelector(".mf-selector__image").src.endsWith("/modest-flow/media/modest-flow-deep-olive")');
  await waitFor('document.querySelector(".mf-selector__image").naturalWidth === 1122');
  assert.equal(await evaluate('document.querySelector(".mf-selector__current-colour").textContent'), 'Deep Olive (Earth)');
  assert.equal(await evaluate('document.querySelector("[data-modest-flow-draft-card] img").src'), heroSrc);
  await click('.mf-selector__close');
  await waitFor('!document.querySelector(".mf-selector").open');
  await waitFor('document.activeElement.matches("[data-modest-flow-open]")');
  assert.equal(await evaluate('document.activeElement.matches("[data-modest-flow-open]")'), true);
  assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'), true);
  assert.deepEqual(browserErrors, []);
  console.log('FSD Modest Flow browser checks passed: fixed hero, six image mappings, modal interactions, draft/no-checkout safeguards, read-only private media, focus return, and mobile layout.');
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
