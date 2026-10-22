// Browser interaction checks for the desktop mega-menu and mobile navigation sheet.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { collectionDivisions } from '../src/collection-divisions.js';
import { createNavigationModel } from '../src/site-navigation.js';

const domain = process.env.REPLIT_DEV_DOMAIN;
assert.ok(domain, 'REPLIT_DEV_DOMAIN must identify the running development preview.');
const draftPreviewPath = '/__catalogue-preview/weighted-skipping-rope/';
const navigationModel = createNavigationModel({ includeDraftPreviews: true });
const profile = mkdtempSync(join(tmpdir(), 'fsd-nav-browser-'));
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
    for (let attempt = 0; attempt < 100; attempt++) {
      if (await evaluate(expression)) return;
      await delay(100);
    }
    throw new Error(`Browser condition did not become true: ${expression}`);
  };
  const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  const moveTo = async selector => {
    const rect = await evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    })()`);
    assert.ok(rect, `Cannot hover missing navigation item: ${selector}`);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...rect });
  };
  const key = async value => {
    const keyCode = { Escape: 27, Tab: 9, ArrowDown: 40 }[value];
    const parameters = { key: value, code: value, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode };
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...parameters });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', ...parameters });
  };
  const capture = async fileName => {
    if (process.env.FSD_NAV_CAPTURE !== '1') return;
    const viewport = await evaluate('({ width: window.innerWidth, height: window.innerHeight })');
    const image = await send('Page.captureScreenshot', {
      format: 'jpeg',
      quality: 88,
      fromSurface: true,
      captureBeyondViewport: false,
      clip: { x: 0, y: 0, width: viewport.width, height: viewport.height, scale: 1 },
    });
    writeFileSync(join(tmpdir(), fileName), Buffer.from(image.data, 'base64'));
  };

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.bringToFront');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false,
  });
  await send('Page.navigate', { url: `https://${domain}/` });
  await waitFor('!!document.querySelector(".fsd-primary-nav") && !!document.querySelector("[data-division=\\"apparel\\"]")');

  assert.deepEqual(await evaluate('Array.from(document.querySelectorAll(".fsd-primary-nav [data-nav-primary]"), button => button.textContent.trim())'), [
    'COLLECTIONS', 'BIO-LAB™', 'HARDWARE', 'THE HOUSE', 'PRIVATE ACCESS',
  ]);
  const startingUrl = await evaluate('location.href');
  const startingScrollY = await evaluate('window.scrollY');
  const startingDocumentWidth = await evaluate('document.documentElement.scrollWidth');

  await click('.fsd-primary-trigger[data-nav-primary="collections"]');
  await waitFor('document.querySelector("#fsd-mega-menu").dataset.step === "desktop" && document.querySelector(".fsd-navigation-shell").classList.contains("is-open")');
  assert.equal(await evaluate('document.querySelector("#fsd-mega-menu").hidden'), false);
  assert.equal(await evaluate('document.querySelectorAll("#fsd-mega-menu .fsd-nav-column").length'), 3);
  assert.equal(await evaluate('document.querySelector("#fsd-mega-menu [data-nav-item=\\"1\\"]").textContent.includes("2-in-1 Combat Training Shorts & Tanks")'), true);
  assert.equal(await evaluate('document.querySelector(".fsd-feature-copy h3").textContent'), '2-in-1 Combat Training Shorts & Tanks');
  assert.equal(await evaluate('document.querySelector("#fsd-mega-menu [data-nav-group]").textContent.includes("MEN’S LUXURY PERFORMANCE")'), true);
  assert.equal(await evaluate('Math.abs(document.querySelector("#fsd-mega-menu").getBoundingClientRect().top - document.querySelector(".fsd-header").getBoundingClientRect().bottom) < 2'), true);
  assert.equal(await evaluate('location.href'), startingUrl);
  assert.equal(await evaluate('window.scrollY'), startingScrollY);
  assert.equal(await evaluate('document.documentElement.scrollWidth'), startingDocumentWidth);
  assert.equal(await evaluate('document.querySelector("#fsd-mega-menu").getBoundingClientRect().right <= document.documentElement.clientWidth + 1'), true);
  await capture('fsd-navigation-desktop.jpg');

  // Hover/focus previews update the selected rows and feature without scrolling.
  for (const groupIndex of [1, 2, 3, 0, 1]) {
    await moveTo(`#fsd-mega-menu [data-nav-group="${groupIndex}"]`);
    const expectedTitle = navigationModel[0].groups[groupIndex].items[0].title;
    await waitFor(`document.querySelector('#fsd-mega-menu [data-nav-group="${groupIndex}"]')?.getAttribute("aria-pressed") === "true" && document.querySelector(".fsd-feature-copy h3")?.textContent === ${JSON.stringify(expectedTitle)}`);
    assert.equal(await evaluate('document.querySelectorAll("#fsd-mega-menu [data-nav-group][aria-pressed=\\"true\\"]").length'), 1);
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('#fsd-mega-menu [data-nav-group="${groupIndex}"]')).backgroundImage.includes('linear-gradient')`), true);
  }
  assert.equal(await evaluate('window.scrollY'), startingScrollY);
  await capture('fsd-navigation-active.jpg');
  await moveTo('#fsd-mega-menu [data-nav-group="0"]');
  await moveTo('#fsd-mega-menu [data-nav-item="1"]');
  await waitFor('document.querySelector("#fsd-mega-menu [data-nav-item=\\"1\\"]")?.getAttribute("aria-pressed") === "true" && document.querySelector(".fsd-feature-copy h3")?.textContent === "2-in-1 Combat Training Shorts & Tanks"');
  await evaluate('document.querySelector("#fsd-mega-menu [data-nav-item=\\"2\\"]").focus({ preventScroll: true })');
  await waitFor('document.querySelector("#fsd-mega-menu [data-nav-item=\\"2\\"]")?.getAttribute("aria-pressed") === "true" && document.activeElement.dataset.navItem === "2"');
  assert.equal(await evaluate('document.querySelector(".fsd-feature-copy h3").textContent'), 'Walkout Robes & Bomber Jackets');
  assert.equal(await evaluate('window.scrollY'), startingScrollY);

  // Group clicks use the existing collection dialog; item clicks use its exact subcategory.
  await click('#fsd-mega-menu [data-nav-group="1"]');
  await waitFor('document.querySelector("#fsd-showcase-dialog").open && document.querySelector("#fsd-showcase-dialog [data-group-index=\\"1\\"][aria-pressed=\\"true\\"]")');
  await key('Escape');
  await waitFor('!document.querySelector("#fsd-showcase-dialog").open');

  await click('.fsd-primary-trigger[data-nav-primary="collections"]');
  await waitFor('!document.querySelector("#fsd-mega-menu").hidden');
  await moveTo('#fsd-mega-menu [data-nav-group="0"]');
  await moveTo('#fsd-mega-menu [data-nav-item="1"]');
  await click('#fsd-mega-menu [data-nav-item="1"]');
  await waitFor('document.querySelector("#fsd-showcase-dialog").open && document.querySelector("#fsd-showcase-dialog [data-group-index=\\"0\\"][aria-pressed=\\"true\\"]") && document.querySelector("#fsd-showcase-dialog [data-subcategory-index=\\"1\\"][aria-pressed=\\"true\\"]")');
  await key('Escape');
  await waitFor('!document.querySelector("#fsd-showcase-dialog").open');

  // The featured action follows the selected category, rather than a fixed collection.
  await click('.fsd-primary-trigger[data-nav-primary="collections"]');
  await moveTo('#fsd-mega-menu [data-nav-group="1"]');
  await moveTo('#fsd-mega-menu [data-nav-item="0"]');
  await click('#fsd-mega-menu .fsd-feature-cta');
  await waitFor('document.querySelector("#fsd-showcase-dialog").open && document.querySelector("#fsd-showcase-dialog [data-group-index=\\"1\\"][aria-pressed=\\"true\\"]") && document.querySelector("#fsd-showcase-dialog [data-subcategory-index=\\"0\\"][aria-pressed=\\"true\\"]")');
  await key('Escape');
  await waitFor('!document.querySelector("#fsd-showcase-dialog").open');

  const routeKind = ({ group, item }) => {
    if (item?.navigationUnavailable || (!item && group.navigationUnavailable)) return 'preview';
    if (item?.kind === 'draft-product') return 'draft';
    if (item?.record) return 'product';
    if (item?.kind === 'category') return 'category';
    if (item?.href || group.href) return 'anchor';
    if (item?.sourceDivisionId || group.sourceDivisionId) return 'showcase';
    return 'preview';
  };

  const closeRouteAndReset = async () => {
    if (await evaluate('location.pathname.startsWith("/__catalogue-preview/")')) {
      await send('Page.navigate', { url: `https://${domain}/` });
      await waitFor('!!document.querySelector(".fsd-primary-nav")');
    }
    const openDialog = await evaluate('document.querySelector("#product-dialog").open || document.querySelector("#fsd-showcase-dialog").open');
    if (openDialog) {
      await key('Escape');
      await waitFor('!document.querySelector("#product-dialog").open && !document.querySelector("#fsd-showcase-dialog").open');
    }
    const menuOpen = await evaluate('!document.querySelector("#fsd-mega-menu").hidden');
    if (menuOpen) {
      await key('Escape');
      await waitFor('document.querySelector("#fsd-mega-menu").hidden');
    }
    await evaluate('window.scrollTo({ top: 0, behavior: "instant" })');
    await delay(80);
  };

  const verifySelectionRoute = async ({ menu, group, item }, selector) => {
    const kind = routeKind({ group, item });
    const available = await evaluate(`document.querySelector(${JSON.stringify(selector)})?.dataset.navAvailable === "true"`);
    assert.equal(available, kind !== 'preview', `${menu.label}: ${item?.title || group.title} availability metadata`);

    if (kind === 'draft') {
      await waitFor(`(() => {
        const image = document.querySelector(".fsd-feature-media img");
        return image?.getAttribute("src") === ${JSON.stringify(item.featureImageSrc)} && image.naturalWidth === 1672;
      })()`);
      assert.equal(
        await evaluate('document.querySelector(".fsd-feature-kicker").textContent'),
        item.previewKicker || 'FSD / PRE-LAUNCH CONCEPT',
      );
      await click(selector);
      if (item.href === '/__catalogue-preview/hooded-running-shell/') {
        await waitFor(`location.pathname === ${JSON.stringify(item.href)} && document.querySelector("#shell-title")?.textContent.includes("FSD Hooded Running Shell")`);
        await waitFor('document.querySelector("#shell-campaign-image")?.naturalWidth === 1672');
        assert.equal(await evaluate('document.querySelectorAll("form, input, [data-add-to-cart], [data-purchase], [data-edition]").length'), 0);
        assert.equal(await evaluate('document.body.innerText.includes("Colour selection is deferred.")'), false);
        return;
      }
      await waitFor(`location.pathname === ${JSON.stringify(item.href)} && document.querySelector("#product-title")?.textContent.includes("FSD Weighted Skipping Rope")`);
      await waitFor('document.querySelector("#campaign-image")?.naturalWidth === 1672 && document.querySelector("#edition-image")?.naturalWidth === 1122');
      assert.equal(await evaluate('document.querySelector(".draft-badge").textContent.includes("PRE-LAUNCH")'), true);
      assert.equal(await evaluate('document.querySelector(".draft-badge").textContent.includes("NOT FOR SALE")'), false);
      assert.equal(await evaluate('document.querySelectorAll("#edition-options [data-edition]").length'), 8);
      assert.equal(await evaluate('document.querySelectorAll("form, input, [data-add-to-cart], [data-purchase]").length'), 0);
      return;
    }

    if (kind === 'preview') {
      const y = await evaluate('window.scrollY');
      await click(selector);
      await waitFor(`!document.querySelector("#fsd-mega-menu").hidden && document.querySelector(${JSON.stringify(selector)})?.getAttribute("aria-pressed") === "true"`);
      assert.equal(await evaluate('window.scrollY'), y);
      if (item?.navigationUnavailable) {
        assert.equal(await evaluate('document.querySelector("#fsd-mega-menu .fsd-feature-cta").disabled'), true);
      }
      return;
    }

    await click(selector);
    await waitFor('document.querySelector("#fsd-mega-menu").hidden');
    if (kind === 'product') {
      await waitFor('document.querySelector("#product-dialog").open');
      assert.equal(await evaluate('document.querySelector("#product-title").textContent.trim()'), item.record.name);
    } else if (kind === 'category') {
      const category = item.source.categories[0];
      await waitFor(`document.querySelector("#catalogue-archive").open && document.querySelector("#catalogue-category").value === ${JSON.stringify(category)}`);
      await waitFor('(() => { const rect = document.querySelector("#products").getBoundingClientRect(); return rect.bottom > 0 && rect.top < window.innerHeight; })()');
      assert.equal(await evaluate('document.querySelector("#products").getBoundingClientRect().top < window.innerHeight'), true);
    } else if (kind === 'anchor') {
      const href = item?.href || group.href;
      await waitFor(`(() => {
        const target = document.querySelector(${JSON.stringify(href)});
        if (!target || !document.querySelector("#fsd-mega-menu").hidden) return false;
        const rect = target.getBoundingClientRect();
        return rect.bottom > 0 && rect.top < window.innerHeight;
      })()`);
    } else {
      const division = item?.sourceDivisionId || group.sourceDivisionId;
      const groupIndex = item?.sourceGroupIndex ?? group.sourceGroupIndex;
      await waitFor('document.querySelector("#fsd-showcase-dialog").open');
      await waitFor(`document.querySelector('#fsd-showcase-dialog [data-group-index="${groupIndex}"][aria-pressed="true"]') !== null`);
      const targetGroup = collectionDivisions.find(entry => entry.id === division)?.groups[groupIndex];
      assert.ok(targetGroup, `${division} group ${groupIndex} must exist`);
      assert.equal(await evaluate(`document.querySelector('#fsd-showcase-dialog [data-group-index="${groupIndex}"][aria-pressed="true"]').textContent.includes(${JSON.stringify(targetGroup.title)})`), true);
      if (item && item.sourceSubcategoryIndex >= 0) {
        await waitFor(`document.querySelector('#fsd-showcase-dialog [data-subcategory-index="${item.sourceSubcategoryIndex}"][aria-pressed="true"]') !== null`);
      }
    }
  };

  // Exercise each real group and subcategory/product link; unavailable rows remain previews.
  for (const menu of navigationModel) {
    for (const [groupIndex, group] of menu.groups.entries()) {
      await closeRouteAndReset();
      await click(`.fsd-primary-trigger[data-nav-primary="${menu.id}"]`);
      await waitFor(`document.querySelector("#fsd-mega-menu").dataset.primary === ${JSON.stringify(menu.id)} && !document.querySelector("#fsd-mega-menu").hidden`);
      await moveTo(`#fsd-mega-menu [data-nav-group="${groupIndex}"]`);
      await waitFor(`document.querySelector('#fsd-mega-menu [data-nav-group="${groupIndex}"]')?.getAttribute("aria-pressed") === "true"`);
      await verifySelectionRoute({ menu, group, item: null }, `#fsd-mega-menu [data-nav-group="${groupIndex}"]`);
      await closeRouteAndReset();

      for (const [itemIndex, item] of group.items.entries()) {
        await click(`.fsd-primary-trigger[data-nav-primary="${menu.id}"]`);
        await waitFor(`document.querySelector("#fsd-mega-menu").dataset.primary === ${JSON.stringify(menu.id)} && !document.querySelector("#fsd-mega-menu").hidden`);
        await moveTo(`#fsd-mega-menu [data-nav-group="${groupIndex}"]`);
        await moveTo(`#fsd-mega-menu [data-nav-item="${itemIndex}"]`);
        await waitFor(`document.querySelector('#fsd-mega-menu [data-nav-item="${itemIndex}"]')?.getAttribute("aria-pressed") === "true"`);
        await verifySelectionRoute({ menu, group, item }, `#fsd-mega-menu [data-nav-item="${itemIndex}"]`);
        await closeRouteAndReset();
      }
    }
  }

  // The selected draft feature card uses the same private preview destination as its menu row.
  const hardwareMenu = navigationModel.find(menu => menu.id === 'hardware');
  const ropeGroupIndex = hardwareMenu.groups.findIndex(group => group.title === 'STRENGTH EQUIPMENT');
  const ropeItemIndex = hardwareMenu.groups[ropeGroupIndex].items.findIndex(item => item.kind === 'draft-product');
  const ropeItem = hardwareMenu.groups[ropeGroupIndex].items[ropeItemIndex];
  await closeRouteAndReset();
  await click('.fsd-primary-trigger[data-nav-primary="hardware"]');
  await waitFor('document.querySelector("#fsd-mega-menu").dataset.primary === "hardware" && !document.querySelector("#fsd-mega-menu").hidden');
  await moveTo(`#fsd-mega-menu [data-nav-group="${ropeGroupIndex}"]`);
  await moveTo(`#fsd-mega-menu [data-nav-item="${ropeItemIndex}"]`);
  await waitFor(`document.querySelector(".fsd-feature-copy h3")?.textContent === ${JSON.stringify(ropeItem.title)} && document.querySelector(".fsd-feature-media img")?.naturalWidth === 1672`);
  await click('#fsd-mega-menu .fsd-feature-cta');
  await waitFor(`location.pathname === ${JSON.stringify(ropeItem.href)} && document.querySelector("#product-title")?.textContent.includes("FSD Weighted Skipping Rope")`);
  await waitFor('document.querySelector("#campaign-image")?.naturalWidth === 1672');
  await closeRouteAndReset();

  for (const [id, heading] of [
    ['collections', 'COLLECTIONS'],
    ['bio-lab', 'BIO-LAB™'],
    ['hardware', 'HARDWARE'],
    ['house', 'THE HOUSE'],
    ['private-access', 'PRIVATE ACCESS'],
  ]) {
    await click(`.fsd-primary-trigger[data-nav-primary="${id}"]`);
    await waitFor(`document.querySelector("#fsd-mega-menu h2")?.textContent === ${JSON.stringify(heading)}`);
    assert.ok(await evaluate('document.querySelector("#fsd-mega-menu [data-nav-item]") !== null'));
    assert.equal(await evaluate('window.scrollY'), startingScrollY);
    assert.equal(await evaluate('location.href'), startingUrl);
    await key('Escape');
    await waitFor('document.querySelector("#fsd-mega-menu").hidden');
  }
  assert.equal(await evaluate('document.querySelector("#fsd-mega-menu form, #fsd-mega-menu input")'), null);
  assert.equal(await evaluate('document.querySelector("#contact button").disabled'), true);

  // Hover must stay open while the pointer moves from the header into the attached panel.
  const triggerRect = await evaluate('document.querySelector(".fsd-primary-trigger[data-nav-primary=\\"hardware\\"]").getBoundingClientRect().toJSON()');
  await send('Input.dispatchMouseEvent', {
    type: 'mouseMoved', x: triggerRect.x + triggerRect.width / 2, y: triggerRect.y + triggerRect.height / 2,
  });
  await waitFor('document.querySelector(".fsd-navigation-shell").classList.contains("is-open")');
  const panelRect = await evaluate('document.querySelector("#fsd-mega-menu").getBoundingClientRect().toJSON()');
  await send('Input.dispatchMouseEvent', {
    type: 'mouseMoved', x: panelRect.x + panelRect.width * 0.75, y: panelRect.y + 80,
  });
  await delay(350);
  assert.equal(await evaluate('document.querySelector(".fsd-navigation-shell").classList.contains("is-open")'), true);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 10, y: 900 });
  await waitFor('document.querySelector("#fsd-mega-menu").hidden');

  // Mobile uses the same hierarchy with clear category, group and detail steps.
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, deviceScaleFactor: 2, mobile: true,
  });
  await delay(150);
  assert.equal(await evaluate('getComputedStyle(document.querySelector("[data-nav-mobile-toggle]")).display !== "none"'), true);
  await click('[data-nav-mobile-toggle]');
  await waitFor('document.querySelector("#fsd-mega-menu").dataset.step === "primary" && document.body.classList.contains("fsd-mobile-nav-open")');
  assert.equal(await evaluate('document.querySelectorAll(".fsd-mobile-primary-list [data-nav-primary]").length'), 5);
  await click('.fsd-mobile-primary-list [data-nav-primary="collections"]');
  assert.equal(await evaluate('document.querySelector("#fsd-mega-menu").dataset.step'), 'groups');
  await click('#fsd-mega-menu [data-nav-group="0"]');
  assert.equal(await evaluate('document.querySelector("#fsd-mega-menu").dataset.step'), 'detail');
  assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'), true);
  assert.equal(await evaluate('window.scrollY'), startingScrollY);
  await capture('fsd-navigation-mobile.jpg');
  await click('#fsd-mega-menu [data-nav-back]');
  assert.equal(await evaluate('document.querySelector("#fsd-mega-menu").dataset.step'), 'groups');
  await click('#fsd-mega-menu [data-nav-back]');
  assert.equal(await evaluate('document.querySelector("#fsd-mega-menu").dataset.step'), 'primary');
  await click('.fsd-mobile-primary-list [data-nav-primary="collections"]');
  await click('#fsd-mega-menu [data-nav-group="0"]');
  await click('#fsd-mega-menu [data-nav-item="1"]');
  await waitFor('document.querySelector("#fsd-showcase-dialog").open && document.querySelector("#fsd-mega-menu").hidden && document.querySelector("#fsd-showcase-dialog [data-group-index=\\"0\\"][aria-pressed=\\"true\\"]") && document.querySelector("#fsd-showcase-dialog [data-subcategory-index=\\"1\\"][aria-pressed=\\"true\\"]")');
  assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'), true);
  assert.equal(await evaluate('window.scrollY'), startingScrollY);
  await key('Escape');
  await waitFor('!document.querySelector("#fsd-showcase-dialog").open && document.querySelector("#fsd-mega-menu").hidden && !document.body.classList.contains("fsd-mobile-nav-open")');
  await waitFor('document.activeElement.matches("[data-nav-mobile-toggle]")');
  assert.equal(await evaluate('document.activeElement.matches("[data-nav-mobile-toggle]")'), true);

  await click('[data-nav-mobile-toggle]');
  await waitFor('document.querySelector("#fsd-mega-menu").dataset.step === "primary"');
  await click('.fsd-mobile-primary-list [data-nav-primary="hardware"]');
  await waitFor('document.querySelector("#fsd-mega-menu").dataset.step === "groups"');
  await click(`#fsd-mega-menu [data-nav-group="${ropeGroupIndex}"]`);
  await waitFor('document.querySelector("#fsd-mega-menu").dataset.step === "detail"');
  await click(`#fsd-mega-menu [data-nav-item="${ropeItemIndex}"]`);
  await waitFor(`location.pathname === ${JSON.stringify(ropeItem.href)} && document.querySelector("#product-title")?.textContent.includes("FSD Weighted Skipping Rope")`);
  await waitFor('document.querySelector("#campaign-image")?.naturalWidth === 1672');
  assert.equal(await evaluate('document.querySelectorAll("#edition-options [data-edition]").length'), 8);
  await closeRouteAndReset();
  assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'), true);

  assert.deepEqual(browserErrors, []);
  console.log('Navigation browser checks passed: verified links, weighted-rope draft row and feature CTA, mobile draft routing, unavailable destinations, keyboard/focus, and overflow.');
} finally {
  socket?.close();
  chrome.kill('SIGTERM');
  await Promise.race([new Promise(resolve => chrome.once('exit', resolve)), delay(3000)]);
  await delay(250);
  rmSync(profile, { recursive: true, force: true, maxRetries: 6, retryDelay: 100 });
}
