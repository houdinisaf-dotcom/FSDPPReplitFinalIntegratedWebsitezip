import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDatabasePool } from './src/server/db-pool.js';
import { createPrelaunchSignupMiddleware } from './src/server/prelaunch-signups.js';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const publicRoot = resolve(projectRoot, 'dist');
const pool = createDatabasePool();
const signupApi = createPrelaunchSignupMiddleware({
  query: (sql, params) => pool.query(sql, params),
});

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

function sendText(response, status, message) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'text/plain; charset=utf-8');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.end(message);
}

async function serveStatic(request, response) {
  if (!['GET', 'HEAD'].includes(request.method || '')) {
    response.setHeader('Allow', 'GET, HEAD');
    sendText(response, 405, 'Method not allowed');
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url || '/', 'http://fsd.local').pathname);
  } catch {
    sendText(response, 400, 'Invalid path');
    return;
  }

  const relativePath = pathname === '/' ? '/index.html' : pathname;
  let filePath = resolve(publicRoot, `.${relativePath}`);
  if (filePath !== publicRoot && !filePath.startsWith(`${publicRoot}${sep}`)) {
    sendText(response, 400, 'Invalid path');
    return;
  }

  let info;
  try {
    info = await stat(filePath);
    if (info.isDirectory()) {
      filePath = resolve(filePath, 'index.html');
      info = await stat(filePath);
    }
  } catch {
    if (extname(relativePath)) {
      sendText(response, 404, 'Not found');
      return;
    }
    filePath = resolve(publicRoot, 'index.html');
    try {
      info = await stat(filePath);
    } catch {
      sendText(response, 503, 'The site is not built yet');
      return;
    }
  }

  if (!info.isFile() || !filePath.startsWith(publicRoot)) {
    sendText(response, 404, 'Not found');
    return;
  }

  response.statusCode = 200;
  response.setHeader('Content-Type', mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream');
  response.setHeader('Content-Length', String(info.size));
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Cache-Control', extname(filePath) === '.html' ? 'no-cache' : 'public, max-age=3600');
  if (request.method === 'HEAD') {
    response.end();
    return;
  }
  createReadStream(filePath).on('error', () => {
    if (!response.headersSent) sendText(response, 500, 'Unable to serve the requested file');
    else response.destroy();
  }).pipe(response);
}

const server = createServer((request, response) => {
  signupApi(request, response, () => {
    if ((request.url || '').startsWith('/api/')) {
      response.statusCode = 404;
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
      response.end(JSON.stringify({ ok: false, code: 'not_found' }));
      return;
    }
    void serveStatic(request, response);
  });
});

const port = Number(process.env.PORT || 5000);
server.listen(port, '0.0.0.0', () => {
  console.log(`FSD web server listening on port ${port}`);
});

function shutdown() {
  server.close(() => {
    void pool.end().finally(() => process.exit(0));
  });
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
