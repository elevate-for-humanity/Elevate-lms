# Feature Parity Matrix — Elevate LMS vs Enterprise LMS

Generated: 2026-02-14
Method: Code-level audit only. No assumptions from UI. Every YES requires file path evidence.

## Legend

- **YES** — Route exists, DB table referenced, API functional, runtime logic present
- **PARTIAL** — Code exists but not fully wired (e.g., component never imported, API stubbed)
- **NO** — Not found in codebase

---

## CORE LMS

| Feature | Canvas/Moodle Standard | Exists | Evidence | Notes |
|---|---|---|---|---|
| Course creation (CRUD) | YES | **YES** | `app/admin/course-builder/CourseBuilderClient.tsx` (348 lines) — create, edit, delete courses via `courses` table | Full CRUD with status management |
| Module structure | YES | **YES** | `app/admin/modules/page.tsx` (149 lines), `app/admin/modules/module-form.tsx` — CRUD modules, supports types: video, text, scorm | Modules linked to programs |
| Lesson player | YES | **YES** | `app/lms/(app)/courses/[courseId]/lessons/[lessonId]/page.tsx` (439 lines) — video player, mark-complete, resources tab, notes tab, prev/next navigation | Real implementation |
| Lesson management (admin) | YES | **YES** | `app/admin/courses/[courseId]/content/LessonManagerClient.tsx` (313 lines) — CRUD lessons within course, `app/admin/lessons/page.tsx` — cross-course list | Full CRUD |
| Enrollment system | YES | **YES** | `app/api/enrollments/create/route.ts` (210 lines), `create-enforced/route.ts` (215 lines), 383 code refs to `enrollments` table | Multiple enrollment paths |
| Progress tracking | YES | **YES** | `lesson_progress` (26 refs), `progress_entries` (38 refs), `course_progress` (5 refs), enrollment progress % updated on lesson complete | Multi-level tracking |
| Completion rules | YES | **YES** | `app/api/lessons/[lessonId]/complete/route.ts` — auto-certificate at 100% progress | Lesson-level completion triggers course completion |
| Certificate issuance | YES | **YES** | `lib/certificates/issue-certificate.ts`, auto-issue on completion, `certificates` table (58 refs) | Auto + manual issuance |
| Certificate download | YES | **PARTIAL** | `app/api/certificates/[certificateId]/download/route.ts` — generates HTML, not PDF | Works but outputs HTML not PDF |
| Certificate verification | YES | **YES** | `app/api/verify/certificate/[certificateId]/route.ts` | Public verification endpoint |

## ASSESSMENT

| Feature | Canvas/Moodle Standard | Exists | Evidence | Notes |
|---|---|---|---|---|
| Quiz engine | YES | **YES** | `app/api/quizzes/[quizId]/route.ts` (166 lines) — fetches quiz + questions, shuffles, `quiz_attempts` table (18 refs) | Functional quiz delivery |
| Quiz builder (admin) | YES | **YES** | `app/admin/quiz-builder/page.tsx` (195 lines), `app/api/quizzes/save/route.ts` (90 lines) | Create/edit quizzes + questions |
| Question bank | Shared pool | **NO** | No standalone question bank table or UI. Questions are per-quiz only. | Gap vs Canvas |
| Multiple question types | YES | **PARTIAL** | `quiz_questions` table supports types but only multiple-choice confirmed in quiz API | No essay, matching, fill-in-blank confirmed |
| Grading logic | YES | **YES** | `lib/gradebook/calculator.ts` (175 lines) — weighted categories, drop-lowest, curved grading, rubric scoring | Full gradebook calculator |
| SpeedGrader | YES (Canvas) | **PARTIAL** | `components/gradebook/SpeedGrader.tsx` (307 lines) — imports gradebook types. **Never imported by any page.** | Built but not wired |
| Gradebook page | YES | **YES** | `app/lms/(app)/grades/page.tsx` — reads `enrollments`, `assignment_submissions`, `quiz_attempts` | Student-facing grades view |
| Pass thresholds | YES | **YES** | `quizzes.passing_score` field used in quiz API, `app/admin/quizzes/page.tsx` displays it | Per-quiz passing score |
| Rubric grading | YES | **PARTIAL** | `lib/gradebook/calculator.ts:152` — rubric score calculation, `supabase/functions/grade-ai/index.ts` — AI grading with rubric | Calculator exists, no rubric UI for instructors |
| Peer review | YES | **YES** | `app/lms/(app)/peer-review/page.tsx` (213 lines) | Student peer review page |
| Assignment submissions | YES | **YES** | `assignment_submissions` table referenced in grades page, `assignments` table (18 refs) | Submission tracking exists |

## STANDARDS & INTEGRATIONS

| Feature | Canvas/Moodle Standard | Exists | Evidence | Notes |
|---|---|---|---|---|
| SCORM upload | YES | **PARTIAL** | `app/api/scorm/upload/route.ts` — accepts ZIP, stores to Supabase Storage, creates `scorm_packages` row. Does NOT parse `imsmanifest.xml`. | Upload works, no manifest parsing |
| SCORM player (iframe) | YES | **PARTIAL** | `components/scorm/ScormPlayer.tsx` (97 lines) — iframe + API shim injection. **Never imported.** | Built but not wired |
| SCORM API shim (1.2 + 2004) | YES | **YES** | `lib/scorm/api.ts` (115 lines) — `LMSInitialize`, `LMSSetValue`, `LMSCommit`, `LMSFinish` + 2004 equivalents | Full dual-version implementation |
| SCORM CMI data persistence | YES | **PARTIAL** | `app/api/scorm/attempts/[id]/data/route.ts` — GET/POST for CMI data. `scorm_cmi_data` table (2 refs). | API exists, tables may need creation |
| SCORM content serving | YES | **NO** | No `/api/scorm/content/` route to serve extracted SCORM files | Missing — blocks iframe playback |
| xAPI / TinCan | YES | **PARTIAL** | `app/api/xapi/route.ts`, `app/api/xapi/statement/route.ts` — statement endpoints exist | Not audited for completeness |
| LTI 1.3 support | YES | **PARTIAL** | `app/api/lti/launch/route.ts` (107 lines), `login/route.ts`, `jwks/route.ts`, `config/route.ts` — JWT decode without verification, comment says "do NOT do this in prod" | Prototype, not production-ready |
| Certiport integration | N/A (custom) | **YES** | `lib/partners/certiport.ts` — exam codes, portal URL, `app/api/certiport-exam/request/route.ts` (Stripe checkout for self-pay), `assign-voucher/route.ts` | Real integration with payment flow |
| Stripe payments | N/A | **YES** | `app/api/webhooks/stripe/route.ts` (1,879 lines) — handles 10+ event types | Full webhook handler |

## INSTRUCTOR TOOLS

| Feature | Canvas/Moodle Standard | Exists | Evidence | Notes |
|---|---|---|---|---|
| Admin dashboard | YES | **YES** | `app/admin/page.tsx` (110 lines) — overview stats | Basic dashboard |
| Student management | YES | **YES** | `app/admin/students/page.tsx` (324 lines) — list, search, filter students | Full student list |
| Course analytics | YES | **YES** | `app/admin/analytics/page.tsx`, `app/admin/progress/page.tsx`, `app/admin/outcomes/page.tsx` | Multiple analytics pages |
| Reporting exports | YES | **YES** | `app/api/admin/export/students/route.ts` — CSV export, `app/admin/reports/page.tsx` (174 lines) | CSV export exists |
| Instructor portal | YES | **YES** | `app/instructor/` (12 pages) — dashboard, courses, students, analytics, campaigns, settings | Dedicated instructor portal |
| Completions tracking | YES | **YES** | `app/admin/completions/page.tsx` (201 lines), `app/api/admin/completions/route.ts` | Admin completions view |

## ENTERPRISE FEATURES

| Feature | Canvas/Moodle Standard | Exists | Evidence | Notes |
|---|---|---|---|---|
| Role-based access control | YES | **YES** | `lib/auth/require-role.ts`, `lib/auth/require-admin.ts`, `lib/auth/lms-routes.ts` — roles: admin, super_admin, instructor, student, staff, partner, employer, delegate | 8+ roles |
| Audit logs | YES | **YES** | `audit_logs` table (56 refs), `app/admin/audit-logs/page.tsx` (319 lines) | Full audit trail |
| Multi-program structure | YES | **YES** | `programs` table (130 refs), 76 program pages, program → course → module → lesson hierarchy | Full hierarchy |
| Multi-tenant | Varies | **YES** | `tenants` table (31 refs), tenant-aware queries throughout | Tenant isolation |
| Messaging | YES | **YES** | `messages` table (26 refs), `app/lms/(app)/messages/page.tsx` | In-LMS messaging |
| Notifications | YES | **YES** | `notifications` table (43 refs), notification bell in nav | Push notifications |
| Discussion forums | YES | **YES** | `components/DiscussionForum.tsx` (167 lines), `app/api/forums/` (threads, posts APIs), `forum_threads` table (21 refs) | Real forum with threads/posts |
| File management | YES | **YES** | `app/lms/(app)/files/page.tsx`, Supabase Storage integration | Student file manager |
| Badges/gamification | Varies | **YES** | `app/lms/(app)/badges/page.tsx` (351 lines), `achievements/page.tsx` (457 lines), `leaderboard/page.tsx` (367 lines) | Full gamification system |
| Calendar/scheduling | YES | **YES** | `app/lms/(app)/schedule/page.tsx`, `app/lms/(app)/calendar/page.tsx` | Dual calendar views |

## DATA & COMPLIANCE

| Feature | Canvas/Moodle Standard | Exists | Evidence | Notes |
|---|---|---|---|---|
| LMS entity tables | YES | **YES** | 30+ LMS-specific tables referenced in code (see top-30 list above) | Extensive schema |
| Activity tracking | YES | **YES** | `user_activity_events` table, `app/api/analytics/events/route.ts` — event logging | Real event tracking |
| Completion history | YES | **YES** | `lesson_progress`, `course_progress`, `progress_entries`, `enrollments.progress` | Multi-level history |
| Certificate records | YES | **YES** | `certificates` table (58 refs), issuance service, verification API | Full certificate lifecycle |
| FERPA compliance | YES | **YES** | `app/ferpa/` (12 pages), privacy policy with FERPA section | Documented compliance |
| Data export (privacy) | YES | **YES** | `app/api/privacy/export/route.ts` — exports user data from multiple tables | GDPR/privacy export |
| Accessibility (WCAG) | YES | **PARTIAL** | 52 aria/sr-only refs in SiteHeader alone, `app/accessibility/page.tsx` exists | Some ARIA, not fully audited |

---

## Summary Scorecard

| Category | Total Features | YES | PARTIAL | NO |
|---|---|---|---|---|
| Core LMS | 10 | 9 | 1 | 0 |
| Assessment | 11 | 7 | 3 | 1 |
| Standards & Integrations | 9 | 3 | 5 | 1 |
| Instructor Tools | 6 | 6 | 0 | 0 |
| Enterprise Features | 10 | 10 | 0 | 0 |
| Data & Compliance | 6 | 5 | 1 | 0 |
| **TOTAL** | **52** | **40 (77%)** | **10 (19%)** | **2 (4%)** |

## Missing Enterprise LMS Features

| Feature | Impact | Effort to Add |
|---|---|---|
| Question bank (shared pool) | LOW for workforce | Medium |
| SCORM content serving API | HIGH if claiming SCORM | 2 hrs |
| SCORM player wiring | HIGH if claiming SCORM | 30 min |
| LTI production-ready (JWT verification) | MEDIUM for institutional partners | 4 hrs |
| Certificate PDF output | MEDIUM for credibility | 1 hr |
| SpeedGrader wiring | LOW for workforce | 30 min |

## Classification

| Level | Qualifies? | Reasoning |
|---|---|---|
| Basic LMS | **YES** | Course CRUD, lesson player, enrollment, progress, certificates — all functional |
| Workforce LMS | **YES** | Multi-program, funding integration, credential tracking, compliance logging, WIOA/DOL support, employer portal, apprenticeship tracking | 
| Enterprise LMS | **PARTIAL** | Has RBAC, multi-tenant, audit logs, analytics, forums, messaging, gamification. Missing: production SCORM runtime, production LTI, question bank. Standards integrations are prototyped but not production-hardened. |

## Evidence-Based Conclusion

Elevate LMS is a **functional Workforce LMS** with enterprise-grade infrastructure (RBAC, audit logs, multi-tenant, 8+ portals). Its core lesson engine — course creation through certificate issuance — works end-to-end with real database tables and APIs.

It has **more features than most custom workforce LMS builds**: forums, gamification, peer review, gradebook calculator, AI grading, Certiport integration, and Stripe payments.

It does **not** match Canvas/Moodle in three areas:
1. **Standards runtime** — SCORM, LTI, and xAPI code exists but is not production-wired (components built but never imported, APIs prototyped but not hardened)
2. **Assessment depth** — No shared question bank, limited question types confirmed
3. **Certificate format** — HTML output, not PDF

For workforce contracts, items 1 and 3 are the only ones that matter. Item 2 is a Canvas/Moodle feature that workforce providers rarely need.
