# Partner Portal Reality Check

Date: 2026-02-14

## Access Control Chain — PRODUCTION-REAL

| Check | Enforced | File:Line |
|---|---|---|
| Authenticated user | YES | `lib/partner/access.ts:24` — `auth.getUser()` |
| profile.role in PARTNER_ROLES | YES | `lib/partner/access.ts:35` — `PARTNER_ROLES.has(profileRole)` |
| shop_staff membership | YES | `lib/partner/access.ts:41-55` — query requires rows |
| shop_staff.active = true | YES (with fallback) | `lib/partner/access.ts:44` — `.eq('active', true)` with fallback if column missing |
| shops.active = true | YES | `lib/partner/access.ts:45/55` — `!inner` join |

## Data Scoping — PRODUCTION-REAL

| Query | Source | Scoping Method |
|---|---|---|
| Student IDs | `lib/partner/students.ts:43` | `apprentice_placements.shop_id IN shopIds` |
| Student training | `lib/partner/students.ts:64` | placements → profiles → enrollments → certificates |
| Dashboard stats | `lib/partner/students.ts:173` | `getPartnerStudentIds(shopIds)` → aggregate |
| CSV export | `app/api/partner/exports/completions/route.ts` | `getPartnerStudentsWithTraining(shopIds)` |

All shop IDs derived from `getMyPartnerContext()` — never from client params.

## Metrics — LIVE, NOT HARDCODED

- Dashboard: `getPartnerDashboardStats()` at `dashboard/page.tsx:29` — fresh query per load
- Students: `getPartnerStudentsWithTraining()` at `students/page.tsx:27` — fresh query per load
- No caching layer, no materialized views, no cron jobs

## CSV Export — GRANT-REPORT GRADE

Columns: Student Name, Email, Location, Placement Start, Course, Progress %, Status, Enrollment Date, Completion Date, Credential ID, Total Certificates

- Dates: ISO 8601 (YYYY-MM-DD)
- Credential ID: `certificate_number` from certificates table
- Audit logging: `logExportAudit()` → `partner_export_logs` table (fire-and-forget)
- No internal IDs leaked

## Reconciliation Test: 35/35 PASSED
`scripts/test-partner-csv-reconciliation.ts` — permanent fixture

## Gaps (honest)

| Gap | Impact |
|---|---|
| Visibility is placement-bound only | Partners can't see sponsored/referred learners without placements |
| No partner enrollment capability | Observe-only portal |
| No cohort/program filtering | Can't filter by funding source |
| No seat hours / time-on-task | Not tracked in schema |
| 0 placements in production DB | Portal will show empty until real placements exist |

## Verdict: PRODUCTION-REAL for observe + export. NOT operational for program management.
