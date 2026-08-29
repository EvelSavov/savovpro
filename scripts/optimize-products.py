#!/usr/bin/env python3
"""Resize product photos and write WebP variants.

Usage:
  python3 scripts/optimize-products.py

For each JPEG/PNG in assets/products/ (except hero-home):
  {stem}.webp      — lightbox, max 1400 px
  {stem}-800.webp  — gallery tile, max 800 px

Originals move to assets/products/originals/ (not for the live site).
Then rewrites gallery/index HTML paths. Rebuild services after this.
"""
from __future__ import annotations

import re
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
PRODUCTS = ROOT / "assets" / "products"
ORIGINALS = PRODUCTS / "originals"
SKIP_STEMS = {"hero-home", "og-share"}
OG_SOURCE_STEM = "20260111_161704-2"
LARGE_PX = 1400
THUMB_PX = 800
LARGE_Q = 78
THUMB_Q = 72
OG_PX = 1200
OG_Q = 82

HTML_FILES = [
    ROOT / "gallery.html",
    ROOT / "index.html",
    ROOT / "about.html",
    ROOT / "contact.html",
    ROOT / "services.html",
    ROOT / "faq.html",
]

SRC_RE = re.compile(
    r'(src=")((?:\.\./)*)(assets/products/)(?!hero-home)([^"]+?)\.(jpe?g|png)(")',
    re.I,
)
HREF_RE = re.compile(
    r'(href=")((?:\.\./)*)(assets/products/)(?!hero-home)([^"]+?)\.(jpe?g|png)(")',
    re.I,
)
ABS_RE = re.compile(
    r'(https://savovpro\.com/assets/products/)(?!hero-home|og-share)([^"/]+?)\.(jpe?g|png)',
    re.I,
)
PICK_RE = re.compile(
    r'(assets/products/)(?!hero-home)([^"]+?)\.(jpe?g|png)',
    re.I,
)


def sources() -> list[Path]:
    files = []
    for path in PRODUCTS.iterdir():
        if not path.is_file():
            continue
        if path.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
            continue
        if path.stem in SKIP_STEMS:
            continue
        files.append(path)
    return sorted(files)


def save_resized(im: Image.Image, dest: Path, max_px: int, quality: int) -> None:
    frame = ImageOps.exif_transpose(im)
    if frame.mode not in ("RGB", "L"):
        frame = frame.convert("RGB")
    elif frame.mode == "L":
        frame = frame.convert("RGB")
    frame.thumbnail((max_px, max_px), Image.Resampling.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    frame.save(dest, "WEBP", quality=quality, method=4)


def convert_one(src: Path) -> tuple[str, int, int]:
    large = PRODUCTS / f"{src.stem}.webp"
    thumb = PRODUCTS / f"{src.stem}-800.webp"
    with Image.open(src) as im:
        save_resized(im, large, LARGE_PX, LARGE_Q)
        save_resized(im, thumb, THUMB_PX, THUMB_Q)
    return src.name, large.stat().st_size, thumb.stat().st_size


def write_og(src: Path) -> None:
    dest = PRODUCTS / "og-share.jpg"
    with Image.open(src) as im:
        frame = ImageOps.exif_transpose(im)
        if frame.mode != "RGB":
            frame = frame.convert("RGB")
        frame.thumbnail((OG_PX, OG_PX), Image.Resampling.LANCZOS)
        frame.save(dest, "JPEG", quality=OG_Q, optimize=True)
    print(f"og-share.jpg {dest.stat().st_size // 1024} KB")


def rewrite_html(text: str) -> str:
    text = SRC_RE.sub(r"\1\2\3\4-800.webp\6", text)
    text = HREF_RE.sub(r"\1\2\3\4.webp\6", text)
    text = ABS_RE.sub(r"\1og-share.jpg", text)
    return text


def rewrite_json_picks() -> None:
    data_dir = ROOT / "services" / "data"
    for path in data_dir.glob("*.json"):
        raw = path.read_text(encoding="utf-8")
        updated = PICK_RE.sub(r"\1\2.webp", raw)
        if updated != raw:
            path.write_text(updated, encoding="utf-8")
            print(f"updated {path.relative_to(ROOT)}")


def main() -> int:
    files = sources()
    if not files:
        print("No JPEG/PNG sources in assets/products/", file=sys.stderr)
        return 1

    print(f"converting {len(files)} photos…")
    before = sum(p.stat().st_size for p in files)
    after_large = 0
    after_thumb = 0
    for i, src in enumerate(files, 1):
        name, large_b, thumb_b = convert_one(src)
        after_large += large_b
        after_thumb += thumb_b
        if i % 40 == 0 or i == len(files):
            print(f"  {i}/{len(files)} {name}")

    og_src = PRODUCTS / f"{OG_SOURCE_STEM}.jpg"
    if not og_src.exists():
        og_src = PRODUCTS / f"{OG_SOURCE_STEM}.jpeg"
    if og_src.exists():
        write_og(og_src)

    ORIGINALS.mkdir(exist_ok=True)
    moved = 0
    for src in files:
        dest = ORIGINALS / src.name
        if dest.exists():
            src.unlink()
        else:
            shutil.move(str(src), str(dest))
        moved += 1

    for html_path in HTML_FILES:
        if not html_path.exists():
            continue
        raw = html_path.read_text(encoding="utf-8")
        updated = rewrite_html(raw)
        if updated != raw:
            html_path.write_text(updated, encoding="utf-8")
            print(f"updated {html_path.name}")

    rewrite_json_picks()

    print(
        f"done. originals {before / 1048576:.1f} MB → "
        f"webp large {after_large / 1048576:.1f} MB + "
        f"thumbs {after_thumb / 1048576:.1f} MB "
        f"({moved} moved to originals/)"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
