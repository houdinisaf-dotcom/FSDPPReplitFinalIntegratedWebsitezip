// Run against the running Replit workflow. Uses system Chromium and Node's CDP
// WebSocket support, with no browser-test package or downloaded browser needed.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const domain = process.env.REPLIT_DEV_DOMAIN;
assert.ok(domain, 'REPLIT_DEV_DOMAIN must identify the running development preview.');
const profile = mkdtempSync(join(tmpdir(), 'fsd-browser-'));
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
    for (let attempt = 0; attempt < 100; attempt++) {
      if (await evaluate(expression)) return;
      await delay(100);
    }
    throw new Error(`Browser condition did not become true: ${expression}`);
  };
  const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  const key = async value => {
    const keyCode = { Escape: 27, Tab: 9, ArrowRight: 39, ArrowLeft: 37 }[value];
    const parameters = { key: value, code: value, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode };
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...parameters });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', ...parameters });
  };
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.bringToFront');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await send('Page.navigate', { url: `https://${domain}/` });
  await waitFor(`!!document.querySelector('[data-division="apparel"]')`);
  assert.equal(await evaluate('document.querySelectorAll("[data-division]").length'), 4);
  assert.equal(await evaluate('document.querySelectorAll(".showroom-archive[open]").length'), 0);

  for (const division of ['apparel', 'bio-lab', 'hardware', 'global']) {
    await click(`[data-division="${division}"]`);
    await waitFor('document.querySelector("#fsd-showcase-dialog").open');
    assert.equal(await evaluate('document.querySelectorAll("dialog[open]").length'), 1);
    assert.ok(await evaluate('document.documentElement.classList.contains("fsd-modal-open")'));
    assert.ok(!await evaluate('/STRIDE|Shilajit|Championship Belt|Ring Corner Post|in development/i.test(document.querySelector("[data-dialog-content]").textContent)'));
    if (division === 'apparel') {
      for (let count = 0; count < 12; count++) await key('Tab');
      assert.ok(await evaluate('document.querySelector("#fsd-showcase-dialog").contains(document.activeElement)'));
    }
    await key('Escape');
    await waitFor('!document.querySelector("#fsd-showcase-dialog").open && !document.documentElement.classList.contains("fsd-modal-open")');
    assert.equal(await evaluate('document.activeElement.dataset.division'), division);
  }

  await click('[data-division="apparel"]');
  await click('[data-group-index="1"]');
  await click('[data-subcategory-index="0"]');
  assert.ok(await evaluate('document.querySelector("[data-product-id=\\"43\\"]").closest("article").querySelector("img").src.endsWith("fsd-velocity-performance-sports-hijab.jpg")'));
  await click('[data-product-id="43"]');
  await waitFor('document.querySelector("#product-dialog").open');
  assert.equal(await evaluate('document.querySelectorAll("dialog[open]").length'), 1);
  assert.ok(await evaluate('document.querySelector("#product-title").textContent.includes("Velocity")'));
  await click('#close-dialog');
  await waitFor('!document.querySelector("#product-dialog").open && !document.documentElement.classList.contains("fsd-modal-open")');
  assert.equal(await evaluate('document.activeElement.dataset.division'), 'apparel');

  await click('[data-division="hardware"]');
  assert.deepEqual(await evaluate('Array.from(document.querySelectorAll("[data-product-id]"), b => Number(b.dataset.productId))'), [69, 70, 71, 72]);
  assert.ok(await evaluate('document.querySelector("[data-dialog-content]").textContent.includes("£699.99") && document.querySelector("[data-dialog-content]").textContent.includes("£299.99")'));
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
  assert.equal(await evaluate('document.querySelector("#search").value'), 'Hijab');
  const filteredNames = await evaluate('Array.from(document.querySelectorAll("#catalogue-grid h3"), heading => heading.textContent)');
  assert.ok(filteredNames.length > 0 && filteredNames.every(name => /hijab/i.test(name)));
  await click('a[href="#full-gallery"]');
  assert.ok(await evaluate('document.querySelector("#gallery-archive").open'));
  assert.ok(!await evaluate('/STRIDE|Shilajit/i.test(document.querySelector("#full-gallery").textContent)'));
  await click('[data-feature-next]');
  await waitFor('document.querySelector(".showroom-feature-track").scrollLeft > 0');
  assert.ok(await evaluate('document.querySelector("#contact button").disabled && !document.querySelector("#contact form, #contact input")'));

  assert.deepEqual(browserErrors, []);
  console.log('Desktop browser checks passed: all divisions, subcategories, focus/closing, product handoff, catalogue navigation, gallery holds, carousel, and deferred VIP. Mobile layouts require a separate visual review.');
} finally {
  socket?.close();
  chrome.kill('SIGTERM');
  await Promise.race([new Promise(resolve => chrome.once('exit', resolve)), delay(3000)]);
  rmSync(profile, { recursive: true, force: true });
}
