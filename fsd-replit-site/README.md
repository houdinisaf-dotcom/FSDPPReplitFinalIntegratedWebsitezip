# FSD — Fitness & Self Defence | Replit Website Starter

A responsive premium pre-launch product catalogue, combining FSD's Signature Luxury and Performance Collection visual styles.

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
- No checkout or payment collection: products are still in development.

## Before publishing
- Replace `hello@example.com` in `src/main.js` with your real business contact email.
- Replace the **stylised placeholder shield** with your actual FSD vector logo. The logo shown in the site is an approximation, **not the official source artwork**. Place your authorised SVG in `public/images/fsd-logo.svg` and update the header/footer markup.
- Confirm prices, materials, claims, image rights, size charts, privacy/cookie disclosures and product availability.
- Add further approved imagery and SKUs as production details are finalised.

## Editing products
`src/master-products.json` preserves all 68 rows from the supplied `FSD_Master_Product_List.csv`. `src/catalogue-data.js` normalises the data and applies explicit publication holds. Three held items (the championship belt, ring corner post and food supplement) remain in the source data but are not displayed publicly. The other 65 products drive the catalogue, roadmap and Smart Tech overview.

Colourways are grouped into one product record. Cross-listed categories and alternate names are preserved; possible duplicates are not automatically merged. Only the two products already linked to the five starter images use those images. Other records display honest image-status placeholders until their concept imagery is approved and mapped. The separate design library is reference material, not a second product register.

Run `npm test` for catalogue data and event-handler checks, and `npm run build` to validate the production bundle.

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
