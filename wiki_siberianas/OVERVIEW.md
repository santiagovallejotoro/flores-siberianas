# OVERVIEW — Flores Siberianas

> [!note]
> This is the single source of truth for the project's identity. For codebase structure, see [[ARCHITECTURE]]. For the Postgres data map, see [[DATABASE]]. For wiki rules, see [[SCHEMA]].

---

## Mission

**Flores Siberianas** is a Colombian hydrangea exporter connecting South American growers to international buyers. The site serves three purposes:

1. **Marketing platform** — showcase products, markets, and export capabilities
2. **Client portal** — order management and communication for buyers ([[features/client-portal|client portal]])
3. **Supplier management** — tools for grower partners ([[features/proveedor-portal|proveedor portal]])

---

## Mobile first (prioritized)

**Layout and UI are built mobile first:** base styles target small screens; `xs`, `sm`, `md`, `lg`, and up add structure and density as the viewport widens. This is a deliberate product and engineering priority—buyers and partners often browse on phones first. Breakpoint names and values are defined in `src/styles/index.css`; see [[ARCHITECTURE]] for the breakpoint table.

---

## Tech Stack

| Layer | Technology | Why We Chose It |
|-------|-----------|-----------------|
| Framework | **Next.js 16** (App Router) | SSR + file-based routing + edge-ready |
| UI | **React 19**, **TypeScript 5** | Type safety, latest concurrent features |
| Styling | **Tailwind CSS v4** | Mobile-first utilities,Utility-first, custom theme via `@theme` directive |
| Theming | **next-themes** | Light/dark toggle with no flash on load |
| Backend / DB | **Supabase** (Postgres + Auth) | Managed DB, built-in auth, token refresh, real-time |
| PDF | **jsPDF** + **jspdf-autotable** | Client-side PDF generation for [[features/credit-application|credit application]] |
| Body font | **Inter** | Clean, readable at all sizes |
| Heading font | **Playfair Display** | Elegant, premium editorial feel |

> [!tip] Source
> Full dependency list in `package.json`. Node >= 20 required.

---

## Brand Colors

### Primary — Siberian Teal

Base hue: `HSL(170, 65%, __%)`

| Token | HSL | Approx Hex | Use |
|-------|-----|-----------|-----|
| `primary-500` | hsl(170, 65%, 42%) | `#25B199` | Buttons, links, main accents |
| `primary-400` | hsl(170, 65%, 52%) | `#35D4B8` | Hover states |
| `primary-600` | hsl(170, 65%, 32%) | `#1A8572` | Pressed / dark variant |
| `primary-100` | hsl(170, 65%, 92%) | `#D6F5F0` | Light backgrounds |

### Secondary — Siberian Purple

Base hue: `HSL(300, 45%, __%)`

| Token | HSL | Approx Hex | Use |
|-------|-----|-----------|-----|
| `secondary-500` | hsl(300, 45%, 38%) | `#8D358D` | CTAs, badges, highlights |
| `secondary-400` | hsl(300, 45%, 52%) | `#B85AB8` | Hover states |
| `secondary-600` | hsl(300, 45%, 28%) | `#692669` | Dark variant |

### Semantic Tokens

| Token | Value | Use |
|-------|-------|-----|
| `background` | hsl(170, 20%, 98%) | Page background |
| `foreground` | hsl(280, 30%, 18%) | Body text |
| `accent` | hsl(300, 50%, 45%) | Spot highlights |
| `destructive` | hsl(0, 84%, 60%) | Errors, delete actions |
| `muted` | hsl(170, 15%, 92%) | Subtle backgrounds |

> [!tip] Usage in code
> Colors are CSS custom properties defined in `src/styles/index.css`. Use Tailwind classes: `bg-primary-500`, `text-secondary-600`, `border-primary-100`.

### Gradient Text

```css
.text-gradient {
  background: linear-gradient(to right, var(--color-primary-500), var(--color-secondary-500));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## Typography

| Role | Font | Weight |
|------|------|--------|
| Body | Inter (sans-serif) | 300, 400, 500, 600, 700 |
| Headings (h1–h6) | Playfair Display (serif) | 400, 500, 600, 700 |
| Display class | `.font-display` → Playfair Display | — |

---

## Internationalization

Custom implementation — **no external i18n library**.

| Code | Language |
|------|---------|
| `en` | English |
| `es` | Spanish |
| `ru` | Russian |
| `zh` | Chinese |

- Context provider: [[features/language-context|LanguageContext]] — `src/contexts/LanguageContext.tsx`
- All translation strings: `src/lib/translations.ts` (~1700 lines)
- Usage in components: `const { t, language, setLanguage } = useLanguage()`
- Language preference persisted in `localStorage`

---

## Environment Variables

| Variable | Scope | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_SITE_URL` | Client + Server | Full site URL — canonical, OG, sitemap, robots |
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Supabase project API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Public key (safe to expose) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | Admin key — **never expose to client** |

> [!warning]
> `SUPABASE_SERVICE_ROLE_KEY` must only be used in server components, API routes, or server actions. Importing it in client code is a security breach.

---

## Pages & Routes

For the full grouped route table, see [[ARCHITECTURE]].

**Public:** `/`, `/about`, `/products`, `/exports`, `/markets`, `/technology`, `/contact`, `/blog`

**Auth:** `/auth/login`, `/auth/clientes/login`, `/auth/clientes/register`, `/auth/proveedores/login`, `/auth/proveedores/register`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/verify-email`, `/signin`, `/signup`

**Portals:** [[features/client-portal|client portal]] — `/client-portal`; [[features/proveedor-portal|proveedor portal]] — `/proveedor-portal`

**Other:** [[features/credit-application|credit application]] — `/apply/credit`; also [[features/proveedores|Proveedores]] at `/proveedores`

---

## Links

- [[ARCHITECTURE]] — codebase skeleton and route table
- [[DATABASE]] — Postgres tables and how they relate
- [[SCHEMA]] — wiki maintenance rules
- [[roadmap/index]] — future ideas
- [[logs/session-2026-04-26]] — first session
