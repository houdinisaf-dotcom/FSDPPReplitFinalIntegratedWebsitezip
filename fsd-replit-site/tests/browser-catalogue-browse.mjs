import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const domain = process.env.REPLIT_DEV_DOMAIN;
assert.ok(domain, 'REPLIT_DEV_DOMAIN must identify the running development preview.');

const profile = mkdtempSync(join(tmpdir(), 'fsd-catalogue-browser-'));
const chrome = spawn('chromium', [
  '--headless=new',
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--remote-debugging-port=0',
  `--user-data-dir=${profile}`,
  'about:blank',
], { stdio: 'ignore' });
let socket;

try {
  const portFile = join(profile, 'DevToolsActivePort');
  for (let attempt = 0; !existsSync(portFile) && attempt < 100; attempt++) await delay(100);
  assert.ok(existsSync(portFile), 'Chromium did not start.');
  const port = readFileSync(portFile, 'utf8').split('\n')[0];
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {
    method: 'PUT',
  })).json();
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
      if (message.error) {
        request.reject(new Error(`${request.method}: ${JSON.stringify(message.error)}`));
      }
      else request.resolve(message.result);
    } else if (message.method === 'Runtime.exceptionThrown') {
      browserErrors.push(message.params.exceptionDetails.exception?.description
        || message.params.exceptionDetails.text);
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
    pending.set(id, { method, resolve, reject, timeout });
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
      try {
        if (await evaluate(expression)) return;
      } catch (error) {
        if (!/Inspected target navigated or closed|Execution context was destroyed|Cannot find context/i
          .test(error.message)) throw error;
      }
      await delay(100);
    }
    throw new Error(`Browser condition did not become true: ${expression}`);
  };
  const navigate = async path => {
    await send('Page.navigate', { url: `https://${domain}${path}` });
    await waitFor('document.querySelector("#catalogue-grid") && document.querySelector("#catalogue-archive")?.open');
    await waitFor('document.querySelectorAll("#catalogue-grid .product-card--visual").length > 0');
  };
  const setViewport = async (width, height, mobile) => {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile,
    });
    await delay(150);
  };
  const assertVisualGrid = async expectedColumns => {
    const result = await evaluate(`(() => {
      const grid = document.querySelector("#catalogue-grid");
      const cards = [...grid.querySelectorAll(":scope > .product-card--visual")];
      const ids = cards.map(card => card.querySelector("[data-product]")?.dataset.product);
      const media = cards.map(card => card.querySelector(".catalogue-card__media"));
      const columns = getComputedStyle(grid).gridTemplateColumns.trim().split(/\\s+/).length;
      return {
        columns,
        cards: cards.length,
        uniqueIds: new Set(ids).size,
        fallbackCards: grid.querySelectorAll(":scope > .product-card:not(.product-card--visual)").length,
        allMediaVisible: media.every(item => item
          && item.getBoundingClientRect().width > 100
          && item.getBoundingClientRect().height > 120),
        allCardsHaveImageOrPlaceholder: cards.every(card => card.querySelector(
          ".catalogue-card__media img, .catalogue-card__image-empty",
        )),
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      };
    })()`);
    assert.equal(result.columns, expectedColumns, `Unexpected grid column count: ${JSON.stringify(result)}`);
    assert.equal(result.cards, result.uniqueIds, `Duplicate product cards were rendered: ${JSON.stringify(result)}`);
    assert.equal(result.fallbackCards, 0, `Static fallback cards remain beside the React grid: ${JSON.stringify(result)}`);
    assert.equal(result.allMediaVisible, true, `A product image area collapsed: ${JSON.stringify(result)}`);
    assert.equal(result.allCardsHaveImageOrPlaceholder, true, `A card has neither an image nor a placeholder.`);
    assert.equal(result.horizontalOverflow, false, `The page overflows horizontally: ${JSON.stringify(result)}`);
    return result;
  };
  const captureGrid = async name => {
    await evaluate(`(() => {
      const grid = document.querySelector("#catalogue-grid");
      const offset = window.innerWidth <= 900 ? 140 : 80;
      window.scrollTo({ top: grid.getBoundingClientRect().top + window.scrollY - offset, behavior: "instant" });
    })()`);
    await delay(300);
    const screenshot = await send('Page.captureScreenshot', {
      format: 'jpeg',
      quality: 88,
      captureBeyondViewport: false,
    });
    const file = join(process.cwd(), '..', 'generated-artifacts', 'screenshots', `catalogue-women-${name}-after.jpg`);
    mkdirSync(join(process.cwd(), '..', 'generated-artifacts', 'screenshots'), { recursive: true });
    writeFileSync(file, Buffer.from(screenshot.data, 'base64'));
  };
  const clickLeggingsTab = async () => evaluate(`(() => {
    const button = [...document.querySelectorAll("#catalogue-garment-category-tabs button")]
      .find(item => item.textContent.includes("Leggings"));
    if (!button) return false;
    button.click();
    return true;
  })()`);

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');
  await navigate('/collections/women');
  assert.deepEqual(
    await evaluate('Array.from(document.querySelectorAll("#catalogue-archive .catalogue-breadcrumbs li"), item => item.textContent.trim())'),
    ['SHOP', 'WOMEN'],
    'The standalone Women’s collection should show its breadcrumb.',
  );

  for (const viewport of [
    { name: 'desktop', width: 1440, height: 900, mobile: false, columns: 4 },
    { name: 'laptop', width: 1366, height: 900, mobile: false, columns: 4 },
    { name: 'tablet', width: 768, height: 1024, mobile: true, columns: 3 },
    { name: 'mobile', width: 402, height: 874, mobile: true, columns: 2 },
  ]) {
    await setViewport(viewport.width, viewport.height, viewport.mobile);
    const layout = await assertVisualGrid(viewport.columns);
    await captureGrid(viewport.name);
    console.log(`${viewport.name}: ${layout.columns} columns, ${layout.cards} unique cards, media visible`);
  }

  await setViewport(402, 874, true);
  console.log('Checking the existing product detail interaction');
  await evaluate('document.querySelector("#catalogue-grid .product-card--visual > .product-row__trigger")?.click()');
  await waitFor('Boolean(document.querySelector("#catalogue-grid .product-card--visual-open .fsd-catalog-detail"))');
  await evaluate('document.querySelector("#catalogue-grid [data-catalogue-deep-dive]")?.click()');
  await waitFor('Boolean(document.querySelector("#product-dialog")?.open)');
  const quantityProductId = await evaluate(`(() => {
    const button = [...document.querySelectorAll("#catalogue-grid .product-card--visual > .product-row__trigger")]
      .find(candidate => candidate.dataset.canAddToBag === "true");
    button?.click();
    return Number(button?.dataset.product) || 0;
  })()`);
  assert.ok(quantityProductId, 'A confirmed-price product should be available for the bag quantity check.');
  await waitFor(`Boolean(document.querySelector("#dialog-body [data-bag-add=\\"${quantityProductId}\\"]"))`);
  await evaluate(`(() => {
    const size = document.querySelector("#dialog-body input[data-product-size]:not([data-out-of-stock='true'])");
    size?.click();
    const quantity = document.querySelector("#dialog-body [data-product-quantity]");
    if (!quantity) return false;
    quantity.value = "3";
    quantity.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  })()`).then(value => assert.equal(value, true, 'The purchasable product should expose a quantity control.'));
  const beforeBagCount = await evaluate(`Object.values(JSON.parse(localStorage.getItem("fsd-client-bag-v1") || "{}"))
    .reduce((total, quantity) => total + quantity, 0)`);
  await evaluate(`document.querySelector("#dialog-body [data-bag-add=\\"${quantityProductId}\\"]")?.click()`);
  await waitFor(`Object.values(JSON.parse(localStorage.getItem("fsd-client-bag-v1") || "{}"))
    .reduce((total, quantity) => total + quantity, 0) === ${beforeBagCount + 3}`);
  await evaluate('document.querySelector("#close-dialog")?.click()');
  await waitFor('!document.querySelector("#product-dialog")?.open');
  await evaluate('document.querySelector("#catalogue-grid .product-card--visual-open > .product-row__trigger")?.click()');
  await waitFor('!document.querySelector("#catalogue-grid .product-card--visual-open")');

  console.log('Checking the Women’s Leggings and AEROFORGE filter combination');
  const clickedLeggings = await clickLeggingsTab();
  assert.equal(clickedLeggings, true, 'Women’s Leggings should be a populated product-type tab.');
  await waitFor('new URLSearchParams(location.search).get("garment") === "leggings" && document.querySelector("#catalogue-count")?.textContent.includes("of 4 products")');
  await evaluate(`(() => {
    const line = document.querySelector("#catalogue-line");
    line.value = "aeroforge";
    line.dispatchEvent(new Event("change", { bubbles: true }));
  })()`);
  await waitFor('new URLSearchParams(location.search).get("line") === "aeroforge" && document.querySelector("#catalogue-count")?.textContent === "The Collection is currently being curated."');
  assert.equal(await evaluate('document.querySelectorAll("#catalogue-grid .product-card--visual").length'), 0);
  assert.equal(await evaluate('document.querySelector("#catalogue-active-filters")?.textContent.includes("Leggings") && document.querySelector("#catalogue-active-filters")?.textContent.includes("AEROFORGE")'), true);

  await send('Page.reload', { ignoreCache: true });
  await waitFor('new URLSearchParams(location.search).get("line") === "aeroforge" && new URLSearchParams(location.search).get("garment") === "leggings" && document.querySelector("#catalogue-count")?.textContent === "The Collection is currently being curated."');
  await evaluate('history.back()');
  await waitFor('new URLSearchParams(location.search).get("line") === null && new URLSearchParams(location.search).get("garment") === "leggings" && document.querySelector("#catalogue-count")?.textContent.includes("of 4 products")');

  for (const line of ['aeroforge', 'combat', 'flex', 'breeze', 'modest-flow', 'tiger-series', 'scorpion-series']) {
    await send('Page.navigate', { url: `https://${domain}/collections/${line}` });
    await waitFor(`Boolean(document.querySelector("#line-products-${line}")) && document.querySelector("#clothing-lines-archive")?.open`);
    const page = await evaluate(`(() => ({
      path: location.pathname,
      cards: document.querySelectorAll("#line-products-${line} [data-clothing-product-id]").length,
      uniqueCards: new Set([...document.querySelectorAll("#line-products-${line} [data-clothing-product-id]")]
        .map(card => card.dataset.clothingProductId)).size,
      height: document.body.scrollHeight,
    }))()`);
    assert.equal(page.path, `/collections/${line}`, `The ${line} route was not loaded directly.`);
    assert.ok(page.cards > 0, `The ${line} route rendered no product cards.`);
    assert.equal(page.cards, page.uniqueCards, `The ${line} route duplicated product cards.`);
    assert.ok(page.height < 15000, `The ${line} route appears to contain stacked pages (${page.height}px).`);
    const crumbs = await evaluate(`Array.from(document.querySelectorAll("#line-${line} .catalogue-breadcrumbs li"), item => item.textContent.trim())`);
    assert.equal(crumbs[0], 'SHOP', `${line} is missing its Shop breadcrumb.`);
    assert.ok(['WOMEN', 'MEN'].includes(crumbs[1]), `${line} is missing its audience breadcrumb.`);
    assert.ok(crumbs[2], `${line} is missing its collection breadcrumb.`);
  }

  for (const viewport of [
    { name: 'desktop', width: 1440, height: 900, mobile: false, columns: 4 },
    { name: 'laptop', width: 1280, height: 900, mobile: false, columns: 4 },
    { name: 'tablet', width: 768, height: 1024, mobile: true, columns: 3 },
    { name: 'mobile', width: 402, height: 874, mobile: true, columns: 2 },
  ]) {
    await setViewport(viewport.width, viewport.height, viewport.mobile);
    await send('Page.navigate', { url: `https://${domain}/collections/aeroforge` });
    await waitFor('Boolean(document.querySelector("#line-products-aeroforge"))');
    const grid = await evaluate(`(() => {
      const element = document.querySelector("#line-products-aeroforge");
      const browser = document.querySelector(".fsd-clothing-browser");
      const section = document.querySelector(".fsd-clothing-line");
      const catalogue = document.querySelector("#products.shop");
      return {
        columns: getComputedStyle(element).gridTemplateColumns.trim().split(/\\s+/).length,
        browserBottomSpace: getComputedStyle(browser).paddingBottom,
        sectionBottomSpace: getComputedStyle(section).marginBottom,
        catalogueBottomSpace: getComputedStyle(catalogue).paddingBottom,
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      };
    })()`);
    assert.equal(grid.columns, viewport.columns, `AEROFORGE line grid has the wrong ${viewport.name} column count.`);
    assert.equal(grid.browserBottomSpace, grid.sectionBottomSpace, `Shop section spacing is inconsistent at ${viewport.name}.`);
    assert.equal(grid.browserBottomSpace, grid.catalogueBottomSpace, `Catalogue and collection spacing is inconsistent at ${viewport.name}.`);
    assert.equal(grid.horizontalOverflow, false, `AEROFORGE line grid overflows at ${viewport.name}.`);
  }

  await setViewport(402, 874, true);
  for (const collection of [
    { path: '/collections/men', expectedCount: 23 },
    { path: '/collections/accessories', expectedCount: 11 },
  ]) {
    await navigate(collection.path);
    const page = await evaluate(`(() => {
      const cards = [...document.querySelectorAll("#catalogue-grid .product-card--visual")];
      const ids = cards.map(card => card.querySelector("[data-product]")?.dataset.product);
      return {
        path: location.pathname,
        cards: cards.length,
        uniqueCards: new Set(ids).size,
        resultText: document.querySelector("#catalogue-count")?.textContent || "",
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      };
    })()`);
    assert.equal(page.path, collection.path);
    assert.equal(page.cards, page.uniqueCards, `${collection.path} duplicated product cards.`);
    assert.ok(page.resultText.includes(`of ${collection.expectedCount} products`),
      `${collection.path} returned an unexpected product total: ${page.resultText}`);
    assert.equal(page.horizontalOverflow, false, `${collection.path} overflows horizontally.`);
    const crumbs = await evaluate(`Array.from(document.querySelectorAll("#catalogue-archive .catalogue-breadcrumbs li"), item => item.textContent.trim())`);
    assert.equal(crumbs[0], 'SHOP');
    assert.ok(crumbs[1], `${collection.path} is missing its collection breadcrumb.`);
  }

  assert.deepEqual(browserErrors, []);
  console.log('Catalogue browser checks passed: unique image-led grids at four viewports, combined filters, refresh/back, product detail, three audience/category routes, and seven isolated collection routes.');
} finally {
  socket?.close();
  chrome.kill('SIGTERM');
  await Promise.race([new Promise(resolve => chrome.once('exit', resolve)), delay(3000)]);
  await delay(250);
  rmSync(profile, { recursive: true, force: true, maxRetries: 6, retryDelay: 100 });
}
