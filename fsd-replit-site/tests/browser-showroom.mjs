// Run against the running Replit workflow. Uses system Chromium and Node's CDP
// WebSocket support, with no browser-test package or downloaded browser needed.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const domain = process.env.REPLIT_DEV_DOMAIN;
assert.ok(domain, 'REPLIT_DEV_DOMAIN must identify the running development preview.');
const mobileProofCapture = process.env.FSD_HIJAB_MOBILE_CAPTURE === '1';
const popupOnly = process.env.FSD_POPUP_ONLY === '1';
const aegisProofCapture = process.env.FSD_AEGIS_CAPTURE === '1';
const alightProofCapture = process.env.FSD_ALIGHT_CAPTURE === '1';
const alightMobileCapture = process.env.FSD_ALIGHT_MOBILE_CAPTURE === '1';
const profile = mkdtempSync(join(tmpdir(), 'fsd-browser-'));
const chrome = spawn('chromium', [
  '--headless=new', '--no-sandbox', '--disable-dev-shm-usage',
  `--window-size=${mobileProofCapture || alightMobileCapture ? '402,874' : '1440,1000'}`,
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
      if (message.error) request.reject(new Error(`${request.method}: ${JSON.stringify(message.error)}`));
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
    pending.set(id, { resolve, reject, timeout, method });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const response = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails));
    return response.result.value;
  };
  const isNavigationRace = error => /Inspected target navigated or closed/.test(error?.message || '');
  const waitFor = async expression => {
    for (let attempt = 0; attempt < 100; attempt++) {
      try {
        if (await evaluate(expression)) return;
      } catch (error) {
        if (!isNavigationRace(error)) throw error;
      }
      await delay(100);
    }
    throw new Error(`Browser condition did not become true: ${expression}`);
  };
  const click = async selector => {
    try {
      return await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
    } catch (error) {
      if (!isNavigationRace(error)) throw error;
    }
  };
  const captureHijabProof = async (fileName, fullPage = false) => {
    if (process.env.FSD_HIJAB_CAPTURE !== '1') return;
    let clip;
    if (fullPage) {
      const metrics = await send('Page.getLayoutMetrics');
      const content = metrics.cssContentSize || metrics.contentSize;
      const viewportWidth = await evaluate('document.documentElement.clientWidth || window.innerWidth');
      clip = { x: 0, y: 0, width: viewportWidth, height: content.height, scale: 1 };
    } else {
      const viewport = await evaluate(`({
        width: document.documentElement.clientWidth || window.innerWidth,
        height: Math.round(window.visualViewport?.height || document.documentElement.clientHeight || window.innerHeight)
      })`);
      clip = { x: 0, y: 0, width: viewport.width, height: viewport.height, scale: 1 };
    }
    const image = await send('Page.captureScreenshot', {
      format: 'jpeg',
      quality: 88,
      fromSurface: true,
      captureBeyondViewport: fullPage,
      clip,
    });
    const outputDir = join(process.cwd(), '../generated-artifacts');
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(join(outputDir, fileName), Buffer.from(image.data, 'base64'));
    console.log(`Saved preview proof: ${join(outputDir, fileName)}`);
  };
  const captureAlightProof = async (fileName, fullPage = false) => {
    if (!alightProofCapture) return;
    let clip;
    if (fullPage) {
      const metrics = await send('Page.getLayoutMetrics');
      const content = metrics.cssContentSize || metrics.contentSize;
      const viewportWidth = await evaluate('document.documentElement.clientWidth || window.innerWidth');
      clip = { x: 0, y: 0, width: viewportWidth, height: content.height, scale: 1 };
    }
    const screenshotOptions = {
      format: 'jpeg',
      quality: 88,
      fromSurface: true,
      captureBeyondViewport: fullPage,
    };
    if (fullPage) screenshotOptions.clip = clip;
    const image = await send('Page.captureScreenshot', screenshotOptions);
    const outputDir = join(process.cwd(), '../generated-artifacts');
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(join(outputDir, fileName), Buffer.from(image.data, 'base64'));
    console.log(`Saved ALIGHT proof: ${join(outputDir, fileName)}`);
  };
  const key = async value => {
    const keyCode = { Escape: 27, Tab: 9, ArrowRight: 39, ArrowLeft: 37 }[value];
    const parameters = { key: value, code: value, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode };
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...parameters });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', ...parameters });
  };
  const clickAt = async (x, y) => {
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  };
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.bringToFront');
  if (!mobileProofCapture && !alightMobileCapture) {
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  } else {
    await send('Emulation.setDeviceMetricsOverride', { width: 402, height: 874, deviceScaleFactor: 1, mobile: true });
  }
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await send('Page.navigate', { url: `https://${domain}/` });
  await waitFor(`!!document.querySelector('[data-division="apparel"]')`);
  assert.equal(await evaluate('document.querySelectorAll("[data-division]").length'), 5);
  assert.equal(await evaluate('document.querySelector("#fsd-home-title").textContent.trim().replace(/\\s+/g, " ")'), 'Made to Move,Made to Belong.');
  assert.equal(await evaluate('document.querySelectorAll(".fsd-editorial-card").length'), 3);
  assert.equal(await evaluate('document.querySelectorAll(".showroom-archive[open]").length'), 0);
  assert.equal(await evaluate('document.querySelectorAll("#hardware-editorial").length'), 1);
  assert.equal(await evaluate('document.querySelector("#hardware-editorial").closest("#fsd-house-archive") === null'), true);
  assert.equal(await evaluate('document.querySelector("#hardware-editorial").getBoundingClientRect().height > 0'), true);
  const editorialDividerCopy = 'THE REFINEMENT OF LUXURY FASHION. THE ENERGY OF ELITE SPORT. THE PRECISION OF PERFORMANCE ENGINEERING. THE INNOVATION OF MODERN TECHNOLOGY.';
  assert.equal(await evaluate('document.querySelector(".fsd-editorial-divider")?.textContent.trim()'), editorialDividerCopy);
  assert.equal(await evaluate('document.querySelector(".fsd-editorial-divider")?.previousElementSibling?.id'), 'collections');
  assert.equal(await evaluate('document.querySelector(".fsd-editorial-divider")?.nextElementSibling?.id'), 'hardware-editorial');
  assert.equal(await evaluate('Math.abs(document.querySelector(".fsd-editorial-divider").getBoundingClientRect().width - document.documentElement.clientWidth) < 1'), true);
  assert.equal(await evaluate('document.querySelector("#catalogue-archive").open'), false);
  assert.equal(await evaluate('document.querySelector("#catalogue-archive").getClientRects().length'), 0);
  assert.equal(await evaluate('document.querySelector("#fsd-house-archive").getClientRects().length'), 0);
  assert.equal(await evaluate('getComputedStyle(document.documentElement).scrollbarColor'), 'rgb(119, 103, 72) rgb(17, 18, 20)');

  for (const division of ['apparel', 'bio-lab', 'hardware', 'global']) {
    await click(`[data-division="${division}"]`);
    await waitFor('document.querySelector("#fsd-showcase-dialog").open');
    assert.equal(await evaluate('document.querySelectorAll("dialog[open]").length'), 1);
    assert.ok(await evaluate('document.documentElement.classList.contains("fsd-modal-open")'));
    assert.ok(!await evaluate('/STRIDE|Shilajit|Championship Belt|Ring Corner Post/i.test(document.querySelector("[data-dialog-content]").textContent)'));
    if (division === 'apparel') {
      const dialogEdge = await evaluate(`(() => {
        const dialog = document.querySelector("#fsd-showcase-dialog");
        const bounds = dialog.getBoundingClientRect();
        const x = bounds.left + 0.5;
        const y = bounds.top + bounds.height / 2;
        dialog.dispatchEvent(new MouseEvent("click", { bubbles: true, clientX: x, clientY: y }));
        return { x, y, isInsideDialog: x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom };
      })()`);
      assert.equal(dialogEdge.isInsideDialog, true);
      assert.equal(await evaluate('document.querySelector("#fsd-showcase-dialog").open'), true,
        'Clicking inside the collection dialog border must not dismiss it.');
      for (let count = 0; count < 12; count++) await key('Tab');
      assert.ok(await evaluate('document.querySelector("#fsd-showcase-dialog").contains(document.activeElement)'));
    }
    await key('Escape');
    await waitFor('!document.querySelector("#fsd-showcase-dialog").open && !document.documentElement.classList.contains("fsd-modal-open")');
    assert.equal(await evaluate('document.activeElement.dataset.division'), division);
  }

  await click('[data-division="apparel"]');
  await waitFor('document.querySelector("#fsd-showcase-dialog").open');
  await click('#fsd-showcase-dialog [data-close-dialog]');
  await waitFor('!document.querySelector("#fsd-showcase-dialog").open && !document.documentElement.classList.contains("fsd-modal-open") && document.activeElement.dataset.division === "apparel"');
  assert.equal(await evaluate('document.activeElement.dataset.division'), 'apparel');

  await click('[data-division="apparel"][data-group-index="1"]');
  await click('[data-group-index="1"]');
  const aegisCard = '[data-product-id="46"]';
  assert.ok(await evaluate(`document.querySelector(${JSON.stringify(aegisCard)}).closest("article").textContent.includes("Black / Gold")`));
  await evaluate(`document.querySelector(${JSON.stringify(aegisCard)}).closest("article").scrollIntoView({ block: "center" })`);
  await click(aegisCard);
  await waitFor('document.querySelector("#product-dialog")?.open && document.querySelector("#fsd-showcase-dialog")?.open');
  assert.ok(await evaluate('document.querySelector("#product-dialog [data-catalogue-main-image]")?.src.endsWith("/media/front-three-quarter")'));
  assert.equal(await evaluate('document.querySelector("#product-dialog [data-bag-add]") === null'), true);
  if (aegisProofCapture) {
    await captureHijabProof(mobileProofCapture ? 'aegis-gilet-collection-mobile.jpg' : 'aegis-gilet-collection-desktop.jpg');
  }
  await key('Escape');
  await waitFor('!document.querySelector("#product-dialog")?.open && document.querySelector("#fsd-showcase-dialog")?.open');
  await send('Page.navigate', { url: `https://${domain}/__catalogue-preview/aegis-modest-performance-gilet/` });
  await waitFor('location.pathname === "/__catalogue-preview/aegis-modest-performance-gilet/" && !!document.querySelector("#aegis-gilet-title")');
  assert.equal(await evaluate('document.querySelectorAll("[data-aegis-thumb]").length'), 10);
  assert.ok(await evaluate('document.querySelector("#aegis-gilet-title").textContent.includes("Aegis Modest Performance Gilet")'));
  assert.ok(await evaluate('document.querySelector("#aegis-main-image").src.endsWith("/media/front-three-quarter")'));
  assert.ok(await evaluate('document.querySelector(".aegis-product-colour").textContent.includes("Black / Gold")'));
  assert.ok(!await evaluate('document.querySelector(".aegis-product-price")'));
  assert.ok(!await evaluate('document.querySelector(".aegis-product-price")'));
  assert.ok(!await evaluate('document.querySelector("form, [name=checkout], [data-checkout]")'));
  if (aegisProofCapture) {
    await captureHijabProof(mobileProofCapture ? 'aegis-gilet-product-mobile.jpg' : 'aegis-gilet-product-desktop.jpg', true);
  }
  await click('[data-aegis-thumb="full-rear"]');
  await waitFor('document.querySelector("#aegis-main-image").src.endsWith("/media/full-rear")');
  assert.ok(!await evaluate('document.querySelector("#aegis-image-review-note")'));
  if (aegisProofCapture) {
    await captureHijabProof(mobileProofCapture ? 'aegis-gilet-back-mobile.jpg' : 'aegis-gilet-back-desktop.jpg', true);
  }
  const aegisHeaders = await evaluate(`(async () => {
    const page = await fetch(location.href, { method: 'HEAD' });
    const image = await fetch('/__catalogue-preview/aegis-modest-performance-gilet/media/full-rear', { method: 'HEAD' });
    const blocked = await fetch(location.href, { method: 'POST' });
    return [page.headers.get('x-robots-tag'), page.headers.get('cache-control'),
      image.headers.get('content-type'), image.headers.get('x-robots-tag'), blocked.status];
  })()`);
  assert.ok(aegisHeaders[0].includes('noindex, nofollow, noarchive'));
  assert.equal(aegisHeaders[1], 'no-store');
  assert.equal(aegisHeaders[2], 'image/webp');
  assert.ok(aegisHeaders[3].includes('noindex, nofollow, noarchive'));
  assert.equal(aegisHeaders[4], 405);

  await send('Page.navigate', { url: `https://${domain}/` });
  await waitFor('!!document.querySelector(\'[data-division="bio-lab"]\')');
  await click('[data-division="bio-lab"]');
  await waitFor('!!document.querySelector("[data-alight-draft-card]")');
  assert.ok(await evaluate('document.querySelector("[data-alight-draft-card]").textContent.includes("FSD ALIGHT")'));
  assert.ok(!await evaluate('document.querySelector("[data-alight-draft-card]").textContent.match(/CONCEPT|DRAFT|PREVIEW|PENDING REVIEW|PRIVATE VIEWING/i)'));
  assert.ok(await evaluate('!document.querySelector("[data-alight-draft-card]").textContent.match(/PENDING APPROVAL|NOT AVAILABLE TO PURCHASE/i)'));
  assert.ok(await evaluate('!document.querySelector("[data-alight-draft-card]").textContent.match(/£\\s?\\d|ADD TO CART|BUY NOW/i)'));
  await evaluate('document.querySelector("[data-alight-draft-card]").scrollIntoView({ block: "center" })');
  await captureAlightProof(alightMobileCapture ? 'fsd-alight-collection-card-mobile.jpg' : 'fsd-alight-collection-card-desktop.jpg');
  await click('[data-alight-draft-card] .fsd-product-link');
  await waitFor('location.pathname === "/__catalogue-preview/fsd-alight/" && !!document.querySelector("#alight-title")');
  assert.equal(await evaluate('document.querySelectorAll("[data-alight-thumb]").length'), 12);
  await waitFor('Array.from(document.querySelectorAll("[data-alight-thumb] img")).every(image => image.complete && image.naturalWidth > 0)');
  assert.equal(await evaluate('document.querySelectorAll(".alight-feature-row").length'), 0);
  assert.equal(await evaluate('document.querySelectorAll(".alight-feature-status").length'), 0);
  assert.equal(await evaluate('document.querySelectorAll(".alight-review-panel--missing").length'), 0);
  assert.ok(await evaluate('document.querySelector(".alight-gallery-section").textContent.includes("CAMPAIGN IMAGE")'));
  assert.ok(!await evaluate('document.querySelector("form, [name=checkout], [data-checkout], [data-add-to-cart]")'));
  assert.equal(await evaluate('document.querySelectorAll("main main").length'), 0);
  assert.equal(await evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1'), true);
  if (alightProofCapture) {
    await evaluate('window.scrollTo({ top: 0, behavior: "instant" })');
    await captureAlightProof(alightMobileCapture ? 'fsd-alight-product-mobile.jpg' : 'fsd-alight-product-desktop.jpg');
    await captureAlightProof(alightMobileCapture ? 'fsd-alight-product-full-mobile.jpg' : 'fsd-alight-product-full-desktop.jpg', true);
  }

  for (const imageId of await evaluate('Array.from(document.querySelectorAll("[data-alight-thumb]"), button => button.dataset.alightThumb)')) {
    await click(`[data-alight-thumb="${imageId}"]`);
    await waitFor(`document.querySelector("#alight-main-image").src.endsWith("/media/${imageId}")`);
    assert.equal(await evaluate('document.querySelectorAll("[data-alight-thumb][aria-pressed=true]").length'), 1);
  }
  await click('[data-alight-enlarge]');
  assert.equal(await evaluate('document.querySelector("#alight-lightbox").open'), true);
  await key('Escape');
  await waitFor('!document.querySelector("#alight-lightbox").open');

  if (alightProofCapture) {
    await evaluate('document.querySelector(".alight-editorial").scrollIntoView({ block: "start" })');
    await captureAlightProof(alightMobileCapture ? 'fsd-alight-campaign-mobile.jpg' : 'fsd-alight-campaign-desktop.jpg');
    await evaluate('document.querySelector(".alight-gallery-section").scrollIntoView({ block: "start" })');
    await captureAlightProof(alightMobileCapture ? 'fsd-alight-gallery-mobile.jpg' : 'fsd-alight-gallery-desktop.jpg');
  }

  const alightHeaders = await evaluate(`(async () => {
    const page = await fetch(location.href, { method: 'HEAD' });
    const image = await fetch('/__catalogue-preview/fsd-alight/media/product-hero-crop', { method: 'HEAD' });
    const blocked = await fetch(location.href, { method: 'POST' });
    return [page.headers.get('x-robots-tag'), page.headers.get('cache-control'),
      image.headers.get('content-type'), image.headers.get('x-robots-tag'), blocked.status];
  })()`);
  assert.ok(alightHeaders[0].includes('noindex, nofollow, noarchive'));
  assert.equal(alightHeaders[1], 'no-store');
  assert.equal(alightHeaders[2], 'image/jpeg');
  assert.ok(alightHeaders[3].includes('noindex, nofollow, noarchive'));
  assert.equal(alightHeaders[4], 405);

  await send('Page.navigate', { url: `https://${domain}/` });
  await waitFor(`!!document.querySelector('[data-division="apparel"]')`);
  await click('[data-division="apparel"]');
  await click('[data-group-index="1"]');
  await click('[data-subcategory-index="1"]');
  await waitFor('document.querySelector("#fsd-showcase-dialog [data-aeroforge-product=\\"top\\"]")');
  assert.equal(await evaluate('document.querySelectorAll("#fsd-showcase-dialog [data-aeroforge-product]").length'), 1);
  assert.equal(
    await evaluate('document.querySelector("#fsd-showcase-dialog [data-aeroforge-product=\\"top\\"] h4").textContent'),
    'FSD AeroForge Modest Training Top',
  );
  assert.ok(await evaluate('document.querySelector("#fsd-showcase-dialog [data-aeroforge-product=\\"top\\"] a.fsd-product-link").getAttribute("href").endsWith("#aeroforge-training-top")'));
  await click('[data-subcategory-index="2"]');
  await waitFor('document.querySelector("#fsd-showcase-dialog [data-aeroforge-product=\\"joggers\\"]")');
  assert.equal(await evaluate('document.querySelectorAll("#fsd-showcase-dialog [data-aeroforge-product]").length'), 1);
  assert.equal(
    await evaluate('document.querySelector("#fsd-showcase-dialog [data-aeroforge-product=\\"joggers\\"] h4").textContent'),
    'FSD AeroForge Performance Joggers',
  );
  assert.ok(await evaluate('document.querySelector("#fsd-showcase-dialog [data-aeroforge-product=\\"joggers\\"] a.fsd-product-link").getAttribute("href").endsWith("#aeroforge-performance-joggers")'));
  await click('[data-subcategory-index="0"]');
  assert.equal(await evaluate('document.querySelector("[data-product-id=\\"43\\"]").closest("article").querySelector("img") === null'), true);
  assert.ok(await evaluate('document.querySelector("[data-product-id=\\"43\\"]").closest("article").textContent.includes("Black / Gold")'));
  assert.ok(!await evaluate('document.querySelector("[data-product-id=\\"43\\"]").closest("article").textContent.includes("Black / Champagne Gold")'));
  assert.ok(!await evaluate('document.querySelector("[data-product-id=\\"43\\"]").closest("article").textContent.includes("£29.99")'));
  assert.ok(!await evaluate('document.querySelector("[data-product-id=\\"43\\"]").closest("article").textContent.includes("Reference only · not for sale")'));
  await evaluate('document.querySelector("[data-product-id=\\"43\\"]").scrollIntoView({ block: "center" })');
  if (mobileProofCapture) {
    console.log('Mobile collection viewport:', await evaluate('({ innerWidth: window.innerWidth, clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, visualWidth: window.visualViewport?.width, screenWidth: screen.width, pixelRatio: devicePixelRatio })'));
    await captureHijabProof('velocity-hijab-collection-mobile.jpg');
  } else {
    await captureHijabProof('velocity-hijab-collection-desktop.jpg');
  }
  await click('[data-product-id="43"]');
  await waitFor('document.querySelector("#product-dialog")?.open');
  assert.ok(await evaluate('document.querySelector("#product-dialog [data-catalogue-main-image]")?.src.endsWith("/assets/products/velocity-hijab-main-listing.jpg")'));
  assert.ok(await evaluate('document.querySelector("#product-dialog").textContent.includes("Black / Gold")'));
  assert.ok(await evaluate('document.querySelector("#product-dialog [data-bag-add]")'));
  assert.ok(!await evaluate('document.querySelector("#product-dialog").textContent.includes("£29.99")'));
  assert.ok(await evaluate('document.querySelector("#product-dialog").textContent.includes("£34.99")'));
  assert.ok(await evaluate('document.querySelectorAll("#product-dialog [data-catalogue-image-index]").length > 1'));
  await click('#product-dialog [data-catalogue-image-index="1"]');
  await waitFor('document.querySelector("#product-dialog [data-catalogue-image-index=\\"1\\"]")?.getAttribute("aria-pressed") === "true"');
  assert.ok(await evaluate('document.querySelector("#product-dialog")?.open && document.querySelector("#fsd-showcase-dialog")?.open'),
    'Using an image-gallery control must leave both dialogs open.');
  await clickAt(4, 4);
  await waitFor('!document.querySelector("#product-dialog")?.open && document.querySelector("#fsd-showcase-dialog")?.open');
  await waitFor('document.activeElement.matches("#fsd-showcase-dialog [data-product-id=\\"43\\"]")');
  await click('[data-product-id="43"]');
  await waitFor('document.querySelector("#product-dialog")?.open && document.querySelector("#fsd-showcase-dialog")?.open');
  await key('Escape');
  await waitFor('!document.querySelector("#product-dialog")?.open && document.querySelector("#fsd-showcase-dialog")?.open');
  await key('Escape');
  await waitFor('!document.querySelector("#fsd-showcase-dialog")?.open');
  await click('[data-division="hardware"]');
  await waitFor('document.querySelector("#fsd-showcase-dialog")?.open');
  await click('#fsd-showcase-dialog [data-product-id="69"]');
  await waitFor('document.querySelector("#product-dialog")?.open && document.querySelector("#fsd-showcase-dialog")?.open');
  await click('#product-dialog #product-title');
  assert.equal(await evaluate('document.querySelector("#product-dialog")?.open'), true,
    'Clicking product detail content must not dismiss the garment dialog.');
  await key('Escape');
  await waitFor('!document.querySelector("#product-dialog")?.open && document.querySelector("#fsd-showcase-dialog")?.open');
  await waitFor('document.activeElement.matches("#fsd-showcase-dialog [data-product-id=\\"69\\"]")');
  assert.equal(await evaluate('document.documentElement.classList.contains("fsd-modal-open")'), true);
  await key('Escape');
  await waitFor('!document.querySelector("#fsd-showcase-dialog")?.open && !document.documentElement.classList.contains("fsd-modal-open")');
  if (popupOnly) {
    assert.deepEqual(browserErrors, []);
    console.log(`${mobileProofCapture ? 'Mobile' : 'Desktop'} popup browser checks passed: collection categories, inside clicks, backdrop dismissal, gallery use, close button, nested Escape and focus restoration.`);
  } else {
  await send('Emulation.setDeviceMetricsOverride', {
    width: mobileProofCapture ? 402 : 1440,
    height: mobileProofCapture ? 874 : 1000,
    deviceScaleFactor: 1,
    mobile: mobileProofCapture,
  });
  await send('Page.navigate', { url: `https://${domain}/__catalogue-preview/velocity-performance-sports-hijab/` });
  await waitFor('location.pathname === "/__catalogue-preview/velocity-performance-sports-hijab/" && !!document.querySelector("#velocity-hijab-title")');
  assert.equal(await evaluate('document.querySelectorAll("[data-hijab-thumb]").length'), 5);
  assert.ok(await evaluate('document.querySelector("#velocity-hijab-title").textContent.includes("Velocity")'));
  assert.ok(await evaluate('document.querySelector("#velocity-gallery-main-image").src.endsWith("/media/campaign")'));
  assert.ok(await evaluate('document.querySelector("#velocity-gallery-main-image").alt.toLowerCase().includes("woman")'));
  assert.ok(!await evaluate('document.querySelector(".velocity-product-price")'));
  assert.ok(!await evaluate('document.body.textContent.includes("£29.99")'));
  assert.ok(await evaluate('document.querySelector(".velocity-colour").textContent.includes("Black / Gold")'));
  assert.ok(!await evaluate('/add to cart|checkout button|quantity selector/i.test(document.body.textContent)'));
  assert.equal(await evaluate('document.querySelectorAll("form, input[type=number], button[name*=cart i]").length'), 0);
  await waitFor('Array.from(document.querySelectorAll("[data-hijab-thumb] img"), image => image.complete && image.naturalWidth > 0).every(Boolean)');
  await captureHijabProof(
    mobileProofCapture ? 'velocity-hijab-product-mobile.jpg' : 'velocity-hijab-product-desktop.jpg',
    true,
  );
  for (const imageId of ['campaign', 'front-detail', 'rear-view', 'fabric-detail', 'branding-detail']) {
    await click(`[data-hijab-thumb="${imageId}"]`);
    await waitFor(`document.querySelector("#velocity-gallery-main-image").src.endsWith("/media/${imageId}")`);
    assert.equal(await evaluate(`document.querySelector('[data-hijab-thumb="${imageId}"]').getAttribute("aria-pressed")`), 'true');
  }
  assert.ok(await evaluate('!document.querySelector(".velocity-product-tagline")'));
  assert.ok(await evaluate('!document.querySelector(".velocity-product-disclaimer")'));
  assert.ok(await evaluate('Boolean(document.querySelector(".velocity-accordions"))'));
  assert.ok(await evaluate('document.querySelector(".velocity-accordions").textContent.includes("Black / Gold")'));
  assert.ok(await evaluate('!/(CONCEPT|DRAFT|PREVIEW|PENDING REVIEW|PRIVATE VIEWING)/i.test(document.body.textContent)'));
  assert.ok(!await evaluate('/PENDING VERIFICATION|No technical claims are established/i.test(document.body.textContent)'));
  assert.ok(!await evaluate('/Lightweight & breathable|Stays in place|Strategic airflow/i.test(document.body.textContent)'));
  await click('[data-hijab-thumb="campaign"]');
  await waitFor('document.querySelector("#velocity-gallery-main-image").src.endsWith("/media/campaign")');
  await send('Emulation.setDeviceMetricsOverride', { width: 402, height: 874, deviceScaleFactor: 1, mobile: true });
  await waitFor('document.documentElement.scrollWidth <= window.innerWidth');
  await captureHijabProof('velocity-hijab-product-mobile.jpg', true);
  await click('.velocity-accordions summary');
  assert.equal(await evaluate('document.querySelector(".velocity-accordions details").open'), true);
  const privateHeaders = await evaluate(`(async () => {
    const response = await fetch(location.href, { method: 'HEAD' });
    return [response.headers.get('x-robots-tag'), response.headers.get('cache-control')];
  })()`);
  assert.ok(privateHeaders[0].includes('noindex') && privateHeaders[0].includes('nofollow'));
  assert.equal(privateHeaders[1], 'no-store');

  await send('Emulation.setDeviceMetricsOverride', { width: 402, height: 874, deviceScaleFactor: 1, mobile: true });
  assert.ok(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'));
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `https://${domain}/` });
  await waitFor(`!!document.querySelector('[data-division="apparel"]')`);
  await waitFor('document.querySelector("[data-fsd-storefront]")?.dataset.runtimeReady === "true"');

  await click('[data-division="hardware"]');
  await waitFor('document.querySelector("#fsd-showcase-dialog")?.open');
  assert.deepEqual(
    await evaluate('Array.from(document.querySelectorAll("#fsd-showcase-dialog [data-product-id]"), element => element.dataset.productId)'),
    ['69', '70', '71', '72'],
  );
  assert.equal(await evaluate('document.querySelectorAll("#fsd-showcase-dialog .fsd-product-card").length'), 4);
  await click('#fsd-showcase-dialog [data-product-id="69"]');
  await waitFor('document.querySelector("#product-dialog")?.open && document.querySelector("#fsd-showcase-dialog")?.open');
  await click('#close-dialog');
  await waitFor('!document.querySelector("#product-dialog")?.open && document.querySelector("#fsd-showcase-dialog")?.open');
  assert.equal(await evaluate('document.documentElement.classList.contains("fsd-modal-open")'), true);
  assert.equal(await evaluate('document.querySelector("#fsd-showcase-dialog .fsd-showcase-empty") === null'), true);
  assert.ok(await evaluate('document.querySelector("#fsd-showcase-dialog .fsd-product-placeholder-kicker") === null'));
  assert.equal(await evaluate('document.querySelectorAll("#fsd-showcase-dialog .fsd-product-link--pending").length'), 0);
  assert.ok(await evaluate('!/(CONCEPT|DRAFT|PREVIEW|PENDING REVIEW|PRIVATE VIEWING|PLACEHOLDER)/i.test(document.querySelector("#fsd-showcase-dialog").textContent)'));
  assert.equal(await evaluate('document.querySelectorAll("#fsd-showcase-dialog form, #fsd-showcase-dialog [data-add-to-cart], #fsd-showcase-dialog [data-purchase]").length'), 0);
  assert.equal(await evaluate('document.querySelector("[data-dialog-content]").textContent.includes("£699.99") || document.querySelector("[data-dialog-content]").textContent.includes("£299.99")'), false);
  await click('[data-group-index="2"]');
  assert.equal(await evaluate('document.querySelectorAll(".fsd-product-card").length'), 0);
  assert.equal(await evaluate('document.querySelectorAll(".fsd-concept-card").length'), 3);
  await click('.fsd-concept-details summary');
  assert.equal(await evaluate('document.querySelectorAll("dialog[open]").length'), 1);
  await evaluate('document.querySelector("[data-group-index=\\"2\\"]").focus()');
  await key('ArrowRight');
  assert.equal(await evaluate('document.querySelector(".fsd-group-tab[aria-pressed=\\"true\\"]").dataset.groupIndex'), '3');
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 4, y: 4, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 4, y: 4, button: 'left', clickCount: 1 });
  await waitFor('!document.querySelector("#fsd-showcase-dialog").open && !document.documentElement.classList.contains("fsd-modal-open")');

  await click('[data-division="apparel"]');
  await click('[data-group-index="1"]');
  await click('[data-subcategory-index="0"]');
  await click('[data-explore-collection]');
  await waitFor('document.querySelector("#catalogue-archive").open && !document.querySelector("#fsd-showcase-dialog").open');
  await waitFor('document.querySelector("#search")?.value === "Hijab"');
  assert.equal(await evaluate('document.querySelector("#search").value'), 'Hijab');
  const filteredNames = await evaluate('Array.from(document.querySelectorAll("#catalogue-grid .product-row__name"), heading => heading.textContent)');
  assert.ok(filteredNames.length > 0 && filteredNames.every(name => /hijab/i.test(name)));
  assert.ok(await evaluate('!document.querySelector("#gallery-archive, #full-gallery")'));
  assert.equal(await evaluate('document.querySelectorAll(\'a[href="#full-gallery"]\').length'), 0);
  await evaluate('location.hash = "#innovations"');
  await waitFor('document.querySelector("#fsd-house-archive").open && document.querySelectorAll(".fsd-featured-card").length === 2');
  const seoMeta = await evaluate(`({
    title: document.title,
    description: document.querySelector('meta[name="description"]')?.content,
    ogImage: document.querySelector('meta[property="og:image"]')?.content,
    twitterImage: document.querySelector('meta[name="twitter:image"]')?.content
  })`);
  assert.deepEqual(seoMeta, {
    title: 'FSD — Fitness & Self Defence | The Luxury Digital Flagship',
    description: 'A bespoke British luxury performance house fusing obsidian aesthetics, tactical engineering, and advanced digital innovation.',
    ogImage: '/fsd-assets/8ffe2fd45a06.webp',
    twitterImage: '/fsd-assets/8ffe2fd45a06.webp',
  });
  const offscreenImageLoading = await evaluate(`document.querySelector('#hardware-editorial img')?.loading`);
  assert.equal(offscreenImageLoading, 'lazy');
  assert.equal(await evaluate(`document.querySelector('#philosophy .story-background-image') === null`), true);

  const featuredCarousel = await evaluate(`({
    names: Array.from(document.querySelectorAll(".fsd-featured-card h3"), heading => heading.textContent.trim()),
    prices: Array.from(document.querySelectorAll(".fsd-featured-card__price strong"), price => price.textContent.trim()),
    imageCount: document.querySelectorAll(".fsd-featured-card img").length,
    swatchCount: document.querySelectorAll(".fsd-featured-card [data-feature-swatch]").length,
    nextDisabled: document.querySelector("[data-feature-next]").disabled
  })`);
  assert.deepEqual(featuredCarousel.names, ['FSD Ombré Slash Tee', 'FSD Cheetah Windrunner']);
  assert.deepEqual(featuredCarousel.prices, ['£39.99', '£79.99']);
  assert.equal(featuredCarousel.imageCount, 0);
  assert.equal(featuredCarousel.swatchCount, 0);

  await evaluate('document.querySelector(".fsd-featured-card [data-product=\\"1\\"]").focus({ preventScroll: true })');
  await click('.fsd-featured-card [data-product="1"]');
  await waitFor('document.querySelector("#product-dialog").open');
  assert.ok((await evaluate('document.querySelector("#dialog-body").textContent')).includes('FSD Ombré Slash Tee'));
  assert.equal(await evaluate('Boolean(document.querySelector("#dialog-body [data-product-specifications-root]"))'), true);
  assert.equal(await evaluate('document.querySelector("#dialog-body [data-product-specifications-root]").textContent.trim()'), '');
  assert.equal(await evaluate('document.querySelector("#dialog-body [data-catalogue-main-image]").loading'), 'eager');
  const colourwayCount = await evaluate('document.querySelectorAll("#dialog-body [data-catalogue-colourway-index]").length');
  assert.ok(colourwayCount > 1, 'The selected product should expose its existing colourway controls.');
  for (let index = 0; index < colourwayCount; index++) {
    await click(`#product-dialog [data-catalogue-colourway-index="${index}"]`);
    await waitFor(`document.querySelector('#product-dialog [data-catalogue-colourway-index="${index}"]')?.checked === true`);
    assert.equal(await evaluate('document.querySelector("#product-dialog").open'), true,
      'Selecting a product colourway must not dismiss the garment dialog.');
  }
  await key('Escape');
  await waitFor('!document.querySelector("#product-dialog").open');
  await waitFor('document.activeElement.matches(".fsd-featured-card [data-product=\\"1\\"]")');

  await send('Emulation.setDeviceMetricsOverride', {
    width: 402,
    height: 874,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await waitFor('document.querySelector(".fsd-featured-track").scrollWidth > document.querySelector(".fsd-featured-track").clientWidth');
  assert.equal(await evaluate('document.querySelector("[data-feature-next]").disabled'), false);
  await click('[data-feature-next]');
  await waitFor('document.querySelector(".fsd-featured-track").scrollLeft > 0');
  await send('Emulation.clearDeviceMetricsOverride');
  assert.ok(await evaluate('document.querySelector("#contact button").disabled && !document.querySelector("#contact form, #contact input")'));

  assert.deepEqual(browserErrors, []);
  console.log('Desktop browser checks passed: all divisions, subcategories, focus/closing, product handoff, catalogue navigation, archive removal, carousel, and deferred VIP. Mobile layouts require a separate visual review.');
  }
} finally {
  socket?.close();
  chrome.kill('SIGTERM');
  await Promise.race([new Promise(resolve => chrome.once('exit', resolve)), delay(3000)]);
  rmSync(profile, { recursive: true, force: true });
}
