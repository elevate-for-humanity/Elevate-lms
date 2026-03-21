# LMS Lesson Content Standard

## Purpose

This document defines the canonical lesson shape for all programs in the LMS. Every course — HVAC, PRS, CRS, Bookkeeping, and any future program — must comply with this standard. No program-specific fallback logic is permitted in the lesson renderer.

---

## Required Fields — `course_lessons`

Every row in `course_lessons` for a published course must satisfy all of the following:

| Field | Type | Requirement |
|-------|------|-------------|
| `content` | `JSONB` (string) | Non-null, not `{}`, contains valid HTML string. Minimum 150 chars stripped. |
| `lesson_type` | `lesson_type` enum | One of: `lesson`, `checkpoint`, `exam`, `quiz`, `lab`, `assignment`, `certification` |
| `slug` | `TEXT` | Unique within the course. Matches `curriculum_lessons.lesson_slug`. |
| `title` | `TEXT` | Non-null, non-empty. |
| `order_index` | `INTEGER` | Non-null. Encodes position as `(module_order × 1000 + lesson_order)`. |
| `module_id` | `UUID` | Non-null. References a `course_modules` row in the same course. |
| `passing_score` | `INTEGER` | `70` for `checkpoint`, `exam`, `quiz`. `0` for `lesson`, `lab`, `assignment`. |
| `quiz_questions` | `JSONB` | Required for `checkpoint`, `exam`, `quiz` lessons. `NULL` acceptable for `lesson` type. |
| `is_required` | `BOOLEAN` | `true` for all lessons. |

---

## Content Shape

`course_lessons.content` must be a JSONB string containing valid HTML:

```json
"<h2>Lesson Title</h2><p>Body paragraph one.</p><p>Body paragraph two.</p>"
```

**Not acceptable:**
- `null`
- `{}`
- `"plain text without HTML tags"`
- `"<p></p>"` (empty tags)

The `lms_lessons` view extracts content via `(cl.content#>>'{}')` — this unwraps the JSONB string to a raw HTML string. The lesson page passes this directly to `dangerouslySetInnerHTML`. The content must be valid HTML at the point it enters `course_lessons`.

---

## Source of Truth

Content is authored in `curriculum_lessons`:

| Field | Purpose |
|-------|---------|
| `script_text` | Lesson body — plain text or HTML. Converted to HTML on promotion. |
| `lesson_title` | Used as `<h2>` heading when `script_text` does not start with a title. |
| `summary_text` | Optional learner-facing summary. Not currently rendered. |
| `reflection_prompt` | Optional reflection question. Not currently rendered. |
| `quiz_questions` | JSONB array of quiz question objects. Promoted as-is. |
| `passing_score` | Integer threshold. Defaults to 70 for checkpoint/exam/quiz. |
| `step_type` | Maps to `lesson_type` in `course_lessons`. |

---

## Promotion Pipeline

Content moves from `curriculum_lessons` → `course_lessons` via `promote_to_course_lessons(program_slug)`.

This function:
1. Resolves the canonical `courses` row for the program
2. Detects 0-based vs 1-based `module_order` automatically
3. Converts `script_text` to HTML via `format_script_to_html(script_text, lesson_title)`
4. Upserts into `course_lessons` with `ON CONFLICT (course_id, slug) DO UPDATE`
5. Hard-fails if `script_text` is empty for a content lesson
6. Hard-fails if no matching `course_modules` row exists

**The promotion function is the only sanctioned path from `curriculum_lessons` to `course_lessons`.** One-off migration inserts are not permitted.

---

## Enforcement

Two DB-level guards prevent violations from reaching production:

**Trigger: `trg_enforce_content_not_empty`**
Fires `BEFORE INSERT OR UPDATE` on `course_lessons`. Raises an exception if `content` is `NULL` or `{}` for a lesson in a published, active course.

**Promotion function hard-fails:**
`promote_to_course_lessons()` raises an exception if `script_text` is empty for any content lesson. CRS and Bookkeeping will fail until content is authored. That is the correct behavior.

---

## Renderer Contract

The lesson page (`app/lms/(app)/courses/[courseId]/lessons/[lessonId]/page.tsx`) must:

1. Read `lesson.content` from `lms_lessons` view
2. Treat any of the following as "no content": `null`, `undefined`, `'{}'`, empty string, non-string value
3. Render a generic `LessonContentUnavailable` component when content is absent — not a blank screen, not an HVAC-specific fallback
4. Never call `buildLessonContent()` or `HVAC_LESSON_UUID` for non-HVAC programs
5. Apply `sanitizeRichHtml()` before `dangerouslySetInnerHTML`

---

## HVAC Transition

HVAC currently uses `buildLessonContent()` and `HVAC_QUIZ_MAP` as runtime fallbacks. These exist because HVAC predates the canonical pipeline. They are not a feature — they are technical debt.

**Target state:** HVAC's `course_lessons` rows contain all content and quiz data directly. The fallback is never triggered. Once verified, `buildLessonContent()`, `isPlaceholderContent()`, and `HVAC_LESSON_UUID` imports are removed from the lesson page.

**Transition gate:** HVAC fallback may only be removed after:
- All 95 HVAC `course_lessons` rows have `content` verified as non-placeholder HTML
- All HVAC checkpoint lessons have `quiz_questions` populated in `course_lessons`
- The lesson page renders HVAC correctly without the fallback (verified in staging)

---

## Program Readiness Checklist

A program is **not ready to publish** until all of the following are true:

- [ ] `programs` row exists with `published=true`, `is_active=true`
- [ ] `courses` row exists, `status=published`, `is_active=true`, `program_id` correctly linked
- [ ] `course_modules` rows exist, one per module, `order_index` sequential from 1
- [ ] `course_lessons` rows exist, one per lesson, all with valid HTML `content`
- [ ] All `checkpoint`/`exam`/`quiz` lessons have `quiz_questions` populated and `passing_score=70`
- [ ] No orphaned lessons (null or cross-course `module_id`)
- [ ] `pnpm validate:lms -- --slug <program-slug>` exits 0
- [ ] Authenticated learner can reach course page, see lesson list, open first lesson, read content

---

## Violation Response

If any lesson in a published course has `content = NULL` or `content = {}`:

1. Run `SELECT * FROM promote_to_course_lessons('<program_slug>')` to re-promote
2. If promotion fails, the program has missing `script_text` — author content first
3. Do not manually patch `course_lessons.content` — fix the source in `curriculum_lessons` and re-promote
4. Run `pnpm validate:lms -- --slug <program_slug>` to confirm repair
