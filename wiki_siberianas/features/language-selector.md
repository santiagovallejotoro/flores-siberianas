# LanguageSelector (component)

> **Code:** `src/components/LanguageSelector/`. Reusable UI; all labels from [[features/language-context|i18n]].

## Purpose
_Surface a language control in the header; keep selection in sync with_ [[features/language-context|LanguageContext]].

## How It Works
_TBD — control pattern, accessibility, hydration vs localStorage_

## Schema / Data
None — reads/writes through `useLanguage()` only.

## Dependencies
- [[features/language-context|LanguageContext]]

## Failure Cases
_TBD — mismatch between first paint and saved language_

## Key Decisions
_TBD — placement next to_ [[features/theme-toggler|ThemeToggler]]

## Links
- [[ARCHITECTURE]] (Header, components table)
- [[SCHEMA]]
