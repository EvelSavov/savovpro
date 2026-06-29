# SAVOV PRO — Одит на конфигураторите

> **Master checklist за production:** виж [PRODUCTION-ROADMAP.md](./PRODUCTION-ROADMAP.md) — SEO, UI/UX, deploy, поръчки, конфигуратори на едно място.

Дата: 29 юни 2026  
Обхват: `configurator.html`, `configurator-product.html`, `configurator-sticker.html`, `assets/js/configurator/`, `assets/css/configurator.css`

---

## Обобщение

Има **3 страници** и **2 двигателя**:

| Страница | Категории | Двигател | Зрялост |
|----------|-----------|----------|---------|
| `configurator.html` | Hub (избор) | — | Стабилен |
| `configurator-product.html` | Ключодържатели, ароматизатори | `core.js` (~1 400 реда) | Работи, по-стар |
| `configurator-sticker.html` | Стикери | `sticker-core.js` (~4 000 реда) | Най-развит, много неcommit-нати промени |

**Най-големите пропуски:** поръчка без прикачен файл, няма autosave при гравиране, дублиран clipart код, SEO слабо, sticker deploy зависи от untracked vendor файлове.

---

## Какво ИМАМЕ

### Общо (всички конфигуратори)

- [x] Hub с категории (`categories.js` + `configurator.html`)
- [x] Двуколонен layout: canvas превю + контроли
- [x] Accordion секции (`.cfg-acc`)
- [x] Слоеве: списък, drag-reorder, visibility, избор, undo/redo (30 стъпки)
- [x] Ориентировъчна цена в UI
- [x] Поръчка: WhatsApp + имейл с предварително попълнено съобщение (текст)
- [x] Mobile: sticky bottom bar с WA (≤600px)
- [x] Споделен CSS: `assets/css/configurator.css` (~1 900 реда)
- [x] Google Fonts за canvas превю
- [x] PNG export на превю (download бутон)

### Ключодържатели + ароматизатори (`core.js`)

- [x] 3 модела ключодържатели + 2 модела ароматизатори
- [x] Цена per модел (8–15 €)
- [x] Слоеве: текст (2 реда), иконка (Iconify), лого (upload)
- [x] Двустранно гравиране (ключодържатели): +3 € / +5 €
- [x] Бързи шаблони (templates)
- [x] Симулация на гравиране (multiply/blur на canvas)
- [x] Clip-art picker (Iconify CDN) — **вграден в `core.js`**
- [x] Mask clipping — **само** кръглия ключодържател има mask PNG

### Стикери (`sticker-core.js`)

- [x] Режими **Лесно** / **Напреднал** (запомня се в localStorage)
- [x] Слоеве: текст (multiline), растер (PNG/JPG/WebP), вектор (traced paths)
- [x] Import popup: remove BG + чувствителност + превю преди import
- [x] PNG → vector trace (ImageTracer) — import или бутон в редакция
- [x] Текст → SVG paths при export (opentype.js + локални WOFF)
- [x] SVG за плотер: cut contour + vector art, точен размер в cm
- [x] Canvas: zoom, pan, fullscreen, center, fit-in-sticker
- [x] Multi-select, duplicate, align, magnetic snap, bounds warning
- [x] Размер 2–120 cm + бърз избор
- [x] Цена: min + setup + €/cm²
- [x] Autosave + restore draft (`localStorage`)
- [x] Onboarding card (първо посещение)
- [x] Клавишни shortcuts dialog
- [x] Clip-art via споделен `clipart.js`

---

## Какво ЛИПСВА

### Критично / бизнес

| Липса | Забележка |
|-------|-----------|
| **Прикачен файл при поръчка** | WA/имейл са само текст; клиентът трябва ръчно да свали PNG/SVG |
| **Commit на sticker vendor assets** | `opentype.min.js`, `imagetracer.js`, `assets/fonts/*.woff`, `sticker-vector.js` — untracked; deploy без тях = счупен plotter export |
| **Autosave при гравиране** | Refresh = загуба на работа (stickers имат draft) |

### Функционално

| Липса | Къде |
|-------|------|
| SVG/plotter export | Само stickers; keychains/fresheners — няма |
| Import preview + remove BG | Само stickers; engrave upload е директен |
| Mask за всички модели | Само round keychain има mask |
| Единен clipart модул | Engrave дублира picker в `core.js` |
| Quantity / бележки в поръчка | Няма (премахнато при stickers) |
| Валидация на качени файлове (размер, DPI) | Минимална |
| Offline / fallback без Iconify | Clip-art изисква мрежа |

### SEO / discoverability

| Липса |
|-------|
| `robots.txt`, `sitemap.xml` |
| `og:image` на конфигurator страници |
| JSON-LD (Product / LocalBusiness) |
| Статичен `<title>` per категория на `configurator-product.html` (title се сменя с JS) |
| Hub image за stickers — generic service photo, не продуктова снимка |

### Техническо / maintainability

| Липса |
|-------|
| Build step / bundler (plain static JS) |
| Тестове (unit/e2e) | [x] Playwright E2E — 15 теста (`tests/e2e/`) |
| Module split на `sticker-core.js` (4k реда monolith) |
| TypeScript / JSDoc на публични API |
| CI за lint/syntax |

---

## Известни проблеми и рискове

### Bugs / несъответствия

1. **Preview vs export шрифт (stickers)** — canvas ползва Google Fonts CDN; SVG export ползва локални WOFF. При липса на CDN preview може да се различава от export.
2. **Clipart тип слой** — engrave → `icon` layer; stickers → `image` layer за същите икони. Различно поведение при export/scale.
3. **`CFG.features.engraveSim`** — дефинирано в catalog, но **`core.js` не го чете**; toggle винаги се показва.
4. **Mask inconsistency** — правоъгълни ключодържатели/ароматизатори: текст/лого може визуално да излиза извън зоната за гравиране.
5. **Поръчка казва „лого приложено“** — без реален attachment (`core.js` buildMsg).
6. **Import debounce (stickers)** — бързо „Добави“ след slider може theoretically да ползва stale preview (малък риск, частично оправено).
7. **Trace quality** — autotrace работи само за прости лога; сложни PNG → шумни paths (очаквано, не bug).

### Fragile / deployment

- Hard-coded: `359884121606`, `info@savovpro.com`
- Cache bust само на `sticker-core.js` / `sticker-vector.js` (`?v=20250629`), не на vendor
- `assets/configurator/archive/` — dead assets, объркват при поддръжка
- Sticker engine **не работи** на GitHub Pages ако vendor/fonts не са commit-нати

### UX gaps

- Basic mode (stickers): имейл CTA скрит; mobile bar също без имейл в basic
- Няма progress/loading при SVG export (може да отнеме при много слоеве)
- Няма error boundary — грешка в JS = празен canvas
- Engrave: няма „започни отначало“ / draft restore

---

## Какво може да се ПРЕМАХНЕ / опрости

| Кандидат | Защо |
|----------|------|
| Дублиран clipart в `core.js` | Замени с `clipart.js` (−~200 реда) |
| `assets/configurator/archive/*` | Не се ползват |
| Inline styles в HTML (product/sticker) | Премести в `configurator.css` |
| Дублиран zoom (toolbar + slider) | Stickers — вече частично consolidated; провери остатъци |
| `removeBg` flag в draft (stickers) | Винаги true; може да се опрости draft schema |
| Basic/Advanced split complexity | Ако потребителите не ползват Basic — merge modes |

**Не препоръчвам да се маха:** plotter SVG, import dialog, autosave (stickers), double-sided (keychains) — това е core value.

---

## Какво може да се ДОБАВИ (приоритет)

### Висок приоритет

1. **Commit + deploy checklist** — vendor JS, fonts, sticker-vector.js
2. **Поръчка с файл** — поне „Свали PNG/SVG“ CTA преди WA; идеално Formspree/Web3Forms с attachment или copy-paste на data URL (ограничено)
3. **Autosave за engrave** — същият pattern като stickers
4. **Mask PNGs** за всички модели ключодържатели/ароматизатори
5. **SEO база** — `robots.txt`, `sitemap.xml`, og:image, по-добри titles

### Среден приоритет

6. **Обединен clipart** — един модул за двата engine
7. **Import pipeline за engrave** — preview + optional bg remove за лого
8. **Quantity + бележки** в sticker order message
9. **Per-category meta** — static titles/descriptions в HTML или генерирани при build
10. **Refactor `sticker-core.js`** — split: import, export, canvas, layers

### Нисък / nice-to-have

11. Autotrace quality slider в edit panel (не само при import)
12. Text → paths preview преди export
13. Contour cut path от формата на art (не само правоъгълник)
14. PWA / offline cache за static assets
15. Analytics events (add layer, export, order click)

---

## Архитектура (кратко)

```
configurator.html (hub)
    └── categories.js
            ├── configurator-product.html?cat=keychains|fresheners
            │       └── boot-engrave.js → catalog/*.js → core.js
            └── configurator-sticker.html?cat=stickers
                    └── boot-sticker.js → stickers.js → clipart.js
                        → opentype + imagetracer → sticker-vector.js → sticker-core.js
```

**Catalog файлове:** `assets/js/configurator/catalog/{keychains,fresheners,stickers}.js` → `window.CFG_CONFIG`

**Добавяне на нова категория:** коментар в `categories.js` — registry + catalog JS + images в `assets/configurator/<id>/`

---

## Git статус (конфигurator-relevant)

**Modified, неcommit-нати:**
- `assets/css/configurator.css`
- `assets/js/configurator/boot-sticker.js`
- `assets/js/configurator/sticker-core.js`
- `configurator-sticker.html`

**Untracked (задължителни за stickers plotter):**
- `assets/js/configurator/sticker-vector.js`
- `assets/js/vendor/opentype.min.js`
- `assets/js/vendor/imagetracer.js`
- `assets/fonts/*.woff` (5 файла)

---

## Capability matrix

| Функция | Keychains | Fresheners | Stickers |
|---------|:---------:|:----------:|:--------:|
| Layers | ✓ | ✓ | ✓ |
| Undo/redo | ✓ | ✓ | ✓ |
| Double-sided | ✓ | — | — |
| Templates | ✓ | ✓ | — |
| Clip-art | ✓ | ✓ | ✓ |
| Logo/image upload | ✓ | ✓ | ✓ |
| Import preview | — | — | ✓ |
| Remove BG | — | — | ✓ |
| PNG trace → vector | — | — | ✓ |
| Plotter SVG export | — | — | ✓ |
| Text → paths export | — | — | ✓ |
| Autosave | — | — | ✓ |
| Basic/Advanced UI | — | — | ✓ |
| Area-based pricing | — | — | ✓ |
| Model-based pricing | ✓ | ✓ | — |
| Mask clip | частично | — | — |
| Bounds warning | — | — | ✓ |

---

## Препоръчан ред на работа

1. Commit vendor + fonts + sticker changes (иначе production е счупен)
2. Autosave за engrave
3. Mask за всички engrave модели
4. Refactor clipart → споделен модул
5. SEO + hub images
6. Order flow: ясен „Свали дизайна“ преди WA + текст в съобщението с линк към export
7. Split `sticker-core.js` (maintainability)

---

## Тест checklist (ръчен)

- [ ] Hub → всяка категория се отваря
- [ ] Keychain: текст + иконка + лого, двете страни, PNG download, WA link
- [ ] Freshener: без double-sided UI, същите слоеве
- [ ] Sticker: import PNG → preview → raster + vector layer
- [ ] Sticker: trace бутон в edit panel
- [ ] Sticker: SVG за плотер — `<path>`, не `<text>` / `<image>` където е възможно
- [ ] Sticker: draft restore след refresh
- [ ] Mobile: sticky WA bar, touch targets
- [ ] Hard refresh след deploy (cache bust)

---

## Автоматизирани E2E тестове (Playwright)

Същите сценарии от checklist-а са покрити в `tests/e2e/`:

| Файл | Покритие |
|------|----------|
| `hub.spec.js` | Hub → всяка категория се отваря |
| `engraving.spec.js` | Keychain (текст, clipart, лого, двустранно, PNG, WA); Freshener (без `#acc-engrave`) |
| `sticker.spec.js` | PNG import (raster + vector), trace, SVG `<path>`, draft restore, cache bust |
| `mobile.spec.js` | Sticky WA bar + min touch height |

### Пускане

```bash
npm install
npx playwright install chromium
npm test                  # всички тестове (desktop + mobile)
npm run test:configurator # само configurator suite
npm run test:ui           # интерактивен UI
npm run test:report       # HTML report след fail
```

Локалният сървър се стартира автоматично на порт **8765** (`playwright.config.js`). Clipart тестовете изискват интернет (Iconify API).

---

*Документът е за вътрешна употреба. Обновявай след major промени в конфигураторите.*
