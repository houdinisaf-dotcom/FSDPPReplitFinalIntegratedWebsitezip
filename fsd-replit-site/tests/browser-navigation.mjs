// Browser interaction checks for the desktop mega-menu and mobile navigation sheet.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { collectionDivisions } from '../src/collection-divisions.js';
import { products, shopCollections } from '../src/catalogue-data.js';
import { createNavigationModel } from '../src/site-navigation.js';
import { resolveFsdRoute } from '../src/react-router.js';

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
    pending.set(id, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    let response;
    try {
      response = await send('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true,
      });
    } catch (error) {
      throw new Error(`CDP evaluation failed for: ${expression}\n${error.message}`, { cause: error });
    }
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
  const assertNoHorizontalPageScroll = async () => {
    const overflow = await evaluate('({ html: getComputedStyle(document.documentElement).overflowX, body: getComputedStyle(document.body).overflowX })');
    assert.ok(['hidden', 'clip'].includes(overflow.html) || ['hidden', 'clip'].includes(overflow.body),
      `The site must prevent horizontal page scrolling: ${JSON.stringify(overflow)}`);
    await evaluate('window.scrollTo({ left: 0, top: window.scrollY, behavior: "instant" })');
  };
  const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  const moveTo = async selector => {
    const rect = await evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!element) return null;
      element.scrollIntoView({ block: "nearest", inline: "nearest" });
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
  await waitFor('!!document.querySelector("#fsd-react-footer-utilities .fsd-footer-tools") && !!document.querySelector(".fsd-reading-progress")');
  const hasFinePointer = await evaluate('matchMedia("(pointer: fine)").matches');
  const desktopCursor = await evaluate('getComputedStyle(document.querySelector("a[href]")).cursor');
  const cursorStylesheet = await evaluate('document.getElementById("fsd-cursor")?.textContent ?? ""');
  assert.match(cursorStylesheet, /@media \(pointer: fine\)/);
  const encodedCursorSvg = cursorStylesheet.match(/url\("data:image\/svg\+xml,([^"]+)"\)/)?.[1];
  assert.ok(encodedCursorSvg);
  const decodedCursorSvg = decodeURIComponent(encodedCursorSvg);
  assert.match(decodedCursorSvg, /width="32" height="32"/);
  assert.match(decodedCursorSvg, /fill="#D4AF37" stroke="#0a0a0a"/);
  assert.match(decodedCursorSvg, /<rect x="10" y="14\.5" width="12" height="3"\/>/);
  if (hasFinePointer) {
    assert.match(desktopCursor, /data:image\/svg\+xml/);
    assert.match(desktopCursor, /\)\s+16 16,\s*pointer$/);
    assert.equal(
      await evaluate('Array.from(document.querySelectorAll(\'a[href], button:not(:disabled), [role="button"], [role="tab"], summary, label[for], select\')).every(element => getComputedStyle(element).cursor === getComputedStyle(document.querySelector("a[href]")).cursor)'),
      true,
      'The dumbbell cursor should apply to fine-pointer interactive controls.',
    );
  } else {
    assert.equal(desktopCursor, 'pointer', 'Headless Chromium reports no fine pointer, so native pointer behavior is expected.');
  }
  assert.deepEqual(
    await evaluate(`(() => {
      const input = document.querySelector('#search');
      const textarea = document.createElement('textarea');
      document.body.append(textarea);
      const cursors = [getComputedStyle(input).cursor, getComputedStyle(textarea).cursor];
      textarea.remove();
      return cursors;
    })()`),
    ['text', 'text'],
    'Text entry controls should retain their native text cursor.',
  );
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".fsd-home-hero__image")).backgroundPosition'), '50% 35%');
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".fsd-home-hero__image")).backgroundSize'), 'cover');
  assert.doesNotMatch(
    await evaluate('document.body.innerText'),
    /CONCEPT|DRAFT|PREVIEW|PENDING REVIEW|PRIVATE VIEWING|PLACEHOLDER/i,
  );
  await evaluate('window.__fsdAnalyticsEvents = []; window.umami = { track: (name, data) => window.__fsdAnalyticsEvents.push({ name, data }) };');
  await click('#collections [data-division="apparel"]');
  await waitFor('document.querySelector("#fsd-showcase-dialog")?.open');
  const collectionOpenedEvent = await evaluate('window.__fsdAnalyticsEvents.find(event => event.name === "collection_opened")');
  assert.equal(collectionOpenedEvent?.data?.division_id, 'apparel');
  assert.equal(collectionOpenedEvent?.data?.group_index, 0);
  await key('Escape');
  await waitFor('!document.querySelector("#fsd-showcase-dialog")?.open');
  await click('[data-bag-open]');
  await waitFor('document.querySelector("#fsd-bag-title")?.closest("dialog")?.open');
  const emptyBagOpenedEvent = await evaluate('window.__fsdAnalyticsEvents.find(event => event.name === "bag_opened")');
  assert.equal(emptyBagOpenedEvent?.data?.item_count, 0);
  assert.equal(emptyBagOpenedEvent?.data?.unit_count, 0);
  await key('Escape');
  await waitFor('!document.querySelector("#fsd-bag-title")?.closest("dialog")?.open');
  await evaluate('window.scrollTo(0, document.documentElement.scrollHeight)');
  await waitFor('Number.parseFloat(getComputedStyle(document.querySelector(".fsd-reading-progress")).getPropertyValue("--fsd-reading-progress")) > 0.98');
  assert.equal(
    await evaluate('Number.parseFloat(getComputedStyle(document.querySelector(".fsd-reading-progress")).getPropertyValue("--fsd-reading-progress"))'),
    1,
  );
  await evaluate('window.scrollTo(0, 0)');
  await waitFor('Number.parseFloat(getComputedStyle(document.querySelector(".fsd-reading-progress")).getPropertyValue("--fsd-reading-progress")) < 0.02');
  assert.equal(await evaluate('document.querySelectorAll(".fsd-social-placeholder").length'), 5);
  await send('Page.navigate', { url: `https://${domain}/#philosophy` });
  await waitFor('document.querySelector("#fsd-house-archive")?.open');
  await waitFor('document.querySelector("#philosophy")?.getBoundingClientRect().top < 180');
  assert.ok(await evaluate('document.querySelector("#philosophy").getBoundingClientRect().top >= -1'));
  await send('Page.navigate', { url: `https://${domain}/` });
  await waitFor('!!document.querySelector(".fsd-primary-nav") && !!document.querySelector("#fsd-react-footer-utilities .fsd-footer-tools")');
  await send('Page.navigate', { url: `https://${domain}/story` });
  await waitFor('document.querySelector("#fsd-house-archive")?.open');
  await waitFor('document.querySelector("#philosophy")?.getBoundingClientRect().top < 180');
  assert.ok(await evaluate('Boolean(document.querySelector(".fsd-reading-progress"))'));
  assert.equal(await evaluate('document.querySelector("[data-fsd-storefront]").dataset.currentView'), 'story');
  assert.equal(await evaluate('document.querySelector(".fsd-primary-trigger[data-nav-primary=\\"house\\"]")?.classList.contains("is-current")'), true);
  assert.ok(await evaluate('Boolean(document.querySelector(\'footer a[href="/story"]\'))'));
  await send('Page.navigate', { url: `https://${domain}/` });
  await waitFor('!!document.querySelector(".fsd-primary-nav") && !!document.querySelector("#fsd-react-footer-utilities .fsd-footer-tools")');
  await click('.fsd-primary-trigger[data-nav-primary="house"]');
  await waitFor('document.querySelector("#fsd-mega-menu").dataset.primary === "house" && !document.querySelector("#fsd-mega-menu").hidden');
  await waitFor('document.querySelector("#fsd-mega-menu [data-nav-group=\\"0\\"]")');
  await moveTo('#fsd-mega-menu [data-nav-group="0"]');
  await waitFor('document.querySelector(".fsd-feature-media--story") && document.querySelector(".fsd-feature-copy h3")?.textContent === "THE FSD STORY & ARCHIVE"');
  assert.equal(await evaluate('document.querySelector(".fsd-feature-metadata").textContent.includes("04 FOUNDATIONAL CHAPTERS")'), true);
  assert.equal(await evaluate('document.querySelector(".fsd-feature-metadata").textContent.includes("05 WORKING PRINCIPLES")'), true);
  await click('#fsd-mega-menu .fsd-feature-cta');
  await waitFor('location.pathname === "/story"');
  await waitFor('document.querySelector("#fsd-house-archive")?.open');
  await waitFor('document.querySelector("#philosophy")?.getBoundingClientRect().top < 180');
  await send('Page.navigate', { url: `https://${domain}/` });
  await waitFor('!!document.querySelector(".fsd-primary-nav") && window.scrollY === 0');
  await evaluate('document.querySelector(".fsd-footer-tools button:nth-of-type(2)").click()');
  await waitFor('document.documentElement.dataset.theme === "light"');
  await evaluate('document.querySelector(".fsd-footer-tools button:nth-of-type(2)").click()');
  await waitFor('document.documentElement.dataset.theme === "dark"');
  await evaluate('document.querySelector(".fsd-footer-tools button:first-of-type").click()');
  await waitFor('document.querySelector("#catalogue-archive").open && document.activeElement === document.querySelector("#search")');
  await evaluate('window.scrollTo({ top: 0, behavior: "instant" })');
  await waitFor('window.scrollY === 0');

  assert.equal(await evaluate('getComputedStyle(document.documentElement).scrollBehavior'), 'auto');
  assert.ok(await evaluate('parseFloat(getComputedStyle(document.querySelector(".fsd-home-hero h1")).animationDuration) < .001'));
  assert.equal(await evaluate('document.querySelector(".header.fsd-header").classList.contains("fsd-glass-surface")'), true);
  assert.equal(await evaluate('document.querySelector(".fsd-mega-menu").classList.contains("fsd-glass-surface")'), true);
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".fsd-navigation-shell")).position'), 'fixed');
  assert.ok(await evaluate(`(() => {
    const announcement = document.querySelector(".announcement.fsd-announcement").getBoundingClientRect();
    const shell = document.querySelector(".fsd-navigation-shell").getBoundingClientRect();
    const spacer = document.querySelector(".fsd-navigation-spacer").getBoundingClientRect();
    return Math.abs(announcement.top) < 1
      && Math.abs(shell.top - announcement.height) < 1
      && Math.abs(spacer.height - shell.height) < 1;
  })()`), 'The top banner, fixed navigation and spacer should align without overlap.');
  await evaluate('window.scrollTo(0, document.querySelector("#universe").getBoundingClientRect().top + window.scrollY + 120)');
  await waitFor('window.scrollY > 0');
  assert.ok(await evaluate(`(() => {
    const announcement = document.querySelector(".announcement.fsd-announcement").getBoundingClientRect();
    const shell = document.querySelector(".fsd-navigation-shell").getBoundingClientRect();
    return getComputedStyle(document.querySelector(".fsd-navigation-shell")).position === "fixed"
      && Math.abs(announcement.top) < 1
      && Math.abs(shell.top - announcement.height) < 1;
  })()`));
  await evaluate('window.scrollTo(0, 0)');
  await waitFor('window.scrollY === 0');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  assert.equal(await evaluate('getComputedStyle(document.documentElement).scrollBehavior'), 'smooth');
  assert.ok(await evaluate('parseFloat(getComputedStyle(document.querySelector(".fsd-home-hero h1")).animationDuration) >= .5'));
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  assert.equal(await evaluate('getComputedStyle(document.documentElement).scrollBehavior'), 'auto');

  assert.equal(await evaluate('document.querySelector(".fsd-primary-nav [data-nav-house]")?.getAttribute("href")'), '/the-house.html');
  assert.deepEqual(await evaluate('Array.from(document.querySelectorAll(".fsd-primary-nav [data-nav-primary]"), button => button.getAttribute("aria-label") || button.textContent.trim())'), [
    'SHOP', 'UNIVERSE', 'BIO-LAB™', 'HARDWARE', 'Open The House menu', 'PRIVATE ACCESS',
  ]);
  const startingUrl = await evaluate('location.href');
  const startingScrollY = await evaluate('window.scrollY');
  await click('.fsd-primary-trigger[data-nav-primary="collections"]');
  await waitFor('document.querySelector("#fsd-mega-menu").dataset.step === "desktop" && document.querySelector(".fsd-navigation-shell").classList.contains("is-open")');
  assert.equal(await evaluate('document.querySelector("#fsd-mega-menu").hidden'), false);
  assert.equal(await evaluate('document.querySelectorAll("#fsd-mega-menu .fsd-nav-column").length'), 3);
  assert.deepEqual(
    await evaluate('Array.from(document.querySelectorAll("#fsd-mega-menu .fsd-feature-metadata dt"), cell => cell.textContent.trim())'),
    ['Colourways', 'Audience'],
  );
  assert.equal(
    await evaluate('Array.from(document.querySelectorAll("#fsd-mega-menu .fsd-feature-metadata dd"), cell => cell.textContent.trim()).every(Boolean)'),
    true,
  );
  assert.equal(await evaluate('document.querySelector("#fsd-mega-menu .fsd-feature-cta") !== null'), true);
  assert.equal(await evaluate('Array.from(document.querySelectorAll("#fsd-mega-menu .fsd-feature-media img")).every(image => image.loading === "eager")'), true);
  assert.equal(await evaluate('document.querySelector("#fsd-mega-menu [data-nav-item=\\"1\\"]").textContent.includes("2-in-1 Combat Training Shorts & Tanks")'), true);
  assert.equal(await evaluate('document.querySelector(".fsd-feature-copy h3").textContent'), '2-in-1 Combat Training Shorts & Tanks');
  assert.equal(await evaluate('document.querySelector("#fsd-mega-menu [data-nav-group]").textContent.includes("MEN’S LUXURY PERFORMANCE")'), true);
  assert.equal(await evaluate('Math.abs(document.querySelector("#fsd-mega-menu").getBoundingClientRect().top - document.querySelector(".fsd-header").getBoundingClientRect().bottom) < 2'), true);
  assert.equal(await evaluate('location.href'), startingUrl);
  assert.equal(await evaluate('window.scrollY'), startingScrollY);
  await assertNoHorizontalPageScroll();
  assert.equal(await evaluate('document.querySelector("#fsd-mega-menu").getBoundingClientRect().right <= document.documentElement.clientWidth + 1'), true);
  await capture('fsd-navigation-desktop.jpg');

  await click('#fsd-mega-menu [data-nav-catalogue]');
  await waitFor('document.querySelector("#catalogue-archive").open && document.querySelector("#catalogue-collection").value === "All" && document.querySelector("#fsd-mega-menu").hidden');
  await send('Page.navigate', { url: `https://${domain}/` });
  await waitFor('document.querySelector("#fsd-home-title") && window.scrollY === 0');
  await click('.fsd-primary-trigger[data-nav-primary="collections"]');
  await waitFor('document.querySelector("#fsd-mega-menu").dataset.step === "desktop"');

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

  // Exact Nexus mapping crossfades for 200ms; other menu items can remain image-free.
  const bioLabMenu = navigationModel.find(menu => menu.id === 'bio-lab');
  const nexusGroupIndex = bioLabMenu.groups.findIndex(group => group.items.some(item => item.record?.name === 'FSD NEXUS (smart ring)'));
  const nexusItemIndex = bioLabMenu.groups[nexusGroupIndex].items.findIndex(item => item.record?.name === 'FSD NEXUS (smart ring)');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await click('.fsd-primary-trigger[data-nav-primary="bio-lab"]');
  await waitFor('document.querySelector("#fsd-mega-menu").dataset.primary === "bio-lab"');
  await evaluate(`document.querySelector('#fsd-mega-menu [data-nav-group="${nexusGroupIndex}"]').focus({ preventScroll: true })`);
  await evaluate(`document.querySelector('#fsd-mega-menu [data-nav-item="${nexusItemIndex}"]').focus({ preventScroll: true })`);
  assert.equal(await evaluate('document.querySelector(".fsd-feature-media")?.dataset.featureImage'), '/fsd-assets/3daa9883cec9.webp');
  assert.equal(await evaluate('document.querySelectorAll(".fsd-feature-media img").length'), 1);
  assert.equal(await evaluate('document.querySelector(".fsd-feature-media")?.classList.contains("fsd-feature-media--transitioning")'), true);
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".fsd-feature-media img")).transitionDuration'), '0.2s');
  await waitFor('document.querySelector(".fsd-feature-media img")?.naturalWidth > 0 && !document.querySelector(".fsd-feature-media")?.classList.contains("fsd-feature-media--transitioning")');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await click('.fsd-primary-trigger[data-nav-primary="collections"]');
  await waitFor('document.querySelector("#fsd-mega-menu").dataset.primary === "collections"');

  // Shop groups and subcategories open the matching visual preview drawer.
  await click('#fsd-mega-menu [data-nav-group="1"]');
  await waitFor('document.querySelector("#fsd-showcase-dialog").open && document.querySelector("#fsd-showcase-dialog [data-group-index=\\"1\\"][aria-pressed=\\"true\\"]")');
  assert.equal(
    await evaluate('document.querySelector("#fsd-showcase-dialog .fsd-modal-description p")?.textContent'),
    'Explore women’s performance apparel, modest movement, combat training, and accessories.',
  );
  assert.equal(
    await evaluate('Boolean([...document.querySelectorAll("#fsd-showcase-dialog .fsd-product-row__meta > span:first-child")].find(node => node.textContent === "Women\'s Performance"))'),
    true,
  );
  assert.equal(
    await evaluate('document.querySelector("#fsd-showcase-dialog .fsd-product-row")?.style.width || getComputedStyle(document.querySelector("#fsd-showcase-dialog .fsd-product-row")).width'),
    await evaluate('getComputedStyle(document.querySelector("#fsd-showcase-dialog .fsd-product-grid")).width'),
  );
  assert.equal(await evaluate('getComputedStyle(document.querySelector("#fsd-showcase-dialog .fsd-product-row")).columnGap'), '32px');
  const productRowTracks = await evaluate('getComputedStyle(document.querySelector("#fsd-showcase-dialog .fsd-product-row")).gridTemplateColumns.split(" ")');
  assert.equal(productRowTracks.length, 4);
  assert.equal(productRowTracks[0], '200px');
  assert.equal(productRowTracks[2], '90px');
  assert.equal(productRowTracks[3], '140px');
  assert.equal(await evaluate('getComputedStyle(document.querySelector("#fsd-showcase-dialog .fsd-product-reference")).textAlign'), 'right');
  assert.equal(await evaluate('getComputedStyle(document.querySelector("#fsd-showcase-dialog .fsd-product-row__action")).justifySelf'), 'end');
  assert.equal(await evaluate('document.querySelector("#fsd-mega-menu").hidden'), true);
  await key('Escape');
  await waitFor('!document.querySelector("#fsd-showcase-dialog").open');

  // Hardware concepts keep the exploratory disclaimer, neutral card styling, and correct numbering.
  await click('#collections [data-division="hardware"]');
  await waitFor('document.querySelector("#fsd-showcase-dialog")?.open');
  await click('#fsd-showcase-dialog [data-group-index="2"]');
  await waitFor('document.querySelector("#fsd-showcase-dialog [data-group-index=\\"2\\"][aria-pressed=\\"true\\"]")');
  assert.equal(
    await evaluate('document.querySelector("#fsd-showcase-dialog .fsd-modal-description p")?.textContent'),
    'Explore recovery concepts and accessories. Concept details are not confirmed.',
  );
  assert.equal(await evaluate('document.querySelector("#fsd-showcase-dialog .fsd-modal-subhead > span")?.textContent'), '01');
  assert.equal(
    await evaluate('document.querySelector("#fsd-showcase-dialog .fsd-concept-disclaimer")?.textContent'),
    'Concept for exploration. Not a current product or commitment.',
  );
  assert.equal(await evaluate('getComputedStyle(document.querySelector("#fsd-showcase-dialog .fsd-concept-card")).padding'), '24px');
  assert.equal(await evaluate('getComputedStyle(document.querySelector("#fsd-showcase-dialog .fsd-concept-card h4")).userSelect'), 'none');
  assert.equal(await evaluate('getComputedStyle(document.querySelector("#fsd-showcase-dialog .fsd-concept-details summary")).listStyleType'), 'none');
  await key('Escape');
  await waitFor('!document.querySelector("#fsd-showcase-dialog").open');

  await click('.fsd-primary-trigger[data-nav-primary="collections"]');
  await waitFor('!document.querySelector("#fsd-mega-menu").hidden');
  await click('#fsd-mega-menu [data-nav-item="0"]');
  await waitFor('document.querySelector("#fsd-showcase-dialog").open && document.querySelector("#fsd-showcase-dialog [data-group-index=\\"0\\"][aria-pressed=\\"true\\"]")');
  await waitFor('document.querySelector("#fsd-showcase-dialog [data-subcategory-index=\\"0\\"][aria-pressed=\\"true\\"]") !== null');
  await key('Escape');
  await waitFor('!document.querySelector("#fsd-showcase-dialog").open');

  // Both the featured image and its action open the selected collection preview.
  await click('.fsd-primary-trigger[data-nav-primary="collections"]');
  await evaluate('document.querySelector("#fsd-mega-menu [data-nav-group=\\"1\\"]").focus({ preventScroll: true })');
  await waitFor('document.querySelector("#fsd-mega-menu [data-nav-group=\\"1\\"]")?.getAttribute("aria-pressed") === "true" && document.querySelector(".fsd-feature-copy h3")?.textContent === "Performance Hijabs"');
  await evaluate('document.querySelector("#fsd-mega-menu [data-nav-item=\\"0\\"]").focus({ preventScroll: true })');
  await waitFor('document.querySelector("#fsd-mega-menu [data-nav-item=\\"0\\"]")?.getAttribute("aria-pressed") === "true" && document.querySelector(".fsd-feature-copy h3")?.textContent === "Performance Hijabs"');
  await click('#fsd-mega-menu .fsd-feature-media-action');
  await waitFor('document.querySelector("#fsd-showcase-dialog").open && document.querySelector("#fsd-showcase-dialog [data-subcategory-index=\\"0\\"][aria-pressed=\\"true\\"]")');
  assert.equal(await evaluate('document.querySelector("#fsd-showcase-dialog .fsd-modal-hero__media img")?.getAttribute("src")'), '/assets/products/velocity-hijab-main-listing.jpg');
  await key('Escape');
  await waitFor('!document.querySelector("#fsd-showcase-dialog").open');

  await click('.fsd-primary-trigger[data-nav-primary="collections"]');
  await evaluate('document.querySelector("#fsd-mega-menu [data-nav-group=\\"1\\"]").focus({ preventScroll: true })');
  await waitFor('document.querySelector("#fsd-mega-menu [data-nav-group=\\"1\\"]")?.getAttribute("aria-pressed") === "true"');
  await evaluate('document.querySelector("#fsd-mega-menu [data-nav-item=\\"0\\"]").focus({ preventScroll: true })');
  await waitFor('document.querySelector("#fsd-mega-menu [data-nav-item=\\"0\\"]")?.getAttribute("aria-pressed") === "true"');
  await click('#fsd-mega-menu .fsd-feature-cta');
  await waitFor('document.querySelector("#fsd-showcase-dialog").open && document.querySelector("#fsd-showcase-dialog [data-subcategory-index=\\"0\\"][aria-pressed=\\"true\\"]")');

  const routeKind = ({ menu, group, item }) => {
    if (item?.navigationUnavailable || (!item && group.navigationUnavailable)) return 'preview';
    if (item?.kind === 'draft-product') return 'draft';
    if (item?.record) return 'product';
    if (menu.id === 'collections' && item?.kind === 'shop-all') return 'shop';
    if (menu.id === 'collections' && (item?.sourceDivisionId || group.sourceDivisionId)) return 'showcase';
    if (item?.kind === 'category') return 'category';
    if (item?.href || group.href) return 'anchor';
    if (item?.sourceDivisionId || group.sourceDivisionId) return 'showcase';
    return 'preview';
  };

  const closeRouteAndReset = async () => {
    if (await evaluate('location.pathname === "/investor.html" || location.pathname === "/the-house.html" || location.pathname.startsWith("/__catalogue-preview/")')) {
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
    if (await evaluate('location.search || location.hash')) {
      await evaluate('history.replaceState({}, "", "/"); window.dispatchEvent(new PopStateEvent("popstate", { state: {} }))');
      await delay(80);
    }
    await evaluate('window.scrollTo({ top: 0, behavior: "instant" })');
    await delay(80);
  };

  const verifySelectionRoute = async ({ menu, group, item }, selector) => {
    const available = await evaluate(`document.querySelector(${JSON.stringify(selector)})?.dataset.navAvailable === "true"`);
    const kind = routeKind({ menu, group, item });
    assert.equal(available, kind !== 'preview', `${menu.label}: ${item?.title || group.title} availability metadata`);

    const destination = item?.href || group.href;
    if (destination === '/investor.html' || destination?.startsWith('/investor.html#')) {
      await click(selector);
      await waitFor('location.pathname === "/investor.html" && document.querySelector("#financials h2")?.textContent.includes("Financials & Downside Disclosed")');
      return;
    }

    if (destination === '/the-house.html' || destination?.startsWith('/the-house.html#')) {
      await click(selector);
      const expectedHash = destination.includes('#') ? destination.slice(destination.indexOf('#')) : '';
      await waitFor(`location.pathname === "/the-house.html"
        && location.hash === ${JSON.stringify(expectedHash)}
        && document.querySelector('nav a[href="/the-house.html"]')
        && document.querySelector('nav a[href="/investor.html"]')
        && document.querySelector("#hero h1")`);
      return;
    }

    if (kind === 'draft') {
      await waitFor(`(() => {
        return !document.querySelector(".fsd-feature-media img") && document.querySelector(".fsd-feature-media--unmapped");
      })()`);
      assert.equal(
        await evaluate('document.querySelector(".fsd-feature-kicker").textContent'),
        item.previewKicker || 'FSD / COLLECTION',
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
      assert.equal(await evaluate('document.querySelector(".draft-badge").textContent.includes("CONCEPT")'), true);
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
    const expectedRoute = resolveFsdRoute({ menu, group, item });
    try {
      await waitFor(`(() => {
        const root = document.querySelector("[data-fsd-storefront]");
        return root?.dataset.currentView === ${JSON.stringify(expectedRoute.view)}
          && root?.dataset.activeTarget === ${JSON.stringify(expectedRoute.target ?? '')};
      })()`);
    } catch {
      const actual = await evaluate(`(() => {
        const root = document.querySelector("[data-fsd-storefront]");
        return {
          url: location.href,
          currentView: root?.dataset.currentView,
          activeTarget: root?.dataset.activeTarget,
          menu: document.querySelector("#fsd-mega-menu")?.dataset.primary,
          menuHidden: document.querySelector("#fsd-mega-menu")?.hidden,
          selection: document.querySelector(${JSON.stringify(selector)})?.textContent?.trim(),
        };
      })()`);
      throw new Error(`${menu.label} selection ${group.title} / ${item?.title || 'group'} expected ${JSON.stringify(expectedRoute)}; actual ${JSON.stringify(actual)}`);
    }
    await waitFor('document.querySelector("#fsd-mega-menu").hidden');
    if (kind === 'product') {
      await waitFor('document.querySelector("#product-dialog").open');
      assert.equal(await evaluate('document.querySelector("#product-title").textContent.trim()'), item.record.name);
    } else if (kind === 'shop') {
      const collection = ['mens-luxury-performance', 'womens-modest-combat'].includes(group.id)
        ? group.id
        : 'All';
      try {
        await waitFor(`document.querySelector("#catalogue-archive").open && document.querySelector("#catalogue-collection").value === ${JSON.stringify(collection)}`);
      } catch {
        throw new Error(`${menu.label} selection ${group.title} / ${item?.title || 'group'} did not set collection=${collection}: ${JSON.stringify(await evaluate('({ url: location.href, open: document.querySelector("#catalogue-archive")?.open, collection: document.querySelector("#catalogue-collection")?.value, menu: document.querySelector("#fsd-mega-menu")?.hidden })'))}`);
      }
      if (item?.kind === 'subcategory') {
        const productTerm = item.source?.productTerms?.[0] || '';
        assert.equal(await evaluate('document.querySelector("#search").value'), productTerm);
      }
      if (item?.kind === 'category') {
        assert.equal(await evaluate('document.querySelector("#catalogue-category").value'), item.source.categories[0]);
      }
    } else if (kind === 'category') {
      const category = item.source.categories[0];
      await waitFor(`document.querySelector("#catalogue-archive").open && document.querySelector("#catalogue-category").value === ${JSON.stringify(category)}`);
      await waitFor('(() => { const rect = document.querySelector("#products").getBoundingClientRect(); return rect.bottom > 0 && rect.top < window.innerHeight; })()');
      assert.equal(await evaluate('document.querySelector("#products").getBoundingClientRect().top < window.innerHeight'), true);
    } else if (kind === 'anchor') {
      const href = item?.href || group.href;
      if (href === '/story') {
        await waitFor('location.pathname === "/story" && document.querySelector("#fsd-house-archive")?.open');
        await waitFor('document.querySelector("#philosophy")?.getBoundingClientRect().top < 180');
      } else {
        await waitFor(`(() => {
          const target = document.querySelector(${JSON.stringify(href)});
          if (!target || !document.querySelector("#fsd-mega-menu").hidden) return false;
          const rect = target.getBoundingClientRect();
          return rect.bottom > 0 && rect.top < window.innerHeight;
        })()`);
      }
    } else {
      const division = item?.sourceDivisionId || group.sourceDivisionId;
      const groupIndex = item?.sourceGroupIndex ?? group.sourceGroupIndex;
      try {
        await waitFor('document.querySelector("#fsd-showcase-dialog").open');
      } catch {
        throw new Error(`${menu.label} selection ${group.title} / ${item?.title || 'group'} did not open the preview drawer: ${JSON.stringify(await evaluate('({ menu: document.querySelector("#fsd-mega-menu")?.dataset.primary, menuHidden: document.querySelector("#fsd-mega-menu")?.hidden, route: document.querySelector("[data-fsd-storefront]")?.dataset.currentView, target: document.querySelector("[data-fsd-storefront]")?.dataset.activeTarget })'))}`);
      }
      await waitFor(`document.querySelector('#fsd-showcase-dialog [data-group-index="${groupIndex}"][aria-pressed="true"]') !== null`);
      const targetGroup = collectionDivisions.find(entry => entry.id === division)?.groups[groupIndex];
      assert.ok(targetGroup, `${division} group ${groupIndex} must exist`);
      assert.equal(await evaluate(`document.querySelector('#fsd-showcase-dialog [data-group-index="${groupIndex}"][aria-pressed="true"]').textContent.includes(${JSON.stringify(targetGroup.title)})`), true);
      if (!item && division === 'apparel' && targetGroup.id === 'womens-modest-combat') {
        await waitFor('document.querySelector("#fsd-showcase-dialog .fsd-womens-hero-image")?.naturalWidth > 0');
        assert.equal(
          await evaluate('document.querySelector("#fsd-showcase-dialog .fsd-womens-hero-copy h2")?.textContent.trim()'),
          'The Performance Edit',
        );
        assert.equal(
          await evaluate('document.querySelector("#fsd-showcase-dialog .fsd-womens-hero-copy > p")?.textContent.includes("High-end activewear crafted for ultimate comfort, luxury, and peak performance.")'),
          true,
        );
        assert.equal(await evaluate('document.querySelector("#fsd-showcase-dialog #fsd-womens-product-grid") !== null'), true);
        assert.equal(await evaluate('document.querySelector("#fsd-showcase-dialog .fsd-product-placeholder-kicker") === null'), true);
        await evaluate('document.querySelector("#fsd-showcase-dialog .fsd-dialog-content").scrollTop = 0');
        const routeBeforeHeroCta = await evaluate('location.href');
        await click('#fsd-showcase-dialog [data-scroll-womens-products]');
        await waitFor(`(() => {
          const content = document.querySelector("#fsd-showcase-dialog .fsd-dialog-content");
          const grid = document.querySelector("#fsd-showcase-dialog #fsd-womens-product-grid");
          return content && grid && grid.getBoundingClientRect().top >= content.getBoundingClientRect().top - 2
            && grid.getBoundingClientRect().top < content.getBoundingClientRect().top + 80;
        })()`);
        assert.equal(await evaluate('document.querySelector("#fsd-showcase-dialog").open'), true);
        assert.equal(await evaluate('location.href'), routeBeforeHeroCta);
      }
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

  // Home → Shop → Women’s preview → catalogue, using the current public product record.
  await closeRouteAndReset();
assert.equal(await evaluate('document.querySelector(".fsd-home-secondary") === null'), true);
assert.equal(await evaluate('document.querySelector("#products")?.closest("#home") === null'), true);
assert.equal(await evaluate('document.querySelector("#catalogue-archive").open'), false);
  await click('.fsd-primary-trigger[data-nav-primary="collections"]');
  await click('#fsd-mega-menu [data-nav-group="1"]');
  await waitFor('document.querySelector("#fsd-showcase-dialog").open && document.querySelector("#fsd-showcase-dialog [data-group-index=\\"1\\"][aria-pressed=\\"true\\"]")');
  await click('#fsd-showcase-dialog [data-explore-collection]');
  await waitFor('document.querySelector("#catalogue-collection").value === "womens-modest-combat"');
  await waitFor('document.querySelector(".fsd-primary-trigger[data-nav-primary=\\"collections\\"]").getAttribute("aria-current") === "page"');
  await evaluate(`(() => {
    const category = document.querySelector("#catalogue-category");
    category.value = "Modest Activewear";
    category.dispatchEvent(new Event("change", { bubbles: true }));
    const audience = document.querySelector("#catalogue-audience");
    audience.value = "Women’s";
    audience.dispatchEvent(new Event("change", { bubbles: true }));
    const sort = document.querySelector("#catalogue-sort");
    sort.value = "price-asc";
    sort.dispatchEvent(new Event("change", { bubbles: true }));
    const search = document.querySelector("#search");
    search.value = "FSD Velocity Performance Sports Hijab";
    search.dispatchEvent(new Event("input", { bubbles: true }));
  })()`);
  await waitFor('document.querySelector("#catalogue-count").textContent.includes("of 1 product") && !!document.querySelector("#catalogue-grid [data-product=\\"43\\"]")');
  await waitFor('document.querySelector("#catalogue-grid").dataset.view === "list" && !!document.querySelector("[data-catalogue-view=\\"visual\\"]")');
  assert.deepEqual(await evaluate('Object.fromEntries(new URLSearchParams(location.search))'), {
    category: 'Modest Activewear',
    audience: 'Women’s',
    collection: 'womens-modest-combat',
    q: 'FSD Velocity Performance Sports Hijab',
    sort: 'price-asc',
  });
  await click('#catalogue-active-filters [data-remove-filter="audience"]');
  await waitFor('document.querySelector("#catalogue-audience").value === "All" && !new URLSearchParams(location.search).has("audience")');
  await evaluate(`(() => {
    const audience = document.querySelector("#catalogue-audience");
    audience.value = "Women’s";
    audience.dispatchEvent(new Event("change", { bubbles: true }));
  })()`);
  await send('Page.reload');
  await waitFor('performance.getEntriesByType("navigation")[0]?.type === "reload" && document.readyState === "complete" && document.querySelector("#catalogue-count")');
  await waitFor('document.querySelector("#catalogue-archive").open && document.querySelector("#catalogue-collection").value === "womens-modest-combat" && document.querySelector("#catalogue-grid").dataset.view === "list" && document.querySelector("#catalogue-count")?.textContent.includes("of 1 product")');
  await evaluate(`(() => {
    const search = document.querySelector("#search");
    search.value = "FSD product that does not exist";
    search.dispatchEvent(new Event("input", { bubbles: true }));
  })()`);
  await waitFor('document.querySelector("#catalogue-count").textContent === "No matching products" && !!document.querySelector("#catalogue-grid [data-clear-filters]")');
  await click('#catalogue-grid [data-clear-filters]');
  await waitFor('document.querySelector("#catalogue-count").textContent.includes("of ") && document.querySelector("#catalogue-collection").value === "All" && document.querySelector("#catalogue-category").value === "All" && document.querySelector("#catalogue-audience").value === "All" && document.querySelector("#catalogue-sort").value === "featured" && document.querySelector("#catalogue-grid").dataset.view === "list"');
  await assertNoHorizontalPageScroll();
  assert.equal(await evaluate('document.querySelectorAll("#catalogue-grid img").length === 0 && document.querySelectorAll("#catalogue-grid .product-card").length === document.querySelectorAll("#catalogue-grid .product-row__trigger").length'), true, 'The catalogue should stay in a compact text-row view.');
  await click('[data-catalogue-view="visual"]');
  await waitFor('document.querySelector("#catalogue-grid").dataset.view === "visual" && document.querySelectorAll("#catalogue-grid [data-catalogue-card-image]").length > 0');
  assert.equal(await evaluate('document.querySelector("[data-catalogue-view=\\"visual\\"]")?.getAttribute("aria-pressed") === "true" && document.querySelector("[data-catalogue-view=\\"list\\"]")?.getAttribute("aria-pressed") === "false" && new URLSearchParams(location.search).get("view") === "visual"'), true, 'Visual layout should be selected and preserved in the URL.');
  assert.equal(await evaluate('document.querySelectorAll("#catalogue-grid [data-catalogue-card-slide]").length > 0'), true, 'Visual catalogue cards should offer accessible image selectors.');
  await click('#catalogue-grid [data-catalogue-card-next]');
  await waitFor('document.querySelector("#catalogue-grid [data-product=\\"1\\"] [data-catalogue-card-image]")?.alt.includes("Electric cobalt fading to jet black")');
  await click('[data-catalogue-view="list"]');
  await waitFor('document.querySelector("#catalogue-grid").dataset.view === "list" && document.querySelectorAll("#catalogue-grid img").length === 0');
  assert.equal(await evaluate('document.querySelector("[data-catalogue-view=\\"list\\"]")?.getAttribute("aria-pressed") === "true" && !new URLSearchParams(location.search).has("view")'), true, 'List layout should restore the default state in the URL.');

  // Product rows expand in place and preserve the list's exact scroll position.
  await evaluate('document.querySelector("#catalogue-grid [data-product=\\"1\\"]")?.scrollIntoView({ block: "center" })');
  await waitFor('document.querySelector("#catalogue-grid [data-product=\\"1\\"]")?.getBoundingClientRect().top >= 0');
  const rowScrollY = await evaluate('window.scrollY');
  await click('#catalogue-grid [data-product="1"]');
  await waitFor('document.querySelector("#catalogue-grid [data-product=\\"1\\"]")?.getAttribute("aria-expanded") === "true" && !!document.querySelector("#catalogue-grid #catalogue-expanded-1")');
  assert.equal(await evaluate('Math.abs(window.scrollY - ' + rowScrollY + ') < 2'), true);
  assert.equal(await evaluate('document.querySelectorAll("#catalogue-expanded-1 [data-catalogue-inline-view]").length'), 2);
  assert.equal(await evaluate('document.querySelectorAll("#catalogue-expanded-1 [data-catalogue-inline-colourway]").length'), 2);
  await click('#catalogue-expanded-1 [data-catalogue-inline-view]:nth-child(2)');
  await waitFor('document.querySelector("#catalogue-expanded-1 [data-catalogue-inline-image]")?.alt.includes("Electric cobalt fading to jet black")');
  await click('#catalogue-expanded-1 [data-catalogue-inline-colourway]:first-child');
  await waitFor('document.querySelector("#catalogue-expanded-1 [data-catalogue-inline-image]")?.alt.includes("Vintage indigo fading to jet black")');
  await click('#catalogue-expanded-1 .fsd-catalog-row__collapse');
  await waitFor('document.querySelector("#catalogue-expanded-1") === null && document.querySelector("#catalogue-grid [data-product=\\"1\\"]")?.getAttribute("aria-expanded") === "false"');
  assert.equal(await evaluate('Math.abs(window.scrollY - ' + rowScrollY + ') < 2'), true);
  await click('#catalogue-grid [data-product="1"]');
  await waitFor('!!document.querySelector("#catalogue-expanded-1")');
   const secondProductId = await evaluate('document.querySelectorAll("#catalogue-grid [data-product]")[1]?.dataset.product');
   assert.ok(secondProductId, 'A second product row should be available for the anchoring check.');
   const secondProductSelector = `#catalogue-grid [data-product="${secondProductId}"]`;
   await evaluate(`document.querySelector(${JSON.stringify(secondProductSelector)}).scrollIntoView({ block: "center", behavior: "instant" })`);
   const secondProductTop = await evaluate(`document.querySelector(${JSON.stringify(secondProductSelector)}).getBoundingClientRect().top`);
   await click(secondProductSelector);
   await waitFor(`!!document.querySelector("#catalogue-expanded-${secondProductId}")`);
   assert.equal(
     await evaluate(`Math.abs(document.querySelector(${JSON.stringify(secondProductSelector)}).getBoundingClientRect().top - ${secondProductTop}) < 2`),
     true,
     'Switching expanded products should keep the clicked row in the same viewport position.',
   );
   await key('Escape');
   await waitFor(`document.querySelector("#catalogue-expanded-${secondProductId}") === null && document.querySelector(${JSON.stringify(secondProductSelector)})?.getAttribute("aria-expanded") === "false"`);
   assert.equal(
     await evaluate(`document.activeElement === document.querySelector(${JSON.stringify(secondProductSelector)})`),
     true,
     'Escape should close the inline detail and restore focus to its row.',
   );
   await click('#catalogue-grid [data-product="1"]');
   await waitFor('!!document.querySelector("#catalogue-expanded-1")');
  await click('#catalogue-expanded-1 [data-catalogue-deep-dive]');
  await waitFor('document.querySelector("#product-dialog")?.open && document.querySelector("#product-title")?.textContent.trim() === "FSD Ombré Slash Tee"');
  await click('#close-dialog');
  await waitFor('!document.querySelector("#product-dialog")?.open && !!document.querySelector("#catalogue-expanded-1")');
  await click('#catalogue-grid [data-product="1"]');
  await waitFor('document.querySelector("#catalogue-expanded-1") === null');

  await click('.fsd-home-primary');
  await waitFor('location.hash === "#universe" && document.querySelector(".fsd-primary-trigger[data-nav-primary=\\"universe\\"]").getAttribute("aria-current") === "page"');
  await click('.fsd-primary-trigger[data-nav-primary="universe"]');
  await click('#fsd-mega-menu [data-nav-group="1"]');
  await click('#fsd-mega-menu [data-nav-item="0"]');
  await waitFor('document.querySelector("#fsd-showcase-dialog").open && !!document.querySelector("#fsd-showcase-dialog [data-group-index=\\"0\\"][aria-pressed=\\"true\\"]")');
  await key('Escape');
  await waitFor('!document.querySelector("#fsd-showcase-dialog").open');
  await waitFor('document.querySelector("[data-division=\\"bio-lab\\"]") === document.activeElement');
  assert.equal(await evaluate('document.querySelector("[data-division=\\"bio-lab\\"]") === document.activeElement'), true);
  assert.equal(await evaluate('document.querySelector(".fsd-brand").getAttribute("href")'), '#home');
  assert.equal(await evaluate('document.querySelectorAll(".fsd-header form, .fsd-header input, [data-cart], [data-account]").length'), 0);
  assert.equal(await evaluate('Array.from(document.querySelectorAll("footer a[href^=\\"#\\"]")).every(link => document.querySelector(link.getAttribute("href")))'), true);
  await closeRouteAndReset();

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
  await waitFor(`document.querySelector(".fsd-feature-copy h3")?.textContent === ${JSON.stringify(ropeItem.title)} && !document.querySelector(".fsd-feature-media img") && document.querySelector(".fsd-feature-media--unmapped")`);
  await click('#fsd-mega-menu .fsd-feature-cta');
  await waitFor(`location.pathname === ${JSON.stringify(ropeItem.href)} && document.querySelector("#product-title")?.textContent.includes("FSD Weighted Skipping Rope")`);
  await waitFor('document.querySelector("#campaign-image")?.naturalWidth === 1672');
  await closeRouteAndReset();

  for (const [id, heading] of [
    ['collections', 'SHOP'],
    ['universe', 'FSD UNIVERSE'],
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

  // Escape closes only the top modal layer, then the underlying mega-menu.
  await click('.fsd-primary-trigger[data-nav-primary="hardware"]');
  await waitFor('!document.querySelector("#fsd-mega-menu").hidden');
  assert.equal(await evaluate('document.querySelector(".fsd-bag-toggle .fsd-boxing-bag-icon") !== null'), true);
  const boxingBagFill = await evaluate('getComputedStyle(document.querySelector(".fsd-boxing-bag-icon__body")).fill');
  assert.match(boxingBagFill, /rgba\(/);
  assert.ok(Number(boxingBagFill.match(/,\s*([0-9.]+)\)$/)?.[1]) < 1);
  await click('[data-bag-open]');
  await waitFor('document.querySelector("#fsd-bag-dialog").open');
  await key('Escape');
  await waitFor('!document.querySelector("#fsd-bag-dialog").open');
  assert.equal(await evaluate('!document.querySelector("#fsd-mega-menu").hidden'), true);
  await waitFor('document.activeElement.matches("[data-bag-open]")');
  await key('Escape');
  await waitFor('document.querySelector("#fsd-mega-menu").hidden');
  await waitFor('document.activeElement.matches(".fsd-primary-trigger[data-nav-primary=\\"hardware\\"]")');

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
  const mobileNavMetrics = await evaluate(`(() => {
    const announcement = document.querySelector(".announcement.fsd-announcement").getBoundingClientRect();
    const shell = document.querySelector(".fsd-navigation-shell").getBoundingClientRect();
    const spacer = document.querySelector(".fsd-navigation-spacer").getBoundingClientRect();
    return {
      position: getComputedStyle(document.querySelector(".fsd-navigation-shell")).position,
      announcementHeight: announcement.height,
      shellTop: shell.top,
      shellHeight: shell.height,
      spacerHeight: spacer.height,
      viewportWidth: window.innerWidth,
    };
  })()`);
  assert.ok(
    mobileNavMetrics.position === 'fixed'
      && Math.abs(mobileNavMetrics.announcementHeight - 23) < 1
      && Math.abs(mobileNavMetrics.shellTop - mobileNavMetrics.announcementHeight) < 1
      && Math.abs(mobileNavMetrics.spacerHeight - mobileNavMetrics.shellHeight) < 1,
    `Mobile navigation geometry: ${JSON.stringify(mobileNavMetrics)}`,
  );
  await evaluate('window.scrollTo({ top: 220, behavior: "instant" })');
  await waitFor('window.scrollY > 0');
  assert.ok(await evaluate('Math.abs(document.querySelector(".fsd-navigation-shell").getBoundingClientRect().top - document.querySelector(".announcement.fsd-announcement").getBoundingClientRect().height) < 1'));
  await evaluate('window.scrollTo({ top: 0, behavior: "instant" })');
  await waitFor('window.scrollY === 0');
  if (await evaluate('CSS.supports("backdrop-filter: blur(1px)")')) {
    assert.match(await evaluate('getComputedStyle(document.querySelector(".header.fsd-header")).backdropFilter'), /blur\(16px\)/);
  }
  assert.equal(await evaluate('getComputedStyle(document.querySelector("[data-nav-mobile-toggle]")).display !== "none"'), true);
  await click('[data-nav-mobile-toggle]');
  await waitFor('document.querySelector("#fsd-mega-menu").dataset.step === "primary" && document.body.classList.contains("fsd-mobile-nav-open")');
  assert.equal(await evaluate('document.querySelectorAll(".fsd-mobile-primary-list [data-nav-primary]").length'), 6);
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".fsd-mobile-public-links")).display'), 'flex');
  assert.equal(await evaluate('document.querySelector(".fsd-mobile-public-links [data-nav-house]")?.getAttribute("href")'), '/the-house.html');
  assert.equal(await evaluate('document.querySelector(".fsd-mobile-public-links [data-nav-investor]")?.getAttribute("href")'), '/investor.html');
  await click('.fsd-mobile-primary-list [data-nav-primary="collections"]');
  assert.equal(await evaluate('document.querySelector("#fsd-mega-menu").dataset.step'), 'groups');
  await click('#fsd-mega-menu [data-nav-group="0"]');
  assert.equal(await evaluate('document.querySelector("#fsd-mega-menu").dataset.step'), 'detail');
  await assertNoHorizontalPageScroll();
  assert.equal(await evaluate('window.scrollY'), startingScrollY);
  await capture('fsd-navigation-mobile.jpg');
  await click('#fsd-mega-menu [data-nav-back]');
  assert.equal(await evaluate('document.querySelector("#fsd-mega-menu").dataset.step'), 'groups');
  await click('#fsd-mega-menu [data-nav-back]');
  assert.equal(await evaluate('document.querySelector("#fsd-mega-menu").dataset.step'), 'primary');
  await click('.fsd-mobile-primary-list [data-nav-primary="collections"]');
  await click('#fsd-mega-menu [data-nav-group="1"]');
  await click('#fsd-mega-menu [data-nav-item="0"]');
  await waitFor('document.querySelector("#fsd-showcase-dialog").open && document.querySelector("#fsd-showcase-dialog [data-subcategory-index=\\"0\\"][aria-pressed=\\"true\\"]")');
  await click('#fsd-showcase-dialog [data-explore-collection]');
  await waitFor('document.querySelector("#catalogue-archive").open && document.querySelector("#fsd-mega-menu").hidden && document.querySelector("#catalogue-collection").value === "womens-modest-combat" && document.querySelector("#search").value === "Hijab"');
  await assertNoHorizontalPageScroll();
  await waitFor('(() => { const rect = document.querySelector("#products").getBoundingClientRect(); return rect.bottom > 0 && rect.top < window.innerHeight; })()');
  assert.equal(await evaluate('document.querySelector("#catalogue-count").textContent !== "No matching products"'), true);
  await click('[data-nav-mobile-toggle]');
  await waitFor('document.querySelector("#fsd-mega-menu").dataset.step === "primary"');
  await key('Escape');
  await waitFor('document.querySelector("#fsd-mega-menu").hidden && !document.body.classList.contains("fsd-mobile-nav-open")');
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
  await assertNoHorizontalPageScroll();

  await waitFor('document.querySelector("#fsd-home-title") && document.querySelectorAll(".fsd-editorial-card").length === 3');
  assert.equal(await evaluate('document.querySelector(".fsd-cinematic-preview") === null'), true);
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false,
  });
  assert.equal(await evaluate('(() => { const box = document.querySelector(".fsd-home-hero").getBoundingClientRect(); return box.left >= -1 && box.width >= window.innerWidth - 24; })()'), true);
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, deviceScaleFactor: 2, mobile: true,
  });
  await assertNoHorizontalPageScroll();
  assert.equal(await evaluate('(() => { const box = document.querySelector(".fsd-home-hero").getBoundingClientRect(); return box.left >= -1 && box.width >= window.innerWidth - 24; })()'), true);
  await capture('fsd-home-streamlined-mobile.jpg');

  const modestCollection = shopCollections.find(collection => collection.label.includes('MODEST COMBAT'));
  assert.ok(modestCollection, 'The current Women’s Modest Combat collection should be searchable.');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false,
  });
  await evaluate('window.scrollTo(0, 0)');
  await waitFor('window.scrollY === 0');
  await evaluate('window.__fsdAnalyticsEvents = []; window.umami = { track: (name, data) => window.__fsdAnalyticsEvents.push({ name, data }) };');
  await click('[data-search-open]');
  await waitFor('document.querySelector("#fsd-search-dialog")?.open');
  assert.equal(await evaluate('document.activeElement.id'), 'fsd-search-input');
  assert.ok(await evaluate('document.querySelectorAll(".fsd-search-suggestions [data-search-collection]").length > 0'));
  assert.equal(await evaluate('document.querySelector("#fsd-search-dialog").textContent.includes("£")'), false);
  await capture('fsd-search-overlay-desktop.jpg');
  await send('Input.insertText', { text: 'Modest' });
  await waitFor(`Boolean(document.querySelector('[data-search-collection="${modestCollection.id}"]'))`);
  await click(`[data-search-collection="${modestCollection.id}"]`);
  await waitFor(`!document.querySelector("#fsd-search-dialog").open && document.querySelector("#catalogue-archive").open && document.querySelector("#catalogue-collection").value === ${JSON.stringify(modestCollection.id)}`);
  const selectedCollectionEvent = await evaluate('window.__fsdAnalyticsEvents.find(event => event.name === "search_destination_selected")');
  assert.equal(selectedCollectionEvent?.data?.destination_type, 'collection');
  assert.equal(selectedCollectionEvent?.data?.destination_id, modestCollection.id);
  assert.equal(selectedCollectionEvent?.data?.selection_method, 'result_click');

  await evaluate('window.scrollTo(0, 0)');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, deviceScaleFactor: 2, mobile: true,
  });
  await click('[data-search-open]');
  await waitFor('document.querySelector("#fsd-search-dialog")?.open');
  await assertNoHorizontalPageScroll();
  await capture('fsd-search-overlay-mobile.jpg');
  await key('Escape');
  await waitFor('!document.querySelector("#fsd-search-dialog").open');
  await waitFor('document.activeElement.matches("[data-search-open]")');
  assert.equal(await evaluate('document.querySelector("[data-search-open]").getAttribute("aria-expanded")'), 'false');

  await click('[data-search-open]');
  await waitFor('document.querySelector("#fsd-search-dialog")?.open');
  await send('Input.insertText', { text: 'FSD Ombré Slash Tee' });
  await waitFor('document.querySelector(".fsd-search-empty")?.textContent.includes("No matching products or collections.")');
  assert.equal(await evaluate('document.querySelectorAll("[data-search-result]").length'), 0);
  assert.equal(await evaluate('document.querySelector("#fsd-search-dialog").textContent.includes("£")'), false);
  await click('.fsd-search-empty .fsd-search-all');
  await waitFor(`!document.querySelector("#fsd-search-dialog").open && document.querySelector("#catalogue-archive").open && document.querySelector("#search").value === ${JSON.stringify('FSD Ombré Slash Tee')}`);

  await click('[data-search-open]');
  await waitFor('document.querySelector("#fsd-search-dialog")?.open');
  await send('Input.insertText', { text: 'house codes' });
  await waitFor('Boolean(document.querySelector(\'[data-search-page="brand-story-archive"]\'))');
  await click('[data-search-page="brand-story-archive"]');
  await waitFor('location.pathname === "/story" && document.querySelector("#fsd-house-archive")?.open');
  await waitFor('document.querySelector("#philosophy")?.getBoundingClientRect().top < 180');

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false,
  });
  await send('Page.navigate', { url: `https://${domain}/` });
  await waitFor('!!document.querySelector(".fsd-primary-nav")');
  await evaluate('window.__fsdAnalyticsEvents = []; window.umami = { track: (name, data) => window.__fsdAnalyticsEvents.push({ name, data }) };');
  await click('[data-search-open]');
  await waitFor('document.querySelector("#fsd-search-dialog")?.open');
  const breezeSearchTerm = 'FSD Breeze Overshirt & Engineered Leggings Set';
  await send('Input.insertText', { text: breezeSearchTerm });
  await waitFor('document.querySelectorAll("[data-search-result]").length === 1');
  await click('#fsd-search-dialog button[type="submit"]');
  await waitFor('!document.querySelector("#fsd-search-dialog").open && document.querySelector("#product-dialog")?.open && document.querySelector("#product-dialog").textContent.includes("FSD Breeze Overshirt & Engineered Leggings Set")');
  const submittedSearchEvent = await evaluate('window.__fsdAnalyticsEvents.find(event => event.name === "site_search_submitted")');
  assert.equal(submittedSearchEvent?.data?.query_length, breezeSearchTerm.length);
  assert.equal(submittedSearchEvent?.data?.product_match_count, 1);
  assert.equal(submittedSearchEvent?.data?.destination_type, 'product');
  assert.equal(Object.hasOwn(submittedSearchEvent.data, 'query'), false);

  await send('Page.navigate', { url: `https://${domain}/` });
  await waitFor('!!document.querySelector(".fsd-primary-nav")');
  await evaluate('window.__fsdAnalyticsEvents = []; window.umami = { track: (name, data) => window.__fsdAnalyticsEvents.push({ name, data }) };');
  await click('footer a[href="#products"]');
  await waitFor('document.querySelector("#catalogue-archive").open');
  await waitFor('document.querySelector("#catalogue-grid")?.dataset.view === "list"');
  await waitFor('!!document.querySelector("#catalogue-grid [data-can-add-to-bag=\\"true\\"]")');
  const addableProductId = await evaluate('document.querySelector("#catalogue-grid [data-can-add-to-bag=\\"true\\"]")?.dataset.product');
  assert.ok(addableProductId, 'The catalogue should expose at least one confirmed addable product.');
  await evaluate(`document.querySelector('#catalogue-grid [data-product="${addableProductId}"]').scrollIntoView({ block: 'center' })`);
  await waitFor('window.scrollY > 0');
  const catalogueReturnScrollY = await evaluate('window.scrollY');
  await click(`#catalogue-grid [data-product="${addableProductId}"]`);
  await waitFor(`!!document.querySelector("#catalogue-expanded-${addableProductId}")`);
  await click(`#catalogue-expanded-${addableProductId} [data-catalogue-deep-dive]`);
  await waitFor('document.querySelector("#product-dialog")?.open');
  const openedProductEvent = await evaluate('window.__fsdAnalyticsEvents.find(event => event.name === "product_detail_opened")');
  assert.equal(openedProductEvent?.data?.product_id, Number(addableProductId));
  await click(`#product-dialog [data-bag-add="${addableProductId}"]`);
  const addedProductEvent = await evaluate('window.__fsdAnalyticsEvents.find(event => event.name === "product_added_to_bag")');
  assert.equal(addedProductEvent?.data?.product_id, Number(addableProductId));
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 8, y: 8, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 8, y: 8, button: 'left', clickCount: 1 });
  await waitFor('!document.querySelector("#product-dialog")?.open');
  await waitFor(`Math.abs(window.scrollY - ${catalogueReturnScrollY}) < 4`);
  await click('[data-bag-open]');
  await waitFor('document.querySelector("#fsd-bag-title")?.closest("dialog")?.open');
  const populatedBagEvent = await evaluate('window.__fsdAnalyticsEvents.find(event => event.name === "bag_opened")');
  assert.equal(populatedBagEvent?.data?.item_count, 1);
  assert.equal(populatedBagEvent?.data?.unit_count, 1);
  await click('[data-bag-clear]');
  await click('[data-bag-close]');
  await waitFor('!document.querySelector("#fsd-bag-title")?.closest("dialog")?.open');

  assert.deepEqual(browserErrors, []);
  console.log('Navigation browser checks passed: verified links, search and catalogue analytics, bag analytics, collection analytics, mobile draft routing, keyboard/focus, and overflow.');
} finally {
  socket?.close();
  chrome.kill('SIGTERM');
  await Promise.race([new Promise(resolve => chrome.once('exit', resolve)), delay(3000)]);
  await delay(250);
  rmSync(profile, { recursive: true, force: true, maxRetries: 6, retryDelay: 100 });
}
