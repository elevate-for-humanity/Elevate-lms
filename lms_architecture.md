# LMS Architecture

Generated: 2026-03-27  
Auditor: Ona

---

## Data Model

```
programs
  └── modules          (program_id FK, slug, title, order)
        └── curriculum_lessons  (module_id FK, step_type, module_order, lesson_order, passing_score*)
              └── lesson_progress  (user_id, lesson_id, completed, completed_at)
              └── checkpoint_scores*  (user_id, lesson_id, score, passed, attempt_number)
              └── step_submissions*   (user_id, lesson_id, step_type, status, instructor_id)

* = missing, created in Phase 8
```

### step_type Values

| Value | Rendering | Completion Rule |
|-------|-----------|-----------------|
| `lesson` | Reading / video | Mark complete button |
| `quiz` | Quiz player | Pass threshold (`passing_score`) |
| `checkpoint` | Quiz player | Pass threshold — gates next module |
| `lab` | Lab UI shell | Instructor sign-off (pending) |
| `assignment` | Assignment UI shell | Instructor sign-off (pending) |
| `exam` | Quiz player | Pass threshold |
| `certification` | Credential pathway page | Final step — redirects to `/certification` |

---

## Rendering Flow

```
GET /lms/courses/[courseId]/lessons/[lessonId]
  → page.tsx checks enrollment via /api/lms/enrollment-status
  → queries lms_lessons view (curriculum_lessons UNION training_lessons)
  → routes UI by lesson.step_type
  → sidebar groups lessons by module_title (from modules table via module_id FK)
  → "Mark Complete" → POST /api/lessons/[lessonId]/complete
  → auto-advance to next lesson
  → if final lesson → redirect to /lms/courses/[courseId]/certification
```

---

## Progression Flow (current — checkpoint gate MISSING)

```
Learner marks lesson complete
  → lesson_progress row written
  → training_enrollments.progress recalculated
  → checkEligibilityAndAuthorize() called
  → if all lessons complete → exam_funding_authorizations row created
  → [GAP] checkpoint_scores NOT checked — learner can skip past checkpoints
  → [GAP] module lock NOT enforced — all modules accessible regardless of progress
```

## Progression Flow (after Phase 8)

```
Learner marks lesson complete
  → lesson_progress row written
  → if step_type = 'checkpoint':
      → checkpoint_scores row written with score
      → if score < passing_score → next-lesson button disabled
      → next module unlocked only when checkpoint passed
  → training_enrollments.progress recalculated
  → checkEligibilityAndAuthorize() called
  → if all required lessons complete AND all checkpoints passed:
      → exam_funding_authorizations row created
      → certificates row auto-created (new in Phase 8)
      → redirect to /lms/courses/[courseId]/certification
```

---

## Certification Flow

```
/lms/courses/[courseId]/certification
  → shows completion %, certificate (if issued), primary credential pathway
  → "Request Exam Authorization" button → POST /api/certification/initiate
  → certificate issued by admin via POST /api/cert/issue
  → certificate queryable at /verify/[certificateId] (public, employer-facing)
```

### Certificate Record (canonical: `certificates` table)

| Column | Purpose |
|--------|---------|
| `id` | UUID primary key |
| `user_id` | Learner |
| `course_id` | Course completed |
| `enrollment_id` | Enrollment record |
| `certificate_number` | Human-readable ID (e.g. `EFH-A1B2C3D4`) |
| `issued_at` | Timestamp |
| `pdf_url` | Rendered PDF path |
| `verification_url` | Public URL: `/verify/[certificate_number]` |
| `verification_code` | Short code for employer lookup |

---

## Current Gaps

| Gap | Impact | Phase |
|-----|--------|-------|
| `checkpoint_scores` table missing | Checkpoints render but scores not recorded | Phase 8 |
| `step_submissions` table missing | Lab/assignment UI renders but submissions not stored | Phase 8 |
| `passing_score` column missing on `curriculum_lessons` | All checkpoints default to 70% hardcoded in JS | Phase 8 |
| Checkpoint gate not enforced in lesson page | Learners can advance past failed checkpoints | Phase 8 |
| Module lock not enforced | All modules accessible regardless of progress | Phase 8 |
| Auto-certificate on completion not wired | Eligibility check fires but certificate not auto-issued | Phase 8 |
| `hvac-epa-608.ts` blueprint not registered | HVAC cannot use DB-driven generator | Phase 12 |
| HVAC legacy path coexists with DB-driven path | New programs may accidentally follow HVAC pattern | Phase 9 |

---

## Blueprint System

```
lib/curriculum/blueprints/index.ts  ← import from here only
  └── prs-indiana.ts  (registered)
  └── hvac-epa-608.ts  (NOT registered — fix in Phase 12)
  └── prs.ts  (older, possibly superseded)

lib/services/curriculum-generator.ts
  → upsertModule(moduleDef) → writes modules table
  → upsertLesson(lessonDef) → writes curriculum_lessons table
  → links lessons to credential_exam_domains via domain_key

lib/curriculum/builders/buildCourseFromBlueprint.ts
  → reads DB rows in blueprint slug order
  → fails closed on missing slugs or count mismatches
```

### Adding a New Program

1. Create `lib/curriculum/blueprints/[program].ts` following `prs-indiana.ts` structure
2. Register it in `lib/curriculum/blueprints/index.ts`
3. Run the curriculum generator script
4. Generator seeds `modules` and `curriculum_lessons` rows
5. LMS renders the course automatically — no new code required
6. Set `step_type = 'checkpoint'` on module-boundary lessons in the DB

---

## Completion Rules Engine

`lib/lms/completion-evaluator.ts` reads `completion_rules` table rows for a course/program.

Supported rule types:
- `lessons_complete` — all required lessons must be completed
- `quizzes_passed` — all required quizzes must pass `minScore`
- `min_hours` — minimum seat time
- `external_modules` — external certifications required

Default (no rules configured): all lessons must be complete.

**After Phase 8:** checkpoint rules will be enforced before completion is recognized.
