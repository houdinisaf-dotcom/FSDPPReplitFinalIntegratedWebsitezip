---
name: FSD change scope
description: Standing boundary for future implementation on the FSD website.
---

FSD is a premium technical performance apparel brand. For future site changes, inspect first, reuse existing systems, and implement only the explicitly requested feature. Do not redesign, duplicate, or refactor completed sections, or alter approved products, prices, variants, branding, navigation, galleries, search, bag, or checkout unless explicitly authorized or essential to the requested feature.

SHOP and collection product listings must remain image-led responsive product grids; public vertical-list mode is not acceptable. Preserve every product record, price, variant, image, filter, sort option, and shopping action when changing the shared listing.

**Why:** The owner identified FSD's premium technical-performance positioning and issued a direct development-continuity instruction to avoid unrelated work and rework.

**Why:** The owner explicitly requires image-led product grids across SHOP and collection listings, with list layouts removed and existing commerce data and behaviors preserved.

**How to apply:** Keep edits local, explain any essential cross-cutting changes, and report what changed and why. Apply the positioning to new features only; do not use it as permission to restyle completed work. Respect priority-specific review gates before moving to the next phase. Keep all public catalogue routes on the shared responsive grid.

## Visual reference priority and approved product-page direction

Use Stretch Your Story as the primary reference for SHOP and product-detail pages: restrained luxury activewear, editorial light shopping surfaces, large approved product photography, and a narrow purchase panel beside the gallery. Use Rep Republic and GymFit only for selected campaign typography/composition, and Figma Fashion Ecommerce for shopping structure and usability. If these references conflict, Stretch Your Story takes priority for SHOP and product pages. Never reuse reference brands, people, products, claims, or prices as FSD content.

The user approved the desktop/mobile product-page direction shown in the isolated mockup. Use an explicit, same-colourway front/rear pair as the PDP default only when the mapped asset labels identify those product views; otherwise preserve the curated gallery order. Keep purchase controls gated by verified stock and SKU data.

**Why:** The owner supplied a clear reference hierarchy and approved a restrained editorial PDP proposal, while requiring approved FSD content and the current homepage/navigation to remain intact.

**How to apply:** For future SHOP/PDP refinements, follow the reference priority above, verify the target product’s exact mapped media and variant before changing gallery order, and do not invent imagery or make purchase controls appear available without confirmed eligibility.

## Approved complete-site visual direction

The owner authorized a full visual transformation of the existing FSD website, not a separate mockup: graphite, electric volt lime, warm white, oversized athletic typography, the approved shield, existing boxing hero and headline, six navigation destinations, and editorial collection/product/House surfaces. Preserve routes, content, product records, prices, variants, stock and purchase gates. Do not deploy without explicit approval. Keep video-led features blocked until approved FSD footage is supplied.

**Why:** The owner explicitly broadened the earlier homepage-only scope to the complete digital flagship while preserving approved brand, catalogue, route, and commerce boundaries.

**How to apply:** Use supplied visual references as design direction only, reuse approved FSD assets, keep missing media explicit, and verify desktop, mobile, and interactive states. Report any media- or data-blocked feature; never activate checkout or deploy without approval.

## Supplied prototypes are references, not source-of-truth

Port only prototype ideas that connect to existing FSD routes, verified copy, and approved data. Keep prototype-only controls off customer-facing pages, and do not copy demo products, prices, stock, locations, bookings, or service claims.

**Why:** The owner approved bringing safe ideas from a standalone prototype into FSD while its product, pricing, location, and service interactions were explicitly marked as demonstrations.

**How to apply:** Check each prototype detail against current FSD records before implementation. Reuse existing routes and gates; use clear factual copy for any new customer-facing content.

For incremental React migrations, keep the existing host section element, ID, classes, and accessibility references in the legacy template, then portal React-managed contents into that host. Avoid adding a wrapper around the section.

**Why:** Existing CSS, adjacent-section layout checks, route-specific heading updates, and anchor links can depend on the original section remaining the direct sibling in the page structure.

**How to apply:** Migrate section contents and interactions in React while preserving the host element; verify its adjacent sections, route heading, image fallback, and interaction before moving the next section.
