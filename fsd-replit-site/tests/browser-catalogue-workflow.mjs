import assert from 'node:assert/strict';
import { withBrowser } from './browser-utils.mjs';

for (const [name, options] of [
  ['desktop', { width:1440,height:1000 }],
  ['mobile', { width:390,height:844,mobile:true }],
]) {
  await withBrowser(options, async ({ evaluate, waitFor, click, navigate, send, errors }) => {
    await waitFor('document.querySelector(".hero-actions .primary-btn")');
    assert.equal(await evaluate('document.querySelector(".announcement-link").getAttribute("href")'), '#collections');
    assert.ok(await evaluate('getComputedStyle(document.querySelector(".hero-actions .primary-btn")).backgroundColor.match(/\\d+/g).slice(0,3).every(value=>Number(value)<40)'));
    await navigate('/products/10/fsd-cheetah-windrunner/');
    await waitFor('document.querySelector("#product-dialog")?.open && document.querySelector("[data-gallery-main]")?.complete');
    assert.equal(await evaluate('document.querySelector("#product-title").tagName'), 'H1');
    assert.match(await evaluate('document.title'), /FSD Cheetah Windrunner/);
    assert.match(await evaluate('document.querySelector("[data-selected-colour]").textContent'), /Sunshine yellow/);
    assert.ok(await evaluate('document.querySelector("[data-gallery-main]").currentSrc.includes("/responsive/")'));
    await send('Network.enable');
    await send('Network.setBlockedURLs', { urls:['*windrunner-white*'] });
    await click('[data-colour-option][data-variant-id="colour-2"]');
    await waitFor('document.querySelector("[data-variant-status]").textContent.includes("Could not load")');
    assert.match(await evaluate('document.querySelector("[data-selected-colour]").textContent'), /Sunshine yellow/);
    assert.ok(await evaluate('document.querySelector("[data-gallery-main]").currentSrc.includes("windrunner-yellow")'));
    await send('Network.setBlockedURLs', { urls:[] });
    await click('[data-colour-option][data-variant-id="colour-2"]');
    await waitFor('document.querySelector("[data-selected-colour]").textContent.includes("Blizzard") && document.querySelector("[data-gallery-main]").currentSrc.includes("windrunner-white")');
    assert.equal(await evaluate('document.querySelector("[data-colour-option][data-variant-id=\\"colour-2\\"]").getAttribute("aria-pressed")'), 'true');
    assert.equal(await evaluate('document.querySelectorAll("[data-size-option],[data-selected-sku]").length'), 0);
    await click('#close-dialog');
    await waitFor('!document.querySelector("#product-dialog").open && location.pathname === "/"');
    assert.equal(await evaluate('document.title'), 'FSD — Fitness & Self Defence');
    await navigate('/#product/38');
    await waitFor('document.querySelector("#product-dialog")?.open');
    await click('[data-colour-option][data-variant-id="colour-4"]');
    assert.match(await evaluate('document.querySelector("[data-selected-colour]").textContent'), /Olive/);
    assert.equal(await evaluate('document.querySelectorAll("#dialog-body [data-gallery-main],#dialog-body [data-open-viewer]").length'), 0);
    assert.match(await evaluate('document.querySelector("[data-variant-status]").textContent'), /not available for this colourway/);
    assert.equal(await evaluate('document.querySelector("#dialog-body").scrollWidth <= document.querySelector("#dialog-body").clientWidth + 1'), true);
    assert.equal(errors.length, 0, errors.join('\n'));
    console.log(`PASS Phase 4 ${name}: clean URLs/SEO, responsive variants, failed-load atomicity/retry, honest missing imagery, no fabricated sizes/SKUs, safe close.`);
  });
}
