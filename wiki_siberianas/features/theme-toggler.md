# ThemeToggler (component)

> **Code:** `src/components/Header/ThemeToggler.tsx` (or adjacent under `Header/`). Uses **next-themes**; configured in `src/app/providers.tsx`.

## Purpose
Switch **light** / **dark** site theme; pair with `[[features/language-selector|LanguageSelector]]` in the global header.

## How It Works
- `next-themes` with `defaultTheme="light"`, `enableSystem={false}` (see project CLAUDE.md)
- Styling: Tailwind `dark:` variant, controlled by the `.dark` class on a parent (see `src/styles/index.css`)

## Schema / Data
Preference stored in browser (next-themes / local storage behavior).

## Dependencies
- `next-themes`, root `ThemeProvider` in `providers.tsx`

## Failure Cases
_TBD — flash of wrong theme on load_

## Key Decisions
**System theme disabled** — predictable brand look for demos and screenshots.

## Links
- [[OVERVIEW#Tech Stack]]
- [[SCHEMA]]
- [[ARCHITECTURE]] — `providers`, Header, theme tokens in `index.css`
