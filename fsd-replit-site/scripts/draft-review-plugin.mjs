import { createReadStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createWeightedRopeDraft, weightedRopeManifest } from '../src/draft-catalogue.js';
import { createHoodedShellCampaignPreview, hoodedShellPreviewRecord } from '../src/hooded-shell-campaign.js';
import {
  createVelocityHijabPreview,
} from '../src/velocity-hijab-campaign.js';
import { velocityHijabMediaPrefix, velocityHijabPreviewPath } from '../src/velocity-hijab-preview-path.js';
import { createAegisGiletPreview } from '../src/aegis-gilet-campaign.js';
import { aegisGiletMediaPrefix, aegisGiletPreviewPath } from '../src/aegis-gilet-preview-path.js';

const appRoot = fileURLToPath(new URL('../', import.meta.url));
const workspaceRoot = resolve(appRoot, '..');
const previewPath = '/__catalogue-preview/weighted-skipping-rope/';
const dataPath = `${previewPath}data.json`;
const mediaPrefix = `${previewPath}media/`;
const assets = [
  weightedRopeManifest.campaign,
  ...weightedRopeManifest.variants,
].map(asset => ({
  id: asset.assetId || asset.id,
  file: asset.file,
}));
const assetsById = new Map(assets.map(asset => [asset.id, asset]));
const allowedAssetRoot = resolve(workspaceRoot, 'attached_assets');
const shellPreviewPath = '/__catalogue-preview/hooded-running-shell/';
const shellMediaPrefix = `${shellPreviewPath}media/`;
const shellCampaign = hoodedShellPreviewRecord.campaign;
const hijabPreviewPath = velocityHijabPreviewPath;
const hijabMediaPrefix = velocityHijabMediaPrefix;
const hijabAssetsById = new Map(createVelocityHijabPreview().gallery.map(asset => [asset.id, asset]));
const aegisAssetsById = new Map(createAegisGiletPreview().gallery.map(asset => [asset.id, asset]));

function send(response, status, contentType, body, method = 'GET') {
  response.statusCode = status;
  if (contentType) response.setHeader('Content-Type', contentType);
  response.end(method === 'HEAD' ? undefined : body);
}

export function draftReviewPlugin() {
  return {
    name: 'fsd-weighted-rope-private-draft-review',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        let pathname;
        try {
          pathname = new URL(request.url || '/', 'http://draft.invalid').pathname;
        } catch {
          return next();
        }

        const normalizedPage = pathname === previewPath.slice(0, -1) ? previewPath : pathname;
        if (normalizedPage !== previewPath
          && pathname !== dataPath
          && !pathname.startsWith(mediaPrefix)) {
          return next();
        }

        response.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
        response.setHeader('Cache-Control', 'no-store');
        response.setHeader('X-Content-Type-Options', 'nosniff');

        if (!['GET', 'HEAD'].includes(request.method)) {
          response.setHeader('Allow', 'GET, HEAD');
          return send(response, 405, 'text/plain; charset=utf-8', 'Read-only draft preview.', request.method);
        }

        try {
          if (normalizedPage === previewPath) {
            const html = await readFile(resolve(appRoot, 'draft-preview.html'), 'utf8');
            const transformed = await server.transformIndexHtml(previewPath, html);
            return send(response, 200, 'text/html; charset=utf-8', transformed, request.method);
          }

          if (pathname === dataPath) {
            const payload = createWeightedRopeDraft();
            return send(response, 200, 'application/json; charset=utf-8', JSON.stringify(payload), request.method);
          }

          const assetId = pathname.slice(mediaPrefix.length);
          const entry = assetsById.get(assetId);
          if (!entry || !entry.file.startsWith('attached_assets/') || entry.file.includes('..')) {
            return send(response, 404, 'text/plain; charset=utf-8', 'Unknown draft asset.', request.method);
          }

          const filePath = resolve(workspaceRoot, entry.file);
          if (!filePath.startsWith(`${allowedAssetRoot}${sep}`)) {
            return send(response, 404, 'text/plain; charset=utf-8', 'Unknown draft asset.', request.method);
          }

          if (request.method === 'HEAD') {
            return send(response, 200, 'image/png', undefined, request.method);
          }

          response.statusCode = 200;
          response.setHeader('Content-Type', 'image/png');
          const stream = createReadStream(filePath);
          stream.on('error', () => {
            if (!response.headersSent) response.statusCode = 500;
            response.end('Draft image unavailable.');
          });
          return stream.pipe(response);
        } catch {
          return send(response, 500, 'text/plain; charset=utf-8', 'The draft preview could not be loaded.', request.method);
        }
      });

      server.middlewares.use(async (request, response, next) => {
        let pathname;
        try {
          pathname = new URL(request.url || '/', 'http://draft.invalid').pathname;
        } catch {
          return next();
        }

        const normalizedPage = pathname === shellPreviewPath.slice(0, -1) ? shellPreviewPath : pathname;
        if (normalizedPage !== shellPreviewPath && !pathname.startsWith(shellMediaPrefix)) return next();

        response.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
        response.setHeader('Cache-Control', 'no-store');
        response.setHeader('X-Content-Type-Options', 'nosniff');

        if (!['GET', 'HEAD'].includes(request.method)) {
          response.setHeader('Allow', 'GET, HEAD');
          return send(response, 405, 'text/plain; charset=utf-8', 'Read-only campaign proof.', request.method);
        }

        try {
          if (normalizedPage === shellPreviewPath) {
            createHoodedShellCampaignPreview();
            const html = await readFile(resolve(appRoot, 'hooded-shell-campaign-preview.html'), 'utf8');
            const transformed = await server.transformIndexHtml(shellPreviewPath, html);
            return send(response, 200, 'text/html; charset=utf-8', transformed, request.method);
          }

          const assetId = pathname.slice(shellMediaPrefix.length);
          if (assetId !== shellCampaign.id
            || !shellCampaign.file.startsWith('attached_assets/')
            || shellCampaign.file.includes('..')) {
            return send(response, 404, 'text/plain; charset=utf-8', 'Unknown campaign image.', request.method);
          }

          const filePath = resolve(workspaceRoot, shellCampaign.file);
          if (!filePath.startsWith(`${allowedAssetRoot}${sep}`)) {
            return send(response, 404, 'text/plain; charset=utf-8', 'Unknown campaign image.', request.method);
          }

          if (request.method === 'HEAD') return send(response, 200, 'image/png', undefined, request.method);

          response.statusCode = 200;
          response.setHeader('Content-Type', 'image/png');
          const stream = createReadStream(filePath);
          stream.on('error', () => {
            if (!response.headersSent) response.statusCode = 500;
            response.end('Campaign image unavailable.');
          });
          return stream.pipe(response);
        } catch {
          return send(response, 500, 'text/plain; charset=utf-8', 'The campaign proof could not be loaded.', request.method);
        }
      });

      server.middlewares.use(async (request, response, next) => {
        let pathname;
        try {
          pathname = new URL(request.url || '/', 'http://draft.invalid').pathname;
        } catch {
          return next();
        }

        const normalizedPage = pathname === hijabPreviewPath.slice(0, -1) ? hijabPreviewPath : pathname;
        if (normalizedPage !== hijabPreviewPath && !pathname.startsWith(hijabMediaPrefix)) return next();

        response.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
        response.setHeader('Cache-Control', 'no-store');
        response.setHeader('X-Content-Type-Options', 'nosniff');

        if (!['GET', 'HEAD'].includes(request.method)) {
          response.setHeader('Allow', 'GET, HEAD');
          return send(response, 405, 'text/plain; charset=utf-8', 'Read-only product preview.', request.method);
        }

        try {
          if (normalizedPage === hijabPreviewPath) {
            createVelocityHijabPreview();
            const html = await readFile(resolve(appRoot, 'velocity-hijab-preview.html'), 'utf8');
            const transformed = await server.transformIndexHtml(hijabPreviewPath, html);
            return send(response, 200, 'text/html; charset=utf-8', transformed, request.method);
          }

          const assetId = pathname.slice(hijabMediaPrefix.length);
          const entry = hijabAssetsById.get(assetId);
          if (!entry || !entry.file.startsWith('attached_assets/') || entry.file.includes('..')) {
            return send(response, 404, 'text/plain; charset=utf-8', 'Unknown product image.', request.method);
          }

          const filePath = resolve(workspaceRoot, entry.file);
          if (!filePath.startsWith(`${allowedAssetRoot}${sep}`)) {
            return send(response, 404, 'text/plain; charset=utf-8', 'Unknown product image.', request.method);
          }

          if (request.method === 'HEAD') return send(response, 200, entry.type, undefined, request.method);

          response.statusCode = 200;
          response.setHeader('Content-Type', entry.type);
          const stream = createReadStream(filePath);
          stream.on('error', () => {
            if (!response.headersSent) response.statusCode = 500;
            response.end('Product image unavailable.');
          });
          return stream.pipe(response);
        } catch {
          return send(response, 500, 'text/plain; charset=utf-8', 'The product preview could not be loaded.', request.method);
        }
      });

      server.middlewares.use(async (request, response, next) => {
        let pathname;
        try {
          pathname = new URL(request.url || '/', 'http://draft.invalid').pathname;
        } catch {
          return next();
        }

        const normalizedPage = pathname === aegisGiletPreviewPath.slice(0, -1)
          ? aegisGiletPreviewPath
          : pathname;
        if (normalizedPage !== aegisGiletPreviewPath && !pathname.startsWith(aegisGiletMediaPrefix)) {
          return next();
        }

        response.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
        response.setHeader('Cache-Control', 'no-store');
        response.setHeader('X-Content-Type-Options', 'nosniff');

        if (!['GET', 'HEAD'].includes(request.method)) {
          response.setHeader('Allow', 'GET, HEAD');
          return send(response, 405, 'text/plain; charset=utf-8', 'Read-only product preview.', request.method);
        }

        try {
          if (normalizedPage === aegisGiletPreviewPath) {
            createAegisGiletPreview();
            const html = await readFile(resolve(appRoot, 'aegis-gilet-preview.html'), 'utf8');
            const transformed = await server.transformIndexHtml(aegisGiletPreviewPath, html);
            return send(response, 200, 'text/html; charset=utf-8', transformed, request.method);
          }

          const assetId = pathname.slice(aegisGiletMediaPrefix.length);
          const entry = aegisAssetsById.get(assetId);
          if (!entry || !entry.file.startsWith('attached_assets/aegis-gilet-derived/') || entry.file.includes('..')) {
            return send(response, 404, 'text/plain; charset=utf-8', 'Unknown Aegis review image.', request.method);
          }

          const filePath = resolve(workspaceRoot, entry.file);
          if (!filePath.startsWith(`${allowedAssetRoot}${sep}`)) {
            return send(response, 404, 'text/plain; charset=utf-8', 'Unknown Aegis review image.', request.method);
          }
          if (request.method === 'HEAD') return send(response, 200, entry.type, undefined, request.method);

          response.statusCode = 200;
          response.setHeader('Content-Type', entry.type);
          const stream = createReadStream(filePath);
          stream.on('error', () => {
            if (!response.headersSent) response.statusCode = 500;
            response.end('Aegis review image unavailable.');
          });
          return stream.pipe(response);
        } catch {
          return send(response, 500, 'text/plain; charset=utf-8', 'The Aegis preview could not be loaded.', request.method);
        }
      });

    },
  };
}
