"""Prepare review-only crops and lettering from the supplied RGBA artwork.

No fonts, drawing, tracing, generation, recolouring or production-file edits.
Requires the already available ImageMagick executable.
"""
from collections import deque
from hashlib import sha256
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "attached_assets/FSD_Shield_Fitness_Self_Defence_transparent_1792431331740.png"
OUT = ROOT / "fsd-replit-site/brand-review/shield-proof/assets"
OUT.mkdir(parents=True, exist_ok=True)


def image(*args, data=None):
    subprocess.run(["magick", *map(str, args)], input=data, check=True)


def pixels(path):
    width, height = map(int, subprocess.check_output(
        ["magick", "identify", "-format", "%w %h", str(path)]
    ).split())
    rgba = bytearray(subprocess.check_output(
        ["magick", str(path), "-depth", "8", "rgba:-"]
    ))
    return width, height, rgba


original_hash = sha256(SOURCE.read_bytes()).hexdigest()
raw_shield = OUT / "shield-source-crop.png"
shield = OUT / "shield-isolated.png"
image(SOURCE, "-crop", "310x300+260+0", "+repage", raw_shield)
width, height, rgba = pixels(raw_shield)

# Keep the complete largest connected alpha component. The shield is one
# continuous component; detached wordmark-shadow remnants are not part of it.
# Retained RGB and alpha values are copied without modification.
seen = bytearray(width * height)
largest = []
for start in range(width * height):
    if seen[start] or rgba[start * 4 + 3] == 0:
        continue
    seen[start] = 1
    queue = deque([start])
    component = []
    while queue:
        position = queue.popleft()
        component.append(position)
        x, y = position % width, position // width
        for ny in range(max(0, y - 1), min(height, y + 2)):
            for nx in range(max(0, x - 1), min(width, x + 2)):
                neighbor = ny * width + nx
                if not seen[neighbor] and rgba[neighbor * 4 + 3] != 0:
                    seen[neighbor] = 1
                    queue.append(neighbor)
    if len(component) > len(largest):
        largest = component
keep = set(largest)
removed = 0
for position in range(width * height):
    if position not in keep and rgba[position * 4 + 3] != 0:
        rgba[position * 4 + 3] = 0
        removed += 1
image("-size", f"{width}x{height}", "-depth", "8", "rgba:-",
      "-trim", "+repage", "-strip", shield, data=bytes(rgba))

# Reuse the actual supplied tagline letterforms, not a replacement typeface.
tagline = OUT / "tagline-source.png"
image(SOURCE, "-crop", "827x55+0+487", "+repage", "-trim", "+repage", tagline)
width, height, rgba = pixels(tagline)
active = [any(rgba[(y * width + x) * 4 + 3] > 64 for y in range(height))
          for x in range(width)]
bands = []
start = None
for x, on in enumerate(active + [False]):
    if on and start is None:
        start = x
    if not on and start is not None:
        if bands and start - bands[-1][1] - 1 <= 2:
            bands[-1] = (bands[-1][0], x - 1)
        else:
            bands.append((start, x - 1))
        start = None
if len(bands) != len("FITNESS&SELFDEFENCE"):
    raise RuntimeError(f"Unexpected tagline segmentation: {bands}")

first = OUT / "wording-first-line.png"
second = OUT / "wording-second-line.png"
first_width = bands[7][1] + 3
image(tagline, "-crop", f"{first_width}x{height}+0+0", "+repage", first)
left = bands[8][0]
second_width = bands[18][1] - left + 5
command = ["-size", f"{second_width}x{height}", "xc:none"]
for index in range(8, 19):
    source_index = 8 if index == 17 else index  # C -> existing S: DEFENSE.
    x0 = max(0, bands[source_index][0] - 1)
    x1 = min(width - 1, bands[source_index][1] + 1)
    glyph_width = x1 - x0 + 1
    center = sum(bands[index]) / 2 - left + 2
    destination = round(center - (glyph_width - 1) / 2)
    command.extend(["(", str(tagline), "-crop", f"{glyph_width}x{height}+{x0}+0",
                    "+repage", ")", "-geometry", f"+{destination}+0", "-composite"])
# The added hyphen is the supplied F's existing middle horizontal stroke.
dash = OUT / "hyphen-source-stroke.png"
image(tagline, "-crop", "12x3+4+13", "+repage", dash)
dash_x = round((bands[11][1] + bands[12][0]) / 2 - left + 2 - 6)
command.extend([str(dash), "-geometry", f"+{dash_x}+13", "-composite",
                "-strip", str(second)])
image(*command)

wording = OUT / "website-wording.png"
image("-size", f"{second_width}x{height * 2 + 10}", "xc:none",
      first, "-gravity", "north", "-geometry", "+0+0", "-composite",
      second, "-geometry", f"+0+{height + 10}", "-composite", "-strip", wording)
lockup = OUT / "website-shield-lockup.png"
image("-size", "400x204", "xc:none",
      "(", shield, "-resize", "x106>", ")", "-gravity", "north",
      "-geometry", "+0+0", "-composite",
      wording, "-geometry", "+0+118", "-composite",
      "-strip", "-depth", "8", lockup)
image(lockup, "-define", "webp:lossless=true", "-quality", "100",
      OUT / "website-shield-lockup.webp")
assert sha256(SOURCE.read_bytes()).hexdigest() == original_hash
report = {
    "source_sha256": original_hash,
    "source_unchanged": True,
    "source_alpha": "RGBA, fully transparent background and partial edge alpha",
    "requested_wording": "FITNESS & SELF-DEFENSE",
    "generic_font_used": False,
    "lettering": "Supplied glyphs; C replaced with existing S; hyphen from F middle stroke",
    "detached_alpha_pixels_removed": removed,
    "shield_rgb_and_retained_alpha": "unchanged",
    "remaining_limitation": "Pale source-matte fringe remains; not a final cleaned master",
    "production_files_changed": False,
}
(OUT / "preparation-report.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report, indent=2))
