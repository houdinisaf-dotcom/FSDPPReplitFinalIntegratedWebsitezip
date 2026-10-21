// Dependency-free Chromium checks against the existing Replit development server.
// Each viewport uses a fresh browser profile to avoid mixed-device CDP state.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const domain = process.env.REPLIT_DEV_DOMAIN;
assert.ok(domain, 'REPLIT_DEV_DOMAIN is required.');
const scenarios = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844, mobile: true },
  { name: 'reduced-motion', width: 1280, height: 900, reduce: true },
  { name: 'animation-api-fallback', width: 390, height: 844, fallback: true },
  { name: 'animation-api-failure', width: 1280, height: 900, fallback: true, throws: true },
];

const requested = process.argv.slice(2);
for (const scenario of scenarios.filter(scenario => !requested.length || requested.includes(scenario.name))) {
  const profile = mkdtempSync(join(tmpdir(), 'fsd-motion-'));
  const chrome = spawn('chromium', [
    '--headless=new', '--no-sandbox', '--disable-dev-shm-usage',
    '--no-proxy-server', `--host-resolver-rules=MAP ${domain} 127.0.0.1`,
    '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
  ], { stdio: 'ignore' });
  let socket;
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
    const pending = new Map();
    const errors = [];
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
        errors.push(message.params.exceptionDetails);
      }
    });
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++sequence;
      const timeout = setTimeout(() => reject(new Error(`CDP timeout: ${method}`)), 15000);
      pending.set(id, { resolve, reject, timeout });
      socket.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async expression => {
      const response = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      assert.ok(!response.exceptionDetails, JSON.stringify(response.exceptionDetails));
      return response.result.value;
    };
    const waitFor = async expression => {
      for (let i = 0; i < 100; i++) {
        if (await evaluate(expression)) return;
        await delay(50);
      }
      throw new Error(`Condition not met: ${expression}`);
    };
    const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
    const key = async key => {
      const code = { Escape: 27, Tab: 9, ArrowRight: 39 }[key];
      for (const type of ['rawKeyDown', 'keyUp']) {
        await send('Input.dispatchKeyEvent', { type, key, code: key, windowsVirtualKeyCode: code });
      }
    };
    await send('Runtime.enable');
    await send('Page.enable');
    await send('Page.bringToFront');
    await send('Emulation.setDeviceMetricsOverride', {
      width: scenario.width, height: scenario.height, deviceScaleFactor: 1, mobile: !!scenario.mobile,
    });
    await send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: scenario.reduce ? 'reduce' : 'no-preference' }],
    });
    if (scenario.mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true });
    if (scenario.fallback) {
      await send('Page.addScriptToEvaluateOnNewDocument', {
        source: scenario.throws
          ? 'window.IntersectionObserver = class { constructor() { throw new Error("Test observer failure"); } }; Element.prototype.animate = function() { throw new Error("Test animation failure"); };'
          : 'window.IntersectionObserver = undefined; Element.prototype.animate = undefined;',
      });
    }
    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `window.__motionCLS = 0; window.__motionShiftSources = [];
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) if (!entry.hadRecentInput) {
            window.__motionCLS += entry.value;
            window.__motionShiftSources.push({value:entry.value, sources:entry.sources.map(s=>({tag:s.node?.tagName, class:s.node?.className}))});
          }
        }).observe({ type: 'layout-shift', buffered: true });`,
    });
    await send('Page.navigate', { url: `http://${domain}:5000/` });
    await waitFor('!!document.querySelector("[data-division=apparel]")');
    await delay(1000);
    assert.equal(await evaluate('document.querySelectorAll("[data-division]").length'), 4);
    const overflow = await evaluate('({width: innerWidth, scrollWidth: document.documentElement.scrollWidth, elements: Array.from(document.querySelectorAll("body *")).filter(el => {const r=el.getBoundingClientRect();return r.width && (r.right>innerWidth+1 || r.left < -1) && getComputedStyle(el).position !== "fixed"}).slice(0,12).map(el=>({tag:el.tagName,class:el.className,right:el.getBoundingClientRect().right}))})');
    assert.ok(overflow.scrollWidth <= overflow.width + 1, `No page horizontal overflow: ${JSON.stringify(overflow)}`);
    assert.ok(await evaluate('Number(getComputedStyle(document.querySelector(".hero h1")).opacity) === 1'), 'Hero stays visible.');
    assert.ok(await evaluate('document.querySelector("#contact button").disabled && !document.querySelector("#contact input, #contact form")'), 'VIP remains non-collecting.');
    assert.equal(await evaluate('document.querySelectorAll("input[type=email], button[data-checkout]").length'), 0);
    const initialCLS = await evaluate('window.__motionCLS');
    // Cold external-font swaps are reported separately, not misattributed to motion.
    if (initialCLS >= .1) {
      console.warn(`Cold-load CLS concern (${scenario.name}): ${JSON.stringify(await evaluate('window.__motionShiftSources'))}`);
    }
    await evaluate('document.fonts.ready.then(()=>true)');
    const heroRect = await evaluate('JSON.stringify(document.querySelector(".hero").getBoundingClientRect().toJSON())');
    await delay(300);
    assert.equal(await evaluate('JSON.stringify(document.querySelector(".hero").getBoundingClientRect().toJSON())'), heroRect, 'Settled hero motion must not change layout geometry.');

    await evaluate('document.querySelector("#collections").scrollIntoView({behavior:"instant"});');
    await delay(100);
    const before = await evaluate('({y: scrollY, href: location.href})');
    await click('[data-division="apparel"]');
    await waitFor('document.querySelector("#fsd-showcase-dialog").open');
    if (!scenario.reduce && !scenario.fallback) {
      const durations = await evaluate('document.querySelector("#fsd-showcase-dialog").getAnimations().map(a=>a.effect.getTiming().duration)');
      assert.ok(durations.some(duration => duration >= 250 && duration <= 350), 'Panel entry uses shared 250–350ms timing.');
    }
    await delay(400);
    assert.deepEqual(await evaluate('({y: scrollY, href: location.href})'), before, 'Panel open must not scroll/navigate.');
    assert.ok(await evaluate('document.documentElement.classList.contains("fsd-modal-open")'));
    assert.ok(await evaluate('document.querySelector("#fsd-showcase-dialog").contains(document.activeElement)'));
    assert.ok(await evaluate('(()=>{const r=document.querySelector("#fsd-showcase-dialog").getBoundingClientRect(); return r.left >= -1 && r.right <= innerWidth+1 && r.top >= -1 && r.bottom <= innerHeight+1;})()'), 'Panel fits viewport.');
    assert.ok(await evaluate('getComputedStyle(document.querySelector("[data-dialog-content]")).overflowY === "auto"'), 'Panel content remains scrollable.');
    for (let i = 0; i < 18; i++) await key('Tab');
    assert.ok(await evaluate('document.querySelector("#fsd-showcase-dialog").contains(document.activeElement)'), 'Native modal focus trap remains intact.');

    await click('[data-group-index="1"]');
    await click('[data-subcategory-index="0"]');
    assert.deepEqual(await evaluate('({y: scrollY, href: location.href})'), before, 'Filters must not scroll/navigate.');
    assert.equal(await evaluate('document.activeElement.dataset.subcategoryIndex'), '0');
    await delay(700);
    assert.ok(await evaluate('Array.from(document.querySelectorAll(".fsd-product-card")).every(el => Number(getComputedStyle(el).opacity) === 1)'), 'Staggered content finishes visible.');
    assert.ok(await evaluate('document.querySelector("[data-product-id=\\"43\\"] img") === null && document.querySelector("[data-product-id=\\"43\\"]").closest("article").querySelector("img").src.endsWith("fsd-velocity-performance-sports-hijab.jpg")'), 'Velocity image mapping unchanged.');

    await key('Escape');
    if (!scenario.reduce && !scenario.fallback) {
      await delay(60);
      assert.ok(await evaluate('document.querySelector("#fsd-showcase-dialog").open'), 'Exit transition keeps dialog modal until complete.');
      assert.ok(await evaluate('document.documentElement.classList.contains("fsd-modal-open")'), 'Exit retains background scroll lock.');
    }
    await waitFor('!document.querySelector("#fsd-showcase-dialog").open && !document.documentElement.classList.contains("fsd-modal-open")');
    assert.equal(await evaluate('document.activeElement.dataset.division'), 'apparel');
    assert.deepEqual(await evaluate('({y: scrollY, href: location.href})'), before);

    for (const division of ['bio-lab', 'hardware', 'global']) {
      await click(`[data-division="${division}"]`);
      await delay(400);
      await click('[data-close-dialog]');
      await waitFor('!document.querySelector("#fsd-showcase-dialog").open && !document.documentElement.classList.contains("fsd-modal-open")');
      assert.equal(await evaluate('document.activeElement.dataset.division'), division);
    }
    await click('[data-division="apparel"]');
    await delay(400);
    const hasExposedBackdrop = await evaluate('document.querySelector("#fsd-showcase-dialog").getBoundingClientRect().top > 4');
    if (hasExposedBackdrop) {
      for (const type of ['mousePressed', 'mouseReleased']) {
        await send('Input.dispatchMouseEvent', { type, x: 4, y: 4, button: 'left', clickCount: 1 });
      }
    } else {
      // Existing mobile panels are intentionally full-screen: no exposed backdrop.
      await click('[data-close-dialog]');
    }
    await waitFor('!document.querySelector("#fsd-showcase-dialog").open && !document.documentElement.classList.contains("fsd-modal-open")');
    assert.equal(await evaluate('document.activeElement.dataset.division'), 'apparel', 'Dismissal returns opener focus.');
    // Product handoff must wait for the animated close before opening its dialog.
    await click('[data-division="apparel"]');
    await click('[data-group-index="1"]');
    await click('[data-subcategory-index="0"]');
    await click('[data-product-id="43"]');
    await waitFor('document.querySelector("#product-dialog").open');
    assert.equal(await evaluate('document.querySelectorAll("dialog[open]").length'), 1);
    assert.ok(await evaluate('document.querySelector("#product-title").textContent.includes("Velocity")'));
    await click('#close-dialog');
    await waitFor('!document.querySelector("#product-dialog").open && document.querySelector("#fsd-showcase-dialog").open');
    assert.equal(await evaluate('document.activeElement.dataset.productId'), '43');
    await key('Escape');
    await waitFor('!document.querySelector("#fsd-showcase-dialog").open && !document.documentElement.classList.contains("fsd-modal-open")');
    // Explicit Explore remains the only filter-to-catalogue navigation.
    await click('[data-division="apparel"]');
    await click('[data-group-index="1"]');
    await click('[data-subcategory-index="0"]');
    await click('[data-explore-collection]');
    await waitFor('document.querySelector("#catalogue-archive").open && !document.querySelector("#fsd-showcase-dialog").open');
    assert.equal(await evaluate('document.querySelector("#search").value'), 'Hijab');
    if (!scenario.reduce && !scenario.fallback) {
      await click('[data-division="hardware"]');
      await delay(400);
      await key('Escape');
      await send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
      });
      await delay(80);
      assert.ok(await evaluate('!document.querySelector("#fsd-showcase-dialog").open && !document.documentElement.classList.contains("fsd-modal-open")'), 'Changing motion preference mid-exit releases the modal.');
    }
    await evaluate('document.querySelector("#philosophy").scrollIntoView({behavior:"instant"})');
    await delay(900);
    assert.ok(await evaluate('Number(getComputedStyle(document.querySelector("#philosophy")).opacity) === 1'), 'Editorial reveal finishes visible.');
    if (scenario.reduce) {
      assert.ok(await evaluate('document.getAnimations().every(a=>a.effect.getComputedTiming().duration <= 50)'), 'Reduced motion has no lengthy active animation.');
      assert.equal(await evaluate('getComputedStyle(document.documentElement).scrollBehavior'), 'auto');
    }
    assert.deepEqual(errors, [], 'No browser runtime exceptions.');
    console.log(`PASS ${scenario.name}: visible content, stable settled hero geometry, initial CLS ${initialCLS.toFixed(4)}, four divisions, no unwanted scrolling, focus trap/return, real exit, filters, product and Explore handoffs, and deferred VIP.`);
  } finally {
    socket?.close();
    chrome.kill('SIGTERM');
    await Promise.race([new Promise(resolve => chrome.once('exit', resolve)), delay(3000)]);
    rmSync(profile, { recursive: true, force: true });
  }
}
