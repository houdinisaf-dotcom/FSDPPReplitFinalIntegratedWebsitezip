import assert from 'node:assert/strict';
import { withBrowser } from './browser-utils.mjs';
import { getDemoSnapshot } from '../src/bio-lab/demo-provider.js';

const scenarios = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'mobile', width: 390, height: 844, mobile: true },
  { name: 'reduced-motion', width: 1280, height: 900, reduce: true },
  { name: 'animation-fallback', width: 1280, height: 900,
    initScripts: ['Element.prototype.animate=undefined;window.IntersectionObserver=undefined;'] },
];
const requested = process.argv.slice(2);
for (const scenario of scenarios.filter(item => !requested.length || requested.includes(item.name))) {
  await withBrowser(scenario, async ({ evaluate, waitFor, click, key, send, delay }) => {
    assert.equal(await evaluate('performance.getEntriesByType("resource").some(e=>/bio-lab\\/(dashboard|demo-provider|charts)\\.js/.test(e.name))'), false, 'Demo remains lazy on the storefront.');
    await evaluate('document.fonts.ready');
    await evaluate('document.querySelector("#collections").scrollIntoView({behavior:"instant"});window.scrollBy({top:80,behavior:"instant"})');
    const originalScroll = await evaluate('scrollY');
    await evaluate(`window.__bioRequests=[];window.fetch=(...args)=>{window.__bioRequests.push(String(args[0]));return Promise.reject(new Error("Demo network forbidden in test"))};XMLHttpRequest.prototype.open=function(...args){window.__bioRequests.push(String(args[1]));throw Error("Demo network forbidden")};navigator.sendBeacon=(url)=>{window.__bioRequests.push(String(url));return false}`);
    await click('[data-division="bio-lab"]');
    await waitFor('document.querySelector("#fsd-showcase-dialog").open');
    assert.match(await evaluate('document.querySelector("[data-dialog-content]").textContent'), /FSD MOTION/);
    await click('[data-bio-lab-open]');
    await waitFor('document.querySelector("[data-bio-lab-metric=\\"sessions\\"]")?.textContent.includes("4")');
    assert.equal(await evaluate('document.querySelectorAll("dialog[open]").length'), 0);
    assert.match(await evaluate('location.hash'), /^#bio-lab\/overview\?period=7$/);
    assert.ok(await evaluate('scrollY <= 1'), 'Opening the dashboard is a new page view, not the old storefront scroll position.');
    assert.match(await evaluate('document.querySelector("[data-bio-lab-dashboard]").textContent'), /BIO-LAB DEMO — SIMULATED DATA/);
    assert.match(await evaluate('document.querySelector("[data-bio-lab-dashboard]").textContent'), /Sample Athlete 01/);
    assert.match(await evaluate('document.querySelector("[data-bio-lab-metric=\\"duration\\"]").textContent'), /2\s*h|154/);
    assert.ok(await evaluate('document.querySelector("#home").hidden'));
    assert.equal(await evaluate('getComputedStyle(document.querySelector("#home")).display'), 'none');
    assert.equal(await evaluate('getComputedStyle(document.querySelector("#app > footer")).display'), 'none');
    assert.equal(await evaluate('document.querySelectorAll("[data-division]").length'), 4);
    assert.equal(await evaluate('document.querySelectorAll("[data-bio-lab-dashboard] input,[data-bio-lab-dashboard] textarea").length'), 0);
    const overflow = () => evaluate('document.documentElement.scrollWidth<=innerWidth+1');
    assert.ok(await overflow(), 'Dashboard page does not overflow horizontally.');

    for (const period of [30, 90]) {
      const snapshot = getDemoSnapshot(period);
      await click(`[data-bio-lab-period="${period}"]`);
      await waitFor(`location.hash.endsWith("period=${period}") && document.querySelector('[data-bio-lab-metric="sessions"]').textContent.includes("${snapshot.summary.sessionCount}")`);
      assert.match(await evaluate('document.querySelector("[data-bio-lab-metric=\\"duration\\"]").textContent'),
        new RegExp(`${Math.floor(snapshot.summary.durationMinutes / 60)}\\s*h|${snapshot.summary.durationMinutes}`));
      assert.equal(await evaluate(`document.querySelector('[data-bio-lab-period="${period}"]').getAttribute("aria-pressed")`), 'true');
      assert.ok(await evaluate(`document.activeElement.matches('[data-bio-lab-period="${period}"]')`));
    }

    await click('[data-bio-lab-tab="training"]');
    await waitFor('location.hash.startsWith("#bio-lab/training") && document.querySelectorAll("[data-chart-point]").length>0');
    assert.ok(await evaluate('document.querySelectorAll("[data-bio-lab-dashboard] svg").length>=4'));
    assert.ok(await evaluate('document.querySelectorAll("[data-bio-lab-dashboard] table").length>0'), 'Chart values have text equivalents.');
    await evaluate('document.querySelector("[data-chart-point]").focus()');
    await waitFor('document.querySelector("[data-chart-tooltip]")?.textContent.trim().length>0');
    assert.match(await evaluate('document.querySelector("[data-chart-tooltip]").textContent'), /min|session|score/i);
    await key('End');
    assert.ok(await evaluate('document.activeElement.matches("[data-chart-point]")'));
    await key('Home');
    await evaluate('document.activeElement.dispatchEvent(new MouseEvent("click",{bubbles:true}))');
    await waitFor('document.querySelector("[data-chart-tooltip]")?.textContent.trim().length>0');
    if (scenario.mobile) {
      await evaluate('document.querySelector("[data-chart-point]").scrollIntoView({block:"center",behavior:"instant"})');
      const point = await evaluate('(()=>{const r=document.querySelector("[data-chart-point]").getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()');
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      assert.ok(await evaluate('document.querySelector("[data-chart-tooltip]").textContent.includes(document.querySelector("[data-chart-point]").dataset.value)'));
    }
    assert.ok(await overflow());
    await delay(600);
    assert.equal(await evaluate('document.querySelector("[data-bio-lab-dashboard]").getAnimations({subtree:true}).filter(a=>a.playState==="running").length'), 0, 'Charts do not animate continuously.');

    await click('[data-bio-lab-tab="recovery"]');
    await waitFor('location.hash.startsWith("#bio-lab/recovery")');
    assert.match(await evaluate('document.querySelector("[data-bio-lab-dashboard]").textContent'), /illustrative/i);
    assert.match(await evaluate('document.querySelector("[data-bio-lab-dashboard]").textContent'), /not.{0,50}validated|not.{0,50}medical/i);
    await click('[data-bio-lab-tab="devices"]');
    await waitFor('document.querySelector("[data-bio-lab-dashboard] [data-product=\\"61\\"]")');
    const deviceText = await evaluate('document.querySelector("[data-bio-lab-dashboard]").textContent');
    assert.match(deviceText, /not connected/i);
    assert.match(deviceText, /concept/i);
    assert.equal(await evaluate('document.querySelectorAll("[data-bio-lab-dashboard] img").length'), 0, 'No invented or unrelated product images.');
    await click('[data-bio-lab-dashboard] [data-product="61"]');
    await waitFor('document.querySelector("#product-dialog").open');
    assert.match(await evaluate('document.querySelector("#dialog-body").textContent'), /FSD MOTION/);
    assert.equal(await evaluate('document.querySelectorAll("dialog[open]").length'), 1);
    await click('#close-dialog');
    await waitFor('!document.querySelector("#product-dialog").open && location.hash === "#bio-lab/devices?period=90"');
    await waitFor('document.activeElement.matches("[data-product=\\"61\\"]")');
    assert.equal(await evaluate('document.querySelector("#home").hidden'), true);
    await evaluate('history.forward()');
    await waitFor('document.querySelector("#product-dialog").open');
    assert.equal(await evaluate('document.querySelector("#home").hidden'), true, 'Forward keeps the dashboard underneath the product.');
    await evaluate('history.back()');
    await waitFor('!document.querySelector("#product-dialog").open && location.hash === "#bio-lab/devices?period=90"');
    await click('[data-bio-lab-tab="insights"]');
    await waitFor('location.hash.startsWith("#bio-lab/insights")');
    assert.match(await evaluate('document.querySelector("[data-bio-lab-dashboard]").textContent'), /2324|2,324/);
    await evaluate('history.back()');
    await waitFor('location.hash === "#bio-lab/devices?period=90"');
    await evaluate('history.forward()');
    await waitFor('location.hash === "#bio-lab/insights?period=90"');
    await evaluate('document.querySelector("[role=tablist] [data-bio-lab-tab=\\"insights\\"]").focus()');
    await key('Home');
    assert.equal(await evaluate('document.activeElement.dataset.bioLabTab'), 'overview');
    await key('Enter');
    await waitFor('location.hash === "#bio-lab/overview?period=90"');
    assert.equal(await evaluate('document.querySelectorAll("[role=tab][aria-selected=true]").length'), 1);
    assert.ok(await overflow());
    assert.deepEqual(await evaluate('window.__bioRequests'), [], 'Demo makes no data transmissions.');
    assert.equal(await evaluate('document.querySelectorAll("[data-vip-signup] input").length'), 0);
    assert.equal(await evaluate('Array.from(document.querySelectorAll("[data-bio-lab-dashboard] button")).some(b=>/buy now|checkout|add to cart|pair device|sign up/i.test(b.textContent))'), false);
    await click('[data-bio-lab-exit]');
    await waitFor('!location.hash.startsWith("#bio-lab/") && !document.querySelector("#home").hidden');
    await waitFor(`Math.abs(scrollY-${originalScroll})<=2`);
    assert.notEqual(await evaluate('getComputedStyle(document.querySelector("#app > footer")).display'), 'none');
    console.log(`PASS ${scenario.name}: lazy local demo; derived periods; tabs/history; accessible charts; recovery/concept labels; Phase2 product return; responsive/no continuous motion/no data transmission.`);
  });
}

if (!requested.length || requested.includes('loading-error')) {
  for (const module of ['dashboard', 'demo-provider']) {
    await withBrowser({ width: 1280, height: 900 }, async ({ send, evaluate, waitFor, click }) => {
      await send('Network.enable');
      await send('Network.setBlockedURLs', { urls: [`*/src/bio-lab/${module}.js*`] });
      await click('[data-division="bio-lab"]');
      await click('[data-bio-lab-open]');
      await waitFor('document.querySelector("[data-bl-lazy-retry],[data-bl-retry]")');
      assert.match(await evaluate('document.querySelector("[data-bio-lab-dashboard]").textContent'), /could not be|unavailable/i);
      assert.match(await evaluate('document.querySelector("[data-bio-lab-dashboard]").textContent'), /SIMULATED DATA/);
      await send('Network.setBlockedURLs', { urls: [] });
      await click('[data-bl-lazy-retry],[data-bl-retry]');
      await waitFor('document.querySelector("[data-bio-lab-metric=\\"sessions\\"]")?.textContent.includes("4")');
      await click('[data-bio-lab-exit]');
      await waitFor('!document.querySelector("#home").hidden');
      console.log(`PASS ${module} loading failure: explicit error, true retry and available storefront exit.`);
    });
  }
}

if (!requested.length || requested.includes('deep-link')) {
  await withBrowser({ width: 1280, height: 900, path: '/#bio-lab/training?period=30' }, async ({ evaluate, waitFor, click }) => {
    await waitFor('document.querySelector("[data-bio-lab-tab=\\"training\\"][aria-selected=true]")');
    assert.equal(await evaluate('document.querySelector("[data-bio-lab-period=\\"30\\"]").getAttribute("aria-pressed")'), 'true');
    await click('.header a[href="#products"]');
    await waitFor('!document.querySelector("#home").hidden && document.querySelector("#products").getBoundingClientRect().top >= -1 && document.querySelector("#products").getBoundingClientRect().top < 180');
    await evaluate('history.back()');
    await waitFor('document.querySelector("[data-bio-lab-tab=\\"training\\"][aria-selected=true]") && document.querySelector("#home").hidden');
    await click('[data-bio-lab-exit]');
    await waitFor('!document.querySelector("#home").hidden');
    console.log('PASS direct deep link and storefront exit.');
  });
  await withBrowser({ width: 1280, height: 900, path: '/#bio-lab/unknown?period=14' }, async ({ evaluate, waitFor }) => {
    await waitFor('document.querySelector("[data-bio-lab-metric=\\"sessions\\"]")');
    assert.equal(await evaluate('location.hash'), '#bio-lab/overview?period=7');
    console.log('PASS unsupported URL tab/period canonicalises to the labelled default demo.');
  });
}
