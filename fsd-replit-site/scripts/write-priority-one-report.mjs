import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
const read = name => JSON.parse(readFileSync(new URL(`../../generated-artifacts/priority-one-${name}.json`, import.meta.url), 'utf8'));
const before = read('before');
const after = read('after');
const checks = [
  ['Preview versus production domain','NEEDS FIX','NEEDS FIX','Development and local production-build checks are available. The deployment service still reports no active deployment or production URL.'],
  ['Unique page titles','PASS','PASS','111 actual public routes retain unique server-delivered titles, with route-aware browser updates.'],
  ['Meta descriptions','PASS','PASS','Public pages retain relevant descriptions, including The House and Investor Relations.'],
  ['Approved FSD favicon','NEEDS FIX','PASS','The previous custom SVG was an approximation. It has been replaced with a container embedding pixels from the approved shield raster, plus PNG application icons. No shield paths were redrawn.'],
  ['Open Graph imagery','PASS','PASS','Existing product images remain mapped; a new 1200×630 brand social card combines existing campaign photography with the approved website lockup.'],
  ['Canonical URLs','NEEDS FIX','NEEDS FIX','Generator is implemented. Output remains intentionally withheld until a real production origin has been verified.'],
  ['Live social previews','NEEDS FIX','NEEDS FIX','Metadata and local image requests pass. External platform rendering cannot be checked without an accessible production URL.'],
  ['Custom 404','PASS','PASS','The branded page and genuine HTTP 404/HEAD responses remain functional; missing assets do not fall back to homepage HTML.'],
  ['Professional loading states','NEEDS FIX','PASS','Generic catalogue loading text replaced with an FSD shield, live status and restrained gold skeletons; reduced-motion preference is respected.'],
  ['Helpful error and retry states','NEEDS FIX','PASS','A failed catalogue chunk now gives a visible error, keeps the saved bag and offers a keyboard-accessible reload. Deliberately blocking and then retrying the chunk was tested. Errors remain logged rather than hidden.'],
  ['H1 structure','PASS','PASS','Active storefront H1 and existing standalone H1 preserved. Server HTML contains meaningful no-JavaScript product/collection headings without duplicating visible live sections.'],
  ['Descriptive image alt intent','PASS','PASS','No missing alt attributes in rendered homepage checks at all six widths. Existing product names, captions and colourway descriptions remain. Decorative images retain intentional empty alt.'],
  ['Public sitemap','NEEDS FIX','NEEDS FIX','Actual-route generator is ready, but no fabricated sitemap is emitted without a verified origin. Exclusions now also handle hyphenated private/admin/cart/checkout paths.'],
  ['Browser console errors','PASS','PASS','Normal tested browser contexts had no uncaught errors. The deliberately blocked catalogue logs its handled failure. Live-production console verification is not applicable until publishing.'],
  ['Development logging','PASS','PASS','No new frontend debugging log statements. Useful application errors and the server startup log remain. Development-only Vite/React notices are not production failures.'],
  ['Production source maps','PASS','PASS','Build maps remain disabled and map requests return 404. Source-map hiding is not treated as application security.'],
  ['JavaScript bundle size','PASS','PASS','Largest individual bundle remains the approximately 223 kB raw React vendor chunk. Initial JS measurement increased slightly with the added metadata/recovery functionality; no overall transfer reduction is claimed.'],
  ['Mobile and tablet layout','NEEDS FIX','PASS','320, 375, 390, 768 and 1024 px, plus 1440 px desktop: no page overflow; SHOP, product dialogs, bag and men/women filters fit. Three undersized product buttons were confirmed and corrected.'],
  ['Spacing and touch targets','NEEDS FIX','PASS','Return-to-House and both size-guide buttons now have at least 44 px minimum height. Tested product buttons no longer fall below the 24 px accessibility minimum. Existing desktop layout is preserved.'],
  ['Main links and shopping controls','PASS','PASS','Navigation suite, collection links, search/filter checks, product handoff, colour/size selection, bag quantities/subtotals, native browser-back restoration and gallery checks passed. Checkout remains pre-launch; no real payment was attempted.'],
];
const tableRows = checks.map((row,index) => `<tr><td>${index+1}. ${row[0]}</td><td class="${row[1]==='PASS'?'pass':'fix'}">${row[1]}</td><td class="${row[2]==='PASS'?'pass':'fix'}">${row[2]}</td><td>${row[3]}</td></tr>`).join('');
const measurements = after.map(row => {
  const previous = before.find(item => item.width === row.width);
  return `<tr><td>${row.width}px</td><td>${Math.round(previous.fcp)} / ${Math.round(row.fcp)}</td><td>${Math.round(previous.lcp)} / ${Math.round(row.lcp)}</td><td>${previous.cls.toFixed(6)} / ${row.cls.toFixed(6)}</td><td>PASS</td></tr>`;
}).join('');
const files = [
  'src/site-seo.js','src/product-structured-data.js','src/product-detail-page.js','src/product-detail.css',
  'src/App.jsx','src/components/CatalogueLoadState.jsx','src/components/CatalogueLoadState.css',
  'src/womens-collection-preview.js','src/proof-data-validation.js',
  'server.js','scripts/site-seo-plugin.mjs','scripts/generate-brand-icons.mjs','scripts/write-priority-one-report.mjs',
  'public/favicon.svg','public/site.webmanifest','public/brand/favicon-{16,32,48,64,180,192,512}.png',
  'public/brand/apple-touch-icon.png','public/brand/fsd-social-preview.jpg',
  'tests/priority-one.test.js','tests/site-seo.test.js','tests/browser-priority-one.mjs',
  'tests/browser-showroom.mjs','tests/production-http-audit.mjs',
  'handoff/priority-one-audit.html',
];
const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>FSD — Priority 1 Audit &amp; Launch Readiness</title><style>
*{box-sizing:border-box}body{margin:0;background:#0a0a0a;color:#e7e0d2;font:15px/1.65 system-ui,sans-serif}main{max-width:1160px;margin:auto;padding:44px 24px}h1,h2,h3,th{color:#d4af37}h1{font-size:clamp(30px,5vw,48px);line-height:1.15;font-weight:500}h2{margin-top:38px;font-size:23px}h3{font-size:17px}p{max-width:94ch}.kicker{color:#d4af37;letter-spacing:.2em;font-size:12px;text-transform:uppercase}.notice{padding:22px;border:1px solid #665226;background:#16130d;border-left:4px solid #d4af37}.scroll{overflow:auto}table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:12px 10px;text-align:left;vertical-align:top;border-bottom:1px solid #38332a}td:first-child{min-width:185px}.pass{color:#bfe1ad}.fix{color:#f1cc7b}li{margin:8px 0}code{color:#ddc58a;font-size:.9em;overflow-wrap:anywhere}.files{columns:2;column-gap:32px}.files li{break-inside:avoid}small{color:#bdb5a6}
@media(max-width:650px){.files{columns:1}}@media print{body{background:white;color:#111}main{padding:10px}h1,h2,h3,th,.kicker{color:#795b12}.notice{background:#faf5e7}.pass{color:#306421}.fix{color:#895900}code{color:#775e2b}.scroll{overflow:visible}}
</style></head><body><main><p class="kicker">FSD / Priority 1 / 4 November 2026</p>
<h1>Website audit, SEO,<br>mobile &amp; launch readiness</h1>
<div class="notice"><strong>Priority 1 implementation is ready for owner review.</strong> This is not a live-commerce or security-clearance certificate. No deployment was performed. Priorities 2, 3 and 4 have not been started.</div>
<p>The existing FSD website, black/gold styling, typography, master shield, approved women's Concepts 1, 2, 4 and 5, Tiger and Scorpion lines, products, prices, collections and gallery/cart behaviour were preserved. Concept 3 remains excluded. No product records, original photographs, stock levels, reviews, addresses or certifications were invented.</p>
<h2>1. Twenty-point results</h2><p>“Before” describes the site at the start of this Priority 1 extension, after the earlier audit fixes. PASS applies only to the stated checks, not to an unavailable live deployment.</p>
<div class="scroll"><table><thead><tr><th>Check</th><th>Before</th><th>After</th><th>Evidence / limitation</th></tr></thead><tbody>${tableRows}</tbody></table></div>
<h2>2. Confirmed issues and fixes</h2><ul>
<li>Approximate favicon geometry: replaced with approved-raster derivatives, not a new drawing. Sizes 16, 32, 48, 64, 180, 192 and 512 px are available; Apple icon and a browser-display manifest are linked. The 512 px icon is upscaled from the supplied 261×273 raster, not a vector master or newly generated detail.</li>
<li>Three undersized controls: the existing Return-to-House and size-guide buttons now have 44 px minimum tap height. The desktop arrangement and product data were not redesigned.</li>
<li>Generic catalogue loading and no useful chunk-failure recovery: replaced with restrained branded loading, reduced-motion support, an explicit error boundary and an accessible reload. No application failure is silently concealed.</li>
<li>Missing server-delivered product/collection structured data: shared schema generation now serves actual public records and is also used by the existing product details. Unconfirmed placeholder fields are omitted.</li>
<li>Development proof-data risks: numeric counts/dimensions are validated and asset/link URLs are restricted to local paths, rejecting JavaScript, protocol-relative and backslash URL inputs. Existing text escaping remains in place.</li>
<li>Production cleanup: a narrow Content-Security-Policy restricts base URLs and embedded objects without blocking the existing inline code, Replit preview or future gallery integrations. Private/admin/cart/checkout URL patterns get noindex handling; map and source-file probes return 404.</li>
</ul>
<h2>3. SEO completed and deliberately withheld</h2><p>The 111-route title/description, social metadata and branded 404 foundation remains intact. Product/ProductGroup and collection ItemList data is emitted from existing records. Advertised confirmed prices are represented as published-price properties. Offers are emitted only when an explicit known availability value and confirmed price exist; there are no fabricated InStock claims, ratings, reviews, addresses or certifications.</p>
<p>Canonical links, an absolute public-route sitemap, breadcrumb item URLs and absolute structured-data IDs are ready but wait for a verified HTTPS production origin. The development domain is not substituted. Unknown stock data also prevents any promise of merchant rich-result eligibility. Google rich-results and external social-card rendering have not been certified on a live domain.</p>
<h2>4. Mobile and functional results</h2><p>All requested widths—320, 375, 390, 768 and 1024 px—plus 1440 px desktop were tested against the local production build using Chromium CSS viewports at scale 1, not physical iOS/Android devices. Each checked homepage overflow, rendered alt intent, font completion, SHOP menu fit, existing FLEX gallery handoff, Sage Green / M selection, actual bag handoff, quantity/subtotal updates, men/women filters and native back navigation.</p>
<p>The broader navigation suite passed search, links, keyboard/focus and panel behaviour. Gallery checks passed keyboard/swipe, exact variants, full-screen imagery, zoom/drag pan, nested close/focus and scroll restoration at 1440, 768 and 393 px, including missing-image/absent-3D fallbacks and reduced motion. The 320 px product entry was also visually inspected. Native pinch behaviour and real-device Safari remain outside this desktop harness.</p>
<p>Checkout remains intentionally pre-launch. No real payments, orders, refunds or fulfilment actions were submitted.</p>
<h2>5. Measured performance before / after</h2>
<p>Single local samples per viewport, HTTP production server, network cache disabled, no mobile bandwidth or CPU throttling. Measurements were taken after fonts settled and a short initial-render observation. The first viewport in each pass also includes colder browser/runtime startup. These are diagnostic samples, not Lighthouse scores, field Core Web Vitals or statistically proven improvements.</p>
<div class="scroll"><table><thead><tr><th>Viewport</th><th>FCP before / after, ms</th><th>LCP before / after, ms</th><th>CLS before / after</th><th>Layout / controls</th></tr></thead><tbody>${measurements}</tbody></table></div>
<p>Initial JavaScript resource bodies: ${(before[0].jsBytes/1000).toFixed(1)} kB before / ${(after[0].jsBytes/1000).toFixed(1)} kB after, locally served without gzip. The small increase is disclosed rather than described as a speed saving. Largest vendor chunk remains approximately 223 kB raw / 69 kB gzip; the main chunk is approximately 135 kB raw / 40 kB gzip. Deferred motion, high-priority hero loading, offscreen lazy images, reserved image dimensions, font strategy and immutable hashed-asset caching were preserved. Functioning animations were not removed. Existing responsive WebP/product mappings were retained; no unmeasured recompression of original photographs was performed.</p>
<h2>6. Security findings</h2><div class="notice"><strong>No critical or high findings returned.</strong> Dependency audit: 0 reported vulnerabilities. Dataflow/privacy scan: 0 findings. Static scan: 4 medium XSS warnings remain in <code>src/womens-collection-preview.js</code>.</div>
<p>Those warnings concern the development-only string-template proof renderer. Text was already HTML-encoded; new validation constrains local URLs and numeric fields. Malicious-URL and numeric-injection regression tests pass, but the static scanner still flags the four sinks. They are not suppressed or described as cleared. Further review or a DOM-only renderer would be appropriate before promoting that tool beyond its development scope.</p>
<p>A production-build request to the development proof route returns 404. Environment checks inspected secret existence only; no secret values were accessed or printed. Source-map absence, nosniff, referrer policy and the narrow CSP are defence-in-depth, not authentication or a full strict-CSP/penetration-test clearance. Existing authorization boundaries were not replaced. No new login, integration or payment service was installed.</p>
<h2>7. Checks actually run</h2><ul>
<li><code>npm test</code>: 189 tests passed; Vite production build passed.</li>
<li><code>node tests/production-http-audit.mjs</code>: 111 routes, metadata and structured data, sharing-image HEAD requests, branded 404/HEAD, manifest MIME, robots, map denial, source/private-route probes, CSP and immutable vendor caching.</li>
<li><code>node tests/browser-priority-one.mjs before</code> and <code>after</code>: six-width production-build diagnostics. The after pass also verifies quantities/subtotal, native back, deliberately blocked catalogue chunk, visible error, retry and successful recovery.</li>
<li><code>node tests/browser-navigation.mjs</code> and <code>node tests/browser-luxury-gallery.mjs</code>: shared navigation and gallery regressions passed.</li>
<li>Dependency, static and dataflow scanners ran. Static scan was repeated after validation hardening and still reports the four medium warnings documented above.</li>
</ul>
<h2>8. Files added or modified</h2><p>Paths below are relative to <code>fsd-replit-site/</code>. Generated measurements are in the ignored <code>generated-artifacts/</code> directory at workspace root.</p><ul class="files">${files.map(file=>`<li><code>${file}</code></li>`).join('')}</ul>
<p>Project notes also record the owner's review gate in <code>.agents/memory/launch-priority-gate.md</code> and its index. Original logo sources, product photography and catalogue master records were not edited.</p>
<h2>9. Remaining launch blockers and owner inputs</h2><ol>
<li><strong>Production URL:</strong> owner-led publishing is still required. Once the deployment service supplies the real URL, configure <code>site.config.js</code>, rebuild and republish; then verify canonical links, sitemap, breadcrumbs, production console, external social cards and rich-result diagnostics.</li>
<li><strong>Commercial launch:</strong> checkout/payment-provider setup, delivery/returns, support, privacy and fulfilment approvals remain separate requirements. Outbound notification delivery has not been certified. Do not describe the current disabled checkout as live commerce.</li>
<li><strong>Security review:</strong> retain the four medium development-tool warnings for review. No claim of complete application security or production authorization testing is made.</li>
<li><strong>Optional higher-quality assets:</strong> an authored transparent/vector shield would improve large application icons; the working derivatives use the existing approved raster. Genuine 3D models or complete approved rotation sequences remain necessary for true 3D/360; the existing photo galleries continue to work without them.</li>
<li><strong>Review gate:</strong> owner review of Priority 1 is required before Priority 2, 3 or 4. None was started.</li>
</ol><p><small>Audit scope: existing FSD code, development preview and local production build. No publishing, production-database mutation, real payment or source-artwork redesign was performed.</small></p></main></body></html>`;
const destination = new URL('../handoff/priority-one-audit.html', import.meta.url);
mkdirSync(new URL('../handoff/', import.meta.url), { recursive: true });
writeFileSync(destination, html);
console.log('Written handoff/priority-one-audit.html from actual before/after measurement files.');
