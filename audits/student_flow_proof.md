# Student Flow Proof — Evidence-Driven Walkthrough

**Audit Date:** 2026-02-14

---

## Step 1: Login

| Item | Evidence |
|------|----------|
| **Route** | `/login` |
| **Page file** | `app/login/page.tsx` |
| **API endpoint** | Supabase Auth (`supabase.auth.signInWithPassword`) |
| **DB tables** | `auth.users` (Supabase managed) |
| **UI shows** | Email + password form, "Sign In" button, link to `/signup` |
| **Auth guard** | `app/lms/(app)/layout.tsx` — `supabase.auth.getUser()` on mount. If no user, redirects to `/login?next=/lms/dashboard` |

---

## Step 2: Dashboard (Browse Enrolled Courses)

| Item | Evidence |
|------|----------|
| **Route** | `/lms/dashboard` |
| **Page file** | `app/lms/(app)/dashboard/page.tsx` |
| **API endpoint** | None (server component, direct Supabase queries) |
| **DB reads** | `enrollments` (user's enrollments), `partner_lms_enrollments` (partner courses), `course_progress` (progress %), `certifications` (earned certs), `job_placements` (placement data) |
| **UI shows** | Active enrollment card with progress percentage, course title, "Continue" button. Stats: courses enrolled, certifications earned, job placements |
| **Progress source** | `course_progress.progress_percentage` → fallback `enrollments.progress_percentage` → fallback `enrollments.progress` |

---

## Step 3: Browse Courses

| Item | Evidence |
|------|----------|
| **Route** | `/lms/courses` |
| **Page file** | `app/lms/(app)/courses/page.tsx` |
| **DB reads** | `courses` (all published), `enrollments` (user's enrollments to show enrolled status) |
| **UI shows** | Course cards with title, description, enrollment status badge. Click → course detail |

---

## Step 4: Enroll in a Course

| Item | Evidence |
|------|----------|
| **Route** | `/lms/courses/[courseId]/enroll` |
| **Page file** | `app/lms/(app)/courses/[courseId]/enroll/page.tsx` + `EnrollmentForm.tsx` |
| **API endpoint** | `POST /api/enroll` → `lib/enrollment/complete-enrollment.ts` |
| **DB writes** | `enrollments` (insert: `user_id`, `course_id`, `status: 'active'`, `progress: 0`), `audit_logs` (enrollment event), `course_progress` (initialize) |
| **DB reads** | `courses` (verify exists, check prerequisites), `enrollments` (check not already enrolled), `profiles` (user data) |
| **UI shows** | Course info, terms acceptance checkbox, "Enroll Now" button. On success: redirect to `/lms/courses/[courseId]?enrolled=true` |
| **Prerequisite check** | `complete-enrollment.ts` line 63: checks `course.prerequisites` array, verifies each prerequisite course has a completed enrollment |

---

## Step 5: Open Course Detail

| Item | Evidence |
|------|----------|
| **Route** | `/lms/courses/[courseId]` |
| **Page file** | `app/lms/(app)/courses/[courseId]/page.tsx` |
| **DB reads** | `courses` (course data), `lessons` (ordered by `order_index`), `enrollments` (user's enrollment), `lesson_progress` (all lessons for this user in this course), `quizzes` (course quizzes) |
| **UI shows** | Course title, description, progress bar (`completedLessons/totalLessons * 100`), lesson list with completion checkmarks (green circle = completed from `lesson_progress`), "Continue Learning" button pointing to next incomplete lesson |
| **Progress computation** | Server-side: queries `lesson_progress` for all lesson IDs in course, counts `completed = true`, divides by total lessons |

---

## Step 6: Open Lesson Player

| Item | Evidence |
|------|----------|
| **Route** | `/lms/courses/[courseId]/lessons/[lessonId]` |
| **Page file** | `app/lms/(app)/courses/[courseId]/lessons/[lessonId]/page.tsx` (client component, `'use client'`) |
| **DB reads** | `lessons` (lesson data + all lessons for sidebar), `courses` (course info), `lesson_progress` (ALL lessons in course for this user — used for sidebar checkmarks) |
| **Content type switch** | `lesson.content_type` determines renderer: |
| | - `'scorm'` + `lesson.scorm_package_id` → iframe to `/api/scorm/content/[packageId]/[launchPath]` |
| | - `'quiz'` + `lesson.quiz_id` → `QuizSystem` component with `onComplete` callback |
| | - `lesson.video_url` exists → `<video>` player with `onEnded` handler |
| | - default → reading/text view with `lesson.content` as HTML |
| **Sidebar** | Lists all lessons with completion status from `completedLessonIds` Set (populated from `lesson_progress` query). Progress bar: `completedLessonIds.size / lessons.length` |

---

## Step 7: Mark Lesson Complete

| Item | Evidence |
|------|----------|
| **Trigger** | "Mark as Complete" button (`markComplete()` function) |
| **API endpoint** | `POST /api/lessons/[lessonId]/complete` |
| **API file** | `app/api/lessons/[lessonId]/complete/route.ts` |
| **DB writes** | `lesson_progress` (upsert: `user_id`, `lesson_id`, `completed: true`, `completed_at`), `enrollments` (update `progress` via RPC `update_enrollment_progress_manual` with direct update fallback) |
| **DB reads** | `lessons` (verify exists), `lesson_progress` (count completed for course), `enrollments` (find user's enrollment) |
| **API response** | `{ success: true, courseProgress: { completedLessons, totalLessons, progressPercent, courseCompleted }, certificate: {...} or null }` |
| **UI updates (immediate)** | `markComplete()` reads response body. Adds `lessonId` to `completedLessonIds` Set → sidebar checkmark appears. Progress bar recalculates from `completedLessonIds.size / lessons.length` |

---

## Step 8: Progress Updates Visible

| Item | Evidence |
|------|----------|
| **Lesson player sidebar** | Immediate — React state `completedLessonIds` updated on API success |
| **Course detail page** | On navigation — server component re-queries `lesson_progress` |
| **Dashboard** | On navigation — server component re-queries `enrollments.progress` / `progress_percentage` |
| **Risk** | DELETE (uncomplete) updates `completedLessonIds` Set but does NOT recalculate `enrollments.progress` on the server. Progress in dashboard may be stale after uncomplete until next complete action |

---

## Step 9: Certificate Issued at 100%

| Item | Evidence |
|------|----------|
| **Trigger** | `app/api/lessons/[lessonId]/complete/route.ts` line 115: `if (progressPercent === 100)` |
| **DB writes** | `certificates` (insert: `user_id`, `course_id`, `certificate_number`, `issued_at`, `status: 'active'`) |
| **Idempotency** | Checks for existing cert first: `supabase.from('certificates').select().eq('user_id').eq('course_id')` |
| **Certificate number** | Format: `EFH-YYYYMMDD-XXXXXXXX` (date + random alphanumeric) |
| **API response** | Returns `certificate` object in response body |
| **UI** | Course completion banner appears: green box with "Course Completed!" text and "View Certificate" link |

---

## Step 10: Certificate Viewable

| Item | Evidence |
|------|----------|
| **View route** | `/certificates/[certificateId]` |
| **View file** | `app/certificates/[certificateId]/page.tsx` |
| **Download route** | `/api/certificates/[certificateId]/download` |
| **Download file** | `app/api/certificates/[certificateId]/download/route.ts` — calls `generateCertificatePDF()` from `lib/certificates/generator.ts` |
| **PDF generator** | `lib/certificates/generator.ts` (179 lines) — `pdf-lib`, landscape letter, branded layout |
| **Verify route** | `/certificates/verify/[certificateId]` |
| **Verify file** | `app/certificates/verify/[certificateId]/page.tsx` |
| **Email notification** | `lib/certificates/issue-certificate.ts` line 147: `emailService.sendCertificateNotification()` |
| **In-app notification** | `lib/certificates/issue-certificate.ts` line 163: creates notification record |

---

## Step 11: Toggle Incomplete (Reversal)

| Item | Evidence |
|------|----------|
| **Trigger** | Click "Mark as Complete" again (toggles) |
| **API endpoint** | `DELETE /api/lessons/[lessonId]/complete` |
| **DB writes** | Deletes `lesson_progress` row for this user + lesson |
| **UI updates** | Removes `lessonId` from `completedLessonIds` Set. Sets `courseCompleted = false`. Sets `certificate = null`. Sidebar checkmark disappears. Progress bar decrements. Completion banner disappears |
| **Known gap** | DELETE handler does NOT recalculate `enrollments.progress`. Dashboard progress may be stale |

---

## SCORM-Specific Student Flow

| Step | Route | Evidence |
|------|-------|----------|
| Open SCORM course | `/lms/scorm/[scormId]` | `app/lms/(app)/scorm/[scormId]/page.tsx` — server component, queries `scorm_packages` + `scorm_enrollments` |
| Player loads | — | `ScormPlayerWrapper.tsx` — client component, initializes SCORM API shim on `window.API` / `window.API_1484_11` |
| Content serves | `/api/scorm/content/[packageId]/[path]` | Downloads from `course-content` bucket at `scorm/<packageId>/<path>` |
| CMI data saves | `/api/scorm/attempts/[attemptId]/data` | PUT upserts `scorm_cmi_data`, updates `scorm_attempts.status` |
| Tracking saves | `/api/scorm/tracking` | POST upserts `scorm_enrollments` (progress, score, status), inserts `scorm_tracking` event, updates `enrollments` on completion |
| Progress bar | — | `ScormPlayerWrapper` shows progress bar, score, completion status. Intercepts `cmi.core.lesson_status` and `cmi.core.score.raw` |

---

**NO ASSUMPTIONS CERTIFICATION:**
Every step is evidenced by file path, route, API endpoint, DB table, and UI behavior verified in the repository. No runtime screenshots included (requires deployed environment with test data).
