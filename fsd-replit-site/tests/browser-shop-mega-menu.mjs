import assert from 'node:assert/strict';
import { browserSession } from './browser-session.mjs';

const browser = await browserSession();
const { send, evaluate, wait } = browser;
const base = `https://${process.env.REPLIT_DEV_DOMAIN}`;

const moveTo = async selector => {
  const point = await evaluate(`(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  })()`);
  assert.ok(point, `Missing SHOP menu target: ${selector}`);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point });
};

try {
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false,
  });
  await send('Page.navigate', { url: `${base}/?shop-menu-flex=1` });
  await wait(`location.search === '?shop-menu-flex=1' && document.querySelector('[data-runtime-ready="true"]')`);
  await evaluate(`document.querySelector('.fsd-primary-trigger[data-nav-primary="collections"]')?.click()`);
  await moveTo('.fsd-primary-trigger[data-nav-primary="collections"]');
  await wait(`!document.querySelector('#fsd-mega-menu').hidden`);
  await moveTo('#fsd-mega-menu [data-nav-group="2"]');
  await wait(`document.querySelector('#fsd-mega-menu [data-nav-group="2"]')?.getAttribute('aria-pressed') === 'true'`);
  await wait(`document.querySelector('.fsd-feature-copy h3')?.textContent.trim() === 'AEROFORGE'`);
  assert.equal(await evaluate(`document.querySelector('.fsd-feature-media')?.dataset.featureImage`),
    '/assets/products/aeroforge-training-tee/aeroforge-white-green-lifestyle-hero.webp');
  assert.equal(await evaluate(`document.querySelector('.fsd-feature-media')?.classList.contains('fsd-feature-media--product')`), true);

  await evaluate(`document.querySelector('#fsd-mega-menu [data-nav-item="2"]')?.focus({ preventScroll: true })`);
  await wait(`document.querySelector('.fsd-feature-copy h3')?.textContent.trim() === 'FLEX'`);
  assert.equal(await evaluate(`document.querySelector('.fsd-feature-media')?.dataset.featureImage`),
    '/assets/products/flex-leggings-obsidian-front.webp');
  assert.equal(await evaluate(`document.querySelector('.fsd-feature-media')?.classList.contains('fsd-feature-media--product')`), true);
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.fsd-feature-media img')).objectFit`), 'contain');
  assert.ok(await evaluate(`document.querySelector('.fsd-feature-media img')?.naturalWidth > 0`), 'FLEX photo loads in the menu feature');
  assert.deepEqual(browser.errors, []);
  console.log('PASS SHOP mega-menu: AEROFORGE and FLEX use exact catalogue photos; keyboard focus updates the FLEX feature immediately.');
} finally {
  await browser.close();
}
