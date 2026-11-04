# Priority 3 — original logo configuration

The supplied configuration is retained in `src/config/priority-three.json`.
Collection names, the gold accent, 240 ms switching and artwork rules use that
configuration. Existing `tiger-series` and `scorpion-series` route IDs are kept;
the user-facing `tiger` / `scorpion` identifiers are aliases, not new collections.

## Adding artwork later

The owner has now approved unchanged logo-panel crops from the supplied boards.
Concepts 2 (Ascent), 4 (Aligned) and 5 (Signature) are available in the logo
dictionary. All five women's collection assignments remain null: an available
asset is not approval to choose a collection for it.

An additional primary monogram panel has been cropped but is **not** mapped to
Serene/Concept 1 because that board does not identify its concept number.
Master, Serene, Tiger and Scorpion asset slots remain unset; the existing
website header remains untouched. Concept 3 is excluded and has no crop.

These crops retain the original pixels, backgrounds and complete lettering.
They are flattened raster references, not transparent/vector masters.
Provenance and crop rectangles are in `handoff/approved-logo-crops.json`.
Reproduce with `node scripts/prepare-approved-logo-crops.mjs`, or verify exact
decoded-pixel equality with `node scripts/prepare-approved-logo-crops.mjs --check`.

1. Supply an approved original static SVG, PNG, WebP, JPEG or AVIF. Keep the
   original unchanged. Place the approved web file through the existing public
   asset workflow, for example under `public/brand/originals/`.
2. Set its matching `logos.<key>.asset` to its root-relative public path.
3. Explicitly assign the intended `collections[].logo` key. The five women's
   assignments remain null until confirmed. Merely uploading a Serene asset
   does not automatically assign it to BREEZE or any other collection.
4. Use the site's existing rebuild/publish process. No new live CMS or uploader
   is introduced by this interaction update.

The explicit approval above permits these unchanged logo-panel crops only.
Do not use generated/inline fallback marks or garment-patch crops as original
logo files. Do not assign Concept 3. Missing, excluded, unassigned or broken
files retain a named slot with stable dimensions; they do not hide collections.
The right-hand switcher uses an unaltered image with contain sizing, not a
recoloured mask, newly drawn SVG or replacement symbol.

The existing approved master shield in the website header is unchanged.
`logos.master.asset: null` is not a request to remove that established header,
nor permission to substitute its shield for unassigned collection logos.
