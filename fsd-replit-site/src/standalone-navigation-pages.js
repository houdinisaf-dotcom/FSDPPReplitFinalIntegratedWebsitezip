import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import {
  HOUSE_PAGE_REGISTRY,
  HOUSE_DRAFT_BUILD_FILES,
  HOUSE_GENERATED_PAGES,
  isHouseDraftRoute,
  isHouseDraftBuildFile,
} from './data/house-page-readiness.js';
import {
  DIVISIONS,
  FLAGSHIP_LINKS,
  HORIZONS,
  STATUS_NOTICE,
  housePublicContent,
} from './data/house-public-content.js';

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

// ---------------------------------------------------------------------------
// Public House pages: Founder Story, Investor Relations and the five Flagships.
// Content lives in ./data/house-public-content.js.
// ---------------------------------------------------------------------------

const HOUSE_PUBLIC_STYLES = `
    :root{color-scheme:dark}
    html{background:#0b0c0e;scroll-behavior:smooth}
    body{min-height:100vh;margin:0;background:#0b0c0e;color:#d8d9d6;font-family:"DM Sans","Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}
    .fsd-reading-progress{position:fixed;inset:0 0 auto;z-index:1000;height:2px;pointer-events:none}
    .fsd-reading-progress span{display:block;width:100%;height:100%;background:#c8aa72;transform:scaleX(var(--fsd-reading-progress,0));transform-origin:left center}
    .fsd-house-public a{color:inherit}
    .fsd-house-public .hero{position:relative;isolation:isolate;display:flex;min-height:clamp(420px,58vw,720px);flex-direction:column;justify-content:flex-end;overflow:hidden;padding:clamp(4rem,11vw,9rem) max(24px,calc((100% - 1200px)/2)) clamp(3rem,7vw,6rem);background:linear-gradient(90deg,#0b0c0e 0%,rgb(11 12 14 / 94%) 48%,rgb(11 12 14 / 58%) 100%),repeating-linear-gradient(90deg,transparent 0 118px,rgb(200 170 114 / 5%) 119px),radial-gradient(ellipse at 82% 25%,rgb(200 170 114 / 16%),transparent 38%),#121417}
    body[data-fsd-house-editorial="true"] main.fsd-house-public:has(> .hero.has-image){width:100%;max-width:none;padding-top:0}
    .fsd-house-public .hero.has-image{background:#0b0c0e;min-height:clamp(460px,calc(100svh - 112px),760px);padding-inline:max(24px,calc((100% - 1200px)/2))}
    .fsd-house-public .hp-hero-media img{object-position:center 42%;filter:saturate(.9)}
    .fsd-house-public .hero > .hero-caption{position:absolute;z-index:1;top:auto;left:auto;right:max(24px,calc((100% - 1200px)/2));bottom:22px;margin:0;color:rgb(244 239 228 / 62%);font:500 9.5px/1.4 "IBM Plex Mono",monospace;letter-spacing:.18em;text-transform:uppercase}
    .hp-gallery{display:grid;gap:14px;grid-template-columns:repeat(2,minmax(0,1fr))}
    .hp-gallery.is-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
    .hp-gallery__item{position:relative;margin:0;overflow:hidden;border-radius:3px;background:#15171a;aspect-ratio:4/3;box-shadow:0 0 0 1px rgb(255 232 180 / 18%)}
    .hp-gallery__item.is-wide{grid-column:1/-1;aspect-ratio:21/9}
    .hp-gallery__item img{width:100%;height:100%;object-fit:cover;display:block;filter:saturate(.9);transition:transform 1.1s cubic-bezier(.2,.7,.2,1)}
    .hp-gallery__item:hover img{transform:scale(1.025)}
    .hp-gallery__item figcaption{position:absolute;inset:auto 0 0;display:flex;justify-content:space-between;gap:12px;padding:30px 16px 13px;background:linear-gradient(transparent,rgb(0 0 0 / 72%));color:#f4efe4;font:500 12px/1.4 "DM Sans",sans-serif}
    .hp-gallery__item figcaption span{color:rgb(244 239 228 / 62%);font:500 9.5px/1.6 "IBM Plex Mono",monospace;letter-spacing:.16em;text-transform:uppercase}
    @media(max-width:700px){.hp-gallery,.hp-gallery.is-grid{grid-template-columns:1fr}.hp-gallery__item.is-wide{aspect-ratio:4/3}.fsd-house-public .hero > .hero-caption{right:22px;bottom:14px}}
    .fsd-house-public .hero::after{position:absolute;z-index:-1;inset:auto 8% 0 auto;width:1px;height:46%;content:"";background:linear-gradient(transparent,rgb(200 170 114 / 60%))}
    .fsd-house-public .hero .tag{margin:0 0 1.2rem;color:#c8aa72;font:500 10px/1.6 "IBM Plex Mono",monospace;letter-spacing:.2em;text-transform:uppercase}
    .fsd-house-public h1{max-width:980px;margin:0;color:#f0eee8;font:400 clamp(2.8rem,8vw,7.2rem)/.95 "Newsreader",Georgia,serif;letter-spacing:-.04em;overflow-wrap:anywhere}
    .fsd-house-public .hero-summary{max-width:40rem;margin:1.4rem 0 0;color:#c4c6c3;font-size:clamp(1rem,1.6vw,1.2rem);line-height:1.6}
    .fsd-house-public .hero-place{margin:1.6rem 0 0;color:#c8aa72;font:500 11px/1.6 "IBM Plex Mono",monospace;letter-spacing:.16em;text-transform:uppercase}
    .fsd-house-public__content{max-width:1200px;margin:0 auto;padding:clamp(2.5rem,7vw,6.5rem) 24px}
    .fsd-house-public h2{margin:0 0 1rem;color:#f0eee8;font:400 clamp(1.8rem,3.6vw,3.4rem)/1.05 "Newsreader",Georgia,serif;letter-spacing:-.025em}
    .fsd-house-public p{color:#bfc2c0;font-size:15px;line-height:1.8}
    .hp-eyebrow{margin:0;color:#c8aa72!important;font:500 10px/1.6 "IBM Plex Mono",monospace!important;letter-spacing:.16em;text-transform:uppercase}
    .hp-split{display:grid;grid-template-columns:minmax(150px,.55fr) minmax(0,1.45fr);gap:clamp(24px,6vw,90px);padding:0 0 clamp(3rem,7vw,5.5rem);margin:0 0 clamp(3rem,7vw,5.5rem);border-bottom:1px solid #2b2e32}
    .hp-split p:last-child{margin-bottom:0}
    .hp-facts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));margin:0 0 clamp(3rem,7vw,5.5rem);border:1px solid #2b2e32}
    .hp-facts>p{grid-column:1/-1;padding:18px 24px;margin:0;border-bottom:1px solid #2b2e32}
    .hp-facts div{padding:24px;border-right:1px solid #2b2e32}
    .hp-facts div:last-child{border-right:0}
    .hp-facts dt{margin:0 0 10px;color:#8f9396;font:500 10px/1.5 "IBM Plex Mono",monospace;letter-spacing:.14em;text-transform:uppercase}
    .hp-facts dd{margin:0;color:#f0eee8;font:400 clamp(1.15rem,2vw,1.5rem)/1.25 "Newsreader",Georgia,serif}
    .hp-block{margin:0 0 clamp(3rem,7vw,5.5rem)}
    .hp-block>header{display:grid;grid-template-columns:minmax(150px,.55fr) minmax(0,1.45fr);gap:clamp(24px,6vw,90px);margin-bottom:clamp(1.5rem,4vw,2.5rem)}
    .hp-block>header p{margin:.4rem 0 0}
    .hp-horizons{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:#2b2e32;border:1px solid #2b2e32}
    .hp-horizons article{padding:clamp(22px,3vw,34px);background:#0f1113;transition:background-color .3s ease}
    .hp-horizons article:hover{background:#15171a}
    .hp-horizons span{color:#c8aa72;font:500 10px/1.6 "IBM Plex Mono",monospace;letter-spacing:.16em;text-transform:uppercase}
    .hp-horizons h3,.hp-chapters h3,.hp-divisions h3,.hp-zones h3{margin:14px 0 8px;color:#f0eee8;font:400 1.45rem/1.2 "Newsreader",Georgia,serif}
    .hp-horizons p,.hp-chapters p,.hp-divisions p,.hp-zones p{margin:0;font-size:13.5px;line-height:1.75;color:#a9adae}
    .hp-chapters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-top:1px solid #2b2e32}
    .hp-chapters.is-four{grid-template-columns:repeat(4,minmax(0,1fr))}
    .hp-chapters article{padding:24px 24px 28px 0;border-bottom:1px solid #2b2e32}
    .hp-chapters article:not(:nth-child(3n+1)){padding-left:24px;border-left:1px solid #2b2e32}
    .hp-chapters.is-four article{padding-left:24px;border-left:1px solid #2b2e32}
    .hp-chapters.is-four article:nth-child(4n+1){padding-left:0;border-left:0}
    .hp-chapters span{color:#9e8558;font:500 10px/1.6 "IBM Plex Mono",monospace;letter-spacing:.15em}
    .hp-divisions{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
    .hp-divisions article{position:relative;padding:22px 22px 24px;border:1px solid #2b2e32;background:linear-gradient(160deg,#121417,#0d0e10);transition:border-color .3s ease,transform .3s ease}
    .hp-divisions article:hover{border-color:rgb(200 170 114 / 55%);transform:translateY(-2px)}
    .hp-divisions b{display:inline-grid;place-items:center;width:30px;height:30px;border:1px solid rgb(200 170 114 / 50%);color:#c8aa72;font:500 11px/1 "IBM Plex Mono",monospace}
    .hp-location{display:grid;grid-template-columns:.9fr 1.1fr;gap:clamp(24px,6vw,90px);margin:0 0 clamp(3rem,7vw,5.5rem);padding:0 0 clamp(3rem,7vw,5.5rem);border-bottom:1px solid #2b2e32}
    .hp-location__role{margin:1rem 0 0;color:#f0eee8;font:400 clamp(1.6rem,3vw,2.4rem)/1.1 "Newsreader",Georgia,serif}
    .hp-location dl{margin:0}
    .hp-location dl div{display:grid;grid-template-columns:120px 1fr;gap:16px;padding:16px 0;border-bottom:1px solid #2b2e32}
    .hp-location dl div:first-child{border-top:1px solid #2b2e32}
    .hp-location dt{color:#c8aa72;font:500 10px/1.8 "IBM Plex Mono",monospace;letter-spacing:.13em;text-transform:uppercase}
    .hp-location dd{margin:0;color:#c9ccca;font-size:14.5px;line-height:1.75}
    .hp-palette{display:flex;flex-wrap:wrap;gap:8px}
    .hp-palette span{padding:6px 12px;border:1px solid #3a3d41;border-radius:999px;color:#d9d6cd;font-size:12px}
    .hp-zones{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;background:#2b2e32;border:1px solid #2b2e32}
    .hp-zones article{padding:22px;background:#0f1113}
    .hp-zones h3{margin-top:0;font-size:1.2rem}
    .hp-cta{position:relative;overflow:hidden;margin:0 0 clamp(2.5rem,6vw,4rem);padding:clamp(2rem,6vw,4.5rem);border:1px solid rgb(200 170 114 / 35%);background:radial-gradient(ellipse at 90% 0%,rgb(200 170 114 / 16%),transparent 55%),linear-gradient(110deg,#15171a,#0f1113 75%)}
    .hp-cta>*{position:relative;max-width:720px}
    .hp-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:1.8rem}
    .hp-actions a{display:inline-flex;align-items:center;gap:12px;min-height:46px;padding:0 22px;border:1px solid rgb(200 170 114 / 55%);color:#f0eee8;font:600 11px/1 "DM Sans",sans-serif;letter-spacing:.14em;text-decoration:none;text-transform:uppercase;transition:background-color .25s ease,color .25s ease,border-color .25s ease}
    .hp-actions a:first-child{background:#c8aa72;border-color:#c8aa72;color:#0b0c0e}
    .hp-actions a:hover{background:#e1c995;border-color:#e1c995;color:#0b0c0e}
    .hp-actions a:focus-visible{outline:2px solid #e1c995;outline-offset:3px}
    .hp-actions a span{transition:transform .25s ease}
    .hp-actions a:hover span{transform:translate(2px,-2px)}
    .hp-related{display:flex;flex-wrap:wrap;align-items:center;gap:10px 22px;margin:0 0 clamp(2rem,5vw,3rem);padding-top:1.5rem;border-top:1px solid #2b2e32}
    .hp-related a{color:#c9ccca;font-size:13px;text-decoration:none;border-bottom:1px solid transparent}
    .hp-related a:hover,.hp-related a[aria-current="page"]{color:#e1c995;border-color:#e1c995}
    .hp-notice{margin:0;padding:18px 0 0;border-top:1px solid #2b2e32;color:#8f9396!important;font-size:12px!important;line-height:1.7!important}
    .fsd-house-public__footer{padding:1.5rem;text-align:center;border-top:1px solid #34312b;color:#c9c4b9;font-size:.72rem;letter-spacing:.18em;text-transform:uppercase}
    html.hp-motion [data-hp-reveal]{opacity:0;transform:translateY(22px);transition:opacity .8s cubic-bezier(.2,.7,.2,1),transform .8s cubic-bezier(.2,.7,.2,1)}
    html.hp-motion [data-hp-reveal].is-visible{opacity:1;transform:none}
    .hero [data-hp-rise]{display:block;animation:hp-rise 1s cubic-bezier(.2,.7,.2,1) both}
    .hero [data-hp-rise="2"]{animation-delay:.12s}.hero [data-hp-rise="3"]{animation-delay:.24s}
    @keyframes hp-rise{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
    @media(max-width:960px){.hp-zones{grid-template-columns:repeat(2,minmax(0,1fr))}.hp-chapters.is-four{grid-template-columns:repeat(2,minmax(0,1fr))}.hp-chapters.is-four article:nth-child(odd){padding-left:0;border-left:0}.hp-facts{grid-template-columns:repeat(2,minmax(0,1fr))}.hp-facts div:nth-child(3){border-right:0}.hp-facts div:nth-child(n+2){border-bottom:1px solid #2b2e32}}
    @media(max-width:700px){.fsd-house-public .hero{min-height:460px;padding:5rem 22px 3rem}.fsd-house-public__content{padding-inline:22px}.hp-split,.hp-block>header,.hp-location{grid-template-columns:1fr;gap:16px}.hp-horizons,.hp-chapters,.hp-chapters.is-four,.hp-zones,.hp-facts{grid-template-columns:1fr}.hp-chapters article,.hp-chapters article:not(:nth-child(3n+1)),.hp-chapters.is-four article{padding:20px 0;border-left:0}.hp-facts div{border-right:0;border-bottom:1px solid #2b2e32}.hp-facts div:last-child{border-bottom:0}.hp-location dl div{grid-template-columns:96px 1fr}.hp-actions a{width:100%;justify-content:space-between}}
    @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}[data-hp-reveal]{opacity:1;transform:none;transition:none}.hero [data-hp-rise]{animation:none}.hp-divisions article:hover{transform:none}}
`;

const arrow = '<span aria-hidden="true">↗</span>';

function renderActions(actions = []) {
  return `<div class="hp-actions">${actions.map(([label, href]) =>
    `<a href="${escapeHtml(href)}">${escapeHtml(label)} ${arrow}</a>`).join('')}</div>`;
}

function renderPublicSection(section) {
  switch (section.kind) {
    case 'lead':
      return `<section class="hp-split" data-hp-reveal>
        <p class="hp-eyebrow">${escapeHtml(section.number)}</p>
        <div><h2>${escapeHtml(section.heading)}</h2>${section.body.map(text => `<p>${escapeHtml(text)}</p>`).join('')}</div>
      </section>`;
    case 'facts':
      return `<section class="hp-facts" aria-label="${escapeHtml(section.label)}" data-hp-reveal>
        <p class="hp-eyebrow">${escapeHtml(section.label)}</p>
        ${section.items.map(([term, value]) => `<div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}
      </section>`;
    case 'horizons':
      return `<section class="hp-block" data-hp-reveal>
        <header><p class="hp-eyebrow">${escapeHtml(section.number)}</p><div><h2>${escapeHtml(section.heading)}</h2>${section.intro ? `<p>${escapeHtml(section.intro)}</p>` : ''}</div></header>
        <div class="hp-horizons">${HORIZONS.map(([label, title, text]) =>
          `<article><span>${escapeHtml(label)}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></article>`).join('')}</div>
      </section>`;
    case 'divisions':
      return `<section class="hp-block" data-hp-reveal>
        <header><p class="hp-eyebrow">${escapeHtml(section.number)}</p><div><h2>${escapeHtml(section.heading)}</h2></div></header>
        <div class="hp-divisions">${DIVISIONS.map(([letter, title, text]) =>
          `<article><b aria-hidden="true">${escapeHtml(letter)}</b><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></article>`).join('')}</div>
      </section>`;
    case 'chapters':
      return `<section class="hp-block" aria-label="${escapeHtml(section.label)}" data-hp-reveal>
        <header><p class="hp-eyebrow">${escapeHtml(section.label)}</p><div></div></header>
        <div class="hp-chapters${section.items.length === 4 ? ' is-four' : ''}">${section.items.map(([number, title, text]) =>
          `<article><span>${escapeHtml(number)}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></article>`).join('')}</div>
      </section>`;
    case 'location':
      return `<section class="hp-location" data-hp-reveal>
        <div><p class="hp-eyebrow">${escapeHtml(section.number)}</p><p class="hp-location__role">${escapeHtml(section.role)}</p><p>${escapeHtml(section.body)}</p></div>
        <dl>
          <div><dt>Place</dt><dd>${escapeHtml(section.place)}</dd></div>
          <div><dt>Architecture</dt><dd>${escapeHtml(section.architecture)}</dd></div>
          <div><dt>Palette</dt><dd><span class="hp-palette">${section.palette.map(item => `<span>${escapeHtml(item)}</span>`).join('')}</span></dd></div>
          <div><dt>Status</dt><dd>Design concept. Subject to site, planning, partner, cost and feasibility.</dd></div>
        </dl>
      </section>`;
    case 'zones':
      return `<section class="hp-block" data-hp-reveal>
        <header><p class="hp-eyebrow">${escapeHtml(section.number)}</p><div><h2>${escapeHtml(section.heading)}</h2><p>${escapeHtml(section.intro)}</p></div></header>
        <div class="hp-zones">${section.items.map(([title, text]) =>
          `<article><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></article>`).join('')}</div>
      </section>`;
    case 'gallery':
      return `<section class="hp-block hp-gallery-block" data-hp-reveal>
        <header><p class="hp-eyebrow">${escapeHtml(section.number)}</p><div><h2>${escapeHtml(section.heading)}</h2><p>${escapeHtml(section.note)}</p></div></header>
        <div class="hp-gallery${section.items.length > 2 ? ' is-grid' : ''}">${section.items.map((item, index) => `<figure class="hp-gallery__item${index === 0 && section.items.length > 2 ? ' is-wide' : ''}">
          <img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}" loading="lazy" decoding="async">
          <figcaption><b>${escapeHtml(item.label)}</b><span>${escapeHtml(section.caption)}</span></figcaption>
        </figure>`).join('')}</div>
      </section>`;
    case 'cta':
      return `<section class="hp-cta" data-hp-reveal>
        <h2>${escapeHtml(section.heading)}</h2><p>${escapeHtml(section.body)}</p>${renderActions(section.actions)}
      </section>`;
    default:
      return '';
  }
}

export function renderHousePublicPage(page) {
  const content = page ? housePublicContent(page.id) : null;
  if (!page || page.readiness !== 'PUBLIC' || !content) {
    throw new TypeError('A public House page record with published content is required.');
  }
  const pageId = escapeHtml(page.id);
  const isFlagship = page.division === 'Flagships';
  const place = isFlagship ? content.sections.find(section => section.kind === 'location')?.place : '';
  const related = isFlagship
    ? `<nav class="hp-related" aria-label="FSD flagships"><span class="hp-eyebrow">Flagships</span>${FLAGSHIP_LINKS.map(([label, href]) =>
      `<a href="${escapeHtml(href)}"${href === page.path ? ' aria-current="page"' : ''}>${escapeHtml(label)}</a>`).join('')}</nav>`
    : '';
  const notice = content.notice || STATUS_NOTICE;

  return `<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="description" content="${escapeHtml(content.description)}">
  <title>FSD | ${escapeHtml(content.title)}</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&family=Newsreader:opsz,wght@6..72,400&display=swap" rel="stylesheet">
  <style>${HOUSE_PUBLIC_STYLES}</style>
</head>
<body>
  <div class="fsd-reading-progress" aria-hidden="true"><span></span></div>
  <div data-fsd-standalone-navigation></div>
  <main class="fsd-house-public" data-fsd-house-destination="${pageId}">
    <header class="hero${content.heroImage ? ' has-image' : ''}" aria-labelledby="house-page-title">
      ${content.heroImage ? `<div class="fsd-house-media hp-hero-media"><img src="${escapeHtml(content.heroImage.src)}" alt="${escapeHtml(content.heroImage.alt)}" fetchpriority="high" decoding="async"></div>
      <p class="hero-caption">${escapeHtml(content.heroImage.caption)}</p>` : ''}
      <p class="tag"><span data-hp-rise="1">${escapeHtml(content.eyebrow)}</span></p>
      <h1 id="house-page-title"><span data-hp-rise="2">${escapeHtml(content.title)}</span></h1>
      <p class="hero-summary"><span data-hp-rise="3">${escapeHtml(content.summary)}</span></p>
      ${place ? `<p class="hero-place"><span data-hp-rise="3">${escapeHtml(place)}</span></p>` : ''}
    </header>
    <div class="fsd-house-public__content">
      ${content.sections.map(renderPublicSection).join('\n      ')}
      ${related}
      <p class="hp-notice" role="note">${escapeHtml(notice)}</p>
    </div>
  </main>
  <footer class="fsd-house-public__footer">FSD · Fitness &amp; Self Defence</footer>
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
      const items = document.querySelectorAll('[data-hp-reveal]');
      if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
        items.forEach(item => item.classList.add('is-visible'));
        return;
      }
      document.documentElement.classList.add('hp-motion');
      const observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      items.forEach(item => observer.observe(item));
    })();
  </script>
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

        const generated = HOUSE_GENERATED_PAGES.find(record => record.path === pathname);
        if (generated && generated.readiness === 'PUBLIC') {
          response.statusCode = 200;
          response.setHeader('Content-Type', 'text/html; charset=utf-8');
          response.end(renderHousePublicPage(generated));
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

      for (const fileName of ['cryo-zero.html', 'red-light-recovery.html', 'fight-promotions.html', 'live-events.html', 'broadcast-ppv.html', 'athlete-development.html', 'academy-grassroots.html', 'fsd-pods.html', 'autonomous-popups.html', 'mobile-testing-labs.html', 'local-micro-manufacturing.html', 'genetic-microbiome.html', 'community-co-creation.html', 'performance-partnerships.html', 'circular-trade-in.html', 'community-first-aid.html', 'security-vision.html']) {
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

      for (const page of HOUSE_GENERATED_PAGES) {
        if (page.readiness !== 'PUBLIC') continue;
        const path = resolve(outputRoot, page.buildFile);
        await mkdir(dirname(path), { recursive: true });
        let html = renderHousePublicPage(page).replace(
          '<script type="module" src="/src/standalone-navigation.js"></script>',
          scriptTag,
        );
        if (stylesheetLinks) html = html.replace('</head>', `    ${stylesheetLinks}\n  </head>`);
        await writeFile(path, html);
      }

      for (const fileName of HOUSE_DRAFT_BUILD_FILES) {
        const path = resolve(outputRoot, fileName);
        await unlink(path).catch(error => {
          if (error.code !== 'ENOENT') throw error;
        });
      }
    },
  };
}
