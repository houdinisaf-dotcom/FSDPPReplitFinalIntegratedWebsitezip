import { createHash } from 'node:crypto';
import { createReadStream, readFileSync, statSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import imageManifest from '../content/fsd-breeze-private/image-manifest.json' with { type: 'json' };
import { createBreezeDraftData } from '../src/breeze-campaign.js';
import { breezeMediaPrefix } from '../src/breeze-preview-path.js';

const appRoot = fileURLToPath(new URL('../', import.meta.url));
const allowedAssetRoot = resolve(appRoot, 'content/fsd-breeze-private/assets');
const assetsById = new Map(imageManifest.variants.flatMap(variant =>
  variant.assets.map(asset => [asset.id, asset])));

function send(response, status, contentType, body, method = 'GET') {
  response.statusCode = status;
  if (contentType) response.setHeader('Content-Type', contentType);
  response.end(method === 'HEAD' ? undefined : body);
}

function validateAssets() {
  createBreezeDraftData();
  for (const asset of assetsById.values()) {
    const filePath = resolve(allowedAssetRoot, asset.file);
    if (!filePath.startsWith(`${allowedAssetRoot}${sep}`)) {
      throw new Error(`Unsafe FSD Breeze asset path: ${asset.file}`);
    }
    const bytes = readFileSync(filePath);
    const actualHash = createHash('sha256').update(bytes).digest('hex');
    if (actualHash !== asset.sha256) {
      throw new Error(`FSD Breeze source image hash mismatch for ${asset.id}.`);
    }
  }
}

export function breezePrivatePreviewPlugin() {
  return {
    name: 'fsd-breeze-private-draft-preview',
    apply: 'serve',
    configureServer(server) {
      validateAssets();
      server.middlewares.use((request, response, next) => {
        let pathname;
        try {
          pathname = new URL(request.url || '/', 'http://breeze.invalid').pathname;
        } catch {
          return next();
        }
        if (!pathname.startsWith(breezeMediaPrefix)) return next();

        response.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
        response.setHeader('Cache-Control', 'no-store');
        response.setHeader('X-Content-Type-Options', 'nosniff');
        if (!['GET', 'HEAD'].includes(request.method)) {
          response.setHeader('Allow', 'GET, HEAD');
          return send(response, 405, 'text/plain; charset=utf-8', 'Read-only private draft media.', request.method);
        }

        let assetId;
        try {
          assetId = decodeURIComponent(pathname.slice(breezeMediaPrefix.length));
        } catch {
          return send(response, 404, 'text/plain; charset=utf-8', 'Unknown FSD Breeze image.', request.method);
        }
        const asset = assetsById.get(assetId);
        if (!asset || /(^|\/)\.\.(\/|$)/.test(asset.file) ||
            !/^(?:onyx-black|deep-olive|warm-taupe|slate-grey|midnight-navy|deep-burgundy)\/fsd-breeze_[a-z0-9-]+_(?:front|side|back|detail)_DRAFT\.jpg$/.test(asset.file)) {
          return send(response, 404, 'text/plain; charset=utf-8', 'Unknown FSD Breeze image.', request.method);
        }

        const filePath = resolve(allowedAssetRoot, asset.file);
        if (!filePath.startsWith(`${allowedAssetRoot}${sep}`)) {
          return send(response, 404, 'text/plain; charset=utf-8', 'Unknown FSD Breeze image.', request.method);
        }
        if (request.method === 'HEAD') {
          response.setHeader('Content-Length', String(statSync(filePath).size));
          return send(response, 200, 'image/jpeg', undefined, request.method);
        }

        response.statusCode = 200;
        response.setHeader('Content-Type', 'image/jpeg');
        const stream = createReadStream(filePath);
        stream.on('error', error => {
          console.error('A private FSD Breeze image could not be read.', error);
          if (!response.headersSent) response.statusCode = 500;
          response.end('Private FSD Breeze image unavailable.');
        });
        return stream.pipe(response);
      });
    },
  };
}
