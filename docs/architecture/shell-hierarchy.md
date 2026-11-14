# Shell Hierarchy

## Canonical layout tree

```
app/layout.tsx                          ← root: fonts, metadata, inline suppression script
  └── PublicLayout                      ← marketing chrome (header + footer)
       ├── SafeSearchParamsProvider     ← mounted ONCE here, covers all routes
       ├── [marketing pages]            ← / /programs /about etc.
       ├── app/lms/layout.tsx           ← pass-through only (no providers, no shell)
       │    └── app/lms/(app)/layout.tsx ← auth guard + LmsAppShell (sidebar + nav)
       │         └── [LMS pages]
       ├── app/[portal]/layout.tsx      ← each portal has its own nav, no marketing chrome
       │    └── [portal pages]
       └── app/admin/[[...path]]/       ← catch-all redirect → admin.elevateforhumanity.org

apps/admin/                             ← separate Next.js app (admin subdomain)
  └── apps/admin/app/layout.tsx        ← admin root: fonts, metadata
       └── apps/admin/app/admin/layout.tsx ← super_admin guard + admin shell
            └── [admin pages]
```

## Marketing chrome suppression

The marketing header/footer is hidden on app routes via two mechanisms that
**must stay in sync**:

### 1. `components/layout/MarketingChromeGuard.tsx`
Client-side: hides chrome after hydration using `data-app-route` attribute.
Source of truth for the route list.

### 2. Inline script in `app/layout.tsx`
Server-side: sets `data-app-route` before hydration to prevent FOUC.
Must mirror `MarketingChromeGuard.tsx` exactly.

**When adding a new portal route:**
1. Add the prefix to `APP_ROUTE_PREFIXES` in `lib/layout/app-routes.ts` — this is the single source of truth
2. Both `MarketingChromeGuard` and the inline script in `app/layout.tsx` derive from it automatically
3. Add to `canonical-routes.md`

## Provider rules

| Provider | Mounted at | Notes |
|---|---|---|
| `SafeSearchParamsProvider` | `PublicLayout` | Once only — do NOT re-mount in child layouts |
| `ToasterClient` (react-hot-toast) | `app/layout.tsx` (main app) + `apps/admin/app/layout.tsx` (admin app) | One per app root — do NOT re-mount in portal or page layouts |
| Supabase client | Per-request via `lib/supabase/server.ts` | Never a React context provider |
| Auth state | Per-page via `getUser()` | No global auth context — use server components |

## Anti-patterns (confirmed historical bugs)

- ❌ `SafeSearchParamsProvider` in `app/lms/layout.tsx` — caused double Suspense boundary (fixed 2026-07-01)
- ❌ Marketing header on `/case-manager`, `/workforce-board`, `/admin-login` — missing from suppression lists (fixed 2026-07-01)
- ❌ No `<Toaster>` in admin app root — all `toast()` calls in admin pages were silent (fixed 2026-07-01)
- ❌ Hardcoded route list in `app/layout.tsx` inline script — diverged from `MarketingChromeGuard` (fixed 2026-07-01, now generated from `lib/layout/app-routes.ts`)
- ❌ `LmsAppShell` inside `AdminShell` — never do this; each shell is a full-page layout
