# Google Search Console — настройка

След deploy на `main` (savovpro.com).

## 1. Добави property

1. Отвори [Google Search Console](https://search.google.com/search-console)
2. **Add property** → **URL prefix**: `https://savovpro.com`
3. Потвърди собствеността (препоръчително):
   - **HTML file** — качи файла от GSC в root на repo и deploy, или
   - **DNS** — TXT запис при домейн регистратора (ако savovpro.com DNS е там)

## 2. Submit sitemap

1. Sitemaps → **Add a new sitemap**
2. URL: `sitemap.xml` (пълен: `https://savovpro.com/sitemap.xml`)
3. Submit

## 3. Провери индексиране (след 2–7 дни)

- Pages → виж дали `configurator.html`, `configurator-sticker.html` се crawl-ват
- URL Inspection → тествай `https://savovpro.com/configurator-sticker.html?cat=stickers`

## 4. Bing (optional)

[ Bing Webmaster Tools ](https://www.bing.com/webmasters) → import from GSC or add site + sitemap.

---

*Robots и sitemap вече са в repo: `robots.txt`, `sitemap.xml`.*
