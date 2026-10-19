"""Conservative, review-only alpha-edge cleanup. Never edits source assets."""
from collections import deque
from hashlib import sha256
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "fsd-replit-site/brand-review/shield-proof/assets"
OUT = ROOT / "fsd-replit-site/brand-review/shield-edge-candidate/assets"
OUT.mkdir(parents=True, exist_ok=True)
inputs = [
    SOURCE / "shield-isolated.png",
    SOURCE / "website-wording.png",
    SOURCE / "website-shield-lockup.png",
    ROOT / "attached_assets/FSD_Shield_Fitness_Self_Defence_transparent_1792431331740.png",
]
hashes = {path: sha256(path.read_bytes()).hexdigest() for path in inputs}


def run(*args, data=None):
    subprocess.run(["magick", *map(str, args)], input=data, check=True)


def pixels(path):
    width, height = map(int, subprocess.check_output(
        ["magick", "identify", "-format", "%w %h", str(path)]
    ).split())
    return width, height, bytearray(subprocess.check_output(
        ["magick", str(path), "-depth", "8", "rgba:-"]
    ))


width, height, original = pixels(inputs[0])
candidate = bytearray(original)
distance = bytearray([3]) * (width * height)
queue = deque()
for position in range(width * height):
    if original[position * 4 + 3] == 0:
        distance[position] = 0
        queue.append(position)
while queue:
    position = queue.popleft()
    if distance[position] == 2:
        continue
    x, y = position % width, position // width
    for ny in range(max(0, y - 1), min(height, y + 2)):
        for nx in range(max(0, x - 1), min(width, x + 2)):
            neighbor = ny * width + nx
            if distance[neighbor] > distance[position] + 1:
                distance[neighbor] = distance[position] + 1
                queue.append(neighbor)

# Only partially transparent pixels within two native pixels of transparency.
# No RGB changes, erosion, sharpening, painting, tracing or contour replacement.
# Opaque metallic pixels and interior partial-alpha highlights are protected.
for position in range(width * height):
    alpha = original[position * 4 + 3]
    if 0 < alpha < 255 and distance[position] in (1, 2):
        exponent = 2.2 if distance[position] == 1 else 1.6
        candidate[position * 4 + 3] = round(255 * (alpha / 255) ** exponent)

shield = OUT / "shield-edge-candidate.png"
run("-size", f"{width}x{height}", "-depth", "8", "rgba:-",
    "-strip", "-depth", "8", shield, data=bytes(candidate))
new_width, new_height, actual = pixels(shield)
assert (new_width, new_height) == (width, height)
assert all(actual[p:p + 3] == original[p:p + 3]
           for p in range(0, len(actual), 4) if actual[p + 3] > 0)
assert all(actual[p + 3] == 255
           for p in range(0, len(actual), 4) if original[p + 3] == 255)
assert all(actual[i * 4 + 3] == original[i * 4 + 3]
           for i in range(width * height) if distance[i] > 2)

# Identical canvas, coordinates, sizing and lettering to the approved layout.
lockup = OUT / "website-shield-lockup-edge-candidate.png"
run("-size", "400x204", "xc:none",
    "(", shield, "-resize", "x106>", ")", "-gravity", "north",
    "-geometry", "+0+0", "-composite",
    inputs[1], "-geometry", "+0+118", "-composite",
    "-strip", "-depth", "8", lockup)
assert all(sha256(path.read_bytes()).hexdigest() == digest
           for path, digest in hashes.items())
changed = sum(original[p + 3] != actual[p + 3]
              for p in range(0, len(actual), 4))
old_coverage = sum(original[3::4])
new_coverage = sum(actual[3::4])
report = {
    "changed_partial_edge_pixels": changed,
    "opaque_pixels_unchanged": True,
    "interior_alpha_unchanged": True,
    "retained_visible_rgb_unchanged": True,
    "input_assets_and_lettering_unchanged": True,
    "native_canvas_unchanged": [width, height],
    "alpha_weighted_coverage_reduction_percent": round(
        100 * (old_coverage - new_coverage) / old_coverage, 3),
    "method": "Partial-alpha attenuation in a two-native-pixel boundary band",
    "limitation": "Cannot remove opaque matte residue without altering source pixels",
    "approval": "Unapproved candidate; no live-site changes",
}
(OUT / "cleanup-report.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report, indent=2))
