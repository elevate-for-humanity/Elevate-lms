# Workspace, route, and Supabase audit — 2026-10-24

Verdict: **partial; not a certification that all 171 paths or every production button works.**

Baseline: `8212d2b97e11bae0b19abefd0bd3c85496098f93`. Repairs: PR #2117, commit `6b7c3251de00a3b305ed00f8132ea05266f3e169`. PR #2117 merged as `cb038e3920232b5f673b6e7d802eab5b4f6f6e39`. Follow-up PR #2120 (`faa837d8`) adds navigation, OJT export, Operations, and Compliance repairs and is awaiting CI. PR #2117 is live on Admin as cb038e39 (revision 00278-vfn, 100% traffic). PR #2120 activation remains pending.

## Scope and counts

| Inventory | Count | Evidence limit |
|---|---:|---|
| Native button declarations | 170 | Across 61 transitive UI modules rooted at DashboardShell, UnifiedCourseBuilder, and StudioCommandWorkspace. Declarations include local layout controls, not just API actions; dynamic repetitions and custom Button components are not a runtime button count. |
| API route patterns | 53 | Includes interpolated route IDs; every pattern resolves to an Admin route module. 85 exported/re-exported method handlers. All 75 directly traced fetch methods match their route exports. |
| Static navigation destinations | 58 | Four entry files; each resolves to an Admin page module after repairs. |
| Extracted server queries | 311 | 138 route/service modules, including immediate service imports and the Ultimate release service. Literal table, select/filter/order columns, and resolved object writes; dynamic expressions, joins, deeper calls, and row-level semantics need additional checks. |
| Supabase tables inspected | 141 | All requested table names exist in active project cuxzzpsyufcewtmicszk. Includes the now-removed rollback snapshot query. No customer rows or secret values exported. |
| Additional page/helper queries | 153 | 61 modules; 73 table references. All literal columns inspected against the combined live metadata; dynamic filters also manually checked where repaired. |

The earlier 171 count has no supplied path manifest. It cannot be reconciled honestly by treating button declarations as unique website routes. The JSON companion contains the exact file/line inventory.

## Findings and repairs

| Finding | Consequence | Repair / current state |
|---|---|---|
| Nested editor used viewport breakpoints despite a narrow desktop pane | Tiny stacked panels; compact controls hidden | Container measurement drives compact selection through shared ResizableWorkspace, preserving mounted editor/player state. Regression tests pass. Live resize 45→40→45, close/open, 640px compact detection and Operations/Preview switching verified on cb038e39; no build action triggered. |
| Job feed UI expected different count/provider/result fields | Incorrect status and false success on failed import | UI follows GET count/sources/configured and POST ok/imported.total/errors; HTTP failures and partial errors visible. Mock boundary tests; no live import triggered. |
| /api/sentry-test, /import, /automation linked without handlers | Dead utility/navigation actions | Monitoring links replace Sentry test. Redundant dead import and automation entries removed; existing Data Import and Workflows entries retained. Meetings & Calendar points to /phone/meetings. |
| saveCourseLesson wrote a nonexistent metadata column | Manual save failed; LMS compliance settings went to the wrong shape | Nine values map to existing course_lessons columns: required_artifacts, domain_key, hour_category, evidence_type, delivery_method, requires_instructor_signoff, instructor_requirement, minimum_seat_time_minutes, fieldwork_eligible. Create/update tests reproduce the prior storage failure and pass after the fix. Missing or cross-course modules are rejected before writes; module and lesson edits are scoped to the selected course. |
| saveCourseModule expected missing course_modules.metadata | Module authoring settings could not save | Additive migration 20261024183332_course_module_authoring_settings applied and verified. Existing module_completion_rules remain the progression authority. No business records changed. |
| Task rollback queried nonexistent snapshot fields and never restored files | Could falsely mark a task rolled_back | Removed false state mutation. Authenticated endpoint returns 501 TASK_ROLLBACK_UNAVAILABLE. Actual automatic restoration remains unavailable and is not counted as working. |

## Follow-up findings in PR #2120

- **Hours Export** (`/hours-export`) redirected to the dashboard. Replaced with a real date/status form and `/api/admin/apprenticeships/hours/export` GET, backed by `loadAdminHours`: progress_entries, apprentices, programs, profiles, and hour_entries review reconciliation. Existing Student Hours and dashboard return links are explicit. Protected by the same admin/super_admin/staff boundary, rate limiting, filter validation, private/no-store headers, CSV formula/quote escaping, and export audit events. No live data export was triggered.
- **Document Tools** (`/docs`) counted profiles as documents. Removed misleading queries and added direct links to existing document review, WIOA documents, program-holder documents, and Compliance, with a dashboard return.
- **Operations** used nonexistent workflows.is_active and workflow_dead_letters.last_error. Mapped to status=active and error, matching the live schema and workflow scheduler.
- **Compliance** selected nonexistent age_group, auto_generated, submission_method, action_required, and deadline columns and unsupported embedded relations. Uses is_youth and exact participant counts, existing report/alert columns, preserved session RLS, and explicit unavailable states. Placement and credential rates remain unavailable pending reconciled outcome definitions; enrollment completion is not treated as credential attainment. Audit links now open /compliance-audit.
- Post-merge CI exposed a test reaching a hidden Operations pane in compact Course Builder mode. The regression now opens the pane and retains running-worker and publication assertions. Follow-up suite: four files, 18 tests pass.
- The legacy /api/admin/export/weekly-hours endpoint is not used by the new form. Inspection identified ignored shop filtering and zero-hour fallback defects in that older endpoint; these remain outside the repaired export contract and require follow-up before reuse.

## Database ownership and publication

The Ultimate publish route delegates to UltimateReleaseService, which persists canonical course_modules and course_lessons, records ultimate_release_versions, and updates courses. LMS course content reads these canonical course tables. Live catalog inspection confirmed foreign keys from lessons to courses/modules, modules to courses, courses to programs, build records to courses, lesson-build records to builds, and release records to courses/builds. Aggregate live-data checks found zero mismatched course IDs in lesson/module, release/build, and video-job/lesson joins. The LMS lesson page filters both lesson ID and course ID, and its previous/next/return links remain under that course. No production course was published during this audit.

The direct devstudio_append_log RPC exists with arguments p_job_id uuid and p_lines text[]. No extracted literal column mismatch remained after the repairs and additive migration. This static result does not certify arbitrary runtime payloads, join expressions, authorization, or tenant ownership for every possible request.

Security advisories were inspected before and after the migration. No course_modules/course_lessons security advisory was reported. Existing project notices include RLS-enabled tables without policies and limited MFA options; broad policy changes were outside this repair. Existing performance notices include multiple permissive policies and unused indexes. See [Supabase multiple-policy guidance](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies). No RLS policy, grant, or authentication setting was changed.

## Verification

- 24 focused test files, 108 tests passed, including the new layout, job-feed, lesson-storage, and rollback-boundary cases plus portal/PWA/release regression suites.
- Changed TypeScript source files passed ESLint; existing Pages-directory configuration warning remains.
- Final PR #2117 Admin production build and typecheck passed; its exact-head Admin and LMS CI builds passed before merge. The merged-main suite subsequently failed one compact-pane test, repaired in PR #2120. Follow-up initial typecheck passed; expanded final build and exact-head CI remain pending.
- Studio and PWA architecture guards passed earlier in this repair; no new shell or service-worker cache path was introduced.
- Side-by-side diff review performed. The change-review companion records exact differing lines and deliberate-change classifications.
- Anonymous HTTP sweep: 110 requests, including 58 page destinations, 49 static API URL probes, and three PWA manifests. Page requests reached the login boundary; that is not authenticated-page success. All 49 static API probes reached 401 after one recheck resolved two initial timeouts, which remain recorded in JSON. No credentials or mutation payloads were sent.
- Browser checks used the existing Admin session. After recovering from a browser runtime reset, all 58 navigation destinations were visited. The JSON and table below distinguish rendered pages, placeholder defects, and degraded data. Visits alone do not certify button mutations or other roles.

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
| Host Shop | https://app.elevateforhumanity.org/host-shop/dashboard | Rendered Host Shop PWA admin preview; Select Host Shop and Manage partners link to admin /partners; no shop selected |
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
| `/api/admin/media-assets` | POST, GET | Delegated service / external operation | 401 boundary |
| `/api/admin/media-studio/image` | POST | Delegated service / external operation | 401 boundary |
| `/api/admin/media-studio/commercial` | POST | Delegated service / external operation | 401 boundary |
| `/api/admin/media-assets/[dynamic]` | DELETE, PATCH | Delegated service / external operation | Dynamic path; source only |
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

## Latest runtime identity

Health checks at 19:29 UTC returned HTTP 200 and healthy/ready: Admin serves merged repair cb038e39 on revision elevate-admin-migration-00278-vfn. Google deployment logs confirm candidate health and 100% traffic. Marketing still serves b59a5571 and LMS e047b01e. Their cb038 releases were superseded by newer main requests; replacements are queued. Follow-up faa837d8 is not deployed yet. Runtime revisions are retained in the JSON companion.

## Remaining acceptance gaps

- Reconcile the requested 171-path manifest against this scoped inventory. All 58 inventoried navigation URLs were visited; production-safe mutation acceptance remains incomplete.
- Workflow Designer recheck resolved the initial AI-task warning: the live API returned 105 records (five general plus the displayed AI tasks) with only its documented latest-100-per-type limit. This is a bounded list, not full-history acceptance.
- Reconcile WIOA outcome records before enabling placement/credential rates; remediate the older unused weekly-hours export before reconnecting it.
- Complete PR #2120 CI and final build validation, merge normally, then verify the actual Google Cloud revision/image and live SHA for the deployed repairs. Initial live checks showed Admin/marketing on b59a5571 and LMS on e047b01e, while main was 8212d2b9; those earlier SHAs are not current deployment proof.
- Perform production-safe end-to-end write-flow tests with identified disposable fixtures; imports, generated builds, course publication, payment, deletion, and real user changes were not triggered for testing.
- Implement a verified task restoration mechanism before enabling automatic rollback.
- Finish the separately documented Course Builder state unification: shared course/build/lesson/artifact selection and consistent draft-versus-approved preview policy. This patch does not claim that architecture is complete.
- Verify selected-shop access, Creator entitlement flow, installed-PWA behavior, and every role's row/tenant boundaries with appropriate test accounts.

## Authenticated page observations

| Requested path | Observed destination | Result |
|---|---|---|
| `/data-import` | `/data-import` | Data Import; rendered |
| `/applications` | `/applications` | Applications; rendered |
| `/students` | `/students` | Students; rendered |
| `/programs` | `/programs` | Programs Management; rendered |
| `/funding` | `/funding` | Funding; rendered |
| `/documents/review` | `/documents/review` | Document Review; rendered |
| `/program-holders` | `/program-holders` | Program Holders; rendered |
| `/phone` | `/phone` | Elevate Communications Hub; rendered |
| `/phone/email` | `/phone/email` | Elevate Email; rendered |
| `/partners` | `/partners` | Approved Host Shop readiness; rendered |
| `/portals` | `/portals` | All portals; rendered |
| `/analytics/traffic` | `/analytics/traffic` | Website Traffic; rendered |
| `/reports` | `/reports` | Reports; rendered |
| `/compliance` | `/compliance` | Compliance Dashboard; rendered |
| `/website-editor` | `/website-editor` | Website Editor; rendered |
| `/system-health` | `/system-health` | System Health; rendered |
| `/operations/infrastructure-costs` | `/operations/infrastructure-costs` | Google Cloud & GPU Cost Control; rendered |
| `/wioa/documents` | `/wioa/documents` | WIOA Documents; rendered |
| `/submissions` | `/submissions` | External Submissions OS; rendered |
| `/program-holder-documents` | `/program-holder-documents` | Program Holder Documents; rendered |
| `/course-import` | `/course-import` | Course Import; rendered |
| `/migrations` | `/migrations` | Data Migrations; rendered |
| `/monitoring` | `/monitoring` | Monitoring; rendered |
| `/monitoring/setup` | `/monitoring/setup` | Monitoring Setup; rendered |
| `/activity` | `/activity` | Activity Feed; rendered |
| `/audit-logs` | `/audit-logs` | Audit Logs; rendered |
| `/compliance-audit` | `/compliance-audit` | Compliance Audit; rendered |
| `/enrollment-jobs` | `/enrollment-jobs` | Enrollment Jobs Monitor; rendered |
| `/payout-queue` | `/payout-queue` | Partner Payout Queue; rendered |
| `/review-queue` | `/review-queue` | Review Queue; rendered |
| `/workone-queue` | `/workone-queue` | WorkOne / Funding Queue; rendered |
| `/referrals` | `/referrals` | Agency Referrals; rendered |
| `/shops` | `/shops` | Shop Management; rendered |
| `/system/jobs` | `/system/jobs` | Background Jobs; rendered |
| `/system/webhooks` | `/system/webhooks` | Webhook Health; rendered |
| `/phone/meetings` | `/phone/meetings` | Team Meetings; rendered |
| `/provider-applications` | `/provider-applications` | Provider Applications; rendered |
| `/store` | `/store` | Store Management; rendered |
| `/licenses` | `/licenses` | Platform Licenses; rendered |
| `/license-requests` | `/license-requests` | License Requests; rendered |
| `/promo-codes` | `/promo-codes` | Promo Codes; rendered |
| `/api-keys` | `/api-keys` | API Keys; rendered |
| `/integrations` | `/integrations` | Communication; Scheduling; Payments; Data & CRM; Learning; rendered |
| `/operations` | `/operations` | Operations Hub; rendered |
| `/integrations/gemini` | `/integrations/gemini` | Google Gemini AI; rendered |
| `/governance` | `/governance` | Governance; rendered |
| `/governance/security` | `/governance/security` | Security & Data Protection Statement; rendered |
| `/ferpa` | `/ferpa` | FERPA Compliance; rendered |
| `/settings` | `/settings` | Settings; rendered |
| `/tenants` | `/tenants` | Tenant Management; rendered |
| `/studio/courses` | `/studio/courses` | Course Production Studio; rendered; live cb038e39 resize 45→40→45, close/open, 640px compact detection and Operations/Preview tabs verified; no build triggered |
| `/hours-export` | `/dashboard` | wrong destination; placeholder redirect confirmed in source |
| `/docs` | `/docs` | source defect: profiles presented as documents; repair prepared |
| `/` | `/dashboard` | expected Admin landing; rendered dashboard |
| `/dashboard` | `/dashboard` | rendered earlier; latest h1 check empty |
| `/studio/browser` | `/studio/browser` | rendered; browser idle; Admin, Course Builder and Studio return controls present |
| `/studio/workflows` | `/studio?workspace=workflows` | rendered Workflow Designer selected; initial AI task warning resolved on post-deploy API read; total 105, only warning is 100-per-type display limit |
| `/studio` | `/studio` | rendered conversation workspace; What are we building today? |
