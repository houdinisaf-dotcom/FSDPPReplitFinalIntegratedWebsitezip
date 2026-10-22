import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const domain = process.env.REPLIT_DEV_DOMAIN;
assert.ok(domain, 'REPLIT_DEV_DOMAIN must identify the running development preview.');
const captureProofs = process.env.FSD_NEXUS_CAPTURE === '1';
const profile = mkdtempSync(join(tmpdir(), 'fsd-nexus-browser-'));
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
  const captureProof = async fileName => {
    if (!captureProofs) return;
    const image = await send('Page.captureScreenshot', { format: 'jpeg', quality: 88, fromSurface: true });
    const outputDir = join(process.cwd(), '../generated-artifacts/fsd-nexus-preview');
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(join(outputDir, fileName), Buffer.from(image.data, 'base64'));
    console.log(`Saved FSD NEXUS proof: ${join(outputDir, fileName)}`);
  };

  await send('Page.enable');
  await send('Runtime.enable');

  const previewPath = '/__catalogue-preview/fsd-nexus/';
  await navigate(previewPath);
  await waitFor('document.querySelectorAll("[data-nexus-gallery-select]").length === 3');
  await waitFor('document.querySelector("[data-nexus-active-image]")?.complete && document.querySelector("[data-nexus-active-image]")?.naturalWidth > 0');
  await captureProof('concept-desktop.jpg');
  assert.match(await evaluate('document.title'), /FSD NEXUS.*Concept/);
  assert.match(await evaluate('document.querySelector("meta[name=robots]")?.content'), /noindex/);
  assert.match(await evaluate('document.body.innerText'), /FSD NEXUS CONCEPT/);
  assert.match(await evaluate('document.body.innerText'), /FSD NEXUS CONCEPT/);
  assert.ok(await evaluate('document.querySelector(".nexus-back-collection")'));
  assert.equal(await evaluate('document.querySelectorAll("[data-nexus-audit-gallery-select], .nexus-audit-ledger-row").length'), 0);
  assert.match(await evaluate('document.querySelector(".nexus-app-warning")?.textContent'), /Scores shown are concept artwork, not live data/);
  assert.doesNotMatch(await evaluate('document.body.innerText'), /PRIVATE PRODUCT PROOF|PRIVATE CONCEPT REVIEW|DRAFT \/ PENDING APPROVAL|BRAND CORRECTION REQUIRED|PRIVATE REVIEW REFERENCE/);
  assert.match(await evaluate('document.body.innerText'), /CONCEPT DIRECTION/);
  const featureStatuses = await evaluate(`Array.from(document.querySelectorAll(".nexus-feature-list small"), node => node.textContent.trim())`);
  assert.equal(featureStatuses.length, 7);
  assert.ok(featureStatuses.every(status => status === 'CONCEPT DIRECTION'));
  const conditionStatuses = await evaluate(`Array.from(document.querySelectorAll(".nexus-gates small"), node => node.textContent.trim())`);
  assert.equal(conditionStatuses.length, 5);
  assert.ok(conditionStatuses.every(status => status === 'KEY CONSIDERATION'));
  assert.doesNotMatch(await evaluate('document.body.innerText'), /FUTURE REVIEW|CONCEPT REFERENCE|PENDING TECHNICAL VALIDATION|NOT VERIFIED/i);
  assert.equal(await evaluate('document.querySelectorAll("button[data-purchase], button[data-checkout], .add-to-cart, form").length'), 0);
  assert.doesNotMatch(await evaluate('document.body.innerText'), /ADD TO CART|BUY NOW|CHECKOUT NOW|£\s?\d/i);

  const responseHeaders = await evaluate(`fetch(${JSON.stringify(previewPath)}).then(response => ({
    status: response.status,
    robots: response.headers.get("x-robots-tag"),
    cache: response.headers.get("cache-control"),
  }))`);
  assert.equal(responseHeaders.status, 200);
  assert.match(responseHeaders.robots, /noindex, nofollow, noarchive/);
  assert.equal(responseHeaders.cache, 'no-store');

  const assetChecks = await evaluate(`Promise.all([
    ["app-interface", "image/png"],
    ["proposed-features", "image/jpeg"],
    ["progression-conditions", "image/jpeg"],
  ].map(async ([id, type]) => {
    const response = await fetch(${JSON.stringify(previewPath)} + "media/" + id);
    return { id, status: response.status, type: response.headers.get("content-type") };
  }))`);
  assert.deepEqual(assetChecks.map(({ status, type }) => [status, type]), [
    [200, 'image/png'],
    [200, 'image/jpeg'],
    [200, 'image/jpeg'],
  ]);
  const auditChecks = await evaluate(`Promise.all([
    "full-campaign-reference",
    "hero-athlete-ring",
    "ring-product-closeup",
    "fitness-lifestyle",
    "sleep-recovery-lifestyle",
    "app-interface-original",
    "ring-charging-case",
    "ring-macro-detail",
  ].map(async id => {
    const response = await fetch(${JSON.stringify(previewPath)} + "media/audit/" + id);
    return { id, status: response.status, type: response.headers.get("content-type"), cache: response.headers.get("cache-control") };
  }))`);
  assert.deepEqual(auditChecks.map(({ status, type, cache }) => [status, type, cache]), Array.from({ length: 8 }, () => [200, 'image/jpeg', 'no-store']));
  assert.equal(await evaluate(`fetch(${JSON.stringify(previewPath)} + "media/audit/not-approved").then(response => response.status)`), 404);
  assert.equal(await evaluate(`fetch(${JSON.stringify(previewPath)} + "media/full-campaign-reference").then(response => response.status)`), 404);
  assert.equal(await evaluate(`fetch(${JSON.stringify(previewPath)} + "products/not-a-product/").then(response => response.status)`), 404);
  assert.equal(await evaluate(`fetch(${JSON.stringify(previewPath)}, { method: "POST" }).then(response => response.status)`), 405);

  await click('[data-nexus-gallery-select="proposed-features"]');
  await waitFor('document.querySelector("[data-nexus-active-image]")?.src.endsWith("/media/proposed-features")');
  assert.equal(await evaluate('document.querySelector("[data-nexus-gallery-select=proposed-features]")?.getAttribute("aria-pressed")'), 'true');
  assert.match(await evaluate('document.querySelector("[data-nexus-active-note]")?.textContent'), /FEATURE CONCEPT/);
  await evaluate('document.querySelector(".nexus-evidence")?.scrollIntoView({block:"start"})');
  await delay(250);
  await captureProof('concept-gallery-desktop.jpg');
  await evaluate('document.querySelector(".nexus-capabilities")?.scrollIntoView({block:"start"})');
  await delay(250);
  await captureProof('feature-verification-desktop.jpg');
  await evaluate('document.querySelector(".nexus-evidence")?.scrollIntoView({block:"start"})');
  await delay(250);
  await click('[data-nexus-enlarge]');
  await waitFor('document.querySelector("[data-nexus-dialog]")?.open');
  assert.match(await evaluate('document.querySelector("[data-nexus-dialog-image]")?.src'), /proposed-features$/);
  await click('[data-nexus-close]');
  await waitFor('!document.querySelector("[data-nexus-dialog]")?.open');

  await navigate('/');
  await waitFor('document.querySelector("[data-division=\\\"bio-lab\\\"]")');
  await delay(350);
  await click('[data-division="bio-lab"]');
  await waitFor('document.querySelector("#fsd-showcase-dialog")?.open');
  await waitFor('document.querySelector("[data-nexus-draft-card]")');
  assert.equal(await evaluate('document.querySelector("[data-nexus-draft-card] a")?.getAttribute("href")'), previewPath);
  await evaluate('document.querySelector("[data-nexus-draft-card]")?.scrollIntoView({block:"center"})');
  await delay(250);
  await captureProof('biolab-card-desktop.jpg');

  await send('Emulation.setDeviceMetricsOverride', { width: 402, height: 874, deviceScaleFactor: 1, mobile: true });
  await navigate(previewPath);
  await waitFor('document.querySelectorAll("[data-nexus-gallery-select]").length === 3');
  await captureProof('concept-mobile.jpg');
  await evaluate('document.querySelector(".nexus-evidence")?.scrollIntoView({block:"start"})');
  await delay(250);
  await captureProof('concept-gallery-mobile.jpg');
  await evaluate('document.querySelector(".nexus-capabilities")?.scrollIntoView({block:"start"})');
  await delay(250);
  await captureProof('feature-verification-mobile.jpg');
  const dimensions = await evaluate(`({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  })`);
  assert.ok(dimensions.scrollWidth <= dimensions.width + 1, `Mobile horizontal overflow: ${JSON.stringify(dimensions)}`);

  assert.equal(browserErrors.length, 0, `Browser exceptions: ${browserErrors.join(' | ')}`);
  console.log('FSD NEXUS browser checks passed: private read-only route, separate approved/audit galleries, eight private reference images, all 11 audit findings, pending feature labels, lightbox, Bio-Lab draft card, and mobile overflow.');
} finally {
  socket?.close();
  chrome.kill('SIGTERM');
  if (chrome.exitCode === null && chrome.signalCode === null) {
    await Promise.race([
      new Promise(resolve => chrome.once('exit', resolve)),
      delay(3000),
    ]);
  }
  rmSync(profile, { recursive: true, force: true, maxRetries: 12, retryDelay: 100 });
}
