# HVAC interactive course implementation

**Course:** d48c61c4-8880-4d9d-9ab5-fab4dd51b201 — EPA 608 Refrigeration — Core, Types I, II & III.

**Scope:** Stateful simulated practice throughout the existing 17 instructional lessons, with the four required EPA practice tests retained.

The initial catalog contains **64 sequential practice stages** across those 17 lessons.

**Release status:** Implementation and verification are in progress. This document is not deployment evidence. Production availability requires the protected release and live acceptance below.

## Source outline and hours

David Nazario's photographed outline is transcribed in HVAC_PRACTICAL_SOURCE_ALLOCATION in lib/lms/hvac-practical-plan.ts.

| Photographed activity        | Listed hours | Existing course practice                                 |
| ---------------------------- | -----------: | -------------------------------------------------------- |
| Interplay online             |            8 | Separate vendor activity; license/integration unverified |
| Residential split-system     |            5 | Chapters 2, 5, 12 and 14                                 |
| Gas furnace                  |            5 | Chapter 4                                                |
| Pressure test                |            3 | Chapter 9                                                |
| Vacuum                       |            3 | Chapter 9                                                |
| Digital manifold gauges      |            3 | Chapters 5 and 12                                        |
| Recovery cylinders           |            2 | Chapters 7 and 8                                         |
| Multimeters                  |            2 | Chapter 3                                                |
| Clamp meters                 |            4 | Chapter 3                                                |
| Leak detectors               |            2 | Chapters 9 and 12                                        |
| Pump down                    |            1 | Chapter 9                                                |
| Braze                        |            5 | Chapter 13                                               |
| **Sum of photographed rows** |       **43** |                                                          |
| **Printed total**            |       **48** |                                                          |
| **Unallocated difference**   |        **5** | Instructor clarification required                        |

Only eight hours are explicitly labeled online; delivery mode for the other 35 listed hours is not established. The older ten-module, 48-hour proposal in HVAC_PRACTICAL_MODULES remains an independent proposal, not the instructor's confirmed schedule. This implementation does not award attendance or physical hours, change course-duration metadata, or represent original simulations as licensed Interplay content.

## Root cause and correction

The canonical lesson route renders InteractiveLessonExperience. Earlier simulation assets were connected to old lesson IDs, limited to a few workbook sections, represented as checklist submissions, or not wired into that route. Their presence in the repository did not provide stateful practice throughout the enrolled course.

HvacCourseSimulation is mounted in the actual canonical lesson page after the existing lesson experience and before the workbook. Each of the 17 instructional lesson IDs resolves to a versioned server-side definition. The existing video, reading, workbook, knowledge checks, lesson completion, enrollment, payment and pacing behavior are preserved. Lesson anchors and the existing HVAC course home provide direct lab access and saved mastery status.

The four published required practice tests were attached to an unpublished retired Module 10, so the course map omitted them when grouping published modules. A guarded forward migration links those same four lessons to the published final module, **Practical Skills and Career Support**. It preserves IDs, questions, thresholds, global order, release weeks, scores and attempts. Course continuation follows global lesson order rather than presentation grouping.

## Full-course learning sequence

| Chapter | Simulated practice                                                                                               |
| ------- | ---------------------------------------------------------------------------------------------------------------- |
| 1       | Classify study, simulation, observed skill and external credential evidence                                      |
| 2       | Trace split-system components in heating/cooling modes and choose an isolation response                          |
| 3       | Operate a virtual meter bench: voltage, resistance, switch, instrument mode and clamp placement                  |
| 4       | Interpret furnace call, draft, ignition, flame and limit states; respond to protective stops                     |
| 5       | Adjust supplied saturation/line temperatures; interpret superheat, subcooling and inconsistent phase assumptions |
| 6       | Evaluate refrigerant-release, labeling and recovery decisions                                                    |
| 7       | Compare cylinder tare, gross mass and a fictional work-card limit                                                |
| 8       | Select the small-appliance recovery path from equipment and compressor evidence                                  |
| 9       | Compare pressure/vacuum observations at selected times, investigate leaks and evaluate pump-down conditions      |
| 10      | Explore air ingress and equipment-specific decisions on a low-pressure system                                    |
| 11      | Route Core, Type I, Type II and Type III equipment cases                                                         |
| 12      | Choose manifold, temperature or leak-detection observations before changing a diagnosis                          |
| 13      | Explore airflow restrictions and sequence supervised brazing preparation, process and inspection decisions       |
| 14      | Investigate a changing cooling complaint with evidence-based next actions                                        |
| 15      | Prepare a construction area and respond to ladder, electrical and hot-work hazards                               |
| 16      | Coordinate an emergency response and distinguish practice from external CPR/first-aid verification               |
| 17      | Complete a documented customer handoff, identify missing evidence and plan a verified next step                  |

The four existing EPA practice quizzes follow the instructional sequence. Practice does not issue EPA certification, OSHA cards, CPR credentials or physical skill sign-offs.

## Interaction and scoring

Learners change labeled controls, apply settings and run a virtual check. Readings and SVG equipment states respond to those values. Decisions require an observation of the current settings; a control change invalidates that observation. An incorrect or unsafe choice retains the current stage and explains the correction.

Stages are sequential. The server validates controls, finite values, numeric steps, stage identity and prerequisites. The client receives only the current stage, without future stages, requirements or answer keys. A finished attempt starts at 100 minus ten points per incorrect decision; at least 80 records simulation mastery. This metric is separate from lesson completion and required quiz results.

The UI confirms saves, restores confirmed state, preserves best mastery after a restart, retries an uncertain save using the same request ID and reloads after a revision conflict. It never claims an unconfirmed decision was saved. Native controls, textual readings, focus management and mobile stacking provide access without WebGL. These are teaching models, not field equipment instructions or universal setpoints.

## Persistence and access

The API at /api/learner/hvac-simulations reuses interaction_progress with the reserved hvac-sim: namespace. No parallel progress table was added.

Every request requires an active authenticated user, rate limiting, the exact canonical course, published lesson membership and existing assertLessonAccess authorization. The authenticated hvac_simulation_session_ready() RPC checks the existing privileged-session MFA condition before a narrow service-role save. Missing migration or failed security checks deny saving.

Stored history includes schema/content versions, a monotonic revision and bounded request IDs/actions. Server replay calculates current state, completed attempts, best score and mastery. Compare-and-swap updates prevent lost changes; repeated request IDs are idempotent. Reset starts another attempt while retaining earlier events. Client-supplied scores, identities, completion or hours are rejected.

Three restrictive RLS policies prevent browser clients from inserting, updating or deleting hvac-sim: progress. They supplement existing owner, administrator-read and MFA policies. Course-home and API reads use the authenticated client. The existing generic interaction endpoint cannot write the reserved namespace.

Released content versions are immutable. Future scoring, stage, prerequisite or model-meaning changes require a new content version/interaction ID and explicit treatment of older attempts. Never silently reinterpret saved evidence. The initial unpublished version may be corrected before its first release.

## Forward migrations

1. 20261125014012_protect_hvac_simulation_progress.sql reserves authoritative writes and adds the authenticated readiness check. It changes no learner rows.
2. 20261125014055_hvac_required_practice_module_links.sql repairs four stale quiz module links. It resolves verified course/module identity, refuses an unexpected prior mapping, runs atomically and is idempotent after repair. A fresh database without the authored course receives no synthetic lessons.

Apply only these scoped migrations through the approved Supabase path after release validation. Verify policy definitions, RPC grants, lesson/module counts, quiz content/score preservation and progress integrity. Do not run unrelated outstanding migrations as part of this change.

## Verification and release evidence

Focused verification covers calculations and all canonical mappings, UI behavior, authenticated authorization, tamper rejection, retry/concurrency handling, event replay, PostgreSQL RLS, guarded quiz migration behavior and existing workbook/course-access regressions. Final combined verification passed **143 tests across ten files**, including the independent content and restart-state corrections. Repository-wide lint and migration lint also passed; recheck the final PR head through required CI.

An isolated browser preview uses the real UI/model with synthetic in-memory progress. Closing the switch changed the displayed current from 0 A to 2 A; reloading restored the stage and control. This demonstrates interaction, not production authentication/database acceptance.

The deployed-course acceptance spec is enabled by QA_HVAC_SIMULATION_ACCEPTANCE=1 in the existing trusted LMS release-acceptance workflow. It requires the exact serving SHA and a per-run disposable learner, exercises an incorrect choice, changing meter readings, saved-state reload, mastery, reset/history retention and all four practice links on five device profiles. It runs serially and cleans only that disposable learner's HVAC simulation rows. The isolated QA project currently contains only orientation, with no course modules or interaction_progress table; the full-course spec is deliberately not represented as having run against that incomplete fixture.

The affected production TypeScript surface passed a scoped check. The full LMS typecheck exceeded workspace process resources (exit 137 without a TypeScript diagnostic). Exact-commit CI/build evidence remains required; scoped verification does not replace that gate.

Before announcing availability:

1. Reconcile current main, commit the complete change and satisfy protected PR checks/review.
2. Apply and verify the two scoped migrations while preserving learner completion, enrollment, approvals and credentials.
3. Release approved current main through the existing Google Cloud workflow; retain image digest, ready revision and serving SHA.
4. Use the disposable enrolled QA learner to verify actual launch, changing readings, save, reload, retry, navigation and all four practice links on desktop and phone. Retain the exact deployed SHA.
5. Verify existing instructor/practical-review behavior before claiming instructor acceptance or physical competency equivalence.

Instructor physical approval, the missing five source hours and any Interplay license/integration remain separate decisions. Simulation completion does not resolve them automatically.
