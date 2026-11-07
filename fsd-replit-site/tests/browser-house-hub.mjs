import assert from 'node:assert/strict';
import { browserSession } from './browser-session.mjs';

const browser = await browserSession();
const { send, evaluate, wait } = browser;
const base = `https://${process.env.REPLIT_DEV_DOMAIN}`;
const click = selector => evaluate(`(() => {
  const element = document.querySelector(${JSON.stringify(selector)});
  if (!element) throw new Error('Missing browser target: ' + ${JSON.stringify(selector)});
  element.click();
  return true;
})()`);

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
    assert.equal(await evaluate(`document.documentElement.scrollWidth <= innerWidth + 1`), true, `${width}px House hub has no horizontal overflow`);

    const history = await send('Page.getNavigationHistory');
    const hubEntry = history.entries[history.currentIndex]?.id;
    const previousEntry = history.entries[history.currentIndex - 1]?.id;
    assert.ok(hubEntry && previousEntry, `${width}px route has both hub and previous history entries`);
    await send('Page.navigateToHistoryEntry', { entryId: previousEntry });
    await wait(
      `location.search === '?house-hub-history=${width}' && !location.hash && !document.querySelector('#fsd-house-archive')?.open`,
      `${width}px browser back returns to the previous page`,
    );
    await send('Page.navigateToHistoryEntry', { entryId: hubEntry });
    await wait(
      `location.pathname === '/' && location.hash === '#fsd-house-archive' && document.querySelector('#fsd-house-archive')?.open`,
      `${width}px browser forward reopens THE HOUSE hub`,
    );

    await send('Page.navigate', { url: `${base}/genetic-microbiome.html` });
    await wait(
      `location.pathname === '/genetic-microbiome.html' && document.querySelector('main.fsd[data-fsd-division="BIO-LAB™"][data-fsd-section="Personalisation Research"]')`,
      `${width}px Genetic & Microbiome page is reachable under BIO-LAB™`,
    );
    assert.equal(await evaluate(`document.querySelectorAll('main.fsd .breadcrumbs').length`), 1);
    assert.ok(await evaluate(`document.querySelectorAll('main.fsd section h2').length >= 4`));
    assert.match(await evaluate(`document.querySelector('main.fsd .related-links')?.textContent`), /BIO-LAB™ Innovation Hub/);
    assert.equal(await evaluate(`document.documentElement.scrollWidth <= innerWidth + 1`), true, `${width}px page has no horizontal overflow`);
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
  await click('.fsd-home-secondary');
  await wait(
    `location.pathname === '/' && location.hash === '#fsd-house-archive' && document.querySelector('#fsd-house-archive')?.open`,
    'mobile homepage House link opens the same corporate hub',
  );

  await click('[data-nav-mobile-toggle]');
  await wait(`document.body.classList.contains('fsd-mobile-nav-open')`, 'mobile navigation opens');
  await click('.fsd-mobile-public-links [data-nav-primary="house"]');
  await wait(`document.querySelector('#fsd-mega-menu')?.dataset.primary === 'house'`, 'mobile THE HOUSE menu opens');
  await click('#fsd-mega-menu [data-nav-group="0"]');
  await wait(`document.querySelector('#fsd-mega-menu [data-nav-group="0"]')?.getAttribute('aria-pressed') === 'true'`);
  assert.match(await evaluate(`document.querySelector('#fsd-mega-menu [data-nav-item="0"]')?.textContent`), /Founder Story/);
  await send('Page.navigate', { url: `${base}/story` });
  await wait(
    `location.pathname === '/story' && document.querySelector('main h1')?.textContent.trim() === 'Founder Story'`,
    'Our Story remains a separate destination from THE HOUSE',
  );
  assert.equal(await evaluate(`location.hash`), '');
  assert.deepEqual(browser.errors, []);
  console.log('PASS THE HOUSE route at 1440px and 390px: direct route, mobile CTA, browser back/forward, mobile navigation, and separate /story destination.');
} finally {
  await browser.close();
}
