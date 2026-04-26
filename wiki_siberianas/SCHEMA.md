# SCHEMA — Wiki Maintenance Rules

> [!note] Purpose
> This file is the operating manual for this knowledge base. Every human and AI maintainer must read it before editing any page.

## What This Wiki Is For

This is not documentation. It is a **system map** — a living graph of how [[OVERVIEW|Flores Siberianas]] works: its code, its decisions, its logic, and its future.

See [[ARCHITECTURE]] for codebase structure and [[OVERVIEW]] for brand and stack identity.

---

## Folder Structure

| Folder | Purpose |
|--------|---------|
| `/` (root) | Core identity files: [[OVERVIEW]], [[ARCHITECTURE]], this file |
| `features/` | One page per feature module (auth, client portal, etc.) |
| `logs/` | Session summaries named `session-YYYY-MM-DD.md` |
| `roadmap/` | Future ideas and planned work |

---

## Writing Rules

### The "Why" Over the "How"

Document **intent**, not mechanics.

- Bad: "We call `supabase.auth.signIn()`."
- Good: "We use Supabase Auth because it handles email verification and token refresh out of the box, avoiding a custom auth server."

### Scan-Friendly Format

- **Bold** key terms on first use
- Short paragraphs (3–4 lines max)
- Tables for comparisons, bullets for lists
- Use Obsidian callouts: `> [!note]`, `> [!warning]`, `> [!tip]`
- Mermaid diagrams for all flows and relationships (3+ steps → diagram)

### One Concept Per Page

If a page grows beyond ~40 lines, split it into sub-pages. For a **new feature note**, add `[[features/your-file-name]]` (see *Path rules* below).

### No Redundancy

Each fact lives in **one place only**. Other pages link to it — they never repeat it.

---

## Wikilink Policy

**Every named concept must become a `[[wikilink]]`.** This is what powers the Obsidian Graph View.

**Path rules (so new notes don’t land in the vault root):**
- **Feature and module pages** (auth, products, a component, etc.): use `[[features/slug|optional display text]]` — the file is `wiki_siberianas/features/slug.md`
- **Core** (vault root only): `[[SCHEMA]]`, `[[OVERVIEW]]`, `[[ARCHITECTURE]]` — not under `features/`
- **Session logs:** `[[logs/session-YYYY-MM-DD]]`
- **Roadmap index:** `[[roadmap/index]]` (file `roadmap/index.md`)

> [!warning] Never
> Bare links like `[[client-portal]]` at the vault **root** are misleading — Obsidian will create `client-portal.md` next to SCHEMA. Always `[[features/client-portal|…]]` instead.

Always link:
- Feature pages: `[[features/auth|auth]]`, `[[features/client-portal|client portal]]`, `[[features/credit-application|credit application]]`
- Core: `[[OVERVIEW]]`, `[[ARCHITECTURE]]`, this file
- Session logs: `[[logs/session-2026-04-26]]`

> [!tip]
> A "broken" link to a not-yet-created `features/…` file still shows in Graph View. Prefer creating the file under `features/` right away (stub is fine) so the graph is truthful.

---

## Feature Page Template

Every page in `features/` **must** follow this structure exactly:

```md
## Purpose
One sentence: what does this feature do and why does it exist?

## How It Works
Step-by-step flow. Use a Mermaid diagram if there are 3+ steps.

## Schema / Data
Tables or code blocks describing DB tables, API shapes, or state structures.

## Dependencies
- Other wiki pages: `[[features/slug|label]]` — one line per internal dependency
- External: service or package name

## Failure Cases
What can go wrong? Current behavior? Intended fix?

## Key Decisions
Capture trade-offs: "We chose X over Y because Z."

## Links
- [[ARCHITECTURE]] — structural context
- [[logs/session-YYYY-MM-DD]] — session when this was built
```

---

## Session Log Rule

> [!warning] Required
> Every coding session that changes code or decisions **must** end with a new entry in `logs/session-YYYY-MM-DD.md`.

Log format:

```md
## What Changed

## What Broke (and how we fixed it)

## Next Steps
```

---

## Auto-Update Rule

After completing any feature or significant logic change, propose an update to the relevant wiki page. Only document **important or complete functionality** — do not document half-built work.

---

## Post-ship sync — auth & portals

**Rule:** After changing auth UI, middleware, or Supabase `public` user tables, update [[features/auth|auth]] (flows, data model) and [[ARCHITECTURE]] (folder map + route table + Supabase list). **Do not** paste long specs here — this file stays the maintenance contract only.

**Repo checkpoint (2026-04-26):** `public.profiles` (role `cliente` \| `proveedor`), `public.clientes`, `public.proveedores`; trigger on `auth.users` insert sets `profiles.role` from signup `user_metadata.role` (default `cliente`). Routes live under `src/app/auth/` including `/auth/clientes/register` and `/auth/proveedores/login` + `register`; middleware in `src/middleware.ts` matches `/client-portal/*` and `/proveedor-portal/*`. Shared pages: forgot-password and verify-email support `?back=` for return login URL; both wrap `useSearchParams` in `<Suspense>` (Next.js build). Auth shell: mobile-first width (`max-w-full` → `md:max-w-xl` → `lg:max-w-2xl`), left column `min-w-0`; register forms use `md:grid-cols-2` and `min-w-0` field cells.

---

## Links

- [[OVERVIEW]] — project identity, brand, stack
- [[ARCHITECTURE]] — codebase skeleton
- [[roadmap/index]] — future ideas
- [[logs/session-2026-04-26]] — first session
