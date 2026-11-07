import assert from 'node:assert/strict';
import { browserSession } from './browser-session.mjs';

const browser = await browserSession();
const { send, evaluate, wait } = browser;
const base = `https://${process.env.REPLIT_DEV_DOMAIN}`;

try {
  for (const width of [1440, 390]) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: width < 600,
    });

    await send('Page.navigate', { url: `${base}/?house-hub-history=${width}` });
    await wait(`location.search === '?house-hub-history=${width}' && document.querySelector('[data-runtime-ready="true"]')`);
    assert.deepEqual(await evaluate(`({
      champagne: getComputedStyle(document.documentElement).getPropertyValue('--fsd-champagne').trim().toLowerCase(),
      volt: getComputedStyle(document.documentElement).getPropertyValue('--fsd-campaign-volt').trim().toLowerCase(),
    })`), { champagne: '#d4af37', volt: '#dfff45' });
    await send('Page.navigate', { url: `${base}/the-house.html` });
    await wait(
      `location.pathname === '/' && location.hash === '#fsd-house-archive' && document.querySelector('#fsd-house-archive')?.open`,
      `${width}px direct House route opens the expanded corporate hub`,
    );
    assert.match(await evaluate(`document.querySelector('#fsd-house-archive').textContent`), /DISCOVER THE FSD HOUSE/);
    assert.ok(await evaluate(`document.querySelectorAll('#fsd-house-archive [data-house-destination]').length >= 20`));

    await evaluate('history.back()');
    await wait(
      `location.search === '?house-hub-history=${width}' && !location.hash && !document.querySelector('#fsd-house-archive')?.open`,
      `${width}px browser back returns to the previous page`,
    );
    await evaluate('history.forward()');
    await wait(
      `location.pathname === '/' && location.hash === '#fsd-house-archive' && document.querySelector('#fsd-house-archive')?.open`,
      `${width}px browser forward reopens THE HOUSE hub`,
    );
  }

  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await send('Page.navigate', { url: `${base}/?house-mobile-link=1` });
  await wait(`location.search === '?house-mobile-link=1' && document.querySelector('[data-runtime-ready="true"]')`);
  assert.equal(await evaluate(`document.querySelector('.fsd-home-secondary')?.getAttribute('href')`), '/the-house.html');
  await evaluate(`document.querySelector('.fsd-home-secondary')?.click()`);
  await wait(
    `location.pathname === '/' && location.hash === '#fsd-house-archive' && document.querySelector('#fsd-house-archive')?.open`,
    'mobile homepage House link opens the same corporate hub',
  );

  await evaluate('document.querySelector("[data-nav-mobile-toggle]")?.click()');
  await wait(`document.body.classList.contains('fsd-mobile-nav-open')`, 'mobile navigation opens');
  await evaluate('document.querySelector(".fsd-mobile-public-links [data-nav-primary=\\"house\\"]")?.click()');
  await wait(`document.querySelector('#fsd-mega-menu')?.dataset.primary === 'house'`, 'mobile THE HOUSE menu opens');
  await evaluate('document.querySelector("#fsd-mega-menu [data-nav-group=\\"0\\"]")?.click()');
  await wait(`document.querySelector('#fsd-mega-menu [data-nav-group="0"]')?.getAttribute('aria-pressed') === 'true'`);
  await evaluate('document.querySelector("#fsd-mega-menu [data-nav-item=\\"0\\"]")?.click()');
  await wait(
    `location.pathname === '/story' && document.querySelector('main h1')?.textContent.trim() === 'Founder Story'`,
    'mobile Our Story remains separate from THE HOUSE',
  );
  assert.equal(await evaluate(`location.hash`), '');
  assert.deepEqual(browser.errors, []);
  console.log('PASS THE HOUSE route at 1440px and 390px: direct route, mobile CTA, browser back/forward, mobile navigation, and separate /story destination.');
} finally {
  await browser.close();
}
