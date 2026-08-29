#!/usr/bin/env python3
"""Write the shared footer into every public page.

Usage:
  python3 scripts/sync-footer.py

Edit scripts/templates/footer.html, then run this.
Service pages are rebuilt from the same template via build-services.py.
"""
from __future__ import annotations

import sys
from pathlib import Path

from site_chrome import replace_footer

ROOT = Path(__file__).resolve().parents[1]

ROOT_PAGES = [
    "index.html",
    "about.html",
    "contact.html",
    "faq.html",
    "gallery.html",
    "services.html",
    "privacy.html",
    "terms.html",
]


def main() -> int:
    updated = 0
    for name in ROOT_PAGES:
        path = ROOT / name
        raw = path.read_text(encoding="utf-8")
        try:
            next_html = replace_footer(raw, "")
        except ValueError:
            print(f"missing footer: {name}", file=sys.stderr)
            return 1
        if next_html != raw:
            path.write_text(next_html, encoding="utf-8")
            print(f"updated {name}")
            updated += 1
        else:
            print(f"ok {name}")
    print(f"done ({updated} changed)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
