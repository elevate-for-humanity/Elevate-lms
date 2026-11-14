# Environment remediation register — October 26, 2026

Source: https://chatgpt.com/share/6adff9fc-8118-83e9-a7c5-96bb8b3edf1e?ogimg=plain

This preserves the original 95 findings in order. The later 55-item audit is a different register. Code/test repairs below are not production acceptance. Open items are deliberately not marked complete. Protective conditions require evidence and recovery, not removal.

Latest integration validation: 312 worker tests, 19 focused publication/contract tests, Admin typecheck, and changed-source lint pass. Classic and incremental publication SQL regressions pass against the applied database; synthetic fixtures are rolled back. Full GitHub CI and production/container checks must pass on the combined PR head before merge. The earlier 4,837-test CI run and Admin/LMS production builds passed before PR #2169 landed; those results are historical for this final integration.

Database migrations `20261027031413_atomic_ultimate_publication` and `20261027031415_documented_paid_invoice_totals` are applied to the primary Elevate project. Three rollback-only SQL regressions pass against the applied functions: publication failure/rollback/idempotency/fencing, enqueue/aggregate atomicity, and a 1,001-invoice aggregate. All synthetic fixtures were rolled back. New functions deny anonymous/authenticated execution and allow service_role. Security advisory counts remain unchanged (31 informational server-only RLS tables; one existing MFA warning).

| ID | Original finding | Current disposition | Evidence / next requirement |
|---|---|---|---|
| 1 | Dashboard page permits roles that its data loader rejects | Code repair / test evidence | Canonical dashboard entry admits its operational roles and redirects them to the existing RLS-backed staff portal before privileged aggregate/asset loading. Global reporting remains admin/super_admin-only; role routing and loader denial are tested. |
| 2 | Admin page and API authorization rules are inconsistent | Code repair / role acceptance open | Dashboard page/loader and three platform-setting APIs now use their canonical permissions. 38 real-guard route tests cover denied roles, secondary-role failures, admin/super_admin and verified secondary admin. Other role-specific screens still require live acceptance. |
| 3 | Staff-level API access can exceed the platform-settings permission model | Code repair / test evidence | platform-settings, settings, and env-vars routes require manage_platform_settings with adminOverride disabled. Staff/org_admin/instructor/student are rejected before privileged client creation; super_admin works through the same guard. |
| 4 | Navigation configuration API permits broader modification access than intended permissions suggest | Existing repair; acceptance open | Narrow platform-settings permission check already present; runtime validation pending. |
| 5 | Secondary role lookup errors can be treated as missing permissions | Existing repair; acceptance open | Fail-closed role lookup repair already present; runtime validation pending. |
| 6 | Dashboard header silently substitutes zero when count queries fail | Code repair / test evidence | Degraded and unavailable header responses now produce a visible warning and retry control; malformed responses fail closed. Frontend retry tests pass. |
| 7 | Dashboard data loader uses capped queries that may omit records | Code repair / test evidence | Paginated enrollment aggregates and a single paid-invoice SQL snapshot; 1,001-row regressions. Other bounded presentation lists still require review. |
| 8 | Completed-enrollment count is incorrectly calculated from active enrollments | Code repair / test evidence | Prior completion fix executed against 1,001 enrollments, including completed and inactive states. |
| 9 | New-leads-today calculation uses update timestamps rather than creation timestamps | Code repair / test evidence | Uses created_at; editing an old lead cannot create a new-lead count. |
| 10 | Inactive-learner reporting uses enrollment updates rather than actual learning activity | Code repair / test evidence | Uses lesson_progress timestamps and enrollment start; query failure suppresses false inactivity flags. |
| 11 | Stale-lead reporting does not fully reflect contact history | Code repair / test evidence | Uses last_contact_at, falling back to lead creation. |
| 12 | Missing-outcome enrollment collection is hardcoded as empty | Code repair / test evidence | Matches completed enrollments against recorded employment_outcomes by learner and program. |
| 13 | Revenue reporting uses the maximum of multiple sources instead of reconciliation | Code and database repair / acceptance open | Removed maximum-of-overlapping-sources calculation. Explicit paid-invoice USD-cent snapshot replaces guessed revenue; 1,001-invoice and timezone tests pass. Live monthly completeness is false because payment dates need verified reconciliation; the card says Unavailable. |
| 14 | Dashboard degradation can occur without a visible degraded-data warning | Code repair / test evidence | Failed count sources mark degradation; unavailable KPI and health rendering tested. |
| 15 | Dashboard can display a Live Supabase Data indicator without independently establishing data freshness | Code repair / test evidence | Replaced unconditional live-data claim with snapshot/incomplete labels. |
| 16 | Health monitor checks job_queue, not the Course Builder's ultimate_build_jobs | Code repair / test evidence | Checks ultimate_build_jobs alongside job_queue. |
| 17 | Health reporting can miss queued or failed Course Builder jobs | Open | Requires implementation review and/or live acceptance evidence. |
| 18 | Stale-job detection does not cover the complete Course Builder lifecycle | Code repair / test evidence | Expired/missing leases and stale/missing heartbeats now detected; queued/failed lifecycle remains open under #17. |
| 19 | QuickBooks health can be inferred from configured credentials rather than successful connectivity | Code repair / test evidence | Requires successful bounded company lookup, not credentials alone. |
| 20 | Build-environment health checks only a limited set of environment variables | Code repair / test evidence | Relabeled configuration checks; operational readiness beyond listed checks remains open. |
| 21 | Missing-document queries may omit records where verification is null | Code repair / test evidence | Includes null verification states. |
| 22 | Existing queued jobs can be returned without triggering another dispatch | Existing repair; acceptance open | Existing queued-job dispatch notification already present; dispatch unit tests pass. |
| 23 | Dispatch failure can leave a job queued without an active worker | Open | Requires implementation review and/or live acceptance evidence. |
| 24 | Repair requeue relies on later scheduling | Code repair / test evidence | Fenced repair transitions request dispatch; stale lease transitions cannot wake it. |
| 25 | Job retry limits can stop automatic processing | Protective condition retained | Verify the underlying condition and recovery behavior; do not bypass the guard. |
| 26 | Lesson checkpoint continuation depends on successful redispatch when the worker yields | Existing repair; acceptance open | Checkpoint dispatch wakeup already present; worker suite passes. |
| 27 | Worker assignment can time out after Cloud Run accepts execution | Open | Requires implementation review and/or live acceptance evidence. |
| 28 | Expired running leases require recovery through a new worker claim | Protective condition retained | Verify the underlying condition and recovery behavior; do not bypass the guard. |
| 29 | Exhausted job attempts prevent further automatic claims | Protective condition retained | Verify the underlying condition and recovery behavior; do not bypass the guard. |
| 30 | Queue scan is limited to 50 records | Code repair / test evidence | Scans all pages rather than stopping behind 50 storage-blocked records. |
| 31 | Jobs beyond the scan limit are not inspected during that scan | Code repair / test evidence | Regression test reaches runnable work beyond first blocked page. |
| 32 | Storage-blocked jobs are excluded from automatic dispatch | Protective condition retained | Verify the underlying condition and recovery behavior; do not bypass the guard. |
| 33 | Owner-paused jobs are excluded from automatic dispatch | Protective condition retained | Verify the underlying condition and recovery behavior; do not bypass the guard. |
| 34 | Production scheduled dispatch sets worker parallelism to one | Open | Requires implementation review and/or live acceptance evidence. |
| 35 | Different launch paths use different concurrency policies | Open | Requires implementation review and/or live acceptance evidence. |
| 36 | Direct launcher does not start another execution when one is active | Open | Requires implementation review and/or live acceptance evidence. |
| 37 | Existing Cloud Run execution can be mistaken for sufficient evidence of a requested launch | Open | Requires implementation review and/or live acceptance evidence. |
| 38 | Direct launcher reads only 50 execution records per page | Code repair / CI pending | Scans continuation tokens within one bounded deadline, finds older active executions, and rejects unreadable/cyclic pages before any new launch. |
| 39 | Regional worker-image mismatch blocks regional dispatch | Protective condition retained | Verify the underlying condition and recovery behavior; do not bypass the guard. |
| 40 | Insufficient CPU quota blocks dispatch | Protective condition retained | Verify the underlying condition and recovery behavior; do not bypass the guard. |
| 41 | Insufficient memory quota blocks dispatch | Protective condition retained | Verify the underlying condition and recovery behavior; do not bypass the guard. |
| 42 | Active executions consume worker allocation slots | Protective condition retained | Verify the underlying condition and recovery behavior; do not bypass the guard. |
| 43 | Conservative resource calculations can prevent launches | Open | Requires implementation review and/or live acceptance evidence. |
| 44 | The coordinator depends on a successful workflow handoff after its execution budget | Open | Requires implementation review and/or live acceptance evidence. |
| 45 | Successful Google execution requests do not prove Supabase job assignment | Open | Requires implementation review and/or live acceptance evidence. |
| 46 | PARIS transient recovery is limited to three confirmed recoveries | Open | Requires implementation review and/or live acceptance evidence. |
| 47 | PARIS monitors only the latest 100 matching jobs per scan | Code repair / test evidence | Immutable ID pagination replaces mutable-time offset scan. |
| 48 | Older monitored jobs can be omitted when more than 100 qualify | Code repair / test evidence | 101-job regression verifies later monitored pages. |
| 49 | Autopilot configuration success does not prove worker execution | Open | Requires implementation review and/or live acceptance evidence. |
| 50 | Autopilot configuration targets the latest job for the selected build | Open | Requires implementation review and/or live acceptance evidence. |
| 51 | Recovery requests are separate from confirmed recoveries | Protective condition retained | Verify the underlying condition and recovery behavior; do not bypass the guard. |
| 52 | Recovery confirmation may miss a restart that reuses the same worker identifier | Code repair / test evidence | Execution generation distinguishes new claims reusing an owner; repeated heartbeat cannot double-count. |
| 53 | Conditional monitoring updates can fail because of concurrent changes | Code repair / test evidence | Rereads conflicted row and retries bounded conditional updates; arriving pause respected. |
| 54 | A monitoring observation can succeed without its update being persisted | Code repair / test evidence | Unresolved conflicts remain explicitly unsaved; no fabricated persistence success. |
| 55 | Storage failures prevent automatic PARIS recovery | Protective condition retained | Verify the underlying condition and recovery behavior; do not bypass the guard. |
| 56 | Licensing, authorization, and missing-source errors prevent automatic recovery | Protective condition retained | Verify the underlying condition and recovery behavior; do not bypass the guard. |
| 57 | A stale heartbeat with an unexpired lease causes PARIS to wait rather than replace the worker | Protective condition retained | Verify the underlying condition and recovery behavior; do not bypass the guard. |
| 58 | Lesson repair attempts are limited to three | Protective condition retained | Verify the underlying condition and recovery behavior; do not bypass the guard. |
| 59 | Failed lessons do not advance the course cursor | Protective condition retained | Verify the underlying condition and recovery behavior; do not bypass the guard. |
| 60 | Unresolved internal lesson failures can stop automatic progression | Open | Requires implementation review and/or live acceptance evidence. |
| 61 | Missing external assets can place a course into dependency-waiting status | Protective condition retained | Verify the underlying condition and recovery behavior; do not bypass the guard. |
| 62 | Worker progress stalls can trigger failure and lease cancellation | Open | Requires implementation review and/or live acceptance evidence. |
| 63 | Worker heartbeat failures can lead to lost execution ownership | Protective condition retained | Verify the underlying condition and recovery behavior; do not bypass the guard. |
| 64 | Worker processing depends on successful profile hydration | Protective condition retained | Verify the underlying condition and recovery behavior; do not bypass the guard. |
| 65 | Missing competency profiles stop processing | Protective condition retained | Verify the underlying condition and recovery behavior; do not bypass the guard. |
| 66 | Continuous lesson processing is subject to an execution budget | Protective condition retained | Verify the underlying condition and recovery behavior; do not bypass the guard. |
| 67 | Yielded lesson work requires subsequent queue recovery | Existing repair; acceptance open | Checkpoint successor dispatch already present; end-to-end continuation pending. |
| 68 | Missing canonical draft lessons prevent publication | Protective condition retained | Verify the underlying condition and recovery behavior; do not bypass the guard. |
| 69 | Every competency must have a built lesson before publication | Protective condition retained | Verify the underlying condition and recovery behavior; do not bypass the guard. |
| 70 | Missing passing media-quality evidence prevents release | Protective condition retained | Verify the underlying condition and recovery behavior; do not bypass the guard. |
| 71 | Incomplete lesson artifacts prevent release | Protective condition retained | Verify the underlying condition and recovery behavior; do not bypass the guard. |
| 72 | Duplicate or mismatched competency records prevent release | Protective condition retained | Verify the underlying condition and recovery behavior; do not bypass the guard. |
| 73 | Publication performs multiple database writes without a demonstrated transaction covering the entire operation | Code and database repair / acceptance open | One invoker transaction commits canonical lessons/media, course/build state, and release history; injected late failure rolls everything back. |
| 74 | Intermediate publication failure may leave partial changes | Code and database repair / acceptance open | Applied atomic RPC passes injected second-lesson failure, idempotent replay, historical rollback, and stale-worker rejection. Bare legacy writer retired. |
| 75 | Canonical publication readback failure stops release | Protective condition retained | Verify the underlying condition and recovery behavior; do not bypass the guard. |
| 76 | Missing or incorrectly positioned final assessments can block courses using the new-course assessment contract | Protective condition retained | Verify the underlying condition and recovery behavior; do not bypass the guard. |
| 77 | Completed media production does not guarantee published LMS availability | Open | Requires implementation review and/or live acceptance evidence. |
| 78 | Dispatcher tests rely primarily on mocked Google and Supabase responses | Open | Requires implementation review and/or live acceptance evidence. |
| 79 | Dispatcher tests verify assignment rather than complete lesson production | Open | Requires implementation review and/or live acceptance evidence. |
| 80 | Tests do not establish live end-to-end publication success | Open | Requires implementation review and/or live acceptance evidence. |
| 81 | Same-worker recovery accounting lacks identified regression coverage | Code repair / test evidence | Same-owner/new-generation regression coverage added. |
| 82 | Live GitHub scheduled recovery execution has not been verified | Live evidence inspected | Scheduled recovery run 40430317433 and its dispatched run 40430375160 both succeeded. This does not prove a lesson completed. |
| 83 | Live regional worker-image equality has not been verified | Open | Requires implementation review and/or live acceptance evidence. |
| 84 | Current Supabase queue, retry, and heartbeat states have not been verified | Live evidence inspected | Canonical queue and failure classifications inspected read-only; per-build operational acceptance remains open. |
| 85 | Current Google Cloud execution and quota states have not been verified | Open | Requires implementation review and/or live acceptance evidence. |
| 86 | The Course Builder Admin API limits returned builds to 50 | Code repair / CI pending | Supports explicit bounded pages with a lookahead row, stable created_at/id ordering, course filters, hasMore and nextPage. Existing clients retain the first-page response. |
| 87 | An accepted dispatch can produce an HTTP 202 without proof that execution began | Open | Requires implementation review and/or live acceptance evidence. |
| 88 | A failed dispatch can return HTTP 503 while the saved job remains queued | Open | Requires implementation review and/or live acceptance evidence. |
| 89 | Internal executor requires matching lease owner, generation, and job status | Protective condition retained | Verify the underlying condition and recovery behavior; do not bypass the guard. |
| 90 | Internal executor can return HTTP 202 when repair is requeued rather than completed | Open | Requires implementation review and/or live acceptance evidence. |
| 91 | Internal executor can return HTTP 500 after a processing failure | Protective condition retained | Verify the underlying condition and recovery behavior; do not bypass the guard. |
| 92 | The internal executor's lease checks require further validation during long-running operations | Code and database repair / acceptance open | Publication checks locked job owner, generation, status, and live lease before writes and before commit. Stale-generation rollback regression passes; complete live execution remains open. |
| 93 | Certain database tables are accessible only through privileged server-side paths | Protective condition retained | Verify the underlying condition and recovery behavior; do not bypass the guard. |
| 94 | Dashboard fallback data can conceal underlying query failures | Code repair / test evidence | Failed sources retain unavailable state through normalization and rendering. |
| 95 | Different dashboard roles may receive inconsistent access to operational data | Open | Requires implementation review and/or live acceptance evidence. |

The later 55-item register also identified enqueue/parent-state split writes. New enqueue RPC commits both atomically, preserves existing active checkpoints, and rolls back the inserted job if the parent update fails. Regression passes against the applied database.

Financial reporting now explicitly covers paid invoices; it is not a consolidated ledger or a claim that enrollment balances equal cash receipts. Missing historical payment dates require verified accounting evidence before monthly reporting becomes available.

Production acceptance still requires deployment SHA/image/revision evidence, role-specific dashboard checks, current regional image/quota inspection, checkpoint-to-published-course execution, and student playback validation.

Concurrent main changes through `1470ff43ea3f2c122142f53b33b65219a85cb14b` are preserved in the merge candidate. Combined tests caught and repaired missing generated-photo resume indexing and an error-code mismatch with the repair policy. Content-addressed photo inventory now has a verified cue index, checksum readback, retained provider diagnostics, and duplicate-photo rejection. Six photo regressions pass, including zero-inference resume and corrupted-byte rejection.

Latest pre-merge release evidence: worker run 40438118037 failed three photo error-code assertions; those exact cases now pass in the repaired worker suite. Admin run 40438212081 stopped before rollout with PARIS_APP_SECRET_NOT_FOUND. No key was invented, copied, or printed; the existing Google secret binding must be restored by an identity with access to that secret. LMS run 40438202792 failed with an unclassified invalid health response, although current direct and public health requests return HTTP 200, ready/healthy, commit 1470ff43ea3f2c122142f53b33b65219a85cb14b. The release workflow now resolves status.url once for both ID-token audience and all probes, rather than hardcoding an alias, and logs status/content-type on parse failure without response bodies or tokens. This corrects URL/audience drift and improves diagnosis; the original invalid response's exact HTTP cause was not recorded and is not claimed proven. Existing strict health gates remain intact.

Final local validation was interrupted by automatic scratch cleanup: the running process resolved its deleted checkout under `.scratch-cleaning-*`, then failed on missing build files. The execution environment subsequently became unavailable. All changes were already persisted in GitHub. Admin compilation and 145-page generation succeeded before cleanup, but that final packaging/typecheck is not marked passed. Previous full Admin/Marketing/LMS build evidence remains historical, not a claim that the interrupted candidate completed. The repair PR now runs the new dashboard, publication, settings, dispatch and pagination regressions in required GitHub CI before merge. Pagination changes in #38/#86 require that remote CI result.

Final integration preserves main through `2556b2c410bda3a5f3c047ccf6f55c881bccded7`, including Studio/PARIS, PBX, next-best course photos, v2 photo cache continuation, callback typing, and explicit safety normalization. Previously saved v2 cue images remain reachable without new inference; the repair adds persistent checksum indexing for subsequent resume verification. Tests for the retired per-row publisher now exercise preparation and the single atomic RPC; two existing queue mocks use atomic enqueue. Required CI and production/container checks on PR #2171 are the final merge gates; automatic merge is enabled without bypassing those rules.

PR #2169 landed on main at a0c33f7607563c3b7ddb0b6937a26bdb494667f6 while final checks were running. Its resume quota, expanded authored scenes, checkpoint hashes, and publish-as-you-go behavior are preserved. Migration 20261027100629_incremental_atomic_publication extends the existing atomic boundary: each accepted lesson commits canonically before the worker advances, without inventing a whole-course release; final release can include verified retained publications without fake new artifacts. Worker owner/generation/lease fencing reaches both paths. Canonical lesson types, order, practical requirements, stable assessments, and prior publications are retained. A rollback-only regression covers a failed lesson write, stale ownership, partial replay, final failure with retained content, and an entirely retained course. New server functions remain invoker/service-only; no new advisory groups were introduced. Required CI now explicitly runs these integrated contracts.
