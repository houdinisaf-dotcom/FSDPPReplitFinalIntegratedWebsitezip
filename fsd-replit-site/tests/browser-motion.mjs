import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const domain = process.env.REPLIT_DEV_DOMAIN;
assert.ok(domain, 'REPLIT_DEV_DOMAIN must identify the running development preview.');
const captureProofs = process.env.FSD_MOTION_CAPTURE === '1';
const profile = mkdtempSync(join(tmpdir(), 'fsd-motion-browser-'));
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
    const viewport = await evaluate(`({
      width: document.documentElement.clientWidth || window.innerWidth,
      height: Math.round(window.visualViewport?.height || document.documentElement.clientHeight || window.innerHeight)
    })`);
    const image = await send('Page.captureScreenshot', {
      format: 'jpeg',
      quality: 88,
      fromSurface: true,
    });
    const outputDir = join(process.cwd(), '../generated-artifacts/fsd-motion');
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(join(outputDir, fileName), Buffer.from(image.data, 'base64'));
    console.log(`Saved FSD MOTION proof: ${join(outputDir, fileName)}`);
  };

  await send('Page.enable');
  await send('Runtime.enable');

  await navigate('/__catalogue-preview/fsd-motion/');
  await waitFor('document.querySelectorAll("[data-motion-gallery-select]").length === 15');
  await captureProof('collection-desktop.jpg');
  await evaluate('document.querySelector(".motion-lineup")?.scrollIntoView({block:"start"})');
  await delay(250);
  await captureProof('collection-products-desktop.jpg');
  await evaluate('window.scrollTo(0, 0)');
  assert.equal(await evaluate('document.title'), 'FSD MOTION Smart Training Apparel | FSD');
  assert.match(await evaluate('document.querySelector("meta[name=robots]")?.content'), /noindex/);
  assert.equal(await evaluate('document.querySelectorAll("[data-motion-gallery-select]").length'), 15);
  assert.equal(await evaluate('document.querySelectorAll("[data-motion-product-link]").length'), 4);
  assert.doesNotMatch(await evaluate('document.body.innerText'), /CONCEPT|DRAFT|PREVIEW|PENDING REVIEW|PRIVATE VIEWING/i);
  assert.ok(await evaluate('document.querySelector(".motion-back-collection")'));
  assert.doesNotMatch(await evaluate('document.body.innerText'), /PRIVATE PRODUCT PROOF|PRIVATE CONCEPT REVIEW|DRAFT \/ PENDING APPROVAL/);

  await click('[data-motion-gallery-select="smart-sensors"]');
  await waitFor('document.querySelector("[data-motion-active-image]")?.src.endsWith("/media/smart-sensors")');
  assert.equal(await evaluate('document.querySelector("[data-motion-gallery-select=smart-sensors]")?.getAttribute("aria-pressed")'), 'true');
  await click('[data-motion-enlarge]');
  await waitFor('document.querySelector("[data-motion-dialog]")?.open');
  assert.match(await evaluate('document.querySelector("[data-motion-dialog-image]")?.src'), /smart-sensors$/);
  await click('[data-motion-close]');
  await waitFor('!document.querySelector("[data-motion-dialog]")?.open');

  const productRoutes = [
    ['mens-performance-training-top', 'men-apparel'],
    ['womens-performance-sports-bra', 'women-apparel'],
    ['performance-training-shorts', 'product-lineup'],
    ['smart-training-arm-sleeves', 'lifestyle-outdoors'],
  ];
  for (const [slug, firstImageId] of productRoutes) {
    await navigate(`/__catalogue-preview/fsd-motion/products/${slug}/`);
    await waitFor('document.querySelector("[data-motion-active-image]")');
    await captureProof(`product-${slug}-desktop.jpg`);
    assert.match(await evaluate('document.body.innerText'), /BACK TO MOTION COLLECTION/);
    assert.match(await evaluate('document.body.innerText'), /Part of the FSD MOTION collection\./);
    assert.doesNotMatch(await evaluate('document.body.innerText'), /CONCEPT|DRAFT|PREVIEW|PENDING REVIEW|PRIVATE VIEWING/i);
    assert.doesNotMatch(await evaluate('document.body.innerText'), /Capabilities and performance statements are unverified|private visual preview|CLEAN PRODUCT PHOTOGRAPHY PENDING|MEN’S APPAREL CROP/i);
    assert.match(await evaluate('document.querySelector("[data-motion-active-image]")?.src'), new RegExp(`/media/${firstImageId}$`));
    assert.ok(await evaluate('document.querySelectorAll("[data-motion-gallery-select]").length >= 3'));
    assert.equal(await evaluate('document.querySelectorAll("[data-motion-product-link]").length'), 4);
    assert.equal(await evaluate('document.querySelectorAll("button[data-purchase], button[data-checkout], .add-to-cart").length'), 0);
    await click('[data-motion-gallery-select]:not([aria-pressed="true"])');
    await waitFor('document.querySelector("[data-motion-gallery-select][aria-pressed=true]")');
    assert.match(await evaluate('document.querySelector("[data-motion-active-image]")?.src'), /\/media\//);
  }

  const invalidRouteStatus = await evaluate(`fetch("/__catalogue-preview/fsd-motion/products/not-a-real-product/").then(response => response.status)`);
  assert.equal(invalidRouteStatus, 404);

  await navigate('/');
  await waitFor('document.querySelector("[data-division=bio-lab]")');
  await click('[data-division="bio-lab"]');
  await waitFor('document.querySelector("[data-showcase-dialog]")?.open');
  await waitFor('document.querySelector("[data-motion-draft-card]")');
  assert.equal(await evaluate('document.querySelector("[data-motion-draft-card] a")?.getAttribute("href")'), '/__catalogue-preview/fsd-motion/');
  await evaluate('document.querySelector("[data-motion-draft-card]")?.scrollIntoView({block:"center"})');
  await delay(250);
  await captureProof('homepage-collection-card-desktop.jpg');

  await send('Emulation.setDeviceMetricsOverride', {
    width: 402, height: 874, deviceScaleFactor: 1, mobile: true,
  });
  await navigate('/__catalogue-preview/fsd-motion/');
  await waitFor('document.querySelectorAll("[data-motion-gallery-select]").length === 15');
  await captureProof('collection-mobile.jpg');
  await evaluate('window.scrollTo(0, Math.max(0, document.querySelector(".motion-lineup").getBoundingClientRect().top + window.scrollY - 70))');
  await delay(250);
  await captureProof('collection-cards-mobile.jpg');
  const collectionDimensions = await evaluate(`({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth
  })`);
  assert.ok(collectionDimensions.scrollWidth <= collectionDimensions.width + 1,
    `Mobile horizontal overflow on collection: ${JSON.stringify(collectionDimensions)}`);

  for (const [slug] of productRoutes) {
    await navigate(`/__catalogue-preview/fsd-motion/products/${slug}/`);
    await waitFor('document.querySelector("[data-motion-active-image]")');
    await evaluate('window.scrollTo(0, Math.max(0, document.querySelector(".motion-detail-art").getBoundingClientRect().top + window.scrollY - 80))');
    await delay(250);
    await captureProof(`product-${slug}-mobile-gallery.jpg`);
    const dimensions = await evaluate(`({
      width: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth
    })`);
    assert.ok(dimensions.scrollWidth <= dimensions.width + 1, `Mobile horizontal overflow on ${slug}: ${JSON.stringify(dimensions)}`);
  }

  console.log('FSD MOTION browser checks passed: private collection, 15 selectable references, lightbox, four product galleries, homepage draft card, and mobile overflow.');
  if (browserErrors.length) console.log(`Browser exceptions observed: ${browserErrors.join(' | ')}`);
} finally {
  socket?.close();
  chrome.kill();
  if (chrome.exitCode === null) {
    await Promise.race([
      new Promise(resolve => chrome.once('exit', resolve)),
      delay(2000),
    ]);
  }
  rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
}
