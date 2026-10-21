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
import { createAlightPreview } from '../src/alight-campaign.js';
import { alightMediaPrefix, alightPreviewPath } from '../src/alight-preview-path.js';
import { createMotionPreview, motionPreviewManifest } from '../src/motion-campaign.js';
import { motionMediaPrefix, motionPreviewPath, motionProductsPrefix } from '../src/motion-preview-path.js';
import { createNexusPreview, nexusPreviewManifest } from '../src/nexus-campaign.js';
import { nexusMediaPrefix, nexusPreviewPath } from '../src/nexus-preview-path.js';

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
const alightAssetsById = new Map(createAlightPreview().gallery.map(asset => [asset.id, asset]));
const motionAssetsById = new Map(motionPreviewManifest.assets.map(asset => [asset.id, asset]));
const nexusAssetsById = new Map(nexusPreviewManifest.assets.map(asset => [asset.id, asset]));
const nexusAuditAssetsById = new Map(nexusPreviewManifest.auditAssets.map(asset => [asset.id, asset]));

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

      server.middlewares.use(async (request, response, next) => {
        let pathname;
        try {
          pathname = new URL(request.url || '/', 'http://draft.invalid').pathname;
        } catch {
          return next();
        }

        const normalizedPage = pathname === alightPreviewPath.slice(0, -1)
          ? alightPreviewPath
          : pathname;
        if (normalizedPage !== alightPreviewPath && !pathname.startsWith(alightMediaPrefix)) {
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
          if (normalizedPage === alightPreviewPath) {
            const preview = createAlightPreview();
            if (preview.product.name !== 'FSD ALIGHT' || preview.product.price !== null) {
              throw new Error('The ALIGHT private preview must not expose an unapproved price or product identity.');
            }
            const html = await readFile(resolve(appRoot, 'alight-preview.html'), 'utf8');
            const transformed = await server.transformIndexHtml(alightPreviewPath, html);
            return send(response, 200, 'text/html; charset=utf-8', transformed, request.method);
          }

          const assetId = pathname.slice(alightMediaPrefix.length);
          const entry = alightAssetsById.get(assetId);
          if (!entry
            || !entry.file.startsWith('attached_assets/fsd-alight-reference/')
            || entry.file.includes('..')) {
            return send(response, 404, 'text/plain; charset=utf-8', 'Unknown ALIGHT reference image.', request.method);
          }

          const filePath = resolve(workspaceRoot, entry.file);
          if (!filePath.startsWith(`${allowedAssetRoot}${sep}`)) {
            return send(response, 404, 'text/plain; charset=utf-8', 'Unknown ALIGHT reference image.', request.method);
          }
          if (request.method === 'HEAD') return send(response, 200, entry.type, undefined, request.method);

          response.statusCode = 200;
          response.setHeader('Content-Type', entry.type);
          const stream = createReadStream(filePath);
          stream.on('error', () => {
            if (!response.headersSent) response.statusCode = 500;
            response.end('ALIGHT reference image unavailable.');
          });
          return stream.pipe(response);
        } catch {
          return send(response, 500, 'text/plain; charset=utf-8', 'The ALIGHT private preview could not be loaded.', request.method);
        }
      });

      server.middlewares.use(async (request, response, next) => {
        let pathname;
        try {
          pathname = new URL(request.url || '/', 'http://draft.invalid').pathname;
        } catch {
          return next();
        }

        const normalizedPath = pathname === motionPreviewPath.slice(0, -1) ? motionPreviewPath : pathname;
        const isMotionPage = normalizedPath === motionPreviewPath || normalizedPath.startsWith(motionProductsPrefix);
        const isMotionAsset = pathname.startsWith(motionMediaPrefix);
        if (!isMotionPage && !isMotionAsset) return next();

        response.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
        response.setHeader('Cache-Control', 'no-store');
        response.setHeader('X-Content-Type-Options', 'nosniff');

        if (!['GET', 'HEAD'].includes(request.method)) {
          response.setHeader('Allow', 'GET, HEAD');
          return send(response, 405, 'text/plain; charset=utf-8', 'Read-only FSD MOTION concept preview.', request.method);
        }

        try {
          if (isMotionPage) {
            let productSlug = null;
            if (normalizedPath !== motionPreviewPath) {
              const encodedSlug = normalizedPath.slice(motionProductsPrefix.length).replace(/\/$/, '');
              if (!encodedSlug || encodedSlug.includes('/')) {
                return send(response, 404, 'text/plain; charset=utf-8', 'Unknown FSD MOTION preview page.', request.method);
              }
              try {
                productSlug = decodeURIComponent(encodedSlug);
              } catch {
                return send(response, 404, 'text/plain; charset=utf-8', 'Unknown FSD MOTION preview page.', request.method);
              }
              if (!createMotionPreview(productSlug)) {
                return send(response, 404, 'text/plain; charset=utf-8', 'Unknown FSD MOTION product preview.', request.method);
              }
            }

            const html = await readFile(resolve(appRoot, 'motion-preview.html'), 'utf8');
            const transformed = await server.transformIndexHtml(normalizedPath, html);
            return send(response, 200, 'text/html; charset=utf-8', transformed, request.method);
          }

          const assetId = pathname.slice(motionMediaPrefix.length);
          const entry = motionAssetsById.get(assetId);
          if (!entry
            || !entry.file.startsWith('attached_assets/fsd-motion-reference/FSD_MOTION_Website_Images/')
            || entry.file.includes('..')) {
            return send(response, 404, 'text/plain; charset=utf-8', 'Unknown FSD MOTION campaign reference.', request.method);
          }

          const filePath = resolve(workspaceRoot, entry.file);
          if (!filePath.startsWith(`${allowedAssetRoot}${sep}`)) {
            return send(response, 404, 'text/plain; charset=utf-8', 'Unknown FSD MOTION campaign reference.', request.method);
          }
          if (request.method === 'HEAD') return send(response, 200, entry.type, undefined, request.method);

          response.statusCode = 200;
          response.setHeader('Content-Type', entry.type);
          const stream = createReadStream(filePath);
          stream.on('error', () => {
            if (!response.headersSent) response.statusCode = 500;
            response.end('FSD MOTION campaign reference unavailable.');
          });
          return stream.pipe(response);
        } catch {
          return send(response, 500, 'text/plain; charset=utf-8', 'The FSD MOTION private preview could not be loaded.', request.method);
        }
      });

      server.middlewares.use(async (request, response, next) => {
        let pathname;
        try {
          pathname = new URL(request.url || '/', 'http://draft.invalid').pathname;
        } catch {
          return next();
        }

        const basePath = nexusPreviewPath.slice(0, -1);
        const normalizedPath = pathname === basePath ? nexusPreviewPath : pathname;
        const isNexusRoute = pathname === basePath || pathname.startsWith(nexusPreviewPath);
        if (!isNexusRoute) return next();

        response.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
        response.setHeader('Cache-Control', 'no-store');
        response.setHeader('X-Content-Type-Options', 'nosniff');

        if (!['GET', 'HEAD'].includes(request.method)) {
          response.setHeader('Allow', 'GET, HEAD');
          return send(response, 405, 'text/plain; charset=utf-8', 'Read-only FSD NEXUS concept preview.', request.method);
        }

        try {
          if (normalizedPath === nexusPreviewPath) {
            const preview = createNexusPreview();
            if (preview.checkoutEnabled !== false
              || preview.price !== null
              || preview.availability !== null
              || preview.assets.length !== 3
              || preview.auditAssets.length !== 8
              || preview.brandAudit.length !== 11) {
              throw new Error('The private FSD NEXUS concept boundary is invalid.');
            }
            const html = await readFile(resolve(appRoot, 'nexus-preview.html'), 'utf8');
            const transformed = await server.transformIndexHtml(nexusPreviewPath, html);
            return send(response, 200, 'text/html; charset=utf-8', transformed, request.method);
          }

          if (!pathname.startsWith(nexusMediaPrefix)) {
            return send(response, 404, 'text/plain; charset=utf-8', 'Unknown FSD NEXUS private preview route.', request.method);
          }

          const mediaPath = pathname.slice(nexusMediaPrefix.length);
          const isAuditAsset = mediaPath.startsWith('audit/');
          const assetId = isAuditAsset ? mediaPath.slice('audit/'.length) : mediaPath;
          const entry = isAuditAsset
            ? nexusAuditAssetsById.get(assetId)
            : nexusAssetsById.get(assetId);
          const allowedDirectory = isAuditAsset ? 'fsd-nexus-audit' : 'fsd-nexus-approved';
          if (!entry
            || !entry.file.startsWith(`attached_assets/${allowedDirectory}/`)
            || entry.file.includes('..')) {
            return send(response, 404, 'text/plain; charset=utf-8', 'Unknown FSD NEXUS private concept image.', request.method);
          }

          const filePath = resolve(workspaceRoot, entry.file);
          const nexusAssetRoot = resolve(allowedAssetRoot, allowedDirectory);
          if (!filePath.startsWith(`${nexusAssetRoot}${sep}`)) {
            return send(response, 404, 'text/plain; charset=utf-8', 'Unknown FSD NEXUS private concept image.', request.method);
          }
          if (request.method === 'HEAD') return send(response, 200, entry.type, undefined, request.method);

          response.statusCode = 200;
          response.setHeader('Content-Type', entry.type);
          const stream = createReadStream(filePath);
          stream.on('error', () => {
            if (!response.headersSent) response.statusCode = 500;
            response.end('FSD NEXUS concept image unavailable.');
          });
          return stream.pipe(response);
        } catch {
          return send(response, 500, 'text/plain; charset=utf-8', 'The FSD NEXUS private concept preview could not be loaded.', request.method);
        }
      });

    },
  };
}
