# Admin Flow Proof — Evidence-Driven Walkthrough

**Audit Date:** 2026-02-14

---

## Step 1: Admin Auth

| Item | Evidence |
|------|----------|
| **Route** | `/admin` |
| **Page file** | `app/admin/page.tsx` |
| **Auth check** | Each admin page queries `profiles.role` and checks against `['admin', 'super_admin']` or `['admin', 'super_admin', 'instructor']`. Redirects to `/unauthorized` or `/login` |
| **DB reads** | `auth.users` (via `supabase.auth.getUser()`), `profiles` (role check) |
| **Nav component** | `components/admin/AdminNav.tsx` — 54 links, all verified to resolve |

---

## Step 2: Course Builder

| Item | Evidence |
|------|----------|
| **Route** | `/admin/course-builder` |
| **Page file** | `app/admin/course-builder/page.tsx` + `CourseBuilderClient.tsx` (348 lines) |
| **API endpoints** | Direct Supabase queries (client component) |
| **DB reads/writes** | `courses` (CRUD: select, insert, update, delete) |
| **UI** | Course list, create form (title, description, status, category), edit form, delete confirmation |

---

## Step 3: Lesson Creation/Edit

| Item | Evidence |
|------|----------|
| **List route** | `/admin/lessons` |
| **List file** | `app/admin/lessons/page.tsx` — server component, queries `lessons` table with admin auth |
| **Per-course route** | `/admin/courses/[courseId]/content` |
| **Per-course file** | `app/admin/courses/[courseId]/content/LessonManagerClient.tsx` (313 lines) |
| **DB reads/writes** | `lessons` (CRUD), `courses` (verify course exists) |
| **UI** | Lesson list per course, create/edit form (title, content_type, video_url, content, order_index), reorder, delete |

---

## Step 4: SCORM Upload

| Item | Evidence |
|------|----------|
| **API endpoint** | `POST /api/scorm/upload` |
| **API file** | `app/api/scorm/upload/route.ts` |
| **Auth** | Checks `profile.role` against `['admin', 'super_admin', 'instructor']` |
| **Input** | `multipart/form-data` with `file` (ZIP), `course_id`, optional `title` |
| **Process** | 1) JSZip extracts ZIP. 2) Parses `imsmanifest.xml` via `fast-xml-parser`. 3) Finds launch href. 4) Detects SCORM version. 5) Creates `scorm_packages` row (status: 'processing'). 6) Uploads all extracted files to `course-content` bucket at `scorm/<packageId>/`. 7) Updates row with `launch_path`, `launch_url`, `manifest_data`, status: 'ready'. 8) Stores original ZIP as `_original.zip` |
| **DB writes** | `scorm_packages` (insert + update) |
| **Storage** | `course-content` bucket, path: `scorm/<packageId>/<files>` |
| **Admin UI** | ⚠️ **MISSING** — No dedicated admin page for SCORM upload. Must use API directly or integrate into course builder |

---

## Step 5: Quiz Builder

| Item | Evidence |
|------|----------|
| **Route** | `/admin/quiz-builder` |
| **Page file** | `app/admin/quiz-builder/page.tsx` |
| **Quiz list** | `/admin/quizzes` → `app/admin/quizzes/page.tsx` — queries `quizzes` table |
| **Per-course quizzes** | `/admin/courses/[courseId]/quizzes` → `QuizManagerClient.tsx` |
| **Question management** | `/admin/courses/[courseId]/quizzes/[quizId]/questions` → `QuestionManagerClient.tsx` |
| **API endpoints** | `POST /api/admin/quizzes` (create), `PUT /api/admin/quizzes/[id]` (update), `DELETE /api/admin/quizzes/[id]` (delete) |
| **DB reads/writes** | `quizzes` (CRUD), `quiz_questions` (CRUD), `courses` (verify), `profiles` (auth) |

---

## Step 6: Gradebook

| Item | Evidence |
|------|----------|
| **Index route** | `/admin/gradebook` |
| **Index file** | `app/admin/gradebook/page.tsx` — lists all courses with enrollment count |
| **Course route** | `/admin/gradebook/[courseId]` |
| **Course file** | `app/admin/gradebook/[courseId]/page.tsx` (server) + `GradebookClient.tsx` (client) |
| **DB reads** | `courses`, `enrollments` (with `profiles!inner` join), `assignment_submissions`, `quiz_attempts` |
| **UI** | Stats cards (students, submissions, quiz attempts). Grade overview table: student name, email, progress bar, assignment avg, quiz avg, overall %, letter grade. Tabs: Overview / SpeedGrader |
| **Grade computation** | Per-student: `assignmentAvg` = mean of `submission.grade || submission.score`. `quizAvg` = mean of `(attempt.score / attempt.max_score) * 100`. `overall` = mean of available averages. Letter grade from `DEFAULT_GRADE_SCALE` |

---

## Step 7: SpeedGrader

| Item | Evidence |
|------|----------|
| **Access** | SpeedGrader tab in `/admin/gradebook/[courseId]` |
| **Component** | `components/gradebook/SpeedGrader.tsx` (307 lines) — dynamically imported via `next/dynamic` |
| **UI** | Assignment selector dropdown. For selected assignment: submission content display, points input, feedback textarea, rubric scoring (if rubric exists), "Save Grade" button, navigation between submissions |
| **DB writes** | `grades` table (upsert: `submission_id`, `assignment_id`, `student_id`, `grader_id`, `points`, `max_points`, `percentage`, `feedback`, `rubric_scores`). Also calls `onGrade` callback which updates `assignment_submissions.grade` and `assignment_submissions.status = 'graded'` |
| **Limitation** | Assignment names show truncated UUIDs (no title lookup). No rubric creation UI |

---

## Step 8: Reports / CSV Export

| Item | Evidence |
|------|----------|
| **Hub route** | `/admin/reporting` → `app/admin/reporting/page.tsx` |
| **Reports dashboard** | `app/admin/reports/ReportsDashboard.tsx` (389 lines) — Recharts: LineChart (enrollment trends), BarChart (program distribution), PieChart (status breakdown) |
| **Sub-reports** | `/admin/reports/enrollment`, `/admin/reports/leads`, `/admin/reports/users`, `/admin/reports/financial`, `/admin/reports/samples`, `/admin/reports/caseload`, `/admin/reports/partners`, `/admin/reports/charts` |
| **Server actions** | `app/admin/reports/actions.ts` — `generateEnrollmentReport()`, `exportReportAsCSV()` |
| **CSV export endpoints (21)** | `/api/admin/catalog/export`, `/api/admin/export-etpl`, `/api/admin/rapids/export`, `/api/admin/bulk`, `/api/analytics/reports/caseload`, `/api/analytics/reports/usage`, `/api/analytics/reports/wioa-quarterly`, `/api/analytics/reports/wioa`, `/api/audit/export`, `/api/cert/revocations`, `/api/export`, `/api/funding/admin/report`, `/api/grants/package`, `/api/payroll/export`, `/api/reports/caseload`, `/api/reports/export`, `/api/reports/rapids/export`, `/api/reports/rapids`, `/api/reports/usage`, `/api/reports/wioa-quarterly`, `/api/reports/wioa` |
| **Gradebook CSV** | `GradebookClient.tsx` `handleExportCSV()` — client-side CSV generation with download |

---

## Step 9: Certificate Management

| Item | Evidence |
|------|----------|
| **List route** | `/admin/certificates` → `app/admin/certificates/page.tsx` |
| **Issue route** | `/admin/certificates/issue` → `app/admin/certificates/issue/page.tsx` |
| **Bulk route** | `/admin/certificates/bulk` → `app/admin/certificates/bulk/page.tsx` |
| **Issuance service** | `lib/certificates/issue-certificate.ts` (194 lines) — idempotent, sends email, creates notification |
| **PDF generator** | `lib/certificates/generator.ts` (179 lines) — `pdf-lib`, branded layout |
| **DB** | `certificates` table |
| **No template editor** | Certificate layout is hardcoded in `generator.ts`. No admin UI to customize template |

---

## Admin Analytics Pages

| Route | File | DB Tables | What It Shows |
|-------|------|-----------|---------------|
| `/admin/analytics` | `app/admin/analytics/page.tsx` | `profiles`, `courses`, `enrollments`, `programs` | Total counts: students, courses, enrollments, programs |
| `/admin/analytics/learning` | `app/admin/analytics/learning/page.tsx` | `courses`, `enrollments`, `certificates` | Total/completed enrollments, completion rate, top courses by enrollment |
| `/admin/analytics/engagement` | `app/admin/analytics/engagement/page.tsx` | `profiles`, `enrollments` | Total/active/new users, enrollment activity |
| `/admin/analytics/programs` | `app/admin/analytics/programs/page.tsx` | `programs`, `program_enrollments` | Total/completed program enrollments, top programs |

---

**NO ASSUMPTIONS CERTIFICATION:**
Every step is evidenced by file path, route, API endpoint, and DB table verified in the repository. Admin SCORM upload UI is explicitly marked as MISSING.
