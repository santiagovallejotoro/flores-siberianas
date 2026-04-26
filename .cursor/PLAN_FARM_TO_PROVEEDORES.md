# Plan: Integrate Farm Manager into the Proveedor Portal

> Migrate the standalone Google Apps Script "Farm Manager" (`.cursor/farm/`) into
> the existing Next.js + Supabase **Proveedor Portal** so each `proveedor` (user)
> manages their own farm — their crops, varieties, locations, activities,
> production cycles, costs, harvests and reports — directly from
> `app/proveedor-portal/*`, instead of a Google Sheet.

---

## 0. Source vs. Target — Quick Map

| Concern        | Farm Manager (current)                           | Proveedor Portal (target)                                         |
| -------------- | ------------------------------------------------ | ----------------------------------------------------------------- |
| Backend        | Google Apps Script (`Code.gs`, ~4000 LOC)        | Next.js Route Handlers + Server Actions + Supabase RPC            |
| DB             | Google Sheets (~15 tabs)                         | Supabase Postgres (~15 tables + RLS)                              |
| Auth           | Custom user/pass + 6h cache token (`Usuarios`)   | Supabase Auth (already wired) + `proveedores` profile table       |
| Frontend       | Single 433 KB `FarmPanel.html`                   | React components under `src/app/proveedor-portal/farm/*`          |
| Multi-tenancy  | None — one sheet = one farm                      | One row per `proveedor` everywhere; enforced via RLS              |
| File layout    | `Code.gs`, `tables.gs`, `FarmPanel.html`         | `src/app/proveedor-portal/`, `src/lib/farm/`, `supabase/migrations/` |

The **biggest semantic change**: every farm row must be scoped to a
`proveedor_id` (= `auth.users.id`). The Sheet implicitly belongs to one farm;
Postgres rows must carry the owner.

---

## 1. Existing Assets We Reuse

Already in repo — do not re-build:

- **Auth**: `src/lib/supabase/{client,server,unified,middleware}.ts` and
  `app/auth/proveedores/{login,register}/page.tsx` (Supabase email auth, with
  metadata `{ role: "proveedor", nombres, apellidos, tipo_identificacion, … }`).
- **Route guard**: `src/lib/supabase/middleware.ts` already redirects
  unauthenticated traffic on `/proveedor-portal/*` → `/auth/proveedores/login`.
- **`proveedores` table** is already queried in
  `src/app/proveedor-portal/page.tsx:23` (`from("proveedores").select…`).
  Confirm or create the migration that backs it (see §3.A).
- **Portal shell**: `src/app/proveedor-portal/page.tsx` already renders
  placeholder cards ("Disponibilidad", "Historial", "Inspecciones",
  "Planificación") — those become entry points to the farm modules.

---

## 2. Phased Roadmap (high level)

| Phase | Goal                                                                          | Deliverable                                                            |
| ----- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1     | Solidify foundations (`proveedores` profile + RLS conventions)                | One migration; reusable RLS policy macros                              |
| 2     | Catalog tables (Clases_Cultivo, Variedades, Ubicaciones, Insumos, Actividades) | Migrations + simple CRUD UI under `/proveedor-portal/farm/catalogos`   |
| 3     | Operational tables (Cultivos + Ciclo_Produccion + Ciclos_Cultivo)             | Migrations + crop editor + cycle generator (port `generarCiclos*`)     |
| 4     | Activity / Insumo execution per cultivo + Costos + Producción                 | Migrations + quick-entry forms (Costo, Mano de Obra, Producción)       |
| 5     | Reports (Producción, Mano de Obra, Materiales) + PDF export                   | Server-side aggregation queries + report screens                       |
| 6     | Polish: dashboard stats, dropdowns helper, batch updates, optimistic UI       | Stats RPC, generic batch endpoint, toast/confirm primitives            |

Each phase is independently shippable — RLS guarantees safety even if later
phases are not yet exposed in the UI.

---

## 3. Database Migrations (Supabase)

> Place every migration under `supabase/migrations/<timestamp>_<name>.sql` so it
> is replayable. All tables get `proveedor_id uuid not null references
> auth.users(id) on delete cascade`, plus `created_at`/`updated_at` and an
> `updated_at` trigger.
>
> All `id` columns: `uuid primary key default gen_random_uuid()`.
>
> Conventions:
> - Snake_case in SQL, camelCase in TS DTOs (mapped at the boundary).
> - Money: `numeric(14,2)`. Areas: `numeric(10,2)`. Counts: `integer`.
> - Enums use `text` + `check` constraint (cheaper to evolve than PG enums).
> - Every table gets `(proveedor_id)` index + RLS owner policy below.

### 3.A — Phase 1: Foundations

1. **`proveedores`** (profile, owned by `auth.users.id`):

   ```sql
   create table public.proveedores (
     id uuid primary key references auth.users(id) on delete cascade,
     nombres text not null,
     apellidos text,
     tipo_identificacion text check (tipo_identificacion in ('CC','NIT','PASAPORTE','OTHER')),
     numero_identificacion text,
     numero_telefono text,
     vereda text,
     municipio text,
     created_at timestamptz default now(),
     updated_at timestamptz default now()
   );
   create unique index proveedores_numero_identificacion_uniq
     on public.proveedores(numero_identificacion)
     where numero_identificacion is not null;
   ```

   Plus a trigger that auto-inserts a `proveedores` row from `raw_user_meta_data`
   on `auth.users` signup (the registration flow at
   `auth/proveedores/register/page.tsx:81-89` already passes the right keys).

2. **`configuracion`** (per-proveedor settings, mirrors the `Configuracion`
   sheet):

   ```sql
   create table public.configuracion (
     proveedor_id uuid not null references auth.users(id) on delete cascade,
     variable text not null,
     valor text not null,
     descripcion text,
     primary key (proveedor_id, variable)
   );
   ```

   Defaults to insert on signup: `TASA_CAMBIO=4200`, `SMMLV=1300000`,
   `JORNAL_DIA=65000`, `HORAS_JORNAL=8`.

3. **RLS macro (apply to every table below)**:

   ```sql
   alter table <t> enable row level security;
   create policy "<t>_owner_all" on <t>
     using  (proveedor_id = auth.uid())
     with check (proveedor_id = auth.uid());
   ```

   This single policy gives each proveedor full read/write of their own rows
   and zero visibility into anyone else's. Admin override (Flores Siberianas
   internal staff) is done via a `service_role` client.

### 3.B — Phase 2: Catalog tables

| Sheet                  | Postgres table        | Notes                                                                |
| ---------------------- | --------------------- | -------------------------------------------------------------------- |
| `Clases_Cultivo`       | `clases_cultivo`      | Seed default rows (HORTENSIA / ROSA / CLAVEL) on first proveedor login |
| `Ubicaciones`          | `ubicaciones`         | `area_m2 numeric(10,2)`                                              |
| `Variedades`           | `variedades`          | FK `id_ubicacion → ubicaciones(id)`, `ciclo_en_semanas int`          |
| `Insumos`              | `insumos`             | `valor_unitario numeric(14,2)`                                       |
| `Actividades`          | `actividades`         | FK `id_clase_cultivo` (nullable so it works for "all classes")       |

Skeleton (repeat the pattern for each):

```sql
create table public.variedades (
  id uuid primary key default gen_random_uuid(),
  proveedor_id uuid not null references auth.users(id) on delete cascade,
  nombre text not null,
  tipo_cultivo text,
  id_ubicacion uuid references public.ubicaciones(id) on delete set null,
  ciclo_en_semanas integer,
  semana_inicio_corte integer,
  rendimiento_esperado_por_planta numeric(10,2),
  unidad_rendimiento text,
  tiene_ciclos_produccion boolean default false,
  observaciones text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index variedades_proveedor on public.variedades(proveedor_id);
```

Cascade delete of `variedades` must also remove its
`ciclo_produccion` rows — handled by FK `on delete cascade` (replaces the
manual cascade in `Code.gs:2671 deleteCiclosProduccion`).

### 3.C — Phase 3: Operational core

| Sheet               | Postgres table          | Key FKs                                                              |
| ------------------- | ----------------------- | -------------------------------------------------------------------- |
| `Cultivos`          | `cultivos`              | `id_ubicacion`, `id_variedad`, `estado text check (…)`               |
| `Ciclo_Produccion`  | `ciclo_produccion`      | `id_variedad` (cascade delete)                                       |
| `Ciclos_Cultivo`    | `ciclos_cultivo`        | `id_cultivo` (cascade delete)                                        |

`ciclos_cultivo.estado` constrained to `('Pendiente','En curso','Cosechado','Cancelado')`.

### 3.D — Phase 4: Per-cultivo execution + finance

| Sheet                  | Postgres table         | Notes                                                       |
| ---------------------- | ---------------------- | ----------------------------------------------------------- |
| `Actividades_Cultivo`  | `actividades_cultivo`  | FK `id_cultivo`, `id_actividad`, `id_ciclo_cultivo` nullable |
| `Insumos_Cultivo`      | `insumos_cultivo`      | FK `id_cultivo`, `id_actividad_cultivo`, `id_insumo`         |
| `Costos`               | `costos`               | `tipo_costo text check (…)`                                  |
| `Produccion`           | `produccion`           | Merged production + sales (`estado_venta`)                   |

Add a `mano_obra` view if labor stays as `costos.tipo_costo='MANO_OBRA'`, or
keep separate table — match how `registrarManoObra` (Code.gs:971) is used.
**Recommendation: keep one `costos` table with `tipo_costo`** — it simplifies
reports.

### 3.E — Indexes worth creating up front

```sql
-- All operational tables need fast lookup by (proveedor_id, id_cultivo).
create index ciclos_cultivo_cultivo on public.ciclos_cultivo(id_cultivo);
create index actividades_cultivo_cultivo on public.actividades_cultivo(id_cultivo);
create index insumos_cultivo_cultivo on public.insumos_cultivo(id_cultivo);
create index costos_cultivo on public.costos(id_cultivo);
create index produccion_cultivo on public.produccion(id_cultivo);
-- Reports filter by week + year.
create index ciclos_cultivo_fecha_planeada on public.ciclos_cultivo(fecha_planeada);
```

---

## 4. Backend Functions — Apps Script → Next.js

The Apps Script API surface (every function in `Code.gs`) maps to one of three
shapes:

| GAS function                          | Replacement in this app                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------ |
| `authenticateUser`, `logoutUser`      | Already covered by Supabase Auth (`SassClient.loginEmail`/`logout`)                  |
| `getTable`, `addRow`, `updateRow`, `deleteRow` | Direct `supabase.from(table).select/insert/update/delete()` from server components or server actions; RLS already restricts to the owner |
| `getDropdownData`, `getCultivosActivos`, `getDashboardStats`, `getMonthlyFinancialData` | Server-side aggregation: PostgREST views or SQL functions called via `rpc('fn', …)` |
| `generarCiclosProduccion`, `generarCiclosCultivo`, `generarActividadesCultivo`, `generarInsumosCultivo` | **Postgres functions** (`create function … language plpgsql security invoker`); call via `supabase.rpc(...)` |
| `actualizarCiclosBatch`, `actualizarActividadesBatch`, `saveCiclosCultivoBulk`, `saveActividadesCultivoBulk`, `saveInsumosCultivoBulk` | One server action per entity that takes an array of `{id, …updates}` and uses `supabase.upsert` |
| `getReportCiclosCultivo`, `getReportActividades`, `getReportInsumos`, `getReportFilterOptions` | SQL views + server-side aggregation; ISO-week math done with `date_trunc('week', …)` and `extract(week from …)` |
| `sanitizeReportData`, `toDate` | Not needed — Postgres + JSON handles types natively (the Date-serialization bug from `CHANGELOG.md` simply does not exist on this stack) |

### 4.A — Folder layout for backend code

```
src/lib/farm/
├── schema.ts             # Zod schemas for every entity (validation + types)
├── catalogos.ts          # CRUD helpers for clases, variedades, ubicaciones, insumos
├── cultivos.ts           # createCultivo, generateCiclos, generateActividades, etc.
├── ciclos.ts             # batch update / generation
├── costos.ts             # registrarCosto, registrarManoObra, registrarProduccion
├── reports.ts            # 3 report builders + ISO week helpers
└── dashboard.ts          # getDashboardStats, getMonthlyFinancialData

src/app/proveedor-portal/farm/
├── layout.tsx
├── page.tsx              # dashboard
├── catalogos/(varieties|ubicaciones|insumos|clases)/page.tsx
├── cultivos/
│   ├── page.tsx
│   ├── nuevo/page.tsx
│   └── [id]/
│       ├── page.tsx      # cultivo editor
│       ├── ciclos/page.tsx
│       ├── actividades/page.tsx
│       └── insumos/page.tsx
└── reportes/(produccion|mano-obra|materiales)/page.tsx
```

### 4.B — RPCs to write up front

These belong in Postgres (not the Node layer) because they touch many rows and
benefit from being transactional:

1. **`generar_ciclos_produccion(p_variedad_id uuid)`** — port of
   `Code.gs:1471`. Reads the variety's `ciclo_en_semanas` /
   `semana_inicio_corte`, computes a bell-curve distribution
   (`calcularDistribucionProduccion`, line 1579), inserts rows into
   `ciclo_produccion`.
2. **`generar_ciclos_cultivo(p_cultivo_id uuid)`** — line 1622. Materializes
   cycles for a specific cultivo from its variedad's template.
3. **`generar_actividades_cultivo(p_cultivo_id uuid, p_source text)`** — line
   1772.
4. **`generar_insumos_cultivo(p_cultivo_id uuid, p_source text)`** — line 1941.
5. **`dashboard_stats()`** — returns the JSON shape consumed by the dashboard
   (line 1152).

Each function uses `security invoker` so RLS still applies — a proveedor can
only generate cycles for *their own* cultivos.

### 4.C — Validation

Use **Zod** at every server-action boundary. Example:

```ts
// src/lib/farm/schema.ts
export const cultivoInsert = z.object({
  numero_cultivo: z.string().min(1),
  id_ubicacion: z.string().uuid(),
  id_variedad: z.string().uuid(),
  fecha_inicio: z.coerce.date(),
  total_plantas: z.number().int().positive(),
  // …
});
```

This replaces the ad-hoc validation scattered through `Code.gs`.

---

## 5. Frontend Migration

### 5.A — Replace the monolithic `FarmPanel.html`

`FarmPanel.html` is one 433 KB file. **Do not** port it 1:1 — split into route
segments per the layout in §4.A. Re-use existing primitives from this codebase:

- Tailwind v4 (already configured in `src/styles/index.css`)
- The dark/light theming via `next-themes`
- The translation system (`useLanguage()`) — add a `farm.*` namespace to
  `src/lib/translations.ts` with `es`, `en` (postpone `ru`/`zh` if scope-limited)

### 5.B — Components to port (in priority order)

| FarmPanel screen                | New React component                                                          |
| ------------------------------- | ---------------------------------------------------------------------------- |
| `dashboardScreen`               | `src/app/proveedor-portal/farm/page.tsx` (server component, calls `dashboard_stats` RPC) |
| `tableEditorScreen` (generic)   | `src/components/Farm/TableEditor.tsx` — accepts a config `{ entity, columns, fkOptions }` |
| `cultivoEditorScreen`           | `src/app/proveedor-portal/farm/cultivos/[id]/page.tsx`                       |
| `ciclosProduccionScreen`        | `src/components/Farm/CiclosProduccionEditor.tsx` (inline batch edit)         |
| `actividadesPorClaseScreen`     | `src/components/Farm/ActividadesPorClase.tsx`                                |
| Modals (`rowEditor`, `nuevoCultivo`, `costoModal`, `produccionModal`, `laborModal`) | `src/components/Farm/modals/*.tsx`, controlled via URL search-params or a small client store |
| Reports                         | `src/app/proveedor-portal/farm/reportes/[tab]/page.tsx` — server-rendered tables, native `window.print()` for PDF (CSP-safe; matches the fix logged in `CHANGELOG.md`) |

### 5.C — UI primitives we need

- `Toast` (replace `showToast`) — pick one and stick with it
- `ConfirmDialog` (replace `showConfirm`) — already pattern-documented
  (Promise-returning)
- `LoadingButton` — disabled + spinner during submit (replicates the
  duplicate-submission prevention from `CHANGELOG.md`)
- `DataTable` — generic, used by `tableEditorScreen` replacement

If the existing app already has these, reuse them; otherwise create them in
`src/components/Common/` so non-farm screens can adopt them too.

---

## 6. Auth & Multi-Tenancy Strategy

- The Sheet's `Usuarios` table is **dropped**. Supabase Auth (already in use)
  is the single source of truth.
- Every `INSERT` from the portal must include `proveedor_id = auth.uid()`. Do
  this via a default value on each table to avoid client trust:

  ```sql
  alter table public.cultivos
    alter column proveedor_id set default auth.uid();
  ```

  Combined with the RLS `with check (proveedor_id = auth.uid())`, even a
  malicious client can't write into another proveedor's farm.
- Internal Flores Siberianas staff will eventually need cross-tenant access
  (e.g. quality inspectors). Design that with a separate `staff_roles` table
  + a parallel set of `…_staff_read` RLS policies — **out of scope for v1**,
  but leave the door open by never relying on `auth.uid()` outside RLS.

---

## 7. Data Migration (existing Sheet → Postgres)

For proveedors who already use the Sheet:

1. Export each tab to CSV (Apps Script: `File → Download → CSV per sheet`).
2. Add a one-shot loader script under `scripts/import-farm.ts` that:
   - Reads CSVs.
   - Maps each old `ID` (UUID-like) to itself (already UUIDs from
     `Utilities.getUuid()` — no remap needed).
   - For each row, attaches the proveedor's `auth.uid()`.
   - Inserts into the matching Postgres table using the **service role** key
     (bypasses RLS for the bulk import).
3. Run once per proveedor. After cutover, the Sheet becomes read-only.

If no proveedor is on the Sheet yet, **skip this section** — start clean.

---

## 8. Step-by-Step Execution Checklist

### Sprint 1 — Foundation (Phase 1)

- [ ] Create `supabase/migrations/0001_proveedores.sql` (table + signup
      trigger + RLS + per-proveedor `configuracion` defaults).
- [ ] Verify the existing register flow at
      `src/app/auth/proveedores/register/page.tsx:78-90` populates the new
      `proveedores` row through the trigger (no client-side insert needed).
- [ ] Add a top-level link in the portal page (`src/app/proveedor-portal/page.tsx:55-90`)
      from "Planificación" / new "Mi Finca" card → `/proveedor-portal/farm`.

### Sprint 2 — Catalogs (Phase 2)

- [ ] Migration `0002_catalogos.sql`: `clases_cultivo`, `ubicaciones`,
      `variedades`, `insumos`, `actividades` + indexes + RLS.
- [ ] Trigger / seed function: on first insert into a proveedor's
      `clases_cultivo` (or on signup), seed HORTENSIA/ROSA/CLAVEL.
- [ ] Build generic `TableEditor` and wire one route
      (`/proveedor-portal/farm/catalogos/variedades`) end-to-end as the
      reference implementation.
- [ ] Repeat for the remaining 4 catalogs.

### Sprint 3 — Cultivos & Cycles (Phase 3)

- [ ] Migration `0003_cultivos.sql`: `cultivos`, `ciclo_produccion`,
      `ciclos_cultivo` + cascade FKs.
- [ ] Migration `0004_rpc_generar.sql`: `generar_ciclos_produccion` and
      `generar_ciclos_cultivo`. Smoke-test with the same data as
      `Code.gs:1579 calcularDistribucionProduccion` (bell-curve, sums to 100%).
- [ ] Build `cultivos` list, "Nuevo Cultivo" form, and cultivo editor.
- [ ] Wire `Generar Ciclos` / `Editar Ciclos` buttons.

### Sprint 4 — Execution & Finance (Phase 4)

- [ ] Migration `0005_execution_finance.sql`: `actividades_cultivo`,
      `insumos_cultivo`, `costos`, `produccion`.
- [ ] Migration `0006_rpc_generate_actividades_insumos.sql`:
      `generar_actividades_cultivo`, `generar_insumos_cultivo`.
- [ ] Quick-entry forms: Costo, Mano de Obra, Producción (modals from
      §5.B).
- [ ] State-update side effects: when registering production, mark the
      matching `ciclos_cultivo.estado='Cosechado'` (mirrors
      `_updateCicloCultivoProduccion_` at `Code.gs:1100`).

### Sprint 5 — Reports (Phase 5)

- [ ] Migration `0007_views_reports.sql`: 3 SQL views or table-valued
      functions for the 3 reports.
- [ ] Build `/proveedor-portal/farm/reportes/(produccion|mano-obra|materiales)`
      with the filter UI (year, week range, ubicaciones, variedades).
- [ ] PDF via `window.print()` and a print-only stylesheet — **do not**
      add `jsPDF` (it triggered the CSP error logged in
      `CHANGELOG.md` and is unnecessary in a Next.js context).

### Sprint 6 — Polish

- [ ] Dashboard stats RPC + cards on `/proveedor-portal/farm`.
- [ ] Translations: add the `farm.*` namespace.
- [ ] Replace placeholder "Próximamente" badges in the portal landing.
- [ ] Optional: cross-proveedor admin role for Flores Siberianas staff.

---

## 9. Key Decisions to Lock Before Coding

1. **Single `costos` table vs. separate `mano_obra` / `costos`?**
   Recommend single (see §3.D). Decide before writing migrations.
2. **Where does ISO-week math live — Postgres or TS?**
   Recommend Postgres (`extract(isoyear from …)`, `extract(week from …)`),
   since the UI just renders strings.
3. **Default seed of `clases_cultivo` per proveedor — trigger or first-login
   server action?**
   Recommend signup trigger so the catalog is never empty when the user
   arrives.
4. **Modal navigation pattern — URL search-params (`?modal=nuevo-cultivo`) or
   a client store?**
   Recommend search-params (deep-linkable, server-component-friendly).
5. **PDF export approach — `window.print()` (matches existing fix) or a
   server-rendered PDF (e.g. via React-PDF)?**
   Recommend `window.print()` for v1; revisit if proveedors demand pixel-perfect
   PDFs.

---

## 10. Out of Scope for v1

- Real-time collaboration (Supabase Realtime) — proveedors edit alone.
- Mobile app — the portal is responsive enough.
- Migrating internal Flores Siberianas data from any other system — only
  cover proveedor-owned farm data.
- The other portal cards ("Disponibilidad", "Historial de compras",
  "Inspecciones de calidad") — those are separate features documented
  elsewhere.

---

## 11. Risks & Mitigations

| Risk                                                                  | Mitigation                                                                     |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Proveedor sees another farm's data due to a missing RLS policy        | Default-deny: enable RLS on every table at creation; add a CI test that runs `select * from <t>` as an anon user and asserts zero rows visible. |
| `generar_*` RPCs leave half-inserted rows on error                    | Wrap each RPC body in an implicit transaction (it already is — just don't `commit` mid-function). |
| The bell-curve distribution drifts away from the original `calcularDistribucionProduccion` | Port it 1:1 first (port the JS arithmetic into PL/pgSQL), add a Vitest snapshot for inputs (4, 8, 12, 16, 20 weeks) so behavior is locked. |
| Catalog seeds duplicate on every signup                               | Use `on conflict do nothing` on a `unique(proveedor_id, nombre)` index.        |
| The `Date` serialization bugs from the GAS days re-appear             | They can't — Supabase returns `text` for `timestamptz`. Don't manually `JSON.stringify` Date instances; let Postgres do the formatting. |

---

## 12. References

- Source app: `.cursor/farm/{Code.gs, tables.gs, FarmPanel.html, README.md, CHANGELOG.md}`
- Existing portal: `src/app/proveedor-portal/page.tsx`
- Existing auth: `src/app/auth/proveedores/{login,register}/page.tsx`,
  `src/lib/supabase/{client,server,middleware,unified}.ts`
- Project conventions: `CLAUDE.md`
- Wiki: `wiki_siberianas/SCHEMA.md`, `wiki_siberianas/OVERVIEW.md`
