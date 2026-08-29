"""Shared site chrome — one footer for every page.

Usage:
  python3 scripts/sync-footer.py
"""
from __future__ import annotations

import re
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent
FOOTER_TEMPLATE = SCRIPTS / "templates" / "footer.html"
FOOTER_RE = re.compile(
    r'[ \t]*<footer\s+class="site-footer"[^>]*>.*?</footer>',
    re.S | re.I,
)


def render_footer(base: str = "") -> str:
    return FOOTER_TEMPLATE.read_text(encoding="utf-8").replace("{{base}}", base).rstrip()


def replace_footer(html: str, base: str = "") -> str:
    if not FOOTER_RE.search(html):
        raise ValueError("no site-footer in HTML")
    return FOOTER_RE.sub(render_footer(base), html, count=1)
