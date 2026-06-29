# SAVOV PRO — Production roadmap

**Единен списък за публичен launch** · savovpro.com  
**Обновено:** 29 юни 2026  
**Свързани документи:** [CONFIGURATOR-AUDIT.md](./CONFIGURATOR-AUDIT.md) (технически одит на конфигураторите)

---

## Как да ползваш този файл

| Маркер | Значение |
|--------|----------|
| `[ ]` | Не е направено |
| `[~]` | Частично / работи, но не е production-ready |
| `[x]` | Готово |
| **P0** | Блокира deploy или счупва клиентски flow |
| **P1** | Силно препоръчително преди/веднага след launch |
| **P2** | След launch, подобрява качество и конверсия |
| **P3** | Nice-to-have |

**Цел:** всички **P0** и **P1** задачи завършени → сайтът е **публично готов** за реални поръчки.

> **Защо не всички `[ ]` са отметнати?** Roadmap-ът включва и **P2/P3** (след launch), задачи **само за теб** (GSC, Formspree ключ, тест на телефон), и **refactor** (split 4000-редов файл). P0/P1 кодът е имплементиран; част от checkboxes не бяха синхронизирани — виж таблицата „Статус по приоритет“ по-долу.

### Статус по приоритет (29 юни 2026)

| Приоритет | Общо задачи | Готово | Блокирано / остава |
|-----------|-------------|--------|---------------------|
| **P0** | ~12 | **~12** | Production smoke на live — автоматизира се с E2E |
| **P1** | ~25 | **~22** | Mask PNG (clip fallback вместо assets); GSC submit (твой акаунт) |
| **P2** | ~30 | ~3 | Formspree, privacy page, clip-art refactor, Lighthouse… |
| **P3** | ~10 | 0 | Analytics, PWA, blog, split sticker-core |


## Обобщение: какво е готово

| Област | Статус |
|--------|--------|
| Homepage (`index.html`) | [x] OG/Twitter meta + JSON-LD |
| Link hub (`go/`) | [x] noindex — OK за bio линкове |
| Configurator hub | [x] Стабилен |
| Keychains / fresheners | [~] Autosave + start over; clip fallback (не mask PNG файлове) |
| Stickers | [x] Vendor assets committed |
| E2E тестове (Playwright) | [x] 21 local + 4 production — `npm test` / `npm run test:production` |
| SEO infra | [~] robots + sitemap + canonical; GSC pending |
| Order с файл | [~] Download CTA + точен WA текст; без file upload |

---

# Фаза 0 — Deploy blockers (P0)

> Без това production може да е **счупен** или поръчките **непълни**.

- [x] **Commit всички configurator assets**
  - `assets/js/configurator/sticker-vector.js`
  - `assets/js/vendor/opentype.min.js`, `imagetracer.js`
  - `assets/fonts/*.woff` (5 файла)
  - `assets/js/configurator/sticker-core.js`, `boot-sticker.js`
  - `configurator-sticker.html`, `configurator.css`
  - `package.json`, `playwright.config.js`, `tests/`, `docs/`
- [x] **Deploy към GitHub Pages** (CNAME: `savovpro.com`) — merged to `main` 29 юни 2026
- [x] **Post-deploy smoke test на production**
  - [x] Vendor JS live (`opentype.min.js` → HTTP 200)
  - [x] Sticker/keychain flows — `npm run test:production` (4 теста срещу live site)
- [x] **Провери vendor файлове на live URL** — `https://savovpro.com/assets/js/vendor/opentype.min.js` OK

---

# Фаза 1 — Поръчка и доверие (P0 / P1)

## Order flow (всички конфигуратори)

- [x] **P0 — Ясен CTA „Свали дизайна“ преди WhatsApp**
  - Engrave: `#kc-download-order` + hint „Свали превю и го прикачи при поръчка“
  - Stickers: PNG preview + SVG plotter — двата export бутона преди WA
- [x] **P0 — Коригирай misleading текст в WA съобщението**
  - `core.js` buildMsg: „Моля свали превю PNG от конфигуратора и го прикачи в чата.“
  - Stickers: „Моля прикачи SVG за плотер (и PNG превю ако имаш).“
- [x] **P1 — Sticker order message**
  - Напомняне за SVG plotter файла (не само PNG preview)
  - Опционално: quantity + бележки (премахнати по-рано)
- [ ] **P2 — Реален file upload при поръчка**
  - Formspree / Web3Forms / custom backend с attachment
  - Или cloud link (клиент качва, paste URL) — WA не поддържа файлове директно

## Контакт и константи

- [ ] **P2 — Централизирай** `359884121606`, `info@savovpro.com` — [x] `assets/js/site-config.js` + configurators
- [x] **P2 — Footer link** към privacy — `privacy.html` + footer на всички public страници

---

# Фаза 2 — Конфигуратори (P1)

> Детайли, bugs, capability matrix → [CONFIGURATOR-AUDIT.md](./CONFIGURATOR-AUDIT.md)

## Ключодържатели + ароматизатори (`core.js`)

- [x] **P1 — Autosave / draft restore** (като stickers `localStorage`)
- [~] **P1 — Mask PNG за всички модели** — rectangular clip fallback в `core.js` + `clipH` в catalog; реални mask PNG assets липсват
- [x] **P1 — „Започни отначало“** + потвърждение
- [ ] **P2 — Import preview за лого** (preview + optional remove BG)
- [ ] **P2 — Bounds warning** когато текст/лого излиза извън зоната
- [x] **P2 — `CFG.features.engraveSim`** — core.js скрива toggle когато `engraveSim: false`
- [ ] **P2 — Clip-art: замени inline picker с `clipart.js`** (−~200 реда дублиране)

## Стикери (`sticker-core.js`)

- [x] **P1 — Deploy vendor + fonts** (виж Фаза 0)
- [x] **P1 — Loading state при SVG export** (бутон disabled + spinner)
- [ ] **P2 — Preview/export font parity** (Google Fonts preview vs WOFF export)
- [ ] **P2 — Trace quality hint** — [x] hint в edit panel за raster слоеве
- [x] **P2 — Cache bust на vendor scripts** — `?v=20250629` на opentype + imagetracer
- [ ] **P3 — Split `sticker-core.js`** (~4000 реда) на модули

## Hub + нови категории

- [x] **P1 — Hub image за stickers** — продуктова снимка, не generic service photo
- [ ] **P2 — Per-category static `<title>` / meta** в HTML (не само JS)
- [ ] **P3 — „Скоро“ категории** — ясен UX ако се добавят placeholder карти

---

# Фаза 3 — SEO и discoverability (P1)

**Домейн:** https://savovpro.com

## Site-wide infra

- [x] **P1 — `robots.txt`**
  - Allow: `/`, `/configurator*.html`, `/index.html`
  - Disallow: `/go/` (вече noindex), `/test-results/`, `/playwright-report/`
- [x] **P1 — `sitemap.xml`**
  - `index.html`, `configurator.html`, `configurator-product.html?cat=*`, `configurator-sticker.html?cat=stickers`
  - [ ] Submit в Google Search Console — виж [GSC-SETUP.md](./GSC-SETUP.md)
- [x] **P1 — Canonical URLs** на всички public страници

## Meta tags (липсват на повечето страници)

| Страница | title | description | og:image | og:title |
|----------|:-----:|:-----------:|:--------:|:--------:|
| `index.html` | [x] | [x] | [x] | [x] |
| `configurator.html` | [x] | [x] | [x] | [x] |
| `configurator-product.html` | [~] JS | [x] | [x] | [x] |
| `configurator-sticker.html` | [x] | [x] | [x] | [x] |
| `go/` | [x] noindex | [x] | — | — |

- [x] **P1 — `og:image`** — homepage + configurator hub + stickers (+ product page)
- [x] **P1 — Twitter/X card** tags на homepage, hub, product и sticker страници
- [x] **P2 — JSON-LD**
  - `LocalBusiness` на homepage (име, телефон, адрес Късак, sameAs social)
  - `Product` / `Offer` на configurator страници (ориентировъчна цена)
- [ ] **P2 — Google Search Console** + Bing Webmaster — verify domain
- [ ] **P3 — hreflang** — само `bg` засега; при EN версия → `en`

## Content SEO

- [x] **P1 — Homepage H1/H2** — SEO подзаглавие + services heading с ключови думи
- [ ] **P2 — Alt text audit** на gallery (повечето [x]; нови снимки → alt задължително)
- [x] **P2 — Internal links** — services → configurator URLs
- [ ] **P3 — Blog / FAQ** — „Как да поръчам стикер“, „Какво е SVG за плотер“

---

# Фаза 4 — UI / UX (P1 / P2)

## Homepage

- [x] **P1 — Hero CTA hierarchy** — „Персонализирай“ е primary, първи бутон
- [ ] **P1 — Mobile nav** — автоматизирано: `mobile.spec.js` (Pixel 5); реален iPhone — ръчен smoke
- [x] **P2 — Services cards** — линкове към configurator categories
- [ ] **P2 — Gallery** — WebP/optimized images (някои JPEG са големи)
- [ ] **P2 — Above-the-fold** — LCP: hero image/logo preload ако е нужно
- [ ] **P3 — Dark/light** — не е нужно; brand е dark

## Go / link hub (`go/`)

- [x] WhatsApp + Viber + configurator + social
- [ ] **P2 — UTM params** на outbound links за analytics
- [ ] **P2 — Open Graph** за споделяне (optional; noindex е OK)

## Configurator UX (общо)

- [x] Mobile sticky WA bar (≤600px)
- [x] Accordion controls, layers panel
- [x] **P1 — Error state** — `.cfg-boot-error` в boot-engrave / boot-sticker
- [x] **P1 — First-time user** — sticker onboarding + engrave `#kc-flow-hint`
- [ ] **P2 — Basic mode stickers** — имейл CTA липсва в basic; решение: покажи или merge modes
- [ ] **P2 — Price clarity** — „ориентировъчна“, условия (мин. поръчка, срок)
- [ ] **P2 — Accessibility pass**
  - Focus visible на всички buttons
  - Dialog focus trap (import, shortcuts)
  - Contrast на `--gold` върху dark bg (WCAG AA)
- [ ] **P3 — Keyboard shortcuts help** — engrave configurator (stickers имат [x])

## Visual / brand

- [ ] **P2 — Consistent header/footer** across all pages (configurator vs index)
- [ ] **P2 — Favicon / Apple touch icon** — [x] `apple-touch-icon` на всички public страници
- [ ] **P2 — Remove inline styles** в configurator HTML → `configurator.css`
- [ ] **P3 — Cleanup `assets/configurator/archive/`** — dead assets

---

# Фаза 5 — Качество и QA (P1)

## Автоматизирани тестове

- [x] Playwright E2E — 19 теста (`tests/e2e/`)
- [~] **P1 — CI (GitHub Actions)** — `.github/workflows/e2e.yml` локално; активиране: [CI-SETUP.md](./CI-SETUP.md)
- [ ] **P2 — Site-wide screenshot spec** — [~] `production.spec.js` smoke; full screenshots optional
- [ ] **P2 — Visual regression** (optional Playwright snapshots)

## Ръчен checklist (преди launch)

- [ ] Hub → всяка категория се отваря
- [ ] Keychain: текст + иконка + лого, двустранно, PNG, WA
- [ ] Freshener: без double-sided UI
- [ ] Sticker: PNG import, trace, SVG paths, draft restore
- [ ] Mobile: sticky bar, touch targets ≥44px
- [ ] Safari iOS + Chrome Android smoke
- [ ] Clip-art работи (Iconify — нужен internet)
- [ ] Offline: graceful fallback без clipart

## Performance

- [ ] **P1 — Lighthouse** на homepage + configurator-sticker (mobile score target ≥85)
- [ ] **P2 — Lazy load** — gallery [x]; провери configurator product images
- [ ] **P2 — Font subsetting** — WOFF fonts само нужните glyphs
- [ ] **P3 — Service worker / PWA** — offline cache за static assets

---

# Фаза 6 — Analytics и growth (P3)

- [ ] Privacy-friendly analytics (Plausible / GA4 + cookie banner ако EU)
- [ ] Events: `configurator_open`, `export_png`, `export_svg`, `order_wa_click`
- [ ] Facebook Pixel / Meta — само ако рекламирате

---

# Pre-launch checklist (един поглед)

Отбележи всичко преди да обявиш сайта публично:

```
Deploy & assets
  [x] Git commit + push
  [~] Production smoke (vendor OK; full flows → npm test / live browser)
  [x] No 404 on vendor/fonts

Order experience
  [x] Download CTA visible before WA
  [x] WA message text accurate (no false "attachment" claims)

SEO minimum
  [x] robots.txt + sitemap.xml
  [x] og:image on index + configurator hub
  [ ] Search Console submitted (твой Google акаунт)

UX minimum
  [ ] Mobile tested on real device (ръчно)
  [x] npm test passes (19/19)
  [x] Contact info correct sitewide

Legal (ако приложимо)
  [ ] Privacy notice if analytics/forms collect data
```

---

# Препоръчан ред на работа

| # | Задача | Фаза | Effort |
|---|--------|------|--------|
| 1 | Commit + deploy + production smoke | 0 | 1–2 h |
| 2 | Order flow: download CTA + fix WA text | 1 | 2–4 h |
| 3 | robots.txt + sitemap + og:image | 3 | 2–3 h |
| 4 | Engrave autosave | 2 | 4–6 h |
| 5 | Masks за всички engrave модели | 2 | 2–4 h |
| 6 | Hub sticker image + per-page meta | 2–3 | 2 h |
| 7 | GitHub Actions CI for tests | 5 | [x] |
| 8 | Homepage → configurator internal links | 3–4 | 2 h |
| 9 | Clip-art refactor + sticker-core split | 2 | later |

---

# Тестове — бърз reference

```bash
npm install
npx playwright install chromium
npm test                  # 19 tests — desktop + mobile
npm run test:production # 4 tests vs savovpro.com
```

| Spec | Покрива |
|------|---------|
| `site.spec.js` | Homepage hero + configurator hub grid |
| `hub.spec.js` | Hub categories |
| `engraving.spec.js` | Keychain + freshener |
| `sticker.spec.js` | Import, trace, SVG, draft, cache bust |
| `mobile.spec.js` | Sticky WA bar |
| `production.spec.js` | Live site: vendor 200, robots, hub, sticker engine |

---

*Обновявай този файл след всеки deploy или major feature. Технически детайли за конфигураторите остават в [CONFIGURATOR-AUDIT.md](./CONFIGURATOR-AUDIT.md).*
