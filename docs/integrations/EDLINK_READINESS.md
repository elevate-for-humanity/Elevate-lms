# Intuit for Education / Edlink readiness

## Decision

Elevate must not be represented as Edlink-connected yet. The repository has the
canonical records needed for rostering, but it does not currently expose a
production OneRoster provider or active LTI 1.3 endpoints.

## Side-by-side architecture

| Capability | Edlink requirement | Elevate source | Gap |
| --- | --- | --- | --- |
| Organizations | Stable school/district identity | Platform and tenant configuration | Publish an approved sourced ID |
| Users | Stable IDs, roles, names, emails | `profiles` and Supabase Auth | Define least-privilege field mapping |
| Courses | Stable course identity | `courses` | Define sourced-ID and status rules |
| Classes | A scheduled offering of a course | Programs/cohorts need a canonical class projection | Add class projection; do not equate course with class |
| Enrollments | User-to-class relationship and role | `program_enrollments` | Map status and roles idempotently |
| Results | Assignment/line-item scores | Grade and progress domains | Keep disabled until roster sync is certified |
| LTI launch | OIDC initiation, signed launch, deployment | Only schema/docs remain active | Restore as an LMS-platform feature, then certify |
| Operations | Credentials, webhooks, retries, audit | General integration status only | Add Edlink connection and sync ledger |

## Required phases

1. Complete Intuit/Edlink administrator onboarding and record the provider type
   offered for Elevate.
2. If Elevate is not listed, obtain approval for a OneRoster 1.2 connection.
3. Define a canonical class/cohort projection and immutable sourced IDs.
4. Implement read-only organizations, users, courses, classes, and enrollments.
5. Add scoped credentials, signed-webhook verification, idempotency keys,
   reconciliation, retry limits, and an audit trail.
6. Validate in a sandbox with synthetic records.
7. Approve the exact FERPA data fields and purpose before enabling student data.
8. Add results/grade passback only after roster certification.

## Current safety posture

Outbound student-data sync is disabled. Environment variable names have been
reserved for Edlink credentials, but no secret is stored in the repository and
no connection is treated as active merely because a partial value exists.
