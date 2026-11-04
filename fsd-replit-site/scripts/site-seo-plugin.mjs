import { readFile, writeFile, readdir, mkdir, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { applySeoToHtml, storefrontSeoRoutes, seoEntryForPath, escapeSeo, plainText, validatedProductionOrigin } from '../src/site-seo.js';
import { productionOrigin } from '../site.config.js';
import { isHouseDraftBuildFile, isHouseDraftRoute } from '../src/data/house-page-readiness.js';

const excluded = /(?:^|\/)(?:404|private|admin|cart|checkout)(?:[-/.]|$)/i;
export function sitemapXml(entries, origin) {
  const verified = validatedProductionOrigin(origin);
  if (!verified) return null;
  const paths = [...new Set(entries.map(entry => entry.path).filter(path => !excluded.test(path)))];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map(path => `  <url><loc>${escapeSeo(new URL(path, verified).href)}</loc></url>`).join('\n')}\n</urlset>\n`;
}
function publicEntry(path, html) {
  const decode = value => String(value || '').replace(/&(?:amp|quot|apos|lt|gt);/g, entity => ({
    '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>',
  }[entity]));
  const title = decode(plainText(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1])) || 'FSD';
  const description = decode(html.match(/<meta\s+name=["']description["']\s+content=(["'])([\s\S]*?)\1/i)?.[2])
    || (path === '/the-house.html' ? 'Explore The House of Performance: FSD’s story, flagships, fight promotions and global vision.'
      : path === '/investor.html' ? 'FSD Investor Relations: review the published investor information, metrics and dossiers.'
        : `Explore ${title.replace(/^FSD\s*\|\s*/, '')} from FSD — Fitness & Self Defence.`);
  return { path, title, description };
}
function readableFallback(entry) {
  const records = entry.products || (entry.product ? [entry.product] : []);
  return `<noscript><main class="fsd-policy-content"><h1>${escapeSeo(entry.product?.name || entry.title)}</h1><p>${escapeSeo(entry.description)}</p>
    <ul>${records.map(product => `<li><a href="${storefrontSeoRoutes.find(item => item.product?.id === product.id).path}">${escapeSeo(product.name)}</a></li>`).join('')}</ul>
    <nav aria-label="FSD collections">${storefrontSeoRoutes.filter(item => item.path.startsWith('/collections/')).map(item => `<a href="${item.path}">${escapeSeo(item.title)}</a> `).join('')}</nav>
    <a href="/">Return to FSD Shop</a></main></noscript>`;
}
export function siteSeoPlugin(projectRoot) {
  const publicRoot = resolve(projectRoot, 'public');
  let baseHtml;
  const renderEntry = (html, entry) => applySeoToHtml(html, entry)
    .replace('<div id="app"></div>', `<div id="app">${readableFallback(entry)}</div>`);
  return {
    name: 'fsd-public-route-seo',
    enforce: 'pre',
    transformIndexHtml(html, context) {
      const entry = seoEntryForPath(context.path === '/index.html' ? '/' : context.path);
      return entry ? renderEntry(html, entry) : html;
    },
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        try {
          const path = new URL(request.url || '/', 'http://fsd.local').pathname;
          if (!['GET', 'HEAD'].includes(request.method)) return next();
          if (path.startsWith('/__') || path.startsWith('/api/')) return next();
          if (isHouseDraftRoute(path)) return next();
          const entry = seoEntryForPath(path);
          let html;
          if (path === '/enquiries.html') {
            html = await readFile(resolve(projectRoot, 'enquiries.html'), 'utf8');
            html = await server.transformIndexHtml(path, html);
          } else if (entry && path !== '/') {
            html = renderEntry(await readFile(resolve(projectRoot, 'index.html'), 'utf8'), entry);
            html = await server.transformIndexHtml(path, html);
          } else if (path.endsWith('.html') && !path.includes('..')) {
            try {
              html = await readFile(resolve(publicRoot, `.${path}`), 'utf8');
              if (!excluded.test(path)) html = applySeoToHtml(html, publicEntry(path, html));
            } catch { /* Unknown files are handled below. */ }
          } else if (path === '/robots.txt') {
            html = 'User-agent: *\nDisallow: /\n';
            response.setHeader('Content-Type', 'text/plain; charset=utf-8');
          }
          if (!html && !path.startsWith('/@') && !path.startsWith('/src/') && !path.startsWith('/node_modules/') && path !== '/') {
            try { await stat(resolve(publicRoot, `.${decodeURIComponent(path)}`)); return next(); }
            catch {
              if (!/\.[^/]+$/.test(path) || path.endsWith('.html')) {
                html = await readFile(resolve(publicRoot, '404.html'), 'utf8');
                response.statusCode = 404;
              }
            }
          }
          if (!html) return next();
          response.setHeader('X-Robots-Tag', 'noindex, nofollow');
          if (!response.hasHeader('Content-Type')) response.setHeader('Content-Type', 'text/html; charset=utf-8');
          response.end(request.method === 'HEAD' ? undefined : html);
        } catch (error) { next(error); }
      });
    },
    closeBundle: {
      order: 'post',
      sequential: true,
      async handler() {
        const output = resolve(projectRoot, 'dist');
        baseHtml = await readFile(resolve(output, 'index.html'), 'utf8');
        const publicRoutes = storefrontSeoRoutes.filter(entry => !isHouseDraftRoute(entry.path));
        const entries = [...publicRoutes];
        for (const file of (await readdir(publicRoot)).filter(file =>
          file.endsWith('.html')
          && !excluded.test(`/${file}`)
          && !isHouseDraftBuildFile(file)
          && !isHouseDraftRoute(`/${file}`))) {
          const path = `/${file}`;
          const destination = resolve(output, file);
          const html = await readFile(destination, 'utf8');
          const entry = publicEntry(path, html);
          entries.push(entry);
          await writeFile(destination, applySeoToHtml(html, entry));
        }
        for (const entry of publicRoutes.filter(item => item.path !== '/')) {
          const destination = resolve(output, `.${entry.path}`, 'index.html');
          await mkdir(dirname(destination), { recursive: true });
          await writeFile(destination, renderEntry(baseHtml.replace(/<noscript>[\s\S]*?<\/noscript>/i, ''), entry));
        }
        const xml = sitemapXml(entries, productionOrigin);
        if (xml) await writeFile(resolve(output, 'sitemap.xml'), xml);
        const robots = `User-agent: *\nDisallow: /__\nDisallow: /admin\nDisallow: /private\nDisallow: /cart\nDisallow: /checkout\n${xml ? `Sitemap: ${validatedProductionOrigin(productionOrigin)}/sitemap.xml\n` : ''}`;
        await writeFile(resolve(output, 'robots.txt'), robots);
        await writeFile(resolve(output, 'seo-route-manifest.json'), JSON.stringify({
          productionOrigin: validatedProductionOrigin(productionOrigin),
          sitemapReady: Boolean(xml), routes: entries.map(({ path, title }) => ({ path, title })),
        }, null, 2));
      },
    },
  };
}
