# Execution Build Plan — Enrolled-Ready LMS

Generated: 2026-02-14

## Current State Assessment

### What WORKS end-to-end (code exists, DB tables referenced, APIs wired)

| Flow | Status | Evidence |
|---|---|---|
| Course listing | ✅ Real | `app/lms/(app)/courses/page.tsx` (236 lines) — reads `courses` + `enrollments` tables, shows progress |
| Course detail | ✅ Real | `app/lms/(app)/courses/[courseId]/page.tsx` (450 lines) — modules, lessons, enrollment check |
| Lesson player | ✅ Real | `app/lms/(app)/courses/[courseId]/lessons/[lessonId]/page.tsx` (439 lines) — video, mark-complete, resources, notes, prev/next |
| Lesson completion API | ✅ Real | `app/api/lessons/[lessonId]/complete/route.ts` (180 lines) — upserts `lesson_progress`, updates `enrollments.progress`, auto-creates certificate at 100% |
| Enrollment create API | ✅ Real | `app/api/enrollments/create/route.ts` (210 lines) + `create-enforced/route.ts` (215 lines) |
| Quiz engine | ✅ Real | `app/api/quizzes/[quizId]/route.ts` — reads `interactive_quizzes` + `quiz_questions`, shuffles |
| Quiz save | ✅ Real | `app/api/quizzes/save/route.ts` — upserts `quizzes` + `quiz_questions` |
| Certificate issuance | ✅ Real | `lib/certificates/issue-certificate.ts` + auto-issue in lesson complete API |
| Certificate download | ⚠️ HTML only | `lib/certificates/generator.ts` — generates HTML, not PDF. Returns `text/html` blob |
| Admin course builder | ✅ Real | `app/admin/course-builder/CourseBuilderClient.tsx` (348 lines) — CRUD courses via API |
| Admin programs | ✅ Real | `app/admin/programs/page.tsx` (139 lines) — reads `programs`, has Create button |
| Admin modules | ✅ Real | `app/admin/modules/page.tsx` (149 lines) — reads `modules`, has Create button |
| Admin enrollments | ✅ Real | `app/admin/enrollments/page.tsx` (76 lines) — reads `enrollments` |
| Admin certificates | ✅ Real | `app/admin/certificates/page.tsx` (214 lines) — reads `certificates` |
| Admin reports | ✅ Real | `app/admin/reports/page.tsx` (174 lines) — reads progress data |

### What's MISSING or BROKEN

| Item | Priority | Issue |
|---|---|---|
| `/admin/course-studio` | P1 | Dead nav link — page doesn't exist. Admin nav points here but 404s |
| `/admin/course-studio-ai` | P1 | Dead nav link — page doesn't exist |
| `/admin/lessons` | P1 | No admin page to manage individual lessons (only modules exist) |
| `/admin/quizzes` | P1 | No admin page to list/manage quizzes (only quiz-builder exists) |
| `/student-portal/courses` | P2 | Dead link on student portal landing — should point to `/lms/courses` |
| Certificate PDF | P2 | Generator returns HTML, not actual PDF |
| `EmployerNav.tsx` | P3 | Dead component — never imported, 8 dead links |
| `StaffNav.tsx` | P3 | Dead component — never imported, 10 dead links |
| Employer portal duplication | P3 | `/employer/*` and `/employer-portal/*` overlap |

---

## Priority 1: Make Course Studio + Lesson Management Real

### 1a. `/admin/course-studio` — Unified course management UI

**What it should be**: The single admin page where you manage the full course structure: Course → Modules → Lessons → Assets/Quizzes.

**Implementation**:
- File: `app/admin/course-studio/page.tsx`
- This should redirect to or wrap `/admin/course-builder` (which already has full CRUD)
- OR: create a new page that combines course-builder + module management + lesson management in a tree view

**DB tables touched**: `courses`, `modules`, `lessons`, `quizzes`, `quiz_questions`
**APIs needed**: Already exist — `/api/admin/courses`, `/api/admin/courses/[id]`
**Done test**: Admin can create a course, add modules, add lessons to modules, attach a quiz, publish

### 1b. `/admin/course-studio-ai` — AI course generator

**What it should be**: AI-assisted course creation that writes to the same tables.

**Implementation**:
- File: `app/admin/course-studio-ai/page.tsx`
- `/admin/course-generator` already exists (253 lines, 26 form actions) — may be the same thing
- Either redirect `course-studio-ai` → `course-generator`, or rename

**DB tables touched**: Same as 1a
**Done test**: Admin enters a topic, AI generates course outline, admin reviews and publishes

### 1c. `/admin/lessons` — Lesson management list

**Implementation**:
- File: `app/admin/lessons/page.tsx`
- Read from `lessons` table, filter by course/module
- CRUD: create lesson, edit content/video_url, set duration, attach quiz, reorder

**DB tables touched**: `lessons`, `courses`, `modules`
**APIs needed**: Create `/api/admin/lessons` (CRUD) or use existing patterns
**Done test**: Admin can list all lessons, filter by course, create/edit/delete a lesson

### 1d. `/admin/quizzes` — Quiz management list

**Implementation**:
- File: `app/admin/quizzes/page.tsx`
- Read from `quizzes` table
- Link to `/admin/quiz-builder` for editing

**DB tables touched**: `quizzes`, `quiz_questions`
**Done test**: Admin can list all quizzes, see question count, link to edit

---

## Priority 2: Fix Dead Links + Student Portal

### 2a. Fix `/student-portal/courses` dead link

**File**: `app/student-portal/page.tsx`
**Fix**: Change `href="/student-portal/courses"` → `href="/lms/courses"`
**Done test**: Student portal "My Courses" link works

### 2b. Fix admin nav dead links

**File**: `components/admin/AdminNav.tsx`
**Fix**: Either create the missing pages (1a, 1b above) or redirect:
- `/admin/course-studio` → `/admin/course-builder`
- `/admin/course-studio-ai` → `/admin/course-generator`

### 2c. Certificate PDF generation

**File**: `lib/certificates/generator.ts`
**Fix**: Replace HTML blob with actual PDF using `@react-pdf/renderer` or `jspdf`
**Done test**: Download produces a `.pdf` file, not `.html`

---

## Priority 3: Portal Cleanup (non-blocking)

### 3a. Delete or wire dead nav components

- `components/nav/EmployerNav.tsx` — delete (never imported, 8 dead links)
- `components/nav/StaffNav.tsx` — delete (never imported, 10 dead links)

### 3b. Consolidate employer portals

- Pick `/employer/*` as canonical (17 pages, has auth)
- Redirect `/employer-portal/*` → `/employer/*` equivalents
- OR vice versa

---

## Database Tables — Lesson Backbone Status

All tables below are referenced in code and expected to exist in the 428-table baseline:

| Table | Code Refs | Used By | Status |
|---|---|---|---|
| `programs` | 131 | Admin, catalog, enrollment | ✅ Expected in baseline |
| `courses` | 125 | Admin, LMS, enrollment | ✅ Expected in baseline |
| `modules` | 9 | Admin, course detail | ✅ Expected in baseline |
| `lessons` | 36 | Lesson player, admin | ✅ Expected in baseline |
| `lesson_progress` | 27 | Lesson completion, progress tracking | ✅ Expected in baseline |
| `enrollments` | 407 | Everywhere | ✅ Expected in baseline |
| `certificates` | 62 | Issuance, download, admin | ✅ Expected in baseline |
| `quizzes` | 19 | Quiz builder, quiz save | ✅ Expected in baseline |
| `quiz_questions` | 16 | Quiz engine | ✅ Expected in baseline |
| `quiz_attempts` | 18 | Quiz scoring | ✅ Expected in baseline |
| `course_progress` | 5 | Dashboard, reports | ✅ Expected in baseline |
| `audit_logs` | 56 | Compliance | ✅ Expected in baseline |
| `profiles` | 812 | Auth, everywhere | ✅ Expected in baseline |

**No new tables needed for the lesson engine.** The 428-table baseline covers all required tables. The code already reads/writes them.

---

## Execution Order

| # | Task | Files | Effort | Blocks |
|---|---|---|---|---|
| 1 | Create `/admin/course-studio` (redirect to course-builder) | 1 file | 5 min | Unblocks admin nav |
| 2 | Create `/admin/course-studio-ai` (redirect to course-generator) | 1 file | 5 min | Unblocks admin nav |
| 3 | Create `/admin/lessons` (CRUD list page) | 1 file + 1 API | 1 hr | Unblocks lesson management |
| 4 | Create `/admin/quizzes` (list page linking to quiz-builder) | 1 file | 30 min | Unblocks quiz management |
| 5 | Fix `/student-portal/courses` dead link | 1 line change | 2 min | Unblocks student portal |
| 6 | Delete `EmployerNav.tsx` + `StaffNav.tsx` | 2 file deletes | 2 min | Cleanup |
| 7 | Upgrade certificate generator to PDF | 1 file | 1 hr | Better UX |
| 8 | Consolidate employer portals | Redirects | 30 min | Cleanup |

**Total estimated: ~3.5 hours to enrolled-ready.**

Items 1-5 are the minimum to eliminate all dead links and make the lesson engine fully navigable from admin through student completion.
