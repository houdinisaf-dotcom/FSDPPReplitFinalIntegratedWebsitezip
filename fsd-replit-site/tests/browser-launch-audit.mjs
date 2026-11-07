import assert from 'node:assert/strict';
import { browserSession } from './browser-session.mjs';
import { products } from '../src/catalogue-data.js';
import { productSeoPath } from '../src/site-seo.js';

const browser = await browserSession();
const { send, evaluate, wait } = browser;
const base = `https://${process.env.REPLIT_DEV_DOMAIN}`;
try {
  for (const [path, title] of [
    ['/collections/women', 'Women’s Collections'],
    ['/collections/men', 'Men’s Collections'],
    ['/collections/accessories', 'Training Accessories'],
    ['/collections/flex', 'FLEX Collection'],
    [productSeoPath(products.find(product => product.id === 75)), 'FLEX'],
  ]) {
    await send('Page.navigate', { url: base + path });
    await wait(`location.pathname === ${JSON.stringify(path)} && document.querySelector('[data-runtime-ready="true"]')`, path);
    await wait(`document.title.includes(${JSON.stringify(title)})`, 'route-specific metadata');
    assert.equal(await evaluate(`document.head.querySelectorAll('meta[name="description"]').length`), 1);
    assert.equal(await evaluate(`document.head.querySelectorAll('link[rel="canonical"]').length`), 0, 'no invented canonical domain');
    if (path.startsWith('/products/')) {
      await wait(`document.querySelector('#product-dialog')?.open && document.querySelector('#product-dialog [data-bag-add="75"]')`, 'real product entry opens the existing details and shopping controls');
    } else if (path.endsWith('/flex')) {
      await wait(`document.querySelector('#clothing-lines-archive').open && document.querySelector('[data-clothing-product-id="75"]')`, 'existing FLEX banner, not a duplicate');
    } else {
      const expected = path.endsWith('/women') ? 'Women’s' : path.endsWith('/men') ? 'Men’s' : 'All';
      assert.equal(await evaluate(`document.querySelector('#catalogue-audience').value`), expected);
    }
  }
  for (const width of [1440, 768, 393]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: `${base}/?audit=${width}` });
    await wait(`location.search.includes('audit=${width}') && document.querySelector('[data-runtime-ready="true"]')`);
    assert.equal(await evaluate(`document.documentElement.scrollWidth > innerWidth+1`), false, `${width}px overflow`);
    assert.equal(await evaluate(`document.querySelectorAll('img:not([alt])').length`), 0, 'all rendered images declare alt intent');
    assert.ok(await evaluate(`document.querySelector('h1')?.textContent.trim().length > 0`), 'meaningful active H1');
  }
  await evaluate(`(async () => {
    const catalogue = await import('/src/catalogue.js');
    const opener = document.querySelector('[data-bag-open]');
    catalogue.showProduct(75, {returnFocus:opener});
    document.querySelector('#product-dialog').close();
    catalogue.showProduct(69, {returnFocus:opener});
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    document.querySelector('#product-dialog #close-dialog').click();
  })()`);
  await wait(`!document.querySelector('#product-dialog').open && document.activeElement.matches('[data-bag-open]')`, 'queued old close cannot clear a newly opened product or its focus target');
  await send('Page.navigate', { url: base + '/the-house.html' });
  await wait(`location.pathname === '/' && location.hash === '#fsd-house-archive' && document.querySelector('#fsd-house-archive')?.open`, 'legacy THE HOUSE route opens the corporate hub');
  assert.match(await evaluate(`document.querySelector('#fsd-house-archive').textContent`), /THE HOUSE/);
  assert.ok(await evaluate(`document.querySelector('meta[name="description"]').content.length > 15`));
  await send('Page.navigate', { url: base + '/investor.html' });
  await wait(`location.pathname === '/investor.html' && document.querySelector('meta[property="og:title"]')`);
  assert.ok(await evaluate(`document.querySelector('meta[name="description"]').content.length > 15`));
  assert.deepEqual(browser.errors, []);
  console.log('PASS browser launch audit: real collection/product entry paths, unique metadata, existing filters and gallery handoff, standalone SEO, H1/alt intent and 1440/768/393px overflow.');
} finally { await browser.close(); }
