# Auth

> Code: `src/app/auth/`, `src/middleware.ts`, `src/lib/supabase/*`, `src/app/api/auth/callback/route.ts`. Wiki rules: [[SCHEMA]].

## Purpose

Sign-in, self-service registration (clientes + proveedores), email verification, and password reset using **Supabase Auth**, with **one user pool** and **role separation** in Postgres (`public.profiles` + role-specific profile tables).

## Supported Sign-in Methods

| Method | Portals | Notes |
|--------|---------|-------|
| Email / password | clientes + proveedores | `signInWithPassword` |
| Google OAuth | clientes only | `signInWithOAuth`; new users get default role `cliente` from DB trigger |

## How It Works

```mermaid
flowchart LR
  subgraph signup [Signup]
    R1["/auth/clientes/register"]
    R2["/auth/proveedores/register"]
    SU["signUp + user_metadata.role"]
    TR["Trigger → public.profiles"]
    R1 --> SU
    R2 --> SU
    SU --> TR
  end
  subgraph login [Login]
    L1["/auth/clientes/login"]
    L2["/auth/proveedores/login"]
    PWD["signInWithPassword"]
    L1 --> PWD
    L2 --> PWD
  end
  subgraph gates [Gated areas]
    MW["middleware getUser"]
    CP["/client-portal"]
    PP["/proveedor-portal"]
    MW --> CP
    MW --> PP
  end
```

1. **Register:** Browser `createSPASassClient()` → `registerEmail`; metadata includes `role: 'cliente'` or `'proveedor'` plus name/ID fields. Supabase creates `auth.users`; DB trigger inserts `public.profiles`.
2. **Verify email:** User follows link → `/api/auth/callback` exchanges code → redirect default `/client-portal` unless `next` query says otherwise; resend UI at `/auth/verify-email?back=…`.
3. **Login (email):** Same SPA client → `signInWithPassword` → redirect to `/client-portal` or `/proveedor-portal`.
3a. **Login (Google):** `signInWithOAuth({ provider: 'google', options: { redirectTo: ...origin/api/auth/callback?next=...} })` → Supabase → Google consent → `/api/auth/callback` exchanges code → redirect to `next`. New users get DB trigger default role `cliente`. Button lives in `src/components/Auth/GoogleSignInButton.tsx` and appears on the clientes login page only.
4. **Session refresh:** `src/lib/supabase/middleware.ts` runs on portal matchers; unauthenticated users redirect to the correct login route.
5. **Logout:** `SassClient.logout(redirectTo?)` — client portal button uses default cliente login; proveedor button passes proveedor login URL.

## Schema / Data

Canonical table list, ER view, RLS intent, and trigger notes: **[[DATABASE]]**.

Auth-specific behaviour: signup writes `user_metadata` (including `role`); `/api/auth/callback` may upsert `profiles.role` for OAuth role overrides; session and redirect logic use `profiles.role` after Google sign-in.

## Dependencies

- `src/lib/supabase/client.ts`, `server.ts`, `unified.ts` (`SassClient`)
- [[features/client-portal|client portal]], [[features/proveedor-portal|proveedor portal]]
- [[ARCHITECTURE]] — exact route list and file tree

## Failure Cases

- **Wrong portal:** User with `proveedor` role can still hit `/client-portal` if only session is checked — add explicit role checks when hardening.
- **Email not confirmed:** Login error until user completes verification (Supabase setting).
- **Prerender:** Pages using `useSearchParams` must use `<Suspense>` (forgot-password, verify-email).

## Google OAuth — Setup Checklist (one-time)

1. **Google Cloud Console** — Create OAuth 2.0 Web client; add Supabase's callback URI as an Authorized redirect URI:  
   `https://<project-ref>.supabase.co/auth/v1/callback`
2. **Supabase Dashboard** → Auth → Providers → Google: enable, paste Client ID + Secret.
3. **Supabase Dashboard** → Auth → URL configuration → Redirect URLs: allow  
   `https://www.floressiberianas.com/api/auth/callback` (and `http://localhost:3000/api/auth/callback` for dev).
4. No new env vars needed in Next.js — credentials stay in Supabase.

## Key Decisions

- **One Supabase project, one `auth.users` pool** — roles in `public.profiles`, not separate projects.
- **Trigger reads `raw_user_meta_data` once at insert** for `role`; ongoing authorization should use `profiles`, not editable JWT user_metadata for security-sensitive rules.

## Links

- [[DATABASE]] — `auth.*` + `public.profiles` / `clientes` / `proveedores`
- [[ARCHITECTURE]] — routes, middleware, Supabase client files
- [[SCHEMA]] — wiki maintenance and post-ship checklist
- [[OVERVIEW]] — env vars and high-level route list
- [[logs/session-2026-04-26]]
