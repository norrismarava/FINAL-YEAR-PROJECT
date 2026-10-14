"""v3 — tight patch over the old name only (stays clear of the slanted
'RECEPTION & ENQUIRIES' line), feathered edges, tilted replacement text."""

from PIL import Image, ImageDraw, ImageFilter, ImageFont

SRC = r"C:\Users\norri\Videos\DIGITAL QUE SYSTEM\WAITLESS\frontend\src\assets\landing-hero-hospital.jpg"
FONT = r"C:\Windows\Fonts\arialbd.ttf"

im = Image.open(SRC).convert("RGB")

def median_at(points):
    rs = sorted(p[0] for p in points)
    gs = sorted(p[1] for p in points)
    bs = sorted(p[2] for p in points)
    n = len(points) // 2
    return (rs[n], gs[n], bs[n])

# Clean panel strip just below the old name, left half (right side rises into RECEPTION)
top_bg = median_at([im.getpixel((x, 588)) for x in range(498, 585, 6)])
bot_bg = median_at([im.getpixel((x, 597)) for x in range(498, 575, 6)])
print("bg", top_bg, bot_bg)

# Patch the old name zone — bottom edge slants up-right to stay clear of
# "RECEPTION & ENQUIRIES" while still covering the old text's descenders
X0, Y0, X1, Y1 = 488, 486, 664, 630
pw, ph = X1 - X0, Y1 - Y0
grad = Image.new("RGB", (1, ph))
gd = ImageDraw.Draw(grad)
for y in range(ph):
    t = y / max(1, ph - 1)
    gd.point((0, y), fill=tuple(int(top_bg[i] + (bot_bg[i] - top_bg[i]) * t) for i in range(3)))
patch = grad.resize((pw, ph))

# Feathered polygon mask: full width at top, slanted bottom edge
mask = Image.new("L", (pw, ph), 0)
ImageDraw.Draw(mask).polygon(
    [(0, 0), (pw, 0), (pw, ph - 48), (0, ph)], fill=255
)
mask = mask.filter(ImageFilter.GaussianBlur(3))
im.paste(patch, (X0, Y0), mask)

im.save(SRC, quality=93)
print("saved — desk text removed")
