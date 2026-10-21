# FSD Phase 4 review

## What changed

- `signature-ui.js/css` and minimal `main.js` wiring: one directional, interaction-
  only liquid-metal CTA; real announcement destination; restrained selected
  card/filter/gallery accents. Fine-pointer behaviour is event-driven and
  cancelled on exit/preference changes. Keyboard, touch and reduced motion use
  accessible static alternatives. No animation library or continuous loop.
- `catalogue-model.js`, asset/record manifests, private preparation file and
  `catalogue-data.js`: additive schema and review gates; no master-list rewrite.
- `product-options.js/css`, `product-experience.js`: colour-specific galleries,
  honest missing-image states, explicit content status and optional SKU/sizes.
  Native dialog, source restoration, viewer, touch, zoom and prior story remain.
- `product-assets.js`, responsive copies, image preparation command and additive
  card/story/showroom image attributes: originals unchanged; dimensions,
  responsive selection, lazy loading and full-resolution viewer preserved.
- `product-seo.js`, prerender command and build wiring: clean product links,
  unique metadata/H1 and existing-record HTML output. No draft publication.
- `scripts/catalogue-content.mjs`: validation, read-only preview and gated export.
- Additional catalogue/model/browser tests and workflow documentation.

## Prepared records / outstanding information

| Record | Preserved source | Review state and missing items |
|---|---|---|
| Aeroforge Women’s short sleeve | 38; £39.99; four listed colourways | Private preparation; images, specifications, sizes and precise subcategory approval needed |
| Aeroforge Women’s long sleeve | 39; £49.99; Black/Lime | Separate record, not merged with short sleeve; images, sizes and precise subcategory approval needed |
| Velocity sports hijab | 43; £29.99; Black/Gold | Existing approved main image retained; content/manufacturer review, technical details and sizes outstanding |
| Signature sports bag | 56; £79.99; Black/Gold | Not COMMAND bag 55; imagery/specifications and precise subcategory approval needed |
| Training socks 3-pair pack | 57; £19.99; Black/Gold | Images, sizes/specifications and precise subcategory approval needed |
| Weighted skipping rope | No verified source ID or price | Private draft only. Eight colourways not verified; none invented. Source, imagery, specifications and placement approval needed |

Existing category/cross-list relationships remain. General Women’s Performance
products are not silently recategorised as Modest Combat. Known Velocity
placement is Performance Hijabs; uncertain detailed placements are flagged.

## Demonstrations and limits

Velocity has the existing approved supplied hero and an honest single colour.
Cheetah Windrunner demonstrates three genuinely mapped colour variants and
atomic gallery changes without new artwork. Existing Aeroforge colours
demonstrate the explicit no-approved-image state. None acquires sizes, SKUs,
inventory or technical claims merely to make a control look complete.

The six original mapped images total 15,834,143 bytes. Twenty-two non-destructive
responsive copies total 4,327,356 bytes across all sizes; the browser requests an
appropriate copy, not every size. Originals and existing branding are retained.
The main runtime remains vanilla JS/Vite with no additional package dependency.

There is intentionally no browser admin, upload service, automatic publisher,
checkout or payment behaviour. The logo, primary header, approved collection
structure, Phases 1–3 and existing product designs are preserved. Prior B+/A+
design proofs are not applied by this work. No website has been published.

The known cold-load layout-shift review remains separate; this phase does not
claim to resolve it. New/private products cannot appear until their missing
source evidence, asset approvals, precise placement and publication permissions
have been supplied.

## Verification

- 38 unit tests passed.
- 22 browser scenarios passed across the earlier phases and new catalogue work:
  desktop/tablet/mobile, reduced motion, missing animation APIs, failed image
  recovery/retry, galleries/viewer, history/focus restoration and Bio-Lab.
- Production build passed and generated 66 existing/reviewed clean product paths.
- Desktop and mobile Velocity screenshots were inspected.
- Original public files, master data, collection definitions and protected
  Phases 1/3 source hashes remain unchanged. The existing Phase 2 story received
  responsive image attributes, not altered imagery or product copy.
- Known cold-load layout shifts still occur in some reduced-motion runs and
  remain a separate pre-launch issue; passing interaction checks do not resolve it.
