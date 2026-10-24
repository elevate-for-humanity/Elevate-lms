# Workspace, route, and Supabase audit — 2026-10-24

Verdict: **partial; not a certification that all 171 paths or every production button works.**

Baseline: `8212d2b97e11bae0b19abefd0bd3c85496098f93`. Repairs: PR #2117, initial commit `93883da8cc3b79db20e6b2be1923d21cbe90704a`. Code is awaiting required checks and deployment at report preparation.

## Scope and counts

| Inventory | Count | Evidence limit |
|---|---:|---|
| Native button declarations | 170 | Across 61 transitive UI modules rooted at DashboardShell, UnifiedCourseBuilder, and StudioCommandWorkspace. Declarations include local layout controls, not just API actions; dynamic repetitions and custom Button components are not a runtime button count. |
| API route patterns | 53 | Includes interpolated route IDs; every pattern resolves to an Admin route module. 81 exported method handlers. |
| Static navigation destinations | 58 | Four entry files; each resolves to an Admin page module after repairs. |
| Extracted server queries | 310 | 138 route/service modules, including immediate service imports and the Ultimate release service. Literal table, select/filter/order columns, and resolved object writes; dynamic expressions, joins, deeper calls, and row-level semantics need additional checks. |
| Supabase tables inspected | 81 | All requested table names exist in active project cuxzzpsyufcewtmicszk. Includes the now-removed rollback snapshot query. No customer rows or secret values exported. |

The earlier 171 count has no supplied path manifest. It cannot be reconciled honestly by treating button declarations as unique website routes. The JSON companion contains the exact file/line inventory.

## Findings and repairs

| Finding | Consequence | Repair / current state |
|---|---|---|
| Nested editor used viewport breakpoints despite a narrow desktop pane | Tiny stacked panels; compact controls hidden | Container measurement drives compact selection through shared ResizableWorkspace, preserving mounted editor/player state. Regression tests pass; new layout not yet live-verified. |
| Job feed UI expected different count/provider/result fields | Incorrect status and false success on failed import | UI follows GET count/sources/configured and POST ok/imported.total/errors; HTTP failures and partial errors visible. Mock boundary tests; no live import triggered. |
| /api/sentry-test, /import, /automation linked without handlers | Dead utility/navigation actions | Monitoring links replace Sentry test. Redundant dead import and automation entries removed; existing Data Import and Workflows entries retained. Meetings & Calendar points to /phone/meetings. |
| saveCourseLesson wrote a nonexistent metadata column | Manual save failed; LMS compliance settings went to the wrong shape | Nine values map to existing course_lessons columns: required_artifacts, domain_key, hour_category, evidence_type, delivery_method, requires_instructor_signoff, instructor_requirement, minimum_seat_time_minutes, fieldwork_eligible. Create/update tests reproduce prior failure and pass after fix. |
| saveCourseModule expected missing course_modules.metadata | Module authoring settings could not save | Additive migration 20261024183332_course_module_authoring_settings applied and verified. Existing module_completion_rules remain the progression authority. No business records changed. |
| Task rollback queried nonexistent snapshot fields and never restored files | Could falsely mark a task rolled_back | Removed false state mutation. Authenticated endpoint returns 501 TASK_ROLLBACK_UNAVAILABLE. Actual automatic restoration remains unavailable and is not counted as working. |

## Database ownership and publication

The Ultimate publish route delegates to UltimateReleaseService, which persists canonical course_modules and course_lessons, records ultimate_release_versions, and updates courses. LMS course content reads these canonical course tables. Live catalog inspection confirmed foreign keys from lessons to courses/modules, modules to courses, courses to programs, build records to courses, lesson-build records to builds, and release records to courses/builds. This verifies schema relationships and source intent; no production course was published during this audit.

The direct devstudio_append_log RPC exists with arguments p_job_id uuid and p_lines text[]. No extracted literal column mismatch remained after the repairs and additive migration. This static result does not certify arbitrary runtime payloads, join expressions, authorization, or tenant ownership for every possible request.

Security advisories were inspected before and after the migration. No course_modules/course_lessons security advisory was reported. Existing project notices include RLS-enabled tables without policies and limited MFA options; broad policy changes were outside this repair. Existing performance notices include multiple permissive policies and unused indexes. See [Supabase multiple-policy guidance](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies). No RLS policy, grant, or authentication setting was changed.

## Verification

- 24 focused test files, 105 tests passed, including the new layout, job-feed, lesson-storage, and rollback-boundary cases plus portal/PWA/release regression suites.
- Changed TypeScript source files passed ESLint; existing Pages-directory configuration warning remains.
- Admin production compilation, static generation, and generated-route typecheck passed before the final lesson-storage/rollback edits. Fresh final Admin typecheck is queued behind the repository's shared validation lock at report preparation. CI build/type checks are required before merge.
- Studio and PWA architecture guards passed earlier in this repair; no new shell or service-worker cache path was introduced.
- Side-by-side diff review performed. The change-review companion records exact differing lines and deliberate-change classifications.
- Anonymous HTTP sweep: 110 requests, including 58 page destinations, 49 static API URL probes, and three PWA manifests. Page requests reached the login boundary; that is not authenticated-page success. API probes reached 401 except initial timeouts recorded below and in JSON. No credentials or mutation payloads were sent.
- Browser checks used the existing Admin session. Subsequent broad authenticated navigation encountered repeated browser timeouts and a browser runtime reset; uncompleted destinations remain unverified.

PWA manifests returned 200 with Admin start_url /dashboard, Learner /lms/dashboard, and Apprentice /apprentice on their correct hosts. Actual install, offline recovery, and device resize behavior remain unverified.

## Live portal navigation observations

| Portal | Requested destination | Observed result |
|---|---|---|
| Marketing | https://www.elevateforhumanity.org/ | Rendered; Students/My Courses link to app /lms/dashboard; Apply links to marketing /apply/student; Sign In to app /login |
| Student | https://app.elevateforhumanity.org/lms/dashboard | Rendered Student PWA admin preview; return links to Admin students and dashboard |
| Apprentice | https://app.elevateforhumanity.org/apprentice | Rendered Apprentice PWA admin preview; return links to Admin students and dashboard |
| Employer | https://app.elevateforhumanity.org/employer/dashboard | Redirected this admin account to admin /employers; expected by source; Employers rendered |
| Parent | https://app.elevateforhumanity.org/parent-portal/dashboard | Rendered Guardian access oversight; Admin student search return link |
| Workforce | https://app.elevateforhumanity.org/workforce/dashboard | Rendered Workforce Overview |
| Program Holder | https://app.elevateforhumanity.org/program-holder/dashboard | Rendered Program Holder PWA |
| Creator | https://app.elevateforhumanity.org/creator/products | Access-gated redirect to /lms/dashboard?notice=creator-access-required; creator product workflow not verified |
| Admin | https://admin.elevateforhumanity.org/dashboard | Rendered dashboard; read-only refresh and install-help navigation checked |
| Instructor | https://admin.elevateforhumanity.org/instructor/dashboard | Rendered Instructor Dashboard; initial timeout resolved on one recheck |
| Staff | https://admin.elevateforhumanity.org/staff-portal/dashboard | Rendered Staff Dashboard; initial timeout resolved on one recheck |
| Testing | https://admin.elevateforhumanity.org/testing-center | Rendered Testing Center |
| Workforce Board | https://www.elevateforhumanity.org/workforce-board/dashboard | Rendered Regional workforce dashboard |
| Case Manager | https://www.elevateforhumanity.org/case-manager/dashboard | Rendered Case Manager Dashboard |
| Provider | https://www.elevateforhumanity.org/provider/dashboard | Rendered Training provider operations |
| Host Shop | https://app.elevateforhumanity.org/host-shop/dashboard | Registry/source mapping inspected; a specific shop was not selected; destination not live-verified |
| Course Builder | https://admin.elevateforhumanity.org/studio/courses | Rendered; Courses, Credential Registry and Media Library tabs checked; no production generation/publish action triggered |

## API inventory

“401 boundary” confirms anonymous protection only. Dynamic routes were resolved in source and were not invoked using fabricated IDs. Table lists below are direct route references; delegated query locations are in the JSON companion.

| API path | Methods | Direct tables | Anonymous observation |
|---|---|---|---|
| `/api/admin/select-host-shop` | POST, GET | shops | 401 boundary |
| `/api/admin/publish-website` | GET, POST | audit_logs, programs, testimonials | 401 boundary |
| `/api/admin/program-integrity` | GET | completion_rules, courses, program_integrity, programs | 401 boundary |
| `/api/jobs/government-feed` | GET, POST | government_job_feed | 401 boundary |
| `/api/admin/site-health` | GET | Delegated service / external operation | 401 boundary |
| `/api/admin/dev-studio/embed-check` | GET | Delegated service / external operation | 401 boundary |
| `/api/voice/natural` | POST | Delegated service / external operation | 401 boundary |
| `/api/admin/dev-studio/tasks` | GET, POST | agentic_build_projects, agentic_build_runs, ai_tasks | 401 boundary |
| `/api/admin/dev-studio/tasks/[dynamic]/approve` | POST | ai_tasks | Dynamic path; source only |
| `/api/admin/dev-studio/jobs` | GET, POST, PATCH | devstudio_jobs | 401 boundary |
| `/api/admin/dev-studio/runs/[dynamic]` | GET | ai_tasks, studio_run_artifacts, studio_run_events, studio_run_step_dependencies, studio_run_steps, studio_runs | Dynamic path; source only |
| `/api/admin/dev-studio/conversations` | GET, POST, PUT, DELETE | studio_conversations | 401 boundary |
| `/api/admin/dev-studio/upload` | POST, GET | devstudio_documents | 401 boundary |
| `/api/admin/ai-assistant/approve` | POST | audit_logs, ellie_pending_actions | 401 boundary |
| `/api/admin/dev-studio/shell` | POST, GET | platform_secrets | 401 boundary |
| `/api/admin/dev-studio/git` | GET, POST | platform_secrets | 401 boundary |
| `/api/admin/dev-studio/devcontainer` | GET, PUT | Delegated service / external operation | 401 boundary |
| `/api/admin/dev-studio/env` | GET, POST, DELETE | app_secrets, platform_secrets | 401 boundary |
| `/api/admin/dev-studio/container-env` | GET, POST, DELETE | Delegated service / external operation | 401 boundary |
| `/api/admin/dev-studio/services` | GET, POST | Delegated service / external operation | 401 boundary |
| `/api/admin/platform-secrets` | GET, POST, DELETE, PATCH | platform_secrets | 401 boundary |
| `/api/admin/monitoring/errors` | GET | audit_failures | 401 boundary |
| `/api/admin/workflows` | GET, POST | workflow_steps, workflow_triggers, workflows | 401 boundary |
| `/api/admin/workflows/run` | POST | Delegated service / external operation | 401 boundary |
| `/api/admin/dev-studio/config` | GET | platform_settings | 401 boundary |
| `/api/admin/dev-studio/health` | GET | Delegated service / external operation | 401 boundary |
| `/api/paris/supervision` | GET | paris_autopilot_policy, paris_code_repairs, paris_runtime_events, ultimate_build_jobs | 401 boundary |
| `/api/admin/ultimate-course-builder/segments` | GET | ultimate_course_builds, ultimate_lesson_builds, ultimate_lesson_steps | 401 boundary |
| `/api/admin/ultimate-course-builder` | GET, POST | courses, studio_runs, ultimate_artifact_versions, ultimate_artifacts, ultimate_course_builds | 401 boundary |
| `/api/admin/ultimate-course-builder/review` | POST | ultimate_artifact_versions, ultimate_artifacts, ultimate_review_decisions | 401 boundary |
| `/api/admin/courses/health` | GET | course_lessons, course_modules, courses | 401 boundary |
| `/api/admin/ultimate-course-builder/checkpoint` | GET, POST | ultimate_artifact_versions, ultimate_artifacts, ultimate_build_jobs, ultimate_course_builds, ultimate_lesson_builds, ultimate_lesson_steps | 401 boundary |
| `/api/admin/course-builder/registry` | GET, POST | courses, programs | 401 boundary |
| `/api/admin/course-builder` | GET, POST | ai_tasks, course_lessons, course_modules, course_videos, courses, credential_registry, paid_inference_artifacts, programs | 401 boundary |
| `/api/admin/media-assets` |  | Delegated service / external operation | 401 boundary |
| `/api/admin/media-studio/image` | POST | Delegated service / external operation | 401 boundary |
| `/api/admin/media-studio/commercial` | POST | Delegated service / external operation | 401 boundary |
| `/api/admin/media-assets/[dynamic]` |  | Delegated service / external operation | Dynamic path; source only |
| `/api/admin/dev-studio/browser/session` | GET, POST | Delegated service / external operation | 401 boundary |
| `/api/admin/dev-studio/browser/action` | GET, DELETE, POST | Delegated service / external operation | 401 boundary |
| `/api/admin/videos/upload` | POST | course_lessons, course_videos, licensed_media_entitlements, videos | 401 boundary |
| `/api/admin/dev-studio/tasks/[dynamic]/cancel` | POST | ai_approvals, ai_task_logs, ai_task_steps, ai_tasks | Dynamic path; source only |
| `/api/admin/dev-studio/browser/agent` | POST | ai_task_logs, ai_task_steps, ai_tasks, studio_runs | 401 boundary |
| `/api/admin/courses` | GET, POST | courses, programs | 401 boundary |
| `/api/admin/dev-studio/programs` | GET | program_enrollments, programs | 401 boundary |
| `/api/admin/courses/generate/parse` | POST | profiles | 401 boundary |
| `/api/admin/courses/generate` | POST | profiles | 401 boundary |
| `/api/admin/ultimate-course-builder/autopilot` | POST | ultimate_build_jobs | 401 boundary |
| `/api/admin/ultimate-course-builder/run` | POST | ultimate_build_jobs, ultimate_course_builds | 401 boundary |
| `/api/admin/ultimate-course-builder/pause` | POST | ultimate_course_builds | 401 boundary |
| `/api/admin/ultimate-course-builder/publish` | POST | Delegated service / external operation | 401 boundary |
| `/api/admin/dev-studio/plugins/health` | GET | Delegated service / external operation | 401 boundary |
| `/api/admin/dev-studio/intelligence` | GET | admin_alerts, ai_tasks, student_risk_status | 401 boundary |

## Static page inventory

All 58 page modules exist. These anonymous requests reached authentication; only the separately listed browser observations establish rendered authenticated pages.

| Path | Source handler | Anonymous result |
|---|---|---|
| `/` | `apps/admin/app/page.tsx` | 200; login boundary |
| `/activity` | `apps/admin/app/activity/page.tsx` | 200; login boundary |
| `/analytics/traffic` | `apps/admin/app/analytics/traffic/page.tsx` | 200; login boundary |
| `/api-keys` | `apps/admin/app/api-keys/page.tsx` | 200; login boundary |
| `/applications` | `apps/admin/app/applications/page.tsx` | 200; login boundary |
| `/audit-logs` | `apps/admin/app/audit-logs/page.tsx` | 200; login boundary |
| `/compliance` | `apps/admin/app/compliance/page.tsx` | 200; login boundary |
| `/compliance-audit` | `apps/admin/app/compliance-audit/page.tsx` | 200; login boundary |
| `/course-import` | `apps/admin/app/course-import/page.tsx` | 200; login boundary |
| `/dashboard` | `apps/admin/app/dashboard/page.tsx` | 200; login boundary |
| `/data-import` | `apps/admin/app/data-import/page.tsx` | 200; login boundary |
| `/docs` | `apps/admin/app/docs/page.tsx` | 200; login boundary |
| `/documents/review` | `apps/admin/app/documents/review/page.tsx` | 200; login boundary |
| `/enrollment-jobs` | `apps/admin/app/enrollment-jobs/page.tsx` | 200; login boundary |
| `/ferpa` | `apps/admin/app/ferpa/page.tsx` | 200; login boundary |
| `/funding` | `apps/admin/app/funding/page.tsx` | 200; login boundary |
| `/governance` | `apps/admin/app/governance/page.tsx` | 200; login boundary |
| `/governance/security` | `apps/admin/app/governance/security/page.tsx` | 200; login boundary |
| `/hours-export` | `apps/admin/app/hours-export/page.tsx` | 200; login boundary |
| `/integrations` | `apps/admin/app/integrations/page.tsx` | 200; login boundary |
| `/integrations/gemini` | `apps/admin/app/integrations/gemini/page.tsx` | 200; login boundary |
| `/license-requests` | `apps/admin/app/license-requests/page.tsx` | 200; login boundary |
| `/licenses` | `apps/admin/app/licenses/page.tsx` | 200; login boundary |
| `/migrations` | `apps/admin/app/migrations/page.tsx` | 200; login boundary |
| `/monitoring` | `apps/admin/app/monitoring/page.tsx` | 200; login boundary |
| `/monitoring/setup` | `apps/admin/app/monitoring/setup/page.tsx` | 200; login boundary |
| `/operations` | `apps/admin/app/operations/page.tsx` | 200; login boundary |
| `/operations/infrastructure-costs` | `apps/admin/app/operations/infrastructure-costs/page.tsx` | 200; login boundary |
| `/partners` | `apps/admin/app/partners/page.tsx` | 200; login boundary |
| `/payout-queue` | `apps/admin/app/payout-queue/page.tsx` | 200; login boundary |
| `/phone` | `apps/admin/app/phone/page.tsx` | 200; login boundary |
| `/phone/email` | `apps/admin/app/phone/email/page.tsx` | 200; login boundary |
| `/phone/meetings` | `apps/admin/app/phone/meetings/page.tsx` | 200; login boundary |
| `/portals` | `apps/admin/app/portals/page.tsx` | 200; login boundary |
| `/program-holder-documents` | `apps/admin/app/program-holder-documents/page.tsx` | 200; login boundary |
| `/program-holders` | `apps/admin/app/program-holders/page.tsx` | 200; login boundary |
| `/programs` | `apps/admin/app/programs/page.tsx` | 200; login boundary |
| `/promo-codes` | `apps/admin/app/promo-codes/page.tsx` | 200; login boundary |
| `/provider-applications` | `apps/admin/app/provider-applications/page.tsx` | 200; login boundary |
| `/referrals` | `apps/admin/app/referrals/page.tsx` | 200; login boundary |
| `/reports` | `apps/admin/app/reports/page.tsx` | 200; login boundary |
| `/review-queue` | `apps/admin/app/review-queue/page.tsx` | 200; login boundary |
| `/settings` | `apps/admin/app/settings/page.tsx` | 200; login boundary |
| `/shops` | `apps/admin/app/shops/page.tsx` | 200; login boundary |
| `/store` | `apps/admin/app/store/page.tsx` | 200; login boundary |
| `/students` | `apps/admin/app/students/page.tsx` | 200; login boundary |
| `/studio` | `apps/admin/app/studio/page.tsx` | 200; login boundary |
| `/studio/browser` | `apps/admin/app/studio/browser/page.tsx` | 200; login boundary |
| `/studio/courses` | `apps/admin/app/studio/courses/page.tsx` | 200; login boundary |
| `/studio/workflows` | `apps/admin/app/studio/workflows/page.tsx` | 200; login boundary |
| `/submissions` | `apps/admin/app/submissions/page.tsx` | 200; login boundary |
| `/system-health` | `apps/admin/app/system-health/page.tsx` | 200; login boundary |
| `/system/jobs` | `apps/admin/app/system/jobs/page.tsx` | 200; login boundary |
| `/system/webhooks` | `apps/admin/app/system/webhooks/page.tsx` | 200; login boundary |
| `/tenants` | `apps/admin/app/tenants/page.tsx` | 200; login boundary |
| `/website-editor` | `apps/admin/app/website-editor/page.tsx` | 200; login boundary |
| `/wioa/documents` | `apps/admin/app/wioa/documents/page.tsx` | 200; login boundary |
| `/workone-queue` | `apps/admin/app/workone-queue/page.tsx` | 200; login boundary |

## Remaining acceptance gaps

- Reconcile the requested 171-path manifest against this scoped inventory; complete authenticated rendering and action checks for every included destination.
- Complete CI and final build/type validation, merge normally, then verify the actual Google Cloud revision/image and live SHA for the deployed repairs. Initial live checks showed Admin/marketing on b59a5571 and LMS on e047b01e, while main was 8212d2b9; those earlier SHAs are not current deployment proof.
- Perform production-safe end-to-end write-flow tests with identified disposable fixtures; imports, generated builds, course publication, payment, deletion, and real user changes were not triggered for testing.
- Implement a verified task restoration mechanism before enabling automatic rollback.
- Finish the separately documented Course Builder state unification: shared course/build/lesson/artifact selection and consistent draft-versus-approved preview policy. This patch does not claim that architecture is complete.
- Verify selected-shop access, Creator entitlement flow, installed-PWA behavior, and every role's row/tenant boundaries with appropriate test accounts.
