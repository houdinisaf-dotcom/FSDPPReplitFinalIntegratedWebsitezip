import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const domain = process.env.REPLIT_DEV_DOMAIN;
assert.ok(domain, 'REPLIT_DEV_DOMAIN must identify the running development preview.');
const profile = mkdtempSync(join(tmpdir(), 'fsd-aeroforge-browser-'));
const chrome = spawn('chromium', [
  '--headless=new', '--no-sandbox', '--disable-dev-shm-usage',
  '--window-size=1440,1000',
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
  const navigate = async path => {
    await send('Page.navigate', { url: `https://${domain}${path}` });
    await waitFor('document.readyState === "complete"');
  };
  const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)})?.click()`);

  await send('Page.enable');
  await send('Runtime.enable');
  await navigate('/__catalogue-preview/aeroforge/');
  await waitFor('document.querySelector(".af-preview") && document.querySelector("#af-collection-title")');
  assert.equal(await evaluate('document.querySelector("meta[name=robots]")?.content'), 'noindex, nofollow, noarchive');
  assert.equal(await evaluate('document.querySelectorAll(".af-product-link").length'), 2);
  assert.equal(await evaluate('document.querySelectorAll(".af-manifest-row").length'), 0);
  const fixedHero = await evaluate('document.querySelector(".af-campaign-image img")?.src');
  assert.ok(fixedHero.includes('aeroforge-collection-hero'));

  await click('[data-af-open="top"]');
  await waitFor('document.querySelector(".af-selector[open] .af-selector__title")?.textContent.includes("Training Top")');
  assert.equal(await evaluate('document.querySelectorAll(".af-selector[open] [data-af-variant]").length'), 6);
  await click('.af-selector[open] [data-af-variant="navy"]');
  await waitFor('document.querySelector(".af-selector[open] [data-af-image]")?.src.includes("aeroforge-outfit-navy")');
  assert.equal(await evaluate('document.querySelector(".af-selector[open] [data-af-colour]")?.textContent'), 'Navy');
  await click('.af-selector[open] [data-af-detail="collar-zip"]');
  await waitFor('document.querySelector(".af-selector[open] [data-af-image]")?.src.includes("aeroforge-detail-collar-zip")');
  await click('.af-selector[open] [data-af-variant="mauve"]');
  await waitFor('document.querySelector(".af-selector[open] [data-af-image]")?.src.includes("aeroforge-outfit-mauve-rear")');
  assert.equal(await evaluate('document.querySelectorAll("[data-af-variant-note]").length'), 0);
  assert.doesNotMatch(await evaluate('document.body.innerText'), /front image pending|rear image pending/i);
  await click('.af-selector[open] [data-af-close]');
  await waitFor('!document.querySelector(".af-selector[open]")');
  await waitFor('document.querySelector("#af-collection-title")');
  assert.equal(await evaluate('document.querySelector(".af-campaign-image img")?.src'), fixedHero);

  await click('[data-af-open="joggers"]');
  await waitFor('document.querySelector(".af-selector[open] .af-selector__title")?.textContent.includes("Joggers")');
  assert.equal(await evaluate('document.querySelectorAll(".af-selector[open] [data-af-variant]").length'), 6);
  assert.equal(await evaluate('document.querySelectorAll(".af-selector[open] [data-af-detail]").length'), 0);
  await click('.af-selector[open] [data-af-variant="mauve"]');
  await waitFor('document.querySelector(".af-selector[open] [data-af-image]")?.src.includes("aeroforge-outfit-mauve-rear")');
  assert.match(await evaluate('document.querySelector(".af-selector[open] [data-af-image-note]")?.textContent'), /OUTFIT REFERENCE/);
  assert.equal(await evaluate('document.querySelectorAll("button").length > 0'), true);
  assert.equal(await evaluate('Array.from(document.querySelectorAll("button")).some(button => /buy now|add to cart|checkout/i.test(button.textContent))'), false);

  await send('Emulation.setDeviceMetricsOverride', {
    width: 402, height: 874, deviceScaleFactor: 1, mobile: true,
  });
  await delay(150);
  assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true);
  assert.equal(await evaluate('document.querySelectorAll(".af-selector[open] [data-af-variant]").length'), 6);
  assert.deepEqual(browserErrors, []);
  console.log('AeroForge browser checks passed: private noindex route, fixed hero, six-colour switching, detail switching, image-gap notes kept off the page, jogger outfit reference, no purchase controls, and 402px overflow check.');
} finally {
  socket?.close();
  const chromeExited = chrome.exitCode !== null || chrome.signalCode !== null
    ? Promise.resolve()
    : new Promise(resolve => chrome.once('exit', resolve));
  chrome.kill('SIGTERM');
  await Promise.race([chromeExited, delay(1500)]);
  rmSync(profile, { recursive: true, force: true });
}
