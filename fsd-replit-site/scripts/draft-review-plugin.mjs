import { readFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { appRoot, workspaceRoot, ropeOutput, mediaPrefix } from './weighted-rope-images.mjs';
import { createWeightedRopeDraft } from '../src/draft-catalogue.js';
const run = promisify(execFile);
const previewPath = '/__catalogue-preview/weighted-skipping-rope/';

export function draftReviewPlugin() {
  let preparation = null;
  const ensureImages = () => preparation ||= run(process.execPath, [resolve(appRoot,'scripts/weighted-rope-images.mjs')], {maxBuffer:1024*1024})
    .catch(error => { preparation=null; throw error; });
  return {
    name:'fsd-read-only-draft-review', apply:'serve',
    configureServer(server) {
      server.middlewares.use(async (request,response,next) => {
        const path = new URL(request.url, 'http://draft.invalid').pathname;
        if (!path.startsWith('/__catalogue-preview/') && !path.startsWith(mediaPrefix)) return next();
        response.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
        response.setHeader('Cache-Control','no-store');
        if (!['GET','HEAD'].includes(request.method)) { response.statusCode=405;response.setHeader('Allow','GET, HEAD');return response.end('Read-only review.'); }
        try {
          if (path === previewPath || path === previewPath.slice(0,-1)) {
            const html = await server.transformIndexHtml(previewPath, await readFile(resolve(appRoot,'draft-preview.html'),'utf8'));
            response.setHeader('Content-Type','text/html; charset=utf-8');
            return response.end(request.method === 'HEAD' ? '' : html);
          }
          await ensureImages();
          const manifest = JSON.parse(await readFile(resolve(ropeOutput,'manifest.json'),'utf8'));
          if (path === '/__catalogue-preview/data/weighted-skipping-rope.json') {
            const records = JSON.parse(await readFile(resolve(appRoot,'content/catalogue.json'),'utf8')).records;
            const record = records.find(record => record.key === 'weighted-skipping-rope');
            response.setHeader('Content-Type','application/json; charset=utf-8');
            return response.end(request.method === 'HEAD' ? '' : JSON.stringify(createWeightedRopeDraft(record,manifest)));
          }
          const entry = manifest.files.find(file => file.src === path);
          if (!entry) { response.statusCode=404;return response.end('Unknown review asset.'); }
          response.setHeader('Content-Type',entry.mime);
          if (request.method === 'HEAD') return response.end();
          const stream = createReadStream(resolve(workspaceRoot,entry.file));
          stream.on('error',()=>{response.statusCode=500;response.end('Review asset unavailable.');});
          stream.pipe(response);
        } catch (error) {
          response.statusCode=500;response.setHeader('Content-Type','text/plain; charset=utf-8');
          response.end(`Draft preparation failed: ${error.message}`);
        }
      });
    },
  };
}
