# Dead Code Candidates

Generated: 2026-03-27  
Auditor: Ona

Files are listed with usage count (number of files importing them), reason, and recommended action. No files are deleted until this report is reviewed.

---

## Rate Limiting — Dead Files

| Path | Type | Importers | Reason | Action |
|------|------|-----------|--------|--------|
| `lib/rateLimiter.ts` | file | 0 | Uses `redis` npm client (not Upstash). Different interface from canonical. `@deprecated` not marked but functionally dead. | **Delete** |
| `lib/api/rate-limiter.ts` | file | 0 | In-memory Map implementation. No importers. | **Delete** |
| `lib/rateLimit.ts` | file | 11 | In-memory, `@deprecated` JSDoc. Broken in serverless. 11 routes still import it — must migrate first. | **Migrate importers, then delete** |

---

## Supabase Shims — Dead After Migration

| Path | Type | Importers | Reason | Action |
|------|------|-----------|--------|--------|
| `lib/supabaseServer.ts` | file | ~20 | Deprecated shim. Canonical: `lib/supabase/server.ts` | Migrate importers, then delete |
| `lib/supabase-server.ts` | file | ~15 | Deprecated shim. Canonical: `lib/supabase/server.ts` | Migrate importers, then delete |
| `lib/supabaseAdmin.ts` | file | ~10 | Deprecated shim. Canonical: `lib/supabase/admin.ts` | Migrate importers, then delete |
| `lib/supabase-admin.ts` | file | ~10 | Deprecated shim. Canonical: `lib/supabase/admin.ts` | Migrate importers, then delete |
| `lib/supabaseClient.ts` | file | ~5 | Deprecated shim. Canonical: `lib/supabase/client.ts` | Migrate importers, then delete |
| `lib/supabaseClients.ts` | file | ~5 | Deprecated shim. Canonical: `lib/supabase/client.ts` | Migrate importers, then delete |
| `lib/supabase.ts` | file | ~5 | Deprecated shim | Migrate importers, then delete |
| `lib/supabase-lazy.ts` | file | ~3 | Deprecated shim | Migrate importers, then delete |
| `lib/supabase-api.ts` | file | ~3 | Deprecated shim | Migrate importers, then delete |
| `lib/getSupabaseServerClient.ts` | file | ~2 | Deprecated shim | Migrate importers, then delete |

**Note:** 78 total importers across all shims. Full migration is a large task. Phase 12 migrates the LMS-critical paths. Full shim elimination is tracked as remaining debt.

---

## API Error Handling — Dead Files

| Path | Type | Importers | Reason | Action |
|------|------|-----------|--------|--------|
| `lib/safe-error.ts` | file | 0 | Root-level duplicate of `lib/api/safe-error.ts`. No importers. | **Delete** |

---

## Auth — Deprecated Files

| Path | Type | Importers | Reason | Action |
|------|------|-----------|--------|--------|
| `lib/auth-server.ts` | file | ~5 | `@deprecated` JSDoc. Canonical: `lib/auth.ts` | Verify importers, migrate, delete |
| `lib/authAdapter.ts` | file | ~3 | `@deprecated` JSDoc | Verify importers, migrate, delete |
| `lib/auth-guard.ts` | file | 2 | Uses `createServerSupabaseClient` from `lib/auth.ts` — wraps it. Canonical: `lib/admin/guards.ts` | Migrate 2 importers, delete |

**Note:** `lib/authGuards.ts` has 33 importers and uses `lib/supabase/server.ts` (canonical). It is NOT dead — it is an active auth helper used by admin routes. Keep.

---

## Blueprint — Unregistered / Superseded

| Path | Type | Importers | Reason | Action |
|------|------|-----------|--------|--------|
| `lib/curriculum/blueprints/hvac-epa-608.ts` | file | 0 | Not registered in `lib/curriculum/blueprints/index.ts`. Cannot be used by generator. | **Register in index.ts** (not delete — it's valid content) |
| `lib/curriculum/blueprints/prs.ts` | file | 0 | Older PRS blueprint. `prs-indiana.ts` is the registered version. Both define the same credential. | Verify content matches `prs-indiana.ts`, then delete if superseded |

---

## Duplicate Routes

| Path | Type | Callers | Reason | Action |
|------|------|---------|--------|--------|
| `app/api/auth/login/route.ts` | route | Unknown | Duplicate of `/api/auth/signin`. Uses deprecated `lib/rateLimit`. | Add deprecation comment + 308 redirect to `/api/auth/signin`, then delete after confirming no callers |

---

## Hardcoded Program Pages (Legacy)

| Path | Type | Reason | Action |
|------|------|--------|--------|
| `app/courses/hvac/module1/lesson1/page.tsx` | page | Standalone HVAC lesson. Not part of LMS engine. Imports `@/courses/hvac/module1/quiz1`. | Mark legacy with comment. Do not link from LMS nav. |
| `app/lms/(app)/courses/healthcare-fundamentals/page.tsx` | page | Static marketing page inside LMS route group. Not DB-driven. | Mark legacy with comment |
| `app/store/courses/hvac-technician-course-license/page.tsx` | page | Hardcoded Supabase video URL. Store page only. | Keep — store page, not LMS |

---

## Logging — Duplicate

| Path | Type | Importers | Reason | Action |
|------|------|-----------|--------|--------|
| `lib/logging/logger.ts` | file | 0 | Separate logger in `lib/logging/`. Canonical logger is `lib/logger.ts`. | **Delete** |

---

## LMS — Legacy Completion Page

| Path | Type | Reason | Action |
|------|------|--------|--------|
| `app/lms/(app)/courses/[courseId]/complete/page.tsx` | page | Pre-dates certification end-state. Learners should land on `/certification`. | Add redirect to `/lms/courses/[courseId]/certification`. Keep file for backward compat. |

---

## Summary

| Action | Count |
|--------|-------|
| Delete immediately (0 importers) | 4 files: `lib/rateLimiter.ts`, `lib/api/rate-limiter.ts`, `lib/safe-error.ts`, `lib/logging/logger.ts` |
| Migrate importers then delete | `lib/rateLimit.ts` (11 importers), `lib/auth-guard.ts` (2 importers), deprecated Supabase shims (78 importers total) |
| Register (not delete) | `lib/curriculum/blueprints/hvac-epa-608.ts` |
| Verify then delete | `lib/curriculum/blueprints/prs.ts` |
| Mark legacy with comment | `app/courses/hvac/module1/lesson1/page.tsx`, `app/lms/(app)/courses/healthcare-fundamentals/page.tsx` |
| Add redirect | `app/lms/(app)/courses/[courseId]/complete/page.tsx`, `app/api/auth/login/route.ts` |
