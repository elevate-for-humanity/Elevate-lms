# Apprentice dashboard follow-up and CI evidence

Source baseline: `17faa9e423dcfd315cfe97873802c52c8fe29804`.

## Record reconciliation

The prior audit incorrectly grouped two partner/owner identities with apprentices because both had legacy program_enrollments. Their canonical partner memberships, approved shop records and accepted partner_documents establish completed shop onboarding: six distinct accepted document types per shop, with file links. One shop has a duplicate EIN upload; it does not represent an additional requirement. Neither shop needs fabricated apprentice placements or duplicate document uploads. Gmail was searched for both verified shop addresses and attachments; the October 27 partner correspondence explicitly confirms approval. Existing accepted database evidence is the stronger source for upload completion. Files were not downloaded or visually re-reviewed in this pass.

The unrecognized apprentice identity predates this audit: its profile was created May 26 and its barber enrollment May 27 through the enrollment RPC, without an invariant violation or allowlist bypass. A May 27 TextFree notification contains its account email, and later sent apprentice notices address that identity. No matching apprentice application, placement, uploaded learner document or apprentice progress entry was found. This establishes provenance of a record, not its current legitimacy; it was neither deleted nor assigned to a shop.

Seven recognized apprentice-role records have active placements resolving to a real shop and supervisor. Their assigned courses have published status: four cosmetology learners have 40 published lessons each; three recognized barber learners have 14 each. The unrecognized barber account also points to the 14-lesson published course. This query does not establish that every lesson has working media or that the older barber assignment is the intended current curriculum. Test/QA identities and the two shop-owner identities are reported separately. Active E2E execution can create transient QA rows, so raw enrollment totals are not a stable learner count.

## Verified source repairs

1. `apps/lms/app/admin-preview/page.tsx`: the legacy server action set only an unsigned selector cookie. The signed session resolver prioritizes an existing signed session, so an earlier selected identity could persist. The server action now delegates to the canonical preview route, which replaces the complete signed identity and clears old shop scope. The duplicate destination switch that sent program holders to Host Shop has been removed. Actor authorization is checked again on submission.
2. `apps/lms/app/api/timeclock/action/route.ts`: the active shift SELECT omitted break_minutes while the missing-lunch decision reads it. Live schema confirms that field exists. Select it so the existing check uses the actual recorded break and TypeScript compiles. No shift records are rewritten.
3. `scripts/audit-apprentice-dashboards.mjs`: require an explicit subject; classify shop roles before apprentice queries; surface query errors; inspect assigned published courses instead of a hardcoded course; use current apprentice routes; bound HTTP requests; return failure on probe errors; explicitly distinguish login redirects from authenticated acceptance.
4. `tests/portal-workspace-routing.node.test.mjs`: current Host Shop links are intentionally relative to retain preview host context. Compare resolved destination to the canonical role destination instead of requiring absolute string spelling. All role/path assertions remain enforced.

## Validation and limitations

- 178 tests passed in 45 dashboard/preview suites.
- 47 portal routing contract tests passed; these reproduce and correct the five failing absolute-vs-relative assertions from the Integrity Gate.
- 38 focused timeclock, host-shop navigation and preview-entry tests passed (the two preview-entry tests overlap the 178).
- Full LMS TypeScript passed after the break_minutes SELECT repair.
- ESLint passed on both changed production TSX/TS files; the script passed node --check. The repository ignores scripts and tests in ESLint.
- Local production build did not complete: after shared build-slot admission it rejected the missing GIT_SHA build identity. Full LMS TypeScript and the focused regression tests passed independently; no successful production build is claimed.
- Before/after changed-line evidence is recorded in apprentice-dashboard-follow-up-lines-2026-11-02.json.
- Authenticated per-person browser acceptance is incomplete: browser automation failed to initialize. SQL evidence and unit tests are not represented as visual verification.

## Deployment and CI

The live app health response reports healthy/ready, Supabase auth and database checks HTTP 200, runtime SHA `24e1c70788ff18592318e61fce4f471907b029ef`, and revision `elevate-lms-migration-00412-ztb`. Git ancestry confirms the running SHA contains #2283 merge `f09a992f1b8ba8c8881287b24effde0c2ba89c2b`.

The previous empty-status lookup inspected commit statuses only. Check runs provide separate evidence, preserved in apprentice-dashboard-ci-2026-11-02.json. The old merge CI's prerequisites were cancelled, causing CI Required Gate to fail; exact LMS release run 41396390869 handed off to newer main, with build/deploy/acceptance skipped and a failing completion summary. These are not successful deploy records and are not rewritten.

The newer Integrity Gate run 41399537018 failed because five portal contract assertions rejected intentional relative Host Shop URLs. Its source defect is repaired here and all 47 relevant tests pass locally. The running Registered Apprenticeship E2E run 41399703268 is separate QA-account evidence, not verification of every real learner. New source changes in this follow-up still require their own production rollout and acceptance.

No existing student hours, payments, approvals, enrollments, account statuses, placements or credentials were changed by this follow-up.
