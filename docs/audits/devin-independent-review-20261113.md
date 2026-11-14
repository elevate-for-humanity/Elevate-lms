# Independent review of Devin work

Audit date: November 13, 2026, Eastern time. Repository: `elevate-for-humanity/Elevate-lms`.

## Scope and conclusion

44 pull requests authored by `devin-ai-integration[bot]` were inventoried, including 11 recent repairs and 33 historical PRs. Review covered change inventories, source dependencies, current implementations of security-critical historical components, tests, production database structure and permissions, public HTTP responses, and workflow execution evidence. It is not a certification of every historical UI or authenticated production journey.

The 33 historical PRs touched 209 unique original paths: 103 still exist, 37 map directly into the split applications, and 69 were removed or replaced. Replacement is not by itself a regression. Historical Docker/hosting work does not prove the current Google release is correct.

Devin delivered useful source corrections, but merge status and green dispatch/monitoring jobs overstated end-to-end completion. The review found missing production schema, inaccessible staff queries, authorization inconsistencies, cross-shop privilege exceptions, public claims inconsistent with the funding registry, and retry-classification gaps.

## Reproduced findings and corrections

| Finding | Evidence and root cause | Correction and status |
| --- | --- | --- |
| Missing admissions schema | Live `leads.assigned_at` and `communication_log` absent despite deployed code referencing them | Canonical migration `20261112200000` applied live; columns, private ledger and migration history independently queried |
| Missing PARIS and Studio schema | Live heartbeat, recovery function and five FK indexes absent | Canonical `20261112130000` then `20261112190000` applied in order; five indexes, heartbeat and service-role-only function verified |
| Staff tasks fail under session DB role | `authenticated` has no SELECT privilege on `public.tasks`; new page queried it anyway | Candidate uses hydrated server-only client after role guard, retains employee/application filters and admin-only unassigned branch; tests pass; source not deployed |
| Enrollment administrator rejection | Endpoint only accepted primary role `admin`, rejecting super administrators and bypassing shared role/MFA handling | Candidate uses explicit admin/super_admin shared API guard; deny-before-DB tests pass |
| Lesson progress authorization | New override action allowed unrestricted staff and checked only primary roles | Candidate uses explicit platform-admin API authorization before accessing progress; denial tests pass |
| API role parity | API guard omitted archived Host Shop role restriction and could retain secondary grants without a canonical profile | Candidate shares archived-scope enforcement, denies missing profiles and fails closed on archive lookup error; regressions pass |
| Cross-shop organization-admin exception | Host Shop selection, current context, previews and supervisor checks treated organization admins as global platform admins | Candidate reserves global selection/overrides for admin/super_admin across complete affected Host Shop boundary; organization admins retain approved own-membership access; regressions and independent source re-review pass |
| Publishing authorizes ordinary staff | `apiRequireAdmin` includes staff, but production deployment permission is platform-admin-only | Candidate publishing GET/POST use explicit admin/super_admin guard; denied sessions cannot call publishing/DB functions in tests |
| Restored hubs revive unsupported claims | Live CNA hub claimed ETPL listing, CDL listed WIOA ITA, barber promised WIOA RTI and paid OJT from day one, contrary to verified registry | Candidate removes those claims, retains verified CDL WRG with participant authorization, and conditions shop wages on placement/employment |
| Missing workforce hub | Live `/workforce-training-indianapolis` returned 404 although restored program breadcrumbs target it | Candidate restores an actual page with pathway links and conditional funding information; render test passes |
| Checkpoint credential failures retry | Underscore-delimited `PRIVATE_CHECKPOINT_READ_HTTP_401/403` did not match authorization regex | Candidate classifies checkpoint read/write 401/403 as terminal authorization; retains UUID false-positive regression |

## Production verification performed

At 02:28 Eastern, Marketing, Admin and LMS version endpoints all returned `5083648065817eff880b0cf690f7266ea41847e3`. The reviewed base is `e49989569aeb7e907732dc3d272ed9cc735daa03`; these are different snapshots. Health 200 means basic configuration/dependency reachability, not functional acceptance.

The four Indianapolis CNA/HVAC/CDL/barber hubs respond 200; the workforce hub still returns 404 until the candidate is released. Unauthenticated Admin enrollment API responds 401. No payments were captured, applicants enrolled, student progress changed, outreach sent, repair tasks replayed, or host memberships changed during verification.

Phone database check: zero retired-number destinations and one approved administrator forwarding destination. This does not establish an actual successful telephone transfer.

Database verification after migration: all three original versions recorded; five indexes present; heartbeat and admissions assignment column present; communication ledger exists, RLS enabled, no anon/authenticated read grant; recovery function executable by service_role and not anon/authenticated. MCP application receipts are mirrored by three no-op migration files so later migration history checks do not report unmatched remote versions or replay the obsolete integer-returning function.

Post-change health advisors: no findings. Security advisors retain pre-existing categories for RLS without policy, one authenticated security-definer function warning, and MFA options; the new private communication ledger intentionally has no client policy. This is not a full security clearance.

## Test and review evidence

- 35 selected Vitest files: 257 tests passed, zero failures, covering current corrections, historical utility tests, workbook APIs/saving, tenant routing, voicemail, admissions, role boundaries and repair-state logic.
- Node suites for owned-model verifier, canonical reconciliation and caption-key ownership: 23 tests passed.
- Additional API-guard tests and final whole-app checks are recorded in the PR validation receipt.
- Public-claims, Dev Studio claims, container-contract, route-auth and migration-lint checks passed. The route-auth gate still baselines 340 existing mutating routes; this is not evidence those routes were individually secured.
- Independent read-only reviewers checked historical current-source boundaries and re-reviewed the security corrections. They did not certify production.
- Browser acceptance could not run: local Chromium was absent and its download failed. Failed browser-start attempts are infrastructure failures, not counted as website defects or passes.
- Local Marketing initially compiled but prerendering failed because public Supabase configuration was absent. Build retried with the actual publishable project configuration. No dummy credentials or bypasses were introduced.

## Open acceptance and operational gaps

1. Source candidate must pass required checks, protected review/merge and Google release; confirm exact live SHA on every affected service afterward.
2. Actual owned-model verification run [43384532953](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/43384532953) failed with `ownedModel.status=request_failed` after the invoker fix merged. Studio also reports `stateTransferVerified=false`. No root cause is inferred from the generic error alone.
3. A green PARIS run [43384927029](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/43384927029) only completed monitor work; prepare/publish/validate were skipped and the response was `NO_ELIGIBLE_REPAIR_IN_SCANNED_QUEUE`, dispatched 0. The live ledger remains 243 blocked repairs. No genuine autonomous repair release is accepted from that run.
4. Authenticated cross-shop API denial, actual student workbook persistence/playback, payment and full-application gating, notification delivery and staff UI need safe authenticated acceptance fixtures and production observations. Unit tests do not replace those checks.
5. Credential removal from current files does not remove historical exposure or prove rotation. No history rewrite or credential invalidation was performed.
6. Existing E2E triage documents missing/retired payment callers and test-environment requirements. Do not restore retired payment providers or perform a charge merely to make a test green; verify the current supported checkout journey.

## Pull request inventory

All entries below were merged when fetched. The table records review scope rather than treating every merged PR as accepted live.

| PR | Original change | Review assessment |
| --- | --- | --- |
| [#2596](https://github.com/elevate-for-humanity/Elevate-lms/pull/2596) | fix(paris): verify owned model from GitHub with a workflow-minted invoker identity | Merged; actual runtime verification run 43384532953 still fails request_failed; not accepted. |
| [#2595](https://github.com/elevate-for-humanity/Elevate-lms/pull/2595) | Remove committed credentials/PII; archive root audit reports and duplicate configs | Current-tree cleanup merged; history and credential rotation remain separate unverified obligations. |
| [#2594](https://github.com/elevate-for-humanity/Elevate-lms/pull/2594) | Admissions review tasks: inherit owner; show unassigned queue to admins | Task visibility service-role/scoping defect corrected with denial and admin/staff tests; not deployed. |
| [#2593](https://github.com/elevate-for-humanity/Elevate-lms/pull/2593) | Fix caption renewal, auth retry classification, canonical drift, sitemap and GA build arg | Caption and canonical release Node tests pass; checkpoint 401/403 classifier gap corrected in candidate. |
| [#2592](https://github.com/elevate-for-humanity/Elevate-lms/pull/2592) | Admissions automation, status emails, route-auth ratchet, PARIS verify error codes | Missing admissions schema applied; logging and lead assignment prerequisites verified; end-to-end admission not accepted. |
| [#2591](https://github.com/elevate-for-humanity/Elevate-lms/pull/2591) | Fix #2586/#2587 merge overlap on main + Devin Review fixes | Merge-overlap correction confirmed in source; migration definitions applied and permissions checked. |
| [#2590](https://github.com/elevate-for-humanity/Elevate-lms/pull/2590) | test(e2e): per-app Playwright projects, origin-aware global setup, desktop-chrome gate | Test topology reviewed; four public hubs respond; remaining workforce hub and funding regressions corrected in candidate; browser acceptance blocked. |
| [#2588](https://github.com/elevate-for-humanity/Elevate-lms/pull/2588) | fix(workbooks): chapter review in any order, 3D hands-on stations, admin lesson overrides | Workbook regressions pass; enrollment and progress authorization gaps corrected in candidate; real learner saving unverified. |
| [#2587](https://github.com/elevate-for-humanity/Elevate-lms/pull/2587) | Voicemail Speech fallback, PARIS/Studio FK indexes + repair requeue fn, Course Builder deep health, ops scripts, Dev Studio workflows | Studio and voicemail source reviewed; missing indexes applied; voicemail tests pass, actual call not tested. |
| [#2586](https://github.com/elevate-for-humanity/Elevate-lms/pull/2586) | Course Builder deep health, PARIS in-flight timeout recovery + heartbeat watchdog, build diagnostics | Recovery source reviewed; missing migration applied; 243 blocked repairs remain. |
| [#2580](https://github.com/elevate-for-humanity/Elevate-lms/pull/2580) | fix: cron auth, admin training/performance, stale forwarding number, builder tenant hosts, mobile mail layout | Cron, phone and tenant routing source reviewed; phone DB destinations checked; actual call/mobile behavior not accepted. |
| [#408](https://github.com/elevate-for-humanity/Elevate-lms/pull/408) | fix: restrict Dev Studio to admin/platform_operator roles only | Historical source/path review; current implementation may supersede original paths. Authenticated live behavior not certified. |
| [#407](https://github.com/elevate-for-humanity/Elevate-lms/pull/407) | fix: unify Workflows + Course Builder into Dev Studio | Historical source/path review; current implementation may supersede original paths. Authenticated live behavior not certified. |
| [#406](https://github.com/elevate-for-humanity/Elevate-lms/pull/406) | fix: QA scan resilience + dead code cleanup | Historical source/path review; current implementation may supersede original paths. Authenticated live behavior not certified. |
| [#405](https://github.com/elevate-for-humanity/Elevate-lms/pull/405) | Add testing skill for Admin Dev Studio panels | Historical source/path review; current implementation may supersede original paths. Authenticated live behavior not certified. |
| [#404](https://github.com/elevate-for-humanity/Elevate-lms/pull/404) | fix: add platform_secrets migration + reconcile dev studio schema mismatches | Historical source/path review; current implementation may supersede original paths. Authenticated live behavior not certified. |
| [#403](https://github.com/elevate-for-humanity/Elevate-lms/pull/403) | fix: container panel, hero banner, branding, apprentice login redirect | Historical source/path review; current implementation may supersede original paths. Authenticated live behavior not certified. |
| [#402](https://github.com/elevate-for-humanity/Elevate-lms/pull/402) | fix: restore dev-studio guard with direct role check | Historical source/path review; current implementation may supersede original paths. Authenticated live behavior not certified. |
| [#401](https://github.com/elevate-for-humanity/Elevate-lms/pull/401) | fix: remove platform_operator guard from dev-studio layout | Historical source/path review; current implementation may supersede original paths. Authenticated live behavior not certified. |
| [#400](https://github.com/elevate-for-humanity/Elevate-lms/pull/400) | fix: ensure super_admin bypasses platform operator check and fix admin API auth guard | Historical source/path review; current implementation may supersede original paths. Authenticated live behavior not certified. |
| [#376](https://github.com/elevate-for-humanity/Elevate-lms/pull/376) | fix: favicon, OG preview metadata, and admin login branding | Historical source/path review; current implementation may supersede original paths. Authenticated live behavior not certified. |
| [#375](https://github.com/elevate-for-humanity/Elevate-lms/pull/375) | fix: Studio AI prompt + migration fixes (createCourse, workflow_templates, HNSW) | Historical source/path review; current implementation may supersede original paths. Authenticated live behavior not certified. |
| [#374](https://github.com/elevate-for-humanity/Elevate-lms/pull/374) | fix: Studio audit — createCourse tool, multi-tenant isolation, seed tables | Historical source/path review; current implementation may supersede original paths. Authenticated live behavior not certified. |
| [#373](https://github.com/elevate-for-humanity/Elevate-lms/pull/373) | fix: DevContainer panel loads in production — hydrate secrets + local fallback | Historical source/path review; current implementation may supersede original paths. Authenticated live behavior not certified. |
| [#365](https://github.com/elevate-for-humanity/Elevate-lms/pull/365) | fix: Dev Studio empty states, health endpoint, devcontainer fallback | Historical source/path review; current implementation may supersede original paths. Authenticated live behavior not certified. |
| [#363](https://github.com/elevate-for-humanity/Elevate-lms/pull/363) | fix: grant super_admin DevStudio access regardless of tenant | Historical source/path review; current implementation may supersede original paths. Authenticated live behavior not certified. |
| [#362](https://github.com/elevate-for-humanity/Elevate-lms/pull/362) | fix: wire orphan routes into navigation, remove redirect band-aids | Historical source/path review; current implementation may supersede original paths. Authenticated live behavior not certified. |
| [#361](https://github.com/elevate-for-humanity/Elevate-lms/pull/361) | fix: orphan route redirects, HVAC activation, training_modules LMS integration | Historical source/path review; current implementation may supersede original paths. Authenticated live behavior not certified. |
| [#360](https://github.com/elevate-for-humanity/Elevate-lms/pull/360) | feat: add trade-aware Host Shop Board at /partner/board | Historical source/path review; current implementation may supersede original paths. Authenticated live behavior not certified. |
| [#359](https://github.com/elevate-for-humanity/Elevate-lms/pull/359) | fix: P0–P2 audit remediation — migrations, redirect consolidation, legacy table migration | Historical source/path review; current implementation may supersede original paths. Authenticated live behavior not certified. |
| [#357](https://github.com/elevate-for-humanity/Elevate-lms/pull/357) | fix: enrollment, application & onboarding flow bugs | Historical source/path review; current implementation may supersede original paths. Authenticated live behavior not certified. |
| [#356](https://github.com/elevate-for-humanity/Elevate-lms/pull/356) | fix: dashboard bugs — progress bars, billing URL, partner scoping, portal redirect loop, portals page | Historical source/path review; current implementation may supersede original paths. Authenticated live behavior not certified. |
| [#352](https://github.com/elevate-for-humanity/Elevate-lms/pull/352) | style: update Dev Studio pages to match admin dashboard design system | Historical source/path review; current implementation may supersede original paths. Authenticated live behavior not certified. |
| [#350](https://github.com/elevate-for-humanity/Elevate-lms/pull/350) | fix: remove BuildKit syntax directive from LMS Dockerfile | Historical source/path review; current implementation may supersede original paths. Authenticated live behavior not certified. |
| [#349](https://github.com/elevate-for-humanity/Elevate-lms/pull/349) | feat: build autonomous Elevate AI Dev Studio OS | Historical source/path review; current implementation may supersede original paths. Authenticated live behavior not certified. |
| [#346](https://github.com/elevate-for-humanity/Elevate-lms/pull/346) | fix(heroes): real Pexels videos for beauty/culinary programs + fix nail-tech hero mapping | Historical source/path review; current implementation may supersede original paths. Authenticated live behavior not certified. |
| [#345](https://github.com/elevate-for-humanity/Elevate-lms/pull/345) | feat(nav): wire 248 orphaned pages into header + footer, deduped at source | Historical source/path review; current implementation may supersede original paths. Authenticated live behavior not certified. |
| [#344](https://github.com/elevate-for-humanity/Elevate-lms/pull/344) | chore: dead code cleanup + fix AIInstructorWidget muted refetch bug | Historical source/path review; current implementation may supersede original paths. Authenticated live behavior not certified. |
| [#343](https://github.com/elevate-for-humanity/Elevate-lms/pull/343) | fix: resolve LMS fetchMessage TDZ crash and next/image quality config | Historical source/path review; current implementation may supersede original paths. Authenticated live behavior not certified. |
| [#342](https://github.com/elevate-for-humanity/Elevate-lms/pull/342) | fix: correct import for barber apprentice apply page (crash fix) | Historical source/path review; current implementation may supersede original paths. Authenticated live behavior not certified. |
| [#341](https://github.com/elevate-for-humanity/Elevate-lms/pull/341) | refactor: consolidate duplicated utility functions into shared modules | Historical source/path review; current implementation may supersede original paths. Authenticated live behavior not certified. |
| [#340](https://github.com/elevate-for-humanity/Elevate-lms/pull/340) | Improve error handling: replace silently swallowed catches with logging | Historical source/path review; current implementation may supersede original paths. Authenticated live behavior not certified. |
| [#339](https://github.com/elevate-for-humanity/Elevate-lms/pull/339) | test: add unit tests for 8 previously-untested lib modules | Historical source/path review; current implementation may supersede original paths. Authenticated live behavior not certified. |
| [#338](https://github.com/elevate-for-humanity/Elevate-lms/pull/338) | fix: remove hardcoded credentials, restrict CORS, fix query injection, add video API auth | Historical source/path review; current implementation may supersede original paths. Authenticated live behavior not certified. |
