# Historical August CI orphan: root-level audit

Audit date: November 2, 2026. Repository: elevate-for-humanity/Elevate-lms. Current CI snapshot: 36a5e58f056ba1b95f9ffaae5224a136eb381b6f.

## Verified state

| Record | Evidence |
| --- | --- |
| Workflow run | 32218758732; CI run number 5374 |
| Run URL | https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/32218758732 |
| Historical source | e870b91aab5a247556280636bd77951552eac848, .github/workflows/ci.yml |
| Created and last updated | 2026-08-19T05:15:37Z; both unchanged |
| Run and attempt 1 | queued; conclusion null |
| All jobs and attempt-1 jobs | total_count 0; jobs [] |
| Check suite | 87338869734; queued; conclusion null; same SHA and unchanged timestamps |
| Check-suite owner | GitHub Actions, app ID 15368 |
| Check runs | total_count 0; check_runs [] |
| Artifacts | total_count 0; artifacts [] |
| Pending deployments | [] |
| Normal and force cancellation | Both returned HTTP 409 in the authenticated cleanup execution; its terminal re-read still found a nonterminal record |
| Fresh GitHub UI cancellation | Alert: Failed to cancel workflow. Status remained Queued. |
| Cancellation execution evidence | Successful coordinator run 41398038533, job 125123550912, logged github_cancellation_conflict for 32218758732 |

The API responses are mutually consistent about the stale queued state. They do not expose the internal scheduler event that originally caused it. Request IDs and raw cancellation response bodies were not retained by the existing executor and are not invented here.

## Failure boundary and source review

The historical YAML parses successfully and defines five jobs: preflight, typecheck, lint, diagnostics, and ci-gate. No job record was ever exposed for this run. This places the observable failure before runner execution: there is no failing checkout, package install, TypeScript compilation, test, or deployment step to repair in that run.

The historical and current CI files both use the branch concurrency group ci-${{ github.workflow }}-${{ github.ref }} with cancellation of older runs enabled. Both were parsed and inspected. The historical ci-gate and hygiene tasks use always(), but there are zero jobs or check runs; this is not evidence of an executing always() task refusing termination. The gate has no explicit timeout in either source; because no job exists, adding a timeout now cannot terminate this stored August record.

The current source has additional required diagnostics and an isolated enrollment database job. These differences are expected later evolution, not evidence explaining the missing August job creation. Editing main does not change the historical workflow snapshot or the provider-owned run/suite state.

GitHub documents this exact abnormal-state pattern: a queued/in-progress run with no jobs, failed UI cancellation, and cancel/force-cancel errors may require GitHub Support to clear the run or check suite.

Reference: https://docs.github.com/en/actions/how-tos/troubleshoot-workflows#canceling-workflows

## Repairs already verified and remaining action

Current main CI scheduling has already been repaired to release superseded tests. Cleanup verifies repository, workflow, branch, commit, and run identity before normal cancellation; uses force cancellation only after the normal cancellation conflict; verifies completion races; and reports provider-side conflicts without aborting cleanup for other runs. These controls preserve active deployment and course work.

The fresh UI cancellation failed. Supported normal and force API cancellation have already failed. The actual August record is still unresolved. No success status, fake check, exception hiding the run, workflow restart, deletion, or security bypass has been used to make it appear repaired.

Remaining supported repair: GitHub must reconcile run 32218758732 and GitHub Actions-owned check suite 87338869734. This is a provider-side operation unavailable through the repository tools. The original internal cause cannot be established from public or repository APIs alone.

## Prepared GitHub Support request — not sent

Subject: Orphaned GitHub Actions run remains queued with zero jobs; UI and both cancel endpoints fail

Repository: elevate-for-humanity/Elevate-lms
Run: https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/32218758732
Check suite: 87338869734
Commit: e870b91aab5a247556280636bd77951552eac848
Workflow: .github/workflows/ci.yml, run number 5374, push to main, attempt 1
Created/updated: 2026-08-19T05:15:37Z

Please reconcile this orphaned workflow run and its GitHub Actions-owned check suite, and clear any stale scheduler/concurrency reservation. Both objects remain queued with null conclusion and unchanged timestamps. All-jobs, attempt-jobs, check-runs, artifacts, and pending-deployment inventories are empty. Normal cancellation and force cancellation return HTTP 409; the GitHub UI reports Failed to cancel workflow. Fresh reads still show queued.

Please transition the obsolete record to an appropriate terminal cancelled state if your investigation confirms it is orphaned, and investigate why no job records were created. Preserve current workflow configuration, successful releases, production services, and learner data. Do not re-execute the historical source commit. Existing cancellation logging did not capture response request IDs.

## Complete line-by-line comparison

Every differing line is included below, including comments. A raw diff -y comparison is also saved beside this report as august-ci-32218758732-side-by-side.diff. The raw diff exits 1 because differences exist; that is expected.

| Historical line | Historical content | Current line | Current content | Classification |
| --- | --- | --- | --- | --- |
| 7 | `    branches: [main, work]` | 7 | `    branches: [main, work, 'fix/unified-paris-acceptance-20261023']` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 10 | `  # The newest commit retains every required gate; obsolete commits release runners.` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 11 | `  # Per-SHA groups let every main push consume another full set of runner slots.` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| 16 | `    runs-on: ubuntu-latest` | 18 | `    runs-on: ubuntu-24.04` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 20 | `    env:` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 21 | `      SUPABASE_URL: ${{ secrets.SUPABASE_URL }}` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 22 | `      NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 23 | `      SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| 29 | `        run: pnpm install --frozen-lockfile --strict-peer-dependencies=false` | 35 | `        run: node scripts/run-bounded-build.mjs -- pnpm install --frozen-lockfile --strict-peer-dependencies=false` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 36 | `      - name: Canonical dashboard PostgreSQL authorization regressions` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 37 | `        run: \|` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 38 | `          node tests/integration/auth-provisioning-postgres.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 39 | `          node tests/integration/practical-authorization-postgres.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 40 | `          node tests/integration/classroom-conflict-index-postgres.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 41 | `          node tests/integration/payment-integrity-evidence-postgres.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 42 | `      - name: Verify voicemail release hook and PARIS terminal-state regressions` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 43 | `        run: node --test scripts/gcp/voicemail-acceptance-workflow.test.mjs scripts/gcp/paris-course-monitor.test.mjs scripts/gcp/supervise-course-queue.test.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 44 | `      - name: Student funding and permission regression tests` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 45 | `        run: >-` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 46 | `          pnpm exec vitest run` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 47 | `          tests/unit/student-document-validation.test.ts` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 48 | `          tests/unit/student-training-privacy.test.ts` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 49 | `          tests/unit/credential-document-preview.test.ts` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 50 | `          tests/unit/career-onboarding-route.test.ts` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 51 | `          tests/unit/program-holder-workspace-contract.test.ts` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 52 | `          tests/unit/voucher-remittance-evidence.test.ts` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 53 | `          tests/unit/student-enrollment-identity.test.ts` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 54 | `          tests/unit/epa-testing-readiness-route.test.ts` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 55 | `          --environment node` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 56 | `      - name: Apprentice workspace, submissions and server scoring regressions` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 57 | `        run: >-` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 58 | `          pnpm exec vitest run` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 59 | `          tests/unit/apprentice-workspace-data.test.tsx` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 60 | `          tests/unit/apprentice-checkpoint-enrollment.test.ts` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 61 | `          tests/unit/apprentice-enrollment-revocation.test.ts` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 62 | `          tests/unit/apprentice-assignment-submit.test.ts` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 63 | `          tests/unit/apprentice-admin-grading.test.ts` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 64 | `          tests/unit/apprentice-admin-gradebook.test.tsx` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 65 | `          tests/unit/apprentice-speedgrader-save.test.tsx` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 66 | `          tests/unit/apprentice-lesson-quickcheck.test.tsx` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 67 | `          tests/unit/manual-theory-clock.test.tsx` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 68 | `          tests/unit/apprentice-dashboard-data-regression.test.ts` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 69 | `          tests/unit/apprenticeship/admin-hours.test.ts` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 70 | `          tests/unit/apprenticeship-portal-navigation-contract.test.ts` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 71 | `          tests/unit/portal-preview-subject.test.ts` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 72 | `      - name: Required CI completion policy` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 73 | `        run: node --test scripts/test-ci-required-gate.mjs lib/phone/microphone.test.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 74 | `      - name: Studio GitHub credential fallback regression tests` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 75 | `        run: node --test scripts/test-devstudio-github-token.mjs scripts/test-github-app-token.mjs scripts/gcp/paris-github-app-binding.test.mjs scripts/gcp/github-runtime-binding.test.mjs scripts/test-github-authorization-contract.mjs scripts/test-paris-app-diagnostic.mjs scripts/test-paris-rejected-read-recovery.mjs scripts/test-paris-completion-audit.mjs scripts/test-studio-health-app-access.mjs scripts/test-paris-tool-outcomes.mjs tests/worker/course-workspace-controls.test.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 76 | `      - name: Studio terminal, repository and PARIS voice regression tests` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 77 | `        run: node --test services/studio-browser/terminal-sessions.test.mjs services/studio-browser/repository-sync.test.mjs infra/pbx/paris/*.test.mjs infra/pbx/provisioner/*.test.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 78 | `      - name: External course execution and RunPod inference contracts` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 79 | `        run: node --test tests/compute/*.test.mjs infra/pbx/runtime-secrets.test.mjs lib/ai/providers/google-runtime-auth.test.mjs tests/worker/video-encoder-process.test.mjs tests/worker/remotion-concat-output.test.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 80 | `      - name: Automatic container build-memory policy` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 81 | `        run: \|` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 82 | `          node scripts/check-build-memory-policy.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 83 | `          node --test scripts/build-memory-policy.test.mjs scripts/build-next-app.test.mjs scripts/run-bounded-build.test.mjs scripts/gcp/check-database-recovery.test.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 84 | `      - name: Final production reliability contract regressions` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 85 | `        run: \|` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 86 | `          node --test scripts/gcp/final-production-acceptance-workflow.test.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 87 | `          node --test tests/worker/registered-source-container.test.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 88 | `          node --test scripts/gcp/paris-course-monitor.test.mjs scripts/gcp/supervise-course-queue.test.mjs scripts/gcp/resume-repaired-course-jobs.test.mjs scripts/gcp/dispatch-lesson-autopilots.test.mjs scripts/gcp/deploy-lesson-autopilots.test.mjs scripts/gcp/audit-course-production.test.mjs lib/ai/runtime/code-repair-policy.test.mjs tests/worker/course-release-audit.test.mjs tests/worker/release-database-failures.test.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 89 | `          pnpm exec vitest run tests/unit/paris-supervision-classification.test.ts tests/unit/quickbooks-client.test.ts tests/unit/google-calendar-oauth.test.ts --environment node` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 90 | `      - name: Ultimate course builder repair regression tests` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 91 | `        run: node --test tests/worker/narration-inspector-checkpoint.test.mjs tests/worker/independent-speech-windows.test.mjs lib/video/render-checkpoint-contract.test.mjs tests/worker/checkpoint-preview.test.mjs tests/worker/fenced-write-recovery.test.mjs tests/worker/rti-teaching-policy.test.mjs tests/worker/verified-self-repair.test.mjs tests/worker/repair-router.test.mjs tests/worker/scene-construction-repair.test.mjs tests/worker/release-database-failures.test.mjs tests/worker/objective-practice.test.mjs tests/worker/authored-practice.test.mjs tests/worker/studio-runtime-rate-limit.test.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 92 | `      - name: Course database contract version parity` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 93 | `        run: node --test tests/worker/database-contract-version.test.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 94 | `      - name: Environment audit repair regression tests` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 95 | `        run: \|` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 96 | `          pnpm exec vitest run tests/unit/admin-dashboard-data-execution.test.ts tests/unit/admin-header-degradation.test.tsx tests/unit/dashboard-system-health.test.ts tests/unit/normalize-dashboard-data.test.ts tests/unit/dashboard-unavailable-kpi.test.tsx tests/unit/course-production-review.test.ts tests/unit/course-production-resume-cursor.test.ts tests/unit/legacy-lms-publication.test.ts tests/unit/platform-settings-permissions.test.ts tests/unit/course-worker-direct-launch.test.ts tests/unit/ultimate-build-list-pagination.test.ts tests/unit/dashboard-role-routing.test.tsx` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 97 | `          node --test scripts/gcp/paris-course-monitor.test.mjs scripts/gcp/dispatch-course-job.test.mjs tests/worker/release-database-failures.test.mjs tests/worker/paid-invoice-totals.test.mjs tests/worker/dependency-wait.test.mjs workers/ultimate-release-media.test.mjs workers/process-job-state.test.mjs workers/ultimate-teaching-cache.test.mjs workers/ultimate-resume-route.test.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 98 | `      - name: Admin navigation and QuickBooks recovery regressions` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 99 | `        run: pnpm exec vitest run tests/unit/admin-nav-coverage.test.ts tests/unit/admin-nav-config-execution.test.ts tests/unit/quickbooks-admin-recovery.test.ts tests/unit/quickbooks-client.test.ts tests/unit/quickbooks-environment-routes.test.ts` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 100 | `      - name: Authored cosmetology sample production adapter regression` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 101 | `        run: pnpm exec vitest run tests/unit/ultimate-authored-sample.test.ts` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 102 | `      - name: Course photographs and saved preview regression tests` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 103 | `        run: \|` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 104 | `          pnpm exec vitest run tests/unit/teaching-photos.test.ts tests/unit/course-side-preview.test.tsx tests/unit/course-builder-preview-delivery.test.ts tests/unit/course-workspace-preview.test.tsx tests/unit/course-preview-readonly-video.test.tsx tests/unit/course-preview-index.test.tsx` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 105 | `          node --test lib/ultimate-course-builder/testing/related-photo-selection.test.mjs tests/worker/photo-cue-repair.test.mjs lib/ultimate-course-builder/adapters/approved-reference-photos.test.mjs scripts/gcp/probe-course-photo-provider.test.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 106 | `      - name: Traffic scope and unavailable-data regression tests` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 107 | `        run: node --test tests/unit/traffic-report.test.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 108 | `      - name: Public narration lifecycle regression tests` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 109 | `        run: pnpm exec vitest run tests/unit/scroll-narrator-playback.test.tsx tests/unit/home-scroll-narrator-regression.test.ts tests/unit/natural-voice-pacing.test.ts tests/unit/cookie-consent-navigation.test.tsx tests/unit/first-party-traffic-storage.test.tsx tests/unit/studio-chat-readiness.test.tsx tests/unit/header-mobile-focus.test.tsx` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 110 | `      - name: Completed lesson media handoff regression tests` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 111 | `        run: node --test tests/worker/attach-lesson-media.test.mjs workers/process-job-state.test.mjs tests/worker/complete-lesson-before-advance.test.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 112 | `      - name: Course dispatch eligibility regression tests` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 113 | `        run: node --test scripts/gcp/dispatch-course-job.test.mjs scripts/gcp/probe-course-dispatch-queue.test.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 114 | `      - name: Course dispatch PostgREST projection (read-only)` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 115 | `        if: github.event.pull_request.head.repo.full_name == github.repository \|\| github.event_name != 'pull_request'` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 116 | `        run: node scripts/gcp/probe-course-dispatch-queue.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 117 | `      - name: Learner inbox PostgREST projection (read-only)` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 118 | `        if: github.event.pull_request.head.repo.full_name == github.repository \|\| github.event_name != 'pull_request'` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 119 | `        run: node scripts/qa/probe-learner-inbox.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 120 | `      - name: Google Studio runtime topology regression tests` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 121 | `        run: node --test scripts/gcp/verify-ai-runtime.test.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 122 | `      - name: Google Calendar credential and OAuth regressions` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 123 | `        run: pnpm exec vitest run tests/unit/google-calendar-runtime-settings.test.ts tests/unit/google-calendar-env-sync.test.ts tests/unit/google-calendar-oauth.test.ts tests/unit/google-calendar-busy.test.ts --environment node` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 124 | `      - name: Google runtime settings regression tests` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 125 | `        run: pnpm exec vitest run tests/unit/program-holder-sync.test.ts tests/unit/google-container-env.test.ts tests/unit/google-deployment-dispatch.test.ts tests/unit/pwa-homepage-hydration.test.tsx tests/unit/pwa-install-prompt-lifecycle.test.ts tests/unit/admin-pwa-navigation-regression.test.ts tests/unit/pwa-update-lifecycle.test.tsx tests/unit/pwa-update-notice.test.tsx` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 126 | `      - name: Resizable Studio and Course Builder panels` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 127 | `        run: pnpm exec vitest run tests/unit/resizable-workspace.test.tsx tests/unit/course-browser-panels.test.tsx tests/unit/studio-conversation-workspace.test.tsx tests/unit/studio-browser-navigation.test.tsx tests/unit/studio-browser-secure-input.test.tsx tests/unit/studio-viewport.test.tsx` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 128 | `      - name: Daily maintenance cron HTTP contract regression` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 129 | `        run: node --test tests/cron/daily-maintenance-contract.node.test.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 130 | `      - name: Google activation and dependency health regression tests` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 131 | `        run: \|` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 132 | `          node --test scripts/gcp/serving-phone-credential.test.mjs tests/phone-runtime-authority.node.test.mjs scripts/gcp/voicemail-live-health.test.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 133 | `          node --test scripts/gcp/phone-runtime-handoff.test.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 134 | `          node --test scripts/test-public-revision-activation.mjs scripts/gcp/deploy-health-retry.node.test.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 135 | `          node --test scripts/test-studio-workflow-inspection.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 136 | `          node --test scripts/gcp/prune-web-release-requests.test.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 137 | `          node --test scripts/validation/tenant-isolation-proof.test.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 138 | `          node --test lib/ultimate-course-builder/media/progressive-segments.test.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 139 | `          pnpm exec vitest run tests/unit/progressive-lesson-video.test.tsx tests/unit/course-progressive-preview-route.test.ts` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 140 | `          pnpm exec vitest run tests/unit/google-service-health.test.ts tests/unit/google-health-revision.test.ts tests/unit/google-runtime-configuration.test.ts tests/unit/admin-google-services.test.ts tests/unit/elevate-media-runtime-sync.test.ts tests/unit/platform-hosting.test.ts tests/unit/health-activation.test.ts tests/unit/course-integrity-checks.test.tsx tests/unit/course-builder-health-contract.test.ts` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 145 | `      - name: Shared dashboard and Program Holder communication regressions` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 146 | `        run: node --test tests/shared-holder-dashboard-repairs.node.test.mjs tests/program-holder-root-audit.node.test.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| 35 | `        run: node scripts/verify-student-lifecycle-contract.mjs` | 148 | `        run: \|` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 149 | `          node --test tests/admission-eligibility.node.test.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 150 | `          node scripts/verify-student-lifecycle-contract.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 151 | `      - name: Canonical payment lifecycle contract` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 152 | `        run: node scripts/verify-payment-lifecycle-contract.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 153 | `      - name: Canonical Store commerce contract` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 154 | `        run: node scripts/verify-store-commerce-contract.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 155 | `      - name: Store source-backed offer proof` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 156 | `        run: pnpm exec tsx scripts/verify-store-proof-contract.ts` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 157 | `      - name: Store paid delivery and private app workspace regressions` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 158 | `        run: pnpm run test:store-delivery` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 159 | `      - name: Verify pinned standalone Store repository contracts` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 160 | `        run: node scripts/verify-store-components.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 163 | `      - name: Canonical portal contracts` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 164 | `        run: \|` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 165 | `          node --test scripts/portal-route-contract.test.mjs scripts/portal-audit-detections.test.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 166 | `          node scripts/audit-portal-contracts.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 167 | `      - name: Portal/database schema drift — live production contract` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 168 | `        if: github.event_name != 'pull_request'` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 169 | `        run: pnpm exec tsx scripts/audit-schema-drift.ts --baseline scripts/schema-drift-baseline.json --fail-on-new-drift` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 170 | `      - name: Supabase write payloads — live production contract` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 171 | `        if: github.event_name != 'pull_request'` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 172 | `        run: pnpm tsx scripts/audit-supabase-mutations.ts` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 173 | `      - name: Portal/database schema drift — PR advisory` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 174 | `        if: github.event_name == 'pull_request'` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 175 | `        run: pnpm audit:schema` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 176 | `      - name: Live portal data integrity` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 177 | `        if: github.event_name != 'pull_request'` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 178 | `        run: node scripts/audit-portal-data-integrity.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| 48 | `    runs-on: ubuntu-latest` | 189 | `    runs-on: ubuntu-24.04` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| 67 | `        run: pnpm install --frozen-lockfile --strict-peer-dependencies=false` | 208 | `        run: node scripts/run-bounded-build.mjs -- pnpm install --frozen-lockfile --strict-peer-dependencies=false` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 209 | `      - name: Restore incremental TypeScript cache` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 210 | `        uses: actions/cache@v4` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 211 | `        with:` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 212 | `          path: \|` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 213 | `            apps/${{ matrix.app }}/.next/cache/tsbuildinfo.json` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 214 | `            apps/${{ matrix.app }}/tsconfig.tsbuildinfo` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 215 | `          key: types-${{ runner.os }}-${{ matrix.app }}-${{ hashFiles('pnpm-lock.yaml', 'tsconfig.json', 'apps/*/tsconfig.json') }}-${{ github.sha }}` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 216 | `          restore-keys: \|` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 217 | `            types-${{ runner.os }}-${{ matrix.app }}-${{ hashFiles('pnpm-lock.yaml', 'tsconfig.json', 'apps/*/tsconfig.json') }}-` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| 73 | `    runs-on: ubuntu-latest` | 223 | `    runs-on: ubuntu-24.04` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| 88 | `        run: pnpm install --frozen-lockfile --strict-peer-dependencies=false` | 238 | `        run: node scripts/run-bounded-build.mjs -- pnpm install --frozen-lockfile --strict-peer-dependencies=false` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 239 | `      - name: Restore content-based ESLint cache` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 240 | `        uses: actions/cache@v4` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 241 | `        with:` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 242 | `          path: .eslintcache` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 243 | `          key: lint-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml', 'eslint.config.*', 'eslint-rules/**') }}-${{ github.sha }}` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 244 | `          restore-keys: \|` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 245 | `            lint-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml', 'eslint.config.*', 'eslint-rules/**') }}-` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| 93 | `    name: Advisory Tests & Repo Hygiene` | 250 | `    name: Functional Tests & Repo Hygiene` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| 94 | `    runs-on: ubuntu-latest` | 251 | `    runs-on: ubuntu-24.04` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| 107 | `        run: pnpm install --frozen-lockfile --strict-peer-dependencies=false` | 264 | `        run: node scripts/run-bounded-build.mjs -- pnpm install --frozen-lockfile --strict-peer-dependencies=false` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| 108 | `      - name: Run Vitest suite (advisory baseline)` | 265 | `      - name: Run required Vitest suite` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| 109 | `        continue-on-error: true` | 266 | `        run: pnpm exec vitest run` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| 110 | `        run: pnpm test` | — | `—` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 275 | `  enrollment-database:` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 276 | `    name: Canonical Enrollment Database` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 277 | `    runs-on: ubuntu-24.04` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 278 | `    timeout-minutes: 15` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 279 | `    services:` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 280 | `      postgres:` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 281 | `        image: postgres:16-alpine` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 282 | `        env:` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 283 | `          POSTGRES_DB: elevate_enrollment_regression` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 284 | `          POSTGRES_HOST_AUTH_METHOD: trust` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 285 | `        ports: ['127.0.0.1:5432:5432']` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 286 | `        options: >-` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 287 | `          --health-cmd "pg_isready -U postgres -d elevate_enrollment_regression"` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 288 | `          --health-interval 5s --health-timeout 5s --health-retries 12` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 289 | `    steps:` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 290 | `      - uses: actions/checkout@v4` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 291 | `      - uses: pnpm/action-setup@v4` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 292 | `        with:` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 293 | `          version: 10.28.2` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 294 | `      - uses: actions/setup-node@v4` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 295 | `        with:` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 296 | `          node-version: '22'` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 297 | `          cache: pnpm` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 298 | `      - run: node scripts/run-bounded-build.mjs -- pnpm install --frozen-lockfile --strict-peer-dependencies=false` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 299 | `      - name: Test real enrollment and publication triggers in an isolated database` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 300 | `        env:` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 301 | `          ENROLLMENT_TEST_DATABASE_URL: postgresql://postgres@127.0.0.1:5432/elevate_enrollment_regression` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 302 | `        run: node --test tests/database/canonical-enrollment.node.test.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 303 | `` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 304 | `      - name: Test completed lesson attachment in an isolated database` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 305 | `        env:` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 306 | `          ATTACHMENT_TEST_DATABASE_URL: postgresql://postgres@127.0.0.1:5432/postgres` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 307 | `        run: node --test tests/database/ultimate-lesson-attachment.node.test.mjs` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 308 | `` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| 121 | `    runs-on: ubuntu-latest` | 311 | `    runs-on: ubuntu-24.04` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| 122 | `    needs: [preflight, typecheck, lint]` | 312 | `    needs: [preflight, typecheck, lint, enrollment-database, diagnostics]` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 324 | `          test "${{ needs.enrollment-database.result }}" = "success"` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
| — | `—` | 325 | `          test "${{ needs.diagnostics.result }}" = "success"` | EXPECTED: later CI configuration; this does not rewrite the historical run. |
