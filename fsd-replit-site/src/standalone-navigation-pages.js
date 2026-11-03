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

export function transformHousePageContent(html) {
  let transformed = html;
  for (const section of ['brand/archive', 'brand/purpose', 'brand/identity', 'brand/press']) {
    transformed = removeObjectProperty(transformed, section);
  }

  for (const section of ['archive', 'purpose', 'identity', 'press']) {
    const entry = `\\["${section}",\\s*"[^"]*"(?:,\\s*"[^"]*")?\\]`;
    transformed = transformed.replace(new RegExp(`,\\s*${entry}|${entry},?`, 'g'), '');
  }

  return transformed
    .replace(/"(?:Archive & Version History|Purpose & Positioning|Brand Identity Standard|Press & Media Kit)"\s*,?/g, '')
    .replace(/^P\['brand\/identity'\]\.body\[1\].*;\s*$/gm, '')
    .replace(/^P\['brand\/identity'\]\.bul\[4\].*;\s*$/gm, '')
    .replaceAll('Brand Story & Archive', 'Founder Story')
    .replaceAll('Purpose, identity and record. Choose a section below.', 'Founder story and background. Explore the Founder Story below.')
    .replaceAll('Purpose, identity and record.', 'Founder story and background.')
    .replace('"01", "Founder Story"', '"01", "OUR STORY"');
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
          response.end(transformHousePageContent(source));
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
        if (fileName === 'the-house.html') html = transformHousePageContent(html);
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
