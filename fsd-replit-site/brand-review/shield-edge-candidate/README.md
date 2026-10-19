# Separate alpha-edge candidate

This candidate is not approved or applied to the live website. The earlier approved layout and all earlier assets remain untouched.

`scripts/prepare-shield-edge-candidate.py` reduces only partial-alpha opacity within a two-native-pixel band of transparent background. Fully opaque pixels, interior alpha and retained visible RGB values are unchanged and checked. It does not repaint, redraw, trace, sharpen, erode or replace the shield contour.

The 261 × 273 shield canvas and 400 × 204 lockup remain the same size. The approved lettering image, shield sizing and component coordinates are reused exactly. Uploaded/source/approved-proof hashes are checked after generation.

This conservative method reduces semi-transparent matte residue but cannot remove opaque pale fringe without changing source pixels. Fine partial-alpha detail may look softer. It remains a raster candidate, not a vector or recovered authored transparency master.

Open `/shield-edge-review.html` for before/candidate headers and black/light edge comparisons. Review assets remain outside `public/` and the normal production entrypoint. No products, clothing, packaging, other branding, live header or publishing settings are changed.
