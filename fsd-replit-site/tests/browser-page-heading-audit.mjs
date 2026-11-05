import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { storefrontSeoRoutes } from '../src/site-seo.js';
import { browserSession } from './browser-session.mjs';

const domain = process.env.REPLIT_DEV_DOMAIN;
if (!domain) throw new Error('REPLIT_DEV_DOMAIN must be set for browser verification.');

const manifest = JSON.parse(await readFile('dist/seo-route-manifest.json', 'utf8'));
const descriptors = [
  ...storefrontSeoRoutes.map(entry => ({ path: entry.path, entry })),
  { path: '/enquiries.html' },
  { path: '/size-guide.html' },
];
const staticPages = manifest.routes.filter(({ path }) => path.endsWith('.html')
  && !storefrontSeoRoutes.some(entry => entry.path === path));

function headingReadyCondition({ path, entry }) {
  if (entry?.product) {
    return 'document.querySelector("#product-dialog")?.open && document.querySelector("#product-title")?.tagName === "H1"';
  }
  if (entry?.route?.view === 'collection') {
    return entry.route.target.startsWith('line-')
      ? 'document.querySelector(".fsd-clothing-line__copy h1")?.getClientRects().length > 0'
      : 'document.querySelector("#products .section-heading h1")?.getClientRects().length > 0';
  }
  if (path === '/hardware') return 'document.querySelector("#hardware-editorial-title")?.tagName === "H1"';
  if (path === '/universe') return 'document.querySelector("#fsd-showcase-title")?.tagName === "H1"';
  if (path === '/bio-lab') {
    return 'location.hash === "#innovation-hub" && document.querySelector("#fsd-innovation-hub-title")?.tagName === "H1"';
  }
  return 'document.querySelector("h1")?.getClientRects().length > 0';
}

function expectedHeading({ path, entry }) {
  if (entry?.product) return entry.product.name;
  return {
    '/': 'Made to Move, Made to Belong.',
    '/story': 'Founder Story',
    '/hardware': 'ENGINEERED FOR THE DEMANDS OF PERFORMANCE.',
    '/universe': 'Choose your direction.',
    '/bio-lab': 'INNOVATION HUB',
    '/collections/men': 'SHOP / MEN’S.',
    '/collections/women': 'SHOP / WOMEN’S.',
  }[path] || null;
}

const browserErrors = [];
const batchSize = 6;

for (let offset = 0; offset < descriptors.length; offset += batchSize) {
  const batch = descriptors.slice(offset, offset + batchSize);
  const browser = await browserSession();
  try {
    await browser.send('Page.enable');
    await browser.send('Runtime.enable');

    for (const descriptor of batch) {
      await browser.send('Page.navigate', { url: `https://${domain}${descriptor.path}` });
      await browser.wait('document.readyState === "complete"', `${descriptor.path} document load`);
      await browser.wait(headingReadyCondition(descriptor), `${descriptor.path} primary H1`);
      if (descriptor.entry?.route?.view === 'collection' && descriptor.entry.products?.length > 0) {
        const cardsReady = descriptor.entry.route.target.startsWith('line-')
          ? `document.querySelectorAll("#line-products-${descriptor.entry.route.target.slice(5)} .fsd-clothing-product").length > 0`
          : 'document.querySelectorAll("#catalogue-grid .product-card--visual").length > 0';
        await browser.wait(cardsReady, `${descriptor.path} product cards`);
      }

      const audit = JSON.parse(await browser.evaluate(`JSON.stringify((() => {
        const headings = [...document.querySelectorAll('h1')];
        const images = [...document.images];
        return {
          headings: headings.map(element => ({
            text: element.innerText.replace(/\\s+/g, ' ').trim(),
            visible: element.getClientRects().length > 0,
          })),
          missingAlt: images.filter(image => !image.hasAttribute('alt')).map(image => image.currentSrc || image.src),
          genericAlt: images.filter(image => /^(image|photo|picture|product image|placeholder|img)$/i.test(image.alt.trim()))
            .map(image => image.currentSrc || image.src),
          unlabeledProductPhotos: [...document.querySelectorAll('#catalogue-grid .catalogue-card__media img')]
            .filter(image => !image.alt.trim()).map(image => image.currentSrc || image.src),
          nonLazyCards: [...document.querySelectorAll('#catalogue-grid .catalogue-card__media img, .fsd-clothing-products img')]
            .filter(image => image.loading !== 'lazy')
            .map(image => image.currentSrc || image.src),
        };
      })())`));

      assert.equal(audit.headings.length, 1, `${descriptor.path} should contain exactly one H1: ${JSON.stringify(audit.headings)}`);
      assert.equal(audit.headings[0].visible, true, `${descriptor.path} H1 should be visible`);
      assert.ok(audit.headings[0].text, `${descriptor.path} H1 should have meaningful text`);
      const expected = expectedHeading(descriptor);
      if (expected) {
        assert.equal(audit.headings[0].text, expected, `${descriptor.path} should use its page-specific H1`);
      } else if (descriptor.entry?.route?.view === 'collection' && descriptor.entry.route.target.startsWith('line-')) {
        assert.notEqual(audit.headings[0].text, 'Made to Move, Made to Belong.', `${descriptor.path} should name its collection`);
      }
      assert.deepEqual(audit.missingAlt, [], `${descriptor.path} images must have alt attributes`);
      assert.deepEqual(audit.genericAlt, [], `${descriptor.path} images must not use generic alt text`);
      assert.deepEqual(audit.unlabeledProductPhotos, [], `${descriptor.path} product card photos should be descriptive`);
      assert.deepEqual(audit.nonLazyCards, [], `${descriptor.path} product-card images should be lazy loaded`);
    }
    browserErrors.push(...browser.errors);
  } finally {
    await browser.close();
  }
}

assert.equal(browserErrors.length, 0, `Unexpected browser runtime exceptions: ${browserErrors.join('\n')}`);
for (const { path } of staticPages) {
  const html = await readFile(`dist${path}`, 'utf8');
  const headings = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
  const headingText = headings[0]?.[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const imageTags = [...html.matchAll(/<img\b[^>]*>/gi)].map(match => match[0]);
  const missingAlt = imageTags.filter(image => !/\balt\s*=\s*(['"])[\s\S]*?\1/i.test(image));
  const genericAlt = imageTags.filter(image => {
    const alt = image.match(/\balt\s*=\s*(['"])([\s\S]*?)\1/i)?.[2]?.trim() || '';
    return /^(image|photo|picture|product image|placeholder|img)$/i.test(alt);
  });
  assert.equal(headings.length, 1, `${path} should contain exactly one H1`);
  assert.ok(headingText && headingText.length >= 3, `${path} should have a meaningful H1`);
  assert.deepEqual(missingAlt, [], `${path} images must have alt attributes`);
  assert.deepEqual(genericAlt, [], `${path} images must not use generic alt text`);
}

console.log(`PASS route-heading and image audit: ${descriptors.length} browser-rendered routes/pages, ${staticPages.length} built static pages`);
