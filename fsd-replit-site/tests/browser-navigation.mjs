// Browser interaction checks for the desktop mega-menu and mobile navigation sheet.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const domain = process.env.REPLIT_DEV_DOMAIN;
assert.ok(domain, 'REPLIT_DEV_DOMAIN must identify the running development preview.');
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
  const key = async value => {
    const keyCode = { Escape: 27, Tab: 9, ArrowDown: 40 }[value];
    const parameters = { key: value, code: value, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode };
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...parameters });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', ...parameters });
  };
  const capture = async fileName => {
    if (process.env.FSD_NAV_CAPTURE !== '1') return;
    const image = await send('Page.captureScreenshot', { format: 'jpeg', quality: 88, fromSurface: true });
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

  await click('#fsd-mega-menu [data-nav-group="1"]');
  assert.equal(await evaluate('document.querySelector("#fsd-mega-menu [data-nav-item=\\"0\\"]").textContent.includes("Performance Hijabs")'), true);
  assert.equal(await evaluate('window.scrollY'), startingScrollY);

  for (const [id, heading] of [
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
  }
  assert.equal(await evaluate('document.querySelector("#fsd-mega-menu form, #fsd-mega-menu input")'), null);
  assert.equal(await evaluate('document.querySelector("#contact button").disabled'), true);

  await key('Escape');
  await waitFor('document.querySelector("#fsd-mega-menu").hidden && !document.querySelector(".fsd-navigation-shell").classList.contains("is-open")');
  assert.equal(await evaluate('document.querySelector(".fsd-primary-trigger[data-nav-primary=\\"private-access\\"]").getAttribute("aria-expanded")'), 'false');

  await click('.fsd-primary-trigger[data-nav-primary="collections"]');
  await click('#fsd-mega-menu .fsd-feature-cta');
  await waitFor('document.querySelector("#fsd-showcase-dialog").open');
  await waitFor('document.querySelector("#fsd-showcase-dialog [data-subcategory-index=\\"1\\"][aria-pressed=\\"true\\"]")');
  assert.equal(await evaluate('document.querySelector("#fsd-showcase-dialog [data-group-index=\\"0\\"][aria-pressed=\\"true\\"]") !== null'), true);
  await key('Escape');
  await waitFor('!document.querySelector("#fsd-showcase-dialog").open');

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
  await click('#fsd-mega-menu [data-nav-item="1"]');
  assert.equal(await evaluate('document.querySelector("#fsd-mega-menu [data-nav-item=\\"1\\"]").getAttribute("aria-pressed")'), 'true');
  assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'), true);
  assert.equal(await evaluate('window.scrollY'), startingScrollY);
  await capture('fsd-navigation-mobile.jpg');
  await click('#fsd-mega-menu [data-nav-back]');
  assert.equal(await evaluate('document.querySelector("#fsd-mega-menu").dataset.step'), 'groups');
  await click('#fsd-mega-menu [data-nav-back]');
  assert.equal(await evaluate('document.querySelector("#fsd-mega-menu").dataset.step'), 'primary');
  await key('Escape');
  await waitFor('document.querySelector("#fsd-mega-menu").hidden && !document.body.classList.contains("fsd-mobile-nav-open")');
  assert.equal(await evaluate('document.activeElement.matches("[data-nav-mobile-toggle]")'), true);

  assert.deepEqual(browserErrors, []);
  console.log('Navigation browser checks passed: desktop reference layout, category/group switching, CTA handoff, hover continuity, Escape, mobile steps, scroll stability and overflow.');
} finally {
  socket?.close();
  chrome.kill('SIGTERM');
  await Promise.race([new Promise(resolve => chrome.once('exit', resolve)), delay(3000)]);
  rmSync(profile, { recursive: true, force: true });
}
