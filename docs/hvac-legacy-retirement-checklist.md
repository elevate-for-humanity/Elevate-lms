# HVAC Legacy Retirement Checklist

Target window: **2027-Q1**

Delete `case 'legacy_hvac'` from `LessonContentRenderer.tsx` only when every item below is confirmed true. The machine verifier (`pnpm verify:hvac-legacy`) enforces items 1–9 automatically. Items 10–12 require human confirmation.

---

## Machine-verified prerequisites

Run `pnpm verify:hvac-legacy` and confirm all checks pass before opening the retirement PR.

1. **`pnpm verify:hvac-legacy-removal-state` passes** — repo state is internally consistent (renderer branch, tracked legacy files, kill switch, and retirement stub are all present together).

2. **`pnpm verify:hvac-legacy-retirement` passes** — all DB prerequisites confirmed against live Supabase:
   - All HVAC `video` lessons in `curriculum_lessons` have non-empty `video_file`
   - All HVAC assessment lessons (`quiz`, `checkpoint`, `final_exam`) have non-empty `quiz_questions`
   - `lms_lessons` view returns `lesson_source = 'curriculum'` for all HVAC lessons (no `training` rows)
   - `lms_lessons` view definition references `curriculum_lessons`, not `training_lessons`
   - No HVAC `simulation_key` values use `legacy_` prefix or reference `training_lessons`

3. **Required CI job passes on the retirement PR** — `HVAC legacy retirement prerequisites` step in `ci-cd.yml` must be green.

---

## DB verification queries

Run these in Supabase Dashboard SQL Editor before merging. All must return zero problem rows.

See: `supabase/migrations/20270101000001_drop_legacy_hvac_content_path.sql`

---

## Retirement PR sequence

Execute in this exact order. Do not split across multiple PRs.

1. Run `pnpm verify:hvac-legacy` locally. Save the output.
2. Flip `HVAC_LEGACY_RUNTIME_ALLOWED` to `false` in `lib/flags/hvacLegacyRetirement.ts`.
3. Deploy to staging. Confirm no HVAC lesson pages throw the kill-switch error.
4. Remove `case 'legacy_hvac'` from `components/lms/LessonContentRenderer.tsx`.
5. Remove the `HVAC_LEGACY_RUNTIME_ALLOWED` / `HVAC_LEGACY_RETIREMENT_TARGET` imports from `LessonContentRenderer.tsx`.
6. Delete all files listed under **Files to delete atomically** below.
7. Update this checklist: mark retired, add the merge date.
8. Keep `supabase/migrations/20270101000001_drop_legacy_hvac_content_path.sql` as a historical audit record.
9. Merge only after the required CI job passes.

---

## Files to delete atomically

All of the following must be deleted in the same PR as the renderer branch removal. Deleting any subset is a broken state and will be caught by `pnpm verify:hvac-legacy-removal-state`.

**Tracked consolidation files (lib/legacy-hvac/):**
- `lib/legacy-hvac/getLegacyHvacContent.ts`
- `lib/legacy-hvac/mapTrainingLessonToLms.ts`
- `lib/legacy-hvac/resolveLegacyHvacSimulation.ts`

**HVAC static lib files (lib/courses/hvac-*.ts — 30 files):**
- `lib/courses/hvac-captions.ts`
- `lib/courses/hvac-completion-workflow.ts`
- `lib/courses/hvac-content-builder.ts`
- `lib/courses/hvac-csv-loader.ts`
- `lib/courses/hvac-diagnostic-exercises.ts`
- `lib/courses/hvac-epa-tags.ts`
- `lib/courses/hvac-epa608-lessons.ts`
- `lib/courses/hvac-epa608-prep.ts`
- `lib/courses/hvac-equipment-models.ts`
- `lib/courses/hvac-labs.ts`
- `lib/courses/hvac-lesson-content.ts`
- `lib/courses/hvac-lesson-number-map.ts`
- `lib/courses/hvac-lesson-quizzes.ts`
- `lib/courses/hvac-lesson5-captions.ts`
- `lib/courses/hvac-lesson5-recap.ts`
- `lib/courses/hvac-module-data.ts`
- `lib/courses/hvac-ojt-competencies.ts`
- `lib/courses/hvac-procedures.ts`
- `lib/courses/hvac-program-metadata.ts`
- `lib/courses/hvac-quick-checks.ts`
- `lib/courses/hvac-quiz-banks.ts`
- `lib/courses/hvac-quiz-map.ts`
- `lib/courses/hvac-quizzes.ts`
- `lib/courses/hvac-recaps.ts`
- `lib/courses/hvac-service-scenarios.ts`
- `lib/courses/hvac-tool-breakdowns.ts`
- `lib/courses/hvac-troubleshooting-sims.ts`
- `lib/courses/hvac-uuids.ts`
- `lib/courses/hvac-video-map.ts`
- `lib/courses/hvac-visual-library.ts`

**HVAC LMS enrichment files:**
- `lib/lms/hvac-enrichment.ts`
- `lib/lms/hvac-simulations.ts`

---

## What must NOT be deleted

- `training_lessons` table and its HVAC rows — retained as read-only archive
- `supabase/migrations/20270101000001_drop_legacy_hvac_content_path.sql` — historical audit record
- `lib/flags/hvacLegacyRetirement.ts` — may be deleted after the renderer branch is gone and CI is updated

---

## Merge policy

All retirement PRs are governed by `docs/hvac-legacy-retirement-merge-policy.md`.
Read it before opening a retirement PR. The merge policy is not optional.

---

## Status

- [ ] `pnpm verify:hvac-legacy` passes locally
- [ ] Required CI job passes on retirement PR
- [ ] All DB verification queries return zero problem rows
- [ ] Staging confirmed: no kill-switch errors after flipping `HVAC_LEGACY_RUNTIME_ALLOWED = false`
- [ ] Retirement PR merged — date: ___________
