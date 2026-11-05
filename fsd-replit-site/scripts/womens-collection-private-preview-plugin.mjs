import { createReadStream, statSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import imageManifest from '../content/fsd-womens-collection-private/image-manifest.json' with { type: 'json' };
import {
  createWomensCollectionAudit,
  createWomensCollectionPreview,
  womensCollectionMediaPrefix,
  womensCollectionPreviewPath,
} from '../src/womens-collection-campaign.js';

const appRoot = fileURLToPath(new URL('../', import.meta.url));
const mediaRoot = resolve(appRoot, 'content/fsd-womens-collection-private/assets');
const duplicateRoot = resolve(appRoot, 'content/modest-flow-private/assets');
const dataPrefix = `${womensCollectionPreviewPath}data/`;
const assetsById = new Map(imageManifest.assets.map(asset => [asset.id, asset]));
const productPages = new Set(['flex', 'zip-neck', 'breeze', 'references']);

function send(response, status, contentType, body, method = 'GET') {
  response.statusCode = status;
  if (contentType) response.setHeader('Content-Type', contentType);
  response.end(method === 'HEAD' ? undefined : body);
}

function assetPath(asset) {
  if (!asset || !/^womens-\d{2}$/.test(asset.id)) return null;
  const filePath = resolve(appRoot, asset.file);
  const allowed = asset.duplicateOf
    ? filePath.startsWith(`${duplicateRoot}${sep}`)
    : filePath.startsWith(`${mediaRoot}${sep}`);
  return allowed ? filePath : null;
}

function validatePrivateAssets() {
  if (imageManifest.originalTiffCount !== 53 || assetsById.size !== 53) {
    throw new Error('The FSD women’s source image manifest is incomplete.');
  }
  for (const asset of assetsById.values()) {
    const filePath = assetPath(asset);
    if (!filePath) throw new Error(`Unsafe FSD women’s preview asset path: ${asset.file}`);
    if (!statSync(filePath).isFile()) throw new Error(`Missing FSD women’s preview asset: ${asset.id}`);
    if (asset.duplicateOf && !/modest-flow-(?:onyx-black|deep-olive|warm-taupe|slate-grey|midnight-navy|deep-burgundy)$/.test(asset.duplicateOf)) {
      throw new Error(`Unexpected duplicate mapping for ${asset.id}.`);
    }
  }
  for (const page of ['flex', 'zip-neck', 'breeze']) {
    const preview = createWomensCollectionPreview(page);
    if (!preview || preview.checkoutEnabled !== false || preview.paymentsEnabled !== false
      || preview.publicListingEnabled !== false || preview.publicationAuthorized !== false) {
      throw new Error(`The FSD women’s ${page} proof must remain private and non-purchasable.`);
    }
  }
  const audit = createWomensCollectionAudit();
  if (audit.references.length !== 26 || audit.excludedOrUnassignedCount !== 26) {
    throw new Error('The FSD women’s image audit must account for all excluded source images.');
  }
}

export function womensCollectionPrivatePreviewPlugin() {
  return {
    name: 'fsd-womens-collection-private-review',
    apply: 'serve',
    configureServer(server) {
      validatePrivateAssets();
      server.middlewares.use(async (request, response, next) => {
        let pathname;
        try {
          pathname = new URL(request.url || '/', 'http://womens-preview.invalid').pathname;
        } catch {
          return next();
        }
        const normalizedPath = pathname === womensCollectionPreviewPath.slice(0, -1)
          ? womensCollectionPreviewPath
          : pathname.endsWith('/') ? pathname : `${pathname}/`;
        const isPage = normalizedPath.startsWith(womensCollectionPreviewPath)
          && productPages.has(normalizedPath.slice(womensCollectionPreviewPath.length).replace(/\/$/, ''));
        const isData = pathname.startsWith(dataPrefix);
        const isMedia = pathname.startsWith(womensCollectionMediaPrefix);
        const isBase = pathname === womensCollectionPreviewPath.slice(0, -1);
        if (!isPage && !isData && !isMedia && !isBase) return next();

        response.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
        response.setHeader('Cache-Control', 'no-store');
        response.setHeader('X-Content-Type-Options', 'nosniff');
        if (!['GET', 'HEAD'].includes(request.method)) {
          response.setHeader('Allow', 'GET, HEAD');
          return send(response, 405, 'text/plain; charset=utf-8', 'Read-only private image review.', request.method);
        }

        try {
          if (isBase) {
            response.setHeader('Location', `${womensCollectionPreviewPath}references/`);
            return send(response, 302, 'text/plain; charset=utf-8', 'Redirecting to the private image audit.', request.method);
          }

          if (isPage) {
            const html = await readFile(resolve(appRoot, 'src/womens-collection-preview.html'), 'utf8');
            const transformed = await server.transformIndexHtml(normalizedPath, html);
            return send(response, 200, 'text/html; charset=utf-8', transformed, request.method);
          }

          if (isData) {
            const dataName = pathname.slice(dataPrefix.length);
            const match = /^(flex|zip-neck|breeze|references)\.json$/.exec(dataName);
            if (!match) return send(response, 404, 'text/plain; charset=utf-8', 'Unknown private review data.', request.method);
            const payload = match[1] === 'references'
              ? createWomensCollectionAudit()
              : createWomensCollectionPreview(match[1]);
            if (!payload) return send(response, 404, 'text/plain; charset=utf-8', 'Unknown private product proof.', request.method);
            return send(response, 200, 'application/json; charset=utf-8', JSON.stringify(payload), request.method);
          }

          let assetId;
          try {
            assetId = decodeURIComponent(pathname.slice(womensCollectionMediaPrefix.length));
          } catch {
            return send(response, 404, 'text/plain; charset=utf-8', 'Unknown private image.', request.method);
          }
          const asset = assetsById.get(assetId);
          const filePath = assetPath(asset);
          if (!asset || !filePath) return send(response, 404, 'text/plain; charset=utf-8', 'Unknown private image.', request.method);
          if (request.method === 'HEAD') {
            response.setHeader('Content-Length', String(statSync(filePath).size));
            return send(response, 200, asset.contentType, undefined, request.method);
          }
          response.statusCode = 200;
          response.setHeader('Content-Type', asset.contentType);
          const stream = createReadStream(filePath);
          stream.on('error', error => {
            console.error('A private FSD women’s review image could not be read.', error);
            if (!response.headersSent) response.statusCode = 500;
            response.end('Private review image unavailable.');
          });
          return stream.pipe(response);
        } catch (error) {
          console.error('The FSD women’s private review route failed.', error);
          return send(response, 500, 'text/plain; charset=utf-8', 'The private review could not be loaded.', request.method);
        }
      });
    },
  };
}

export const validateWomensCollectionPrivateAssets = validatePrivateAssets;
