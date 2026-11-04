import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { mkdir, writeFile } from 'node:fs/promises';
import { browserSession, pause } from './browser-session.mjs';

// Local production build, not the Vite development graph or a claimed live deployment.
const mode = process.argv[2] || 'after';
const socket = createServer();
await new Promise(resolve => socket.listen(0, '127.0.0.1', resolve));
const port = socket.address().port;
await new Promise(resolve => socket.close(resolve));
const server = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: String(port) }, stdio: 'ignore' });
const base = `http://127.0.0.1:${port}`;
let browser;
const results = [];
try {
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(base)).ok) break; } catch {}
    await pause(100);
  }
  browser = await browserSession();
  const { send, evaluate, wait } = browser;
  await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.auditVitals={lcp:0,cls:0};
    new PerformanceObserver(list=>list.getEntries().forEach(e=>window.auditVitals.lcp=e.startTime))
      .observe({type:'largest-contentful-paint',buffered:true});
    new PerformanceObserver(list=>list.getEntries().forEach(e=>{if(!e.hadRecentInput)window.auditVitals.cls+=e.value}))
      .observe({type:'layout-shift',buffered:true});
  ` });
  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: `${base}/?priority-audit=${width}` });
    await wait(`location.search.includes('priority-audit=${width}') && document.querySelector('[data-runtime-ready="true"]')`);
    await evaluate('document.fonts.ready');
    await pause(1300);
    const metrics = await evaluate(`({
      width:innerWidth, fcp:performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      lcp:window.auditVitals.lcp, cls:window.auditVitals.cls,
      overflow:document.documentElement.scrollWidth>innerWidth+1,
      jsBytes:performance.getEntriesByType('resource').filter(e=>/\\.js(?:\\?|$)/.test(e.name)).reduce((s,e)=>s+e.encodedBodySize,0),
      missingAlt:document.querySelectorAll('img:not([alt])').length,
      fontsLoaded:document.fonts.status==='loaded'
    })`);
    await evaluate(`(() => {
      const buttons=Array.from(document.querySelectorAll('[data-nav-primary="collections"]'));
      let trigger=buttons.find(b=>b.getClientRects().length>0);
      if(!trigger){document.querySelector('[data-nav-mobile-toggle]').click();
        trigger=document.querySelector('.fsd-mobile-primary-list [data-nav-primary="collections"]');}
      trigger.click();
    })()`);
    await wait(`document.querySelector('#fsd-mega-menu')?.hidden===false`);
    const menuFits = await evaluate(`document.querySelector('#fsd-mega-menu').getBoundingClientRect().width<=innerWidth+1`);
    await evaluate(`document.querySelector('[data-nav-close]').click()`);
    await wait(`document.querySelector('#fsd-mega-menu').hidden`);
    await send('Page.navigate', { url: `${base}/collections/flex` });
    await wait(`document.querySelector('[data-clothing-product-id="75"] button')`);
    await evaluate(`document.querySelector('[data-clothing-product-id="75"] button').click()`);
    await wait(`document.querySelector('#product-dialog')?.open`);
    await evaluate(`document.querySelector('#product-dialog [data-catalogue-colourway-index="1"]').click();
      document.querySelector('#product-dialog [data-product-size][value="M"]').click()`);
    const productFits = await evaluate(`document.querySelector('#product-dialog').getBoundingClientRect().width<=innerWidth+1`);
    const smallTargets = await evaluate(`Array.from(document.querySelectorAll('#product-dialog button')).filter(b=>{
      const r=b.getBoundingClientRect();return r.width>0 && r.height>0 && !b.disabled && (r.width<24 || r.height<24);
    }).map(b=>b.getAttribute('aria-label')||b.textContent.trim()).slice(0,8)`);
    await evaluate(`document.querySelector('#product-dialog [data-bag-add]').click();document.querySelector('[data-bag-open]').click()`);
    await wait(`document.querySelector('dialog:has([data-bag-close])')?.open`);
    const bagFits = await evaluate(`document.querySelector('dialog:has([data-bag-close])').getBoundingClientRect().width<=innerWidth+1`);
    assert.ok(await evaluate(`document.querySelector('dialog:has([data-bag-close])').textContent.includes('Sage Green')`), 'chosen colour reaches the actual bag');
    if (mode !== 'before') {
      await evaluate(`document.querySelector('dialog [data-bag-quantity="1"]').click()`);
      await wait(`document.querySelector('dialog:has([data-bag-close])').textContent.includes('£130.00')`, 'quantity changes the real subtotal');
      await evaluate(`document.querySelector('[data-bag-clear]').click()`);
    }
    await evaluate(`document.querySelector('[data-bag-close]').click()`);
    await wait(`!document.querySelector('dialog:has([data-bag-close])')?.open`);
    await evaluate(`document.querySelector('#product-dialog')?.close()`);
    await wait(`!document.querySelector('#product-dialog')?.open`);
    await send('Page.navigate', { url: `${base}/collections/women` });
    await wait(`document.querySelector('#catalogue-audience')?.value==='Women’s'`);
    await send('Page.navigate', { url: `${base}/collections/men` });
    await wait(`document.querySelector('#catalogue-audience')?.value==='Men’s'`);
    const filterFits = await evaluate(`document.documentElement.scrollWidth<=innerWidth+1`);
    if (mode !== 'before') {
      const history = await send('Page.getNavigationHistory');
      const previous = history.entries.slice(0, history.currentIndex).reverse().find(entry => entry.url.includes('/collections/women'));
      assert.ok(previous, 'women collection is present in real browser history');
      await send('Page.navigateToHistoryEntry', { entryId: previous.id });
      await wait(`location.pathname==='/collections/women' && document.querySelector('#catalogue-audience')?.value==='Women’s'`, 'browser back restores the women collection');
    }
    const result = { ...metrics, menuFits, productFits, bagFits, filterFits, smallTargets };
    results.push(result);
    console.log(JSON.stringify(result));
    if (mode !== 'before') {
      assert.ok(!metrics.overflow && menuFits && productFits && bagFits && filterFits, `${width}px layout`);
      assert.equal(metrics.missingAlt, 0);
      assert.deepEqual(smallTargets, [], `${width}px targets below the 24px accessibility minimum`);
    }
  }
  assert.deepEqual(browser.errors, []);
  if (mode !== 'before') {
    await send('Network.setBlockedURLs', { urls: ['*CatalogList*.js'] });
    await send('Page.navigate', { url: `${base}/collections/women?network-failure-check=1` });
    await wait(`document.querySelector('[data-catalogue-retry]')`, 'failed catalogue chunk gets an accessible error and retry');
    await send('Network.setBlockedURLs', { urls: [] });
    await evaluate(`document.querySelector('[data-catalogue-retry]').click()`);
    await wait(`!document.querySelector('[data-catalogue-retry]') && document.querySelector('#catalogue-audience')?.value==='Women’s'`, 'retry reload recovers the real catalogue');
    console.log('PASS deliberately blocked catalogue chunk, visible error, accessible retry and recovery.');
  }
  await mkdir('../generated-artifacts', { recursive: true });
  await writeFile(`../generated-artifacts/priority-one-${mode}.json`, JSON.stringify(results, null, 2));
  console.log(`PASS ${mode}: six-width production-build browser audit; local cold-cache samples, not field Core Web Vitals.`);
} finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
}
