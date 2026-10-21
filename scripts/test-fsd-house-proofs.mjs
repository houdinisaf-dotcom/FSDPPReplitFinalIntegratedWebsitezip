import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const domain = process.env.REPLIT_DEV_DOMAIN;
assert.ok(domain, 'A running Replit development domain is required.');
const components = process.argv.slice(2).length ? process.argv.slice(2) : ['Dropdown', 'Floating'];
const refined = components.includes('HousePlus');
const output = `generated-artifacts/fsd-house/${refined ? 'plus-tests' : 'tests'}`;
fs.mkdirSync(output, { recursive: true });
const findings = [];

async function scenario(component, width) {
  // Separate browser/profile per viewport avoids mixed mobile/desktop CDP state.
  const mobile = width < 600;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'fsd-house-'));
  const chrome = spawn('chromium', [
    '--headless=new', '--no-sandbox', '--disable-dev-shm-usage',
    '--no-proxy-server', `--host-resolver-rules=MAP ${domain} 127.0.0.1`,
    '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
  ], { stdio: 'ignore' });
  let socket;
  const errors = [];
  try {
    const portFile = path.join(profile, 'DevToolsActivePort');
    for (let n = 0; n < 100 && !fs.existsSync(portFile); n++) await delay(100);
    assert.ok(fs.existsSync(portFile), 'Chromium failed to start');
    const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
    const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', reject, { once: true });
    });
    let sequence = 0;
    const pending = new Map();
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
      const timer = setTimeout(() => reject(new Error(`CDP timeout: ${method}`)), 15000);
      pending.set(id, { resolve, reject, timer });
      socket.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async expression => {
      const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
      return result.result.value;
    };
    const waitFor = async expression => {
      for (let n = 0; n < 100; n++) {
        if (await evaluate(`Boolean(${expression})`)) return;
        await delay(80);
      }
      throw new Error(`Condition failed: ${expression}`);
    };
    const visible = selector => `[...document.querySelectorAll(${JSON.stringify(selector)})].find(e=>e.getClientRects().length && getComputedStyle(e).visibility!=='hidden')`;
    const panelOpen = `Boolean(${visible('[data-category-panel]')})`;
    async function click(selector) {
      await evaluate(`(()=>{const e=${visible(selector)}; if(!e)return; const r=e.getBoundingClientRect(); if(r.top<0 || r.bottom>innerHeight || r.left<0 || r.right>innerWidth) e.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});})()`);
      await delay(40);
      const box = await evaluate(`(()=>{const e=${visible(selector)};if(!e)return null; const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
      assert.ok(box, `No visible target: ${selector}`);
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...box, button: 'left', clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...box, button: 'left', clickCount: 1 });
      await delay(100);
    }
    async function key(value, modifiers = 0) {
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: value, code: value, modifiers });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: value, code: value, modifiers });
    }
    async function ensureMobileMenu() {
      if (!mobile) return;
      const navVisible = await evaluate(`Boolean(${visible('[data-nav-key="collections"]')})`);
      if (!navVisible) await click('button[aria-label*="menu" i], button[aria-label*="navigation" i], [data-mobile-menu]');
    }
    async function snapshot(name) {
      const metrics = refined && name === 'homepage' && !mobile
        ? await send('Page.getLayoutMetrics') : null;
      const image = await send('Page.captureScreenshot', { format: 'jpeg', quality: 85,
        ...(metrics ? {captureBeyondViewport:true,clip:{x:0,y:0,width:Math.ceil(metrics.cssContentSize.width),height:Math.ceil(metrics.cssContentSize.height),scale:1}} : {})
      });
      fs.writeFileSync(`${output}/${component}-${mobile ? 'mobile' : 'desktop'}-${name}.jpg`, Buffer.from(image.data, 'base64'));
    }
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width, height: mobile ? 844 : 900, deviceScaleFactor: 1, mobile,
    });
    // Test the managed sandbox directly with its dev Host; the public proxy's
    // private-project sign-in page is not the application under test.
    await send('Page.navigate', { url: `http://${domain}:23636/__mockup/preview/fsd-house/${component}` });
    await waitFor(`document.readyState==='complete' && document.querySelector('[data-collection-banner="womens"]')`);
    await evaluate('document.fonts.ready.then(()=>true)');
    const brokenImages = await evaluate(`(async()=>{
      const images=[...document.images];
      images.forEach(image=>image.loading='eager');
      await Promise.all(images.map(image=>image.decode().catch(()=>null)));
      return images.filter(image=>!image.naturalWidth).map(image=>image.getAttribute('src'));
    })()`);
    assert.deepEqual(brokenImages, [], 'Homepage has undecodable or missing imagery');
    assert.ok(await evaluate(`(()=>{
      const button=document.querySelector('[data-primary-action],.fd-button-primary,.fh-hero-actions button');
      const styles=getComputedStyle(button);
      const luminance=color=>{
        const channels=color.match(/[\\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
        return channels.reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
      };
      const a=luminance(styles.color),b=luminance(styles.backgroundColor);
      return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5;
    })()`), 'Hero action text contrast is too low');
    if (refined) assert.ok(await evaluate(`(()=>{
      const luminance=color=>color.match(/[\\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
      const base=luminance('rgb(9,10,12)');
      return [...document.querySelectorAll('[data-collection-banner] strong')].every(element=>(luminance(getComputedStyle(element).color)+.05)/(base+.05)>=4.5);
    })()`), 'Collection heading text lacks contrast against the dark campaign overlay');
    assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'), 'Homepage horizontal overflow');
    assert.ok(await evaluate(`!document.body.innerText.toLowerCase().includes('in development')`), 'Prohibited status wording visible');
    assert.ok(await evaluate(`!document.querySelector('input[type="email"]:not(:disabled)')`), 'Email collection unexpectedly enabled');
    await snapshot('homepage');
    for (const category of ['collections', 'bio-lab', 'hardware', 'house', 'private']) {
      await ensureMobileMenu();
      const before = await evaluate('({y:scrollY,url:location.href})');
      await click(`[data-nav-key="${category}"]`);
      await waitFor(panelOpen);
      assert.ok(Math.abs(await evaluate('scrollY') - before.y) < 2, `${category} selection scrolled the page`);
      assert.equal(await evaluate('location.href'), before.url, `${category} navigated before deliberate choice`);
      assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'), 'Open panel horizontal overflow');
      if (category === 'collections') {
        assert.ok(await evaluate(`Boolean(${visible('[data-subcategory]')})`), 'Collection subcategories not immediately available');
        await snapshot('navigation-open');
        if (refined) {
          const milliseconds = await evaluate(`(()=>{
            const panel=${visible('[data-category-panel]')};
            const styles=[getComputedStyle(panel),getComputedStyle(panel.parentElement)];
            return Math.max(...styles.flatMap(s=>[...s.animationDuration.split(','),...s.transitionDuration.split(',')]).map(s=>parseFloat(s)*1000));
          })()`);
          assert.ok(milliseconds >= 180 && milliseconds <= 250, `Opening duration ${milliseconds}ms is outside the requested range`);
          if (!mobile) {
            assert.ok(await evaluate(`Math.abs((${visible('[data-category-panel]')}).getBoundingClientRect().top-document.querySelector('header').getBoundingClientRect().bottom)<=3`), 'Dropdown is detached from the header');
          }
        }
      }
      await key('Escape');
      if (refined && category === 'collections') {
        await delay(60);
        assert.ok(await evaluate(panelOpen), 'Closing transition unmounted the panel immediately');
      }
      await waitFor(`!(${panelOpen})`);
      assert.ok(await evaluate('document.activeElement?.getClientRects().length>0'), 'Focus restored to an invisible trigger');
    }
    // Desktop outside click closes the panel where an outside surface exists.
    if (!mobile) {
      await click('[data-nav-key="collections"]');
      await waitFor(panelOpen);
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 3, y: 890, button: 'left', clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 3, y: 890, button: 'left', clickCount: 1 });
      await waitFor(`!(${panelOpen})`);
    }
    // Actual collection banners must open selectors at the current scroll offset.
    for (const audience of ['mens', 'womens']) {
      await evaluate(`document.querySelector('[data-collection-banner="${audience}"]').scrollIntoView({block:'center',behavior:'instant'})`);
      await delay(250);
      const before = await evaluate('({y:scrollY,url:location.href})');
      await click(`[data-collection-banner="${audience}"]`);
      await waitFor(panelOpen);
      if (refined) {
        assert.ok(await evaluate(`(()=>{const r=(${visible('[data-category-panel]')}).getBoundingClientRect(); return r.top>=0 && r.top<innerHeight && r.bottom>0;})()`), 'Banner opened a selector outside the viewport');
      }
      assert.ok(Math.abs(await evaluate('scrollY') - before.y) < 2, `${audience} banner caused unexpected scrolling`);
      assert.equal(await evaluate('location.href'), before.url, 'Banner navigated instead of selecting');
      await click('[data-subcategory]');
      assert.equal(await evaluate('location.href'), before.url, 'Subcategory selection navigated early');
      if (refined) assert.ok(Math.abs(await evaluate('scrollY') - before.y) < 2, 'Subcategory selection scrolled the document');
      await waitFor(`Boolean(${visible('[data-explore-collection]')})`);
      await click('[data-explore-collection]');
      await waitFor(`Boolean(${visible('[data-destination]')})`);
      if (audience === 'womens') {
        assert.ok(await evaluate(`/women.*modest combat/i.test(document.body.innerText)`), 'Dedicated women’s collection view is missing');
      }
      await snapshot(`${audience}-destination`);
      await click('[data-home]');
      await waitFor(`document.querySelector('[data-collection-banner="womens"]') && !(${visible('[data-destination]')})`);
    }
    await evaluate('window.scrollTo({top:0,behavior:"instant"})');
    await ensureMobileMenu();
    await click('[data-nav-key="collections"]');
    await waitFor(panelOpen);
    if (mobile) {
      for (let n = 0; n < 35; n++) {
        await key('Tab');
        assert.ok(await evaluate(`document.activeElement.closest('[data-category-panel]')!==null`), 'Mobile modal focus escaped');
      }
    }
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    const duration = await evaluate(`(()=>{
      const style=getComputedStyle(${visible('[data-category-panel]')});
      return [style.animationDuration,style.transitionDuration].join(',');
    })()`);
    assert.ok(duration.split(',').every(v => parseFloat(v) <= 0.05), 'Panel ignores reduced-motion preference');
    await key('Escape');
    await waitFor(`!(${panelOpen})`);
    assert.deepEqual(errors, [], 'Browser runtime errors');
    return { component, viewport: mobile ? 'mobile' : 'desktop', status: 'PASS' };
  } finally {
    socket?.close();
    chrome.kill('SIGTERM');
    await delay(200);
    fs.rmSync(profile, { recursive: true, force: true });
  }
}

for (const component of components) {
  for (const width of [1280, 390]) {
    try { findings.push(await scenario(component, width)); }
    catch (error) { findings.push({ component, viewport: width, status: 'FAIL', message: error.message }); }
    console.log(findings.at(-1));
  }
}
const originals = JSON.parse(fs.readFileSync(refined
  ? 'generated-artifacts/fsd-house/plus-baseline.json'
  : 'generated-artifacts/fsd-house/baseline/original-sha256.json', 'utf8'));
for (const original of originals) {
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(original.file)).digest('hex'), original.sha256, `Original modified: ${original.file}`);
}
const report = { scenarios: findings, originalFilesUnchanged: originals.length };
fs.writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
console.log(`Confirmed ${originals.length} original source, branding and image files unchanged.`);
if (findings.some(f => f.status === 'FAIL')) process.exitCode = 1;
