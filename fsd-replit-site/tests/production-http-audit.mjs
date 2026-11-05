import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { readFile, readdir } from 'node:fs/promises';
import { once } from 'node:events';
import { pause } from './browser-session.mjs';

const probe = createServer();
await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
const port = probe.address().port;
await new Promise(resolve => probe.close(resolve));
const server = spawn(process.execPath, ['server.js'], {
  cwd: process.cwd(), env: { ...process.env, PORT: String(port) }, stdio: 'ignore',
});
const base = `http://127.0.0.1:${port}`;
try {
  for (let attempt = 0; attempt < 80; attempt++) {
    try { if ((await fetch(base)).status === 200) break; }
    catch { /* Wait for the production-build test server. */ }
    if (attempt === 79) throw new Error('Production-build test server failed to start.');
    await pause(100);
  }
  const manifest = JSON.parse(await readFile('dist/seo-route-manifest.json', 'utf8'));
  const titles = [];
  const descriptions = [];
  const sharingImages = new Set();
  for (const route of manifest.routes) {
    const response = await fetch(base + route.path);
    assert.equal(response.status, 200, route.path);
    assert.match(response.headers.get('content-security-policy'), /base-uri 'self'; object-src 'none'/);
    const html = await response.text();
    assert.equal((html.match(/<title>/g) || []).length, 1, route.path);
    assert.equal((html.match(/<meta name="description"/g) || []).length, 1, route.path);
    assert.match(html, /property="og:image"/, route.path);
    assert.match(html, /name="twitter:card"/, route.path);
    assert.match(html, /favicon.svg/, route.path);
    assert.doesNotMatch(html, /replit\.dev|https:\/\/example\.com/, route.path);
    titles.push(html.match(/<title>([\s\S]*?)<\/title>/)[1]);
    descriptions.push(html.match(/<meta name="description" content="([^"]+)"/)[1]);
    if (/^\/(?:products|collections)\//.test(route.path)) {
      const graph = JSON.parse(html.match(/<script[^>]*data-fsd-page-schema[^>]*>([\s\S]*?)<\/script>/)[1]);
      assert.ok(graph['@graph'].length > 0, `server-delivered structured data: ${route.path}`);
    }
    sharingImages.add(html.match(/property="og:image" content="([^"]+)"/)[1].replace(/&amp;/g, '&'));
    if (!manifest.productionOrigin) assert.doesNotMatch(html, /rel="canonical"/, route.path);
  }
  assert.equal(new Set(titles).size, titles.length, 'every public route has a unique title');
  assert.equal(new Set(descriptions).size, descriptions.length, 'every public route has a unique meta description');
  for (const image of sharingImages) {
    assert.equal((await fetch(new URL(image, base), { method: 'HEAD' })).status, 200, `sharing image: ${image}`);
  }
  for (const icon of [
    '/favicon.svg',
    '/brand/favicon-16.png',
    '/brand/favicon-32.png',
    '/brand/favicon-48.png',
    '/brand/favicon-64.png',
    '/brand/apple-touch-icon.png',
    '/brand/favicon-192.png',
    '/brand/favicon-512.png',
  ]) {
    assert.equal((await fetch(base + icon, { method: 'HEAD' })).status, 200, icon);
  }
  for (const path of ['/enquiries.html', '/size-guide.html']) {
    const html = await (await fetch(base + path)).text();
    for (const icon of ['favicon-16.png', 'favicon-32.png', 'favicon-48.png', 'favicon-64.png', 'apple-touch-icon.png', 'site.webmanifest']) {
      assert.match(html, new RegExp(icon.replace('.', '\\.'), 'i'), `${path} should include ${icon}`);
    }
  }
  assert.match((await fetch(base + '/site.webmanifest')).headers.get('content-type'), /application\/manifest\+json/);
  assert.equal((await fetch(base + '/__catalogue-preview/fsd-womens-collection/flex/')).status, 404);
  for (const path of ['/.env', '/.git/config', '/server.js']) assert.equal((await fetch(base + path)).status, 404);
  for (const path of ['/no-such-fsd-page', '/no-such-fsd-page.html', '/products/unknown-product']) {
    const response = await fetch(base + path);
    assert.equal(response.status, 404);
    const html = await response.text();
    assert.match(html, /Page not found/);
    assert.match(html, /This destination is currently unavailable\./);
    assert.match(html, /class="fsd-404-home-button" href="\/">Home<\/a>/);
    assert.equal((await fetch(base + path, { method: 'HEAD' })).status, 404);
  }
  const files = await readdir('dist/assets');
  assert.equal(files.some(file => file.endsWith('.map')), false);
  assert.equal((await fetch(base + '/assets/unavailable.js.map')).status, 404);
  const script = files.find(file => file.startsWith('react-vendor-') && file.endsWith('.js'));
  const asset = await fetch(base + '/assets/' + script, { method: 'HEAD' });
  assert.match(asset.headers.get('cache-control'), /immutable/);
  assert.equal(asset.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(asset.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
  assert.equal((await fetch(base + '/', { method: 'POST' })).status, 405);
  assert.equal((await fetch(base + '/api/not-a-real-endpoint')).status, 404);
  const robots = await (await fetch(base + '/robots.txt')).text();
  assert.match(robots, /Disallow: \/admin/);
  assert.match(robots, /Disallow: \/checkout/);
  assert.doesNotMatch(robots, /replit.dev|example.com/);
  if (!manifest.productionOrigin) {
    assert.equal(manifest.sitemapReady, false);
    assert.doesNotMatch(robots, /Sitemap:/);
    assert.equal((await fetch(base + '/sitemap.xml')).status, 404);
  }
  console.log(`PASS production-build HTTP audit: ${manifest.routes.length} public routes, unique metadata, sharing tags, branded 404/HEAD, robots, source-map denial and immutable vendor assets.`);
  console.log(manifest.productionOrigin
    ? 'Canonical URLs and sitemap use the configured production origin.'
    : 'Production origin is not configured: canonicals and sitemap intentionally withheld, not fabricated.');
} finally {
  server.kill('SIGTERM');
  await Promise.race([once(server, 'exit'), pause(2500)]);
}
