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
- Seventeen additional proposed products listed by name without inventing product photos or confirmed specifications.
- Indicative UK RRPs, clearly marked as provisional.
- No checkout or payment collection: products are still in development.

## Before publishing
- Replace `hello@example.com` in `src/main.js` with your real business contact email.
- Replace the **stylised placeholder shield** with your actual FSD vector logo. The logo shown in the site is an approximation, **not the official source artwork**. Place your authorised SVG in `public/images/fsd-logo.svg` and update the header/footer markup.
- Confirm prices, materials, claims, image rights, size charts, privacy/cookie disclosures and product availability.
- Add further approved imagery and SKUs as production details are finalised.

## Editing products
The `products` and `planned` arrays at the top of `src/main.js` control the catalogue and roadmap.

## Final integrated handoff (19 October 2026)
- All six additional archives are preserved in the `handoff/` folder, including source documents, CSV inventory, images, video and prior website mockup.
- 100 supplied image entries copied to `public/fsd-assets/` (duplicate filenames consolidated).
- 76 named non-supplement images surfaced in a searchable Design Library.
- 10 distinct wearable product records displayed in Future Innovations.
- 1 video reference file preserved under handoff/assets/video/ (not autoplayed).
- Existing starter showcase remains intact. Price figures on those five initial examples are **indicative only**, not confirmed.
- Generic screenshots, supplement images and source documents remain available in `handoff/` for review rather than being automatically marketed as approved product listings.
- The design library is not a SKU or inventory quantity register; variant mapping and materials require human approval.
- Brand shield in the starter remains an approximation until official vector artwork is supplied.

**Delivery optimisation:** Supplied images have been converted into compressed WebP derivatives to keep the Replit import manageable. Original filenames and references are recorded in `src/additional-catalog.json`; originals are not included in this optimised ZIP. The source video is not included due to upload size.
