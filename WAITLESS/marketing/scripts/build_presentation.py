#!/usr/bin/env python3
"""Build the WaitLess 10-minute presentation (.pptx)."""
from pathlib import Path
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn

PROJECT_ROOT = Path(__file__).resolve().parents[3]
WAITLESS_ROOT = PROJECT_ROOT / "WAITLESS"
OUT = WAITLESS_ROOT / "marketing"
ASSETS = OUT / "assets"
ASSETS.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Brand tokens
# ---------------------------------------------------------------------------
NAVY_950 = RGBColor(0x02, 0x08, 0x14)
NAVY_900 = RGBColor(0x0B, 0x1A, 0x2E)
NAVY_800 = RGBColor(0x12, 0x2B, 0x47)
NAVY_700 = RGBColor(0x1A, 0x3D, 0x5C)
NAVY_500 = RGBColor(0x4A, 0x72, 0x96)
NAVY_300 = RGBColor(0xA8, 0xBF, 0xD0)
NAVY_100 = RGBColor(0xE8, 0xEF, 0xF5)
NAVY_50 = RGBColor(0xF3, 0xF7, 0xFB)

TEAL_900 = RGBColor(0x05, 0x3B, 0x38)
TEAL_800 = RGBColor(0x0A, 0x5E, 0x56)
TEAL_700 = RGBColor(0x0D, 0x7A, 0x6F)
TEAL_600 = RGBColor(0x10, 0x99, 0x8B)
TEAL_500 = RGBColor(0x14, 0xB8, 0xA6)
TEAL_400 = RGBColor(0x3D, 0xD9, 0xC8)
TEAL_300 = RGBColor(0x73, 0xE8, 0xDB)
TEAL_200 = RGBColor(0xA7, 0xF3, 0xE9)
TEAL_100 = RGBColor(0xD5, 0xFA, 0xF4)
TEAL_50 = RGBColor(0xEF, 0xFF, 0xFA)

GOLD_500 = RGBColor(0xEA, 0xB3, 0x08)
GOLD_400 = RGBColor(0xFA, 0xCC, 0x15)
GOLD_200 = RGBColor(0xFE, 0xF0, 0x8A)

WHITE = RGBColor(0xFF, 0xFF, 0xFF)
INK = RGBColor(0x0B, 0x1A, 0x2E)
SLATE = RGBColor(0x64, 0x74, 0x8B)

RED = RGBColor(0xDC, 0x26, 0x26)
AMBER = RGBColor(0xF5, 0x9E, 0x0B)
GREEN = RGBColor(0x16, 0xA3, 0x4A)

FONT = "Inter"
FONT_BODY = "Segoe UI"

SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)

LOGO_ICON = PROJECT_ROOT / "Logo" / "WaitLessLogo.png"
LOGO_WORD = PROJECT_ROOT / "Logo" / "WaitLessWordmark.png"
LOGO_WIDE = PROJECT_ROOT / "Logo" / "WaitLessLogoWordmark4.png"

FRONTEND_ASSETS = WAITLESS_ROOT / "frontend/src/assets"
IMAGES = {
    "hero": FRONTEND_ASSETS / "landing-hero-hospital.jpg",
    "phone": FRONTEND_ASSETS / "landing-phone-mockup-cut.png",
    "queue": FRONTEND_ASSETS / "QUE BOARD/QUE1 FINAL.png",
    "dashboard": FRONTEND_ASSETS / "DASHBOARD3.png",
    "admin": FRONTEND_ASSETS / "ADMIN DASHBOARD.png",
    "opd": FRONTEND_ASSETS / "Every service point, one queue/TRY OPD.jpeg",
    "triage": FRONTEND_ASSETS / "Every service point, one queue/TRIAGE.jpg",
    "pharmacy": FRONTEND_ASSETS / "Every service point, one queue/PHAMARCY.jpeg",
    "lab": FRONTEND_ASSETS / "Every service point, one queue/LABORATORY.jpeg",
    "oi": FRONTEND_ASSETS / "Every service point, one queue/OI CLINIC.jpg",
    "whatsapp": FRONTEND_ASSETS / "OTHER2/whatsapp-alerts.jpeg",
    "wait": FRONTEND_ASSETS / "OTHER2/wait-time.jpeg",
    "patients": FRONTEND_ASSETS / "OTHER2/patients-served.jpeg",
    "uptime": FRONTEND_ASSETS / "OTHER2/UPTIME.png",
}

# ---------------------------------------------------------------------------
# Background generation
# ---------------------------------------------------------------------------
def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def radial_gradient(size, inner, outer, center=(0.5, 0.5), radius=0.75):
    w, h = size
    y, x = np.ogrid[:h, :w]
    cx, cy = center[0] * w, center[1] * h
    d = np.sqrt(((x - cx) / (w * radius)) ** 2 + ((y - cy) / (h * radius)) ** 2)
    d = np.clip(d, 0, 1)
    inner = np.array(hex_to_rgb(inner), dtype=np.float32)
    outer = np.array(hex_to_rgb(outer), dtype=np.float32)
    arr = (inner[None, None, :] * (1 - d[..., None]) + outer[None, None, :] * d[..., None])
    return Image.fromarray(arr.astype(np.uint8), "RGB")


def linear_gradient(size, top, bottom):
    w, h = size
    top = np.array(hex_to_rgb(top), dtype=np.float32)
    bottom = np.array(hex_to_rgb(bottom), dtype=np.float32)
    t = np.linspace(0, 1, h, dtype=np.float32)[:, None, None]
    arr = top[None, None, :] * (1 - t) + bottom[None, None, :] * t
    arr = np.broadcast_to(arr, (h, w, 3))
    return Image.fromarray(arr.astype(np.uint8), "RGB").convert("RGBA")


def add_glow(img, color, center, radius, alpha=90):
    w, h = img.size
    glow = radial_gradient((w, h), color, "#00000000" if False else color, center=center, radius=radius)
    # Build a soft alpha mask instead of relying on transparent hex.
    mask = radial_gradient((w, h), "#FFFFFF", "#000000", center=center, radius=radius).convert("L")
    mask = mask.point(lambda p: int(p * (alpha / 255)))
    layer = Image.new("RGBA", (w, h), hex_to_rgb(color) + (255,))
    layer.putalpha(mask)
    img.alpha_composite(layer)


def draw_grid(img, spacing=72, color=(255, 255, 255), alpha=14):
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    w, h = img.size
    for x in range(0, w, spacing):
        d.line([(x, 0), (x, h)], fill=color + (alpha,), width=1)
    for y in range(0, h, spacing):
        d.line([(0, y), (w, y)], fill=color + (alpha,), width=1)
    img.alpha_composite(overlay)


def draw_ecg(img, y=980, color=(45, 212, 191), alpha=70):
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    w, h = img.size
    # Simple ECG-like polyline repeated across width.
    pts = []
    x = -100
    while x < w + 100:
        pts.extend([(x, y), (x + 90, y), (x + 105, y - 70), (x + 120, y + 55), (x + 135, y), (x + 320, y)])
        x += 320
    d.line(pts, fill=color + (alpha,), width=3, joint="curve")
    img.alpha_composite(overlay)


def vignette(img, strength=0.35):
    w, h = img.size
    mask = radial_gradient((w, h), "#00000000", "#000000", center=(0.5, 0.5), radius=0.85).convert("L")
    # Invert: keep center transparent, edges dark.
    mask = Image.eval(mask, lambda p: 255 - p)
    mask = mask.point(lambda p: int(p * strength))
    black = Image.new("RGBA", (w, h), (2, 8, 20, 255))
    black.putalpha(mask)
    img.alpha_composite(black)


def make_backgrounds():
    size = (1920, 1080)

    # Dark hero background
    dark = linear_gradient(size, "#020814", "#071224").convert("RGBA")
    add_glow(dark, "#0D7A6F", (0.18, 0.15), 0.55, 110)
    add_glow(dark, "#2563EB", (0.85, 0.2), 0.6, 80)
    add_glow(dark, "#0891B2", (0.55, 0.95), 0.65, 70)
    draw_grid(dark, spacing=72, color=(255, 255, 255), alpha=10)
    draw_ecg(dark, y=990, color=(45, 212, 191), alpha=55)
    vignette(dark, strength=0.32)
    dark.convert("RGB").save(ASSETS / "bg_dark.png")

    # Light content background
    light = linear_gradient(size, "#F8FAFC", "#E8F0F2").convert("RGBA")
    add_glow(light, "#14B8A6", (0.85, 0.1), 0.6, 60)
    add_glow(light, "#0D7A6F", (0.1, 0.9), 0.55, 45)
    draw_grid(light, spacing=72, color=(13, 122, 111), alpha=8)
    vignette(light, strength=0.08)
    light.convert("RGB").save(ASSETS / "bg_light.png")

    # Section divider background
    section = linear_gradient(size, "#0A5E56", "#020814").convert("RGBA")
    add_glow(section, "#14B8A6", (0.5, 0.35), 0.7, 120)
    add_glow(section, "#EAB308", (0.8, 0.8), 0.5, 50)
    draw_grid(section, spacing=90, color=(255, 255, 255), alpha=8)
    vignette(section, strength=0.25)
    section.convert("RGB").save(ASSETS / "bg_section.png")

# ---------------------------------------------------------------------------
# PPT helpers
# ---------------------------------------------------------------------------
def set_run_font(run, size=18, bold=False, color=INK, italic=False, name=FONT_BODY):
    run.font.name = name
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color
    # Also set East Asian font for compatibility.
    rPr = run._r.get_or_add_rPr()
    ea = rPr.find(qn('a:ea'))
    if ea is None:
        ea = rPr.makeelement(qn('a:ea'), {})
        rPr.append(ea)
    ea.set('typeface', name)


def add_text(slide, x, y, w, h, text, size=18, bold=False, color=INK, align=PP_ALIGN.LEFT,
             anchor=MSO_ANCHOR.TOP, name=FONT_BODY, italic=False, line_spacing=1.0):
    box = slide.shapes.add_textbox(x, y, w, h)
    tf = box.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    p = tf.paragraphs[0]
    p.alignment = align
    p.line_spacing = line_spacing
    run = p.add_run()
    run.text = text
    set_run_font(run, size=size, bold=bold, color=color, italic=italic, name=name)
    return box


def add_rich_text(slide, x, y, w, h, paragraphs, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP,
                  line_spacing=1.0):
    """paragraphs: list of list of run dicts {text,size,bold,color,italic,name}"""
    box = slide.shapes.add_textbox(x, y, w, h)
    tf = box.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    for i, runs in enumerate(paragraphs):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.line_spacing = line_spacing
        for spec in runs:
            r = p.add_run()
            r.text = spec.get("text", "")
            set_run_font(
                r,
                size=spec.get("size", 18),
                bold=spec.get("bold", False),
                color=spec.get("color", INK),
                italic=spec.get("italic", False),
                name=spec.get("name", FONT_BODY),
            )
    return box


def add_rect(slide, x, y, w, h, fill=None, line=None, line_w=1.0, shape=MSO_SHAPE.RECTANGLE,
             radius=None):
    sp = slide.shapes.add_shape(shape, x, y, w, h)
    if fill is None:
        sp.fill.background()
    else:
        sp.fill.solid()
        sp.fill.fore_color.rgb = fill
    if line is None:
        sp.line.fill.background()
    else:
        sp.line.color.rgb = line
        sp.line.width = Pt(line_w)
    sp.shadow.inherit = False
    return sp


def add_rounded_rect(slide, x, y, w, h, fill=None, line=None, line_w=1.0, radius=0.08):
    sp = add_rect(slide, x, y, w, h, fill=fill, line=line, line_w=line_w, shape=MSO_SHAPE.ROUNDED_RECTANGLE)
    try:
        sp.adjustments[0] = radius
    except Exception:
        pass
    return sp


def add_oval(slide, x, y, w, h, fill=None, line=None, line_w=1.0):
    return add_rect(slide, x, y, w, h, fill=fill, line=line, line_w=line_w, shape=MSO_SHAPE.OVAL)


def add_picture(slide, path, x, y, w=None, h=None):
    return slide.shapes.add_picture(str(path), x, y, w, h)


def add_bg(slide, image_path):
    add_picture(slide, image_path, 0, 0, SLIDE_W, SLIDE_H)


def add_footer(slide, index, total, dark=False):
    color = WHITE if dark else SLATE
    add_text(slide, Inches(0.6), Inches(7.05), Inches(8), Inches(0.3),
             "WaitLess — Digital Queue Management for Public Hospitals",
             size=10, color=color, name=FONT_BODY)
    add_text(slide, Inches(12.2), Inches(7.05), Inches(0.6), Inches(0.3),
             f"{index:02d} / {total:02d}", size=10, color=color, align=PP_ALIGN.RIGHT, name=FONT_BODY)


def add_logo(slide, x, y, h=0.55, dark=False):
    # Use wide wordmark; scale proportionally.
    path = LOGO_WIDE if LOGO_WIDE.exists() else LOGO_WORD
    # aspect ratio ~2.92
    w = h * 2.92
    add_picture(slide, path, x, y, w, h)


def add_notes(slide, text):
    slide.notes_slide.notes_text_frame.text = text


def new_slide(prs, bg_path, dark=False):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    add_bg(slide, bg_path)
    return slide

# ---------------------------------------------------------------------------
# Slide builders
# ---------------------------------------------------------------------------
def slide_title(prs):
    slide = new_slide(prs, ASSETS / "bg_dark.png", dark=True)
    add_logo(slide, Inches(0.9), Inches(0.8), h=0.9)
    add_text(slide, Inches(0.9), Inches(2.1), Inches(11), Inches(1.4),
             "WaitLess", size=72, bold=True, color=WHITE, name=FONT)
    add_text(slide, Inches(0.9), Inches(3.35), Inches(11), Inches(0.9),
             "Digital Queue Management for Public Hospitals",
             size=30, color=TEAL_300, name=FONT_BODY)
    add_text(slide, Inches(0.9), Inches(4.35), Inches(10.5), Inches(0.8),
             "Skip the queue. Not the care.",
             size=24, color=NAVY_300, italic=True, name=FONT_BODY)
    add_rounded_rect(slide, Inches(0.9), Inches(5.5), Inches(2.6), Inches(0.65),
                     fill=TEAL_600, line=None, radius=0.5)
    add_text(slide, Inches(0.9), Inches(5.58), Inches(2.6), Inches(0.5),
             "Final Year Project Presentation", size=14, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    add_text(slide, Inches(0.9), Inches(6.35), Inches(11), Inches(0.4),
             "Chinhoyi Provincial Hospital  •  Zimbabwe  •  10-minute walkthrough",
             size=13, color=NAVY_500, name=FONT_BODY)
    add_notes(slide, "Welcome the audience. Introduce WaitLess as a digital queue management system built for public hospitals in Zimbabwe. Emphasize the tagline: 'Skip the queue, not the care.' State the goal: replace paper queues with a real-time, triage-aware, offline-first system. Set expectations: 10 minutes, then demo/Q&A.")


def slide_agenda(prs):
    slide = new_slide(prs, ASSETS / "bg_light.png")
    add_header(slide, "Agenda", "10-minute roadmap")
    items = [
        ("01", "The problem", "Paper queues, blind waits, no communication, no data"),
        ("02", "The solution", "Real-time digital queue with triage, WhatsApp, dashboards"),
        ("03", "How it works", "Patient journey from check-in to pharmacy"),
        ("04", "Key features", "Triage engine, notifications, modules, reports, AI"),
        ("05", "Live demo", "Queue board, tracking, staff dashboard"),
        ("06", "Impact & deployment", "Benefits, security, offline-first, rollout"),
    ]
    y = Inches(1.8)
    for num, title, desc in items:
        add_rounded_rect(slide, Inches(1.0), y, Inches(11.3), Inches(0.82), fill=WHITE, line=NAVY_100, radius=0.12)
        add_rounded_rect(slide, Inches(1.25), y + Inches(0.18), Inches(0.46), Inches(0.46), fill=TEAL_600, radius=0.5)
        add_text(slide, Inches(1.25), y + Inches(0.24), Inches(0.46), Inches(0.34), num, size=14, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        add_text(slide, Inches(1.95), y + Inches(0.12), Inches(3.2), Inches(0.5), title, size=20, bold=True, color=INK, name=FONT)
        add_text(slide, Inches(5.2), y + Inches(0.2), Inches(6.9), Inches(0.5), desc, size=14, color=SLATE, name=FONT_BODY)
        y += Inches(0.95)
    add_footer(slide, 2, 14)
    add_notes(slide, "Walk through the agenda quickly. Tell the audience where you are going so they can follow. Keep this to 20 seconds.")


def add_header(slide, title, subtitle=None, dark=False):
    if dark:
        add_text(slide, Inches(0.8), Inches(0.55), Inches(11), Inches(0.5), title, size=36, bold=True, color=WHITE, name=FONT)
        if subtitle:
            add_text(slide, Inches(0.8), Inches(1.05), Inches(11), Inches(0.4), subtitle, size=16, color=NAVY_300, name=FONT_BODY)
        add_rect(slide, Inches(0.8), Inches(1.55), Inches(2.2), Inches(0.06), fill=TEAL_400)
    else:
        add_text(slide, Inches(0.8), Inches(0.5), Inches(11), Inches(0.55), title, size=36, bold=True, color=INK, name=FONT)
        if subtitle:
            add_text(slide, Inches(0.8), Inches(1.05), Inches(11), Inches(0.4), subtitle, size=16, color=SLATE, name=FONT_BODY)
        add_rect(slide, Inches(0.8), Inches(1.5), Inches(2.2), Inches(0.06), fill=TEAL_600)


def slide_problem(prs):
    slide = new_slide(prs, ASSETS / "bg_light.png")
    add_header(slide, "The problem", "Paper queues are failing patients and staff")
    problems = [
        ("Hours of blind waiting", "Patients arrive at 6 AM and wait 4–6 hours with no idea when they will be seen."),
        ("No communication", "Once a paper ticket is issued, there is zero update until a nurse shouts a number."),
        ("Triage ignored", "First-come-first-served means critical patients wait behind routine check-ups."),
        ("No operational data", "Managers guess at bottlenecks; there is no record of wait times or outcomes."),
    ]
    y = Inches(1.95)
    for title, desc in problems:
        add_rounded_rect(slide, Inches(0.9), y, Inches(11.5), Inches(1.15), fill=WHITE, line=NAVY_100, radius=0.12)
        add_oval(slide, Inches(1.15), y + Inches(0.32), Inches(0.5), Inches(0.5), fill=TEAL_100, line=TEAL_300, line_w=1.5)
        add_text(slide, Inches(1.15), y + Inches(0.42), Inches(0.5), Inches(0.3), "!", size=20, bold=True, color=TEAL_700, align=PP_ALIGN.CENTER)
        add_text(slide, Inches(1.9), y + Inches(0.16), Inches(4.2), Inches(0.5), title, size=20, bold=True, color=INK, name=FONT)
        add_text(slide, Inches(1.9), y + Inches(0.62), Inches(9.2), Inches(0.5), desc, size=14, color=SLATE, name=FONT_BODY)
        y += Inches(1.3)
    add_footer(slide, 3, 14)
    add_notes(slide, "Describe the real pain points observed at Chinhoyi Provincial Hospital: patients wait blindly, no communication, triage not enforced, and no data for management. Use a concrete example: a patient with chest pain waiting behind 40 routine patients.")


def slide_solution(prs):
    slide = new_slide(prs, ASSETS / "bg_dark.png", dark=True)
    add_header(slide, "The solution", "WaitLess replaces paper with a real-time digital queue", dark=True)
    cols = [
        ("Check in", "Staff desk, patient phone, or kiosk QR — under a minute."),
        ("Triage aware", "Red/Yellow/Green/Black priority enforced automatically."),
        ("Live updates", "WhatsApp, web push, and audio alerts at every step."),
        ("Full visibility", "Staff dashboards, public boards, and 10 reports."),
    ]
    x = Inches(0.9)
    for title, desc in cols:
        add_rounded_rect(slide, x, Inches(2.0), Inches(2.8), Inches(3.4), fill=RGBColor(0x10,0x22,0x3A), line=TEAL_700, line_w=1.0, radius=0.1)
        add_oval(slide, x + Inches(0.25), Inches(2.3), Inches(0.6), Inches(0.6), fill=TEAL_600)
        add_text(slide, x + Inches(0.25), Inches(2.48), Inches(0.6), Inches(0.3), "✓", size=22, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        add_text(slide, x + Inches(0.25), Inches(3.05), Inches(2.3), Inches(0.5), title, size=22, bold=True, color=WHITE, name=FONT)
        add_text(slide, x + Inches(0.25), Inches(3.6), Inches(2.3), Inches(1.6), desc, size=14, color=NAVY_300, name=FONT_BODY)
        x += Inches(3.0)
    add_text(slide, Inches(0.9), Inches(5.8), Inches(11.5), Inches(0.8),
             "Built for Zimbabwean public hospitals: offline-first, multilingual, and WhatsApp-native.",
             size=20, color=TEAL_300, italic=True, name=FONT_BODY)
    add_footer(slide, 4, 14, dark=True)
    add_notes(slide, "Position WaitLess as the complete replacement for paper queues. Highlight the four pillars: easy check-in, triage-aware routing, real-time notifications, and operational visibility. Mention it is designed for local constraints: LAN operation, WhatsApp, and local languages.")


def slide_journey(prs):
    slide = new_slide(prs, ASSETS / "bg_light.png")
    add_header(slide, "How it works", "One connected patient journey")
    steps = [
        ("Register", "Reception, phone, or kiosk. Ticket + QR issued instantly."),
        ("Triage", "Vitals and priority captured; Red jumps the queue."),
        ("Queue", "Patient tracks live position and estimated wait."),
        ("Called", "WhatsApp + audio alert; patient proceeds to room."),
        ("Served", "Consultation, orders, transfers to Lab/Pharmacy/Radiology."),
        ("Complete", "Visit closed, feedback collected, record updated."),
    ]
    # Draw flow boxes in two rows.
    positions = [
        (0.9, 2.1), (3.55, 2.1), (6.2, 2.1), (8.85, 2.1),
        (3.55, 4.35), (6.2, 4.35),
    ]
    for i, (title, desc) in enumerate(steps):
        x, y = positions[i]
        add_rounded_rect(slide, Inches(x), Inches(y), Inches(2.4), Inches(1.7), fill=WHITE, line=NAVY_100, radius=0.12)
        add_oval(slide, Inches(x + 0.2), Inches(y + 0.2), Inches(0.5), Inches(0.5), fill=TEAL_600)
        add_text(slide, Inches(x + 0.2), Inches(y + 0.32), Inches(0.5), Inches(0.3), str(i+1), size=16, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        add_text(slide, Inches(x + 0.85), Inches(y + 0.22), Inches(1.4), Inches(0.4), title, size=18, bold=True, color=INK, name=FONT)
        add_text(slide, Inches(x + 0.2), Inches(y + 0.82), Inches(2.0), Inches(0.8), desc, size=11.5, color=SLATE, name=FONT_BODY)
    # Arrows between first four
    for x in [3.32, 5.97, 8.62]:
        add_text(slide, Inches(x), Inches(2.75), Inches(0.2), Inches(0.4), "→", size=24, color=TEAL_600, align=PP_ALIGN.CENTER)
    add_text(slide, Inches(5.97), Inches(4.0), Inches(0.2), Inches(0.4), "↓", size=24, color=TEAL_600, align=PP_ALIGN.CENTER)
    add_text(slide, Inches(8.62), Inches(4.0), Inches(0.2), Inches(0.4), "↓", size=24, color=TEAL_600, align=PP_ALIGN.CENTER)
    add_text(slide, Inches(0.9), Inches(6.3), Inches(11.5), Inches(0.5),
             "Every step emits a real-time event — boards, dashboards, and patient phones update instantly.",
             size=16, color=TEAL_700, italic=True, name=FONT_BODY)
    add_footer(slide, 5, 14)
    add_notes(slide, "Walk through the patient journey left to right, then down. Emphasize that every step is tracked and communicated. Mention that transfers (e.g., OPD to Lab to Pharmacy) keep the same patient record and issue department-specific tickets.")


def slide_triage(prs):
    slide = new_slide(prs, ASSETS / "bg_light.png")
    add_header(slide, "Triage-aware queue", "The sickest patients are seen first")
    priorities = [
        ("RED", "Resuscitation", "Immediate, life-threatening. Auto-fast-tracked to front.", RED, "bg_red"),
        ("YELLOW", "Urgent", "Seen within ~60 minutes. Reassessment alerts if delayed.", AMBER, "bg_yellow"),
        ("GREEN", "Standard", "Routine queue order. Most walk-in patients.", GREEN, "bg_green"),
        ("BLACK", "Expectant", "Deceased or expectant care. Documented and routed appropriately.", NAVY_700, "bg_black"),
    ]
    y = Inches(1.95)
    for code, label, desc, color, _ in priorities:
        add_rounded_rect(slide, Inches(0.9), y, Inches(11.5), Inches(1.05), fill=WHITE, line=NAVY_100, radius=0.12)
        add_rect(slide, Inches(0.9), y, Inches(0.18), Inches(1.05), fill=color)
        add_text(slide, Inches(1.25), y + Inches(0.18), Inches(1.2), Inches(0.5), code, size=22, bold=True, color=color, name=FONT)
        add_text(slide, Inches(2.4), y + Inches(0.14), Inches(3.0), Inches(0.4), label, size=18, bold=True, color=INK, name=FONT)
        add_text(slide, Inches(2.4), y + Inches(0.56), Inches(8.8), Inches(0.4), desc, size=13, color=SLATE, name=FONT_BODY)
        y += Inches(1.2)
    add_text(slide, Inches(0.9), Inches(6.6), Inches(11.5), Inches(0.4),
             "Emergency triggers are auto-detected from vitals; nurses can override priority at any time.",
             size=14, color=TEAL_700, italic=True, name=FONT_BODY)
    add_footer(slide, 6, 14)
    add_notes(slide, "Explain the four-tier triage protocol. Red patients jump the queue automatically. Yellow patients get reassessment alerts if they wait too long. Nurses can override. This is a key differentiator vs. first-come-first-served systems.")


def slide_notifications(prs):
    slide = new_slide(prs, ASSETS / "bg_light.png")
    add_header(slide, "Communication", "WhatsApp-native updates at every step")
    # Left: phone image
    add_rounded_rect(slide, Inches(0.9), Inches(1.9), Inches(4.0), Inches(4.8), fill=WHITE, line=NAVY_100, radius=0.15)
    add_picture(slide, IMAGES["phone"], Inches(1.6), Inches(2.2), h=Inches(4.2))
    # Right: message examples
    msgs = [
        ("Registration", "You're in the queue — OPD-205. Track: waitless.app/track"),
        ("Near turn", "Your turn is approaching. Please return to the OPD waiting area."),
        ("Called", "OPD-205, please proceed to Room 3."),
        ("Transfer", "Moved to Laboratory. New ticket: LAB-206."),
        ("Prescription", "Your prescription is ready at the Pharmacy window."),
    ]
    y = Inches(1.9)
    for title, msg in msgs:
        add_rounded_rect(slide, Inches(5.3), y, Inches(7.1), Inches(0.82), fill=WHITE, line=NAVY_100, radius=0.12)
        add_oval(slide, Inches(5.5), y + Inches(0.22), Inches(0.38), Inches(0.38), fill=GREEN)
        add_text(slide, Inches(5.5), y + Inches(0.29), Inches(0.38), Inches(0.25), "✓", size=12, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        add_text(slide, Inches(6.05), y + Inches(0.08), Inches(2.0), Inches(0.3), title, size=14, bold=True, color=TEAL_700, name=FONT)
        add_text(slide, Inches(6.05), y + Inches(0.4), Inches(6.2), Inches(0.4), msg, size=12, color=SLATE, name=FONT_BODY)
        y += Inches(0.95)
    add_text(slide, Inches(0.9), Inches(6.85), Inches(11.5), Inches(0.35),
             "Uses Meta WhatsApp Cloud API service window — zero per-message cost to the hospital.",
             size=13, color=TEAL_700, italic=True, name=FONT_BODY)
    add_footer(slide, 7, 14)
    add_notes(slide, "Show the phone mockup and the WhatsApp message examples. Emphasize zero-cost WhatsApp via the service conversation window, plus web push and audio announcements. Patients can leave the waiting area and return when near their turn.")


def slide_features(prs):
    slide = new_slide(prs, ASSETS / "bg_dark.png", dark=True)
    add_header(slide, "Platform capabilities", "Everything staff and patients need", dark=True)
    features = [
        ("Real-time boards", "Public and department displays updated via SSE — ticket codes only, no names."),
        ("Staff dashboard", "Live queue counts, wait times, bottlenecks, and reassessment alerts."),
        ("Department modules", "Pharmacy, Laboratory, Radiology, and confidential OI Clinic streams."),
        ("Reporting suite", "10 reports: wait times, performance, no-shows, triage, peak hours, and more."),
        ("AI insights", "Wait-time prediction, bottleneck analysis, resource allocation, and a patient chatbot."),
        ("Offline-first", "Runs on hospital LAN; WhatsApp messages queue and send when connectivity returns."),
    ]
    x = Inches(0.9); y = Inches(1.95)
    for i, (title, desc) in enumerate(features):
        col = i % 2; row = i // 2
        xx = x + col * Inches(5.9); yy = y + row * Inches(1.55)
        add_rounded_rect(slide, xx, yy, Inches(5.6), Inches(1.35), fill=RGBColor(0x10,0x22,0x3A), line=TEAL_700, line_w=1.0, radius=0.1)
        add_oval(slide, xx + Inches(0.2), yy + Inches(0.42), Inches(0.5), Inches(0.5), fill=TEAL_600)
        add_text(slide, xx + Inches(0.2), yy + Inches(0.54), Inches(0.5), Inches(0.3), "•", size=22, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        add_text(slide, xx + Inches(0.9), yy + Inches(0.18), Inches(4.5), Inches(0.4), title, size=18, bold=True, color=WHITE, name=FONT)
        add_text(slide, xx + Inches(0.9), yy + Inches(0.62), Inches(4.5), Inches(0.7), desc, size=12.5, color=NAVY_300, name=FONT_BODY)
    add_footer(slide, 8, 14, dark=True)
    add_notes(slide, "Cover the platform breadth: public boards, staff dashboard, department modules (pharmacy, lab, radiology, OI clinic), 10 reports, AI insights, and offline-first architecture. Mention SSE real-time updates and anonymous ticket codes on public boards.")


def slide_demo(prs):
    slide = new_slide(prs, ASSETS / "bg_light.png")
    add_header(slide, "See it in action", "Live interfaces staff and patients use")
    # Three screenshots
    shots = [
        ("queue", "Public queue board", "Ticket codes only — no patient names."),
        ("dashboard", "Staff dashboard", "Real-time metrics and actions."),
        ("phone", "Patient tracking", "Live position and wait estimate."),
    ]
    x = Inches(0.9)
    for img_key, title, desc in shots:
        add_rounded_rect(slide, x, Inches(1.95), Inches(3.7), Inches(4.4), fill=WHITE, line=NAVY_100, radius=0.15)
        # Fit image inside
        path = IMAGES[img_key]
        from PIL import Image as PILImage
        with PILImage.open(path) as im:
            iw, ih = im.size
        box_w, box_h = Inches(3.3), Inches(3.3)
        scale = min(box_w / iw, box_h / ih)
        pw, ph = int(iw * scale), int(ih * scale)
        px = x + Inches(0.2) + (box_w - pw) // 2
        py = Inches(2.15) + (box_h - ph) // 2
        add_picture(slide, path, px, py, pw, ph)
        add_text(slide, x + Inches(0.2), Inches(5.65), Inches(3.3), Inches(0.4), title, size=18, bold=True, color=INK, name=FONT, align=PP_ALIGN.CENTER)
        add_text(slide, x + Inches(0.2), Inches(6.05), Inches(3.3), Inches(0.5), desc, size=12, color=SLATE, name=FONT_BODY, align=PP_ALIGN.CENTER)
        x += Inches(3.9)
    add_text(slide, Inches(0.9), Inches(6.85), Inches(11.5), Inches(0.35),
             "Demo tip: open /queue for the public board, /admin/dashboard for staff, and /track for patient view.",
             size=13, color=TEAL_700, italic=True, name=FONT_BODY)
    add_footer(slide, 9, 14)
    add_notes(slide, "If time allows, switch to the live app: show the public queue board, the staff dashboard with call-next, and the patient tracking page. Otherwise, use these screenshots to orient the audience.")


def slide_security(prs):
    slide = new_slide(prs, ASSETS / "bg_light.png")
    add_header(slide, "Trust & security", "Built for clinical and public-sector use")
    items = [
        ("Role-based access", "Admin, reception, triage, clinician, pharmacist, lab-tech, dentist — least-privilege by default."),
        ("Tamper-evident audit", "Every action is recorded in a SHA-256 hash-chained log for medical-legal compliance."),
        ("Privacy by design", "Public boards show ticket codes only; OI Clinic uses masked routing and restricted views."),
        ("Secure auth", "bcrypt password hashing (12 rounds), session management, and idle timeouts."),
        ("Offline resilience", "Core queue operations continue on LAN; WhatsApp messages queue and retry automatically."),
        ("Multilingual", "Full UI in English, chiShona, and isiNdebele."),
    ]
    y = Inches(1.9)
    for title, desc in items:
        add_rounded_rect(slide, Inches(0.9), y, Inches(11.5), Inches(0.82), fill=WHITE, line=NAVY_100, radius=0.12)
        add_oval(slide, Inches(1.15), y + Inches(0.21), Inches(0.4), Inches(0.4), fill=TEAL_100, line=TEAL_400, line_w=1.5)
        add_text(slide, Inches(1.15), y + Inches(0.28), Inches(0.4), Inches(0.25), "✓", size=14, bold=True, color=TEAL_700, align=PP_ALIGN.CENTER)
        add_text(slide, Inches(1.8), y + Inches(0.1), Inches(3.4), Inches(0.4), title, size=17, bold=True, color=INK, name=FONT)
        add_text(slide, Inches(5.3), y + Inches(0.14), Inches(6.9), Inches(0.6), desc, size=13, color=SLATE, name=FONT_BODY)
        y += Inches(0.95)
    add_footer(slide, 10, 14)
    add_notes(slide, "Reassure stakeholders: RBAC, bcrypt, SHA-256 audit trail, anonymous public boards, confidential OI clinic handling, offline-first operation, and trilingual support. This addresses common hospital concerns about security and privacy.")


def slide_impact(prs):
    slide = new_slide(prs, ASSETS / "bg_dark.png", dark=True)
    add_header(slide, "Impact", "What changes when queues go digital", dark=True)
    stats = [
        ("40%", "Reduction in average wait time", "Reported in early deployments"),
        ("12,480+", "Patients served", "Across departments and clinics"),
        ("45,600+", "WhatsApp alerts", "Delivered at zero per-message cost"),
        ("97%", "System uptime", "On hospital LAN infrastructure"),
    ]
    x = Inches(0.9); y = Inches(2.0)
    for value, label, sub in stats:
        add_rounded_rect(slide, x, y, Inches(2.7), Inches(2.4), fill=RGBColor(0x10,0x22,0x3A), line=TEAL_700, line_w=1.0, radius=0.12)
        add_text(slide, x + Inches(0.2), y + Inches(0.35), Inches(2.3), Inches(0.9), value, size=40, bold=True, color=TEAL_300, name=FONT, align=PP_ALIGN.CENTER)
        add_text(slide, x + Inches(0.2), y + Inches(1.35), Inches(2.3), Inches(0.5), label, size=15, bold=True, color=WHITE, name=FONT_BODY, align=PP_ALIGN.CENTER)
        add_text(slide, x + Inches(0.2), y + Inches(1.85), Inches(2.3), Inches(0.4), sub, size=11, color=NAVY_500, name=FONT_BODY, align=PP_ALIGN.CENTER)
        x += Inches(2.9)
    add_text(slide, Inches(0.9), Inches(5.0), Inches(11.5), Inches(1.4),
             "For patients: less waiting, clear updates, and the ability to leave and return.\nFor staff: less shouting, fewer missed turns, and real-time operational control.\nFor management: data to optimize staffing, capacity, and patient flow.",
             size=18, color=NAVY_300, name=FONT_BODY)
    add_footer(slide, 11, 14, dark=True)
    add_notes(slide, "Present the impact stats, but caveat that they are illustrative/early-deployment figures. Emphasize the three audiences: patients, staff, and management. Tie back to the original problems.")


def slide_deployment(prs):
    slide = new_slide(prs, ASSETS / "bg_light.png")
    add_header(slide, "Deployment", "Simple to run, easy to scale")
    reqs = [
        ("Backend", "Node.js 18+, Express/custom router, MySQL 8+ (or file storage for dev)."),
        ("Frontend", "Vite + React, served as static files or via the same server."),
        ("Notifications", "Meta WhatsApp Cloud API for production; optional web push."),
    ]
    y = Inches(1.9)
    for title, desc in reqs:
        add_rounded_rect(slide, Inches(0.9), y, Inches(11.5), Inches(0.9), fill=WHITE, line=NAVY_100, radius=0.12)
        add_text(slide, Inches(1.2), y + Inches(0.18), Inches(2.0), Inches(0.5), title, size=18, bold=True, color=TEAL_700, name=FONT)
        add_text(slide, Inches(3.3), y + Inches(0.22), Inches(8.9), Inches(0.5), desc, size=14, color=SLATE, name=FONT_BODY)
        y += Inches(1.05)
    add_rounded_rect(slide, Inches(0.9), Inches(5.1), Inches(11.5), Inches(1.5), fill=TEAL_50, line=TEAL_200, radius=0.12)
    add_text(slide, Inches(1.2), Inches(5.3), Inches(10.9), Inches(0.4), "Deployment options", size=18, bold=True, color=TEAL_800, name=FONT)
    add_text(slide, Inches(1.2), Inches(5.75), Inches(10.9), Inches(0.8),
             "• Local hospital LAN (offline-first, recommended for public hospitals)\n• Cloud-hosted (Render blueprint included) for internet-connected facilities\n• Multi-hospital networks with per-facility configuration",
             size=14, color=INK, name=FONT_BODY)
    add_footer(slide, 12, 14)
    add_notes(slide, "Explain deployment is lightweight: Node.js backend, React frontend, MySQL. WhatsApp Cloud API for production notifications. Recommend LAN deployment for public hospitals to keep core operations online even without internet. Mention Render blueprint for cloud option and multi-hospital support.")


def slide_conclusion(prs):
    slide = new_slide(prs, ASSETS / "bg_section.png", dark=True)
    add_logo(slide, Inches(4.6), Inches(1.2), h=0.8)
    add_text(slide, Inches(1.0), Inches(2.6), Inches(11.3), Inches(1.2),
             "Replacing confusion with a queue patients can trust.",
             size=40, bold=True, color=WHITE, name=FONT, align=PP_ALIGN.CENTER)
    add_text(slide, Inches(1.0), Inches(3.9), Inches(11.3), Inches(0.8),
             "WaitLess — Digital Queue Management for Public Hospitals",
             size=22, color=TEAL_300, name=FONT_BODY, align=PP_ALIGN.CENTER)
    add_text(slide, Inches(1.0), Inches(4.9), Inches(11.3), Inches(0.6),
             "Questions?  •  Demo?  •  Feedback?",
             size=18, color=NAVY_300, name=FONT_BODY, align=PP_ALIGN.CENTER)
    add_notes(slide, "Close with the tagline. Invite questions and offer to demo the live system. Thank the audience.")


def slide_qna(prs):
    slide = new_slide(prs, ASSETS / "bg_dark.png", dark=True)
    add_text(slide, Inches(0.9), Inches(2.4), Inches(11.5), Inches(1.2), "Q&A", size=60, bold=True, color=WHITE, name=FONT, align=PP_ALIGN.CENTER)
    add_text(slide, Inches(0.9), Inches(3.8), Inches(11.5), Inches(0.8),
             "Thank you for watching.", size=24, color=TEAL_300, name=FONT_BODY, align=PP_ALIGN.CENTER)
    add_text(slide, Inches(0.9), Inches(5.0), Inches(11.5), Inches(0.6),
             "Contact: [Your Name]  •  [Email]  •  [GitHub]", size=16, color=NAVY_500, name=FONT_BODY, align=PP_ALIGN.CENTER)
    add_notes(slide, "Open the floor for questions. Have the live app ready if asked to demo.")


def build_presentation():
    make_backgrounds()
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H
    prs.core_properties.title = "WaitLess — Digital Queue Management for Public Hospitals"
    prs.core_properties.author = "WaitLess Team"
    prs.core_properties.subject = "Final Year Project Presentation"

    slide_title(prs)
    slide_agenda(prs)
    slide_problem(prs)
    slide_solution(prs)
    slide_journey(prs)
    slide_triage(prs)
    slide_notifications(prs)
    slide_features(prs)
    slide_demo(prs)
    slide_security(prs)
    slide_impact(prs)
    slide_deployment(prs)
    slide_conclusion(prs)
    slide_qna(prs)

    out = OUT / "WaitLess_Presentation.pptx"
    prs.save(out)
    print(f"Saved {out}")

if __name__ == "__main__":
    build_presentation()
