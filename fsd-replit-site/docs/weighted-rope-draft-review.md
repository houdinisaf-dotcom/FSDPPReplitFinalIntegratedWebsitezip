# Weighted skipping rope — draft review

Open `/__catalogue-preview/weighted-skipping-rope/` in the development preview.
This is a read-only, **development-only** product review, not a public catalogue
listing or an authenticated admin. The storefront still contains its original
66 listings. Production build does not include this page, draft data or media.

## Approved supplied imagery

One unchanged athlete campaign remains independent of colour selection.
The eight editions are Crimson Red, Deep Ultraviolet Plum, Electric Cobalt Blue,
Electric Fuchsia, Electric Green, Hyper Flame Orange, Matte Obsidian and
Sunbeam Yellow. Each has four extracted views: product view 1, product view 2,
rope detail and handle/shield detail.

All nine original attachments remain byte-identical. The eight source boards
remain available from the review page. Crops are lossless PNG pixel extractions;
only the central divider strip is omitted. No recolouring, redrawing, shield
modification, sharpening or new imagery is involved. Composition labels are
not engineering claims or inferred front/back specifications.

`content/weighted-skipping-rope-images.json` records exact input files, approval,
colour names, UI swatch tints and crop coordinates. Approximate swatch tints affect
only the buttons, never the photographs. `content/catalogue.json` retains the
single rope preparation with `id: null`, status Draft and purchasing disabled.
Its internal `draft:` UI key is not a product ID or SKU.

## Regeneration and verification

```sh
cd fsd-replit-site
npm run catalogue:rope-images
npm run catalogue:validate
npm run catalogue:preview -- --key weighted-skipping-rope
npm test
node tests/browser-weighted-rope.mjs
npm run build
```

The generator creates 32 PNG crops and responsive WebP display copies under the
ignored `generated-artifacts/fsd-weighted-rope/` directory. Nothing is copied
into public assets. Draft page data requests can regenerate missing outputs in
a separate process without blocking the storefront server. Run the image command
again after changing an approved source or recipe.

The Vite-only read adapter serves an exact media allowlist with no-index/no-store
headers; it has no upload/write endpoint. Raw content, attachments and generated
directories are denied by the main development server. This is not a substitute
for authentication if a future hosted private-review service is requested.

The existing Phase 2 gallery, fullscreen viewer, zoom, keyboard, swipe and load-
failure handling are reused. Phase 4 controls bind each colour to its own four
views. Selection commits only after successful loading; rapid choices discard
stale requests. Crossfade is bounded and disabled for reduced motion. Campaign
image and page location are not changed when choosing colours.

Price, SKU, inventory, sizes, technical specifications and precise catalogue
placement remain unprovided. They are not inferred from the pictures. No public
ID or permalink is assigned, no Product/Offer structured data is created and no
publication, checkout or payment permission is granted.
