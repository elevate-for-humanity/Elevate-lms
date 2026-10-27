# Elevate LMS Capability Audit

Date: 2026-09-22

Repository: `elevate-for-humanity/Elevate-lms`
Audited branch baseline: `main` at `7f7642deb17695545e90efbb0f264fee13deb38c`

## Executive verdict

Elevate LMS is a large multi-application workforce platform, not a single LMS. It contains a public marketing application, an Admin/Studio control plane, a learner LMS, a canonical Supabase/Postgres data platform, course-generation and media pipelines, payments, communications, apprenticeship workflows, and numerous program-specific surfaces.

The system is materially built, but it is not accurate to call every Admin page or Studio control production-complete. The repository contains many route surfaces, redirects, compatibility layers, and partially connected tools. The largest immediate correctness issue is a published Indiana Peer Recovery Specialist final exam that still contains placeholder questions in the live database.

This change set closes the Course Builder assessment-authoring, atomic-persistence, publish-validation, automatic-acceptance, and container-capability gaps. It does not fabricate regulated exam content or pretend that a configuration editor provisions an interactive container.

## System inventory

| Area | Observed state | What it means |
| --- | ---: | --- |
| Applications | Marketing, Admin, LMS | Separate public, operator, and learner experiences |
| Admin pages | 470 page routes | Broad operational surface; route count is not proof every workflow is complete |
| Admin APIs | 610 route files | Large server/API surface with both canonical and compatibility endpoints |
| Admin redirects | 115 | Significant routing history and consolidation work |
| Admin pages with placeholder/stub language | 59 files | Requires continued page-by-page product verification |
| Canonical DB | Supabase project `elevate` | Repository is wired to project ref `cuxzzpsyufcewtmicszk` |
| Public tables | 1,719 | Very broad schema |
| RLS | Enabled on all 1,719 public tables | Baseline row-security coverage exists |
| Policies | 7,630 | High policy complexity and maintenance risk |
| Courses | 126 | 2 published, 102 draft, 22 archived |
| Course content | 412 modules / 1,046 lessons | Substantial persisted curriculum inventory |
| Canonical assessment rows | 385 | `assessment_questions` is the relational authority |
| Studio runs | 9 | 1 completed, 5 failed, 3 blocked |
| Dev container sessions | 0 | No evidence of interactive workspace provisioning |
| AI deployments | 0 | No evidence of Studio-created AI deployments |

Counts are a live database snapshot taken on 2026-09-22.

## What the overall system can do

- Serve separate marketing, Admin, and learner applications.
- Persist courses, modules, lessons, assessments, programs, enrollments, apprenticeship evidence, payments, communications, media jobs, and Studio operations in Supabase.
- Generate and normalize course content through configurable AI providers.
- Run a deterministic, versioned Course Builder publication gate and record automated approval evidence.
- Publish persisted courses through the canonical course service when every enforced gate passes.
- Keep human instructor/supervisor sign-off for learner practical competency evidence without requiring human review of generated course content.
- Queue and track course media jobs, manage secrets, and connect build/deployment control surfaces.
- Enforce a large RLS/policy estate across the public database schema.

## What the overall system cannot honestly claim yet

- It cannot claim every Admin or Studio page is complete merely because the route exists.
- It cannot claim a fully working browser-based development container. The observed container surface edits configuration and deployment environment data; it does not provision a workspace or interactive session.
- It cannot claim all persisted courses are learner-ready. Only two courses are published, and one published final exam contains placeholder content.
- It cannot claim Studio reliability from the current run history: eight of nine observed runs are failed or blocked.
- It cannot claim schema simplicity or low operational risk. The number of tables and policies creates substantial drift, overlap, and regression risk.
- It cannot safely auto-correct regulated exam content without an authoritative source/test plan and successful generated-question validation.

## Admin dashboard

### Can do

- Expose a broad set of operational areas for learners, applications, courses, programs, payments, testing, employees, CRM, apprenticeships, employers, store operations, reports, communications, and Studio tools.
- Call authenticated Admin APIs and service-role database paths.
- Edit canonical course structures and open the unified Course Studio.
- Run persisted course audits and publish through the Course Builder authority.
- Manage DevContainer configuration and masked platform environment keys.

### Cannot yet prove

- That all 470 page routes are complete, database-backed workflows.
- That every link and redirect represents one canonical workflow.
- That all 59 pages containing stub/placeholder language are production-ready.
- That all dashboard actions have end-to-end production evidence. A page, button, or API route is not the same as a verified operational workflow.

## DB Studio / container surface

### Can do

- Read `.devcontainer/devcontainer.json` from the configured GitHub repository.
- Validate JSON/JSONC edits and commit configuration changes to GitHub.
- List masked canonical environment keys.
- Add, rotate, delete, and synchronize supported environment keys to Northflank services.
- Display build/deployment service information through the adjacent Services surface.

### Cannot do

- Provision an isolated cloud development workspace.
- Start, stop, attach to, or execute a shell inside an interactive container session.
- Provide terminal, filesystem, port-forwarding, or per-user workspace lifecycle guarantees.
- Claim runtime provisioning based on the current database: `dev_container_sessions` has no rows.

The API now reports `canProvisionWorkspace: false` and `canStartInteractiveSession: false`, and the UI states this limitation directly.

## Quiz / assessment builder

### Can do after this change

- Generate original multiple-choice and true/false questions through the configured AI provider.
- Let an administrator add, edit, remove, and save questions manually.
- Edit the assessment passing score.
- Resolve answer text, answer indexes, and true/false values into one canonical representation.
- Inherit lesson/module domain and competency mappings when an editor does not repeat them.
- Replace relational assessment rows, learner-facing quiz JSON, and the passing score in one locked database transaction.
- Return generated questions immediately to Course Studio instead of reporting only a count.
- Reject placeholder/TODO/TBD questions during persistence and publication.
- Block publication for incomplete options, duplicate options, invalid answers, missing rationale, unsupported question types, and missing standards/competency mapping.
- Store the learner projection in the shape the LMS actually consumes: `question`, `options`, and a zero-based numeric `correctAnswer`.

### Cannot do

- Generate a defensible regulated final exam when no authoritative standard or test-plan context is available.
- Publish short-answer or free-response questions through the current auto-scored learner quiz path.
- Make the existing published placeholder exam valid without regenerating or authoring real questions.
- Guarantee AI question quality from schema validation alone; deterministic checks establish structure, mappings, and absence of known placeholders, not subject-matter truth.

## Course Builder review policy

Course Builder course-content publication no longer requires a human review step. The primary Publish panel now relies on the persisted automated quality gate and versioned `course_automated_approvals` evidence. Manual review endpoints remain available for administrative exception handling, but they do not block publication.

This does not remove authorized human sign-off from learner practical evidence. A generated course may define a practical task automatically; the platform must not impersonate the instructor or supervisor who observed a learner performing it.

## Apprentice payment automation

### Can do after this change

- Treat the Admin billing schedule as the subscription authority, PayPal as the recurring collection provider, and QuickBooks as the accounting ledger.
- Create a PayPal product, recurring plan, and subscriber approval link from an approved Admin schedule.
- Let PayPal collect an approved weekly subscription automatically without requiring the apprentice to open and pay a QuickBooks invoice.
- Verify PayPal webhook signatures, deduplicate provider events, reconcile PayPal transactions weekly, and record confirmed payments against matching QuickBooks invoices.
- Prevent an automatic schedule from becoming active unless both the recurring-tuition authorization and the PayPal subscription are active.
- Keep legacy manual invoices isolated to schedules explicitly configured with `collection_mode = 'manual_invoice'`.

### Cannot do or bypass

- It cannot debit a learner merely because a general apprenticeship agreement exists. The release must be classified and approved for recurring tuition collection.
- It cannot activate PayPal recurring billing before the PayPal subscriber approves the billing agreement. A signed internal release and a provider billing agreement are separate controls.
- It cannot truthfully report this week's four payments as collected while all four schedules remain paused and have no active PayPal subscription.
- It cannot verify incoming PayPal webhooks until `PAYPAL_BILLING_WEBHOOK_ID` is configured. The weekly authenticated reconciliation path remains the recovery mechanism after deployment.

### Live state at audit close

- Four apprentice schedules are paused, configured for automatic PayPal collection, and total $345.00 per weekly cycle.
- All four recurring-tuition authorization records remain `requested`; zero are approved.
- Zero PayPal subscription agreements are active.
- Therefore no payment was withdrawn during this audit. This is an authorization/provider-agreement blocker, not a scheduler or invoice-generation blocker.

## Legacy 83 billing cadence

`Legacy 83 Business Inc.` is recorded as a non-apprentice monthly account due on the 15th. It is excluded from the weekly apprentice collection job. Its account remains `configuration_required` because no amount or executable provider agreement was present; the cadence record does not invent either value. With September 15, 2026 already elapsed, the next due date is October 15, 2026.

## Live critical blocker

The published lesson `fa773c0d-07a3-4eff-9f62-d145a3afde6a` in course `c16122cd-d294-42c0-8a11-422229e7414d` is titled **Indiana Peer Recovery Specialist — Final Exam**.

- 50 canonical `assessment_questions` rows contain placeholder text.
- The published learner projection contains 38 placeholder questions.
- This change prevents the course from passing the updated publication gate again.
- The live course was not silently rewritten or unpublished during this audit because valid replacement questions require authoritative curriculum context and unpublishing is an operational decision that can affect enrolled learners.

Required operational resolution: regenerate or author the full exam against the authoritative Indiana Peer Recovery Specialist standard, validate every question, atomically replace both representations, and re-run the persisted publication gate. If that cannot happen immediately, unpublish the affected course/lesson before further learner use.

## Changes implemented

1. Added canonical manual assessment normalization and authoring.
2. Added an atomic service-role-only Postgres replacement function.
3. Corrected JSONB writes so arrays and answers are stored as native JSON rather than double-encoded strings.
4. Returned learner-ready questions from the AI hydration endpoint.
5. Added structural and placeholder checks to the persisted publication gate.
6. Corrected the learner quiz projection to match the LMS runtime contract.
7. Removed human course-content review controls from the primary Course Builder publish path.
8. Kept practical learner evidence sign-off intact.
9. Made Studio container capabilities explicit and truthful.
10. Added PayPal recurring apprentice collection, verified webhooks, weekly reconciliation, and QuickBooks payment recording.
11. Added database-enforced recurring-payment authorization and provider-agreement gates.
12. Recorded Legacy 83's monthly 15th cadence separately from apprentice tuition.
13. Added focused regression and architecture tests.

## Verification evidence

| Check | Result |
| --- | --- |
| Full Vitest suite | 380 files; 2,817 passed, 5 skipped, 0 failed |
| Focused apprentice payment suite | 2 files, 7 tests passed |
| Admin, LMS, and Marketing TypeScript | Passed |
| Studio TypeScript | Passed |
| Changed-file ESLint | Passed with 0 errors |
| Workflow formatting / parse check | Passed |
| Migration discipline audit | Passed; 1,232 files, 0 issues |
| Admin production build | Compiled successfully; generated 140/140 static pages; final trace-collection session did not terminate cleanly |
| Live atomic RPC | Present in canonical Supabase project; service-role-only grants previously verified |
| Live payment migrations | Applied successfully; activation trigger and Legacy 83 cadence verified |

## Release assessment

The code change is suitable to commit and deploy after final repository review. The system as a whole is not yet eligible for an unqualified “production complete” label because the live published placeholder exam and the failed/blocked Studio-run history remain material operational findings.
