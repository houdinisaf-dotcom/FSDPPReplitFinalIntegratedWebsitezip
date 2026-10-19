"""Review-only dual-reference edge decontamination; no drawing or blur."""
from collections import deque
from hashlib import sha256
from pathlib import Path
from statistics import median
import json
import subprocess

ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / "fsd-replit-site/brand-review"
SOURCE = BASE / "shield-proof/assets"
OUT = BASE / "shield-refined-matte/assets"
OUT.mkdir(parents=True, exist_ok=True)
inputs = [
    SOURCE / "shield-isolated.png", SOURCE / "website-wording.png",
    BASE / "assets/fsd-shield.png",
    ROOT / "attached_assets/Analysis_output_1_1792429068565.png",
    ROOT / "attached_assets/FSD_Shield_Fitness_Self_Defence_transparent_1792431331740.png",
    ROOT / "attached_assets/Screenshot_2026-10-16_at_01.59.17_1792429054212.jpg",
]
hashes = {p: sha256(p.read_bytes()).hexdigest() for p in inputs}


def image(*args, data=None):
    subprocess.run(["magick", *map(str, args)], input=data, check=True)


def pixels(path):
    width, height = map(int, subprocess.check_output(
        ["magick", "identify", "-format", "%w %h", str(path)]
    ).split())
    return width, height, bytearray(subprocess.check_output(
        ["magick", str(path), "-depth", "8", "rgba:-"]
    ))


# Both official references show the same shield. The black-reference crop is
# premultiplied back onto black to recover its original raster colour samples.
# It guides only the ambiguous edge matte, never the protected metallic core.
black = OUT / "black-reference-guide.png"
white = OUT / "white-reference-guide.png"
image(inputs[2], "-background", "black", "-alpha", "remove", "-alpha", "off",
      "-resize", "261x273!", "-strip", black)
image(inputs[3], "-crop", "261x273+283+26", "+repage", "-strip", white)
width, height, original = pixels(inputs[0])
assert (width, height) == (261, 273)
_, _, b = pixels(black)
_, _, w = pixels(white)

distance = bytearray([5]) * (width * height)
queue = deque()
for i in range(width * height):
    if original[i * 4 + 3] == 0:
        distance[i] = 0
        queue.append(i)
while queue:
    i = queue.popleft()
    if distance[i] == 4:
        continue
    x, y = i % width, i // width
    for ny in range(max(0, y - 1), min(height, y + 2)):
        for nx in range(max(0, x - 1), min(width, x + 2)):
            j = ny * width + nx
            if distance[j] > distance[i] + 1:
                distance[j] = distance[i] + 1
                queue.append(j)

result = bytearray(original)
protected = set()
changed = 0
for i in range(width * height):
    p = i * 4
    alpha = original[p + 3]
    if alpha == 0:
        continue
    # Every opaque pixel is protected, including pale specular highlights.
    # Ambiguous opaque residue is not removed at the cost of original artwork.
    if distance[i] > 4 or alpha == 255:
        protected.add(i)
        continue
    # W = A*F + (1-A)*white; B = A*F. Use the reference difference
    # to estimate matte, then unmix the actual white-source pixel (not paint).
    a = 1 - median((w[p + c] - b[p + c]) / 255 for c in range(3))
    a = max(a, 1 - min(w[p:p + 3]) / 255)
    a = min(1.0, max(0.0, a))
    if a < 1 / 255:
        result[p:p + 4] = bytes(4)
    else:
        for c in range(3):
            value = (w[p + c] / 255 - (1 - a)) / a
            result[p + c] = round(255 * min(1.0, max(0.0, value)))
        result[p + 3] = round(255 * a)
    changed += result[p:p + 4] != original[p:p + 4]

shield = OUT / "shield-refined.png"
image("-size", f"{width}x{height}", "-depth", "8", "rgba:-",
      "-strip", "-depth", "8", shield, data=bytes(result))
_, _, actual = pixels(shield)
assert all(actual[i * 4:i * 4 + 4] == original[i * 4:i * 4 + 4] for i in protected)
assert all(actual[p + 3] == 0 for p in range(0, len(actual), 4) if original[p + 3] == 0)
errors = []
for p in range(0, len(actual), 4):
    if original[p + 3] == 0:
        continue
    a = actual[p + 3] / 255
    errors.extend(abs(round(actual[p + c] * a + 255 * (1 - a)) - w[p + c])
                  for c in range(3))
assert max(errors) <= 2, "White-reference registration or reconstruction changed."

lockup = OUT / "website-shield-lockup-refined.png"
image("-size", "400x204", "xc:none",
      "(", shield, "-resize", "x106>", ")", "-gravity", "north",
      "-geometry", "+0+0", "-composite",
      inputs[1], "-geometry", "+0+118", "-composite",
      "-strip", "-depth", "8", lockup)
assert all(sha256(p.read_bytes()).hexdigest() == digest for p, digest in hashes.items())
report = {
    "modified_edge_pixels": changed,
    "protected_metallic_or_interior_pixels": len(protected),
    "protected_pixels_bit_identical": True,
    "all_opaque_source_pixels_bit_identical": True,
    "new_foreground_outside_source_support": 0,
    "white_reference_max_reconstruction_error_8bit": max(errors),
    "source_assets_and_approved_lettering_unchanged": True,
    "native_shield_canvas": [width, height],
    "lockup_canvas": [400, 204],
    "filters": "No blur, sharpening, erosion, dilation or drawn replacement contour",
    "method": "Reference-guided white-matte unmixing in boundary band",
    "caveat": "Registered raster references estimate edge alpha; not an authored vector master",
    "approval": "Refined review asset only; no live-site or product changes",
}
(OUT / "refinement-report.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report, indent=2))
