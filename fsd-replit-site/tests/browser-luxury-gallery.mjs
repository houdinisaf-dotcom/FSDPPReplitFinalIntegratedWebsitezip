import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { browserSession, pause } from './browser-session.mjs';
import { products, productImagesForDisplay } from '../src/data/products.js';

const browser = await browserSession();
const { send, evaluate, wait, key } = browser;
const base = `https://${process.env.REPLIT_DEV_DOMAIN}`;
const images = productImagesForDisplay(products.find(product => product.id === 75));
const roseRear = images.findIndex(image => image.colourway === 'Dusty Rose' && /rear/i.test(image.label));
assert.ok(roseRear >= 0);
const selectedIndex = `Number(document.querySelector('#product-dialog [data-catalogue-image-index][aria-pressed="true"]')?.dataset.catalogueImageIndex)`;
try {
  for (const [width, height] of [[1440, 1000], [768, 1024], [393, 852], [375, 812], [320, 720]].filter(([width]) => !process.env.FSD_TEST_WIDTH || width === Number(process.env.FSD_TEST_WIDTH))) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, mobile: false, deviceScaleFactor: 1 });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    await send('Page.navigate', { url: `${base}/?gallery-check=${width}#line-flex` });
    await wait(`location.search.includes('gallery-check=${width}') && document.querySelector('[data-runtime-ready="true"]') && document.querySelector('[data-clothing-product-id="75"]')`, 'FLEX collection ready');
    await evaluate(`document.querySelector('[data-clothing-product-id="75"] button').click()`);
    await wait(`document.querySelector('#product-dialog')?.open && document.querySelector('[data-gallery-fullscreen]')`, 'enhanced product gallery');
    const photoOpener = '#dialog-body [data-gallery-photo-open]:not([hidden])';
    await evaluate(`document.querySelector(${JSON.stringify(photoOpener)}).querySelector('img').click()`);
    await wait(`document.querySelector('#fsd-product-viewer')?.open &&
      !document.querySelector('[data-viewer-photo]').hidden &&
      document.querySelector('[data-viewer-photo]').naturalWidth > 0`, 'photograph opens full-screen viewer');
    assert.equal(await evaluate(`document.querySelector('#fsd-product-viewer').matches(':modal')`), true);
    await key('Escape');
    await wait(`!document.querySelector('#fsd-product-viewer')?.open &&
      document.querySelector('#product-dialog')?.open &&
      document.activeElement === document.querySelector(${JSON.stringify(photoOpener)})`,
    'viewer Escape closes only the viewer and restores focus');
    const first = await evaluate(selectedIndex);
    await evaluate(`document.querySelector('[data-gallery-step="1"]').click()`);
    await wait(`${selectedIndex} !== ${first}`, 'next view');
    assert.ok((await evaluate(`document.querySelector('[data-catalogue-selected-colourway]').textContent`)).includes('Obsidian Black'));
    await evaluate(`document.querySelector('.product-detail-image-stage').focus()`);
    const beforeKey = await evaluate(selectedIndex);
    await key('ArrowRight');
    await wait(`${selectedIndex} !== ${beforeKey}`, 'keyboard image navigation');
    // Choosing a non-primary photograph must still synchronise the exact colour.
    const thumbnailSelection = await evaluate(`(() => {
      const button = document.querySelector('[data-catalogue-image-index="${roseRear}"]');
      const targetSrc = button.querySelector('img').currentSrc;
      button.click();
      return {
        targetSrc,
        mainSrc: document.querySelector('[data-catalogue-main-image]').src,
        selected: button.getAttribute('aria-pressed'),
      };
    })()`);
    assert.equal(thumbnailSelection.mainSrc, thumbnailSelection.targetSrc,
      'one thumbnail click immediately updates the main image source');
    assert.equal(thumbnailSelection.selected, 'true');
    await wait(`document.querySelector('[data-catalogue-main-image]')?.naturalWidth > 0`, 'selected thumbnail photo is visible');
    await wait(`document.querySelector('[data-catalogue-selected-colourway]').textContent === 'Dusty Rose'`, 'rear photo updates colour');
    await evaluate(`document.querySelector('[data-catalogue-colourway-index="1"]').click()`);
    await wait(`document.querySelector('[data-catalogue-main-image]:not(.mapped-gallery-image--hidden)')?.dataset.fsdImageVariant === 'Sage Green'`, 'correct mapped photo');
    await evaluate(`document.querySelector('.product-detail-image-stage').scrollIntoView({behavior:'instant',block:'center'})`);
    const box = await evaluate(`(() => {const r=document.querySelector('.product-detail-image-stage').getBoundingClientRect();return {x:r.left+r.width*.8,y:Math.max(160,Math.min(innerHeight-80,r.top+r.height*.45)),dx:r.width*.55};})()`);
    const beforeSwipe = await evaluate(selectedIndex);
    await evaluate(`window.__galleryPointerTrace=[];['pointerdown','pointerup','pointercancel'].forEach(type=>document.querySelector('.product-detail-image-stage').addEventListener(type,e=>window.__galleryPointerTrace.push({type:e.type,x:e.clientX,y:e.clientY,target:e.target.tagName})))`);
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x, y: box.y }] });
    await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: box.x - box.dx, y: box.y }] });
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    try { await wait(`${selectedIndex} !== ${beforeSwipe}`, 'touch swipe'); }
    catch (error) {
      console.error({width, box, trace: await evaluate(`window.__galleryPointerTrace`),
        hit: await evaluate(`document.elementFromPoint(${box.x},${box.y})?.outerHTML.slice(0,200)`)});
      throw error;
    }
    assert.equal(await evaluate(`document.querySelector('[data-catalogue-selected-colourway]').textContent`), 'Sage Green');
    const scroll = await evaluate(`document.querySelector('#product-dialog').scrollTop`);
    await evaluate(`document.querySelector('[data-gallery-fullscreen]').click()`);
    await wait(`document.querySelector('#fsd-product-viewer')?.open && !document.querySelector('[data-viewer-photo]').hidden && document.querySelector('[data-viewer-photo]').naturalWidth > 0`, 'decoded original full-screen photograph');
    const skeletonContent = await evaluate(`(() => {const stage=document.querySelector('[data-viewer-stage]');stage.setAttribute('aria-busy','true');const content=getComputedStyle(stage,'::before').content;stage.removeAttribute('aria-busy');return content;})()`);
    assert.notEqual(skeletonContent, 'none', 'busy gallery exposes its dimension-stable loading skeleton');
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    const reducedMotionState = await evaluate(`({viewer:getComputedStyle(document.querySelector('#fsd-product-viewer')).animationName,photo:getComputedStyle(document.querySelector('[data-viewer-photo]')).animationName,visible:!document.querySelector('[data-viewer-photo]').hidden})`);
    assert.equal(reducedMotionState.viewer, 'none', 'live reduced-motion preference removes viewer entrance motion');
    assert.equal(reducedMotionState.photo, 'none', 'live reduced-motion preference removes photo entrance motion');
    assert.equal(reducedMotionState.visible, true, 'reduced motion keeps the photograph available');
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    if (width === 1440) {
      await evaluate(`window.__motionTestStarted=false;window.__motionTestDone=false;window.__motionTestError=null;void import('/src/motion-runtime.js').then(({animateElement})=>{window.__motionTestStarted=true;return animateElement(document.querySelector('[data-viewer-photo]'),{opacity:[.15,1],y:[18,0]},{duration:2});}).then(()=>{window.__motionTestDone=true;}).catch(error=>{window.__motionTestError=String(error)});true`);
      await wait(`window.__motionTestStarted && document.querySelector('[data-viewer-photo]').getAnimations().some(animation=>animation.effect?.getTiming().duration===2000)`, 'motion runtime test animation is active');
      await evaluate(`window.__motionTestReduceAt=performance.now()`);
      await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
      await wait('window.__motionTestDone', 'live reduced-motion setting settles active motion');
      assert.ok(await evaluate(`performance.now()-window.__motionTestReduceAt < 1000`), 'active motion settles promptly when reduced motion changes live');
      assert.equal(await evaluate(`getComputedStyle(document.querySelector('[data-viewer-photo]')).opacity`), '1');
      await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
    }
    if (process.env.FSD_GALLERY_CAPTURE) {
      const shot = await send('Page.captureScreenshot', { format: 'png' });
      await writeFile(`${process.env.FSD_GALLERY_CAPTURE}-${width}.png`, Buffer.from(shot.data, 'base64'));
    }
    assert.ok(await evaluate(`document.querySelector('#product-dialog').open`), 'parent product remains open');
    assert.ok(await evaluate(`document.querySelector('[data-viewer-caption]').textContent.includes('Sage Green')`));
    await key('ArrowRight');
    await wait(`!document.querySelector('[data-viewer-photo]').hidden`, 'full-screen next view');
    assert.ok(await evaluate(`document.querySelector('[data-viewer-caption]').textContent.includes('Sage Green')`));
    await evaluate(`window.__nativeGalleryImage=window.Image;window.__galleryDecodeRequests=[];window.Image=function(...args){const image=new window.__nativeGalleryImage(...args);image.decode=()=>new Promise((resolve,reject)=>window.__galleryDecodeRequests.push({resolve:()=>window.__nativeGalleryImage.prototype.decode.call(image).then(resolve,reject)}));return image;}`);
    await evaluate(`document.querySelector('[data-viewer-next]').click();document.querySelector('[data-viewer-next]').click()`);
    await wait(`window.__galleryDecodeRequests.length === 2`, 'both rapid full-screen image requests started');
    await evaluate(`window.__galleryDecodeRequests[1].resolve()`);
    await wait(`!document.querySelector('[data-viewer-photo]').hidden && document.querySelector('[data-viewer-photo]').alt.endsWith(document.querySelector('.fsd-photo-viewer__thumbs button[aria-pressed="true"]').getAttribute('aria-label'))`, 'latest rapid full-screen image wins');
    await evaluate(`window.__galleryDecodeRequests[0].resolve()`);
    const latestPhoto = await evaluate(`({alt:document.querySelector('[data-viewer-photo]').alt,label:document.querySelector('.fsd-photo-viewer__thumbs button[aria-pressed="true"]').getAttribute('aria-label')})`);
    assert.ok(latestPhoto.alt.endsWith(latestPhoto.label), 'late stale decode cannot replace the selected photo');
    await evaluate(`window.Image=window.__nativeGalleryImage;window.__nativeGalleryImage=null`);
    await evaluate(`window.__nativeGalleryImage=window.Image;window.__galleryDecodeAttempts=0;window.Image=function(...args){const image=new window.__nativeGalleryImage(...args);image.decode=()=>{window.__galleryDecodeAttempts++;return window.__galleryDecodeAttempts===1?Promise.reject(Error('controlled test failure')):window.__nativeGalleryImage.prototype.decode.call(image);};return image;};document.querySelector('[data-viewer-next]').click()`);
    await wait(`!document.querySelector('[data-viewer-error]').hidden`, 'full-screen image error state');
    assert.ok(await evaluate(`document.querySelector('[data-viewer-error-message]').textContent.includes('could not load')`));
    await evaluate(`document.querySelector('[data-viewer-retry]').click()`);
    await wait(`document.querySelector('[data-viewer-error]').hidden && !document.querySelector('[data-viewer-photo]').hidden && document.querySelector('[data-viewer-photo]').naturalWidth > 0`, 'retry recovers the original photograph');
    await evaluate(`window.Image=window.__nativeGalleryImage;window.__nativeGalleryImage=null`);
    await wait(`(() => {const photo=document.querySelector('[data-viewer-photo]');const stage=document.querySelector('[data-viewer-stage]');const scale=document.querySelector('[data-viewer-scale]');if(!photo?.naturalWidth||!stage?.clientWidth||!stage?.clientHeight)return false;const fit=Math.min(stage.clientWidth/photo.naturalWidth,stage.clientHeight/photo.naturalHeight);const expected=Math.max(1,Math.min(3,1/fit));return Math.abs(Number(scale.max)-expected)<.02;})()`, 'zoom limit after responsive layout');
    const zoomLimit = await evaluate(`(() => {const photo=document.querySelector('[data-viewer-photo]');const stage=document.querySelector('[data-viewer-stage]');const fit=Math.min(stage.clientWidth/photo.naturalWidth,stage.clientHeight/photo.naturalHeight);return {max:Number(document.querySelector('[data-viewer-scale]').max),expected:Math.max(1,Math.min(3,1/fit))};})()`);
    assert.ok(Math.abs(zoomLimit.max - zoomLimit.expected) < .02, `zoom cap follows source dimensions: ${JSON.stringify(zoomLimit)}`);
    const requestedZoom = await evaluate(`(() => {const scale=document.querySelector('[data-viewer-scale]');const maximum=Number(scale.max);const target=Math.min(2.5,1+Math.floor((maximum-1)*4)/4);scale.value=String(target);scale.dispatchEvent(new Event('input',{bubbles:true}));return target;})()`);
    assert.equal(await evaluate(`document.querySelector('.fsd-photo-viewer__plane').style.width`), `${requestedZoom * 100}%`);
    const zoomState = await evaluate(`(() => {const s=document.querySelector('[data-viewer-stage]'); const p=document.querySelector('.fsd-photo-viewer__plane');const c=getComputedStyle(p);return {open:document.querySelector('#fsd-product-viewer').open,scroll:s.scrollWidth,client:s.clientWidth,plane:p.getBoundingClientRect().width,style:p.style.width,display:getComputedStyle(s).display,width:c.width,max:c.maxWidth,maxInline:c.maxInlineSize,transform:c.transform};})()`);
    if (requestedZoom > 1) {
      assert.ok(zoomState.scroll > zoomState.client, `zoom supports inspection/panning: ${JSON.stringify(zoomState)}`);
      const pan = await evaluate(`(() => {const r=document.querySelector('[data-viewer-stage]').getBoundingClientRect();return {x:r.left+r.width*.6,y:r.top+r.height*.6};})()`);
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: pan.x, y: pan.y, button: 'left', clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pan.x - 85, y: pan.y - 40, buttons: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: pan.x - 85, y: pan.y - 40, button: 'left', clickCount: 1 });
      assert.ok(await evaluate(`document.querySelector('[data-viewer-stage]').scrollLeft > 50`), 'drag pans the magnified original');
    } else {
      assert.equal(await evaluate(`document.querySelector('[data-viewer-scale]').disabled`), true, 'native-size images do not expose ineffective zoom controls');
    }
    assert.equal(await evaluate(`document.querySelector('#fsd-product-viewer').scrollWidth > innerWidth + 1`), false, 'no horizontal modal overflow');
    await key('Escape');
    await wait(`!document.querySelector('#fsd-product-viewer').open && document.querySelector('#product-dialog').open`, 'Escape closes only viewer');
    assert.equal(await evaluate(`document.activeElement === document.querySelector('[data-gallery-fullscreen]')`), true);
    assert.ok(Math.abs((await evaluate(`document.querySelector('#product-dialog').scrollTop`)) - scroll) < 3, 'exact inspection return position');
    const returnedIndex = await evaluate(selectedIndex);
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box.x, y: box.y }] });
    await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: box.x - box.dx, y: box.y }] });
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await wait(`${selectedIndex} !== ${returnedIndex}`, 'swipe still works after closing a zoomed viewer');
    await evaluate(`[0,1,0,4].forEach(index => document.querySelector('[data-catalogue-colourway-index="'+index+'"]').click())`);
    await wait(`document.querySelectorAll('[data-catalogue-main-image]').length === 1 && document.querySelector('[data-catalogue-main-image]')?.dataset.fsdImageVariant === 'Teal'`, 'rapid switching ends on Teal');
    assert.equal(await evaluate(`document.querySelector('[data-catalogue-selected-colourway]').textContent`), 'Teal');
    await key('Escape');
    await wait(`!document.querySelector('#product-dialog').open`, 'return to collection');
    assert.equal(await evaluate(`document.documentElement.scrollWidth > innerWidth+1`), false);
    console.log(`PASS gallery keyboard/swipe, exact variants, full-screen original photos, zoom, nested close/focus and scroll return: ${width}px`);
  }
  await evaluate(`import('/src/catalogue.js').then(module => module.showProduct(43))`);
  assert.equal(await evaluate(`document.querySelector('#product-dialog [data-product-rotation]') !== null`), false, 'no unprovided 360 viewer');
  await key('Escape');
  await evaluate(`import('/src/catalogue.js').then(module => module.showProduct(38))`);
  assert.equal(await evaluate(`!!document.querySelector('#product-dialog [data-gallery-fullscreen]:not(:disabled)')`), false, 'missing imagery stays a named placeholder without an available full-screen action');
  await key('Escape');
  await evaluate(`import('/src/catalogue.js').then(module => module.showProduct(70))`);
  await wait(`document.querySelector('[data-gallery-step="1"]')`, 'single photograph controls');
  assert.equal(await evaluate(`document.querySelector('[data-gallery-step="1"]').disabled`), true, 'no invented extra angles');
  await key('Escape');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await pause(100);
  assert.ok(await evaluate(`!document.querySelector('.fsd-clothing-archive').classList.contains('fsd-motion-ready')`), 'reduced motion exposes static content');
  assert.deepEqual(browser.errors, [], 'no uncaught browser exceptions');
  console.log('PASS accurate fallback for missing assets, single-photo products, absent 3D/360 and reduced motion');
} finally { await browser.close(); }
