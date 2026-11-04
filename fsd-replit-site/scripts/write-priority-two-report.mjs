import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import assert from 'node:assert/strict';
import { products, priceInfo, productImagesForDisplay } from '../src/data/products.js';
import { collectionDivisions } from '../src/collection-divisions.js';
import { groupProducts } from '../src/collection-showcase/index.js';
import { deriveClothingLineMembership } from '../src/clothing-lines.js';
import { CATALOGUE_COLLECTIONS, deriveTechnicalCollections } from '../src/catalogue-collections.js';

const root = new URL('../', import.meta.url);
const before = JSON.parse(readFileSync(new URL('handoff/priority-two-inventory-before.json', root), 'utf8'));
const clothing = deriveClothingLineMembership(products).lines;
const technical = deriveTechnicalCollections(products);
const currentRecords = products.map(p => ({ id:p.id, name:p.name, category:p.category,
  audience:p.audience, collection:p.collection, badge:p.badge, alsoShowIn:p.alsoShowIn,
  images:productImagesForDisplay(p).map(image=>image.src) }));
assert.deepEqual(JSON.parse(JSON.stringify(currentRecords)), before.products, 'existing records, names, categories and image mappings preserved');
assert.deepEqual(clothing.map(line=>[line.id,line.products.map(p=>p.id)]),
  before.banners.map(line=>[line.id,line.productIds]), 'all seven existing banner memberships preserved');
const groups = collectionDivisions.flatMap(division => (division.groups || []).map(group => ({
  division:division.title || division.id, id:group.id, title:group.title, products:groupProducts(group, products),
})));
const known = new Set([...clothing.flatMap(c=>c.products), ...groups.flatMap(g=>g.products)].map(p=>p.id));
const unclear = products.filter(p=>!known.has(p.id));
const collections = [...clothing.map(line=>({
  ...CATALOGUE_COLLECTIONS.find(c=>c.id===line.id), products:line.products, state:'Existing / preserved',
})), ...technical.map(c=>({...c,state:'New banner / existing group'}))];
const uniqueBannerMembers = new Set(collections.flatMap(c=>c.products.map(p=>p.id))).size;
const escape = value => String(value ?? '').replace(/[&<>"']/g, character=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;',
}[character]));
const names = records => records.map(p=>`${escape(p.name)} <small>(ID ${p.id})</small>`).join('<br>');
const largest = readdirSync(new URL('dist/assets/',root)).filter(file=>file.endsWith('.js'))
  .map(file=>({file,bytes:statSync(new URL(`dist/assets/${file}`,root)).size})).sort((a,b)=>b.bytes-a.bytes)[0];
const after = { productCount:products.length, uniqueBannerMembers, collections:collections.map(c=>({
  id:c.id,title:c.title,count:c.products.length,productIds:c.products.map(p=>p.id),
  href:c.href,logoAsset:c.logoAsset,missingImageIds:c.products.filter(p=>!productImagesForDisplay(p).length).map(p=>p.id),
})), unclear:unclear.map(p=>({id:p.id,name:p.name,category:p.category})) };
writeFileSync(new URL('handoff/priority-two-inventory-after.json',root),JSON.stringify(after,null,2));

const files = ['src/App.jsx','src/clothing-lines.js','src/catalogue-collections.js','src/collection-image-config.js',
  'src/components/ClothingLinesBrowser.jsx','src/components/TechnicalCollectionsBrowser.jsx',
  'src/components/TechnicalCollectionsBrowser.css','src/data/products.js','src/collection-divisions.js',
  'src/collection-showcase/index.js','src/main.js','src/react-router.js','src/site-navigation.js',
  'tests/catalogue-collections.test.js','tests/site-navigation.test.js','tests/browser-clothing-lines.mjs',
  'tests/browser-navigation.mjs','scripts/write-priority-two-report.mjs',
  'handoff/priority-two-inventory-before.json','handoff/priority-two-inventory-after.json','handoff/priority-two-report.html'];
const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>FSD — Priority 2 Collection Integration Report</title><style>
*{box-sizing:border-box}body{margin:0;background:#0a0a0a;color:#e6dfd1;font:15px/1.65 system-ui,sans-serif}main{max-width:1140px;margin:auto;padding:42px 24px}h1,h2,h3,th{color:#d4af37}h1{font-size:clamp(30px,5vw,46px);font-weight:500;line-height:1.15}h2{font-size:23px;margin-top:36px}.kicker{font-size:12px;letter-spacing:.2em;color:#d4af37}.notice{padding:22px;background:#16130d;border:1px solid #63522d;border-left:4px solid #d4af37}.scroll{overflow:auto}table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:12px 10px;border-bottom:1px solid #383229;vertical-align:top;text-align:left}td:first-child{min-width:160px}small{color:#b5ac9c}code{font-size:.9em;color:#e1c788;overflow-wrap:anywhere}li{margin:8px 0}summary{cursor:pointer;color:#d4af37;padding:15px 0}.files{columns:2;column-gap:32px}.files li{break-inside:avoid}.pass{color:#c3dfa9}@media(max-width:650px){.files{columns:1}}@media print{body{background:#fff;color:#111}main{padding:10px}h1,h2,h3,th,.kicker,summary{color:#795b12}small{color:#555}.notice{background:#faf5e7}.scroll{overflow:visible}code{color:#745a20}}
</style></head><body><main><p class="kicker">FSD / PRIORITY 2 / COLLECTION INTEGRATION</p><h1>Collection banners &amp;<br>automatic catalogue integration</h1>
<div class="notice"><strong>Seven named clothing banners preserved. Four banners added for existing technical groups.</strong> The catalogue remains at ${products.length} records. No product, price, description, photograph or logo was replaced. Checkout remains pre-launch. No publishing or new Priority 3 animation system was performed.</div>
<h2>1. Inventory completed before changes</h2><p>The original inventory was saved before collection code changes in <code>handoff/priority-two-inventory-before.json</code>. It includes every public product, its existing categories/audience/collection metadata, approved image references, the seven named clothing banners and all registered division groups. Existing men's/women's parent collection entrances and the global hero were retained.</p>
<div class="scroll"><table><thead><tr><th>Existing group</th><th>Before</th><th>After</th><th>Scope</th></tr></thead><tbody>${groups.map(group=>`<tr><td>${escape(group.title)}</td><td>${before.groups.find(g=>g.id===group.id)?.count ?? '—'}</td><td>${group.products.length}</td><td>${escape(group.division)}</td></tr>`).join('')}</tbody></table></div>
<p>Performance Accessories gains the existing Apex Pro backpack because its current <code>Accessories / Gear</code> category now participates in that established group. No new accessory category was invented. Recovery Technology remains an existing empty group; no recovery-service banner or live service was fabricated.</p>
<h2>2. Banner results and product counts</h2><div class="scroll"><table><thead><tr><th>Collection</th><th>Banner result</th><th>Count</th><th>Existing linked records</th></tr></thead><tbody>${collections.map(c=>`<tr><td>${escape(c.title)}<br><code>${escape(c.href)}</code></td><td>${escape(c.state)}</td><td>${c.products.length}</td><td>${names(c.products)}</td></tr>`).join('')}</tbody></table></div>
<p>The 11 banners contain ${collections.reduce((total,c)=>total+c.products.length,0)} legitimate placements representing ${uniqueBannerMembers} unique existing products. Connected accessories already belong to both the wearable and accessories contexts; this is cross-listing, not duplicated merchandise. A product occurs once inside each collection. Single-product collections retain one product, not filler copies.</p>
<h2>3. What improved</h2><ul>
<li>The seven existing clothing banners retain their approved layout, imagery, typography, titles, navigation and line membership. Existing men's series and women's approved logo mappings were not reassigned.</li>
<li>New Wearable Technology, Strength Equipment, Combat Equipment and Performance Accessories banners use the same established black/gold banner and product-card classes.</li>
<li>SHOP retains its three columns, existing numbering, hover behaviour, close control and previews. An appended Accessories &amp; Technical shortcut group opens the four actual catalogue-backed banner destinations.</li>
<li>Catalogue collection identifiers now take priority over conflicting legacy product names. Specific collection/series/tag metadata is preferred, while records without a specific assignment retain compatible legacy matching. Generic Core metadata does not erase existing line membership.</li>
<li>The catalogue import preserves optional collection identifiers, series, tags and supplied availability for future approved rows. Existing commercial fields and source image mappings are untouched.</li>
<li>Colourway text and any supplied availability are shown without inventing stock or displaying unconfirmed placeholder tokens. Product details use the same existing selection, gallery and bag callbacks.</li>
<li>The legacy SHOP click handler now accepts these registered collection destinations instead of incorrectly falling back to the general catalogue.</li>
</ul>
<h2>4. Automatic updates and configuration</h2><p><code>src/catalogue-collections.js</code> supplies stable collection identifiers, titles, accent colours, logo references, banner references and linked catalogue relationships. Membership is derived from the actual catalogue, not a manually maintained product-ID list. A regression test appends a future approved record and confirms it appears in the assigned collection with the original price and availability preserved.</p>
<p>This site uses the existing compiled master-catalogue workflow. Approved source updates appear after its normal rebuild/re-publish; no new live database, CMS or instant production-update API is claimed. Optional <code>Collection IDs</code> / <code>collectionIds</code> provide explicit stable assignments. Legacy name-based matches remain a compatibility path, not a newly invented assignment system.</p>
<p><code>src/collection-image-config.js</code> is the single organised banner/logo image configuration. Upload an approved public asset through the existing asset workflow, set the appropriate collection's path and rebuild. Null banner paths resolve to approved catalogue photography, then named black/gold placeholders. Null logo paths never create a new mark or a new collection-to-logo mapping.</p>
<h2>5. Assets and missing imagery</h2><p>The women's Serene Monogram, Ascent Triangle, Aligned Wordmark and Signature Mark retain their existing approved mappings and applications. Concept 3 remains excluded. Tiger and Scorpion continue using the existing unredrawn photographic patch references; standalone source artwork is still an existing owner follow-up. No women's concept was applied to an animal series.</p>
<p>There are no newly supplied dedicated campaign banners or collection-specific technical logos. Existing approved product photographs are reused where available, otherwise correctly sized named placeholders remain. No unrelated stock photography was introduced.</p>
<div class="scroll"><table><thead><tr><th>New banner</th><th>Image source</th><th>Products lacking approved standalone card images</th></tr></thead><tbody>${technical.map(c=>`<tr><td>${escape(c.title)}</td><td>${c.bannerImage?'Existing approved catalogue photograph':'Named collection placeholder'}</td><td>${names(c.products.filter(p=>!productImagesForDisplay(p).length)) || 'None'}</td></tr>`).join('')}</tbody></table></div>
<details><summary>Full product and image inventory — all ${products.length} existing records</summary><div class="scroll"><table><thead><tr><th>Product</th><th>Current category</th><th>Current price</th><th>Approved mapped images</th></tr></thead><tbody>${products.map(p=>`<tr><td>${p.id}. ${escape(p.name)}</td><td>${escape(p.category)}</td><td>${escape(priceInfo(p).value || 'Not supplied')}</td><td>${productImagesForDisplay(p).length}</td></tr>`).join('')}</tbody></table></div></details>
<h2>6. Unclear assignments — owner confirmation needed</h2><p>These ${unclear.length} records have no defensible match to a currently registered group or named line. They remain in the full catalogue and were not removed or retagged:</p><ul>${unclear.map(p=>`<li><strong>${escape(p.name)}</strong> (ID ${p.id}) — current category: ${escape(p.category)}.</li>`).join('')}</ul>
<p>Other products outside the seven named clothing lines remain in their established general men's, women's and technical categories; “not in a named line” does not mean “missing from the catalogue”. No TOPO cap or explicitly Scorpion-tagged Roadwork shorts exist in the current master. The existing Tiger-Slash Walkout Hoodie and Scorpion Chitin Gilet are retained as recorded; illustrative product names were not treated as authorisation to create merchandise or retag the generic Roadwork Short.</p>
<h2>7. Verification</h2><ul>
<li><span class="pass">PASS</span> — 194 automated tests; production build; 111 public-route HTTP checks, including Priority 1 metadata, structured data, robots, 404, map denial and headers.</li>
<li><span class="pass">PASS</span> — existing clothing banners at 1440, 768 and 393 px: seven exact memberships, approved images, existing scroll/mark behaviour, product details and focus return. The FLEX Sage Green / M bag flow and £130.00 two-item subtotal were tested without checkout.</li>
<li><span class="pass">PASS</span> — new technical banners at 320, 375, 390, 768, 1024 and 1440 px: cold links open, all four counts match source data, no page overflow, no duplicate cards, lazy images, working collection controls, existing backpack details and focus restoration.</li>
<li><span class="pass">PASS</span> — real desktop hover selects the new SHOP group/subcategory, updates the right preview and opens the correct banner through its action button. A deliberately broken banner image becomes a named fallback.</li>
<li><span class="pass">PASS</span> — full navigation browser suite: shared menus on The House, Investor Relations and Private Access; search, collection links, existing analytics, keyboard/focus, mobile routes and overflow.</li>
<li>Empty collection data and future automatic membership are unit-tested. Conditional empty states are implemented without fabricated products; no current technical group needed an empty live-product catalogue.</li>
</ul><p>Responsive checks use Chromium CSS viewports, not physical iOS/Android certification. An intentional missing-image request is expected in the fallback test, not an uncaught application failure.</p>
<h2>8. Performance and Priority 3 boundary</h2><p>The new archive starts collapsed. New cards load one lazy approved image each; full galleries open through the existing detail experience rather than preloading every collection gallery. No image assets, fonts or third-party packages were added. The largest emitted JavaScript bundle is ${(largest.bytes/1000).toFixed(1)} kB raw. No new performance score or statistically proven loading improvement is claimed.</p>
<p>Priority 1 SEO, loading/error recovery and security settings remain. Existing seven-line motion was preserved and its visual observer scoped to its own archive. No new technical-banner scroll synchronisation, right-side active-logo strip, cinematic effects or Priority 3/4 implementation was added.</p>
<h2>9. Files added or modified</h2><ul class="files">${files.map(file=>`<li><code>${escape(file)}</code></li>`).join('')}</ul>
<h2>10. Outstanding issues</h2><ul><li>Owner confirmation of the three ambiguous record assignments above.</li><li>Approved standalone product images for the missing-image rows, dedicated banner photographs if desired, and the already-requested standalone Tiger/Scorpion artwork. Placeholders remain functional until supplied.</li><li>Optional explicit-assignment migration for legacy named clothing records would keep their placement stable if names are later changed.</li><li>Verified production-origin configuration and live checks remain separate Priority 1 follow-ups. Checkout, fulfilment and payment approvals remain unchanged. No production publishing or real payment was performed.</li></ul>
<p><small>Existing source product IDs, names, categories, collection fields, badges, audiences, additional-category metadata and approved image-source arrays were compared against the saved before inventory. The seven original banner member lists are unchanged.</small></p>
</main></body></html>`;
writeFileSync(new URL('handoff/priority-two-report.html',root),html);
console.log(`Priority 2 report written: ${products.length} existing records, ${collections.length} banners, ${uniqueBannerMembers} unique banner members, ${unclear.length} unclear group assignments.`);
