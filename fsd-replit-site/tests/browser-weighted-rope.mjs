import assert from 'node:assert/strict';
import { withBrowser } from './browser-utils.mjs';
const editions = ['crimson-red','deep-ultraviolet-plum','electric-cobalt-blue','electric-fuchsia','electric-green','hyper-flame-orange','matte-obsidian','sunbeam-yellow'];
for (const [name,viewport] of [
  ['desktop',{width:1440,height:1000}],
  ['mobile',{width:390,height:844,mobile:true}],
  ['reduced-motion',{width:1280,height:900,reduce:true}],
]) {
  await withBrowser({...viewport,path:'/__catalogue-preview/weighted-skipping-rope/',readyExpression:'!!document.querySelector("[data-gallery-main]")'}, async ({evaluate,waitFor,click,key,send,delay,errors}) => {
    await waitFor('document.querySelector("[data-gallery-main]")?.naturalWidth > 0 && document.querySelector("#campaign-image img")?.naturalWidth > 0');
    const location = await evaluate('location.href');
    const hero = await evaluate('document.querySelector("#campaign-image img").src');
    assert.equal(await evaluate('document.querySelector("#product-dialog").matches(":modal")'),false);
    assert.equal(await evaluate('document.documentElement.classList.contains("fsd-modal-open")'),false);
    assert.equal(await evaluate('document.querySelectorAll("[data-colour-option]").length'),8);
    assert.equal(await evaluate('document.querySelectorAll("[data-size-option],[data-selected-sku],.product-permanent-link").length'),0);
    for (const edition of editions) {
      await click(`[data-colour-option][data-variant-id="${edition}"]`);
      await waitFor(`document.querySelector("[data-gallery-main]").src.includes("weighted-rope-${edition}-view-1.png") && document.querySelector('[data-colour-option][data-variant-id="${edition}"]').getAttribute("aria-pressed") === "true"`);
      assert.equal(await evaluate('document.querySelectorAll("[data-image-index]").length'),4);
      assert.ok(await evaluate(`Array.from(document.querySelectorAll("[data-image-index] img")).every(image=>(image.src || image.dataset.src).includes("${edition}"))`));
      await click('[data-image-index="3"]');
      await waitFor(`document.querySelector("[data-gallery-main]").src.includes("${edition}-handle-detail.png")`);
      assert.equal(await evaluate('document.querySelector("#campaign-image img").src'),hero);
      assert.equal(await evaluate('location.href'),location);
    }
    await click('[data-open-viewer]');
    await waitFor('document.querySelector(".product-image-viewer")?.open');
    assert.ok(await evaluate('document.querySelector("[data-viewer-image]").src.includes("sunbeam-yellow-handle-detail.png")'));
    await key('ArrowRight');
    await waitFor('document.querySelector("[data-viewer-image]").src.includes("sunbeam-yellow-view-1.png")');
    await key('Escape');
    await waitFor('!document.querySelector(".product-image-viewer").open');
    assert.ok(await evaluate('document.activeElement.matches("[data-open-viewer]")'));
    await key('Escape');
    assert.ok(await evaluate('document.querySelector("#product-dialog").open'));
    await click('[data-colour-option][data-variant-id="crimson-red"]');
    await click('[data-colour-option][data-variant-id="electric-cobalt-blue"]');
    await click('[data-colour-option][data-variant-id="electric-green"]');
    await waitFor('document.querySelector("[data-gallery-main]").src.includes("electric-green-view-1.png")');
    if (viewport.mobile) {
      await evaluate('document.querySelector("[data-gallery-main]").scrollIntoView({block:"center",behavior:"instant"})');
      const point = await evaluate('(()=>{const r=document.querySelector("[data-gallery-main]").getBoundingClientRect();return{x:r.left+r.width*.75,y:r.top+r.height*.5,end:r.left+r.width*.25}})()');
      await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:point.x,y:point.y}]});
      await delay(60);
      await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.end,y:point.y}]});
      await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
      await waitFor('document.querySelector("[data-gallery-main]").src.includes("electric-green-view-2.png")');
    }
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth + 1'),true);
    assert.match(await evaluate('document.querySelector("[data-product-content-status]").textContent'),/DRAFT/);
    assert.equal(await evaluate('(async()=>{const r=await fetch("/__catalogue-preview/data/weighted-skipping-rope.json",{method:"POST"});return r.status})()'),405);
    assert.equal(await evaluate('(async()=>{const r=await fetch("/content/catalogue.json");return r.status})()'),403);
    assert.equal(errors.length,0,errors.join('\n'));
    console.log(`PASS rope ${name}: 8×4 correct views, independent campaign, inline scroll, viewer/keyboard/focus, rapid selection, draft/read-only restrictions.`);
  });
}
