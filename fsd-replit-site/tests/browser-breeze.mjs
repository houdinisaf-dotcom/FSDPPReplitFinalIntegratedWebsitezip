// Browser checks for the public FSD Breeze set in the flagship catalogue.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const domain = process.env.REPLIT_DEV_DOMAIN;
assert.ok(domain, 'REPLIT_DEV_DOMAIN must identify the running development preview.');
const captureProof = process.env.FSD_BREEZE_CAPTURE === '1';
const proofDirectory = join(process.cwd(), '../generated-artifacts/fsd-breeze-public');
if (captureProof) mkdirSync(proofDirectory, { recursive: true });

const title = 'FSD Breeze Overshirt & Engineered Leggings Set';
const colourwayAssets = [
  ['Onyx Black', 'breeze-set-onyx-black-full-length.webp'],
  ['Deep Olive', 'breeze-set-deep-olive.webp'],
  ['Warm Taupe', 'breeze-set-warm-taupe-full-length.webp'],
  ['Slate Grey', 'breeze-set-slate-grey-full-length.webp'],
  ['Midnight Navy', 'breeze-set-midnight-navy.webp'],
  ['Deep Burgundy', 'breeze-set-deep-burgundy-full-length.webp'],
];
const galleryAssets = [
  ...colourwayAssets.map(([, file]) => `/fsd-assets/${file}`),
  '/fsd-assets/breeze-set-onyx-black-front.webp',
  '/fsd-assets/breeze-set-onyx-black-trouser-view.webp',
  '/fsd-assets/breeze-set-onyx-black.webp',
  '/fsd-assets/breeze-set-onyx-black-side.webp',
  '/fsd-assets/breeze-set-slate-grey.webp',
  '/fsd-assets/breeze-set-deep-burgundy-alt-full-length.webp',
  '/fsd-assets/breeze-set-deep-burgundy.webp',
];

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
  const setSearch = value => evaluate(`(() => {
    const input = document.querySelector('#search');
    input.value = ${JSON.stringify(value)};
    input.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  const productRowExists = `!![...document.querySelectorAll('#catalogue-grid button')]
    .find(node => node.textContent.includes(${JSON.stringify(title)}))`;
  const clickProductRow = () => evaluate(`(() => {
    const row = [...document.querySelectorAll('#catalogue-grid button')]
      .find(node => node.textContent.includes(${JSON.stringify(title)}));
    row?.click();
    return !!row;
  })()`);
  const catalogueScrollState = () => evaluate(`(() => {
    const row = [...document.querySelectorAll('#catalogue-grid button')]
      .find(node => node.textContent.includes(${JSON.stringify(title)}));
    const ancestors = [];
    for (let node = row; node; node = node.parentElement) {
      const overflowY = getComputedStyle(node).overflowY;
      if (node.scrollHeight > node.clientHeight + 1 && /(auto|scroll)/.test(overflowY)) {
        ancestors.push({ id: node.id, scrollTop: node.scrollTop });
      }
    }
    return { windowY: window.scrollY, ancestors };
  })()`);
  const imageSource = '(document.querySelector("#catalogue-expanded-73 .fsd-catalog-detail__image-stage img")?.src || "")';

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `https://${domain}/` });
  await waitFor('!!document.querySelector(".fsd-primary-nav") && !!document.querySelector("#search") && !!document.querySelector("#catalogue-grid")');
  await evaluate('document.querySelector(\'footer a[href="/#collections"]\')?.click()');
  await waitFor('location.hash === "#collections"');
  await evaluate(`document.querySelector('#catalogue-archive > summary')
    ?.scrollIntoView({ behavior: 'instant', block: 'center' })`);
  await evaluate('document.querySelector("#catalogue-archive > summary")?.click()');
  await waitFor('document.querySelector("#catalogue-archive")?.open');
  await evaluate(`(() => {
    const collection = document.querySelector('#catalogue-collection');
    collection.value = 'womens-modest-combat';
    collection.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await setSearch(title);
  await waitFor(productRowExists);
  assert.ok(await evaluate('!document.querySelector(".breeze-preview")'));
  assert.ok(await evaluate('!document.querySelector("[data-fsd-breeze-card]")'));
  assert.equal(await evaluate('document.querySelector("#catalogue-count").textContent'), 'Showing 1–1 of 1 product');

  await evaluate(`document.querySelector('#catalogue-grid button')?.scrollIntoView({ block: 'center', behavior: 'instant' })`);
  assert.equal(await clickProductRow(), true);
  await waitFor('!!document.querySelector("#catalogue-expanded-73")');
  await waitFor(`${imageSource}.endsWith("breeze-set-onyx-black-full-length.webp")`);
  await evaluate('document.querySelector("#catalogue-expanded-73 .fsd-catalog-detail__image-stage")?.scrollIntoView({ block: "center", behavior: "instant" })');
  await waitFor(`document.querySelector("#catalogue-expanded-73 .fsd-catalog-detail__image-stage img")?.naturalWidth > 0`);
  await capture('desktop-detail.jpg');

  const detailText = await evaluate('document.querySelector("#catalogue-expanded-73").textContent');
  assert.ok(detailText.includes('£145.00'));
  assert.ok(detailText.includes('absolute confidence in motion'));
  assert.ok(detailText.includes('No approved body or garment measurements'));
  assert.equal(await evaluate('document.querySelectorAll("#catalogue-expanded-73 [data-breeze-size-guidance] .fsd-catalog-detail__size-range li").length'), 5);
  assert.ok(detailText.includes('88% Performance Polyester'));
  assert.ok(detailText.includes('Machine wash cold on delicate cycle'));
  assert.ok(!/mechanical[- ]stretch|four-way mechanical stretch|fit profile/i.test(detailText));
  assert.ok(!/(CONCEPT|DRAFT|PREVIEW|PENDING REVIEW|PRIVATE VIEWING|IN DEVELOPMENT)/i.test(detailText));
  assert.equal(await evaluate('document.querySelectorAll("#catalogue-expanded-73 [data-catalogue-inline-colourway]").length'), 6);
  assert.equal(await evaluate('document.querySelectorAll("#catalogue-expanded-73 [data-catalogue-inline-view]").length'), 13);

  for (const [colourway, file] of colourwayAssets) {
    await evaluate(`(() => {
      const button = [...document.querySelectorAll('#catalogue-expanded-73 [data-catalogue-inline-colourway]')]
        .find(node => node.textContent.trim().includes(${JSON.stringify(colourway)}));
      button?.click();
    })()`);
    await waitFor(`[...document.querySelectorAll('#catalogue-expanded-73 [data-catalogue-inline-colourway]')]
      .find(node => node.textContent.trim().includes(${JSON.stringify(colourway)}))?.getAttribute('aria-pressed') === "true"`);
    const pressed = await evaluate(`[...document.querySelectorAll('#catalogue-expanded-73 [data-catalogue-inline-colourway]')]
      .find(node => node.textContent.trim().includes(${JSON.stringify(colourway)}))?.getAttribute('aria-pressed')`);
    assert.equal(pressed, 'true', `${colourway} should be selectable`);
    await waitFor(`${imageSource}.endsWith(${JSON.stringify(file)})`);
    await waitFor(`document.querySelector("#catalogue-expanded-73 .fsd-catalog-detail__image-stage img")?.naturalWidth > 0`);
  }
  await evaluate(`(() => {
    const view = [...document.querySelectorAll('#catalogue-expanded-73 [data-catalogue-inline-view]')]
      .find(node => node.textContent.includes('Onyx Black · alternate view'));
    view?.click();
  })()`);
  await waitFor(`${imageSource}.endsWith("breeze-set-onyx-black-side.webp")`);
  assert.equal(await evaluate(`[...document.querySelectorAll('#catalogue-expanded-73 [data-catalogue-inline-colourway]')]
    .find(node => node.textContent.trim().includes('Onyx Black'))?.getAttribute('aria-pressed')`), 'true');

  const imageStatuses = await evaluate(`Promise.all(${JSON.stringify(galleryAssets)}.map(src =>
    fetch(src, { method: 'HEAD' }).then(response => response.status)))`);
  assert.deepEqual(imageStatuses, Array(galleryAssets.length).fill(200));

  await evaluate(`document.querySelector('#catalogue-grid button')?.scrollIntoView({ block: 'center', behavior: 'instant' })`);
  await evaluate('window.scrollBy(0, -200)');
  const expandedScrollState = await catalogueScrollState();
  assert.equal(await clickProductRow(), true);
  await waitFor('!document.querySelector("#catalogue-expanded-73")');
  assert.deepEqual(await catalogueScrollState(), expandedScrollState);

  await setSearch("FSD Women's Lightweight Modest Training Overshirt");
  await waitFor('!![...document.querySelectorAll("#catalogue-grid button")].find(node => node.textContent.includes("FSD Women"))');
  assert.ok(await evaluate(`[...document.querySelectorAll('#catalogue-grid button')]
    .find(node => node.textContent.includes('FSD Women'))?.textContent.includes('£64.99')`));
  assert.ok(await evaluate(`[...document.querySelectorAll('#catalogue-grid button')]
    .find(node => node.textContent.includes('FSD Women'))?.textContent.includes('Lightweight Modest Training Overshirt')`));
  assert.ok(await evaluate(`![...document.querySelectorAll('#catalogue-grid button')]
    .find(node => node.textContent.includes('FSD Women'))?.textContent.includes('Engineered Leggings Set')`));

  await setSearch(title);
  await waitFor(productRowExists);
  await clickProductRow();
  await waitFor('!!document.querySelector("#catalogue-expanded-73")');
  await send('Emulation.setDeviceMetricsOverride', { width: 402, height: 874, deviceScaleFactor: 1, mobile: false });
  await delay(150);
  const mobileLayout = await evaluate(`(() => {
    const detail = document.querySelector('#catalogue-expanded-73');
    const rect = detail.getBoundingClientRect();
    return {
      width: innerWidth,
      scrollWidth: document.body.scrollWidth,
      left: rect.left,
      right: rect.right,
      imageWidth: detail.querySelector('.fsd-catalog-detail__image-stage').getBoundingClientRect().width,
    };
  })()`);
  assert.equal(mobileLayout.width, 402);
  assert.ok(mobileLayout.scrollWidth <= mobileLayout.width + 1);
  assert.ok(mobileLayout.left >= -1 && mobileLayout.right <= mobileLayout.width + 1);
  assert.ok(mobileLayout.imageWidth > 0);
  await capture('mobile-detail.jpg');

  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `https://${domain}/?product=73#products` });
  await waitFor('document.querySelector("#product-dialog")?.open');
  await waitFor('document.querySelector("#product-dialog").textContent.includes("ENGINEERING & SPECIFICATIONS")');
  const deepDiveText = await evaluate('document.querySelector("#product-dialog").textContent');
  assert.ok(deepDiveText.includes('£145.00'));
  assert.ok(deepDiveText.includes('One Lightweight Modest Training Overshirt'));
  assert.ok(deepDiveText.includes('No approved body or garment measurements'));
  assert.equal(await evaluate('document.querySelectorAll("#product-dialog [data-breeze-size-guidance] .product-size-guidance__range li").length'), 5);
  assert.ok(deepDiveText.includes('88% Performance Polyester'));
  assert.ok(deepDiveText.includes('Machine wash cold on delicate cycle'));
  assert.ok(!/mechanical[- ]stretch|four-way mechanical stretch|Fit profile/i.test(deepDiveText));
  assert.equal(
    await evaluate('Boolean(document.querySelector(\'#product-dialog [data-bag-add="73"]\'))'),
    false,
    'The Breeze set has no confirmed SKU or stock, so its bag controls stay unavailable.',
  );
  assert.ok(await evaluate('document.querySelector("#product-dialog").textContent.includes("Notify me when available")'));
  await evaluate('document.querySelector("#product-dialog [data-size-guide]")?.click()');
  await waitFor('document.querySelector("#fsd-size-guide-dialog")?.open');
  const sizeGuideText = await evaluate('document.querySelector("#fsd-size-guide-dialog").textContent');
  assert.ok(sizeGuideText.includes('XS'));
  assert.ok(sizeGuideText.includes('XL'));
  assert.ok(sizeGuideText.includes('No approved body or garment measurements'));
  assert.equal(await evaluate('document.querySelectorAll("#fsd-size-guide-dialog table").length'), 0);
  await evaluate('document.querySelector("#fsd-size-guide-dialog [data-size-guide-close]")?.click()');
  await waitFor('!document.querySelector("#fsd-size-guide-dialog")?.open');
  const taupeImageIndex = await evaluate(`Number([...document.querySelectorAll('#product-dialog [data-catalogue-colourway-index]')]
    .find(input => input.value === 'Warm Taupe')?.dataset.catalogueColourwayImageIndex)`);
  assert.ok(taupeImageIndex >= 0);
  await evaluate(`document.querySelector('#product-dialog [data-catalogue-colourway-index="2"]')?.click()`);
  await waitFor('document.querySelector("#product-dialog [data-catalogue-main-image]")?.src.endsWith("breeze-set-warm-taupe-full-length.webp")');
  assert.deepEqual(browserErrors, []);
  console.log('FSD Breeze browser checks passed: public price and specifications, six selectable colourways, 13 mapped views, separate £64.99 overshirt, no collage boards, no private preview, and responsive inline detail.');
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
