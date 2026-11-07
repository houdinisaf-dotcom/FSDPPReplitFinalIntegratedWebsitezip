# FSD — Fitness & Self Defence | Replit Website Starter

A responsive premium product catalogue, combining FSD's Signature Luxury and Performance Collection visual styles.

## Import into Replit
1. Create a new Replit project by importing/uploading this ZIP (or upload and extract it into a Node.js Repl).
2. Run `npm install` in the Shell.
3. Click **Run** or execute `npm run dev`.
4. For deployment, build with `npm run build` and serve the generated `dist` folder with your preferred static hosting setup.

## Included
- Responsive home page, collection sections, searchable/filterable product catalogue, product detail modals, development roadmap and contact section.
- Five actual user-provided design-stage product images for the Ombré Slash tees and Cheetah Windrunners.
- Master-list catalogue with category filters, cross-listing, alternate-name search, pagination and product details.
- Confirmed list prices and suggested prices are labelled separately; missing prices stay unconfirmed.
- No checkout or payment collection: products are not yet available to buy.

## Before publishing
- Provide approved business contact, investor and legal content. VIP capture is deliberately deferred until its destination and privacy/consent wording are ready.
- Replace the **stylised placeholder shield** with your actual FSD vector logo. The logo shown in the site is an approximation, **not the official source artwork**. Place your authorised SVG in `public/images/fsd-logo.svg` and update the header/footer markup.
- Confirm prices, materials, claims, image rights, size charts, privacy/cookie disclosures and product availability.
- Add further approved imagery and SKUs as production details are finalised.

## Editing products
`src/master-products.json` retains the 68 original source records and adds four user-approved hardware set tiers. `src/catalogue-data.js` normalises the data and excludes records with explicit publication statuses. Four held items (the championship belt, ring corner post, food supplement and undecided Smart Tech STRIDE) remain in the source data but are not displayed publicly. Two historical records are excluded: the training short merged into Aeroforge Hybrid Short, and the retired £129.99 dumbbell pair replaced by the four complete-set tiers. The 66 active products drive the catalogue, roadmap and Smart Tech overview.

Approved aliases resolve to the same product record. Named Strike combat-short colourways remain variants of one £49.99 product; the Aeroforge Hybrid Short is separate at £44.99. Strike combat tops remain distinct from Aeroforge general-training tops. COMMAND and Signature/CARRY bags are separate products. Existing category labels are retained with cross-listing for the approved divisions rather than introducing duplicate category spellings.

The four dumbbell tier prices apply to complete 10kg–50kg set packages, not pairs. Exact increments, quantities and total set weights are pending manufacturer specifications; no rack or accessories are implied. The £1,299.99 Olympic Bar & 5-Cutout Bumper Plate Set retains undecided bar weight, plate breakdown and accessories. Supplied material/construction descriptions remain development briefs, not verified manufacturing claims. The Form top has approved mid-hip coverage, without invented centimetre measurements; the women’s Aeroforge long-sleeve top remains standalone.

Colourways are grouped into one product record. Cross-listed categories and alternate names are preserved; only user-approved duplicates are merged. Publication decisions are explicit metadata, so renaming a held item cannot accidentally expose it. Only the two products already linked to the five starter images use those images. Other records display honest image-status placeholders until their concept imagery is approved and mapped. The separate design library is reference material, not a second product register.

The design-reference archive is not rendered in the website. Its source image records and files remain in the project for internal review. STRIDE and supplement references remain withheld from public pages, and the publication-hold associations do not constitute approved product-to-image mappings.

Run `npm test` for catalogue data and event-handler checks, and `npm run build` to validate the production bundle.

## Interactive showroom
The original hero leads into four data-driven divisions: Apparel, Bio-Lab, Hardware and Global. A single accessible collection dialog supports group/subcategory selection, concept disclosures and non-overlapping product-detail handoff. The complete catalogue remains available in its expandable archive; design-reference images are retained in project files but are no longer shown on the website. The approved Velocity photo is its primary product image and the Apparel banner visual.

The feature carousel is manually controlled, swipeable and reduced-motion aware. Mobile collections open full-screen with a visible close control. There are no new dependencies, checkout actions or working VIP capture form. Proposed showroom names are navigation/concept metadata only and do not alter the authoritative master product records or publication holds.

With the development workflow running, `npm run test:browser` checks desktop interactions using system Chromium (no downloaded browser or added browser package). It uses `REPLIT_DEV_DOMAIN` for the app address. Desktop and 402px mobile screenshots were reviewed. Mobile interaction automation remains unverified: changing the same Chromium session from desktop to mobile produced inconsistent layout/visual viewport measurements, so that is not counted as a passing mobile test.

## Final integrated handoff (19 October 2026)
- All six additional archives are preserved in the `handoff/` folder, including source documents, CSV inventory, images, video and prior website mockup.
- 100 supplied image entries copied to `public/fsd-assets/` (duplicate filenames consolidated).
- 76 named non-supplement images surfaced in a searchable Design Library.
- Earlier wearable concept records remain in the handoff/reference data. Future Innovations now follows the seven Smart Tech entries in the supplied master list.
- 1 video reference file preserved under handoff/assets/video/ (not autoplayed).
- The master list supersedes the old five-card showcase and separate seventeen-item roadmap. The tee and windrunner each have one record with their colourways grouped together.
- Generic screenshots, supplement images and source documents remain available in `handoff/` for review rather than being automatically marketed as approved product listings.
- The design library is not a SKU or inventory quantity register; variant mapping and materials require human approval.
- Brand shield in the starter remains an approximation until official vector artwork is supplied.

**Delivery optimisation:** Supplied images have been converted into compressed WebP derivatives to keep the Replit import manageable. Original filenames and references are recorded in `src/additional-catalog.json`; originals are not included in this optimised ZIP. The source video is not included due to upload size.
