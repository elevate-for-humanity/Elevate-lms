# HVAC Content Migration Decision Memo

Generated: 2026-03-17

## Context

The HVAC Technician Program has two parallel content paths:

| Path | Table | Rows | Content | Live? |
|---|---|---|---|---|
| Legacy | `training_lessons` | 95 | Full — scripts, quizzes, practice exams | **YES** |
| New engine | `curriculum_lessons` | 47 | Empty — title-only skeleton | NO |

The legacy path is the only path that serves real learners. The new engine skeleton was created during a curriculum generator run but was never populated with content. Both paths share the same program (`4226f7f6`) and course (`f0593164`) records.

## Parity Audit Results

### Legacy lesson blocks

| Range | Count | Content type |
|---|---|---|
| 1–10 | 10 | Orientation, safety, tools, HVAC fundamentals |
| 11–20 | 10 | Electrical, refrigeration basics |
| 21–30 | 10 | EPA 608 Core — ozone, regulations, refrigerant types |
| 31–40 | 10 | Recovery/recycling, Type I small appliances |
| 41–50 | 10 | Type II high-pressure, Type III low-pressure |
| 51–60 | 10 | Practice exams (Core, Type I, II, III, Universal) |
| 61–70 | 10 | Installation, commissioning, troubleshooting |
| 71–76 | 6 | Advanced diagnostics, business skills |
| 77–84 | 8 | OSHA 30-Hour Construction |
| 85–87 | 3 | CPR/First Aid |
| 88–95 | 8 | NRF Rise Up (retail/customer service) |

### Curriculum_lessons skeleton (new engine)

10 modules, 47 rows. All `script_text` = NULL. No quiz questions. No practice exams.
Module titles are generic (Safety & Tools, HVAC Fundamentals, Refrigeration Basics, etc.) — they do not map 1:1 to the legacy structure.

### Assessment gap

| Assessment type | Legacy | Curriculum_lessons |
|---|---|---|
| Module quizzes | 8 (70% threshold) | 10 checkpoints (80% threshold) |
| Type-specific practice exams | 4 (Core/I/II/III) | 0 |
| Universal full practice exam | 1 | 1 (exam type, no questions) |
| OSHA 30 assessment | 1 | 0 |
| CPR/First Aid assessment | 1 | 0 |

**Pass threshold mismatch:** Legacy = 70% (matches real EPA 608). New engine = 80%. This is a policy inconsistency that must be resolved before activating the new path.

---

## Decision Table

### KEEP IN LEGACY (do not migrate yet)

| Item | Reason |
|---|---|
| All 95 `training_lessons` rows | Only complete content. Deleting breaks the live course. |
| Legacy quiz questions (lessons 4, 10, 16, 22, 34, 39, 46, 52) | Validated EPA 608 content. Not replicated in new engine. |
| Practice exams (lessons 55–59) | 5 full-length exams. No equivalent in curriculum_lessons. |
| OSHA 30-Hour block (lessons 77–84) | Separate credential. No equivalent in curriculum_lessons. |
| CPR/First Aid block (lessons 85–87) | Separate credential. No equivalent in curriculum_lessons. |
| NRF Rise Up block (lessons 88–95) | Separate credential. No equivalent in curriculum_lessons. |
| 70% pass threshold | Matches real EPA 608 exam. Do not silently change. |

### MIGRATE NOW (safe, low-risk)

| Item | Action |
|---|---|
| Dead program records | ✅ Done — `e5a053ca` and `7e7d355f` deleted |
| `curriculum_lessons` type annotation | ✅ Done — false `CredentialBlueprint` cast removed |
| Admin curriculum builder warning | ✅ Done — banner shown for HVAC course |
| Publish route comment | ✅ Done — legacy note added |

### DEFER (requires deliberate migration project)

| Item | Prerequisite before doing |
|---|---|
| Populate `curriculum_lessons.script_text` from legacy | Full content review + EPA 608 alignment audit |
| Migrate practice exams to `step_type='exam'` | Decide pass threshold (70% vs 80%) |
| Migrate OSHA/CPR/NRF as separate credential blocks | Product decision on separate certificate issuance |
| Switch live learner path from `training_lessons` to `curriculum_lessons` | All above complete + full end-to-end learner simulation |
| Apply `FORCE ROW SECURITY` on `checkpoint_scores` | Migrate `recordCheckpointAttempt` to learner-scoped access first |
| Tighten `lesson_progress` super_admin RLS | Replace admin enrollment-deletion workflow first |

---

## Recommended pass threshold

**Use 70% across both paths.** Rationale:
- Matches the actual EPA 608 exam passing standard
- Consistent with the validated legacy quizzes
- 80% is more rigorous but creates a false signal — learners who pass at 80% internally may still fail the real exam, and learners who would pass the real exam at 70% are blocked unnecessarily

When activating the new engine path, update `curriculum_lessons.passing_score` for all HVAC checkpoints from 80 to 70.

---

## What must not happen

- Do not delete `training_lessons` for HVAC without completing the full migration
- Do not route learners to `curriculum_lessons` path until all 95 lessons are populated
- Do not change the pass threshold without an explicit decision recorded here
- Do not add OSHA/CPR/NRF to the new engine without deciding whether they issue separate certificates
