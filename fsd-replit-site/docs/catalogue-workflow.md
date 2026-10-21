# Reviewed catalogue files

There is no public editor, upload endpoint, account system or new database.
These are maintainer-only project files and commands. Existing master records,
IDs, prices and approved images remain authoritative.

## Files

- `content/catalogue.json`: private editorial preparations; **not imported by the app**.
- `src/catalogue-assets.json`: approved image associations, roles, descriptive alt
  text, dimensions, source hashes and responsive copies. Each asset belongs to
  one product and one colour; image approval is not content approval.
- `src/catalogue-records.json`: intentionally empty reviewed supplement.
  Existing-record reviews must retain their original `sourceId` and source
  fields. New records require a unique assigned positive ID, confirmed placement,
  explicit content approval and separate publication authorisation.
- `src/catalogue-model.js`: shared schema, variant/gallery relationships,
  editorial status gates, source preservation and legacy adapter.

## Daily commands

Run from `fsd-replit-site`:

```sh
npm run catalogue:validate
npm run catalogue:preview -- --id 43
npm run catalogue:preview -- --key weighted-skipping-rope
npm run catalogue:images
npm run catalogue:export -- --id 43
npm test
npm run build
```

Preview writes a self-contained, read-only HTML proof to
`generated-artifacts/fsd-catalogue-review/index.html`, outside public/app files.
It shows hero/variant images, role assignments, alt text, source ID, content
status, exact prices, placement and missing information.

Export does **not** approve, publish or modify the storefront. It refuses
unapproved preparations and writes only a review candidate outside the app.
After explicit review/authorisation, a maintainer can merge that candidate into
`src/catalogue-records.json`, then validate/test/build. Never copy private drafts
into that runtime file. Existing published source listings are not silently
hidden merely because their new editorial metadata awaits review.

## Prepare an image without replacing artwork

1. Stage the original under `content/incoming/` using a descriptive, lowercase,
   hyphenated filename. Do not use that folder for secrets or documents.
2. Add a proposed manifest entry: stable asset ID, product ID, variant ID, future
   `/images/...` source, `stagedPath`, `approved: false`, label, alt text and
   roles. A preparation's `assetIds` must reference its own assets.
3. Use `catalogue:preview` to review the staged image. No public upload occurs.
4. Obtain explicit image approval. Only then copy the **unaltered** original to
   its public source path, remove `stagedPath`, set `approved: true` and record
   the approval reference. Do not reuse another colour's or product's image.
5. Run `catalogue:images`, validate and review again. The image command creates
   WebP copies at 360/640/960 pixels and original width where available, without
   cropping, recolouring, sharpening or overwriting source artwork. No upscaling.
   Hash-based derivative names prevent stale browser copies.

Optional roles are `hero`, `front`, `back`, `side`, `detail`, `lifestyle`,
`lineup`, `variant`. Missing optional views stay empty; they are not invented.
The fullscreen viewer keeps the full-resolution original. Cards, galleries and
the existing product story use responsive copies; non-critical images are lazy.

## Schema / honest variants

Each prepared product has an editorial key, original source ID where applicable,
name, collection/category, description/specifications, exact confirmed/suggested
price and GBP currency, variants, sizes, asset references, placement and SEO.
Each variant has its own stable internal ID, verified colour name, optional SKU,
sizes and stock. Internal IDs are **not SKUs**.

Use `null` for unknown prices, SKUs and stock; use `[]` for unknown sizes and
unverified colour lists. Never invent availability, dimensions, manufacturing
claims or performance specifications. An explicit empty variant size list means
unknown; omitted variant sizes can use an approved common size list.
Variant changes commit colour, image and SKU together after successful loading;
failure retains the previous committed selection. A colour without an approved
image gets an explicit missing-image panel, not a borrowed photograph.

| Status | Meaning |
|---|---|
| Draft | Preparation only; no new public listing |
| Awaiting Images | Required image approval/mapping still missing |
| Awaiting Approval | Editorial/manufacturer review outstanding |
| Approved | Content approval recorded; not publication or sales permission |
| Published | Separate explicit publication authorisation recorded |

`purchaseEnabled` must remain false throughout. A content state never enables
checkout, stock claims, payments or a launch.

## SEO

The existing hash links remain compatible. Clean `/products/ID/slug/` links
open the same detail experience, with product H1, title and description; closing
a direct clean link returns to the root catalogue. Build also pre-renders the
same existing/reviewed records into clean HTML paths, including non-JavaScript
product content and collection links. Private drafts/held/retired records are
not generated. No speculative Product/Offer structured data or inferred
production-domain canonical URLs are emitted.
