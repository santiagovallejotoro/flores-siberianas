# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 website for Flores Siberianas, a Colombian hydrangea exporter. The site is built with TypeScript, Tailwind CSS v4, and features custom internationalization supporting English, Spanish, Russian, and Chinese. Originally based on a startup template, it has been customized for the flower export business.

## Development Commands

```bash
# Development server (runs on http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Architecture

### App Structure

The project uses Next.js App Router with the following key architectural patterns:

**Layout Hierarchy:**
- `src/app/layout.tsx` - Root layout with metadata, fonts, and SEO configuration
- `src/app/AppShell.tsx` - Client component wrapper that provides Header, Footer, and context providers
- `src/app/providers.tsx` - Wraps children with ThemeProvider and LanguageProvider
- Individual page components in `src/app/[page]/page.tsx`

**Page Rendering Pattern:**
All pages follow this structure:
```tsx
export const metadata: Metadata = { /* page-specific SEO */ };
export default function PageName() {
  return <>{/* Compose page from components */}</>
}
```

### Internationalization (i18n)

Custom i18n implementation without external libraries:

- **Language Context:** `src/contexts/LanguageContext.tsx` provides language state via React Context
- **Translations:** All translations are in `src/lib/translations.ts` (1500+ lines)
- **Supported Languages:** en, es, ru, zh (defined in `src/lib/i18n.ts`)
- **Usage Pattern:** Components call `const { t, language, setLanguage } = useLanguage()` and access translations via `t.sectionName.key`
- **Storage:** Language preference persists in localStorage

When adding new translatable content:
1. Add translation keys to all language objects in `src/lib/translations.ts`
2. Use `useLanguage()` hook in components to access translations
3. Menu titles in `menuData.tsx` use translation keys (e.g., "about", "products"), not display text

### Theming

Uses `next-themes` for dark/light mode:
- Configuration in `providers.tsx` with `defaultTheme="light"` and `enableSystem={false}`
- Toggle component at `src/components/Header/ThemeToggler.tsx`
- CSS custom properties defined in `src/styles/index.css` with custom `@custom-variant dark` directive
- Brand colors: Siberian Teal (primary) and Purple (secondary) with full HSL scale

### Component Organization

Components are organized by feature in `src/components/`:
- Each major component has its own directory
- Data files (e.g., `menuData.tsx`, `featuresData.tsx`) live alongside their components
- Shared utilities in `src/components/Common/`
- Type definitions in `src/types/`

### Styling with Tailwind CSS v4

- Custom theme configuration in `src/styles/index.css` using `@theme` directive
- Custom breakpoints: xs (450px), sm (575px), md (768px), lg (992px), xl (1200px), 2xl (1400px)
- Brand color system with primary (teal) and secondary (purple) scales
- Uses PostCSS with `@tailwindcss/postcss` plugin

### SEO Implementation

Strong SEO focus throughout:
- **Structured Data:** `src/app/JsonLd.tsx` provides Organization and WebSite schema
- **Metadata:** Each page exports `metadata` object with title templates, descriptions, Open Graph, and Twitter cards
- **Dynamic Routes:** `src/app/sitemap.ts` and `src/app/robots.ts` generate sitemap.xml and robots.txt
- **Environment:** `NEXT_PUBLIC_SITE_URL` env var (defaults to https://www.floressiberianas.com) used for absolute URLs
- **Verification:** Google Search Console verification ID in root layout

## Path Aliases

The project uses `@/` as an alias for `src/`:
```typescript
import Component from "@/components/Component"
import { useLanguage } from "@/contexts/LanguageContext"
```

## Key Files to Understand

- `src/app/AppShell.tsx` - App wrapper with Header, Footer, ScrollToTop
- `src/contexts/LanguageContext.tsx` - i18n implementation
- `src/lib/translations.ts` - All translation strings
- `src/styles/index.css` - Tailwind v4 configuration and custom CSS variables
- `src/components/Header/menuData.tsx` - Navigation structure
- `src/app/JsonLd.tsx` - SEO structured data

## Image Assets

Logo files in `public/images/logo/`:
- `logo-2.svg` - Light theme logo
- `logo.svg` - Dark theme logo
- Recommended: 280×60px, transparent background

Other images organized by feature in `public/images/` subdirectories.

## Environment Variables

Required:
- `NEXT_PUBLIC_SITE_URL` - Full site URL without trailing slash (e.g., https://www.floressiberianas.com)

Used for: metadataBase, canonical URLs, Open Graph URLs, sitemap generation.

## Code Patterns

**Adding a New Page:**
1. Create `src/app/[page-name]/page.tsx`
2. Export `metadata` object with SEO details (including `alternates.canonical`)
3. Compose page from existing or new components
4. Add route to `menuData.tsx` if navigation item needed (use translation key for title)

**Adding Translatable Content:**
1. Add keys to all four language objects in `src/lib/translations.ts`
2. Access via `const { t } = useLanguage()` in component
3. Use translation keys, not display text, in data files

**Creating Components:**
1. Components should be in `src/components/[FeatureName]/`
2. Use TypeScript types from `src/types/` or define inline
3. Apply Tailwind classes for styling
4. Make text translatable with `useLanguage()` hook
5. Handle both light and dark themes using `dark:` variant

## Node Version

Requires Node.js >= 20 (specified in package.json engines field)
