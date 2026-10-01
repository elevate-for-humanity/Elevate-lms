# Ultimate Course Builder lesson contract

Version: `ultimate-lesson-2026-10-01.1`.

The executable contract is `lib/ultimate-course-builder/core/lesson-contract.ts`. Each stage records its contract version, a SHA-256 of all prior stage payloads and locked profile inputs, its output SHA-256, validation outcome, and time. Changing any input invalidates that stage and every dependent stage. Old unversioned passes cannot be restored or published.

| Step | Required output and acceptance evidence |
| --- | --- |
| 1. Standards lock | Locked authority/version, competency classification, and source provenance. Course-defined lessons keep course-defined references rather than invented DOL IDs. |
| 2. Objectives | Nonempty measurable objective IDs and source requirement mappings; complete source-bound blueprint retained for resumes. |
| 3. Prerequisites | Explicit learner checks with expected answers, or a stated reason none applies. |
| 4. Teaching sequence | Thirteen ordered stages with instruction and objective mappings, not stage labels alone. |
| 5. Instructor script | Complete spoken segments with objective/source mappings, examples, corrections, practice, and recap. Every teaching stage must be represented in speech. |
| 6. Storyboard | Each script segment becomes a scene without shortening its dialogue. Each scene has an instructional visual purpose. |
| 7. Visual assignment | Explicit scene-to-asset assignments with license evidence and relevance reasons. Item landing pages and arbitrary indexed stock assets do not prove a license or relevance. |
| 8. Scene construction | Shot plan uses assigned assets and forbids loops. Short source videos fail duration checks instead of repeating. |
| 9. Narration | Generate approved segments once, measure their durations, obtain recognized word timings, and retain durable audio assets. |
| 10. Synchronization | Scene timing follows measured audio; captions use recognized word times. The 30fps intro is three seconds and the outro is two seconds. |
| 11. Active teaching | Actual prompts, feedback, and objective mappings for guided practice, independent practice, checks, remediation, and reassessment. |
| 12. Mistakes/corrections | Specific wrong actions, correct actions, and explanations mapped to objectives. |
| 13. Assessment | Real objective IDs, scored questions, explanations, targeted remediation, a distinct reassessment bank, and practical rubric when required. |
| 14. Render | Approved segment audio is reused in the compositor; strict rendering rejects changed text or audio duration. No 180-second narration truncation. Versioned MP4, VTT, and transcript assets. |
| 15. Finished media QA | Decode the actual MP4, transcribe its actual audio, detect scene changes/replay/black/frozen frames, inspect source/license evidence, and OCR encoded titles at desktop and phone widths. |
| 16. Instructional QA | Compare delivered transcription with approved objectives and script. Reviewer excerpts must actually occur in the delivered transcript. Labels cannot count as teaching. |
| 17. Narration QA | Analyze audio from the delivered MP4, bound to its media hash. Separate narration files cannot certify the film. |
| 18. Learner runthrough | Authenticated browser observations for desktop/mobile/PWA, complete playback, captions, activities, scoring, remediation/reassessment, saved progress, resume, completion, and accessibility. Evidence is signed and bound to the staged artifact hash and video hash. |
| 19. Repair | Execute at most two targeted repairs/retries per lesson, invalidate dependent artifacts, and record attempts/unresolved failures. Durable missing sources, licenses, and browser configuration remain blockers. |
| 20. Release | All twenty current certificates, actual traceability IDs, accessibility results, complete competency coverage, canonical lesson identity, and publication readback. Rollback and the alternate publisher cannot bypass the contract. |

## Supplying authorized content

The authenticated admin endpoint `/api/admin/ultimate-course-builder` supports action `configure-contract` with `buildId`, and either `lessonBlueprints` keyed by competency ID or `instructionalSources` containing `{id,text}` entries. It validates authored blueprints before storing them and rejects changes to a running build. Existing create-profile requests can also carry these fields.

A competency title or Appendix A work-process label is not the full instructional curriculum. Without an authored blueprint or full authorized source text, the builder returns `ULTIMATE_AUTHORED_BLUEPRINT_OR_INSTRUCTIONAL_SOURCES_REQUIRED`.

Source-based generation and delivered-instruction review use the existing owned inference provider through `ELEVATE_LLM_URL` and `ELEVATE_LLM_SECRET`. No paid-provider fallback is added. Missing configuration blocks the stage.

## Worker requirements

The render images include Chromium, FFmpeg, and Tesseract. Word-timed caption alignment uses the existing Cloudflare transcription credentials and configured transcription model. A model response without valid word timings is rejected.

The learner test boundary uses `ULTIMATE_LEARNER_RUNTHROUGH_URL` and `ULTIMATE_LEARNER_RUNTHROUGH_SECRET`. The endpoint must exercise an authenticated staged test enrollment, not a read-only administrator preview. Its signed response contains the request contract version, artifact hash, media hash, lesson-build ID, test-run ID, observation records `{check,passed,action,observed}`, accessibility results, and a recent `checkedAt`. HMAC-SHA256 signs the canonical evidence hash. An installed generic browser service is not yet proof that this course-specific endpoint or isolated test enrollment exists. Neither URL syntax nor progress-table existence can replace these tests.

## Current acceptance status

Repository regression tests validate enforcement, repair bounds, checkpoint invalidation, media assignment boundaries, and rejection of forged/wrong-video browser evidence. They are not course-completion evidence.

On inspection, all four watched build profiles lacked `instructionalSources` and `lessonBlueprints`. No finished course has been certified under this contract. The authenticated course-specific browser worker must still be connected and exercised against isolated staged enrollments before live completion can be claimed.
