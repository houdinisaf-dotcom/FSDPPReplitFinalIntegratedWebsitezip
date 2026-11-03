import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export function standaloneNavigationPagesPlugin(projectRoot) {
  return {
    name: 'fsd-standalone-navigation-pages',
    apply: 'build',
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
