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
