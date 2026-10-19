# Refined shield matte — approval asset, not a live replacement

The earlier alpha-fading candidate did not address baked-in pale edge colour. This refinement instead unmixes the white background contribution using the official white reference and a registered black-reference colour guide. It does not paint, trace, invent a contour, blur, sharpen, erode, dilate or apply the earlier opacity-power fade.

Every original opaque pixel and the interior are protected bit-for-bit. Only partial-alpha boundary pixels are eligible. No foreground is added outside the supplied shield’s support. The three-blade artwork, native 261 × 273 canvas, 400 × 204 header composition and exact widely spaced champagne-gold FITNESS & SELF-DEFENSE lettering/placement are retained.

Validation checks source hashes, protected pixels, transparent support, and reproduction of the original white-reference appearance when composited back onto white (maximum error: one 8-bit channel value). This is stronger than judging a transparent-image thumbnail alone.

The PNGs contain actual RGBA transparency. No white/checkerboard rectangle is baked in. Native raster grain and opaque light highlights/rim remain deliberately protected; ambiguous opaque residue cannot be removed while also guaranteeing every opaque original highlight is untouched. This is an estimated raster matte, not recovered authored alpha or a vector master. Do not label it a guaranteed exact final master.

`scripts/refine-shield-matte.py` reproduces the refinement and validation report. `/shield-edge-review.html` presents desktop/mobile header comparisons and black/light inspections. All source and previous proof assets remain unchanged. The live header, product/promotional images, clothing, packaging, favicon, other branding and publishing configuration are not modified.
