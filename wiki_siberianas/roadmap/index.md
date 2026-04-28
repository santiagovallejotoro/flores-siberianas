# Roadmap — Future Ideas

> [!note]
> This is the **ideas parking lot**. No fixed dates. Reprioritize freely.
> For current architecture, see [[ARCHITECTURE]]. For what was already built, browse [[logs/session-2026-04-26]].

---

## In Progress

Features with existing routes but incomplete implementation:

- [[features/client-portal|client portal]] — client-facing portal (`/client-portal`) — order history, invoices, communication
- [[features/proveedor-portal|proveedor portal]] — supplier portal (`/proveedor-portal`) — capacity, pricing, availability uploads
- [[features/credit-application|credit application]] — credit form + API (`/apply/credit`)

---

## Planned

### Auth & Access

- [ ] Role-based access — separate client vs supplier vs admin roles → [[features/auth|auth]]
- [ ] Social login — Google OAuth via Supabase
- [ ] Email notification on account events (signup, reset, approval)

### Portals

- [ ] [[features/client-portal|client portal]]: order history view, PDF invoice download
- [ ] [[features/proveedor-portal|proveedor portal]]: upload weekly availability + pricing
- [ ] Admin dashboard: manage users, review credit applications

### Content & Catalog

- [ ] Blog CMS: Supabase-backed blog posts (replaces static blog)
- [ ] Product catalog with filtering by variety, color, and season → [[features/products|products]]
- [ ] Market-specific landing pages (US, EU, Asia) → [[features/markets|markets]]

### Technical

- [ ] Custom DB tables for orders, products, credit_applications → document in [[ARCHITECTURE]]
- [ ] Email alerts for form submissions ([[features/contact|contact]], [[features/credit-application|credit application]])
- [ ] Analytics integration (pageviews, conversion tracking)
- [ ] i18n expansion: add translated routes for SEO (`/es/productos`, etc.)

### UpcomingTools

- [ ] Define what `UpcomingTools/` component will become → currently a placeholder

### Mi Finca — onboarding & farmer guidance

> [!note]
> Phase 1 (wizard at `/proveedor-portal/primeros-pasos`, dashboard banner, sidebar entry) and Phase 2 Round 1 (checklist hub at `/proveedor-portal/farm`, `CatalogHelp` blocks on the 7 catálogo pages) are **shipped**. The items below were scoped but deferred — they touch the existing editors and need separate review before implementing.

**Priority — flagged by the team:**

- [ ] **Suggested activities seed** — "Cargar ejemplos típicos" button on `Actividades` (and optionally `Clases`, `Insumos`) that one-click loads ~8 hortensia-typical activities (riego, fertilización, poda, cosecha, empaque, etc.) when the catalog is empty. User can edit or delete each. Touches `ActividadesEditor`. **Why important:** removes the cold-start blank-page problem for the hardest catálogo to fill.
- [ ] **Smart empty states for variedad and dependents** — In `VariedadesEditor`, `ActividadesEditor`, `CiclosProduccionEditor`, `CultivosEditor`, when a prerequisite dropdown is empty (no Clases / Ubicaciones / Variedades / Insumos), show inline CTAs ("Crear primera Clase rápido", "Ir a Clases →") instead of a silent empty `<select>`. **Why important:** the only remaining hard dead-end for a farmer who navigates outside the wizard.

**Polish (lower priority):**

- [ ] **Mobile polish on dense forms** — Convert `VariedadesEditor` modal to full-screen sheet on phones; stack `UbicacionesEditor` 4-col grid vertically <640px; audit `inputMode` on remaining numeric fields.
- [ ] **Plain-language relabel pass** — Field labels still office-Spanish ("SMMLV", "Tasa de producción por planta"). Add finca-Spanish helper hints inline.
- [ ] **Cultivo modal generation strip** — Reframe the three "Generar ciclos / actividades / insumos" buttons inside `CultivosEditor` as a numbered status strip with one-line explanations and per-step progress pills.
- [ ] **Dashboard quick-actions blocked state** — When `cultivosCount === 0`, render the dashboard's *Acciones rápidas* cards as visually disabled with a "Necesita configuración" pill instead of silently linking to empty pages.

---

## Discarded Ideas

> [!warning]
> When a decision is made **not** to build something, capture it here with the reason. This prevents re-debating the same ideas.

| Idea | Reason Discarded | Date |
|------|-----------------|------|
| (none yet) | — | — |

---

## Links

- [[ARCHITECTURE]] — current codebase structure
- [[OVERVIEW]] — project identity and stack
- [[SCHEMA]] — wiki maintenance rules
- [[logs/session-2026-04-26]] — first session
