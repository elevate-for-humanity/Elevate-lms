# Legacy Program Paths

Generated: 2026-03-27  
Auditor: Ona

---

## Summary

Two program delivery paths coexist in the codebase:

| Path | Description | Status |
|------|-------------|--------|
| **DB-driven LMS** | `curriculum_lessons` + `lms_lessons` view + `step_type` routing | **Canonical — use for all new programs** |
| **HVAC hardcoded** | `lib/courses/hvac-*.ts` + `HVAC_QUIZ_MAP` + `HVAC_LESSON_UUID` + `buildLessonContent()` | **Legacy — HVAC only, do not replicate** |

---

## HVAC Legacy Files

These 32+ files are HVAC-specific. They exist because HVAC was built before the DB-driven engine. They must not be copied or extended for new programs.

### Lesson Content

| File | Purpose |
|------|---------|
| `lib/courses/hvac-content-builder.ts` | Builds rich HTML lesson content from static definitions |
| `lib/courses/hvac-quiz-map.ts` | Hardcoded quiz questions keyed by lesson definition ID |
| `lib/courses/hvac-uuids.ts` | Maps lesson definition IDs to Supabase UUIDs |
| `lib/courses/hvac-quick-checks.ts` | Quick-check questions keyed by lesson UUID |
| `lib/courses/hvac-captions.ts` | Lesson captions |
| `lib/courses/hvac-recaps.ts` | Module recap content |
| `lib/courses/hvac-epa608-prep.ts` | EPA 608 exam prep content |
| `lib/courses/hvac-lesson-content.ts` | Static lesson content definitions |
| `lib/courses/hvac-lesson-definitions.ts` | Lesson definition objects |
| `lib/courses/hvac-module-definitions.ts` | Module definition objects |
| `lib/courses/hvac-completion-workflow.ts` | HVAC-specific credential advancement on completion |

### LMS Enrichment

| File | Purpose |
|------|---------|
| `lib/lms/hvac-enrichment.ts` | Enriches lesson data with HVAC-specific content |
| `lib/lms/hvac-simulations.ts` | Maps lesson UUIDs to 3D simulation keys |

### AI / Instructor

| File | Purpose |
|------|---------|
| `lib/ai-instructor/hvac-instructor-prompt.ts` | HVAC-specific AI instructor system prompt |

### Hardcoded Pages

| Route | File | Problem |
|-------|------|---------|
| `/courses/hvac/module1/lesson1` | `app/courses/hvac/module1/lesson1/page.tsx` | Standalone lesson page. Imports `@/courses/hvac/module1/quiz1`. Not part of LMS engine. Not linked from LMS nav. |

---

## Coexistence in the Lesson Player

`app/lms/(app)/courses/[courseId]/lessons/[lessonId]/page.tsx` runs both paths:

```
if (lessonData.content_type === 'quiz' && no quiz_questions in DB) {
  // HVAC legacy path: look up HVAC_QUIZ_MAP by UUID
  const defId = HVAC_LESSON_UUID reverse-lookup
  quizQuestions = HVAC_QUIZ_MAP[defId].questions
}

if (isPlaceholderContent(lessonData.content)) {
  // HVAC legacy path: build rich HTML from static definitions
  enrichedContent = buildLessonContent(defId)
}
```

This is intentional backward compatibility. The HVAC course (`training_lessons`, 94 rows) has no `quiz_questions` in the DB — they live in `hvac-quiz-map.ts`. Until HVAC is migrated to `curriculum_lessons` with DB-stored quiz questions, this path must remain.

**Rule:** Do not add new programs to `HVAC_QUIZ_MAP`, `HVAC_LESSON_UUID`, or `buildLessonContent`. New programs use `curriculum_lessons` with `quiz_questions` stored in the DB.

---

## New Program Path (canonical)

For any program added after HVAC:

1. Create `lib/curriculum/blueprints/[program].ts` following `prs-indiana.ts`
2. Register in `lib/curriculum/blueprints/index.ts`
3. Run `lib/services/curriculum-generator.ts` to seed `modules` + `curriculum_lessons`
4. Set `step_type = 'checkpoint'` on module-boundary lessons
5. Store `quiz_questions` as JSONB in `curriculum_lessons` rows
6. LMS renders automatically — no new code required

---

## Healthcare Fundamentals Static Page

`app/lms/(app)/courses/healthcare-fundamentals/page.tsx` is a static marketing-style page inside the LMS route group. It is not DB-driven and not connected to the lesson player. It predates the DB-driven engine.

**Status:** Legacy. Do not add new static course pages inside `app/lms/`. All new courses must be DB-driven and accessible via `/lms/courses/[courseId]`.
