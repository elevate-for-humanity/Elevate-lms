# Apprentice dashboard source and data audit — 27 October 2026

Base: `329b498e4167d38ebc65a3409b4c74b455026f4a`.

Scope includes the canonical `/apprentice` dashboard and bookmark alias; billing, documents/uploads, handbook, hours, orientation, policies, practical progress, RTI, skills/competencies, state-board checklist, timeclock, transfer requests, workbook, analytics/profile/navigation; the seven historical trade dashboards and their shared loaders; related competency, transfer and timeclock APIs. Attendance, timeclock history and old hours-log routes remain intentional canonical redirects. Historical trade dashboards retain their existing configurations. No program standard, enrollment approval, payment authorization, learner record, lease or production secret was fabricated or bypassed.

## Confirmed repairs

| Source | Failure | Result |
|---|---|---|
| `lib/apprenticeship/load-apprenticeship-dashboard.ts` | Dashboard GET updated enrollment/access and reset completed LMS progress/activity | Rendering is read-only; onboarding owns transitions |
| `lib/portal/load-apprentice-portal.ts` | Queries nonexistent `apprentices.student_id`; treats claimed transfers as credited | Uses actual apprentice identity; only verified transfers reduce remaining hours; lookup errors propagate |
| `lib/apprenticeship/progress-service.ts` | First-page totals; RTI counted as OJL; accepted zero falls back to claim | All pages, separate buckets, explicit zero preserved |
| `lib/hours/get-approved-hours.ts` | First-page totals, accepted-zero fallback, failed query displayed as zero | Paginated reads, explicit zero, visible failures |
| `lib/apprenticeship/published-lesson-progress.ts` | Workbook/dashboard count unpublished or duplicate completed lessons; failures display fresh zero | Published-ID intersection, unique completion, all pages, failed reads propagate |
| `/apprentice/hours` | Sums every program against latest enrollment; date-only values shift with timezone | Program-scoped full ledger; UTC-safe date display |
| `/apprentice/rti` | Category totals computed from only latest 100 entries | Full ledger for totals; recent history remains bounded |
| `/apprentice/skills` | Legacy joined table has no apprentice/skill identity columns in live schema | Renders canonical enrollment-scoped competency checklist |
| `/api/apprentice/appendix-a-progress` | Ignores `student_id` enrollment identity and confirmed enrollments | Same identity/status contract as canonical dashboard |
| `/apprentice/orientation` | Acknowledgement unconditionally activates enrollment and grants access | Records acknowledgement on eligible owned enrollment only; zero updated rows is failure |
| `/apprentice/state-board` | Cross-program/RTI hours and unverified transfers count; skills flag omitted | Scope/buckets/verified transfers fixed; all recorded checklist flags required; final eligibility left to sponsor/agency |
| `/apprentice/timeclock` | Read-only preview starts GPS heartbeats and offers lunch/clock-out; server-closed shift stays open | Preview does not mutate or request GPS; authoritative closure restores UI |
| `/api/timeclock/heartbeat` | Invalid GPS accepted; failed RPC reported successful; pre-close snapshot returned | Valid numeric coordinates, service failure returned, final shift reloaded |
| `/api/timeclock/context` | Accepted-zero fallback, cross-program totals, lookup failure can enable clocking, null coordinates look valid | Scoped full OJL ledger; active enrollment required; failed prerequisites block; coordinates validated |
| `/apprentice/billing` | Non-subscription disciplines and missing subscription hide invoices; preview offers payment link | Invoice ledger visible on each branch; learner payment action hidden in preview |
| `/apprentice/documents`, dashboard | Database failure becomes missing/complete/zero evidence | Query failure propagates to retryable error boundary |
| `/apprentice/practical-progress` | Displays actor instead of preview subject; includes unverified services as verified; truncates totals | Scoped selected enrollment; verified nonvoid entries; all pages |
| `/apprentice/policies/*` | Preview shows actor acceptance and actionable signature | Selected learner acceptance; explicit read-only preview |
| `/apprentice/handbook` | Other occupations show barber title/course; missing contract crashes | Correct occupation/RTI destination; missing approved standard disclosed without invented requirements |
| `/apprentice/transfer-hours/request` | Start-request CTA loops back without a form | Actual evidence submission using owned eligible enrollment |
| `/apprentice/transfer-hours` | Dashboard reads different table than submission API; legacy approved field wrong | Both current and historical request ledgers remain visible; no approval is awarded by submission |
| `/api/apprentice/transfer-hours` | Legacy-only identity, malformed amounts, failed pending lookup proceeds | Dual identity, eligible status, finite amount, pending lookup fails closed |
| Canonical dashboard | All-time OJL labeled weekly | Accurate “Approved OJL to date” label |

## Verification

Live schema was read on the primary Elevate project only. It confirms missing historical skill-progress identity fields, actual competency/transfer request fields and the timeclock source columns. Read-only database inspection; no real learner/payment/hour data changed.

Focused tests cover >1,000 rows, explicit accepted zero, OJL/RTI separation, transfer verification, unpublished/duplicate completion, later-page failure, completed progress preservation, selected preview identity, orientation access preservation, closed-shift reconciliation, RPC/GPS failure, read-only preview and actual transfer form submission. Source ESLint and diff whitespace checks are run. Full TypeScript/build/CI results must be recorded separately when completed; a waiting check is not a pass.

Every changed source line, including comments and blank lines, is recorded with old/new line numbers and exact content in `apprentice-dashboard-line-review-2026-10-27.jsonl.gz`. `apprentice-dashboard-side-by-side-2026-10-27.txt.gz` contains full-width `diff -y` comparisons. The classifications describe intentional final repairs, not production acceptance.

## Remaining acceptance

Authenticated mobile/desktop sessions for each discipline, real evidence-upload and transfer review, PayPal/QuickBooks provider completion, real GPS attendance and supervisor sign-off still require live acceptance after deployment. Missing approved program standards must be supplied by the authorized sponsor. Source review and mocked regressions do not establish production readiness or approve a learner for licensing.

## Other requested work

The Indiana Cosmetology course build was observed running with a valid renewing lease/heartbeat and narration underway; no duplicate job was created. This is not evidence that the course is fully published.

There were 32 open PRs at inventory. PRs #1826, #1870, #1874, #1892, #1895, #2150 and #2174 were reconciled onto current main and fresh protected CI requested, with automatic merge enabled. Most other PRs have source conflicts; #1826 duplicates a homepage fix already on main, and #2174 overlaps the ownership/communications repairs already merged as #2173. They must not be reported as all merged while conflict/check work remains.
