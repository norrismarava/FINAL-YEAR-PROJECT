"""Remove the light studio background from the phone mockup.

Flood-fills from the image borders across near-white/neutral pixels so the
white UI text inside the phone screen is preserved, then saves a transparent
PNG cropped to the phone's bounding box.
"""

from collections import deque
from PIL import Image, ImageEnhance, ImageFilter

SRC = r"C:\Users\norri\Videos\DIGITAL QUE SYSTEM\WAITLESS\frontend\src\assets\landing-phone-mockup.jpg"
OUT = r"C:\Users\norri\Videos\DIGITAL QUE SYSTEM\WAITLESS\frontend\src\assets\landing-phone-mockup-cut.png"


def is_background(r, g, b):
    """Near-white or neutral light grey (the studio backdrop)."""
    lo, hi = min(r, g, b), max(r, g, b)
    return lo > 195 and (hi - lo) < 32


def is_shadow(r, g, b):
    """Darker neutral grey — the soft floor shadow under the phone."""
    lo, hi = min(r, g, b), max(r, g, b)
    return lo > 150 and (hi - lo) < 50


def main():
    img = Image.open(SRC).convert("RGB")
    w, h = img.size
    px = img.load()

    bg = bytearray(w * h)
    queue = deque()

    for x in range(w):
        for y in (0, h - 1):
            i = y * w + x
            if not bg[i] and is_background(*px[x, y]):
                bg[i] = 1
                queue.append(i)
    for y in range(h):
        for x in (0, w - 1):
            i = y * w + x
            if not bg[i] and is_background(*px[x, y]):
                bg[i] = 1
                queue.append(i)

    while queue:
        i = queue.popleft()
        x, y = i % w, i // w
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h:
                j = ny * w + nx
                if not bg[j] and is_background(*px[nx, ny]):
                    bg[j] = 1
                    queue.append(j)

    # Second pass: the soft floor shadow is darker than the backdrop, so it
    # survives the white pass. It's also disconnected from the image edge, so
    # flood fill can't reach it. Mark every shadow-grey pixel in the bottom
    # band instead — the phone's body sits above this zone.
    shadow_top = int(h * 0.86)
    for y in range(shadow_top, h):
        for x in range(w):
            i = y * w + x
            if not bg[i] and is_shadow(*px[x, y]):
                bg[i] = 1

    alpha = Image.new("L", (w, h), 255)
    ap = alpha.load()
    removed = 0
    for i, v in enumerate(bg):
        if v:
            ap[i % w, i // w] = 0
            removed += 1

    alpha = alpha.filter(ImageFilter.MaxFilter(3)).filter(
        ImageFilter.GaussianBlur(1.1)
    )

    out = img.convert("RGBA")
    out.putalpha(alpha)
    bbox = alpha.point(lambda p: 255 if p > 12 else 0).getbbox()
    if bbox:
        pad = 6
        bbox = (
            max(0, bbox[0] - pad),
            max(0, bbox[1] - pad),
            min(w, bbox[2] + pad),
            min(h, bbox[3] + pad),
        )
        out = out.crop(bbox)

    # Crisp up for hi-dpi displays: mild upscale, then enhance the screen's
    # colour, contrast and sharpness so it reads like a real product shot.
    scale = 1.6
    out = out.resize(
        (round(out.width * scale), round(out.height * scale)), Image.LANCZOS
    )
    rgb = out.convert("RGB")
    rgb = ImageEnhance.Color(rgb).enhance(1.06)
    rgb = ImageEnhance.Contrast(rgb).enhance(1.05)
    rgb = ImageEnhance.Sharpness(rgb).enhance(1.4)
    alpha = out.getchannel("A")
    rgb.putalpha(alpha)
    out = rgb

    out.save(OUT)
    print(f"size={w}x{h} removed={removed} ({removed * 100 // (w * h)}%) -> {OUT}")


if __name__ == "__main__":
    main()
