import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { browserSession } from './browser-session.mjs';

const domain = process.env.REPLIT_DEV_DOMAIN;
assert.ok(domain, 'REPLIT_DEV_DOMAIN must identify the running FSD preview.');

const viewports = [
  { width: 375, height: 812, mobile: true },
  { width: 430, height: 932, mobile: true },
  { width: 768, height: 1024, mobile: false },
  { width: 1024, height: 768, mobile: false },
  { width: 1440, height: 900, mobile: false },
  { width: 1920, height: 1080, mobile: false },
];
const captureWidths = new Set([375, 768, 1440, 1920]);
const evidenceDir = resolve(process.cwd(), '../generated-artifacts/fsd-site-evidence');
const browser = await browserSession();
const { send, evaluate, wait, key } = browser;

async function setViewport(viewport) {
  await send('Emulation.setDeviceMetricsOverride', {
    ...viewport,
    deviceScaleFactor: 1,
  });
}

async function navigate(path, ready, label) {
  await send('Page.navigate', { url: `https://${domain}${path}` });
  await wait(ready, label);
  await wait('!document.querySelector("[data-fsd-luxury-entry]")', 'page transition');
}

async function assertNoHorizontalOverflow(label) {
  const metrics = await evaluate(`(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }))()`);
  assert.ok(
    metrics.document <= metrics.viewport + 1 && metrics.body <= metrics.viewport + 1,
    `${label} overflows horizontally: ${JSON.stringify(metrics)}`,
  );
}

async function capture(name) {
  await mkdir(evidenceDir, { recursive: true });
  const result = await send('Page.captureScreenshot', {
    format: 'jpeg',
    quality: 86,
    fromSurface: true,
    captureBeyondViewport: false,
  });
  await writeFile(resolve(evidenceDir, name), Buffer.from(result.data, 'base64'));
}

try {
  for (const viewport of viewports) {
    const suffix = `${viewport.width}`;
    await setViewport(viewport);

    await navigate('/', 'document.querySelector("#fsd-home-title")', `homepage ${suffix}`);
    await assertNoHorizontalOverflow(`Homepage ${suffix}px`);
    const hero = await evaluate(`(() => {
      const title = document.querySelector('#fsd-home-title').getBoundingClientRect();
      const labels = document.querySelectorAll('[data-hero-theme]');
      return { titleLeft: title.left, titleRight: title.right, themes: labels.length };
    })()`);
    assert.ok(hero.titleLeft >= 0 && hero.titleRight <= viewport.width + 1, `Homepage title is clipped at ${suffix}px.`);
    assert.ok(hero.themes >= 4, 'All four approved hero experiences remain present.');
    if (captureWidths.has(viewport.width)) await capture(`fsd-qa-home-${suffix}.jpg`);

    await evaluate('document.querySelector("[data-search-open]")?.click()');
    await wait('document.querySelector("#fsd-search-dialog")?.open', `search ${suffix}`);
    await evaluate('document.querySelector("#fsd-search-input")?.focus()');
    await send('Input.insertText', { text: 'AeroForge' });
    await wait('document.querySelectorAll("#fsd-search-dialog .fsd-search-result").length > 0', `search results ${suffix}`);
    await assertNoHorizontalOverflow(`Search ${suffix}px`);
    if (captureWidths.has(viewport.width)) await capture(`fsd-qa-search-${suffix}.jpg`);
    await evaluate('document.querySelector("#fsd-search-dialog .fsd-search-close")?.click()');
    await wait('!document.querySelector("#fsd-search-dialog")?.open', 'search closed');

    await evaluate('document.querySelector("[data-bag-open]")?.click()');
    await wait('document.querySelector("#fsd-bag-dialog")?.open', `bag drawer ${suffix}`);
    await assertNoHorizontalOverflow(`Bag drawer ${suffix}px`);
    if (captureWidths.has(viewport.width)) await capture(`fsd-qa-bag-${suffix}.jpg`);
    await evaluate('document.querySelector("#fsd-bag-dialog [data-bag-close]")?.click()');
    await wait('!document.querySelector("#fsd-bag-dialog")?.open', 'bag drawer closed');

    await navigate('/collections/women', 'document.querySelector("#catalogue-grid .product-card")', `SHOP ${suffix}`);
    await assertNoHorizontalOverflow(`SHOP ${suffix}px`);
    const grid = await evaluate(`(() => {
      const root = document.querySelector('#catalogue-grid');
      return {
        columns: getComputedStyle(root).gridTemplateColumns.split(' ').length,
        cards: root.querySelectorAll('.product-card').length,
        right: root.getBoundingClientRect().right,
      };
    })()`);
    assert.ok(grid.cards > 0 && grid.right <= viewport.width + 1, `SHOP grid is clipped at ${suffix}px.`);
    if (viewport.width <= 430) assert.equal(grid.columns, 2, `SHOP should retain two usable columns at ${suffix}px.`);
    if (viewport.width >= 1024) assert.ok(grid.columns >= 3, `SHOP should have at least three columns at ${suffix}px.`);
    if (viewport.width >= 1440) assert.ok(grid.columns >= 4, `SHOP should have four columns at ${suffix}px.`);
    if (captureWidths.has(viewport.width)) await capture(`fsd-qa-shop-${suffix}.jpg`);

    await evaluate('document.querySelector("#catalogue-grid [data-product-quick-view]")?.click()');
    await wait('document.querySelector("#product-dialog")?.open && document.querySelector("#product-dialog").dataset.presentation === "quick-view"', `Quick View ${suffix}`);
    await assertNoHorizontalOverflow(`Quick View ${suffix}px`);
    const quickViewBounds = await evaluate(`(() => {
      const rect = document.querySelector('#product-dialog').getBoundingClientRect();
      return { left: rect.left, right: rect.right };
    })()`);
    assert.ok(quickViewBounds.left >= -1 && quickViewBounds.right <= viewport.width + 1, `Quick View is clipped at ${suffix}px.`);
    if (captureWidths.has(viewport.width)) await capture(`fsd-qa-quick-view-${suffix}.jpg`);
    await key('Escape');
    await wait('!document.querySelector("#product-dialog")?.open', 'Quick View closed');

    await navigate('/?product=18', 'document.querySelector("#product-dialog")?.open && document.querySelector("#product-dialog [data-catalogue-main-image]")?.naturalWidth > 0', `product detail ${suffix}`);
    await assertNoHorizontalOverflow(`Product detail ${suffix}px`);
    const gallery = await evaluate(`(() => {
      const dialog = document.querySelector('#product-dialog');
      const main = dialog.querySelector('.product-detail-image-stage').getBoundingClientRect();
      const back = dialog.querySelector('.product-detail-gallery__secondary-stage').getBoundingClientRect();
      const purchase = dialog.querySelector('.product-detail-purchase').getBoundingClientRect();
      return {
        mainLeft: main.left,
        mainRight: main.right,
        backRight: back.right,
        purchaseRight: purchase.right,
        visibleImages: [...dialog.querySelectorAll('[data-catalogue-main-image], [data-catalogue-secondary-image]')]
          .filter(image => !image.hidden && image.naturalWidth > 0).length,
      };
    })()`);
    assert.equal(gallery.visibleImages, 2, `Product front/back images are unavailable at ${suffix}px.`);
    assert.ok(gallery.mainLeft >= -1 && gallery.purchaseRight <= viewport.width + 1, `Product panel is clipped at ${suffix}px.`);
    if (captureWidths.has(viewport.width)) await capture(`fsd-qa-product-${suffix}.jpg`);

    for (const [path, ready, label] of [
      ['/universe', 'document.querySelector(\'[data-fsd-storefront][data-current-view="universe"]\')', 'UNIVERSE'],
      ['/bio-lab', 'document.querySelector(\'[data-fsd-storefront][data-current-view="page"][data-active-target="innovation-hub"]\')', 'BIO-LAB'],
      ['/hardware', 'document.querySelector(\'[data-fsd-storefront][data-current-view="hardware"]\')', 'HARDWARE'],
      ['/enquiries.html', 'document.querySelector("#private-enquiries-root h1")', 'PRIVATE ACCESS'],
    ]) {
      await navigate(path, ready, `${label} ${suffix}`);
      await assertNoHorizontalOverflow(`${label} ${suffix}px`);
      if (captureWidths.has(viewport.width)) {
        if (path === '/universe') {
          await evaluate('document.querySelector("#universe")?.scrollIntoView({ block: "start", behavior: "instant" })');
        } else if (path === '/bio-lab') {
          await evaluate('document.querySelector("#fsd-innovation-hub-title")?.scrollIntoView({ block: "start", behavior: "instant" })');
        } else if (path === '/hardware') {
          await evaluate('document.querySelector("#hardware-editorial-title")?.scrollIntoView({ block: "start", behavior: "instant" })');
        }
        await capture(`fsd-qa-${label.toLowerCase().replaceAll(' ', '-')}-${suffix}.jpg`);
      }
    }

    await navigate('/', 'document.querySelector("#fsd-house-archive")', `THE HOUSE ${suffix}`);
    await evaluate('document.querySelector("#fsd-house-archive").open = true');
    await assertNoHorizontalOverflow(`THE HOUSE ${suffix}px`);
    if (captureWidths.has(viewport.width)) {
      await evaluate('document.querySelector("#fsd-house-archive").scrollIntoView({ block: "start", behavior: "instant" })');
      await capture(`fsd-qa-the-house-${suffix}.jpg`);
    }
    console.log(`Responsive page sweep passed at ${suffix}px.`);
  }

  assert.deepEqual(browser.errors, [], 'Responsive page checks should not produce browser exceptions.');
  console.log('Responsive quality checks passed at 375, 430, 768, 1024, 1440 and 1920px across the homepage, search, bag drawer, SHOP, Quick View, PDP, UNIVERSE, BIO-LAB, HARDWARE, THE HOUSE and PRIVATE ACCESS.');
} finally {
  await browser.close();
}
