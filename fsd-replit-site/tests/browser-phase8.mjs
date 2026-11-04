import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const domain = process.env.REPLIT_DEV_DOMAIN;
assert.ok(domain, 'The running preview domain is required.');
const profile = mkdtempSync(join(tmpdir(), 'fsd-phase8-'));
const chrome = spawn('chromium', [
  '--headless=new', '--no-sandbox', '--disable-dev-shm-usage',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore' });
let socket;
const pending = new Map();
try {
  const portFile = join(profile, 'DevToolsActivePort');
  for (let i = 0; !existsSync(portFile) && i < 100; i++) await delay(100);
  assert.ok(existsSync(portFile), 'Chromium must start.');
  const port = readFileSync(portFile, 'utf8').split('\n')[0];
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let sequence = 0;
  const errors = [];
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const request = pending.get(message.id);
      if (!request) return;
      pending.delete(message.id);
      clearTimeout(request.timer);
      if (message.error) request.reject(new Error(JSON.stringify(message.error)));
      else request.resolve(message.result);
    } else if (message.method === 'Runtime.exceptionThrown') {
      errors.push(message.params.exceptionDetails.text);
    }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`CDP timeout: ${method}`));
    }, 15000);
    pending.set(id, { resolve, reject, timer });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const waitFor = async expression => {
    for (let i = 0; i < 120; i++) {
      if (await evaluate(expression)) return;
      await delay(100);
    }
    throw new Error(`Condition failed: ${expression}`);
  };
  const key = async value => {
    const parameters = { key: value, code: value, windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 };
    await send('Input.dispatchKeyEvent', { type: 'keyDown', text: '\r', unmodifiedText: '\r', ...parameters });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', ...parameters });
  };
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.bringToFront');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await send('Page.navigate', { url: `https://${domain}/#beyond-fsd` });
  await waitFor('document.querySelector("[data-runtime-ready=true]") && document.querySelector("[data-garment-choice]")');
  assert.equal(await evaluate('document.querySelectorAll("[data-garment-studies]").length'), 1);
  assert.equal(await evaluate('document.querySelectorAll(".showroom-concepts__group").length'), 4);
  assert.equal(await evaluate('document.querySelectorAll(".showroom-concepts__group li a").length'), 12);
  assert.equal(await evaluate('document.querySelectorAll("[data-garment-choice] svg").length'), 3);
  assert.equal(await evaluate('document.querySelectorAll(".showroom-concepts__group[open]").length'), 0);
  assert.equal(await evaluate(`(() => {
    const button = document.querySelector('[data-garment-choice="tank"]');
    button.click();
    return document.querySelector('[data-garment-title]').textContent;
  })()`), 'Technical Tank', 'Click selection must update the feature preview.');
  await evaluate(`document.querySelector('[data-garment-choice="leggings"]').click()`);

  for (const [width, height] of [[1440, 900], [768, 1024], [393, 852]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    assert.equal(await evaluate('innerWidth'), width, 'Measure the requested CSS viewport, not a scaled mobile viewport.');
    for (const [id, title] of [['tank', 'Technical Tank'], ['jacket', 'Run Jacket'], ['leggings', 'Performance Leggings']]) {
      await evaluate(`document.querySelector('[data-garment-choice="${id}"]').focus()`);
      await key('Enter');
      await waitFor(`document.querySelector("[data-garment-title]").textContent === ${JSON.stringify(title)}`);
      assert.equal(await evaluate('document.querySelectorAll(\'[data-garment-choice][aria-pressed="true"]\').length'), 1);
      assert.equal(await evaluate('document.querySelector("[data-garment-preview] .fsd-image-placeholder__title")?.textContent'), title);
      const aspect = await evaluate('(() => { const r = document.querySelector("[data-garment-preview]").getBoundingClientRect(); return r.width / r.height; })()');
      assert.ok(Math.abs(aspect - 0.8) < 0.02, `${width}px preview retains its 4:5 stage`);
    }
    await evaluate('document.querySelector(".showroom-concepts__group summary").focus()');
    await key('Enter');
    assert.equal(await evaluate('document.querySelector(".showroom-concepts__group").open'), true);
    await key('Enter');
    assert.equal(await evaluate('document.querySelector(".showroom-concepts__group").open'), false);
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth + 1'), true, `${width}px page must not overflow`);
    assert.equal(await evaluate('document.querySelector("#innovations").nextElementSibling.id'), 'beyond-fsd');
    assert.equal(await evaluate('document.querySelector("#beyond-fsd").nextElementSibling.id'), 'brand-community');
    console.log(`Phase 8 ${width}px: selections, keyboard, placeholders, aspect ratio and compact groups passed.`);
  }

  const links = await evaluate('[...document.querySelectorAll(".showroom-concepts__group li a, [data-garment-destination]")].map(a => a.getAttribute("href"))');
  for (const href of [...new Set(links.filter(href => href.startsWith('/')))]) {
    const response = await fetch(`https://${domain}${href.split('#')[0]}`);
    assert.equal(response.status, 200, `Destination must load: ${href}`);
  }
  for (const [hash, title] of [['bio-lab/smart-apparel', 'Smart Apparel'], ['bio-lab/adaptive-fabrics', 'Adaptive Technical Fabrics']]) {
    await send('Page.navigate', { url: `https://${domain}/the-house.html#${hash}` });
    await waitFor(`document.querySelector("h1")?.textContent.toLowerCase().includes(${JSON.stringify(title.toLowerCase())})`);
  }
  assert.deepEqual(errors, [], 'No uncaught browser exceptions.');
  console.log('Phase 8 browser checks passed: all destinations respond, House research routes render, no uncaught exceptions.');
} finally {
  for (const request of pending.values()) clearTimeout(request.timer);
  socket?.close();
  chrome.kill('SIGTERM');
  await Promise.race([new Promise(resolve => chrome.once('exit', resolve)), delay(2500)]);
  await delay(200);
  rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
}
