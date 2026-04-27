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
| Charts (portal) | **Recharts** | Interactive charts on the [[features/proveedor-portal|proveedor]] dashboard (`ResponsiveContainer`, composición barras/líneas) |
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

## Proveedor farm: Mi Finca operations (2026)

The **Mi Finca** area extends beyond catalog editors ([[features/proveedor-portal|proveedor portal]]) with **operational** screens that mirror the legacy `FarmPanel` Google Sheets/Apps Script flows, implemented in **Next.js (App Router) + Supabase** with **mobile-first** layouts.

| Area | Route | Code map |
|------|-------|----------|
| **Dashboard** | `/proveedor-portal` | `src/app/proveedor-portal/page.tsx` → `ProveedorDashboard` + `buildDashboardPayload` (`src/lib/farm/dashboard.ts`); refetch con `reloadProveedorDashboard` (`src/app/proveedor-portal/actions.ts`) |
| **Cultivos** | `/proveedor-portal/farm/cultivos` | `…/farm/cultivos/page.tsx` → `CultivosEditor` |
| **Reportes** | `/proveedor-portal/farm/reportes` | `…/farm/reportes/page.tsx` → `ReportesViewer` |
| **Producción** | `/proveedor-portal/farm/produccion` | `…/farm/produccion/page.tsx` → `ProduccionEditor` |
| **Costos** | `/proveedor-portal/farm/costos` | `…/farm/costos/page.tsx` → `CostosEditor` |
| **Inventario** | `/proveedor-portal/farm/inventario` | `…/farm/inventario/page.tsx` → `InventarioEditor` |
| **Library** | — | `src/lib/farm/*` — e.g. `cultivos.ts`, `generacion.ts`, `reportes.ts`, `produccion.ts`, `costos.ts`, `inventario.ts`, `insumos.ts`, `dashboard.ts` |

### Dashboard (`/proveedor-portal`)

- **KPI cards** (rango **Desde / Hasta**): cultivos activos, costos del período, ingresos (producción con `precio_venta` definido → `cantidad_cosechada × precio_venta`), actividades planificadas (`actividades_cultivo` en rango con cultivo `Activo` o `Planificado`), unidades cosechadas, insumos bajo mínimo.
- **Flujo financiero**: selector de **año calendario**; por mes agrega costos por `tipo_costo` (incl. `GENERAL`), ingresos y **neto**; gráfico con **Recharts** (barras apiladas + líneas).
- **Producción por mes** y **déficit de inventario** (insumos por debajo de `stock_minimo`) respecto al mismo rango o estado actual.
- **Acciones rápidas**: enlaces a Cultivos, Producción, Costos e Inventario.
- **Costos** en agregaciones usan solo filas con **`fecha`** (no se contempla `fecha` nula).

### Otros módulos (resumen)

- **Producción** — CRUD sobre `produccion`; al elegir ciclo se puede autollenar observaciones al estilo legacy.
- **Costos** — CRUD sobre `public.costos` (`tipo_costo` incluye `ARRENDAMIENTO`, `SERVICIO`, etc.). **Tipo INSUMO:** al guardar se crea movimiento de inventario **SALIDA** vinculado (`id_costo`); al eliminar el costo, cascada devuelve stock.
- **Inventario** — catálogo `insumos` con `stock_actual` y `valor_unitario` (promedio ponderado vía trigger en `inventario_movimientos`); pestañas stock, movimientos y reporte de compras (con filtros de fecha planeada).

### Cultivos

- **Server page** loads in parallel: cultivos, variedades, ubicaciones, and `clases_cultivo` (clases) for source selection in generation.
- **CRUD** on `cultivos` (create/edit in a modal, delete with confirm). **`estado`** is aligned with Postgres `cultivos_estado_check`: `Planificado`, `Activo`, `Finalizado`, `Cancelado` (defaults use **`Activo`** for new rows — previous app-only labels like *En Progreso* are not valid in the database).
- **Generación de datos** (from the edit modal, inspired by the legacy panel): **Generar ciclos** materializes `ciclos_cultivo` from the variety’s `ciclo_produccion` template; **Generar actividades** and **Generar insumos** use activity templates (variety or class scope, with a source picker when both exist) into `actividades_cultivo` and `insumos_cultivo`. Generation **replaces** existing generated rows for that cultivo in each category before insert. A **Gen.** column shows quick status (counts/icons) for generated ciclos, actividades, and insumos.
- **Schema** for relationships and RLS intent: see [[DATABASE]].

### Reportes

- **Data layer** (`src/lib/farm/reportes.ts`): **ISO week** helpers (`getISOWeekStart`, `getISOWeek`, `weekRangeToDateRange`, `formatWeekRange`), month→week quick ranges, and fetchers `fetchReportCiclos`, `fetchReportActividades`, `fetchReportInsumos` (PostgREST embeds, date range + optional filters by ubicación/variedad).
- **UI** (`ReportesViewer`): three tabs (producción / mano de obra / materiales), **summary** strip, and **print/PDF** via a dedicated print window. Filters stay **always visible** (no collapsible panel). Primary action is a single **Generar**; **Exportar PDF** is secondary. **Month** quick-select re-runs the report. **Ubicaciones** and **Variedades** use **pill toggles** (`FilterPills`) instead of native multi-selects. Year / month / week **selects** use **auto width** for a compact bar. Tables group rows by week using a **group header band** (week label + range + subtotal) to save vertical space versus repeated week columns. **Table column headers** use the **secondary (purple)** brand treatment (`text-secondary-600` / `bg-secondary-100/30`) to separate headers from data, consistent with badges such as *Ciclos* in `VariedadesEditor`.
- **Columnas unificadas:** primera columna **Ubicación – Cultivo** (`nombre_cultivo` o `vereda` + `numero_cultivo`); columna **Observaciones** antes de la métrica numérica — producción: `cultivos.observaciones` + `ciclos_cultivo.ciclo_produccion`; mano de obra: cultivo + `actividades_cultivo.observaciones`; materiales: cultivo + `insumos_cultivo.observaciones`. Misma lógica en el **PDF** exportado.

---

## Links

- [[ARCHITECTURE]] — codebase skeleton and route table
- [[DATABASE]] — Postgres tables and how they relate
- [[SCHEMA]] — wiki maintenance rules
- [[roadmap/index]] — future ideas
- [[logs/session-2026-04-26]] — first session
