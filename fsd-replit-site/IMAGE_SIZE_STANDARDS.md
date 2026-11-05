# FSD image-size standards and current audit

## Standards

These are minimum source-pixel dimensions for new production photography. They
are internal quality targets, not platform requirements. Keep source proportions;
do not enlarge undersized files to meet a threshold.

| Use | Minimum source size | Basis |
| --- | --- | --- |
| Hero | 1920 × 1080 px | Supports a wide desktop hero at roughly 2× for a 960 × 540 px display area. |
| Product card | 800 px on the shorter edge | Supports a card up to 400 px on its shorter edge at 2×. Existing cards use a 4:5 frame and contain images, so keep the source proportions rather than cropping to the frame. |
| Product gallery | 1200 px on the shorter edge and 1600 px on the longer edge | Supports a larger detail image at roughly 2× for a 600 × 800 px display area. Preserve the original composition and proportions. |

Passing a size threshold means only that an image has enough pixels for that
use. It does not confirm product identity, rights, visual quality, colourway,
composition, or approval. Do not infer any of those from filename or style.

## Audit

The task-described cohort is the 94 hash-named WebPs in
`public/fsd-assets/` (700 × 591 to 1050 × 1050 px). The directory currently
contains 17 additional, descriptively named WebPs, for 111 WebPs total. All 111
were checked by reading their image dimensions; source files were not modified.

| Use | Files passing | Result |
| --- | ---: | --- |
| Hero, at least 1920 × 1080 px | 0 of 111 | No current file meets the minimum. |
| Product card, shorter edge at least 800 px | 86 of 111 | 69 of the specified 94 hash-named files, plus all 17 additional named files, meet the minimum. |
| Product gallery, shorter edge at least 1200 px and longer edge at least 1600 px | 0 of 111 | No current file meets the minimum. |

The card-ready lists below are dimension-only candidates, not product assignments
or image approvals. Hash-named files remain unidentified.

### Product-card size candidates

#### From the specified 94 hash-named files (69)

| File | Dimensions |
| --- | ---: |
| `01946b45e43e.webp` | 875 × 1050 |
| `019b709ba885.webp` | 1050 × 960 |
| `07abc61fc7ed.webp` | 1050 × 960 |
| `080ac3792922.webp` | 1050 × 1050 |
| `12f56716e1e4.webp` | 840 × 1050 |
| `16f286891533.webp` | 1050 × 960 |
| `1a50ddda0665.webp` | 1050 × 960 |
| `1eabf63f664c.webp` | 875 × 1050 |
| `1eeba2ae57b0.webp` | 1050 × 960 |
| `1f50137316e8.webp` | 1050 × 960 |
| `1ff8fe019d55.webp` | 840 × 1050 |
| `23e10a4438aa.webp` | 1050 × 960 |
| `29218f01e275.webp` | 1050 × 960 |
| `2fd789eb6b18.webp` | 875 × 1050 |
| `3b2493524e75.webp` | 1050 × 960 |
| `3daa9883cec9.webp` | 1050 × 1050 |
| `3e7e5e1e2217.webp` | 1050 × 960 |
| `4037f5843793.webp` | 1050 × 960 |
| `438178ffdf70.webp` | 1050 × 960 |
| `4acbbfb65f79.webp` | 1050 × 960 |
| `4ec1aa605971.webp` | 875 × 1050 |
| `51e203943cad.webp` | 1050 × 960 |
| `52e3ea168d97.webp` | 1050 × 960 |
| `568e7b5cab2a.webp` | 1050 × 960 |
| `57d56912586b.webp` | 1050 × 960 |
| `5a350f04c9a3.webp` | 1050 × 960 |
| `5cd4f2a76dfe.webp` | 1050 × 960 |
| `5eba68090622.webp` | 875 × 1050 |
| `62148fcecf4f.webp` | 1050 × 960 |
| `6482d828b2a4.webp` | 1050 × 960 |
| `694b62506e9f.webp` | 1050 × 960 |
| `6ec9d1ec0011.webp` | 1050 × 960 |
| `7156dda30d8d.webp` | 840 × 1050 |
| `73bbf243a1db.webp` | 1050 × 960 |
| `775757820ce0.webp` | 875 × 1050 |
| `7b80ed032e05.webp` | 1050 × 960 |
| `8050d88a360e.webp` | 1050 × 960 |
| `8297f23d9b34.webp` | 1050 × 960 |
| `8de455020fef.webp` | 875 × 1050 |
| `8ffe2fd45a06.webp` | 1050 × 960 |
| `940483cb245f.webp` | 875 × 1050 |
| `9817e8bb0b62.webp` | 840 × 1050 |
| `990d86ea0e8b.webp` | 1050 × 960 |
| `9c830693f6ee.webp` | 875 × 1050 |
| `a1b43e2fa05b.webp` | 1050 × 960 |
| `a50d3dd41dd5.webp` | 1050 × 960 |
| `ab1c1ea7d7fb.webp` | 1050 × 960 |
| `ac7d82c01281.webp` | 1050 × 840 |
| `b41b0e05fe83.webp` | 1050 × 960 |
| `b60526890d31.webp` | 1050 × 960 |
| `beb0390e937f.webp` | 1050 × 960 |
| `c3d2d5e42d94.webp` | 1050 × 1050 |
| `c40fc868793c.webp` | 840 × 1050 |
| `c6803aead652.webp` | 1050 × 960 |
| `c74fc3446e74.webp` | 1050 × 960 |
| `ca60e78123c3.webp` | 840 × 1050 |
| `d0201f9e23d4.webp` | 840 × 1050 |
| `d73c6dcf1e3f.webp` | 1050 × 960 |
| `deb98830b1a5.webp` | 1050 × 960 |
| `e6a53d9323cc.webp` | 1050 × 960 |
| `e8c97fbe6a31.webp` | 840 × 1050 |
| `eb907d419956.webp` | 1050 × 960 |
| `ed15acb35414.webp` | 1050 × 960 |
| `edf5efc094df.webp` | 1050 × 960 |
| `f27c11726245.webp` | 875 × 1050 |
| `fab3982bebc0.webp` | 1050 × 960 |
| `fc1fabf8699c.webp` | 1050 × 960 |
| `fd2445fd58fc.webp` | 1050 × 960 |
| `ffa5e704fac9.webp` | 1050 × 960 |

#### Additional named WebPs in the directory (17)

| File | Dimensions |
| --- | ---: |
| `breeze-set-deep-burgundy-alt-full-length.webp` | 1122 × 1402 |
| `breeze-set-deep-burgundy-board.webp` | 1122 × 1402 |
| `breeze-set-deep-burgundy-full-length.webp` | 1122 × 1402 |
| `breeze-set-deep-burgundy.webp` | 1122 × 1402 |
| `breeze-set-deep-olive.webp` | 1122 × 1402 |
| `breeze-set-midnight-navy.webp` | 1122 × 1402 |
| `breeze-set-onyx-black-board.webp` | 1122 × 1402 |
| `breeze-set-onyx-black-front.webp` | 1024 × 1536 |
| `breeze-set-onyx-black-full-length.webp` | 1024 × 1536 |
| `breeze-set-onyx-black-side.webp` | 1024 × 1536 |
| `breeze-set-onyx-black-trouser-view.webp` | 1122 × 1402 |
| `breeze-set-onyx-black.webp` | 1122 × 1402 |
| `breeze-set-slate-grey-full-length.webp` | 1122 × 1402 |
| `breeze-set-slate-grey.webp` | 1024 × 1536 |
| `breeze-set-warm-taupe-board.webp` | 1122 × 1402 |
| `breeze-set-warm-taupe-full-length.webp` | 1122 × 1402 |
| `womens-modest-combat-preview.webp` | 1024 × 1536 |

## Applying the standards

- Check dimensions before sourcing or preparing production hero and product files.
- Use a new, appropriately sized source when a hero or gallery image does not meet
  its minimum; do not stretch an existing file.
- Use the card list only as a pixel-size filter. Separately verify the image,
  identity, product/colourway mapping, rights, and approval before publishing.
- Keep the original asset files unchanged during review.
