# Full Repository Census — 2026-08-08

Repository: `elevate-for-humanity/Elevate-lms`

This census is the controlling ledger for the full repository audit requested against live production. It is intentionally separate from historical audit reports. Every active runtime surface must be classified as one of: `CANONICAL`, `MERGE`, `MIGRATE CALLERS`, `REDIRECT`, `DELETE`, `BROKEN`, `UNIMPLEMENTED`, or `ARCHIVE/HISTORICAL`.

## Production application ownership

- `apps/marketing`: canonical public website and designated Marketing-host portals defined by `lib/routing/portal-map.ts`.
- `apps/lms`: canonical learner, apprentice, employer, host-shop, partner, workforce and LMS runtime.
- `apps/admin`: canonical staff, instructor, admin, Studio and Course Builder runtime.

## Confirmed remediations already completed

- Legacy `/api/apply` removed; canonical student application API is `/api/applications`.
- Deprecated `/api/enrollments/checkout` removed in favor of canonical partner-course checkout ownership.
- Legacy `/api/stripe/webhook` removed in favor of the canonical Stripe webhook handler.
- Legacy `/dev-studio` route removed; Admin Studio canonical route is `/studio`.
- Duplicate nested `/admin/course-builder` route removed; `/course-builder` owns the real implementation.
- Unused legacy Supabase client shim removed.
- Unused tax-platform RBAC module removed.
- Active LMS `super_admin` privilege drift retired; production role data reconciled to `admin`.
- Barber apprenticeship public runtime values moved toward RAPIDS-backed SSOT.
- Marketing/LMS/Admin deployment health contracts use port 3000, `/api/ping` liveness and `/api/health` readiness.

## Current critical production gaps

- Marketing deployment previously allowed service configuration drift and could expose `503 no healthy upstream` during replacement. The current closure branch enforces strict `maxSurge=1, maxUnavailable=0` and refuses a Marketing deployment if Northflank rejects that contract.
- Marketing recovery previously deadlocked when the existing upstream was already unhealthy. The current closure branch records predeploy health but permits recovery deployment.
- Marketing header previously forced full desktop navigation at widths too narrow for all controls. The current closure branch uses mobile drawer below `lg`, compact desktop menu from `lg` to `xl`, and full horizontal navigation at `xl+`.

## Remaining census work

The following trees still require file-by-file classification and caller verification before deletion or consolidation:

- `apps/marketing/app/**`
- `apps/lms/app/**`
- `apps/admin/app/**`
- root/runtime `components/**`
- root/runtime `lib/**`
- `packages/**`
- `.github/workflows/**`
- `scripts/**`
- `supabase/migrations/**`
- active `supabase/seeds/**`
- root-era application trees and compatibility artifacts
- generated artifacts that are imported by runtime code
- historical audit/report/archive files that should be excluded from runtime reasoning but retained or archived as records

## Completion rule

The audit is not complete until every active file or route has an owner, every duplicate has a caller migration/disposition, every canonical route is wired to its API/database/auth path, and the deployed SHA passes live route and authenticated E2E verification.