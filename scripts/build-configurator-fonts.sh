#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STICKERS="$ROOT/assets/fonts/stickers"
PRODUCT="$ROOT/assets/fonts/product"
NM="$ROOT/node_modules/@fontsource"

mkdir -p "$STICKERS" "$PRODUCT"

# ── Sticker configurator (full catalog) ──
cp "$NM/montserrat/files/montserrat-cyrillic-700-normal.woff" "$STICKERS/montserrat-cyrillic-700.woff"
cp "$NM/montserrat/files/montserrat-latin-700-normal.woff" "$STICKERS/montserrat-latin-700.woff"
cp "$STICKERS/montserrat-cyrillic-700.woff" "$STICKERS/montserrat-700.woff"

cp "$NM/playfair-display/files/playfair-display-cyrillic-700-normal.woff" "$STICKERS/playfair-cyrillic-700.woff"
cp "$NM/playfair-display/files/playfair-display-latin-700-normal.woff" "$STICKERS/playfair-latin-700.woff"
cp "$STICKERS/playfair-cyrillic-700.woff" "$STICKERS/playfair-700.woff"

cp "$NM/caveat/files/caveat-cyrillic-700-normal.woff" "$STICKERS/caveat-cyrillic-700.woff"
cp "$NM/caveat/files/caveat-latin-700-normal.woff" "$STICKERS/caveat-latin-700.woff"
cp "$STICKERS/caveat-cyrillic-700.woff" "$STICKERS/caveat-700.woff"

cp "$NM/dancing-script/files/dancing-script-latin-700-normal.woff" "$STICKERS/dancing-script-700.woff"
cp "$NM/dm-sans/files/dm-sans-latin-700-normal.woff" "$STICKERS/dm-sans-700.woff"

# ── Product configurator (keychains / fresheners) ──
cp "$STICKERS/montserrat-cyrillic-700.woff" "$PRODUCT/montserrat-cyrillic-700.woff"
cp "$STICKERS/montserrat-latin-700.woff" "$PRODUCT/montserrat-latin-700.woff"
cp "$PRODUCT/montserrat-cyrillic-700.woff" "$PRODUCT/montserrat-700.woff"

cp "$STICKERS/playfair-cyrillic-700.woff" "$PRODUCT/playfair-cyrillic-700.woff"
cp "$STICKERS/playfair-latin-700.woff" "$PRODUCT/playfair-latin-700.woff"
cp "$PRODUCT/playfair-cyrillic-700.woff" "$PRODUCT/playfair-700.woff"

cp "$STICKERS/dancing-script-700.woff" "$PRODUCT/dancing-script-700.woff"

echo "Built sticker fonts → assets/fonts/stickers/"
echo "Built product fonts → assets/fonts/product/"
