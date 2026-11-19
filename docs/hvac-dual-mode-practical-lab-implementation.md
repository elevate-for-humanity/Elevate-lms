# HVAC dual-mode practical lab — additive implementation plan

**Status:** Proposed curriculum mapping and initial contract tests only. Not published or assigned to learners.  
**Existing course:** `d48c61c4-8880-4d9d-9ab5-fab4dd51b201` (EPA 608 Refrigeration — Core, Types I, II & III).  
**Instructor source:** David Nazario's photographed 48-hour HVAC hands-on syllabus (residential split system, gas furnace, pressure test, vacuum, digital manifolds, recovery cylinders, multimeter, clamp meter, leak detector, pump-down, brazing; Interplay online).  
**Important:** Source syllabus gives 48 hours total, not individual topic-hour values. The 10-module allocation in `lib/lms/hvac-practical-plan.ts` is proposed pending David's approval.

## Verified current assets

- 21 published lessons on the existing course. Four EPA 608 practice tests exist.
- `components/lms/HvacSystemLab.tsx`: refrigeration diagram, hypothetical measurements, condenser 3D renderer.
- `components/lms/HVACSimulation.tsx` and `lib/lms/hvac-simulations.ts`: 3D equipment hotspots, currently one configured lesson/simulation mapping.
- `components/lms/HvacWorkbookTeaching.tsx`: interactive low-voltage circuit, recovery decision selector and airflow reasoning exercise.
- `content/hvac-sims/sim-01.json` through `sim-10.json`: branching diagnosis content already exists.
- Production Supabase `training_simulations`: 10 records, all active; `sim_attempts`: zero records at audit.
- Existing `course_practical_submissions`, `course_practical_reviews` and `learning_action_events` infrastructure.
- On the published course, zero lessons have explicit scenario prompts or structured `activities`, and none require instructor sign-off; course duration metadata is not credible evidence of 48 practical hours.

## Implementation order

1. **Map, review and approve syllabus:** Instructor reviews topic coverage, learning outcomes, exact time allocation and performance rubrics. Do not overwrite current lessons or progress.
2. **Build first equipment exercise:** start with digital manifold readings / pressure diagnostics as a branching, keyboard-accessible interactive lab. Use approved refrigerant/equipment specifications, safe mock values, fault branches and decision reasoning. No simulated tool action should command physical machinery.
3. **Integrate existing scenario registry:** wire authorized enrolled-student access to simulation JSON, with schema validation, anti-tamper server-side scoring, versioned content and persistence. Reuse the existing `training_simulations` and `sim_attempts` structures only after validating live RLS and endpoint authority. Do not duplicate tables.
4. **Instructor-led and independent modes:** David can demonstrate/assign a case, see attempts, review competency evidence and require remediation; remote learners can practice and submit evidence. Reuse the practical-review permission model.
5. **Separate hour accounting:** active, validated simulation time must not be conflated with actual observed physical practice or EPA exam certification. Instructor physical sign-off must be a separate event. No automatic award of 48 physical hours.
6. **Access and accessibility:** expose lab from the existing enrolled HVAC course and workbook; preserve student enrollment, progress and payment/access rules. Provide keyboard and mobile alternative to 3D/WebGL, server-side persisted resume state and adequate narration/transcripts.
7. **Vendor decision:** Interplay licensing and LTI/API access are unverified. Do not embed or copy licensed simulations without rights and tested integration.
8. **Release:** protected PR, current-head unit/integration/accessibility/RLS/E2E tests, independent reviewer approval, exact SHA deployment, real enrolled-student and instructor acceptance before announcing availability.

## Acceptance gates (not yet satisfied)

- Enrolled learner can launch, complete, leave, return and resume the **same** case.
- Unauthorized users cannot submit, alter scores, or inspect another learner's evidence.
- Scoring is computed by the server and tied to an immutable simulation content version.
- David can independently view, approve or reject competency evidence with retained history.
- Student can retry safely without overwriting earlier attempt evidence.
- Instructor-led and virtual use share outcomes but retain different delivery and hour categories.
- Existing 21 lessons, workbook, four practice tests, enrollment/payment, and progress remain unchanged.
- Instructor confirms physical hands-on equivalence is **not** asserted by completing virtual scenarios.
- Zero 404s and successful keyboard/mobile/desktop execution on the serving LMS build.
- Production acceptance records exact commit SHA and tested learner/instructor identities, without exposing their personal information.

## Release hold

This PR deliberately provides a reviewed curriculum contract and tests only. It does not seed lessons, change production Supabase, create a new enrollment, adjust hour records, launch agents or claim virtual-lab completion.
