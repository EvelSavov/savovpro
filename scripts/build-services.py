#!/usr/bin/env python3
"""Build service detail pages from template + JSON data.

Usage:
  python3 scripts/build-services.py
  npm run build:services

Edit content in services/data/*.json
Edit shared chrome in scripts/templates/service.html
"""
from __future__ import annotations

import json
import sys
from html import escape
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
SERVICES = ROOT / "services"
DATA_DIR = SERVICES / "data"
TEMPLATE_PATH = ROOT / "scripts" / "templates" / "service.html"


def render_cards(cards: list) -> str:
    if not cards:
        return ""
    parts = ['          <div class="svc-cards">']
    for card in cards:
        parts.append("            <div class=\"svc-card\">")
        parts.append(f"              <h3>{escape(card['title'])}</h3>")
        parts.append(f"              <p>{escape(card['text'])}</p>")
        parts.append("            </div>")
    parts.append("          </div>")
    return "\n".join(parts) + "\n"


def render_list(items: list) -> str:
    parts = ['          <ul class="svc-list">']
    for item in items:
        if item.get("label"):
            parts.append(
                f"            <li><strong>{escape(item['label'])}</strong> — {escape(item['text'])}</li>"
            )
        else:
            parts.append(f"            <li>{escape(item['text'])}</li>")
    parts.append("          </ul>")
    return "\n".join(parts) + "\n"


def render_steps(steps: list) -> str:
    if not steps:
        return ""
    parts = ['          <div class="process-steps">']
    for step in steps:
        parts.append("            <div class=\"process-step\">")
        parts.append('              <div class="process-step-num" aria-hidden="true"></div>')
        parts.append("              <div>")
        parts.append(f"                <h4>{escape(step['title'])}</h4>")
        parts.append(f"                <p>{escape(step['text'])}</p>")
        parts.append("              </div>")
        parts.append("            </div>")
    parts.append("          </div>")
    return "\n".join(parts) + "\n"


def render_gallery(items: list) -> str:
    parts = ['          <div class="svc-product-grid">']
    for item in items:
        src = item["src"]
        caption = escape(item["caption"])
        parts.append("            <figure class=\"svc-product-item\">")
        parts.append(
            f'              <a class="gallery-open" href="{escape(src, quote=True)}" aria-label="Увеличи: {caption}">'
        )
        parts.append(
            f'                <img src="{escape(src, quote=True)}" alt="{caption}" loading="lazy" decoding="async" />'
        )
        parts.append("              </a>")
        parts.append(f"              <figcaption>{caption}</figcaption>")
        parts.append("            </figure>")
    parts.append("          </div>")
    return "\n".join(parts) + "\n"


def render_section(title_html: str, body: str) -> str:
    return (
        "        <section class=\"svc-section\">\n"
        f"          <h2>{title_html}</h2>\n"
        '          <div class="svc-divider"></div>\n'
        f"{body}"
        "        </section>\n\n"
    )


def render_main(data: dict) -> str:
    hero = data["heroCta"]
    promise = data["promise"]
    materials = data["materials"]
    gallery = data["gallery"]
    cta = data["cta"]

    intro_attrs = ""
    if materials.get("introId"):
        intro_attrs = f' id="{escape(materials["introId"], quote=True)}"'

    materials_body = ""
    if materials.get("intro"):
        materials_body += f"          <p{intro_attrs}>{escape(materials['intro'])}</p>\n"
    materials_body += render_list(materials.get("items") or [])
    if materials.get("outro"):
        materials_body += f'          <p class="svc-outro">{escape(materials["outro"])}</p>\n'
    materials_body += render_steps(materials.get("steps") or [])

    promise_body = f"          <p>\n            {escape(promise['text'])}\n          </p>\n"
    promise_body += render_cards(promise.get("cards") or [])

    gallery_body = f"          <p>{escape(gallery['intro'])}</p>\n"
    gallery_body += render_gallery(gallery.get("items") or [])

    wa = f"https://wa.me/359884121606?text={quote(cta['whatsapp'])}"

    parts = []
    parts.append("    <section class=\"svc-hero\" aria-labelledby=\"svc-title\">")
    parts.append(
        f'      <div class="svc-hero-bg" style="background-image: url(\'{escape(data["heroImage"], quote=True)}\')" aria-hidden="true"></div>'
    )
    parts.append('      <div class="container">')
    parts.append('        <div class="svc-hero-inner">')
    parts.append('          <nav class="svc-breadcrumb" aria-label="Навигация">')
    parts.append('            <a href="../">Начало</a>')
    parts.append('            <span aria-hidden="true">›</span>')
    parts.append('            <a href="../#services">Услуги</a>')
    parts.append('            <span aria-hidden="true">›</span>')
    parts.append(f"            <span>{escape(data['breadcrumb'])}</span>")
    parts.append("          </nav>")
    parts.append(f'          <h1 id="svc-title">{data["titleHtml"]}</h1>')
    parts.append(f'          <p class="svc-hero-lead">{escape(data["lead"])}</p>')
    parts.append('          <div class="svc-hero-actions">')
    parts.append(
        f'            <a class="btn btn-primary" href="{escape(hero["href"], quote=True)}">{escape(hero["label"])}</a>'
    )
    parts.append("          </div>")
    parts.append("        </div>")
    parts.append("      </div>")
    parts.append("    </section>")
    parts.append('    <div class="svc-body">')
    parts.append('      <div class="container">')
    parts.append("")
    parts.append(render_section("Какво получавате", promise_body).rstrip("\n"))
    parts.append("")
    materials_title = materials.get("title") or "Изделия и материали"
    parts.append(render_section(escape(materials_title), materials_body).rstrip("\n"))
    parts.append("")
    parts.append(render_section("Галерия", gallery_body).rstrip("\n"))
    parts.append("")
    parts.append('        <div class="svc-cta">')
    parts.append(f"          <h2>{escape(cta['title'])}</h2>")
    parts.append(f"          <p>{escape(cta['text'])}</p>")
    parts.append('          <div class="svc-cta-btns">')
    parts.append(
        f'            <a class="btn btn-primary" href="{escape(cta["href"], quote=True)}">{escape(cta["label"])}</a>'
    )
    parts.append(
        f'            <a class="btn btn-outline" href="{escape(wa, quote=True)}" target="_blank" rel="noopener noreferrer">WhatsApp</a>'
    )
    parts.append("          </div>")
    parts.append("        </div>")
    parts.append("")
    parts.append("      </div>")
    parts.append("    </div>")
    return "\n".join(parts) + "\n"


def build_one(data: dict, template: str) -> str:
    html = template
    html = html.replace("{{slug}}", data["slug"])
    html = html.replace("{{title}}", escape(data["title"]))
    html = html.replace("{{description}}", escape(data["description"], quote=True))
    html = html.replace("{{main}}", render_main(data))
    return html


def main() -> int:
    if not TEMPLATE_PATH.exists():
        print(f"Missing template: {TEMPLATE_PATH}", file=sys.stderr)
        return 1
    template = TEMPLATE_PATH.read_text(encoding="utf-8")
    files = sorted(DATA_DIR.glob("*.json"))
    if not files:
        print(f"No JSON data in {DATA_DIR}", file=sys.stderr)
        return 1

    for path in files:
        data = json.loads(path.read_text(encoding="utf-8"))
        slug = data["slug"]
        out = SERVICES / f"{slug}.html"
        out.write_text(build_one(data, template), encoding="utf-8")
        print(f"built services/{slug}.html")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
