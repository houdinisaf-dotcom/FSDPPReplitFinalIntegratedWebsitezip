import { readFile, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  HOUSE_PAGE_REGISTRY,
  HOUSE_DRAFT_BUILD_FILES,
  isHouseDraftRoute,
  isHouseDraftBuildFile,
} from './data/house-page-readiness.js';

const LEGACY_HOUSE_REDIRECTS = Object.freeze({
  'brand/founder': '/story',
  'flagships/dublin': '/flagships/dublin.html',
  'flagships/belfast': '/flagships/belfast.html',
  'flagships/manchester': '/flagships/manchester.html',
  'flagships/islamabad': '/flagships/islamabad.html',
  'flagships/future-global-locations': '/flagships/future-global-locations.html',
  'bio-lab/smart-apparel': '/#smart-apparel-nfc',
  'bio-lab/adaptive-fabrics': '/#adaptive-technical-fabrics',
  'community/co-creation': '/community-co-creation.html',
  'global/pods': '/fsd-pods.html',
  'fsd-house-archive': '/#fsd-house-archive',
});

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function draftBody(page) {
  if (page.id === 'founder-story') {
    return `<section class="house-draft-intro">
      <p class="house-draft-intro__number">01 / The beginning</p>
      <div><h2>A founder’s account, told with precision.</h2>
        <p>Founder Story is not ready for publication. The editorial structure is prepared; founder biography, first-person account, and factual details require verification.</p></div>
    </section>
    <section class="house-draft-chapters" aria-label="Founder Story content plan">
      <article><span>01</span><h2>Origins</h2><p>CONTENT PENDING — verified origin story and dates.</p></article>
      <article><span>02</span><h2>Principles</h2><p>CONTENT PENDING — approved founder perspective on the principles behind FSD.</p></article>
      <article><span>03</span><h2>Direction</h2><p>CONTENT PENDING — approved account of the House’s direction.</p></article>
    </section>
    <section class="house-draft-media-note">
      <p class="house-draft-section__eyebrow">Editorial media</p>
      <h2>A text-led composition until the archive is approved.</h2>
      <p>CONTENT PENDING — approved Founder Story hero image, archival material, captions, and image permissions.</p>
    </section>
    <section class="house-draft-approval" aria-labelledby="draft-readiness-title">
      <div><p class="house-draft-section__eyebrow">Publication gate</p><h2 id="draft-readiness-title">Not ready for publication</h2></div>
      <ul><li>Verify founder biography and milestones.</li><li>Approve final page copy and quotations.</li><li>Approve photography, captions, and usage rights.</li></ul>
    </section>`;
  }

  return `<section class="house-draft-section">
    <p class="house-draft-section__eyebrow">Flagship profile / ${escapeHtml(page.title)}</p>
    <h2>A location profile, held to verified detail.</h2>
    <p>This Flagship page is not ready for publication. No approved location, operator, or service details are available.</p>
  </section>
  <section class="house-draft-location-brief" aria-label="Flagship editorial structure">
    <div class="house-draft-location-brief__lead"><span>Location / 01</span><h2>${escapeHtml(page.title)}</h2><p>CONTENT PENDING — approved description and verified operating status.</p></div>
    <div class="house-draft-location-brief__fields">
      <p><strong>Place</strong><span>CONTENT PENDING — verified address and location information.</span></p>
      <p><strong>Experience</strong><span>CONTENT PENDING — approved facilities, services, and visitor information.</span></p>
      <p><strong>Opening</strong><span>CONTENT PENDING — confirmed opening status and hours, if applicable.</span></p>
    </div>
  </section>
  <section class="house-draft-media-note">
    <p class="house-draft-section__eyebrow">Location media</p>
    <h2>Designed for an approved place, not an assumed one.</h2>
    <p>CONTENT PENDING — location-specific approved hero, gallery, captions, and image permissions.</p>
  </section>
  <section class="house-draft-approval" aria-labelledby="draft-readiness-title">
    <div><p class="house-draft-section__eyebrow">Publication gate</p><h2 id="draft-readiness-title">Not ready for publication</h2></div>
    <ul><li>Confirm location, operator, and public operating status.</li><li>Approve public description, facilities, and contact details.</li><li>Approve location photography and media rights.</li></ul>
  </section>`;
}

export function renderHouseDraftPage(page) {
  if (!page || page.readiness !== 'NOT_READY') {
    throw new TypeError('A not-ready House page record is required.');
  }

  const title = escapeHtml(page.title);
  const division = escapeHtml(page.division);
  const description = page.id === 'founder-story'
    ? 'Internal Founder Story draft. Not approved for publication.'
    : `Internal ${title} draft. Not approved for publication.`;
  const pageId = escapeHtml(page.id);

  return `<!doctype html>
<html lang="en-GB" data-fsd-status="NOT READY FOR PUBLICATION">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <meta name="description" content="${escapeHtml(description)}">
  <title>FSD | ${title} — Internal Draft</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <style>
    :root{color-scheme:dark}
    html{background:#0b0c0e;scroll-behavior:smooth}
    body{min-height:100vh;margin:0;background:#0b0c0e;color:#d8d9d6;font-family:"DM Sans", "Segoe UI",sans-serif}
    .fsd-reading-progress{position:fixed;inset:0 0 auto;z-index:1000;height:2px;pointer-events:none}
    .fsd-reading-progress span{display:block;width:100%;height:100%;background:#c8aa72;transform:scaleX(var(--fsd-reading-progress,0));transform-origin:left center}
    .fsd-house-draft__ribbon{padding:.62rem 1rem;text-align:center;background:#262219;color:#e1d2ad;font:500 9px/1.5 "IBM Plex Mono",monospace;letter-spacing:.17em;text-transform:uppercase;border-bottom:1px solid rgb(200 170 114 / 30%)}
    .fsd-house-draft{min-height:70vh}
    .fsd-house-draft .hero{position:relative;isolation:isolate;display:flex;min-height:clamp(380px,55vw,690px);flex-direction:column;justify-content:flex-end;overflow:hidden;padding:clamp(4rem,11vw,9rem) max(24px,calc((100% - 1200px)/2)) clamp(3rem,7vw,6rem);text-align:left;background:linear-gradient(90deg,#0b0c0e 0%,rgb(11 12 14 / 94%) 48%,rgb(11 12 14 / 58%) 100%),repeating-linear-gradient(90deg,transparent 0 118px,rgb(200 170 114 / 5%) 119px),radial-gradient(ellipse at 82% 25%,rgb(200 170 114 / 14%),transparent 36%),#121417}
    .fsd-house-draft .hero::after{position:absolute;z-index:-1;inset:auto 8% 0 auto;width:1px;height:42%;content:"";background:linear-gradient(transparent,rgb(200 170 114 / 55%))}
    .fsd-house-draft .hero .tag{margin:0 0 1.2rem;color:#c8aa72;font:500 9px/1.6 "IBM Plex Mono",monospace;letter-spacing:.2em;text-transform:uppercase}
    .fsd-house-draft h1,.fsd-house-draft h2{font-weight:400}
    .fsd-house-draft h1{max-width:950px;margin:0;color:#f0eee8;font:400 clamp(2.8rem,8vw,7.2rem)/.95 "Newsreader",Georgia,serif;letter-spacing:-.04em}
    .fsd-house-draft .hero-summary{max-width:42rem;margin:1.3rem 0 0;color:#b7bbba;line-height:1.7}
    .fsd-house-draft__content{max-width:1200px;margin:0 auto;padding:clamp(2.5rem,7vw,6.5rem) 24px}
    .house-draft-section{display:grid;grid-template-columns:minmax(150px,.55fr) minmax(0,1.45fr);gap:clamp(24px,6vw,90px);padding:0 0 3rem}
    .house-draft-section h2,.house-draft-intro h2,.house-draft-media-note h2,.house-draft-approval h2{margin:0 0 1rem;color:#f0eee8;font:400 clamp(1.7rem,3.5vw,3.4rem)/1.05 "Newsreader",Georgia,serif;letter-spacing:-.025em}
    .house-draft-section p,.house-draft-section li,.house-draft-intro p,.house-draft-media-note p,.house-draft-approval li,.house-draft-location-brief p{color:#bfc2c0;font-size:14px;line-height:1.8}
    .house-draft-section__eyebrow,.house-draft-intro__number{margin:0;color:#c8aa72!important;font:500 9px/1.6 "IBM Plex Mono",monospace!important;letter-spacing:.16em;text-transform:uppercase}
    .house-draft-section ul,.house-draft-approval ul{margin:0;padding-left:1.25rem}
    .house-draft-intro{display:grid;grid-template-columns:minmax(150px,.55fr) minmax(0,1.45fr);gap:clamp(24px,6vw,90px);padding:0 0 clamp(3rem,7vw,6rem);border-bottom:1px solid #2b2e32}
    .house-draft-chapters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));margin:clamp(2rem,5vw,4rem) 0;border-top:1px solid #2b2e32}
    .house-draft-chapters article{padding:24px 24px 24px 0;border-bottom:1px solid #2b2e32}
    .house-draft-chapters article+article{padding-left:24px;border-left:1px solid #2b2e32}
    .house-draft-chapters span,.house-draft-location-brief__lead>span{color:#9e8558;font:500 9px/1.6 "IBM Plex Mono",monospace;letter-spacing:.15em}
    .house-draft-chapters h2{margin:24px 0 8px;color:#f0eee8;font:400 1.45rem/1.2 "Newsreader",Georgia,serif}
    .house-draft-chapters p{margin:0;color:#969b9d;font-size:12px;line-height:1.75}
    .house-draft-media-note{position:relative;margin:0 0 clamp(3rem,7vw,6rem);padding:clamp(2rem,5vw,4rem);border:1px solid #2b2e32;background:linear-gradient(110deg,#151719,#101214 75%);overflow:hidden}
    .house-draft-media-note::after{position:absolute;inset:0 0 0 60%;content:"";pointer-events:none;background:repeating-linear-gradient(135deg,transparent 0 18px,rgb(200 170 114 / 4%) 19px 20px)}
    .house-draft-media-note>*{position:relative;z-index:1;max-width:680px}
    .house-draft-approval{display:grid;grid-template-columns:1fr 1fr;gap:40px;padding-top:2rem;border-top:1px solid #2b2e32}
    .house-draft-approval h2{font-size:clamp(1.6rem,3vw,2.6rem)}
    .house-draft-approval li{margin:0 0 .5rem}
    .house-draft-location-brief{display:grid;grid-template-columns:.9fr 1.1fr;gap:clamp(24px,6vw,90px);margin:0 0 clamp(3rem,7vw,6rem);padding:clamp(2rem,5vw,4rem) 0;border-top:1px solid #2b2e32;border-bottom:1px solid #2b2e32}
    .house-draft-location-brief__lead h2{margin:1.4rem 0 .5rem;color:#f0eee8;font:400 clamp(2.5rem,6vw,5rem)/.95 "Newsreader",Georgia,serif}
    .house-draft-location-brief__lead p{margin:0}
    .house-draft-location-brief__fields p{display:grid;grid-template-columns:110px 1fr;gap:16px;margin:0;padding:16px 0;border-bottom:1px solid #2b2e32}
    .house-draft-location-brief__fields p:first-child{border-top:1px solid #2b2e32}
    .house-draft-location-brief__fields strong{color:#c8aa72;font:500 9px/1.7 "IBM Plex Mono",monospace;letter-spacing:.13em;text-transform:uppercase}
    .fsd-house-draft__footer{padding:1.5rem;text-align:center;border-top:1px solid #34312b;color:#c9c4b9;font-size:.72rem;letter-spacing:.18em;text-transform:uppercase}
    @media(max-width:700px){.fsd-house-draft .hero{min-height:480px;padding:5rem 22px 3rem}.fsd-house-draft__content{padding-inline:22px}.house-draft-section,.house-draft-intro{grid-template-columns:1fr;gap:16px}.house-draft-chapters{grid-template-columns:1fr}.house-draft-chapters article,.house-draft-chapters article+article{padding:20px 0;border-left:0}.house-draft-chapters h2{margin:12px 0 6px}.house-draft-location-brief,.house-draft-approval{grid-template-columns:1fr;gap:24px}.house-draft-location-brief__fields p{grid-template-columns:90px 1fr}.house-draft-media-note{padding:24px}}
    @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}
  </style>
</head>
<body>
  <div class="fsd-reading-progress" aria-hidden="true"><span></span></div>
  <script>
    (() => {
      const bar = document.querySelector('.fsd-reading-progress');
      const update = () => {
        const distance = document.documentElement.scrollHeight - window.innerHeight;
        bar?.style.setProperty('--fsd-reading-progress', String(distance > 0 ? window.scrollY / distance : 0));
      };
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      update();
    })();
  </script>
  <div data-fsd-standalone-navigation></div>
  <main class="fsd-house-draft" data-fsd-house-destination="${pageId}">
    <div class="fsd-house-draft__ribbon" data-fsd-house-draft-ribbon role="note">Internal draft · not approved for publication</div>
    <header class="hero" aria-labelledby="house-draft-title">
      <p class="tag">FSD / The House / ${division}</p>
      <h1 id="house-draft-title">${title}</h1>
      <p class="hero-summary">Internal draft · Not ready for publication.</p>
    </header>
    <div class="fsd-house-draft__content">${draftBody(page)}</div>
  </main>
  <footer class="fsd-house-draft__footer">FSD · Fitness &amp; Self-Defence</footer>
  <script type="module" src="/src/standalone-navigation.js"></script>
</body>
</html>`;
}

export function legacyHouseRedirectDestination(hash = '') {
  let key = '';
  try {
    key = decodeURIComponent(String(hash).replace(/^#/, ''));
  } catch {
    return '/story';
  }
  if (!key) return '/#fsd-house-archive';
  return LEGACY_HOUSE_REDIRECTS[key] || LEGACY_HOUSE_REDIRECTS['brand/founder'];
}

export function renderLegacyHouseRedirect() {
  const redirectMap = JSON.stringify(LEGACY_HOUSE_REDIRECTS);
  const defaultDestination = JSON.stringify(legacyHouseRedirectDestination());
  return `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FSD | The House</title></head><body><p>Opening THE HOUSE…</p><script>const routes=${redirectMap};let key="";try{key=decodeURIComponent(location.hash.slice(1))}catch{}const destination=key?(routes[key]||routes["brand/founder"]):${defaultDestination};location.replace(destination);</script><noscript><a href="/#fsd-house-archive">Open THE HOUSE</a></noscript></body></html>`;
}

export function standaloneNavigationPagesPlugin(projectRoot) {
  return {
    name: 'fsd-standalone-navigation-pages',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const pathname = new URL(request.url || '/', 'http://localhost').pathname;
        if (pathname === '/the-house.html') {
          response.statusCode = 200;
          response.setHeader('Content-Type', 'text/html; charset=utf-8');
          response.setHeader('X-Robots-Tag', 'noindex, nofollow');
          response.end(renderLegacyHouseRedirect());
          return;
        }

        const page = HOUSE_PAGE_REGISTRY.find(record => record.path === pathname);
        if (!page || page.readiness !== 'NOT_READY' || !isHouseDraftRoute(pathname)) {
          next();
          return;
        }

        response.statusCode = 200;
        response.setHeader('Content-Type', 'text/html; charset=utf-8');
        response.setHeader('X-Robots-Tag', 'noindex, nofollow');
        response.end(renderHouseDraftPage(page));
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

      for (const fileName of ['investor.html', 'cryo-zero.html', 'red-light-recovery.html', 'fight-promotions.html', 'live-events.html', 'broadcast-ppv.html', 'athlete-development.html', 'academy-grassroots.html', 'fsd-pods.html', 'autonomous-popups.html', 'mobile-testing-labs.html', 'local-micro-manufacturing.html', 'genetic-microbiome.html', 'community-co-creation.html', 'performance-partnerships.html', 'circular-trade-in.html', 'community-first-aid.html', 'security-vision.html']) {
        const path = resolve(outputRoot, fileName);
        if (isHouseDraftBuildFile(fileName)) {
          await unlink(path).catch(error => {
            if (error.code !== 'ENOENT') throw error;
          });
          continue;
        }
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

      await writeFile(resolve(outputRoot, 'the-house.html'), renderLegacyHouseRedirect());

      for (const fileName of HOUSE_DRAFT_BUILD_FILES) {
        const path = resolve(outputRoot, fileName);
        await unlink(path).catch(error => {
          if (error.code !== 'ENOENT') throw error;
        });
      }
    },
  };
}
