import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { productStructuredData } from '../src/product-structured-data.js';
import { storefrontSeoRoutes, seoEntryForPath, structuredDataMarkup, applySeoToHtml } from '../src/site-seo.js';
import { validateProofData } from '../src/proof-data-validation.js';

test('published product schema uses real records and never invents stock, ratings, address or reviews', () => {
  const entry = storefrontSeoRoutes.find(e => e.product?.id === 75);
  const schema = productStructuredData(entry.product);
  assert.equal(schema.name, entry.product.name);
  assert.equal(schema.additionalProperty[0].value, '65.00');
  assert.equal(schema.offers, undefined);
  for (const key of ['aggregateRating', 'review', 'address', 'gtin', 'url']) assert.equal(schema[key], undefined);
  assert.ok(schema.hasVariant.length > 0);
  const priced = productStructuredData({ ...entry.product, availability: 'instock' });
  assert.equal(priced.offers.price, '65.00');
  assert.equal(priced.offers.availability, 'https://schema.org/InStock');
  const pending = productStructuredData({ id: 9999, name: 'A named record', sku: '[TO CONFIRM]',
    colourways: '[TO CONFIRM]', sizes: 'XS / S' }, { images: [] });
  assert.equal(pending.color, undefined);
  assert.equal(pending.sku, undefined);
  assert.deepEqual(pending.size, ['XS', 'S']);
});
test('collection list schema matches real catalogue membership; breadcrumb URLs wait for verified origin', () => {
  const entry = seoEntryForPath('/collections/flex');
  const json = markup => JSON.parse(markup.replace(/^.*?>/, '').replace(/<\/script>$/, ''));
  const initial = json(structuredDataMarkup(entry));
  assert.equal(initial['@graph'][0].mainEntity.numberOfItems, entry.products.length);
  assert.equal(initial['@graph'].some(item => item['@type'] === 'BreadcrumbList'), false);
  const published = json(structuredDataMarkup(entry, 'https://fsd.example'));
  const breadcrumb = published['@graph'].find(item => item['@type'] === 'BreadcrumbList');
  assert.equal(breadcrumb.itemListElement[1].item, 'https://fsd.example/collections/flex');
  const html = applySeoToHtml(applySeoToHtml('<head></head>', entry), entry);
  assert.equal((html.match(/data-fsd-page-schema/g) || []).length, 1);
  assert.equal((html.match(/rel="manifest"/g) || []).length, 1);
  assert.match(applySeoToHtml('<head><meta name="robots" content="index"></head>', {
    path: '/private-access.html', title: 'Private Access', description: 'FSD',
  }), /name="robots" content="noindex, nofollow"/);
});
test('approved-raster favicon and actual icon dimensions, not redrawn shield paths', () => {
  const svg = readFileSync('public/favicon.svg', 'utf8');
  assert.ok(svg.includes('data:image/png;base64,'));
  assert.ok(!svg.includes('<path'));
  for (const size of [16, 32, 48, 180, 192, 512]) {
    const bytes = readFileSync(`public/brand/favicon-${size}.png`);
    assert.equal(bytes.readUInt32BE(16), size);
    assert.equal(bytes.readUInt32BE(20), size);
  }
  assert.ok(existsSync('public/brand/fsd-social-preview.jpg'));
  assert.equal(JSON.parse(readFileSync('public/site.webmanifest', 'utf8')).display, 'browser');
});
test('private proof data rejects malicious URL protocols and raw numeric HTML injection', () => {
  const value = { links: { flex: '/__catalogue-preview/flex/' }, excludedOrUnassignedCount: '2',
    references: [{ src: '/approved.png', index: '1', width: 683, height: 1024 }] };
  assert.equal(validateProofData(value).excludedOrUnassignedCount, 2);
  for (const url of ['javascript:alert(1)', '//evil.example/x', '/\\evil.example/x']) {
    assert.throws(() => validateProofData({ ...value, links: { flex: url } }));
  }
  assert.throws(() => validateProofData({ ...value, excludedOrUnassignedCount: '<img onerror=alert(1)>' }));
  assert.throws(() => validateProofData({ ...value, references: [{ ...value.references[0], width: '1" onload="alert(1)' }] }));
  assert.equal(value.excludedOrUnassignedCount, '2', 'validation does not mutate source records');
});
