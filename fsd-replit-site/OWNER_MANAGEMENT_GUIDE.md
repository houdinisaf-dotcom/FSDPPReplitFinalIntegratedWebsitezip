# FSD Owner Management Guide

## Current status

This guide describes the system that exists today. There is no admin dashboard,
owner login, product-editing screen, image-upload interface, draft workflow, or
order-management screen. Routine content changes currently require source-file
edits and a new build. Do not treat “private review” labels or a hidden route as
authentication.

The site is not ready to accept real customer orders. Checkout and payments are
disabled, and the public policy pages still contain details that need owner or
legal confirmation.

## Priority list

1. **Resolve ecommerce requirements:** choose a payment provider and confirm
   pricing, tax, shipping and order rules before implementing checkout or orders.
2. **Confirm customer-facing policies:** provide accurate delivery, returns,
   privacy and support information and obtain the appropriate review.
3. **Complete security controls:** address the remaining static-analysis findings
   and add suitable abuse protection before relying on public sign-up collection.
4. **Approve an owner-management approach:** only after the launch blockers above
   are addressed, decide whether to retain code-managed updates or approve a
   private owner-only system with authentication and durable media storage.
5. **Prepare production operations:** confirm backups, production monitoring,
   image performance and search configuration before a controlled launch.

## Product photography and variants

There is no in-site upload control. A developer currently needs to add approved
assets and update the source mappings:

1. Put approved, standalone image files in `public/assets/products/`.
2. In `src/data/products.js`, find the matching product in `imageReferences` and
   add or replace an entry. Use the public URL path, a descriptive `label`, and
   the exact existing `colourway`, `size`, or `variant` value where applicable.
3. For supported colour palette imagery, update the corresponding `Colourway
   palette` image path in `src/master-products.json`.
4. Keep each asset in the existing slot’s aspect ratio. Product imagery uses the
   existing portrait stages; the layout should not be redesigned to replace an
   image.
5. Run `npm test` and `npm run build`, then check the product detail and each
   affected variant in the running preview. A missing or unapproved image should
   remain a named placeholder.

Do not replace a product image with a collage/contact sheet or a different
colourway. Keep the original source assets unchanged; add an approved web-ready
copy instead.

The fuller image mapping instructions are in `src/data/IMAGE_CONFIGURATION.md`.
The current missing-image list is in `PHASE4_IMAGE_GAPS.md`.

## Collection images and content

- Collection cover images are mapped in `src/data/site-media.js`, under
  `collectionCards`. Update the `src` and matching `alt` text; keep `null` while
  an image is unavailable.
- Collection titles, descriptions, groups and product matching are in
  `src/collection-divisions.js`.
- The homepage keeps its existing three-card collection presentation. Do not
  add every product or collection as a homepage card.

These changes are also source edits, not owner-editable controls.

## Homepage hero, campaigns and other banners

- The homepage hero, women’s banner and hardware editorial image are mapped in
  `src/data/site-media.js` (`homeHero`, `womensBanner`, and `hardwareFeature`).
- The three non-purchasable garment-study previews use `garmentStudies` in the
  same file. Keep the entries `null` until approved study imagery is available;
  these are not product or customisation records.
- Page-specific image slots use `pageMedia`, keyed by the exact slot title.
- Keep each existing image slot and its responsive sizing. Provide accurate alt
  text; use a placeholder rather than unrelated photography.
- Banner copy and calls to action are part of the existing page/component
  source. Search for the displayed wording and update only the matching approved
  section; there is no content editor or preview-before-save control.

## Product descriptions, prices and availability

The catalogue is sourced from `src/master-products.json` and adapted for the
storefront in `src/data/products.js`. Updating an existing product currently
requires a source change and rebuild. No live inventory control exists. Only
change a price, variant, description or availability after the owner has
confirmed the value; do not infer stock or commercial terms from photography.

## Orders, sign-ups and publishing

- **Orders:** there is no order system or order history to view.
- **Pre-launch sign-ups:** the existing form stores a consented email in the
  `fsd_prelaunch_signups` table. It does not send email updates. The privacy
  details remain incomplete, so do not treat this as a finished mailing list.
- **Drafts:** source edits are not saved as private website drafts. The site has
  no in-app draft, preview, publish, cancel, or content-level undo controls.
- **Build:** from `fsd-replit-site/`, run `npm test` and `npm run build`; review
  the running preview before any deployment decision.
- **Deployment:** `.replit` configures an Autoscale build using `npm run build`
  and serves the generated `dist` output with `npm start`. This configuration
  does not mean the site has been published or approved for launch.
- **Recovery:** restore the previous source and image mapping, rebuild, and
  retest. Keep a reviewed copy of the changed files before making a significant
  update; there is no website content-history screen.

## Recommended owner-only management solution

No suitable admin or image-storage system exists in the current application.
The smallest responsible next step would be a narrowly scoped, authenticated
owner interface that edits the existing product and collection records, stores
approved images in durable storage with access controls, validates file type and
size, and offers draft preview plus an explicit publish action. It must use
server-side authorization; a hidden URL or client-side password is not enough.

That would add authentication, persistent media storage and a publishing path,
so it is a substantial change. It has **not** been built or connected. Approve
the approach and resolve the higher-priority ecommerce, policy and security
blockers before implementation.

## Changes that still require developer assistance

Until an owner-only management system is approved and implemented, all product,
collection, banner, copy, price, variant and availability changes require a
developer to edit the relevant source, run tests and build, and verify the
result. Payment setup, order processing, production database changes, DNS and
legal policy changes also require explicit owner approval and verified
business information.
