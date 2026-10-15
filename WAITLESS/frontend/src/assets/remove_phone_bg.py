"""Remove the light studio background from the phone mockup — v3.

Per-pixel classification instead of a colour flood fill:
- "bg-like" = bright, near-neutral pixels (studio backdrop / floor shadow).
- Transparent candidates are only cleared when connected to the image border,
  so bright UI islands INSIDE the phone (white text, notch, status icons)
  stay opaque — no more chewed frame edges.
- The mask is then eroded ~2px and blurred, eating the silver halo ring.
"""

from collections import deque
from PIL import Image, ImageEnhance, ImageFilter

SRC = r"C:\Users\norri\Videos\DIGITAL QUE SYSTEM\WAITLESS\frontend\src\assets\landing-phone-mockup.jpg"
OUT = r"C:\Users\norri\Videos\DIGITAL QUE SYSTEM\WAITLESS\frontend\src\assets\landing-phone-mockup-cut.png"


def bg_like(r, g, b):
    """Bright near-neutral pixel (backdrop or its soft shadows)."""
    lo, hi = min(r, g, b), max(r, g, b)
    return lo > 200 and (hi - lo) < 45


def main():
    img = Image.open(SRC).convert("RGB")
    w, h = img.size
    px = img.load()

    # Step 1: per-pixel background candidacy (no connectivity yet).
    cand = bytearray(w * h)
    for y in range(h):
        row = y * w
        for x in range(w):
            if bg_like(*px[x, y]):
                cand[row + x] = 1

    # Extra pass: the floor shadow under the phone is darker grey than the
    # backdrop. Clear anything neutral in the bottom band — the phone body
    # sits above it.
    shadow_top = int(h * 0.88)
    for y in range(shadow_top, h):
        row = y * w
        for x in range(w):
            r, g, b = px[x, y]
            lo, hi = min(r, g, b), max(r, g, b)
            if lo > 150 and (hi - lo) < 60:
                cand[row + x] = 1

    # Step 2: keep transparent ONLY candidates reachable from the border.
    # Interior bg-like islands (white text, icons inside the screen) are
    # enclosed by the phone, so they never get reached -> stay opaque.
    reached = bytearray(w * h)
    queue = deque()
    for x in range(w):
        for y in (0, h - 1):
            i = y * w + x
            if cand[i] and not reached[i]:
                reached[i] = 1
                queue.append(i)
    for y in range(h):
        for x in (0, w - 1):
            i = y * w + x
            if cand[i] and not reached[i]:
                reached[i] = 1
                queue.append(i)

    while queue:
        i = queue.popleft()
        x, y = i % w, i // w
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h:
                j = ny * w + nx
                if cand[j] and not reached[j]:
                    reached[j] = 1
                    queue.append(j)

    alpha = Image.new("L", (w, h), 255)
    ap = alpha.load()
    removed = 0
    for i, v in enumerate(reached):
        if v:
            ap[i % w, i // w] = 0
            removed += 1

    # Erode inward ~2px to eat the anti-aliased halo on the silver frame,
    # then soften for clean edges.
    alpha = alpha.filter(ImageFilter.MinFilter(5)).filter(
        ImageFilter.GaussianBlur(1.0)
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

    # Crisp up for hi-dpi displays.
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
