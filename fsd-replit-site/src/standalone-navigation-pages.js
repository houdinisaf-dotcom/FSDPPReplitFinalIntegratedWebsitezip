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

function replaceFounderStoryContent(source) {
  const assignmentStart = source.indexOf('const P=');
  const valueStart = assignmentStart + 'const P='.length;
  const valueEnd = source.indexOf(',M=', valueStart);
  if (assignmentStart < 0 || valueEnd < 0) {
    throw new Error('Could not locate the House page content dictionary.');
  }

  const pages = JSON.parse(source.slice(valueStart, valueEnd));
  const founder = pages['brand/founder'];
  if (!founder) throw new Error('Could not locate the Founder Story page content.');

  pages['brand/founder'] = {
    ...founder,
    kicker: 'The House / Founder Story & Brand Manifesto',
    title: 'The Architecture of Purpose',
    tag: 'Fitness. Discipline. Progress. Built on evidence rather than assertion.',
    status: '',
    body: [
      '<strong>01 / The Ethos</strong><br>FSD (Fitness and Self-Defense) was founded on a singular premise: that true capability is not a costume, but a practice. In a fitness and apparel landscape saturated with loud branding, unverified claims, and fleeting trends, FSD was built for those who train with purpose.',
      'Informed by the uncompromising demands of functional training, martial arts, and self-defense culture, our work bridges movement-led technical apparel with professional-grade recovery and training hardware. We reject noise in favor of substance, ensuring that every design choice serves a distinct operational function.',
      '<strong>02 / Discipline &amp; Rigorous Execution</strong><br>Shaped by hands-on experience across frontline environments, institutional project management, and operational leadership, the foundation of FSD is rooted in systematic execution, precision, and absolute accountability.',
      'We approach product architecture, supply chain integrity, and brand development with rigorous discipline. Whether engineering the AEROFORGE activewear line, structuring supervised recovery systems like Cryo-Zero, or designing professional-grade training equipment, our standard is uncompromising: form first, facts only when verified.',
      '<strong>03 / What We Aim to Achieve</strong>',
      '<strong>04 / Built for the Work</strong><br>FSD operates as a modern British performance house where design, governance, and utility intersect. We are building a long-horizon ecosystem structured for those who demand excellence from themselves and their equipment.',
    ],
    bul: [
      '<strong>Uncompromising Standards</strong><br>To deliver technical apparel and recovery infrastructure that prioritizes durability, clean minimalist design, and verified utility.',
      '<strong>Transparent Ecosystem</strong><br>To build an ecosystem grounded in honest disclosures, rigorous operational oversight, and evidence-driven growth.',
      '<strong>The Pursuit of Mastery</strong><br>To cultivate a community of dedicated lifters, martial artists, and disciplined individuals who understand that confidence is earned in motion.',
    ],
    note: '<strong>Capability is a practice.</strong> Welcome to the house.',
  };
  pages.brand.subs = pages.brand.subs?.map(([id, title, description]) =>
    id === 'founder' ? [id, title, 'Fitness. Discipline. Progress.'] : [id, title, description]);

  return source.slice(0, valueStart) + JSON.stringify(pages) + source.slice(valueEnd);
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

  transformed = replaceFounderStoryContent(transformed);

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

      for (const fileName of ['investor.html', 'the-house.html', 'cryo-zero.html', 'red-light-recovery.html', 'fight-promotions.html', 'live-events.html', 'broadcast-ppv.html', 'athlete-development.html', 'academy-grassroots.html', 'fsd-pods.html', 'autonomous-popups.html', 'mobile-testing-labs.html', 'local-micro-manufacturing.html', 'genetic-microbiome.html', 'community-co-creation.html', 'performance-partnerships.html', 'circular-trade-in.html', 'community-first-aid.html', 'security-vision.html']) {
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
