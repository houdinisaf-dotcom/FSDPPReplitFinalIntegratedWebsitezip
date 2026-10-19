# Shield + FITNESS & SELF-DEFENSE — interim website proof

This is a separate proof only. It does not replace the main website logo or grant approval to publish.

The supplied 827 × 542 RGBA PNG has real alpha, including fully transparent background pixels and partially transparent edges. Its shield is separated with a crop plus removal of detached alpha components. Retained shield RGB and alpha values remain unchanged; pale attached raster-matte fringes remain visible under native-size inspection. This is not a claim of a final edge-cleaned/vector master.

The large FSD initials are absent from the proposed lockup. The website-specific wording is exactly **FITNESS & SELF-DEFENSE**, split across two lines for header readability. It uses the supplied tagline artwork’s glyphs, not a generic font. The existing S is reused in place of C for the requested spelling; the added hyphen reuses the F’s middle horizontal stroke. These wording changes are proposed, not changes to product branding.

`scripts/prepare-shield-proof.py` reproduces the assets with ImageMagick and Python’s standard library. It verifies the source hash remains unchanged. A generated report records the pixel isolation and lettering treatment.

The proposed 400 × 204 PNG and lossless WebP are shown at 180 CSS pixels wide on desktop and 160 CSS pixels on mobile. The preview uses a 110px / 96px header height respectively, compared with the unchanged production header’s existing heights. There is no upscaling, shield redraw, vector tracing or recolouring.

Open `/shield-logo-review.html` in development for current/proposed headers and edge inspection. The review page/assets are outside `public/` and the normal production entrypoint. Clothing, products, packaging, other FSD branding and the published site are not modified.
