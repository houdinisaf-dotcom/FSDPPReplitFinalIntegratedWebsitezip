import { createReadStream } from 'node:fs';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  aeroforgeDraftRecord,
  aeroforgeImageManifest,
  createAeroForgeDraftData,
} from '../src/aeroforge-campaign.js';
import { aeroforgePreviewPath, aeroforgeDataPath, aeroforgeMediaPrefix } from '../src/aeroforge-preview-path.js';

const appRoot = fileURLToPath(new URL('../', import.meta.url));
const allowedAssetRoot = resolve(appRoot, 'content/aeroforge-private/assets');
const assetsById = new Map(aeroforgeImageManifest.assets.map(asset => [asset.id, asset]));

function send(response, status, contentType, body, method = 'GET') {
  response.statusCode = status;
  if (contentType) response.setHeader('Content-Type', contentType);
  response.end(method === 'HEAD' ? undefined : body);
}

function imageType(file) {
  if (file.endsWith('.png')) return 'image/png';
  if (file.endsWith('.jpg') || file.endsWith('.jpeg')) return 'image/jpeg';
  return null;
}

function privatePage() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <meta name="robots" content="noindex, nofollow, noarchive"/>
    <meta name="theme-color" content="#0b0b0d"/>
    <title>FSD AeroForge Modest Activewear | Private Draft Proof</title>
    <meta name="description" content="Private FSD AeroForge collection and product draft review."/>
  </head>
  <body class="aeroforge-private-body">
    <div id="aeroforge-site-header"></div>
    <div id="aeroforge-preview-root"></div>
    <script type="module" src="/src/aeroforge-preview-entry.js"></script>
  </body>
</html>`;
}

export function aeroforgePrivatePreviewPlugin() {
  return {
    name: 'fsd-aeroforge-private-draft-preview',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        let pathname;
        try {
          pathname = new URL(request.url || '/', 'http://aeroforge.invalid').pathname;
        } catch {
          return next();
        }

        const normalizedPage = pathname === aeroforgePreviewPath.slice(0, -1)
          ? aeroforgePreviewPath
          : pathname;
        const isMedia = pathname.startsWith(aeroforgeMediaPrefix);
        if (normalizedPage !== aeroforgePreviewPath
          && pathname !== aeroforgeDataPath
          && !isMedia) {
          return next();
        }

        response.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
        response.setHeader('Cache-Control', 'no-store');
        response.setHeader('X-Content-Type-Options', 'nosniff');

        if (!['GET', 'HEAD'].includes(request.method)) {
          response.setHeader('Allow', 'GET, HEAD');
          return send(response, 405, 'text/plain; charset=utf-8', 'Read-only private draft preview.', request.method);
        }

        if (normalizedPage === aeroforgePreviewPath) {
          try {
            const transformed = await server.transformIndexHtml(aeroforgePreviewPath, privatePage());
            return send(response, 200, 'text/html; charset=utf-8', transformed, request.method);
          } catch (error) {
            console.error('AeroForge private preview shell could not be transformed.', error);
            return send(response, 500, 'text/plain; charset=utf-8', 'Private preview unavailable.', request.method);
          }
        }

        if (pathname === aeroforgeDataPath) {
          try {
            return send(
              response,
              200,
              'application/json; charset=utf-8',
              JSON.stringify(createAeroForgeDraftData(aeroforgeDraftRecord, aeroforgeImageManifest)),
              request.method,
            );
          } catch (error) {
            console.error('AeroForge draft data validation failed.', error);
            return send(response, 500, 'application/json; charset=utf-8', '{"error":"Private draft data unavailable."}', request.method);
          }
        }

        const assetId = decodeURIComponent(pathname.slice(aeroforgeMediaPrefix.length));
        const asset = assetsById.get(assetId);
        const type = asset && imageType(asset.file);
        if (!asset || !type || asset.file.includes('..') || asset.file.includes('/')) {
          return send(response, 404, 'text/plain; charset=utf-8', 'Unknown AeroForge source image.', request.method);
        }

        const filePath = resolve(allowedAssetRoot, asset.file);
        if (!filePath.startsWith(`${allowedAssetRoot}${sep}`)) {
          return send(response, 404, 'text/plain; charset=utf-8', 'Unknown AeroForge source image.', request.method);
        }
        if (request.method === 'HEAD') return send(response, 200, type, undefined, request.method);

        response.statusCode = 200;
        response.setHeader('Content-Type', type);
        const stream = createReadStream(filePath);
        stream.on('error', error => {
          console.error('AeroForge source image could not be read.', error);
          if (!response.headersSent) response.statusCode = 500;
          response.end('AeroForge source image unavailable.');
        });
        return stream.pipe(response);
      });
    },
  };
}
