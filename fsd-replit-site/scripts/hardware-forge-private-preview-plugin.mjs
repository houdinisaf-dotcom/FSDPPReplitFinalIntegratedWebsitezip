import { createReadStream, statSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = fileURLToPath(new URL('../', import.meta.url));
const assetRoot = resolve(appRoot, '../attached_assets');
const mediaPrefix = '/__hardware-forge-preview/media/';
const assets = new Map([
  ['obsidian-gold', { file: 'fsd_obsidian_gold_dumbbells_1792747503293.png', type: 'image/png' }],
  ['precision-collars', { file: 'precision_barbell_collar_1_1792747503292.png', type: 'image/png' }],
]);

function reply(response, status, body, method) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'text/plain; charset=utf-8');
  response.end(method === 'HEAD' ? undefined : body);
}

export function hardwareForgePrivatePreviewPlugin() {
  return {
    name: 'fsd-hardware-forge-private-preview',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        let pathname;
        try { pathname = new URL(request.url || '/', 'http://forge.invalid').pathname; }
        catch { return next(); }
        if (!pathname.startsWith(mediaPrefix)) return next();
        response.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
        response.setHeader('Cache-Control', 'no-store');
        response.setHeader('X-Content-Type-Options', 'nosniff');
        const method = request.method || 'GET';
        if (!['GET', 'HEAD'].includes(method)) {
          response.setHeader('Allow', 'GET, HEAD');
          return reply(response, 405, 'Read-only concept media.', method);
        }
        let key;
        try { key = decodeURIComponent(pathname.slice(mediaPrefix.length)); }
        catch { return reply(response, 404, 'Unknown concept image.', method); }
        const asset = assets.get(key);
        if (!asset) return reply(response, 404, 'Unknown concept image.', method);
        const filePath = resolve(assetRoot, asset.file);
        if (!filePath.startsWith(`${assetRoot}${sep}`)) return reply(response, 404, 'Unknown concept image.', method);
        try {
          const size = statSync(filePath).size;
          response.statusCode = 200;
          response.setHeader('Content-Type', asset.type);
          response.setHeader('Content-Length', String(size));
          if (method === 'HEAD') return response.end();
          return createReadStream(filePath).on('error', () => {
            if (!response.headersSent) response.statusCode = 500;
            response.end('Concept image unavailable.');
          }).pipe(response);
        } catch {
          return reply(response, 404, 'Unknown concept image.', method);
        }
      });
    },
  };
}
