import assert from 'node:assert/strict';
import { withBrowser } from './browser-utils.mjs';

const scenarios = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'mobile', width: 390, height: 844, mobile: true },
  { name: 'reduced-motion', width: 1280, height: 900, reduce: true },
  { name: 'missing-animation-apis', width: 1280, height: 900,
    initScripts: ['Element.prototype.animate=undefined; window.IntersectionObserver=undefined;'] },
];
const requested = process.argv.slice(2);
for (const scenario of scenarios.filter(item => !requested.length || requested.includes(item.name))) {
  await withBrowser(scenario, async ({ evaluate, waitFor, click, key, send, navigate, delay }) => {
    await evaluate('document.querySelector("#catalogue-archive").open=true; history.replaceState(null,"","#products"); document.querySelector("#products").scrollIntoView({behavior:"instant"})');
    await delay(200);
    assert.equal(await evaluate('document.querySelectorAll("#catalogue-grid article").length'), 12);
    // Explicit colour previews never open a product or fabricate a new image.
    await click('#catalogue-grid article:first-child [data-card-image-index="1"]');
    await waitFor('document.querySelector("#catalogue-grid article:first-child .product-image img").src.endsWith("ombre-blue.png")');
    assert.equal(await evaluate('location.hash'), '#products');
    assert.equal(await evaluate('document.querySelectorAll("dialog[open]").length'), 0);
    assert.equal(await evaluate('document.querySelector("#catalogue-grid article:first-child [data-card-image-index=\\"1\\"]").getAttribute("aria-pressed")'), 'true');

    const sourceY = await evaluate('scrollY');
    await click('#catalogue-grid [data-product="10"]');
    await waitFor('document.querySelector("#product-dialog").open && location.hash === "#product/10"');
    await delay(400);
    assert.equal(await evaluate('document.querySelectorAll("dialog[open]").length'), 1);
    assert.equal(await evaluate('document.querySelector("#product-title").textContent'), 'FSD Cheetah Windrunner');
    assert.ok(await evaluate('document.querySelector("[data-gallery-main]").src.endsWith("windrunner-yellow.png")'));
    assert.equal(await evaluate('document.querySelectorAll("[data-image-index]").length'), 3);
    assert.ok(await evaluate('Array.from(document.querySelectorAll("[data-image-index] img")).every(img=>!!img.getAttribute("src"))'), 'Thumbnails must not be empty squares.');
    assert.equal(await evaluate('getComputedStyle(document.querySelector("[data-gallery-main]")).objectFit'), 'contain');
    const stageSize = await evaluate('({w:document.querySelector(".product-gallery-stage").offsetWidth,h:document.querySelector(".product-gallery-stage").offsetHeight})');
    await click('[data-image-index="1"]');
    await waitFor('document.querySelector("[data-gallery-main]").src.endsWith("windrunner-white.png")');
    await click('[data-image-index="2"]');
    await click('[data-image-index="0"]');
    await click('[data-image-index="2"]');
    await waitFor('document.querySelector("[data-gallery-main]").src.endsWith("windrunner-khaki.png")');
    assert.deepEqual(await evaluate('({w:document.querySelector(".product-gallery-stage").offsetWidth,h:document.querySelector(".product-gallery-stage").offsetHeight})'), stageSize, 'Gallery changes do not shift layout.');
    await evaluate('document.querySelector("[data-image-index=\\"2\\"]").focus({preventScroll:true})');
    await key('ArrowLeft');
    await waitFor('document.querySelector("[data-gallery-main]").src.endsWith("windrunner-white.png")');
    if (scenario.mobile) {
      const rect = await evaluate('(()=>{const r=document.querySelector(".product-gallery-stage").getBoundingClientRect();return {x:r.left+r.width*.75,y:r.top+r.height*.45,end:r.left+r.width*.25}})()');
      await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: rect.x, y: rect.y }] });
      await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: rect.end, y: rect.y }] });
      await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await waitFor('document.querySelector("[data-gallery-main]").src.endsWith("windrunner-khaki.png")');
      await click('[data-image-index="1"]');
      await waitFor('document.querySelector("[data-gallery-main]").src.endsWith("windrunner-white.png")');
    }

    await click('[data-open-viewer]');
    await waitFor('document.querySelector(".product-image-viewer")?.open && document.querySelector("[data-viewer-image]").complete && document.querySelector("[data-viewer-image]").naturalWidth > 0');
    assert.ok(await evaluate('document.querySelector("[data-viewer-image]").src.endsWith("windrunner-white.png")'), 'Viewer is populated on its first opening.');
    assert.ok(await evaluate('document.documentElement.classList.contains("fsd-modal-open")'));
    assert.ok(await evaluate('(()=>{const r=document.querySelector(".product-image-viewer").getBoundingClientRect();return r.width>=innerWidth-2 && r.height>=innerHeight-2})()'), 'Viewer is genuinely full screen.');
    for (let i = 0; i < 14; i++) await key('Tab');
    assert.ok(await evaluate('document.querySelector(".product-image-viewer").contains(document.activeElement)'));
    await click('[data-zoom-in]');
    assert.equal(await evaluate('document.querySelector("[data-zoom-level]").textContent'), '120%');
    assert.ok(await evaluate('(()=>{const r=document.querySelector("[data-viewer-close]").getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight})()'), 'Close remains visible while zoomed.');
    await key('ArrowRight');
    await waitFor('document.querySelector("[data-viewer-image]").src.endsWith("windrunner-khaki.png")');
    await key('Escape');
    await waitFor('!document.querySelector(".product-image-viewer").open && document.activeElement.matches("[data-open-viewer]")');
    assert.ok(await evaluate('document.querySelector("#product-dialog").open && document.documentElement.classList.contains("fsd-modal-open")'), 'Closing viewer preserves the product modal.');
    assert.ok(await evaluate('document.activeElement.matches("[data-open-viewer]")'));
    await click('#close-dialog');
    await waitFor('!document.querySelector("#product-dialog").open && location.hash === "#products"');
    assert.equal(await evaluate('document.querySelectorAll("dialog[open]").length'), 0);
    await waitFor(`document.activeElement.dataset.product === "10" && Math.abs(scrollY - ${sourceY}) <= 2`);
    assert.equal(await evaluate('document.activeElement.dataset.product'), '10', 'Catalogue rerender restores focus to the matching product.');
    assert.ok(Math.abs(await evaluate('scrollY') - sourceY) <= 2, 'Source scroll position is restored.');
    await evaluate('history.forward()');
    await waitFor('document.querySelector("#product-dialog").open && location.hash === "#product/10"');
    assert.equal(await evaluate('document.querySelectorAll("dialog[open]").length'), 1);
    await evaluate('history.back()');
    await waitFor('!document.querySelector("#product-dialog").open');

    await click('#catalogue-pagination [data-page="2"]');
    await waitFor('document.querySelector("#catalogue-count").textContent.startsWith("Showing 13")');
    await click('#catalogue-grid [data-product]');
    await waitFor('document.querySelector("#product-dialog").open');
    await click('#close-dialog');
    await waitFor('!document.querySelector("#product-dialog").open && document.querySelector("#catalogue-count").textContent.startsWith("Showing 13")');
    await evaluate('document.querySelector("#catalogue-category").value="Women’s Performance";document.querySelector("#catalogue-category").dispatchEvent(new Event("change"));document.querySelector("#search").value="Aeroforge";document.querySelector("#search").dispatchEvent(new Event("input"))');
    await click('#catalogue-grid [data-product="39"]');
    await waitFor('document.querySelector("#product-dialog").open');
    await click('#close-dialog');
    await waitFor('!document.querySelector("#product-dialog").open && document.querySelector("#search").value === "Aeroforge"');
    assert.equal(await evaluate('document.querySelector("#catalogue-category").value'), 'Women’s Performance');

    // Floating-panel context must survive both Back/Close and Forward.
    await click('[data-division="apparel"]');
    await waitFor('document.querySelector("#fsd-showcase-dialog").open');
    await click('[data-group-index="1"]');
    await click('[data-subcategory-index="0"]');
    const panelScroll = await evaluate('(()=>{const c=document.querySelector("[data-dialog-content]");c.scrollTop=220;return c.scrollTop})()');
    await click('[data-product-id="43"]');
    await waitFor('document.querySelector("#product-dialog").open && !document.querySelector("#fsd-showcase-dialog").open');
    assert.equal(await evaluate('location.hash'), '#product/43');
    assert.equal(await evaluate('document.querySelectorAll("dialog[open]").length'), 1);
    assert.ok(await evaluate('!!document.querySelector(".product-story img[src$=\\"fsd-velocity-performance-sports-hijab.jpg\\"]")'), 'Velocity story uses its approved lead photograph.');
    const storyText = await evaluate('document.querySelector(".product-story").textContent');
    assert.match(storyText, /Black \/ Gold/);
    assert.match(storyText, /Standard \/ Core/);
    assert.doesNotMatch(storyText, /thumbhole|flatlock|raglan|certified|mesh ventilation/i);
    assert.ok(await evaluate('document.querySelector("#dialog-body").textContent.includes("£29.99")'));
    await evaluate('document.querySelector(".product-story").scrollIntoView({behavior:"instant",block:"start"})');
    assert.ok(await evaluate('(()=>{const r=document.querySelector("#close-dialog").getBoundingClientRect();return r.top>=0 && r.bottom<=innerHeight})()'), 'Touch users can dismiss while reading the story.');
    await click('.product-story-return');
    assert.equal(await evaluate('location.hash'), '#product/43', 'Story return is not a new route.');
    await click('#close-dialog');
    await waitFor('!document.querySelector("#product-dialog").open && document.querySelector("#fsd-showcase-dialog").open');
    assert.equal(await evaluate('document.querySelector("[data-group-index=\\"1\\"]").getAttribute("aria-pressed")'), 'true');
    assert.equal(await evaluate('document.querySelector("[data-subcategory-index=\\"0\\"]").getAttribute("aria-pressed")'), 'true');
    assert.ok(Math.abs(await evaluate('document.querySelector("[data-dialog-content]").scrollTop') - panelScroll) <= 2);
    assert.equal(await evaluate('document.activeElement.dataset.productId'), '43');
    await evaluate('history.forward()');
    await waitFor('document.querySelector("#product-dialog").open && !document.querySelector("#fsd-showcase-dialog").open');
    assert.equal(await evaluate('document.querySelectorAll("dialog[open]").length'), 1, 'Forward does not stack product and collection dialogs.');
    await evaluate('history.back()');
    await waitFor('!document.querySelector("#product-dialog").open && document.querySelector("#fsd-showcase-dialog").open');
    await key('Escape');
    await waitFor('!document.querySelector("#fsd-showcase-dialog").open && !document.documentElement.classList.contains("fsd-modal-open")');

    // Direct links are real, but cannot leak held records or invent imagery.
    await navigate('/#product/39');
    await waitFor('document.querySelector("#product-dialog").open');
    assert.equal(await evaluate('document.querySelectorAll("#dialog-body img").length'), 0);
    assert.equal(await evaluate('document.querySelectorAll("#dialog-body input[type=radio], [data-hotspot]").length'), 0);
    assert.equal(await evaluate('document.querySelector(".product-story")'), null);
    await click('.product-record-panels summary');
    await delay(250);
    assert.ok(await evaluate('document.querySelector(".product-record-panels details").open'));
    assert.match(await evaluate('document.querySelector("#dialog-body").textContent'), /Standalone athletic layer/);
    await click('#close-dialog');
    await waitFor('!document.querySelector("#product-dialog").open && location.hash === "#products"');
    await navigate('/#product/36');
    await delay(300);
    assert.ok(await evaluate('!document.querySelector("#product-dialog").open'), 'Held product direct links stay unavailable.');
    assert.ok(await evaluate('document.querySelector("#contact button").disabled && !document.querySelector("#contact form, #contact input")'));
    assert.ok(await evaluate('!Array.from(document.querySelectorAll("button,a")).some(el=>/^(buy now|add to cart|checkout|pay now)$/i.test(el.textContent.trim()))'));
    assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'));
    console.log(`PASS ${scenario.name}: mapped card previews, stable galleries, rapid selection, keyboard viewer/zoom/focus, source restoration, Back/Forward, factual Velocity story, direct links, held records, accordions and commerce restrictions.`);
  });
}

if (!requested.length || requested.includes('failed-media')) {
  await withBrowser({ width: 1280, height: 900, path: '/#product/1' }, async ({ send, evaluate, waitFor, click }) => {
    await waitFor('document.querySelector("#product-dialog").open');
    await send('Network.enable');
    await send('Network.setCacheDisabled', { cacheDisabled: true });
    await send('Network.clearBrowserCache');
    await send('Network.setBlockedURLs', { urls: ['*ombre-blue.png*', '*ombre-blue-*.webp*'] });
    await click('[data-image-index="1"]');
    await waitFor('/unavailable/i.test(document.querySelector("[data-gallery-status]").textContent)');
    assert.ok(await evaluate('document.querySelector("[data-gallery-main]").src.endsWith("ombre-indigo.png")'));
    assert.equal(await evaluate('document.querySelector("[data-image-index=\\"0\\"]").getAttribute("aria-pressed")'), 'true');
    await click('[data-open-viewer]');
    await waitFor('document.querySelector(".product-image-viewer").open && document.querySelector("[data-viewer-image]").naturalWidth>0');
    assert.ok(await evaluate('document.querySelector("[data-viewer-image]").src.endsWith("ombre-indigo.png")'), 'Failed selection never becomes the active viewer image.');
    console.log('PASS failed-media: old photo and committed selection survive a failed secondary image; viewer remains usable.');
  });
}
