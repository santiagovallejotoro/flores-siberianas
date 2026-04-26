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
