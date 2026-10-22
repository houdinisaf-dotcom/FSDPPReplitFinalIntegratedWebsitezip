import { createReadStream } from 'node:fs';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createModestFlowDraftData,
  modestFlowImageManifest,
} from '../src/modest-flow-campaign.js';
import { modestFlowMediaPrefix } from '../src/modest-flow-preview-path.js';

const appRoot = fileURLToPath(new URL('../', import.meta.url));
const allowedAssetRoot = resolve(appRoot, 'content/modest-flow-private/assets');
const assetsById = new Map(modestFlowImageManifest.assets.map(asset => [asset.id, asset]));

function send(response, status, contentType, body, method = 'GET') {
  response.statusCode = status;
  if (contentType) response.setHeader('Content-Type', contentType);
  response.end(method === 'HEAD' ? undefined : body);
}

export function modestFlowPrivatePreviewPlugin() {
  return {
    name: 'fsd-modest-flow-private-draft-preview',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        let pathname;
        try {
          pathname = new URL(request.url || '/', 'http://modest-flow.invalid').pathname;
        } catch {
          return next();
        }
        if (!pathname.startsWith(modestFlowMediaPrefix)) return next();

        response.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
        response.setHeader('Cache-Control', 'no-store');
        response.setHeader('X-Content-Type-Options', 'nosniff');
        if (!['GET', 'HEAD'].includes(request.method)) {
          response.setHeader('Allow', 'GET, HEAD');
          return send(response, 405, 'text/plain; charset=utf-8', 'Read-only private draft media.', request.method);
        }

        let assetId;
        try {
          assetId = decodeURIComponent(pathname.slice(modestFlowMediaPrefix.length));
        } catch {
          return send(response, 404, 'text/plain; charset=utf-8', 'Unknown Modest Flow image.', request.method);
        }
        const asset = assetsById.get(assetId);
        if (!asset || !/^[a-z0-9-]+\.png$/.test(asset.file)) {
          return send(response, 404, 'text/plain; charset=utf-8', 'Unknown Modest Flow image.', request.method);
        }

        const filePath = resolve(allowedAssetRoot, asset.file);
        if (!filePath.startsWith(`${allowedAssetRoot}${sep}`)) {
          return send(response, 404, 'text/plain; charset=utf-8', 'Unknown Modest Flow image.', request.method);
        }
        if (request.method === 'HEAD') return send(response, 200, 'image/png', undefined, request.method);

        response.statusCode = 200;
        response.setHeader('Content-Type', 'image/png');
        const stream = createReadStream(filePath);
        stream.on('error', error => {
          console.error('A private Modest Flow image could not be read.', error);
          if (!response.headersSent) response.statusCode = 500;
          response.end('Private Modest Flow image unavailable.');
        });
        return stream.pipe(response);
      });
    },
  };
}

// Validate the private draft when the dev server loads its route plugin.
createModestFlowDraftData();
