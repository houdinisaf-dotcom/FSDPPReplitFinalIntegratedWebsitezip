import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { browserSession } from './browser-session.mjs';

const domain = process.env.REPLIT_DEV_DOMAIN;
assert.ok(domain, 'REPLIT_DEV_DOMAIN must identify the running FSD preview.');
const output = resolve(process.cwd(), '../generated-artifacts/fsd-site-evidence');
const browser = await browserSession();
const { send, evaluate, wait } = browser;

async function capture(name) {
  await mkdir(output, { recursive: true });
  const screenshot = await send('Page.captureScreenshot', {
    format: 'jpeg',
    quality: 88,
    fromSurface: true,
    captureBeyondViewport: false,
  });
  const path = resolve(output, name);
  await writeFile(path, Buffer.from(screenshot.data, 'base64'));
  console.log(`Captured ${path}`);
}

async function navigate(path, ready, label) {
  await send('Page.navigate', { url: `https://${domain}${path}` });
  await wait(ready, label);
  await wait('!document.querySelector("[data-fsd-luxury-entry]")', 'cinematic entry transition');
}

try {
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false,
  });
  await navigate('/', 'document.querySelector("#fsd-home-title")', 'homepage');
  await evaluate('document.querySelector("#home-experiences")?.scrollIntoView({ block: "start", behavior: "instant" })');
  await wait('document.querySelectorAll("#home-experiences [data-home-experience]").length === 4', 'editorial experience panels');
  await capture('fsd-home-experiences-desktop.jpg');

  await evaluate('window.scrollTo({ top: 0, behavior: "instant" })');
  await evaluate('document.querySelector("[data-nav-primary=\\"collections\\"]")?.click()');
  await wait('document.querySelector("#fsd-mega-menu") && !document.querySelector("#fsd-mega-menu").hidden', 'SHOP mega-menu');
  await capture('fsd-shop-mega-menu-desktop.jpg');

  await navigate('/collections/women', 'document.querySelector("#catalogue-grid .product-card")', 'women’s collection');
  await evaluate('document.querySelector("#catalogue-grid")?.scrollIntoView({ block: "start", behavior: "instant" })');
  await capture('fsd-womens-collection-desktop.jpg');

  await navigate('/collections/men', 'document.querySelector("#catalogue-grid .product-card")', 'men’s collection action reveal');
  const actionCard = await evaluate(`(() => {
    const card = [...document.querySelectorAll('#catalogue-grid .product-card--visual')].find(candidate => {
      const image = candidate.querySelector('[data-catalogue-card-image]');
      return candidate.querySelector('[data-card-action-image]') && /\\b(studio|front)\\b/i.test(image?.alt || '');
    });
    if (!card) return false;
    card.scrollIntoView({ block: 'center', behavior: 'instant' });
    card.querySelector('.product-row__trigger')?.focus({ preventScroll: true });
    return true;
  })()`);
  assert.equal(actionCard, true, 'Men collection has a mapped front/action photograph pair.');
  await wait(`getComputedStyle(document.querySelector('#catalogue-grid .product-card--visual:focus-within .catalogue-card__hover-action')).opacity === '1'`, 'keyboard-accessible action-photo reveal');
  await capture('fsd-product-card-action-reveal-desktop.jpg');

  await navigate('/?product=18', 'document.querySelector("#product-dialog")?.open', 'desktop product detail');
  await wait('document.querySelector("#product-dialog [data-catalogue-main-image]")', 'product gallery image');
  await capture('fsd-product-detail-desktop.jpg');
  await evaluate('document.querySelector("#dialog-body [data-gallery-photo-open]:not([hidden]) img")?.click()');
  await wait('document.querySelector("#fsd-product-viewer")?.open && !document.querySelector("[data-viewer-photo]").hidden && document.querySelector("[data-viewer-photo]").naturalWidth > 0', 'desktop full-screen image viewer');
  await capture('fsd-product-gallery-viewer-desktop.jpg');
  await evaluate('document.querySelector("#fsd-product-viewer [data-viewer-close]")?.click()');
  await wait('!document.querySelector("#fsd-product-viewer")?.open', 'desktop photo viewer closed');

  await send('Emulation.setDeviceMetricsOverride', {
    width: 402, height: 874, deviceScaleFactor: 1, mobile: true,
  });
  await navigate('/collections/women', 'document.querySelector("#catalogue-grid .product-card")', 'mobile women’s collection');
  await evaluate('document.querySelector("#catalogue-grid")?.scrollIntoView({ block: "start", behavior: "instant" })');
  await capture('fsd-shop-grid-mobile-402.jpg');

  await navigate('/?product=18', 'document.querySelector("#product-dialog")?.open', 'mobile product detail');
  await capture('fsd-product-detail-mobile-402.jpg');
  await evaluate('document.querySelector("#dialog-body [data-gallery-photo-open]:not([hidden]) img")?.click()');
  await wait('document.querySelector("#fsd-product-viewer")?.open && !document.querySelector("[data-viewer-photo]").hidden && document.querySelector("[data-viewer-photo]").naturalWidth > 0', 'mobile full-screen image viewer');
  await capture('fsd-product-gallery-viewer-mobile-402.jpg');
  await evaluate('document.querySelector("#fsd-product-viewer [data-viewer-close]")?.click()');
  await wait('!document.querySelector("#fsd-product-viewer")?.open', 'mobile photo viewer closed');

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false,
  });
  await navigate('/collections/women', 'document.querySelector("#catalogue-grid .product-card")', 'collection Quick View');
  await evaluate('document.querySelector("#catalogue-grid [data-product-quick-view]")?.click()');
  await wait('document.querySelector("#product-dialog")?.open && document.querySelector("#product-dialog").dataset.presentation === "quick-view"', 'Quick View');
  await capture('fsd-product-quick-view-desktop.jpg');

  await navigate('/', 'document.querySelector("[data-search-open]")', 'search trigger');
  await evaluate('document.querySelector("[data-search-open]")?.click()');
  await wait('document.querySelector("#fsd-search-dialog")?.open', 'predictive search dialog');
  await evaluate('document.querySelector("#fsd-search-input")?.focus()');
  await send('Input.insertText', { text: 'AeroForge' });
  await wait('document.querySelectorAll("#fsd-search-dialog .fsd-search-result").length > 0', 'predictive search results');
  await capture('fsd-predictive-search-desktop.jpg');

  for (const [path, ready, name] of [
    ['/universe', 'document.querySelector(\'[data-fsd-storefront][data-current-view="universe"]\')', 'fsd-universe-campaign-desktop.jpg'],
    ['/bio-lab', 'document.querySelector(\'[data-fsd-storefront][data-current-view="page"][data-active-target="innovation-hub"]\')', 'fsd-bio-lab-desktop.jpg'],
    ['/hardware', 'document.querySelector(\'[data-fsd-storefront][data-current-view="hardware"]\')', 'fsd-hardware-desktop.jpg'],
    ['/enquiries.html', 'document.querySelector("#private-enquiries-root h1")', 'fsd-private-access-desktop.jpg'],
  ]) {
    await navigate(path, ready, path);
    if (path === '/universe') {
      await evaluate('document.querySelector("#universe")?.scrollIntoView({ block: "start", behavior: "instant" })');
    } else if (path === '/bio-lab') {
      await evaluate('document.querySelector("#fsd-innovation-hub-title")?.scrollIntoView({ block: "start", behavior: "instant" })');
    } else if (path === '/hardware') {
      await evaluate('document.querySelector("#hardware-editorial-title")?.scrollIntoView({ block: "start", behavior: "instant" })');
    }
    await capture(name);
  }

  await navigate('/', 'document.querySelector("#fsd-house-archive summary")', 'THE HOUSE archive');
  await evaluate('document.querySelector("#fsd-house-archive").open = true');
  await evaluate('document.querySelector("#fsd-house-archive").scrollIntoView({ block: "start", behavior: "instant" })');
  await capture('fsd-the-house-desktop.jpg');

  await send('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, deviceScaleFactor: 1, mobile: true,
  });
  await navigate('/universe', 'document.querySelector(\'[data-fsd-storefront][data-current-view="universe"]\')', 'mobile Universe campaign');
  await evaluate('document.querySelector("#universe")?.scrollIntoView({ block: "start", behavior: "instant" })');
  await capture('fsd-universe-campaign-mobile-390.jpg');

  await navigate('/enquiries.html', 'document.querySelector("#private-enquiries-root h1")', 'mobile Private Access');
  await capture('fsd-private-access-mobile-390.jpg');
  assert.deepEqual(browser.errors, [], 'captured routes should not throw browser exceptions');
  console.log('Live visual evidence captured for homepage panels, SHOP, women’s collection, product detail, Quick View, predictive search, Universe, Bio-Lab, Hardware, THE HOUSE, and Private Access.');
} finally {
  await browser.close();
}
