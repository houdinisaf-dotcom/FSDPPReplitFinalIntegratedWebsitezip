import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { products } from '../src/data/products.js';
import { deriveClothingLineMembership } from '../src/clothing-lines.js';
import { deriveTechnicalCollections } from '../src/catalogue-collections.js';
import { getCollectionMotionEntry, resolveCollectionLogo } from '../src/collection-motion-config.js';

const profile = await mkdtemp(join(tmpdir(), 'fsd-lines-'));
const chrome = spawn('chromium', ['--headless=new', '--no-sandbox',
  '--disable-dev-shm-usage', '--remote-debugging-port=0', `--user-data-dir=${profile}`],
{ stdio: 'ignore' });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
let ws;
try {
  let port;
  for (let i = 0; i < 100 && !port; i++) {
    try { port = Number((await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]); }
    catch { await pause(100); }
  }
  assert.ok(port, 'Chromium must start');
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  ws = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
  await once(ws, 'open');
  let sequence = 0;
  const pending = new Map();
  const errors = [];
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const entry = pending.get(message.id);
      if (!entry) return;
      pending.delete(message.id);
      message.error ? entry.reject(new Error(message.error.message)) : entry.resolve(message.result);
    } else if (message.method === 'Runtime.exceptionThrown') {
      const detail = message.params.exceptionDetails;
      errors.push(detail.exception?.description || detail.text);
    }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  const wait = async (expression, label) => {
    for (let i = 0; i < 120; i++) {
      if (await evaluate(`Boolean(${expression})`)) return;
      await pause(100);
    }
    throw new Error(`Timed out: ${label || expression}`);
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  const base = `https://${process.env.REPLIT_DEV_DOMAIN}`;
  const membership = deriveClothingLineMembership(products).lines;

  for (const [width, height] of (process.argv.includes('--technical-only') || process.argv.includes('--motion-only') ? [] : [[1440, 1000], [1024, 1000], [768, 1024], [390, 852], [375, 852], [320, 852]])) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: `${base}/` });
    await wait(`document.querySelector('[data-runtime-ready="true"]') && document.querySelector('#clothing-lines')`, 'storefront ready');
    assert.equal(await evaluate('window.innerWidth'), width);
    assert.equal(await evaluate(`document.querySelector('#clothing-lines-archive').open`), false);
    await evaluate(`document.querySelector('a[href="#clothing-lines"]').click()`);
    await wait(`document.querySelectorAll('.fsd-clothing-line').length === 7`, 'seven banners');
    assert.deepEqual(await evaluate(`Array.from(document.querySelectorAll('.fsd-clothing-line')).map(s => [s.id, s.querySelectorAll('[data-clothing-product-id]').length])`),
      membership.map(line => [`line-${line.id}`, line.products.length]));
    if (width === 1440) {
      const failedImages = await evaluate(`(async () => {
        const sources = [...new Set([...document.querySelectorAll('.fsd-clothing-browser img')].map(img => img.src))];
        const results = await Promise.all(sources.map(async src => {
          const image = new Image(); image.src = src;
          try { await image.decode(); return null; } catch { return src; }
        }));
        return results.filter(Boolean);
      })()`);
      assert.deepEqual(failedImages, [], 'all configured collection and product images load');
    }
    for (const line of membership) {
      await evaluate(`document.getElementById(${JSON.stringify(`line-${line.id}`)}).scrollIntoView({behavior:'instant',block:'start'})`);
      const displayName = getCollectionMotionEntry(line.id).name;
      await wait(`document.querySelector('.fsd-clothing-nav [aria-current="location"]')?.textContent.trim() === ${JSON.stringify(displayName)}`, `scroll activates ${line.id}`);
      await pause(70);
      const state = await evaluate(`(() => {
        const rail = document.querySelector('.fsd-clothing-nav__links').getBoundingClientRect();
        const banner = document.querySelector('.fsd-clothing-nav').getBoundingClientRect();
        const active = document.querySelector('.fsd-clothing-nav [aria-current="location"]').getBoundingClientRect();
        const mark = document.querySelector('.fsd-clothing-nav__active-mark').getBoundingClientRect();
        const logo = document.querySelector('.fsd-clothing-nav__active-mark');
        const identity = logo.querySelector('[data-active-collection]');
        return {visible: active.left >= rail.left - 1 && active.right <= rail.right + 1,
          right: mark.left >= rail.right, size: logo.getBoundingClientRect().width,
          id:identity.dataset.activeCollection,status:identity.dataset.logoState,
          label:identity.getAttribute('aria-label'),art:logo.querySelectorAll('img,svg').length,
          pageEdge:Math.abs(banner.right-document.documentElement.clientWidth)<=2 && banner.right-mark.right<=51,
          bannerRight:banner.right,slotRight:mark.right,windowWidth:window.innerWidth,
          overflow: document.documentElement.scrollWidth > window.innerWidth + 1};
      })()`);
      assert.ok(state.visible, `${line.id} active name visible at ${width}px`);
      assert.ok(state.right, 'logo stays at far right of strip');
      assert.ok(state.pageEdge, `existing banner reaches the right page edge with its reserved end slot: ${JSON.stringify(state)}`);
      assert.ok(state.size >= 76 && state.size <= 112, 'readable, stable far-right asset slot');
      assert.equal(state.id, line.id, 'active name and logo identity agree');
      assert.equal(state.status, resolveCollectionLogo(line.id).status, 'explicit missing/unassigned original state');
      assert.ok(state.label.includes(displayName), 'accessible collection identity');
      assert.equal(state.art, 0, 'no invented artwork or photographic patch substitution');
      assert.equal(state.overflow, false, 'no page overflow');
    }
    await evaluate(`document.querySelectorAll('.fsd-clothing-nav button')[2].click()`);
    await wait(`location.hash === '#line-flex' && document.querySelector('.fsd-clothing-nav [aria-current="location"]')?.textContent.trim() === 'FLEX'`, 'manual navigation');
    await evaluate(`document.querySelector('[data-clothing-product-id="75"] button').click()`);
    await wait(`document.querySelector('#product-dialog')?.open`, 'existing product detail opens');
    assert.ok(await evaluate(`document.querySelector('#product-dialog').textContent.includes('£65.00')`), 'existing price');
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await wait(`!document.querySelector('#product-dialog').open`, 'product closes');
    assert.equal(await evaluate(`document.querySelector('#clothing-lines-archive').open`), true);
    assert.equal(await evaluate(`document.activeElement === document.querySelector('[data-clothing-product-id="75"] button')`), true, 'focus returns to product card');
    if (width === 1440) {
      await evaluate(`document.querySelector('[data-clothing-product-id="75"] button').click()`);
      await wait(`document.querySelector('#product-dialog')?.open`, 'reopen for variant purchase');
      await evaluate(`document.querySelector('#product-dialog [data-catalogue-colourway-index="1"]').click()`);
      await evaluate(`document.querySelector('#product-dialog [data-product-size][value="M"]').click()`);
      await evaluate(`document.querySelector('#product-dialog [data-bag-add]').click()`);
      await evaluate(`document.querySelector('[data-bag-open]').click()`);
      await wait(`document.querySelector('dialog:has([data-bag-close])')?.open`, 'bag opens');
      const bagText = await evaluate(`document.querySelector('dialog:has([data-bag-close])').textContent`);
      assert.ok(bagText.includes('FLEX') && bagText.includes('Sage Green'), 'correct product and colour in bag');
      assert.ok(bagText.includes('M'), 'selected size retained');
      await evaluate(`document.querySelector('dialog [data-bag-quantity="1"]').click()`);
      await wait(`document.querySelector('dialog:has([data-bag-close])').textContent.includes('£130.00')`, 'quantity and subtotal');
      await evaluate(`document.querySelector('[data-bag-clear]').click(); document.querySelector('[data-bag-close]').click()`);
      await evaluate(`document.querySelector('#product-dialog').close()`);
      console.log('PASS catalogue imagery, colour/size selection and bag quantity/subtotal');
    }
    console.log(`PASS clothing banners, automatic scroll/logo, manual navigation and product details: ${width}px`);
  }

  await send('Page.navigate', { url: `${base}/#line-scorpion-series` });
  await wait(`document.querySelector('[data-runtime-ready="true"]') && document.querySelector('#clothing-lines-archive')?.open && document.querySelector('.fsd-clothing-nav [aria-current="location"]')?.textContent.trim() === 'SCORPION SERIES'`, 'cold deep link');
  assert.deepEqual(errors, [], 'no uncaught browser errors');
  console.log('PASS cold hash entry and runtime errors');
  // Isolate normal-motion timing from the preceding viewport/media fixture changes.
  // Run this stage in a fresh browser profile with --motion-only.
  if (process.argv.includes('--motion-only')) {
    await send('Emulation.setDeviceMetricsOverride', { width:1440,height:1000,deviceScaleFactor:1,mobile:false });
    await send('Emulation.setEmulatedMedia', { features:[{name:'prefers-reduced-motion',value:'no-preference'}] });
    await send('Page.navigate', { url:`${base}/#line-aeroforge` });
    await wait(`document.querySelector('[data-runtime-ready="true"]') && document.querySelector('[data-active-collection="aeroforge"]')`, 'normal-motion cold entry');
    await evaluate(`(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));})()`);
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('.fsd-clothing-nav button')).transitionDuration.split(',')[0].trim()`), '0.24s');
    const crossfade = await evaluate(`new Promise((resolve,reject)=>{
      const nav=document.querySelector('.fsd-clothing-nav');
      const timeout=setTimeout(()=>{nav.removeEventListener('animationstart',started);reject(new Error('Crossfade did not start: '+JSON.stringify({active:nav.querySelector('[data-active-collection]')?.dataset.activeCollection,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,scrollY,navBottom:nav.getBoundingClientRect().bottom,flexTop:document.querySelector('#line-flex').getBoundingClientRect().top,flexMargin:getComputedStyle(document.querySelector('#line-flex')).scrollMarginTop,combatBottom:document.querySelector('#line-combat').getBoundingClientRect().bottom,fonts:document.fonts.status})));},5000);
      function started(event){
        if(event.animationName!=='fsd-line-mark-enter' || event.target.closest('[data-active-collection]')?.dataset.activeCollection!=='flex')return;
        clearTimeout(timeout);nav.removeEventListener('animationstart',started);
        resolve({duration:getComputedStyle(event.target).animationDuration});
      }
      nav.addEventListener('animationstart',started);
      document.getElementById('line-flex').scrollIntoView({behavior:'instant'});
    })`);
    assert.equal(crossfade.duration, '0.24s');
    await send('Emulation.setEmulatedMedia', { features:[{name:'prefers-reduced-motion',value:'reduce'}] });
    await wait(`document.querySelector('.fsd-clothing-nav__mark-stack.is-reduced-motion') && !document.querySelector('.fsd-clothing-nav .is-leaving')`, 'live reduced-motion preference cancels the outgoing layer');
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('.fsd-clothing-nav button')).transitionDuration`), '0s');
    await send('Emulation.setEmulatedMedia', { features:[{name:'prefers-reduced-motion',value:'no-preference'}] });
    for (const id of ['combat','breeze','scorpion-series']) {
      await evaluate(`document.getElementById('line-${id}').scrollIntoView({behavior:'instant'})`);
      await wait(`document.querySelector('[data-active-collection="${id}"]')`, 'rapid switching updates current identity');
      assert.ok(await evaluate(`document.querySelectorAll('.fsd-clothing-nav__mark-layer').length<=2`));
    }
    await wait(`!document.querySelector('.fsd-clothing-nav .is-leaving')`, 'stale outgoing layers cleaned up');
    assert.equal(await evaluate(`document.querySelectorAll('.fsd-clothing-product [data-logo-key],.fsd-clothing-product .fsd-clothing-nav__logo,.fsd-clothing-line__emblem').length`), 0);
    assert.ok(await evaluate(`document.querySelector('[data-fsd-logo-slot="header"] img')?.src.includes('website-shield-lockup-defence')`), 'approved master header unchanged');

    await evaluate(`(async () => {
      const resources=performance.getEntriesByType('resource').map(r=>r.name);
      const reactModule=await import(resources.find(url=>/\\/react\\.js\\?/.test(url)));
      const clientModule=await import(resources.find(url=>/\\/react-dom_client\\.js\\?/.test(url)));
      const React=reactModule.default || reactModule;
      const {ActiveCollectionMark}=await import('/src/components/ClothingLinesBrowser.jsx');
      const {COLLECTION_MOTION_CONFIG}=await import('/src/collection-motion-config.js');
      const fixture=structuredClone(COLLECTION_MOTION_CONFIG);
      fixture.logos.tiger.asset='/brand/originals/intentionally-missing-test-original.svg';
      const host=document.createElement('div');host.dataset.fsdMotionProbe='';
      host.style.cssText='position:fixed;left:0;top:0;width:112px;height:44px;pointer-events:none';
      document.body.append(host);
      const root=(clientModule.createRoot || clientModule.default.createRoot)(host);
      window.__fsdMotionProbe={root,host};
      root.render(React.createElement(ActiveCollectionMark,{line:{id:'tiger-series',title:'TIGER SERIES'},reducedMotion:true,transitionDuration:240,config:fixture}));
    })()`);
    await wait(`document.querySelector('[data-fsd-motion-probe] [data-logo-state="broken"]') && !document.querySelector('[data-fsd-motion-probe] img')`, 'broken original file becomes a named slot');
    await evaluate(`window.__fsdMotionProbe.root.unmount();window.__fsdMotionProbe.host.remove();delete window.__fsdMotionProbe`);

    await send('Emulation.setEmulatedMedia', { features:[{name:'prefers-reduced-motion',value:'reduce'}] });
    await evaluate(`document.querySelector('#clothing-lines').click()`);
    await wait(`!document.querySelector('.fsd-clothing-nav')`, 'archive closes');
    await evaluate(`window.__fsdSavedObserver=window.IntersectionObserver;delete window.IntersectionObserver;document.querySelector('#clothing-lines').click()`);
    await wait(`document.querySelectorAll('.fsd-clothing-line').length===7`, 'archive opens without IntersectionObserver');
    await evaluate(`document.getElementById('line-combat').scrollIntoView({behavior:'instant'})`);
    await wait(`document.querySelector('[data-active-collection="combat"]')`, 'scroll fallback remains functional');
    await evaluate(`window.IntersectionObserver=window.__fsdSavedObserver;delete window.__fsdSavedObserver`);
    console.log('PASS Priority 3: 240ms transition, rapid changes, live reduced motion, original-only slots, broken asset and observer fallback');
  }
  const technical = deriveTechnicalCollections(products);
  for (const width of [320, 375, 390, 768, 1024, 1440].filter(width => !process.argv.includes('--motion-only') && (!process.argv.includes('--desktop-only') || width === 1440))) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: `${base}/#collection-performance-accessories` });
    await wait(`document.querySelector('[data-runtime-ready="true"]') && document.querySelector('#technical-collections-archive')?.open && document.querySelectorAll('.fsd-established-collection').length===4`, 'technical cold entry');
    assert.deepEqual(await evaluate(`Array.from(document.querySelectorAll('.fsd-established-collection')).map(s=>[s.id,s.querySelectorAll('[data-technical-product-id]').length])`),
      technical.map(collection => [`collection-${collection.id}`, collection.products.length]));
    for (const collection of technical) {
      await evaluate(`document.getElementById(${JSON.stringify(`collection-${collection.id}`)}).scrollIntoView({behavior:'instant',block:'start'})`);
      assert.equal(await evaluate(`document.documentElement.scrollWidth>innerWidth+1`), false, `${collection.id}: no overflow at ${width}`);
      assert.ok(await evaluate(`Array.from(document.querySelectorAll('#technical-collections-archive img')).every(img=>img.loading==='lazy')`), 'one lazy image per product, no eager full galleries');
      const ids = await evaluate(`Array.from(document.querySelectorAll('#collection-${collection.id} [data-technical-product-id]')).map(card=>card.dataset.technicalProductId)`);
      assert.equal(new Set(ids).size, ids.length, 'no duplicate products inside collection');
      await evaluate(`document.querySelector('#collection-${collection.id} .fsd-technical-collection-link').click()`);
      await wait(`location.hash==='#collection-${collection.id}'`, 'working banner link');
    }
    await evaluate(`document.querySelector('[data-technical-product-id="76"] button').click()`);
    await wait(`document.querySelector('#product-dialog')?.open`, 'backpack detail opens');
    assert.ok(await evaluate(`document.querySelector('#product-dialog').textContent.includes('Apex Pro Tactical Gym Backpack')`));
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await wait(`!document.querySelector('#product-dialog').open`, 'backpack detail closes');
    assert.equal(await evaluate(`document.activeElement === document.querySelector('[data-technical-product-id="76"] button')`), true, 'focus restored');
    if (width === 1440) {
      await evaluate(`document.querySelector('[data-nav-primary="collections"]').click()`);
      await wait(`!document.querySelector('#fsd-mega-menu').hidden`, 'SHOP opens');
      const groupRect = await evaluate(`(() => { const r=Array.from(document.querySelectorAll('[data-nav-group]')).find(button=>button.textContent.includes('ACCESSORIES & TECHNICAL')).getBoundingClientRect(); return {x:r.left+20,y:r.top+r.height/2}; })()`);
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...groupRect });
      await wait(`Array.from(document.querySelectorAll('[data-nav-item]')).some(button=>button.textContent.includes('PERFORMANCE ACCESSORIES'))`, 'new shortcuts rendered');
      const itemRect = await evaluate(`(() => { const r=Array.from(document.querySelectorAll('[data-nav-item]')).find(button=>button.textContent.includes('PERFORMANCE ACCESSORIES')).getBoundingClientRect(); return {x:r.left+20,y:r.top+r.height/2}; })()`);
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...itemRect });
      await wait(`document.querySelector('#modal-title')?.textContent.includes('PERFORMANCE ACCESSORIES')`, 'feature follows the hovered collection');
      await evaluate(`document.querySelector('#fsd-mega-menu .feature-btn').click()`);
      await wait(`document.querySelector('#fsd-mega-menu').hidden && location.hash==='#collection-performance-accessories' && document.querySelector('#technical-collections-archive').open`, 'SHOP opens the actual collection');
      await evaluate(`(() => { const image=document.querySelector('#collection-performance-accessories header img'); if(image)image.src='/missing-priority-two-banner.webp'; })()`);
      await wait(`!document.querySelector('#collection-performance-accessories header img')`, 'failed image becomes a named fallback');
      assert.ok(await evaluate(`document.querySelector('#collection-performance-accessories header [role="img"]')?.getAttribute('aria-label')?.includes('PERFORMANCE ACCESSORIES')`));
    }
    console.log(`PASS technical banners, four memberships, lazy images, product details and focus: ${width}px`);
  }
  assert.deepEqual(errors, [], 'no uncaught browser errors after technical collection checks');
} finally {
  ws?.close();
  chrome.kill('SIGTERM');
  await Promise.race([once(chrome, 'exit'), pause(2500)]);
  await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 150 });
}
