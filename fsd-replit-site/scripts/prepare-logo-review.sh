#!/usr/bin/env bash
set -euo pipefail

# Draft raster preparation only. No drawing, tracing, generative editing,
# recolouring of opaque artwork, or changes to live-site files.
base="$(cd "$(dirname "$0")/../.." && pwd)"
source="$base/attached_assets/Screenshot_2026-10-16_at_01.59.17_1792429054212.jpg"
out="$base/fsd-replit-site/brand-review/assets"
mkdir -p "$out"

# Estimate a soft alpha from the flattened black matte. Unpremultiplication
# keeps the original black-background appearance while avoiding a hard fringe.
# True original alpha cannot be recovered unambiguously from a JPEG.
magick "$source" -alpha set \
  -channel A -fx 'max(r,max(g,b))<=0.025?0:min(1,(max(r,max(g,b))-0.025)/0.155)' +channel \
  -channel RGB -fx 'a>0?min(1,u/a):0' +channel \
  -trim +repage -strip -depth 8 -define png:compression-level=9 \
  "$out/fsd-full-lockup.png"

# Crop existing components at the narrow separation between shield and type.
# Every resize below preserves aspect ratio and only reduces native pixels.
magick "$out/fsd-full-lockup.png" -crop 390x336+275+0 +repage -trim +repage \
  -strip -depth 8 -define png:compression-level=9 "$out/fsd-shield.png"
magick "$out/fsd-full-lockup.png" -crop 934x224+0+337 +repage -trim +repage \
  -strip -depth 8 -define png:compression-level=9 "$out/fsd-wordmark.png"
magick "$out/fsd-full-lockup.png" -crop 934x267+0+337 +repage -trim +repage \
  -strip -depth 8 -define png:compression-level=9 "$out/fsd-wordmark-tagline.png"
magick -size 520x132 xc:none \
  \( "$out/fsd-shield.png" -resize '110x110>' \) -gravity west -geometry +4+0 -composite \
  \( "$out/fsd-wordmark-tagline.png" -resize '370x112>' \) -gravity east -geometry +8+0 -composite \
  -strip -depth 8 -define png:compression-level=9 "$out/fsd-header-lockup.png"

# Lossless web alternatives, not a lossy regeneration.
for name in fsd-full-lockup fsd-header-lockup; do
  magick "$out/$name.png" -define webp:lossless=true -quality 100 "$out/$name.webp"
done
magick identify -format '%f: %wx%h, %[channels], %b\n' "$out"/*.png "$out"/*.webp
