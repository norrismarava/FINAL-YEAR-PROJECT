#!/usr/bin/env python3
"""Render the WaitLess 2-minute 1080p marketing video."""
from pathlib import Path
import subprocess
import math
import wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

PROJECT_ROOT = Path(__file__).resolve().parents[3]
WAITLESS_ROOT = PROJECT_ROOT / "WAITLESS"
OUT = WAITLESS_ROOT / "marketing"
ASSETS = OUT / "assets"
FRONTEND_ASSETS = WAITLESS_ROOT / "frontend/src/assets"

W, H = 1920, 1080
FPS = 24
DURATION = 120.0
TR = 0.6  # crossfade seconds

# Brand colors (RGB tuples)
NAVY_950 = (2, 8, 20)
NAVY_900 = (11, 26, 46)
NAVY_800 = (18, 43, 71)
NAVY_700 = (26, 61, 92)
NAVY_500 = (74, 114, 150)
NAVY_300 = (168, 191, 208)
NAVY_100 = (232, 239, 245)
NAVY_50 = (243, 247, 251)

TEAL_900 = (5, 59, 56)
TEAL_800 = (10, 94, 86)
TEAL_700 = (13, 122, 111)
TEAL_600 = (16, 153, 139)
TEAL_500 = (20, 184, 166)
TEAL_400 = (61, 217, 200)
TEAL_300 = (115, 232, 219)
TEAL_200 = (167, 243, 233)
TEAL_100 = (213, 250, 244)
TEAL_50 = (239, 255, 250)

GOLD_500 = (234, 179, 8)
GOLD_400 = (250, 204, 21)
WHITE = (255, 255, 255)
INK = (11, 26, 46)
SLATE = (100, 116, 139)
RED = (220, 38, 38)
AMBER = (245, 158, 11)
GREEN = (22, 163, 74)
BLUE = (37, 99, 235)
PURPLE = (124, 58, 237)
ROSE = (244, 63, 94)

FONT_DIR = "/usr/share/fonts/opentype/inter"
_font_cache = {}
def font(name, size):
    key = (name, size)
    if key not in _font_cache:
        _font_cache[key] = ImageFont.truetype(f"{FONT_DIR}/{name}.otf", size)
    return _font_cache[key]

F_BLACK = lambda s: font("Inter-Black", s)
F_EXB = lambda s: font("Inter-ExtraBold", s)
F_BOLD = lambda s: font("Inter-Bold", s)
F_SEMI = lambda s: font("Inter-SemiBold", s)
F_MED = lambda s: font("Inter-Medium", s)
F_REG = lambda s: font("Inter-Regular", s)

# Images
LOGO_WIDE = PROJECT_ROOT / "Logo" / "WaitLessLogoWordmark4.png"
LOGO_ICON = PROJECT_ROOT / "Logo" / "WaitLessLogo.png"
IMG_HERO = FRONTEND_ASSETS / "landing-hero-hospital.jpg"
IMG_PHONE = FRONTEND_ASSETS / "landing-phone-mockup-cut.png"
IMG_DASH = FRONTEND_ASSETS / "DASHBOARD3.png"
IMG_ADMIN = FRONTEND_ASSETS / "ADMIN DASHBOARD.png"
IMG_QUEUE = FRONTEND_ASSETS / "QUE BOARD/QUE1 FINAL.png"
DEPT_IMAGES = {
    "OPD": FRONTEND_ASSETS / "Every service point, one queue/TRY OPD.jpeg",
    "Triage": FRONTEND_ASSETS / "Every service point, one queue/TRIAGE.jpg",
    "Pharmacy": FRONTEND_ASSETS / "Every service point, one queue/PHAMARCY.jpeg",
    "Lab": FRONTEND_ASSETS / "Every service point, one queue/LABORATORY.jpeg",
    "OI": FRONTEND_ASSETS / "Every service point, one queue/OI CLINIC.jpg",
}

# ---------------------------------------------------------------------------
# Small helpers
# ---------------------------------------------------------------------------
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))

def lerp(a, b, t):
    return a + (b - a) * t

def ease_out(p):
    return 1 - (1 - p) ** 3

def ease_in_out(p):
    return 0.5 - 0.5 * math.cos(math.pi * p)

def alpha_at(t, start, end):
    if t < start:
        return 0.0
    if t > end:
        return 1.0
    return ease_out((t - start) / (end - start))

def load_rgb(path):
    return Image.open(path).convert("RGBA")

_img_cache = {}
def img(path):
    key = str(path)
    if key not in _img_cache:
        _img_cache[key] = Image.open(path).convert("RGBA")
    return _img_cache[key]

def fit(img_obj, max_w, max_h):
    iw, ih = img_obj.size
    scale = min(max_w / iw, max_h / ih)
    return img_obj.resize((max(1, int(iw * scale)), max(1, int(ih * scale))), Image.LANCZOS)

_fit_cache = {}
def fit_cached(path, max_w, max_h):
    key = (str(path), max_w, max_h)
    if key not in _fit_cache:
        _fit_cache[key] = fit(img(path), max_w, max_h)
    return _fit_cache[key]

def paste_fit(base, path, box, alpha=255):
    """box = (x, y, max_w, max_h); paste image fitted & centered."""
    x, y, mw, mh = box
    im = fit_cached(path, mw, mh)
    px = x + (mw - im.width) // 2
    py = y + (mh - im.height) // 2
    if alpha >= 255:
        base.alpha_composite(im, (px, py))
    else:
        layer = im.copy()
        layer.putalpha(layer.getchannel("A").point(lambda p: int(p * alpha / 255)))
        base.alpha_composite(layer, (px, py))

def rounded(draw, box, fill=None, outline=None, width=1, radius=24):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)

def oval(draw, box, fill=None, outline=None, width=1):
    draw.ellipse(box, fill=fill, outline=outline, width=width)

def text(draw, xy, s, fnt, fill):
    draw.text(xy, s, font=fnt, fill=fill)

def text_center_x(draw, cx, y, s, fnt, fill):
    bbox = draw.textbbox((0, 0), s, font=fnt)
    w = bbox[2] - bbox[0]
    draw.text((cx - w / 2, y), s, font=fnt, fill=fill)

def wrap_text(draw, s, fnt, max_w):
    words = s.split()
    lines, cur = [], ""
    for wd in words:
        trial = (cur + " " + wd).strip()
        if draw.textlength(trial, font=fnt) <= max_w or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = wd
    if cur:
        lines.append(cur)
    return lines

def draw_paragraph(draw, x, y, s, fnt, fill, max_w, line_h=1.25, align="left"):
    lines = wrap_text(draw, s, fnt, max_w)
    for ln in lines:
        if align == "center":
            text_center_x(draw, x + max_w / 2, y, ln, fnt, fill)
        else:
            draw.text((x, y), ln, font=fnt, fill=fill)
        y += fnt.size * line_h
    return y

# ---------------------------------------------------------------------------
# Orbs / overlays
# ---------------------------------------------------------------------------
def make_orb(size, color, alpha=70):
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    # radial-ish: multiple ellipses decreasing alpha
    cx = cy = size / 2
    for r in range(size // 2, 0, -8):
        a = int(alpha * (1 - r / (size / 2)) ** 2)
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color + (a,))
    return im.filter(ImageFilter.GaussianBlur(size / 12))

ORBS = {
    "teal": make_orb(520, TEAL_500, 60),
    "blue": make_orb(620, BLUE, 45),
    "cyan": make_orb(460, TEAL_400, 50),
    "gold": make_orb(380, GOLD_500, 35),
    "purple": make_orb(560, PURPLE, 45),
    "green": make_orb(460, GREEN, 45),
}

def add_orbs(base, positions, scale=1.0):
    for name, (x, y) in positions.items():
        orb = ORBS[name]
        if scale != 1.0:
            orb = orb.resize((int(orb.width * scale), int(orb.height * scale)), Image.LANCZOS)
        base.alpha_composite(orb, (int(x - orb.width / 2), int(y - orb.height / 2)))

# ---------------------------------------------------------------------------
# Base backgrounds
# ---------------------------------------------------------------------------
BASES = {}

def prepare_bases():
    dark = load_rgb(ASSETS / "bg_dark.png")
    light = load_rgb(ASSETS / "bg_light.png")
    section = load_rgb(ASSETS / "bg_section.png")

    # Problem base: hero image darkened
    hero = img(IMG_HERO).convert("RGBA")
    hero_fit = fit(hero, W, H)
    problem = Image.new("RGBA", (W, H), NAVY_950 + (255,))
    px = (W - hero_fit.width) // 2
    py = (H - hero_fit.height) // 2
    problem.alpha_composite(hero_fit, (px, py))
    overlay = Image.new("RGBA", (W, H), (2, 8, 20, 150))
    problem.alpha_composite(overlay)
    # gradient darken bottom
    grad = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    for y in range(H):
        a = int(120 * (y / H) ** 1.5)
        gd.line([(0, y), (W, y)], fill=(2, 8, 20, a))
    problem.alpha_composite(grad)
    add_orbs(problem, {"teal": (W * 0.15, H * 0.2), "blue": (W * 0.85, H * 0.25)}, scale=0.8)

    BASES["dark"] = dark
    BASES["light"] = light
    BASES["section"] = section
    BASES["problem"] = problem

# ---------------------------------------------------------------------------
# Common frame furniture
# ---------------------------------------------------------------------------
def draw_progress(base, t):
    d = ImageDraw.Draw(base)
    y = H - 26
    d.rounded_rectangle([0, y, W, y + 6], radius=3, fill=(255, 255, 255, 40))
    d.rounded_rectangle([0, y, int(W * clamp(t / DURATION)), y + 6], radius=3, fill=TEAL_400 + (230,))

def draw_logo(base, x, y, target_h=120, alpha=255, rise=0):
    im = img(LOGO_WIDE)
    scale = target_h / im.height
    im2 = im.resize((int(im.width * scale), target_h), Image.LANCZOS)
    if alpha < 255 or rise != 0:
        im2 = im2.copy()
        a = im2.getchannel("A")
        if alpha < 255:
            a = a.point(lambda p: int(p * alpha / 255))
        if rise != 0:
            # fade handled by caller via alpha; rise shifts position
            pass
        im2.putalpha(a)
    base.alpha_composite(im2, (x, y + rise))
    return im2.width

def draw_icon_circle(d, cx, cy, r, color, glyph=None, glyph_font=None, glyph_color=WHITE):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)
    if glyph:
        text_center_x(d, cx, cy - glyph_font.size * 0.55, glyph, glyph_font, glyph_color)

# ---------------------------------------------------------------------------
# Scene renderers
# ---------------------------------------------------------------------------
def scene_intro(t):
    base = BASES["dark"].copy()
    add_orbs(base, {"teal": (W*0.12, H*0.2), "blue": (W*0.88, H*0.25), "cyan": (W*0.5, H*0.95)}, scale=0.9)
    d = ImageDraw.Draw(base)
    # subtle grid
    for x in range(0, W, 72):
        d.line([(x, 0), (x, H)], fill=(255, 255, 255, 8), width=1)
    for y in range(0, H, 72):
        d.line([(0, y), (W, y)], fill=(255, 255, 255, 8), width=1)

    # ECG sweep line near bottom
    ecg_y = H - 160
    d.line([(0, ecg_y), (W, ecg_y)], fill=TEAL_400 + (60,), width=3)
    # moving bright segment
    seg = int((t * 220) % (W + 400)) - 200
    d.line([(seg, ecg_y), (seg + 220, ecg_y - 40), (seg + 260, ecg_y + 30), (seg + 300, ecg_y)], fill=TEAL_300 + (220,), width=5)

    # Logo reveal
    logo_p = alpha_at(t, 0.6, 2.2)
    logo_rise = int((1 - ease_out(clamp((t - 0.6) / 1.6))) * 60)
    if logo_p > 0:
        # draw logo with alpha by compositing onto overlay
        im = img(LOGO_WIDE)
        target_h = 150
        im2 = im.resize((int(im.width * target_h / im.height), target_h), Image.LANCZOS)
        if logo_p < 1:
            im2 = im2.copy()
            im2.putalpha(im2.getchannel("A").point(lambda p: int(p * logo_p)))
        base.alpha_composite(im2, (int(W/2 - im2.width/2), int(H*0.30 - 40 + logo_rise)))

    # Tagline words reveal
    tagline = "Skip the queue. Not the care."
    words = tagline.split()
    word_fonts = [F_EXB(64) for _ in words]
    # measure total width
    total_w = sum(d.textlength(wd + " ", font=F_EXB(64)) for wd in words)
    x = int(W/2 - total_w/2)
    y = int(H*0.52)
    for i, wd in enumerate(words):
        p = alpha_at(t, 2.4 + i*0.35, 3.0 + i*0.35)
        if p <= 0:
            x += d.textlength(wd + " ", font=F_EXB(64))
            continue
        # color: "queue." outlined? just white; "care." teal italic-ish
        color = TEAL_300 if i >= 3 else WHITE
        layer = Image.new("RGBA", (W, H), (0,0,0,0))
        ld = ImageDraw.Draw(layer)
        ld.text((x, y), wd, font=F_EXB(64), fill=color + (int(255*p),))
        base.alpha_composite(layer)
        x += d.textlength(wd + " ", font=F_EXB(64))

    # Feature chips
    chips = ["Triage-aware", "WhatsApp alerts", "Offline-first", "Live boards"]
    chip_p = [alpha_at(t, 4.2 + i*0.4, 4.8 + i*0.4) for i in range(len(chips))]
    chip_w = 300
    gap = 40
    total = len(chips)*chip_w + (len(chips)-1)*gap
    cx = int(W/2 - total/2)
    cy = int(H*0.68)
    for i, (chip, p) in enumerate(zip(chips, chip_p)):
        if p <= 0:
            continue
        x0 = cx + i*(chip_w+gap)
        rise = int((1-ease_out(p))*30)
        d.rounded_rectangle([x0, cy+rise, x0+chip_w, cy+rise+70], radius=35,
                            fill=(16,34,58, int(220*p)), outline=TEAL_500 + (int(180*p),), width=2)
        text_center_x(d, x0+chip_w/2, cy+rise+18, chip, F_SEMI(30), WHITE + (int(255*p),))

    # Bottom brand line
    p = alpha_at(t, 8.5, 9.5)
    if p > 0:
        text_center_x(d, W/2, H-140, "WaitLess — Replacing confusion with a queue patients can trust.", F_MED(34), NAVY_300 + (int(255*p),))
    return base

def scene_problem(t):
    base = BASES["problem"].copy()
    d = ImageDraw.Draw(base)
    # headline
    hp = alpha_at(t, 0.4, 1.4)
    if hp > 0:
        text_center_x(d, W/2, int(H*0.16), "The queue is broken.", F_EXB(92), WHITE + (int(255*hp),))
        text_center_x(d, W/2, int(H*0.16)+120, "Paper tickets. Blind waits. Zero updates.", F_MED(40), TEAL_300 + (int(255*hp),))

    items = [
        ("Hours of blind waiting", "Patients arrive at 6 AM and wait 4–6 hours with no idea when they will be seen."),
        ("No communication", "Once a paper ticket is issued, there is no update until a nurse shouts a number."),
        ("Triage ignored", "First-come-first-served means critical patients wait behind routine check-ups."),
        ("No operational data", "Managers guess at bottlenecks; there is no record of wait times or outcomes."),
    ]
    y = int(H*0.36)
    for i, (title, desc) in enumerate(items):
        p = alpha_at(t, 1.6 + i*1.1, 2.3 + i*1.1)
        if p <= 0:
            continue
        rise = int((1-ease_out(p))*40)
        yy = y + i*150 + rise
        # card
        d.rounded_rectangle([int(W*0.18), yy, int(W*0.82), yy+120], radius=24,
                            fill=(11,26,46, int(210*p)), outline=TEAL_500 + (int(140*p),), width=2)
        # icon dot
        d.ellipse([int(W*0.18)+30, yy+40, int(W*0.18)+90, yy+100], fill=RED + (int(255*p),))
        text(d, (int(W*0.18)+130, yy+28), title, F_BOLD(38), WHITE + (int(255*p),))
        draw_paragraph(d, int(W*0.18)+130, yy+82, desc, F_REG(28), NAVY_300 + (int(255*p),), int(W*0.5), 1.2)

    p = alpha_at(t, 6.2, 7.0)
    if p > 0:
        text_center_x(d, W/2, int(H*0.9), "Sound familiar?", F_EXB(56), GOLD_400 + (int(255*p),))
    return base

def scene_solution(t):
    base = BASES["dark"].copy()
    add_orbs(base, {"teal": (W*0.1, H*0.15), "blue": (W*0.9, H*0.2), "cyan": (W*0.5, H*1.0)}, scale=0.85)
    d = ImageDraw.Draw(base)
    hp = alpha_at(t, 0.3, 1.2)
    if hp > 0:
        text_center_x(d, W/2, int(H*0.13), "Meet WaitLess.", F_EXB(88), WHITE + (int(255*hp),))
        text_center_x(d, W/2, int(H*0.13)+110, "A real-time digital queue for public hospitals.", F_MED(38), TEAL_300 + (int(255*hp),))

    cards = [
        ("Check in", "Staff desk, patient phone, or kiosk QR — under a minute.", TEAL_500, "✓"),
        ("Triage-aware", "Red/Yellow/Green/Black priority enforced automatically.", RED, "!"),
        ("Live updates", "WhatsApp, web push, and audio alerts at every step.", GREEN, "↗"),
        ("Full visibility", "Staff dashboards, public boards, and 10 reports.", BLUE, "▦"),
    ]
    card_w, card_h = 400, 330
    gap = 50
    total = 4*card_w + 3*gap
    x0 = int(W/2 - total/2)
    y0 = int(H*0.38)
    for i, (title, desc, color, glyph) in enumerate(cards):
        p = alpha_at(t, 1.4 + i*0.7, 2.1 + i*0.7)
        if p <= 0:
            continue
        rise = int((1-ease_out(p))*50)
        x = x0 + i*(card_w+gap)
        y = y0 + rise
        d.rounded_rectangle([x, y, x+card_w, y+card_h], radius=28,
                            fill=(16,34,58, int(230*p)), outline=color + (int(200*p),), width=3)
        # icon
        d.ellipse([x+40, y+40, x+140, y+140], fill=color + (int(255*p),))
        text_center_x(d, x+90, y+88, glyph, F_EXB(52), WHITE + (int(255*p),))
        text(d, (x+40, y+180), title, F_BOLD(42), WHITE + (int(255*p),))
        draw_paragraph(d, x+40, y+240, desc, F_REG(28), NAVY_300 + (int(255*p),), card_w-80, 1.25)

    p = alpha_at(t, 5.6, 6.4)
    if p > 0:
        text_center_x(d, W/2, int(H*0.88), "Built for Zimbabwean public hospitals: offline-first, multilingual, WhatsApp-native.", F_MED(36), TEAL_200 + (int(255*p),))
    return base

def scene_journey(t):
    base = BASES["dark"].copy()
    add_orbs(base, {"teal": (W*0.15, H*0.2), "cyan": (W*0.85, H*0.8)}, scale=0.7)
    d = ImageDraw.Draw(base)
    hp = alpha_at(t, 0.3, 1.2)
    if hp > 0:
        text_center_x(d, W/2, int(H*0.12), "One connected patient journey.", F_EXB(72), WHITE + (int(255*hp),))
        text_center_x(d, W/2, int(H*0.12)+90, "From check-in to pharmacy — every step tracked live.", F_MED(34), TEAL_300 + (int(255*hp),))

    steps = ["Register", "Triage", "Queue", "Called", "Served", "Complete"]
    n = len(steps)
    y = int(H*0.55)
    x_start, x_end = int(W*0.12), int(W*0.88)
    # path line
    d.line([(x_start, y), (x_end, y)], fill=(255,255,255,60), width=6)
    # progress
    prog = clamp(t / 10.5)
    prog_x = lerp(x_start, x_end, prog)
    d.line([(x_start, y), (prog_x, y)], fill=TEAL_400, width=8)
    # moving dot
    d.ellipse([prog_x-18, y-18, prog_x+18, y+18], fill=TEAL_300 + (240,), outline=WHITE, width=3)

    for i, name in enumerate(steps):
        fx = lerp(x_start, x_end, i/(n-1))
        node_p = alpha_at(t, 0.8 + i*0.5, 1.4 + i*0.5)
        active = prog >= (i/(n-1)) - 0.01
        # node circle
        r = 46 if active else 40
        color = TEAL_500 if active else NAVY_700
        d.ellipse([fx-r, y-r, fx+r, y+r], fill=color + (int(255*node_p),), outline=WHITE + (int(120*node_p),), width=3)
        text_center_x(d, fx, y-26, str(i+1), F_BOLD(34), WHITE + (int(255*node_p),))
        # label
        label_y = y + 70
        d.text((fx - d.textlength(name, font=F_SEMI(30))/2, label_y), name, font=F_SEMI(30), fill=(active and TEAL_300 or NAVY_300) + (int(255*node_p),))

    # ticket chip following dot
    p = alpha_at(t, 1.0, 2.0)
    if p > 0:
        d.rounded_rectangle([prog_x-90, y-170, prog_x+90, y-120], radius=20, fill=GOLD_500 + (int(255*p),))
        text_center_x(d, prog_x, y-158, "OPD-205", F_BOLD(34), NAVY_950 + (int(255*p),))
    return base

def scene_triage(t):
    base = BASES["dark"].copy()
    add_orbs(base, {"teal": (W*0.85, H*0.15), "gold": (W*0.15, H*0.85)}, scale=0.6)
    d = ImageDraw.Draw(base)
    hp = alpha_at(t, 0.3, 1.2)
    if hp > 0:
        text_center_x(d, W/2, int(H*0.1), "Triage-aware routing.", F_EXB(76), WHITE + (int(255*hp),))
        text_center_x(d, W/2, int(H*0.1)+95, "The sickest patients are seen first.", F_MED(36), TEAL_300 + (int(255*hp),))

    # Queue panel
    panel_x, panel_y, panel_w, panel_h = int(W*0.08), int(H*0.28), int(W*0.52), int(H*0.6)
    d.rounded_rectangle([panel_x, panel_y, panel_x+panel_w, panel_y+panel_h], radius=28,
                        fill=(11,26,46,220), outline=TEAL_500+(120,), width=2)
    text(d, (panel_x+40, panel_y+30), "LIVE QUEUE", F_BOLD(30), TEAL_300)

    # Tickets: (code, priority, arrival order)
    tickets = [
        ("OPD-201", "GREEN", GREEN), ("OPD-202", "GREEN", GREEN), ("OPD-203", "YELLOW", AMBER),
        ("OPD-204", "GREEN", GREEN), ("OPD-205", "GREEN", GREEN), ("OPD-206", "YELLOW", AMBER),
        ("OPD-207", "RED", RED), ("OPD-208", "GREEN", GREEN),
    ]
    # Before 4s: arrival order. After: priority order (red first, then yellow, then green by arrival)
    reorder_p = alpha_at(t, 3.8, 4.6)
    if reorder_p < 0.5:
        ordered = tickets[:]
    else:
        ordered = sorted(tickets, key=lambda x: ({"RED":0,"YELLOW":1,"GREEN":2,"BLACK":3}[x[1]], x[0]))
    row_h = 86
    for i, (code, pri, col) in enumerate(ordered):
        ry = panel_y + 90 + i*row_h
        if ry + row_h > panel_y + panel_h - 20:
            break
        # highlight red jump
        highlight = (code == "OPD-207" and reorder_p > 0.5)
        row_fill = (col[0]//3, col[1]//3, col[2]//3, 120) if highlight else (255,255,255,10)
        d.rounded_rectangle([panel_x+30, ry, panel_x+panel_w-30, ry+row_h-14], radius=18,
                            fill=row_fill, outline=col+(200 if highlight else 80,), width=3 if highlight else 1)
        # priority bar
        d.rounded_rectangle([panel_x+30, ry, panel_x+44, ry+row_h-14], radius=8, fill=col)
        text(d, (panel_x+70, ry+18), code, F_BOLD(36), WHITE)
        text(d, (panel_x+panel_w-160, ry+22), pri, F_BOLD(26), col)

    # Right: explanation + now serving
    rx = int(W*0.64)
    ry = int(H*0.3)
    d.rounded_rectangle([rx, ry, W-int(W*0.06), ry+int(H*0.34)], radius=28,
                        fill=(16,34,58,230), outline=RED+(220,), width=3)
    text(d, (rx+40, ry+30), "NOW SERVING", F_BOLD(30), RED)
    ns_p = alpha_at(t, 5.0, 6.0)
    if ns_p > 0:
        text_center_x(d, rx + (W-int(W*0.06)-rx)/2, ry+90, "OPD-207", F_EXB(110), WHITE + (int(255*ns_p),))
        text_center_x(d, rx + (W-int(W*0.06)-rx)/2, ry+230, "RED priority — auto fast-tracked", F_MED(30), TEAL_300 + (int(255*ns_p),))

    # Legend
    legend = [("RED","Immediate"),("YELLOW","Urgent"),("GREEN","Standard")]
    lx = rx
    ly = ry + int(H*0.34) + 40
    for name, desc in legend:
        col = {"RED":RED,"YELLOW":AMBER,"GREEN":GREEN}[name]
        d.rounded_rectangle([lx, ly, lx+220, ly+90], radius=18, fill=(255,255,255,12), outline=col+(160,), width=2)
        d.rectangle([lx, ly, lx+12, ly+90], fill=col)
        text(d, (lx+30, ly+18), name, F_BOLD(28), col)
        text(d, (lx+30, ly+52), desc, F_REG(24), NAVY_300)
        lx += 240
    return base

def scene_notifications(t):
    base = BASES["dark"].copy()
    add_orbs(base, {"teal": (W*0.1, H*0.2), "cyan": (W*0.9, H*0.8)}, scale=0.7)
    d = ImageDraw.Draw(base)
    hp = alpha_at(t, 0.3, 1.2)
    if hp > 0:
        text_center_x(d, W/2, int(H*0.09), "WhatsApp-native updates.", F_EXB(72), WHITE + (int(255*hp),))
        text_center_x(d, W/2, int(H*0.09)+90, "Patients know when it's their turn — at zero per-message cost.", F_MED(34), TEAL_300 + (int(255*hp),))

    # Phone left
    phone_box = (int(W*0.08), int(H*0.28), int(W*0.26), int(H*0.6))
    paste_fit(base, IMG_PHONE, phone_box, alpha=255)

    # Chat panel right
    cx, cy, cw, ch = int(W*0.42), int(H*0.26), int(W*0.52), int(H*0.6)
    d.rounded_rectangle([cx, cy, cx+cw, cy+ch], radius=32, fill=(11,20,26,255), outline=(255,255,255,40), width=2)
    # header
    d.rounded_rectangle([cx, cy, cx+cw, cy+90], radius=32, fill=(32,44,52,255))
    d.rectangle([cx, cy+45, cx+cw, cy+90], fill=(32,44,52,255))
    d.ellipse([cx+30, cy+22, cx+86, cy+78], fill=TEAL_500)
    text_center_x(d, cx+58, cy+38, "W", F_BOLD(34), WHITE)
    text(d, (cx+110, cy+28), "WaitLess Hospital", F_BOLD(34), WHITE)
    text(d, (cx+110, cy+68), "online", F_REG(26), (155,174,186))

    msgs = [
        ("You're in the queue — OPD-205", "Track: waitless.app/track", 0.8),
        ("Your turn is approaching. Please return to OPD.", "", 2.6),
        ("OPD-205, please proceed to Room 3.", "", 4.4),
        ("Prescription ready at Pharmacy window.", "", 6.2),
        ("Lab results ready — return to your doctor.", "", 8.0),
    ]
    my = cy + 120
    for i, (body, sub, start) in enumerate(msgs):
        p = alpha_at(t, start, start+0.5)
        if p <= 0:
            continue
        scale = ease_out(p)
        rise = int((1-scale)*30)
        bh = 120 if sub else 100
        bw = cw - 120
        bx = cx + 50
        by = my + i*150 + rise
        # bubble
        d.rounded_rectangle([bx, by, bx+bw, by+bh], radius=24, fill=(32,44,52, int(255*p)), outline=(255,255,255, int(30*p)), width=1)
        # tail
        d.polygon([(bx+10, by+bh-10), (bx-14, by+bh+6), (bx+34, by+bh-18)], fill=(32,44,52, int(255*p)))
        text(d, (bx+30, by+24), body, F_SEMI(30), WHITE + (int(255*p),))
        if sub:
            text(d, (bx+30, by+72), sub, F_REG(26), TEAL_300 + (int(255*p),))
        # timestamp
        text(d, (bx+bw-120, by+bh-38), f"{10+i}:0{i} AM", F_REG(22), (155,174,186, int(255*p)))
    return base

def scene_dashboard(t):
    base = BASES["dark"].copy()
    add_orbs(base, {"teal": (W*0.85, H*0.2), "blue": (W*0.15, H*0.85)}, scale=0.8)
    d = ImageDraw.Draw(base)
    hp = alpha_at(t, 0.3, 1.2)
    if hp > 0:
        text_center_x(d, W/2, int(H*0.09), "One command center for the whole hospital.", F_EXB(64), WHITE + (int(255*hp),))
        text_center_x(d, W/2, int(H*0.09)+85, "Staff dashboards, department modules, and live boards.", F_MED(34), TEAL_300 + (int(255*hp),))

    # Dashboard screenshot left
    dash_box = (int(W*0.06), int(H*0.24), int(W*0.56), int(H*0.64))
    paste_fit(base, IMG_DASH, dash_box, alpha=255)
    # frame
    fx, fy = int(W*0.06), int(H*0.24)
    fw, fh = int(W*0.56), int(H*0.64)
    im = fit_cached(IMG_DASH, fw-40, fh-40)
    px = fx + (fw-im.width)//2
    py = fy + (fh-im.height)//2
    d.rounded_rectangle([px-16, py-16, px+im.width+16, py+im.height+16], radius=24,
                        outline=TEAL_400+(220,), width=4)

    # Highlight boxes over dashboard (approx positions)
    highlights = [
        (px+40, py+40, 260, 90, "Live metrics", 1.2),
        (px+340, py+60, 300, 80, "Call next", 2.4),
        (px+40, py+300, 360, 90, "Bottleneck alerts", 3.6),
    ]
    for hx, hy, hw, hh, label, start in highlights:
        p = alpha_at(t, start, start+0.5)
        if p <= 0:
            continue
        pulse = 0.6 + 0.4*math.sin(t*4)
        d.rounded_rectangle([hx, hy, hx+hw, hy+hh], radius=16,
                            outline=GOLD_400+(int(255*p*pulse),), width=5)
        # label tag
        d.rounded_rectangle([hx, hy-50, hx+220, hy-10], radius=14, fill=GOLD_500+(int(255*p),))
        text_center_x(d, hx+110, hy-44, label, F_BOLD(28), NAVY_950 + (int(255*p),))

    # Department modules right
    rx = int(W*0.68)
    ry = int(H*0.26)
    text(d, (rx, ry), "DEPARTMENT MODULES", F_BOLD(30), TEAL_300)
    depts = [("OPD","Consultations"),("Triage","Priority routing"),("Pharmacy","Prescriptions"),("Lab","Test lifecycle"),("OI","Confidential care")]
    dy = ry + 60
    for i,(name,desc) in enumerate(depts):
        p = alpha_at(t, 1.0+i*0.5, 1.6+i*0.5)
        if p <= 0: continue
        rise = int((1-ease_out(p))*24)
        d.rounded_rectangle([rx, dy+rise, rx+int(W*0.28), dy+rise+120], radius=20,
                            fill=(255,255,255, int(14*p)), outline=TEAL_400+(int(160*p),), width=2)
        # icon image circle
        icon = fit_cached(DEPT_IMAGES.get(name, IMG_HERO), 84, 84)
        mask = Image.new("L", icon.size, 0)
        ImageDraw.Draw(mask).ellipse([0,0,icon.width,icon.height], fill=255)
        icon_rgba = icon.copy(); icon_rgba.putalpha(mask)
        base.alpha_composite(icon_rgba, (rx+20, dy+rise+18))
        text(d, (rx+130, dy+rise+24), name, F_BOLD(34), WHITE + (int(255*p),))
        text(d, (rx+130, dy+rise+72), desc, F_REG(26), NAVY_300 + (int(255*p),))
        dy += 140
    return base

def scene_reports(t):
    base = BASES["dark"].copy()
    add_orbs(base, {"blue": (W*0.85, H*0.2), "purple": (W*0.15, H*0.8)}, scale=0.75)
    d = ImageDraw.Draw(base)
    hp = alpha_at(t, 0.3, 1.2)
    if hp > 0:
        text_center_x(d, W/2, int(H*0.09), "Data that improves care.", F_EXB(76), WHITE + (int(255*hp),))
        text_center_x(d, W/2, int(H*0.09)+95, "10 reports, AI insights, and exports — built in.", F_MED(36), TEAL_300 + (int(255*hp),))

    # Bar chart left
    chart_x, chart_y = int(W*0.08), int(H*0.28)
    chart_w, chart_h = int(W*0.44), int(H*0.58)
    d.rounded_rectangle([chart_x, chart_y, chart_x+chart_w, chart_y+chart_h], radius=28,
                        fill=(11,26,46,220), outline=TEAL_500+(120,), width=2)
    text(d, (chart_x+36, chart_y+28), "WAIT TIME BY DEPARTMENT", F_BOLD(28), TEAL_300)
    depts = ["OPD","Casualty","Pharmacy","Lab","Radiology","OI"]
    values = [42, 28, 55, 38, 61, 24]
    maxv = max(values)
    bar_area_y = chart_y + 90
    bar_area_h = chart_h - 160
    bar_w = 90
    gap = (chart_w - 120 - len(depts)*bar_w) / max(1, len(depts)-1)
    for i,(name,val) in enumerate(zip(depts,values)):
        bx = chart_x + 60 + i*(bar_w+gap)
        grow = ease_out(clamp((t - (1.0+i*0.25)) / 1.2))
        bh = int(bar_area_h * (val/maxv) * grow)
        by = bar_area_y + bar_area_h - bh
        color = [TEAL_500, AMBER, BLUE, PURPLE, GREEN, ROSE][i]
        d.rounded_rectangle([bx, by, bx+bar_w, bar_area_y+bar_area_h], radius=14, fill=color+(230,), outline=WHITE+(80,), width=1)
        # value label
        if grow > 0.6:
            text_center_x(d, bx+bar_w/2, by-44, f"{val}m", F_BOLD(30), WHITE)
        text_center_x(d, bx+bar_w/2, bar_area_y+bar_area_h+16, name, F_SEMI(24), NAVY_300)
    # baseline
    d.line([(chart_x+40, bar_area_y+bar_area_h), (chart_x+chart_w-40, bar_area_y+bar_area_h)], fill=(255,255,255,80), width=3)

    # Right capabilities
    rx = int(W*0.58)
    ry = int(H*0.28)
    caps = [
        ("10 report types", "Wait times, performance, no-shows, triage, peak hours, congestion, and more."),
        ("Export anywhere", "CSV, Excel (XLSX), and PDF with one click."),
        ("AI wait prediction", "Historical data forecasts how long patients will wait."),
        ("Bottleneck analysis", "Spot congestion early and redeploy staff where it matters."),
        ("Resource allocation", "AI suggests where to add capacity for maximum impact."),
        ("Patient chatbot", "Answers common questions in the patient's language."),
    ]
    for i,(title,desc) in enumerate(caps):
        p = alpha_at(t, 1.2+i*0.55, 1.8+i*0.55)
        if p <= 0: continue
        rise = int((1-ease_out(p))*22)
        yy = ry + i*150 + rise
        d.rounded_rectangle([rx, yy, W-int(W*0.06), yy+120], radius=20,
                            fill=(255,255,255, int(12*p)), outline=TEAL_400+(int(150*p),), width=2)
        d.ellipse([rx+24, yy+30, rx+76, yy+82], fill=TEAL_500+(int(255*p),))
        text_center_x(d, rx+50, yy+44, "✓", F_BOLD(30), WHITE+(int(255*p),))
        text(d, (rx+100, yy+20), title, F_BOLD(32), WHITE+(int(255*p),))
        draw_paragraph(d, rx+100, yy+66, desc, F_REG(26), NAVY_300+(int(255*p),), int(W*0.34), 1.15)
    return base

def scene_trust(t):
    base = BASES["dark"].copy()
    add_orbs(base, {"teal": (W*0.5, H*0.5), "gold": (W*0.9, H*0.1)}, scale=0.9)
    d = ImageDraw.Draw(base)
    hp = alpha_at(t, 0.3, 1.2)
    if hp > 0:
        text_center_x(d, W/2, int(H*0.12), "Trust & security, built in.", F_EXB(76), WHITE + (int(255*hp),))
        text_center_x(d, W/2, int(H*0.12)+95, "Designed for clinical and public-sector use.", F_MED(36), TEAL_300 + (int(255*hp),))

    items = [
        ("Role-based access", "Least-privilege roles for every staff member."),
        ("SHA-256 audit trail", "Tamper-evident log for medical-legal compliance."),
        ("Privacy by design", "Ticket codes only on public boards; OI Clinic masked."),
        ("bcrypt authentication", "12-round password hashing and session controls."),
        ("Offline-first", "Core queue operations continue on hospital LAN."),
        ("Multilingual", "English, chiShona, and isiNdebele."),
    ]
    cols = 3
    card_w, card_h = 520, 210
    gap_x, gap_y = 60, 50
    total_w = cols*card_w + (cols-1)*gap_x
    x0 = int(W/2 - total_w/2)
    y0 = int(H*0.32)
    for i,(title,desc) in enumerate(items):
        col = i % cols; row = i // cols
        x = x0 + col*(card_w+gap_x)
        y = y0 + row*(card_h+gap_y)
        p = alpha_at(t, 0.9 + i*0.45, 1.5 + i*0.45)
        if p <= 0: continue
        rise = int((1-ease_out(p))*30)
        y += rise
        d.rounded_rectangle([x, y, x+card_w, y+card_h], radius=24,
                            fill=(16,34,58, int(225*p)), outline=TEAL_400+(int(170*p),), width=2)
        d.ellipse([x+30, y+45, x+95, y+110], fill=TEAL_500+(int(255*p),))
        text_center_x(d, x+62, y+66, "✓", F_BOLD(34), WHITE+(int(255*p),))
        text(d, (x+120, y+32), title, F_BOLD(34), WHITE+(int(255*p),))
        draw_paragraph(d, x+120, y+86, desc, F_REG(27), NAVY_300+(int(255*p),), card_w-160, 1.2)
    return base

def scene_cta(t):
    base = BASES["section"].copy()
    add_orbs(base, {"teal": (W*0.5, H*0.4), "gold": (W*0.85, H*0.85)}, scale=1.0)
    d = ImageDraw.Draw(base)
    # grid
    for x in range(0, W, 90):
        d.line([(x, 0), (x, H)], fill=(255,255,255,6), width=1)
    for y in range(0, H, 90):
        d.line([(0, y), (W, y)], fill=(255,255,255,6), width=1)

    # Logo
    lp = alpha_at(t, 0.3, 1.6)
    if lp > 0:
        im = img(LOGO_WIDE)
        target_h = 170
        im2 = im.resize((int(im.width*target_h/im.height), target_h), Image.LANCZOS)
        if lp < 1:
            im2 = im2.copy(); im2.putalpha(im2.getchannel("A").point(lambda p:int(p*lp)))
        base.alpha_composite(im2, (int(W/2-im2.width/2), int(H*0.24)))

    # Tagline
    tp = alpha_at(t, 1.4, 2.4)
    if tp > 0:
        text_center_x(d, W/2, int(H*0.44), "Replacing confusion with a queue patients can trust.", F_EXB(58), WHITE + (int(255*tp),))

    # URL / credits
    up = alpha_at(t, 2.6, 3.4)
    if up > 0:
        text_center_x(d, W/2, int(H*0.56), "WaitLess — Digital Queue Management for Public Hospitals", F_SEMI(40), TEAL_300 + (int(255*up),))
        text_center_x(d, W/2, int(H*0.56)+70, "waitless.app  •  Final Year Project  •  Chinhoyi Provincial Hospital", F_REG(32), NAVY_300 + (int(255*up),))

    # ECG line sweep
    ecg_y = int(H*0.78)
    d.line([(0, ecg_y), (W, ecg_y)], fill=TEAL_400+(50,), width=3)
    seg = int((t*260) % (W+500)) - 250
    d.line([(seg, ecg_y), (seg+240, ecg_y-50), (seg+280, ecg_y+35), (seg+320, ecg_y)], fill=TEAL_300+(220,), width=5)
    return base

# ---------------------------------------------------------------------------
# Scene list
# ---------------------------------------------------------------------------
SCENES = [
    {"dur": 12.0, "fn": scene_intro},
    {"dur": 12.0, "fn": scene_problem},
    {"dur": 12.0, "fn": scene_solution},
    {"dur": 12.0, "fn": scene_journey},
    {"dur": 12.0, "fn": scene_triage},
    {"dur": 12.0, "fn": scene_notifications},
    {"dur": 12.0, "fn": scene_dashboard},
    {"dur": 12.0, "fn": scene_reports},
    {"dur": 12.0, "fn": scene_trust},
    {"dur": 12.0, "fn": scene_cta},
]

STARTS = []
_t = 0.0
for s in SCENES:
    STARTS.append(_t)
    _t += s["dur"]
TOTAL = _t
assert abs(TOTAL - DURATION) < 0.01, TOTAL

def render_scene(i, local_t):
    local_t = clamp(local_t, 0.0, SCENES[i]["dur"])
    img_rgba = SCENES[i]["fn"](local_t)
    draw_progress(img_rgba, STARTS[i] + local_t)
    return img_rgba.convert("RGB")

def render_frame(t):
    # find segment
    for i, s in enumerate(SCENES):
        start = STARTS[i]
        end = start + s["dur"]
        if t < end or i == len(SCENES)-1:
            # transition with previous (start boundary)
            if i > 0:
                B = start
                if B - TR/2 <= t <= B + TR/2:
                    a = clamp((t - (B - TR/2)) / TR)
                    im_prev = render_scene(i-1, t - STARTS[i-1])
                    im_cur = render_scene(i, t - start)
                    return Image.blend(im_prev, im_cur, a)
            # transition with next (end boundary)
            if i < len(SCENES)-1:
                B = end
                if B - TR/2 <= t <= B + TR/2:
                    a = clamp((t - (B - TR/2)) / TR)
                    im_cur = render_scene(i, t - start)
                    im_next = render_scene(i+1, t - end)
                    return Image.blend(im_cur, im_next, a)
            return render_scene(i, t - start)
    return render_scene(len(SCENES)-1, SCENES[-1]["dur"])

# ---------------------------------------------------------------------------
# Audio
# ---------------------------------------------------------------------------
def make_audio(path):
    sr = 44100
    n = int(sr * DURATION)
    t = np.arange(n) / sr
    audio = np.zeros(n, dtype=np.float64)

    chords = [
        [110.00, 164.81, 220.00, 261.63, 329.63],  # Am
        [87.31, 130.81, 174.61, 220.00, 261.63],   # F
        [130.81, 196.00, 261.63, 329.63, 392.00],  # C
        [98.00, 146.83, 196.00, 246.94, 293.66],   # G
        [110.00, 164.81, 220.00, 261.63, 329.63],  # Am
        [87.31, 130.81, 174.61, 220.00, 261.63],   # F
        [130.81, 196.00, 261.63, 329.63, 392.00],  # C
        [98.00, 146.83, 196.00, 246.94, 293.66],   # G
        [110.00, 164.81, 220.00, 261.63, 329.63],  # Am
        [87.31, 130.81, 174.61, 220.00, 261.63],   # F
    ]
    arp_pattern = [0, 2, 4, 3, 1, 4, 2, 0]

    for i, s in enumerate(SCENES):
        a = int(STARTS[i] * sr)
        b = int((STARTS[i] + s["dur"]) * sr)
        seg_t = t[a:b] - t[a]
        seg_len = len(seg_t)
        chord = chords[i % len(chords)]
        # Pad: detuned sines with raised-cosine envelope
        pad = np.zeros(seg_len)
        for j, f in enumerate(chord):
            gain = 0.16 / (j + 1)
            for det in (-0.0015, 0.0015):
                phase = 2 * np.pi * f * det * seg_t
                env = np.sin(np.pi * seg_t / seg_len) ** 1.6
                pad += gain * np.sin(phase + j * 0.7) * env
        trem = 0.85 + 0.15 * np.sin(2 * np.pi * 0.09 * seg_t + i)
        audio[a:b] += pad * trem * 0.9

        # Bass
        bass_f = chord[0] / 2
        bass = np.sin(2 * np.pi * bass_f * seg_t) * (np.sin(np.pi * seg_t / seg_len) ** 2)
        audio[a:b] += bass * 0.12

        # Arpeggio
        step = 0.55
        k = 0
        for nt in np.arange(0, seg_len / sr, step):
            idx = int(nt * sr)
            if idx >= seg_len:
                break
            f = chord[arp_pattern[k % len(arp_pattern)] % len(chord)] * 2
            dur_n = 1.4
            m = min(int(dur_n * sr), seg_len - idx)
            if m <= 0:
                continue
            tt = np.arange(m) / sr
            note = (np.sin(2*np.pi*f*tt) + 0.3*np.sin(4*np.pi*f*tt)) * np.exp(-tt*2.2)
            audio[a+idx:a+idx+m] += note * 0.05
            k += 1

    # Normalize + fades
    peak = np.max(np.abs(audio))
    if peak > 0:
        audio = audio / peak * 0.82
    fade = int(0.6 * sr)
    audio[:fade] *= np.linspace(0, 1, fade)
    audio[-fade:] *= np.linspace(1, 0, fade)

    # Stereo
    stereo = np.column_stack([audio, audio]).astype(np.float32)
    pcm = (np.clip(stereo, -1, 1) * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(pcm.tobytes())
    print(f"Wrote audio {path}")

# ---------------------------------------------------------------------------
# Render video
# ---------------------------------------------------------------------------
def render_video(audio_path, out_path):
    total_frames = int(DURATION * FPS)
    cmd = [
        "ffmpeg", "-y",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-i", str(audio_path),
        "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "medium",
        "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart",
        str(out_path),
    ]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    try:
        for n in range(total_frames):
            t = n / FPS
            frame = render_frame(t)
            proc.stdin.write(frame.tobytes())
            if n % 240 == 0:
                print(f"frame {n}/{total_frames}")
        proc.stdin.close()
    except BrokenPipeError:
        pass
    stderr = proc.stderr.read().decode(errors="replace")
    rc = proc.wait()
    if rc != 0:
        print("FFmpeg failed:\n", stderr[-4000:])
        raise SystemExit(rc)
    print(f"Wrote video {out_path}")

def main():
    prepare_bases()
    audio_path = ASSETS / "promo_audio.wav"
    out_path = OUT / "WaitLess_Promo_1080p.mp4"
    make_audio(audio_path)
    render_video(audio_path, out_path)

if __name__ == "__main__":
    main()
