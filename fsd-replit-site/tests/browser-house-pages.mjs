import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { HOUSE_PAGE_REGISTRY } from '../src/data/house-page-readiness.js';

const domain = process.env.REPLIT_DEV_DOMAIN;
assert.ok(domain, 'REPLIT_DEV_DOMAIN must identify the running development preview.');

const viewports = [320, 375, 390, 430, 768, 820, 1024, 1280, 1366, 1440, 1600, 1920];
const profile = mkdtempSync(join(tmpdir(), 'fsd-house-browser-'));
const chrome = spawn('chromium', [
  '--headless=new',
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--remote-debugging-port=0',
  `--user-data-dir=${profile}`,
  'about:blank',
], { stdio: 'ignore' });
let socket;
let sequence = 0;
const pending = new Map();

try {
  const portFile = join(profile, 'DevToolsActivePort');
  for (let attempt = 0; !existsSync(portFile) && attempt < 100; attempt += 1) await delay(100);
  assert.ok(existsSync(portFile), 'Chromium did not start.');
  const port = readFileSync(portFile, 'utf8').split('\n')[0];
  const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

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
      reject(new Error(`CDP timeout: ${method}`));
    }, 15000);
    pending.set(id, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const waitFor = async (expression, context) => {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      if (await evaluate(expression)) return;
      await delay(50);
    }
    throw new Error(`Condition failed for ${context}: ${expression}`);
  };

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.bringToFront');

  for (const width of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: width < 768,
    });
    for (const route of HOUSE_PAGE_REGISTRY) {
      browserErrors.length = 0;
      await send('Page.navigate', { url: `https://${domain}${route.path}` });
      await waitFor(
        'document.querySelector("main h1")',
        `${route.path} at ${width}px`,
      );
      await waitFor(
        'document.body?.getAttribute("data-fsd-house-editorial") === "true"',
        `${route.path} editorial runtime at ${width}px`,
      );
      const result = await evaluate(`(() => ({
        title: document.querySelector('h1')?.textContent.trim() || '',
        pathname: location.pathname,
        width: document.documentElement.clientWidth,
        documentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
        status: document.documentElement.getAttribute('data-fsd-status') || '',
        ribbon: Boolean(document.querySelector('[data-fsd-house-draft-ribbon]')),
        reviewNote: Boolean(document.querySelector('[data-fsd-internal-review-only]')),
        mainCount: document.querySelectorAll('main').length,
        headingCount: document.querySelectorAll('h1').length,
        heroCount: document.querySelectorAll('.hero').length,
        footerCount: document.querySelectorAll('footer, .page-footer').length,
        contentSections: document.querySelectorAll('main.fsd section').length,
        expansionCount: document.querySelectorAll('[data-fsd-house-expansion]').length,
        expansionPointCount: document.querySelectorAll('[data-fsd-house-expansion] .fsd-house-expansion__point').length,
        emptyExpansionPoints: Array.from(document.querySelectorAll('[data-fsd-house-expansion] .fsd-house-expansion__point'))
          .filter(point => !point.textContent.trim()).length,
      }))()`);

      const expectedHeading = route.heading || route.title;
      assert.ok(result.title.toLowerCase().includes(expectedHeading.toLowerCase()),
        `${route.path} rendered "${result.title}" at ${width}px.`);
      assert.equal(result.pathname, route.path, `${route.path} did not load as its own URL at ${width}px.`);
      const overflow = result.documentWidth > result.width + 1
        ? await evaluate(`Array.from([document.documentElement, document.body, ...document.querySelectorAll('body *')])
          .map(element => ({tag: element.tagName, className: String(element.className || ''), id: element.id,
            left: Math.round(element.getBoundingClientRect().left), right: Math.round(element.getBoundingClientRect().right),
            width: Math.round(element.getBoundingClientRect().width), scrollWidth: element.scrollWidth,
            clientWidth: element.clientWidth, margin: getComputedStyle(element).margin}))
          .filter(box => box.left < -1 || box.right > document.documentElement.clientWidth + 1
            || box.scrollWidth > box.clientWidth + 1)
          .slice(0, 8)`)
        : [];
      assert.ok(result.documentWidth <= result.width + 1,
        `${route.path} overflows horizontally at ${width}px (${result.documentWidth}px): ${JSON.stringify(overflow)}`);
      assert.equal(result.mainCount, 1, `${route.path} must have one page main at ${width}px.`);
      assert.equal(result.headingCount, 1, `${route.path} must have one page heading at ${width}px.`);
      assert.equal(result.heroCount, 1, `${route.path} must have one page hero at ${width}px.`);
      assert.equal(result.footerCount, 1, `${route.path} must have one page ending at ${width}px.`);
      if (route.readiness === 'PUBLIC') {
        assert.ok(result.contentSections >= 2,
          `${route.path} needs a distinct, substantive second section at ${width}px.`);
      }
      if (result.expansionCount) {
        assert.ok(result.expansionPointCount >= 2,
          `${route.path} has an incomplete House editorial expansion at ${width}px.`);
        assert.equal(result.emptyExpansionPoints, 0,
          `${route.path} has an empty public content item at ${width}px.`);
      }
      assert.equal(result.ribbon, route.readiness === 'NOT_READY',
        `${route.path} draft ribbon did not match its registry state at ${width}px.`);
      assert.equal(result.reviewNote, route.readiness === 'NOT_READY',
        `${route.path} internal review note must appear only on development-only drafts at ${width}px.`);
      assert.equal(result.status.startsWith('NOT READY'), route.readiness === 'NOT_READY',
        `${route.path} status did not match its registry state at ${width}px.`);

      await waitFor(`(() => {
        const scroller = document.scrollingElement;
        scroller.scrollTop = scroller.scrollHeight;
        return scroller.scrollTop + innerHeight >= scroller.scrollHeight - 1;
      })()`,
        `${route.path} scroll to the page end at ${width}px`);
      if (route.path === '/fight-promotions.html') {
        await evaluate(`document.querySelectorAll('.hero-media img, .visual-gallery img')
          .forEach(image => { image.loading = 'eager'; })`);
        await waitFor(`(() => {
          const images = Array.from(document.querySelectorAll('.hero-media img, .visual-gallery img'));
          return images.length === 7 && images.every(image => image.complete && image.naturalWidth > 0);
        })()`,
          `${route.path} concept images load at ${width}px`);
      }
      const bottom = await evaluate(`(() => {
        return {
          title: document.querySelector('h1')?.textContent.trim() || '',
          headingCount: document.querySelectorAll('h1').length,
          heroCount: document.querySelectorAll('.hero').length,
          mainCount: document.querySelectorAll('main').length,
        };
      })()`);
      assert.equal(bottom.title, result.title, `${route.path} changed title while scrolling at ${width}px.`);
      assert.equal(bottom.headingCount, 1, `${route.path} shows another page heading below its hero at ${width}px.`);
      assert.equal(bottom.heroCount, 1, `${route.path} shows another page banner while scrolling at ${width}px.`);
      assert.equal(bottom.mainCount, 1, `${route.path} contains another page body while scrolling at ${width}px.`);
      assert.deepEqual(browserErrors, [], `${route.path} emitted browser errors at ${width}px.`);
    }
  }

  await send('Page.navigate', { url: `https://${domain}/` });
  await waitFor('document.querySelector("#fsd-house-archive") && document.querySelector("[data-house-destination=\\"dublin\\"]")');
  await evaluate('document.querySelector("#fsd-house-archive").open = true');
  await evaluate('document.querySelector("[data-house-destination=\\"dublin\\"]").click()');
  await waitFor('location.pathname === "/flagships/dublin.html" && document.querySelector("main h1")?.textContent.trim() === "Dublin"');
  await send('Page.reload');
  await waitFor('location.pathname === "/flagships/dublin.html" && document.querySelector("main h1")?.textContent.trim() === "Dublin"');
  await send('Page.navigate', { url: `https://${domain}/flagships/belfast.html` });
  await waitFor('location.pathname === "/flagships/belfast.html" && document.querySelector("main h1")?.textContent.trim() === "Belfast"');
  await evaluate('history.back()');
  await waitFor('location.pathname === "/flagships/dublin.html" && document.querySelector("main h1")?.textContent.trim() === "Dublin"');
  await evaluate('history.forward()');
  await waitFor('location.pathname === "/flagships/belfast.html" && document.querySelector("main h1")?.textContent.trim() === "Belfast"');

  console.log(`House browser checks passed: ${HOUSE_PAGE_REGISTRY.length} routes × ${viewports.length} viewports; independent URLs, full-page scroll, draft status, direct links, refresh, and back/forward verified.`);
} finally {
  socket?.close();
  if (chrome.exitCode === null) {
    const exited = new Promise(resolve => chrome.once('exit', resolve));
    chrome.kill('SIGTERM');
    await Promise.race([exited, delay(3000)]);
  }
  rmSync(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
}
