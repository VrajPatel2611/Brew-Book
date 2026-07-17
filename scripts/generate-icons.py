#!/usr/bin/env python3
"""Brew Book — PWA icon generator.

Draws a simple on-brand mark (roast-brown background, copper cup glyph —
echoing the header .cuplogo mark in index.html) directly with Pillow,
since no SVG->PNG converter (ImageMagick/rsvg-convert/cairosvg) is
available in this environment. One-time generator, output committed —
same idea as scripts/export-seed-sql.js's generated supabase/seed.sql.

Re-run with: python3 scripts/generate-icons.py
"""

import os
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(__file__), '..')
ICONS_DIR = os.path.join(ROOT, 'icons')

BG = (36, 26, 20, 255)       # #241a14 — matches theme-color / manifest background_color
CUP = (207, 127, 69, 255)    # #cf7f45 — copper accent
CUP_LIGHT = (233, 162, 95, 255)  # #e9a25f — highlight
STEAM = (201, 181, 156, 220)     # #c9b59c — steam wisp


def draw_mark(size, margin_frac):
    """Draws the cup mark centered in a size x size canvas, with the glyph
    confined to the inner (1 - 2*margin_frac) fraction of the canvas so
    maskable/rounded platform masks never clip it. Classic "looking into a
    mug" icon language: rounded-bottom body + a rim ellipse at the opening
    + a side handle + rising steam wisps — matches the header .cuplogo mark
    in index.html."""
    img = Image.new('RGBA', (size, size), BG)
    d = ImageDraw.Draw(img)

    m = size * margin_frac
    inner = size - 2 * m  # usable glyph area

    body_w = inner * 0.56
    body_h = inner * 0.46
    top_y = m + inner * 0.42
    bot_y = top_y + body_h
    cx = m + inner * 0.46
    left, right = cx - body_w / 2, cx + body_w / 2

    # Body: rounded only at the bottom two corners (flat top, so the rim
    # ellipse below sits flush against it).
    d.rounded_rectangle([left, top_y, right, bot_y], radius=body_w * 0.22, fill=CUP,
                         corners=(False, False, True, True))

    # Rim: a full ellipse straddling the top edge, as if looking down into
    # the cup — the coffee-surface highlight.
    rim_h = body_w * 0.22
    d.ellipse([left, top_y - rim_h / 2, right, top_y + rim_h / 2], fill=CUP_LIGHT)

    # Handle: a ring touching the right edge of the body, lower half.
    handle_r = body_h * 0.32
    handle_cx = right
    handle_cy = top_y + body_h * 0.6
    handle_w = max(2, int(size * 0.045))
    d.arc(
        [handle_cx - handle_r, handle_cy - handle_r, handle_cx + handle_r, handle_cy + handle_r],
        start=-80, end=80, fill=CUP, width=handle_w
    )

    # Steam: three simple wavy vertical wisps above the cup, each a short
    # zigzag polyline (two humps) — reads clearly as rising steam even at
    # small sizes, unlike stacked arcs which start to look like chevrons.
    steam_w = max(2, int(size * 0.026))
    steam_top = m + inner * 0.04
    steam_bot = top_y - rim_h * 0.7
    steam_h = steam_bot - steam_top
    for dx in (-0.16, 0.0, 0.16):
        sx = cx + inner * dx
        amp = inner * 0.045
        pts = [
            (sx, steam_bot),
            (sx + amp, steam_bot - steam_h * 0.33),
            (sx - amp, steam_bot - steam_h * 0.66),
            (sx, steam_top),
        ]
        d.line(pts, fill=STEAM, width=steam_w, joint='curve')

    return img


def rounded_square_mask(size, radius_frac=0.22):
    """Used only for the favicon so it reads cleanly at tiny sizes."""
    img = draw_mark(size, margin_frac=0.16)
    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size, size], radius=size * radius_frac, fill=255)
    out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


def main():
    os.makedirs(ICONS_DIR, exist_ok=True)

    # Standard "any" purpose icons — full-bleed square, platform applies its own mask.
    draw_mark(192, margin_frac=0.14).save(os.path.join(ICONS_DIR, 'icon-192.png'))
    draw_mark(512, margin_frac=0.14).save(os.path.join(ICONS_DIR, 'icon-512.png'))

    # Maskable icon — extra safe-zone margin so Android's adaptive-icon mask
    # (which can crop up to ~20% from the edges) never clips the glyph.
    draw_mark(512, margin_frac=0.24).save(os.path.join(ICONS_DIR, 'maskable-512.png'))

    # Apple touch icon — iOS rounds this itself, wants an opaque square.
    apple = draw_mark(180, margin_frac=0.16).convert('RGB')
    apple.save(os.path.join(ICONS_DIR, 'apple-touch-icon.png'))

    # Favicon — small enough that a pre-rounded shape reads better in a tab.
    rounded_square_mask(32).save(os.path.join(ROOT, 'favicon.png'))

    print('Wrote icons/icon-192.png, icons/icon-512.png, icons/maskable-512.png, '
          'icons/apple-touch-icon.png, favicon.png')


if __name__ == '__main__':
    main()
