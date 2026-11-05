import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { products } from '../src/catalogue-data.js';
import { applySeoToHtml, storefrontSeoRoutes, seoEntryForPath, productSeoPath, validatedProductionOrigin, seoForView } from '../src/site-seo.js';
import { sitemapXml } from '../scripts/site-seo-plugin.mjs';
import { routeFromLocation } from '../src/react-router.js';

test('SEO routes refer to existing products and seven established lines without duplicate records', () => {
  assert.equal(storefrontSeoRoutes.filter(entry => entry.product).length, products.length);
  assert.equal(new Set(storefrontSeoRoutes.map(entry => entry.path)).size, storefrontSeoRoutes.length);
  for (const product of products) {
    const entry = seoEntryForPath(productSeoPath(product));
    assert.equal(entry.product, product);
    assert.deepEqual(routeFromLocation({ pathname: entry.path }), { view: 'product', target: String(product.id) });
    assert.ok(entry.description.length > 10);
  }
  assert.equal(storefrontSeoRoutes.filter(entry => entry.hash?.startsWith('#line-')).length, 7);
  assert.ok(seoEntryForPath('/collections/women').filter.audience);
  assert.ok(seoEntryForPath('/collections/men').filter.audience);
  assert.equal(seoForView({ view: 'product', target: '75' }).product.id, 75);
  assert.equal(seoEntryForPath('/products/not-a-real-product'), null);
});

test('metadata replaces duplicates, escapes content and uses no fabricated domain', () => {
  const source = '<html><head><title>Old</title><meta name="description" content="Old"><meta property="og:title" content="Old"><link rel="canonical" href="https://example.com"></head><body>Keep this content</body></html>';
  const entry = { path: '/collections/flex', title: 'FLEX & FSD', description: 'A "quoted" description <safe>.' };
  const html = applySeoToHtml(source, entry, null);
  assert.equal((html.match(/<title>/g) || []).length, 1);
  assert.equal((html.match(/name="description"/g) || []).length, 1);
  assert.match(html, /FLEX &amp; FSD/);
  assert.match(html, /&quot;quoted&quot;/);
  assert.match(html, /og:image/);
  assert.match(html, /twitter:card/);
  assert.match(html, /favicon.svg/);
  for (const icon of ['favicon-16.png', 'favicon-32.png', 'favicon-48.png', 'favicon-64.png', 'apple-touch-icon.png', 'site.webmanifest']) {
    assert.match(html, new RegExp(icon.replace('.', '\\.')));
  }
  assert.match(html, /Keep this content/);
  assert.doesNotMatch(html, /example.com|rel="canonical"|property="og:url"/);
  const deployed = applySeoToHtml(source, entry, 'https://fsd.example');
  assert.match(deployed, /rel="canonical" href="https:\/\/fsd.example\/collections\/flex"/);
  assert.match(deployed, /content="https:\/\/fsd.example\/brand\/fsd-social-preview.jpg"/);
});

test('production origins reject development hosts and sitemap only contains real public routes', () => {
  for (const origin of ['http://fsd.example', 'https://preview.replit.dev', 'https://example.com', 'https://fsd.example/path', 'https://a:b@fsd.example']) {
    assert.throws(() => validatedProductionOrigin(origin));
  }
  assert.equal(sitemapXml(storefrontSeoRoutes, null), null);
  const xml = sitemapXml([...storefrontSeoRoutes, { path: '/admin' }, { path: '/private.html' }, { path: '/cart' }, { path: '/checkout' }], 'https://fsd.example');
  assert.match(xml, /<urlset/);
  assert.match(xml, /\/collections\/flex<\/loc>/);
  assert.doesNotMatch(xml, /\/admin|\/private|\/cart|\/checkout|replit.dev/);
});

test('public 404 uses the FSD shield, exact recovery message and gold Home button without indexing', async () => {
  const html = await readFile(new URL('../public/404.html', import.meta.url), 'utf8');
  assert.equal((html.match(/<h1>/g) || []).length, 1);
  assert.match(html, /name="robots" content="noindex,follow"/);
  assert.match(html, /src="\/favicon\.svg"/);
  assert.match(html, /This destination is currently unavailable\./);
  assert.match(html, /class="fsd-404-home-button" href="\/">Home<\/a>/);
  assert.match(html, /background:#d4af37/);
  assert.doesNotMatch(html, /href="\/#clothing-lines"/);
  assert.match(html, /policy-pages.css/);
});
