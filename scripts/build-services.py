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
import re
import sys
from html import escape
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
SERVICES = ROOT / "services"
DATA_DIR = SERVICES / "data"
TEMPLATE_PATH = ROOT / "scripts" / "templates" / "service.html"
GALLERY_PATH = ROOT / "gallery.html"
GALLERY_LIMIT = 8

FIGURE_RE = re.compile(
    r'<figure\s+class="gallery-item"\s+data-tags="([^"]+)">\s*'
    r'<a\s+class="gallery-open"\s+href="([^"]+)"\s+aria-label="([^"]*)">\s*'
    r'<img\s+src="([^"]+)"[^>]*\salt="([^"]*)"',
    re.I,
)


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


def service_src(src: str) -> str:
    if src.startswith(("http://", "https://", "../", "/")):
        return src
    return f"../{src}"


def load_gallery_catalog() -> list[dict]:
    if not GALLERY_PATH.exists():
        print(f"Missing gallery: {GALLERY_PATH}", file=sys.stderr)
        return []
    html = GALLERY_PATH.read_text(encoding="utf-8")
    items = []
    for match in FIGURE_RE.finditer(html):
        tags = [tag for tag in match.group(1).split() if tag]
        src = match.group(2)
        alt = match.group(5).strip()
        label = match.group(3).replace("Увеличи: ", "").strip()
        caption = alt or label
        items.append({"tags": tags, "src": src, "caption": caption})
    return items


STOP_WORDS = {
    "за",
    "със",
    "върху",
    "от",
    "име",
    "в",
    "и",
    "на",
    "с",
    "до",
    "при",
    "край",
    "пред",
    "персонализиран",
    "персонализирана",
    "персонализирани",
    "персонализирано",
    "лазерно",
    "гравирани",
    "гравирана",
    "гравиран",
    "винилови",
    "винилов",
    "винилова",
    "принтирани",
    "принтирана",
    "принтиран",
    "3d",
    "сувенири",
    "сувенирни",
    "подарък",
    "подаръци",
}

PRODUCT_TYPES = (
    (r"капсул|стойк", "capsule-stand"),
    (r"резервн|оригинал", "spare-part"),
    (r"зъбн|предавка", "gear"),
    (r"макет|камион|ретро", "model"),
    (r"скоб", "clip"),
    (r"ароматизатор", "freshener"),
    (r"ключодържател", "keychain"),
    (r"химикал", "pen"),
    (r"визит", "cardholder"),
    (r"раница", "backpack"),
    (r"магнит", "magnet"),
    (r"бутилка|бутилки|шише", "bottle"),
    (r"канче", "enamel-mug"),
    (r"чаша|чаши", "mug"),
    (r"бус|брандиране", "van"),
    (r"бебе в колата", "baby-car"),
    (r"добре дошл", "welcome"),
    (r"етикет", "label"),
    (r"офис|тоалетн", "door-sign"),
    (r"подаръч", "guest-gift"),
    (r"табел", "plaque"),
    (r"байрам|ramadan|курбан", "holiday"),
    (r"юбилей|birthday|congratulations", "event"),
)

SERIES_NAMES = (
    "ервин",
    "далия",
    "доспат",
    "широка",
    "villa",
    "ocean",
    "перфект",
)


def caption_tokens(caption: str) -> set[str]:
    words = re.findall(r"[a-zа-я0-9]+", caption.lower())
    return {w for w in words if w not in STOP_WORDS and len(w) > 2}


def product_type(caption: str) -> str:
    text = caption.lower()
    for pattern, name in PRODUCT_TYPES:
        if re.search(pattern, text):
            return name
    return "other"


def series_key(caption: str) -> str | None:
    text = caption.lower()
    for name in SERIES_NAMES:
        if name in text:
            return name
    return None


def shoot_key(src: str) -> str | None:
    match = re.search(r"(\d{8})", Path(src).name)
    return match.group(1) if match else None


def caption_similar(a: str, b: str) -> bool:
    if product_type(a) != product_type(b):
        return False
    left = caption_tokens(a)
    right = caption_tokens(b)
    if not left or not right:
        return False
    shared = left & right
    return len(shared) / len(left | right) >= 0.45


def items_from_picks(picks: list, catalog: list[dict]) -> list[dict]:
    by_name = {Path(item["src"]).name: item for item in catalog}
    picked = []
    for src in picks:
        name = Path(src).name
        item = by_name.get(name)
        caption = item["caption"] if item else name
        picked.append({"src": service_src(src), "caption": caption})
    return picked


def gallery_items_for(
    tag: str,
    catalog: list[dict],
    limit: int = GALLERY_LIMIT,
    picks: list | None = None,
) -> list[dict]:
    if picks:
        return items_from_picks(picks, catalog)[:limit]

    candidates = [item for item in catalog if tag in item["tags"]]
    picked: list[dict] = []
    used_types: set[str] = set()
    used_series: set[str] = set()
    used_shoots: set[str] = set()

    def accept(item: dict, allow_repeat_type: bool) -> bool:
        kind = product_type(item["caption"])
        series = series_key(item["caption"])
        shoot = shoot_key(item["src"])
        if series and series in used_series and kind in used_types:
            return False
        if shoot and shoot in used_shoots:
            return False
        if kind in used_types and not allow_repeat_type:
            return False
        if any(caption_similar(item["caption"], chosen["caption"]) for chosen in picked):
            return False
        return True

    def take(item: dict) -> None:
        picked.append(
            {
                "src": service_src(item["src"]),
                "caption": item["caption"],
            }
        )
        used_types.add(product_type(item["caption"]))
        series = series_key(item["caption"])
        if series:
            used_series.add(series)
        shoot = shoot_key(item["src"])
        if shoot:
            used_shoots.add(shoot)

    for item in candidates:
        if accept(item, allow_repeat_type=False):
            take(item)
            if len(picked) >= limit:
                return picked

    for item in candidates:
        if any(service_src(item["src"]) == p["src"] for p in picked):
            continue
        if accept(item, allow_repeat_type=True):
            take(item)
            if len(picked) >= limit:
                break
    return picked


def render_gallery(items: list, tag: str | None = None) -> str:
    parts = ['          <div class="svc-product-grid">']
    for item in items:
        src = item["src"]
        caption = escape(item["caption"])
        parts.append('            <figure class="gallery-item svc-product-item">')
        parts.append(
            f'              <a class="gallery-open" href="{escape(src, quote=True)}" aria-label="Увеличи: {caption}">'
        )
        parts.append(
            f'                <img src="{escape(src, quote=True)}" alt="{caption}" loading="lazy" decoding="async" />'
        )
        parts.append("              </a>")
        parts.append("            </figure>")
    parts.append("          </div>")
    if tag:
        parts.append('          <p class="svc-gallery-more">')
        parts.append(
            f'            <a class="btn btn-outline" href="../gallery.html?tag={escape(tag, quote=True)}">Виж всички в галерията</a>'
        )
        parts.append("          </p>")
    return "\n".join(parts) + "\n"


def render_section(title_html: str, body: str) -> str:
    return (
        "        <section class=\"svc-section\">\n"
        f"          <h2>{title_html}</h2>\n"
        '          <div class="svc-divider"></div>\n'
        f"{body}"
        "        </section>\n\n"
    )


def render_main(data: dict, catalog: list[dict]) -> str:
    hero = data["heroCta"]
    promise = data["promise"]
    materials = data["materials"]
    gallery = data["gallery"]
    cta = data["cta"]
    gallery_tag = gallery.get("tag")
    gallery_items = (
        gallery_items_for(gallery_tag, catalog, picks=gallery.get("picks"))
        if gallery_tag
        else gallery.get("items") or []
    )

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
    gallery_body += render_gallery(gallery_items, gallery_tag)

    wa = f"https://wa.me/359884121606?text={quote(cta['whatsapp'])}"

    parts = []
    parts.append("    <section class=\"svc-hero\" aria-labelledby=\"svc-title\">")
    parts.append(
        f'      <div class="svc-hero-bg" style="background-image: url(\'{escape(data["heroImage"], quote=True)}\')" aria-hidden="true"></div>'
    )
    parts.append('      <div class="container">')
    parts.append('        <div class="svc-hero-inner">')
    parts.append('          <nav class="svc-breadcrumb" aria-label="Навигация">')
    parts.append('            <a href="../index.html">Начало</a>')
    parts.append('            <span aria-hidden="true">›</span>')
    parts.append('            <a href="../services.html">Услуги</a>')
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


def build_one(data: dict, template: str, catalog: list[dict]) -> str:
    html = template
    html = html.replace("{{slug}}", data["slug"])
    html = html.replace("{{title}}", escape(data["title"]))
    html = html.replace("{{description}}", escape(data["description"], quote=True))
    html = html.replace("{{main}}", render_main(data, catalog))
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

    catalog = load_gallery_catalog()
    if not catalog:
        print("No gallery items parsed from gallery.html", file=sys.stderr)
        return 1

    for path in files:
        data = json.loads(path.read_text(encoding="utf-8"))
        slug = data["slug"]
        gallery = data.get("gallery") or {}
        tag = gallery.get("tag")
        count = (
            len(gallery_items_for(tag, catalog, picks=gallery.get("picks")))
            if tag
            else 0
        )
        out = SERVICES / f"{slug}.html"
        out.write_text(build_one(data, template, catalog), encoding="utf-8")
        print(f"built services/{slug}.html ({count} photos, tag={tag})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
