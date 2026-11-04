# Clothing-line banners and catalogue mapping

The homepage collection overview, existing women's hero, SHOP photographs and three-column menu, product details, bag and Phase 8 discovery sections remain in place. **Discover the Clothing Lines** opens a dedicated expandable section, keeping the initial homepage compact.

## Current public catalogue links

| Line | Products | Existing records |
| --- | ---: | --- |
| Women's AeroForge | 4 | AeroForge Training Tee; Women's Short Sleeve Performance Training Top; Women's Long Sleeve Performance Top; Modest Tunic & Jogger Set |
| Women's Combat | 2 | Women's MMA Performance Rash Guard; Strikeflex Women's Training Trousers |
| Women's FLEX | 1 | FLEX — High-Waisted Sculpt Leggings |
| Women's Breeze | 1 | Breeze Overshirt & Engineered Leggings Set |
| Women's Modest Flow | 1 | Modest Flow Training Trousers |
| Tiger Series | 1 | Tiger-Slash 550 GSM Walkout Hoodie |
| Scorpion Series | 1 | Scorpion Chitin Tactical Gilet |

No product records or commercial values were changed. The pictured Siberian Tiger hoodie and Roadwork Scorpion shorts are not added as products: those names have no existing public master records. The supplied Tiger garment photograph is used only as a logo-patch reference.

Membership is derived by `src/clothing-lines.js` from public catalogue metadata and defensible name boundaries. Women's audience or explicit Women's cross-listing is required for women's lines. Combat uses existing combat/MMA categories or cross-listing. Strikeflex is not inferred to be FLEX. Future matching public records populate automatically.

Unmatched records remain in the existing catalogue. Their complete, automatically updated names are available under **Unassigned Public Catalogue** at the end of the clothing-line browser. This includes hardware and other products that are not intended to belong to these clothing lines. Generic training leggings, Apex leggings, generic modest pieces, unclassified running shells and unisex AeroForge items without women's cross-listing have not been reassigned by guess.

## Banner and logo assets

All seven line-specific banners are new; no existing approved line-specific banner was found or overwritten. Existing standalone catalogue images are reused for Combat's rash guard, FLEX and Breeze. Other lines and products retain named, stable-ratio placeholders where approved standalone photography is unavailable. Composite product boards are not used as banner/product photographs.

Configure approved replacement image URLs in `CLOTHING_LINE_ASSETS` in `src/clothing-lines.js`:

- `banner`: approved collection photograph path, or `null` to use available public product photography/named fallback.
- `logo`: approved standalone asset path where available. Existing women's marks retain the established `WOMENS_LINES` mapping and Serene primary identity.
- Product images remain managed through `src/data/products.js` and the authoritative product data; see `src/data/IMAGE_CONFIGURATION.md`. Do not add duplicated product records to populate banners.

Tiger and Scorpion currently use unchanged photographic crops of the owner's supplied garment patches in `public/brand/series-references/`. These are not clean transparent/vector logo masters. Full original uploads were left unchanged. Women's Concepts 1, 2, 4 and 5 remain separate from animal-series identities; Concept 3 is excluded.

## Navigation and interactions

- Direct hashes `#line-aeroforge`, `#line-combat`, `#line-flex`, `#line-breeze`, `#line-modest-flow`, `#line-tiger-series`, `#line-scorpion-series` open the browser and scroll to the correct banner.
- The sticky collection strip tracks scrolling, highlights one line and displays its small identity at the far right. Its active name stays visible within the compact mobile rail.
- Existing product-detail dialogs handle sizes, colours, images and bag interactions; cards do not bypass variant selection.
- Reduced-motion preferences are respected.
- No checkout, stock, delivery, new product, membership or service availability is implied by collection placement.

Publishing remains a separate owner action.

## Immersive motion and product photography

The line browser adds once-per-session viewport reveals, visible-only fine-pointer desktop parallax, restrained hover illumination, an active-line ambient accent and layered small-logo fades. Touch devices keep the static editorial layout. Reduced-motion preferences disable reveals and parallax without hiding content.

Where real standalone photographs exist, each product can show a compact horizontal rail of up to four additional mapped views. These links open the existing product; they do not claim to preselect the pictured angle or a new purchasable variant.

Product details retain their existing thumbnails and inline image zoom, with:

- Previous/next and keyboard/touch navigation restricted to the selected colourway's mapped views.
- A full-viewport photographic viewer, original catalogue asset loading, zoom/magnification and scroll/drag panning.
- Separate close controls; Escape closes the photo viewer before its parent product dialog, restoring focus and browsing position.
- Synchronised colour selection when any mapped angle is chosen, including secondary/rear views.
- Cancellation of stale image requests and missing-variant placeholders rather than showing an older colour as the newly selected one.
- No invented extra views for single-photo products, and unavailable full-screen controls when imagery is missing.

No GLB, GLTF, USDZ or complete approved rotation-photo sequence was supplied. No 3D library, fabricated model or simulated rotation was added. The old unprovided 360° placeholder is no longer advertised on product details. `src/product-rotation-assets.js` remains an explicit, currently empty photographic-sequence configuration; any future sequence needs approved, consistent same-product/same-colourway source photographs before use.

Checkout remains unchanged and disabled for the pre-launch storefront.
