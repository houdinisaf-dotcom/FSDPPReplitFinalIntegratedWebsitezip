# FSD Premium E-commerce Quality Audit

**Audit date:** 4 November 2026  
**Scope:** `fsd-replit-site`, local development build and browser preview  
**Overall status:** **Not ready to process customer orders.** Browsing, product details and the local bag work, but checkout is deliberately disabled and several merchant/legal/photo approvals remain open. This is not a production or live-transaction audit.

## Executive summary

- The storefront remains browseable and its product, collection, navigation and placeholder-image structure is intact.
- All 36 responsive route checks passed without document-level horizontal overflow: home, Women’s collection in Visual mode, and product 33 at 12 widths from 320px to 1920px.
- A real product-to-bag flow passed: select a size, add the product, verify the item and subtotal, remove it, and confirm the bag returns to zero. Checkout remains disabled; no order is created.
- Product-page and bag copy no longer exposes the internal `[TO CONFIRM]` label for missing availability, delivery, price, or product specifications. Missing values remain blank. Legal pages and the size-guide data were not edited.
- The build and public-route HTTP audit passed. No production origin is configured, so canonical URLs and a sitemap remain withheld rather than fabricated.
- The full browser suite stops at the Velocity Sports Hijab rotation check because no approved 360° frame set is mapped. The separate image-placeholder and gallery checks pass.

## Inventory and public routes

- **79** records are present in the master product file; **73** are public storefront products across 17 categories.
- The public catalogue has 10 collection routes: `/collections/men`, `/women`, `/accessories`, `/aeroforge`, `/combat`, `/flex`, `/breeze`, `/modest-flow`, `/tiger-series`, and `/scorpion-series`.
- The production route manifest contains **111 public routes**: 28 root/information routes, 10 collections, and 73 product pages. The static build emits 25 root HTML pages plus the branded 404 page.
- The 6 master records not listed as public products remain separate: ID 21 has no confirmed price; IDs 36 and 37 are not live products; ID 53 is not in the public catalogue; ID 64 needs its product type confirmed; ID 68 is not in the public catalogue. They were not promoted or changed.
- Product counts by public category: Men’s Performance and Training 21; Training Sets 4; Combat and MMA 7; Women’s Combat Sports 1; Men’s Combat Sports 1; Women’s Performance 4; Modest Activewear 10; Women’s Performance Headwear 1; Gym Hardware and Accessories 8; Bags 1; Footwear 1; Smart Tech 6; Lifestyle 2; Women’s Performance Bottoms 2; Gear 1; Outerwear Tactical 1; Performance Outerwear 2.

## Product photography and image management

Current source mappings and files show:

- **12 of 73** public products have at least one mapped gallery image.
- **61 of 73** have no mapped usable gallery image. The full product-by-product list is in [`product-photo-coverage.md`](product-photo-coverage.md).
- Having one mapped image does not mean every colourway or view is covered. Notable partial galleries include:
  - ID 18, AeroForge Training Tee: 17 views across six existing colourways.
  - ID 19, AeroForge Hybrid Short: one image mapped to Black/Green; other colourways still lack mapped photos.
  - ID 33, Women’s MMA Performance Rash Guard: five views for the existing Obsidian & Satin Gold colourway.
  - ID 42, CORE Sports Hijab: nine views for Black/Gold; other colourways still lack photographs.
  - ID 43, Velocity Sports Hijab: five mapped views; no 360° rotation set.
- Missing imagery does not remove products or collections. The branded fallback and gallery controls remain available. No unrelated stock images or generated substitutes were added.
- There is no owner-facing product-image upload/reorder/remove interface in the storefront. Gallery mappings are maintained in project data and assets; uploads are not attached to products through an authenticated admin system.

## Shopping journey and state

| Area | Result | Evidence / limitation |
| --- | --- | --- |
| Collection browsing | Pass with a link-state issue | Search, collection filters and sort controls are present. Price-low-to-high updates the URL and changes the result order. |
| Collection view links | **Issue found** | A direct `/collections/women?...&view=visual` URL is normalized to List mode and loses `view=visual`. Selecting Visual after the page loads works. |
| Product detail | Pass with content dependencies | Gallery, colourway and size controls render. The 393px capture shows the five-view Rash Guard gallery and sticky add control. Add remains disabled until a required size is selected. |
| Bag | Pass, browser-local | A selected product and size appear with a subtotal; removing the item clears the bag. Bag state is stored locally, not in a server order. |
| Wishlist | Browser-local only | Saving a product writes the wishlist record to local storage. No customer account or cross-device sync was verified. |
| Checkout and orders | **Not implemented** | Checkout is disabled. No payment provider, server-side order creation, payment confirmation, or order history is present. No order was submitted. |
| Stock and fulfilment | **Needs owner confirmation** | No live inventory/fulfilment connection was found. Unconfirmed availability is no longer stated on product pages; do not promise stock or delivery dates. |
| Image administration | **Not implemented** | No authenticated interface for uploading, variant assignment, ordering, replacing, or removing gallery images was found. |

## Content, legal and launch dependencies

- Delivery, returns, privacy and support details still contain unresolved content. They were left unchanged pending owner/legal approval.
- Size-guide measurement values and the body-versus-garment measurement basis remain unconfirmed. The size-guide table was not rewritten because the size-fit work is audit-first.
- Investor figures and selected initiative/service claims remain subject to their existing approval tasks; this audit did not change those claims.
- Velocity’s 360°/rotation experience remains blocked on approved frames. No synthetic frames were added.
- SEO metadata, social tags, structured data, 404/HEAD handling, robots behavior, source-map denial and immutable vendor assets passed the HTTP audit for all 111 manifest routes. Canonicals and sitemap are withheld until the production origin is verified.
- No published-site performance/Web Vitals measurement, formal WCAG audit, security scan, or live payment test was performed.

## Corrections made

1. `src/product-detail-page.js` now leaves unconfirmed product availability, price fallback, delivery/returns details, generic product description, fit, material, technical-specification and care fields blank instead of showing internal `[TO CONFIRM]` filler. It retains the delivery/returns link, size guide and existing confirmed data.
2. The product-detail size guide no longer displays unconfirmed model height/size-worn claims. Its table still marks missing measurements; no measurements were invented.
3. `src/bag.js` now states the checkout limitation directly without the internal `[TO CONFIRM]` label. The disabled checkout button and “no order is processed” disclosure remain.
4. Browser tests now wait for the mapped All Black product photograph and responsive zoom limit to settle before asserting them. The existing All Black image is used; missing-image fallback coverage remains separately tested.

No product IDs, prices, variants, image mappings, logos, navigation, collection banners, homepage branding, shopping-bag behavior, or checkout availability were changed.

## Verification record

- `npm test` — **204 passed**.
- `npm run build` — **passed**.
- `node tests/production-http-audit.mjs` — **passed**, 111 public routes.
- `node tests/browser-navigation.mjs` — **passed**.
- `node tests/browser-launch-audit.mjs` — **passed** after a clean workflow restart.
- `node tests/browser-image-placeholders.mjs` — **passed**.
- `FSD_TEST_WIDTH=393 node tests/browser-luxury-gallery.mjs` — **passed**.
- `node tests/browser-nexus.mjs`, `browser-aeroforge.mjs`, `browser-modest-flow.mjs`, and `browser-breeze.mjs` — **passed individually**.
- `npm run test:browser` — showroom, navigation and weighted-rope checks passed; it then stopped at `browser-motion.mjs` waiting for the missing `[data-product-rotation]` control on product 43.
- Responsive audit after the final copy changes — **36 checks passed**, with no horizontal overflow at 320, 375, 390, 430, 768, 820, 1024, 1280, 1366, 1440, 1600, and 1920px across the home page, Women’s Visual collection, and product 33.
- Visual captures were reviewed at 1440×960 (home) and 393×852 (product 33). The exact homepage line “Made to Move, Made to Belong.” and the existing House/Investor banner presentation remain unchanged.

## Launch decision

The site is suitable for continued public preview and catalogue development, but **not for accepting or completing customer orders**. Before an ecommerce launch, the owner must resolve payment/order processing, legal and fulfilment copy, stock handling, size data, remaining product photography, the image-management workflow, and the collection Visual-link issue.
