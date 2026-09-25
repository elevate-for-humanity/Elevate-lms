# Elevate Production Hardening Ledger

Updated: 2026-09-25

This is the canonical completion ledger for the Elevate production platform.
No item is complete because code was written, a migration exists, or a build started.
An item is VERIFIED_PRODUCTION only after its database, API, UI/workflow, automation, test,
deployment, and live verification requirements pass.

## States

- NOT_STARTED
- IN_PROGRESS
- BLOCKED: exact blocker
- VERIFIED_PRODUCTION

## Dependency order

| # | System | State | Production acceptance |
|---|---|---|---|
| 1 | Canonical repository / release authority | IN_PROGRESS | main is sole production source; CI + exact SHA deployment + rollback path |
| 2 | Database relationship integrity | IN_PROGRESS | active entity graph has intentional FKs/RLS; no new orphan writes |
| 3 | AI/autopilot control plane | IN_PROGRESS | all agents healthy; one dependency-aware orchestrator; internal owned AI/browser/engineering work; paid providers opt-in |
| 4 | Dev Studio runtime | IN_PROGRESS | files + terminal + browser + internal engineering + CI + governed deploy work end-to-end |
| 5 | Course Builder lesson contract | IN_PROGRESS | one Barber credential lesson completes content→media→QA→learner completion with no manual DB repair |
| 6 | Course-level credential completion | NOT_STARTED | all lessons + module assessments + final/practice exam + progression + accessibility + learner preview pass |
| 7 | Certificate / badge issuance | NOT_STARTED | verified completion automatically creates certificate/badge eligibility + verification record |
| 8 | Role/scope dashboard framework | NOT_STARTED | fresh role account receives correct reusable dashboard with no user-specific code |
| 9 | Communications | NOT_STARTED | shared email/phone/video/screen-share/notifications work from every eligible role |
| 10 | Billing / payments | IN_PROGRESS | Admin billing schedule + QuickBooks/provider-neutral fulfillment + approved financing; no active Stripe runtime authority |
| 11 | Career pipeline | IN_PROGRESS | O*NET + USAJobs + CareerOneStop ingest and surface live data; external outage degrades safely |
| 12 | Deployment / disaster recovery | IN_PROGRESS | Admin/LMS/Marketing exact SHA, health, rollback, last-known-good |
| 13 | Fresh-user E2E suite | NOT_STARTED | Apprentice, Host Shop, Program Holder, Site Coordinator, Staff/Admin, Employer pass from provisioning through core workflow |
| 14 | Production acceptance | NOT_STARTED | no unresolved critical/high blockers and all live service acceptance checks pass |

## Non-negotiable architecture rules

1. One source of truth per business capability.
2. Fix shared role/template/service contracts, never named-user special cases.
3. DATABASE -> API -> BUSINESS LOGIC -> UI -> AUTOMATION -> E2E -> DEPLOY -> LIVE VERIFY.
4. No duplicate queue, route, table, course, dashboard, payment authority, or completion contract.
5. Paid AI/engineering providers are explicit opt-in; Elevate-owned runtime is the default.
6. Production mutations retain human approval where required: deploy, direct main push, destructive migration,
   payout, bulk communication, credential issuance when policy requires it.
7. Historical failures remain audit evidence; they do not define current agent health.
8. If acceptance needs a manual Supabase repair, the feature is not complete.

## Current verified structural work

- Canonical credential lesson/media atomicity enforced in production DB.
- Credential lesson cannot complete before approved primary media.
- Course Builder strict contract/readiness consolidation is underway.
- Backward temporal replay media-quality detection added.
- Supabase-owned video-worker wake scheduled every minute.
- Active platform foreign-key hardening applied; legacy-orphan relationships protected with NOT VALID constraints.
- AI agent health reconciler runs every minute; historical failed tasks no longer leave agents permanently in error.
- Dependency-aware agentic executor supports platform_hardening delegation.
- Elevate-owned browser planning no longer requires the paid-inference authorization boundary.
- Elevate-owned AI requests with providerPolicy=owned-only bypass paid inference authorization.
- Internal branch-based Studio engineering executor added; generic engineering defaults to it.
- CI and full-production deploy tools dispatch canonical GitHub Actions workflows in-process.
- Dead duplicate buildCourses tool removed.
- Admin/full deployment payment environment is being migrated away from Stripe runtime authority.
- Career sources are registered and Admin importer path for USAJobs/CareerOneStop/O*NET is implemented.

## Immediate acceptance sequence

1. CI/typecheck internal engineering + autopilot control-plane changes.
2. Deploy Admin exact SHA and verify /api/ping, /api/ready, /api/health, /api/version.
3. Verify Dev Studio health reports owned AI + GitHub + browser runtime.
4. Execute one read-only internal AI task.
5. Execute one internal engineering task that opens a branch/PR without OpenHands.
6. Run canonical CI through workflows.runTests and verify run evidence.
7. Resume Barber proof lesson/video and pass strict lesson completion.
8. Build remaining Barber lessons only after proof acceptance.
9. Fresh-user role dashboard tests.
10. Full-platform acceptance and freeze production baseline.
