import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function removeObjectProperty(source, propertyName) {
  const propertyStart = source.indexOf(`"${propertyName}"`);
  if (propertyStart < 0) return source;
  const colon = source.indexOf(':', propertyStart);
  const valueStart = source.indexOf('{', colon + 1);
  if (colon < 0 || valueStart < 0) {
    throw new Error(`Could not locate the ${propertyName} House entry.`);
  }

  let depth = 0;
  let inString = false;
  let escaped = false;
  let valueEnd = -1;
  for (let index = valueStart; index < source.length; index += 1) {
    const character = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') inString = true;
    else if (character === '{') depth += 1;
    else if (character === '}') {
      depth -= 1;
      if (depth === 0) {
        valueEnd = index + 1;
        break;
      }
    }
  }
  if (valueEnd < 0) throw new Error(`Could not finish removing the ${propertyName} House entry.`);

  let end = valueEnd;
  while (/\s/.test(source[end] || '')) end += 1;
  if (source[end] === ',') end += 1;
  else {
    let start = propertyStart - 1;
    while (/\s/.test(source[start] || '')) start -= 1;
    if (source[start] === ',') return source.slice(0, start) + source.slice(valueEnd);
  }
  return source.slice(0, propertyStart) + source.slice(end);
}

export function transformHouseArchiveContent(html) {
  return removeObjectProperty(html, 'brand/archive')
    .replace(/,\s*\["archive",\s*"Archive & Version History"(?:,\s*"How the plan has evolved\.")?\]/g, '')
    .replace(/,\s*"Archive & Version History"/g, '')
    .replaceAll('Brand Story & Archive', 'Brand Story')
    .replaceAll('OUR STORY & ARCHIVE', 'OUR STORY');
}

export function standaloneNavigationPagesPlugin(projectRoot) {
  return {
    name: 'fsd-standalone-navigation-pages',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        if (new URL(request.url || '/', 'http://localhost').pathname !== '/the-house.html') {
          next();
          return;
        }
        try {
          const source = await readFile(resolve(projectRoot, 'public/the-house.html'), 'utf8');
          response.statusCode = 200;
          response.setHeader('Content-Type', 'text/html; charset=utf-8');
          response.end(transformHouseArchiveContent(source));
        } catch (error) {
          next(error);
        }
      });
    },
    async closeBundle() {
      const outputRoot = resolve(projectRoot, 'dist');
      const manifestPath = resolve(outputRoot, '.vite/manifest.json');
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
      const entry = manifest['src/standalone-navigation.js'];
      if (!entry?.file) {
        throw new Error('The standalone navigation bundle is missing from the build manifest.');
      }

      const stylesheetLinks = (entry.css || [])
        .map(file => `<link rel="stylesheet" href="/${file}">`)
        .join('\n    ');
      const scriptTag = `<script type="module" src="/${entry.file}"></script>`;

      for (const fileName of ['investor.html', 'the-house.html']) {
        const path = resolve(outputRoot, fileName);
        let html = await readFile(path, 'utf8');
        if (fileName === 'the-house.html') html = transformHouseArchiveContent(html);
        if (!html.includes('src="/src/standalone-navigation.js"')) {
          throw new Error(`The standalone navigation mount is missing from ${fileName}.`);
        }
        html = html.replace(
          '<script type="module" src="/src/standalone-navigation.js"></script>',
          scriptTag,
        );
        if (stylesheetLinks) html = html.replace('</head>', `    ${stylesheetLinks}\n  </head>`);
        await writeFile(path, html);
      }
    },
  };
}
