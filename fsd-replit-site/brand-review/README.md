# FSD logo approval candidates

These are **review candidates**, not approved replacements or authored vector masters.
The live header, favicon, original uploaded references and all product designs are unchanged.

## Sources checked
- Official black-background reference: RGB JPEG, 1154 × 713, no alpha.
- Official white-background reference: RGB PNG, 827 × 542, no alpha.
- The current site uses a drawn placeholder shield and an italic font rather than the established angular wordmark.

The larger black reference supplies the metallic pixels. The white reference was inspected for the exact shield/blade geometry, wordmark and tagline. No AI generation, drawing, tracing, reshaping or upscaling was used.

## Preparation
`scripts/prepare-logo-review.sh` creates a soft, **estimated** alpha matte from the black image and unpremultiplies edge colours to reduce matte fringes. Opaque metallic regions keep their source RGB values. Because the source is flattened, the original authored alpha cannot be recovered unambiguously; edge and shadow behaviour on a light surface must be reviewed rather than described as an exact transparent master.

The shield, wordmark and wordmark/tagline files are aspect-ratio-preserving crops. The header proposal places the shield beside the wordmark/tagline; this is a proposed arrangement of existing components, not redrawn artwork. The complete stacked source arrangement remains in the full-lockup asset.

## Prepared exports
- `assets/fsd-full-lockup.png` — 934 × 604, RGBA.
- `assets/fsd-shield.png` — 321 × 336, RGBA.
- `assets/fsd-wordmark.png` — 934 × 223, RGBA.
- `assets/fsd-wordmark-tagline.png` — 934 × 267, RGBA.
- `assets/fsd-header-lockup.png` — 520 × 132, RGBA.
- Lossless WebP alternatives for the full and header lockups.

PNG/WebP pixel comparisons return zero differences. Both have real alpha, including fully transparent background pixels and partially transparent edge pixels.

The header export supports a 260 × 66 CSS-pixel placement at 2× density. The full native raster supports approximately 467 × 302 CSS pixels at 2× density. No artificial higher-resolution detail has been claimed. Larger or unlimited-scale placement requires an existing authored vector or genuine transparent master.

Open `/brand-review.html` in the development preview for the current/proposed header comparison and dark/light/transparent-surface proofs. This unlinked review page and its assets are outside `public/` and the normal production entrypoint. Do not wire them into the main header, footer or favicon until the user approves.
