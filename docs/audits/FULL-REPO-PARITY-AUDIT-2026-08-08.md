# Full Repository Parity Audit — 2026-08-08

## Scope

Current `main` is the preservation baseline. May 2026 behavior/audit artifacts are donor references only. This audit covers Marketing, LMS, Admin, shared APIs/libraries, routes, auth, enrollment/application writes, payments, deployment, and legacy aliases.

## Safety rules

- Preserve newer working code.
- No blind rewrites.
- No deletion before behavior/caller parity is verified.
- Do not restore stale root-app architecture over the current Marketing/LMS/Admin split.
- Stop promotion when auth, application, enrollment, build, or deployment gates fail.

## Initial findings

| Area | Current finding | Classification | Required action |
|---|---|---|---|
| Learner routes | `/lms/dashboard` and `/learner/dashboard` are both classified canonical despite the registry promising one canonical URL | DRIFT | Map actual callers and choose one canonical destination before redirects/deletion |
| Supabase compatibility | `lib/supabaseClient.ts` returns `null`; real clients exist under `lib/supabase/*` | LEGACY / VERIFY CALLERS | Prove zero active imports, migrate any callers, then remove shim |
| Application boundary | Marketing `/api/applications` is a hardened canonical public submission boundary; `/api/apply` delegates to it | KEEP | Preserve and route compatible public forms through it |
| Student application client | Student form posts to `/api/applications` then retries `/api/apply`; it does not send an idempotency key | PARALLEL CLIENT PATH | Collapse to one canonical request and add an idempotency key while preserving draft recovery |
| Application schema | Canonical application route has three-tier insert fallback for environments missing newer columns | SCHEMA DRIFT / TEMPORARY KEEP | Verify migrations across production before simplifying fallback |
| Course enrollment | `/api/enrollments/create` is course-only and rejects program enrollment | KEEP BUT RENAME/DOCUMENT | Distinguish course enrollment from program enrollment in route contracts |
| Program enrollment | `/api/enrollments/create-enforced` validates completed intake and funding pathway | KEEP / VERIFY CALLERS | Verify live callers and full E2E program enrollment |
| LMS enrollment checkout | `/api/enrollments/checkout` is explicitly deprecated but retains its own Stripe + DB write path | PARALLEL LEGACY | Map callers, compare payment behavior, migrate callers, then retire |
| Write-path inventory | `scripts/unaudited-write-paths.json` contains many old root `app/api` writes and is stale for current 3-app architecture | STALE GOVERNANCE | Regenerate against current Marketing/LMS/Admin code |
| Duplicate audit | July duplicate audit lists many API/client/component duplicates but paths must be revalidated against current main | DONOR REFERENCE | Validate each item against active code before action |
| Dev Studio content ownership | Workspace registry sent both AI Studio and Content Studio to `/paris`, although `/studio/content` already exists and redirects to authenticated `/content` | FIXED ON AUDIT BRANCH | Content Studio now owns `/studio/content`; AI Studio remains `/paris` |
| Admin dashboard | Admin service `/` redirects to `/dashboard`; `/dashboard` renders live Supabase-backed Admin dashboard and exposes Dev Studio only to `admin` role | KEEP | Treat Admin `/dashboard` as current service-owned dashboard; verify external `/admin` proxy/domain behavior separately |

## Implemented fixes on audit branch

1. `lib/devstudio/workspace-registry.ts`: changed Content Studio route from `/paris` to `/studio/content`.
2. Verified `/studio/content` already exists and redirects to the authenticated `/content` Content Manager, so no duplicate page was added.
3. Closed stale PR #522 because it targets the removed `DevStudioUnifiedClient` architecture and would reintroduce superseded code.

## Audit waves

### Wave 1 — Applications and enrollment

1. Map every current form/API caller to `/api/applications`, `/api/apply`, enrollment-create, enrollment-enforced, and checkout paths.
2. Verify one canonical public application write boundary.
3. Verify program enrollment uses intake/funding enforcement.
4. Verify course-only enrollment remains distinct.
5. Identify and retire deprecated parallel payment/enrollment routes only after caller migration.

### Wave 2 — Auth and route ownership

1. Reconcile canonical route registry with actual Marketing/LMS/Admin ownership.
2. Eliminate multiple canonical labels for one persona flow.
3. Verify legacy aliases redirect one hop and preserve query/state.
4. Verify Admin routes resolve only on Admin ownership and LMS learner routes only on LMS ownership.

### Wave 3 — Shared libraries and clients

1. Supabase client/import graph.
2. Stripe client/price maps and checkout ownership.
3. Shared hooks/components/navigation duplicates.
4. Remove null compatibility shims only after zero-caller proof.

### Wave 4 — Admin / Dev Studio / Course Builder

1. Verify standalone `/studio/*` ownership in Admin.
2. Compare old Dev Studio unique behavior against current workspace implementation.
3. Verify Course Builder API ownership and remove old parallel APIs only after parity.

### Wave 5 — Deployment and production gates

1. Marketing/Admin/LMS builds.
2. Northflank service/Dockerfile ownership.
3. Health checks and zero-downtime rollout.
4. Release SHA identity.
5. Route/link/application/auth E2E gates.

## Promotion rule

Nothing moves to `main` from this audit branch until each changed surface has a verified canonical owner, caller parity, passing relevant tests/builds, and a rollback path.
