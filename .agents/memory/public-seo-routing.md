---
name: Public SEO routing boundaries
description: Preserve existing shopping interactions while adding crawlable entry paths; never infer a production origin from preview.
---

Public SEO routes are additive entry points into the existing catalogue, product dialogs and collection banners, not permission to replace the storefront’s interaction model.

**Why:** The owner explicitly required an audit and improvement of the existing site without rebuilding it, duplicating products or changing established shopping/navigation behaviour.

**How to apply:** Derive crawlable entries from actual public records and pages. Reuse existing UI and filters; do not republish private proofs as product pages. Product metadata should restore the underlying page when a dialog closes.

Withhold production canonical URLs and sitemap output until a real production origin has been verified.

**Why:** The owner explicitly prohibited a fabricated production URL. During the launch audit the deployment service reported no active deployment; a development hostname is not an acceptable substitute.

**How to apply:** Obtain the current production URL from deployment metadata before configuring it. After the first publish, configure that verified origin, rebuild and republish, then check live canonical links, sitemap and external social cards. Local build tests do not verify live production.

The owner explicitly chose to defer canonical and sitemap output until publication when asked how to handle the missing production origin.

For route headings, verify that the one visible H1 names the current page rather than only checking that an H1 exists. Shared storefront content can otherwise leave the homepage message as the heading for collections or products. When closing a product dialog, restore the route state as well as its metadata so the underlying page heading and scroll position return together.

**Why:** The shared homepage shell originally supplied the only H1 across routes; making the page title primary also exposed a scroll-restoration dependency on keeping route state in sync when a product dialog closes.

**How to apply:** Preserve the homepage’s approved H1, promote the existing route-specific title on each page type, and test close-and-return behavior after any heading or route-metadata changes.
