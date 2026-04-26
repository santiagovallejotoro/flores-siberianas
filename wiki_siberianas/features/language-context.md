# Language / i18n (LanguageContext)

> **Code:** `src/contexts/LanguageContext.tsx`, `src/lib/translations.ts`, `src/lib/i18n.ts`  
> Follow the feature template in [[SCHEMA]].

## Purpose
**Custom i18n** (no i18n library): switch **en** / **es** / **ru** / **zh** with `t.section.key`, persist choice in `localStorage`.

## How It Works
- `useLanguage()` returns `{ t, language, setLanguage }`
- All copy lives in one large `translations` object; keys mirror section names (e.g. `t.nav.products`)

## Schema / Data
No DB — pure client JSON-shaped object in TypeScript.

## Dependencies
- React context at app root, alongside **next-themes** in `src/app/providers.tsx` (see also [[features/theme-toggler|ThemeToggler]])

## Failure Cases
_TBD — missing translation key, first-paint language flash_

## Key Decisions
**Why custom i18n:** full control, no build-time locale splitting yet; trade-off: a large `translations` file to maintain.

## Links
- [[OVERVIEW#Internationalization]]
- [[ARCHITECTURE]] (contexts + lib)
- [[features/language-selector|LanguageSelector]] (UI)
