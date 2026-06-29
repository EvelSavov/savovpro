# GitHub Actions CI — активиране

Файлът `.github/workflows/e2e.yml` е готов локално. Push чрез git може да се блокира ако PAT няма **`workflow`** scope.

## Вариант A — GitHub UI (най-лесно)

1. Repo → **Add file** → **Create new file**
2. Path: `.github/workflows/e2e.yml`
3. Copy/paste съдържанието от локалния файл
4. Commit to `main`

## Вариант B — PAT с workflow scope

1. GitHub → Settings → Developer settings → Personal access tokens
2. New token → enable **`workflow`** (+ `repo`)
3. `git push origin main` (файлът вече е в working tree)

## Какво прави CI

На всеки push/PR към `main` или `feature/social-media`:

```bash
npm ci
npx playwright install chromium --with-deps
npm test   # 29 tests, Desktop Chrome + Pixel 5 mobile
```

При fail — artifact `playwright-report/` (7 дни).

## Локално (същите тестове)

| Команда | Браузър |
|---------|---------|
| `npm test` | **Chromium headless** (Chrome for Testing) |
| `npm run test:headed` | **Chromium с прозорец** (виждаш UI) |
| `npm run test:ui` | Playwright UI mode |
| `npm run test:production` | Live savovpro.com (4 smoke tests) |

Playwright **не** ползва инсталирания Chrome на Mac — използва bundled **Chromium** от `npx playwright install chromium` (съвместим с Chrome).
