# Intuit bookkeeping replacement — production handoff

The owner requested replacement of the archived QuickBooks-focused course with an independent Elevate course aligned to the ICBP exam domains. Do not reopen the public offering before the replacement passes media and learner verification. Do not delete or alter the existing student's enrollment, progress, or submissions.

## Saved production records

- Replacement course: `5a72b6d1-6a05-4294-832b-0a836ac4a74d` (`intuit-bookkeeping-professional`).
- Build: `88b2275e-ab36-4aad-b696-c5ebe491fd4e`.
- Initial production job: `2309975f-b8d3-421e-b0a1-f445d03834db`.
- Final assessment lesson: `cec95c57-04c5-40dd-a6ed-afc8319510ac`.
- Archived reference course: `2cffc43f-b90f-4c6d-a5d1-1fd2a5e14285`.
- Preserved introduction: `544f9204-40f6-4f32-b42b-aa108f1c27b6`. Original text and metadata are retained in the new orientation's `content_json.originalIntroductionReference`; its old publication state is not media approval.
- Existing program: `bd503ebf-d8e1-4c79-9efe-a72c001589b4`, still closed and archived.

## Authored content

`data/courses/intuit-bookkeeping-professional.mjs` contains 15 original instructional sections mapped to all 53 subobjectives in the publisher's OD 0123 outline. The current official Pearson/Intuit index links that outline. Source references are recorded with the course. The separate QuickBooks Certified User exam is not the target.

`data/courses/intuit-bookkeeping-assessment.mjs` contains an original 25-question cumulative final with worked answer explanations and a complete fictional month-end practical case. The 80% practice threshold is Elevate's mastery criterion, not an assertion about an official exam cut score. Payroll exercise amounts are illustrative, not current statutory rates.

The saved draft has six modules and 18 lessons: orientation; 15 exam-domain sections; month-end practical; final assessment. The production profile maps 17 instructional competencies to stable canonical lesson UUIDs and uses frozen original instructional sources. New narrated films, licensed relevant media, source-bound graphics, captions, per-lesson assessments/reassessment, delivered-media QA and learner runthrough remain production requirements. No archived footage has been certified as a new instructional film.

The instructional presenter is the existing Angela Thompson AI configuration, rather than Elizabeth Greene. Elizabeth remains the real administrative owner. The dashboard changes remove the hardcoded Elizabeth portrait and invalid instructor lookup columns.

## Completion and release

1. Observe actual claims and fresh heartbeats for this build; a queued job or successful dispatcher alone does not prove active lesson production.
2. Resolve genuine media licensing, authoring or rendering findings without falsifying approval or bypassing gates. Relevant media must be licensed for this course; unrelated Business-course entitlements are not automatic proof.
3. Verify all 17 instructional competencies through the existing production and publication contract.
4. Apply `scripts/courses/finalize-bookkeeping-rebuild.sql` through the database connector. It intentionally rejects incomplete production, checks matching build provenance and the 25-question final, then publishes the final and its module and restores total lesson count to 18. It does not reopen the public offering or transfer a student.
5. Verify the complete real learner journey, captions, videos, questions and practical submission/signoff. Preserve existing progress separately when connecting the replacement to the enrolled student; do not fabricate equivalent credit.
6. Reopen public program and Store offers only after the complete replacement is ready. The existing withdrawal middleware, navigation and application guards remain in force.

## Validation performed

- Four focused tests cover objective coverage, cumulative question validity and answer-position distribution, arithmetic balance of the practical case, draft isolation and canonical domain mappings.
- 77 existing dispatcher and monitor checks passed.
- Targeted instructor-component ESLint and TypeScript syntax checks passed. A full typecheck was requested through the shared memory lock; do not record it as passed without the actual result.
- The final-release transaction was attempted while the build was queued and correctly rejected with `Instructional production is not fully released`; no final was published.
- Database readback confirmed all 18 draft lessons, 25 final questions, archived old course and the unchanged one active program enrollment.
