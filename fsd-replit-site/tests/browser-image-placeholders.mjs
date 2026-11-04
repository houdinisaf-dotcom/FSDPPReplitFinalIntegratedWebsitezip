import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const profile = mkdtempSync(join(tmpdir(), 'fsd-images-'));
const chrome = spawn('chromium', [
  '--headless=new', '--no-sandbox', '--disable-dev-shm-usage',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore' });
let socket;
try {
  const portFile = join(profile, 'DevToolsActivePort');
  for (let i = 0; !existsSync(portFile) && i < 100; i++) await delay(100);
  assert.ok(existsSync(portFile), 'Chromium must start');
  const port = readFileSync(portFile, 'utf8').split('\n')[0];
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
  let id = 0;
  const pending = new Map();
  const exceptions = [];
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text);
    if (!message.id) return;
    const request = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) request?.reject(new Error(message.error.message));
    else request?.resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const requestId = ++id;
    pending.set(requestId, { resolve, reject });
    socket.send(JSON.stringify({ id: requestId, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const waitFor = async expression => {
    for (let i = 0; i < 150; i++) {
      if (await evaluate(`Boolean(${expression})`)) return;
      await delay(100);
    }
    throw new Error(`Timed out: ${expression}`);
  };
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `https://${process.env.REPLIT_DEV_DOMAIN}/` });
  await waitFor(`document.querySelector('.fsd-home-hero__asset') && document.querySelectorAll('.fsd-featured-card').length === 2`);
  await evaluate(`(async () => {
    const loadedModule = performance.getEntriesByType('resource').find(entry =>
      new URL(entry.name).pathname === '/src/catalogue.js');
    window.imageTestCatalogue = await import(loadedModule.name);
  })()`);

  for (const [width, height] of [[375, 844], [390, 844], [430, 874], [768, 1024], [1024, 1000], [1440, 1000]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await delay(150);
    assert.ok(await evaluate(`document.documentElement.scrollWidth <= innerWidth + 1`), `No page overflow at ${width}px`);
    assert.equal(await evaluate(`document.querySelectorAll('.fsd-editorial-card').length`), 3);
    await evaluate(`imageTestCatalogue.showProduct(18)`);
    await waitFor(`document.querySelector('#product-dialog').open`);
    assert.ok(await evaluate(`document.querySelector('#dialog-body .fsd-image-placeholder') !== null`));
    await evaluate(`(() => {
      const color = document.querySelector('#dialog-body input[data-catalogue-colourway-index="1"]');
      color.checked = true; color.dispatchEvent(new Event('change', { bubbles: true }));
      document.querySelector('#dialog-body input[data-product-size]').click();
    })()`);
    assert.ok(await evaluate(`!document.querySelector('[data-catalogue-variant-placeholder]').hidden`));
    assert.ok(await evaluate(`!document.querySelector('[data-product-primary-add]').disabled`), 'Missing photos do not disable valid purchase controls');
    assert.ok(await evaluate(`(() => {
      const sticky = document.querySelector('[data-sticky-add-bar]');
      if (sticky.hidden) return true;
      const bounds = sticky.getBoundingClientRect();
      return bounds.left >= -1 && bounds.right <= innerWidth + 1;
    })()`), `Sticky purchase controls stay within the ${width}px viewport`);
    await evaluate(`document.querySelector('#product-dialog').close()`);
    await delay(100);
  }

  await evaluate(`(() => {
    window.imageSlotDimensions = ['.fsd-home-hero', '.fsd-editorial-card--men', '.fsd-featured-card__media'].map(selector => {
      const node = document.querySelector(selector);
      return [selector, node.getBoundingClientRect().width, node.getBoundingClientRect().height];
    });
    document.querySelector('.fsd-home-hero__asset').src = '/missing-home-test.webp';
    document.querySelector('.fsd-editorial-card--men img').loading = 'eager';
    document.querySelector('.fsd-editorial-card--men img').src = '/missing-collection-test.webp';
    document.querySelector('.fsd-featured-card__media img').loading = 'eager';
    document.querySelector('.fsd-featured-card__media img').src = '/missing-featured-test.webp';
  })()`);
  await waitFor(`document.querySelector('.fsd-home-hero .fsd-image-placeholder') &&
    document.querySelector('.fsd-editorial-card--men .fsd-image-placeholder') &&
    document.querySelector('.fsd-featured-card__media .fsd-image-placeholder')`);
  assert.ok(await evaluate(`imageSlotDimensions.every(([selector, width, height]) => {
    const rect = document.querySelector(selector).getBoundingClientRect();
    return Math.abs(rect.width - width) < 1 && Math.abs(rect.height - height) < 1;
  })`), 'Broken-image fallbacks retain their slot dimensions');

  await evaluate(`(async () => {
    const loadedProducts = performance.getEntriesByType('resource').find(entry =>
      new URL(entry.name).pathname === '/src/data/products.js');
    const { products } = await import(loadedProducts.name);
    const product = products.find(item => item.id === 34);
    window.missingColour = 'Navy & Ice Blue';
    product.images = product.images.filter(image => image.colourway !== missingColour);
    imageTestCatalogue.showProduct(34);
    const color = document.querySelector('#dialog-body input[data-catalogue-colourway-index="2"]');
    color.checked = true; color.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  assert.ok(await evaluate(`!document.querySelector('[data-catalogue-variant-placeholder]').hidden &&
    document.querySelector('[data-catalogue-variant-label]').textContent === missingColour`));
  await evaluate(`document.querySelector('#dialog-body input[data-catalogue-colourway-index="0"]').click()`);
  assert.ok(await evaluate(`document.querySelector('[data-catalogue-variant-placeholder]').hidden &&
    !document.querySelector('[data-catalogue-main-image]').hidden`), 'Available colour restores its photograph');
  await evaluate(`(async () => {
    document.querySelector('#product-dialog').close();
    const loadedProducts = performance.getEntriesByType('resource').find(entry =>
      new URL(entry.name).pathname === '/src/data/products.js');
    const { products } = await import(loadedProducts.name);
    const product = products.find(item => item.id === 34);
    const image = product.images.find(image => image.colourway);
    product.images.push({ ...image, size: 'XXL', label: 'Dedicated XXL fit image' });
    imageTestCatalogue.showProduct(34);
    document.querySelector('#dialog-body input[data-product-size][value="XXL"]').click();
  })()`);
  assert.equal(await evaluate(`document.querySelector('[data-catalogue-main-caption]').textContent`), 'Dedicated XXL fit image');
  await evaluate(`document.querySelector('#product-dialog').close()`);
  await waitFor(`!document.querySelector('#product-dialog').open`);
  await delay(150);
  await evaluate(`imageTestCatalogue.navigateCatalogue({ query: 'High-Waisted Sculpt', view: 'visual' })`);
  await waitFor(`document.querySelector('#catalogue-grid .product-card--visual [data-product="75"]')`);
  await evaluate(`(() => {
    const card = document.querySelector('#catalogue-grid .product-card--visual');
    [...card.querySelectorAll('.catalogue-card__swatches button')].find(button => button.getAttribute('aria-label').includes('Teal')).click();
  })()`);
  await waitFor(`document.querySelector('.catalogue-card__swatches button[aria-pressed="true"]')?.getAttribute('aria-label').includes('Teal')`);
  await evaluate(`document.querySelector('#catalogue-grid [data-product="75"]').click()`);
  await waitFor(`document.querySelector('[data-catalogue-inline-colourway][aria-pressed="true"]')?.textContent.includes('Teal')`);
  await evaluate(`document.querySelector('[data-catalogue-deep-dive]').click()`);
  await waitFor(`document.querySelector('#product-dialog').open && document.querySelector('[data-catalogue-selected-colourway]')?.textContent === 'Teal'`);
  await evaluate(`(() => {
    document.querySelector('#dialog-body input[data-product-size][value="M"]').click();
    document.querySelector('#dialog-body [data-product-primary-add]').click();
  })()`);
  await evaluate(`document.querySelector('#product-dialog').close()`);
  await delay(150);
  await evaluate(`document.querySelector('[data-bag-open]').click()`);
  await waitFor(`document.querySelector('#fsd-bag-dialog').open && document.querySelector('.fsd-bag-item')`);
  assert.ok(await evaluate(`document.querySelector('.fsd-bag-item').textContent.includes('Teal') && document.querySelector('.fsd-bag-item').textContent.includes('M')`), 'Bag retains the chosen colour and size');
  await evaluate(`document.querySelector('[data-bag-quantity="1"]').click()`);
  assert.ok(await evaluate(`document.querySelector('[data-bag-subtotal]').textContent.includes('130.00')`), 'Quantity increase updates the £65 item subtotal');
  await evaluate(`document.querySelector('[data-bag-quantity="-1"]').click()`);
  assert.ok(await evaluate(`document.querySelector('[data-bag-subtotal]').textContent.includes('65.00')`), 'Quantity decrease updates the subtotal');
  for (const width of [375, 390, 430, 768, 1024, 1440]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
    assert.ok(await evaluate(`document.documentElement.scrollWidth <= innerWidth + 1 && document.querySelector('#fsd-bag-dialog').getBoundingClientRect().right <= innerWidth + 1`), `Bag fits at ${width}px`);
  }
  await evaluate(`document.querySelector('[data-bag-remove]').click()`);
  assert.equal(await evaluate(`document.querySelectorAll('.fsd-bag-item').length`), 0, 'Removing the final item restores the empty bag');
  assert.deepEqual(exceptions, []);
  console.log('PASS: desktop/tablet/mobile layouts; missing product images; working colour/size controls; stable broken-image fallbacks; colour and size photograph mapping.');
} finally {
  socket?.close();
  chrome.kill('SIGTERM');
  await delay(200);
  rmSync(profile, { recursive: true, force: true });
}
