# Indiana pathway reconciliation — October 31, 2026

## Applied and verified

- Commit 0a2e80207ccef0151c6a7c0a5c99ef4c263b31ab: saved empty-program completion repair in scripts/sql/harden-empty-program-completion.sql; applied as Supabase migration harden_empty_program_completion to the main Elevate project.
- Before repair, unknown program IDs and sampled programs with no lessons returned true from is_program_completion_eligible_internal. After repair they return false. Null-user check also returns false. Four active courses reject a random learner without progress. No certificate issuance or student-progress mutation was used.
- Commit b39b99e6a775009bdfec6caa115eb54e13d9093d: current barber lesson slugs exactly match the 14 apprenticeship_standard_competencies keys. Replaced the missing connection by inserting 14 instructional mapping records, with an exact-match cardinality assertion and duplicate avoidance. No learner competency completion or hour credits were inserted.
- Commits d6712a91c374ded8228972b67ec138bb53d37b51 and c18caae9100544b3d0f28e20cc33c7f18e9a48cb: barber and esthetician syllabus files now describe the existing competency-based registry completion model and 260/300 RTI totals. Removed conflicting fixed-term introductory completion claims and blanket funding/approval claims. Both files were fetched back and matched exactly.

## Source discrepancy requiring primary-document reconciliation

The immutable-looking TypeScript source itself contains conflicting hour totals:
- Barber relatedInstruction items sum to 320, but relatedInstructionHours and the database standard say 260.
- Esthetician relatedInstruction items sum to 400, but relatedInstructionHours and the database standard say 300.
- Manicurist items sum to 210, matching its declared 210.

Do not edit signed-standard representations to force these sums to agree. Locate the actual signed approved Appendix A, validate its revision and subject allocations, then reconcile the mirrored records. Updated syllabi intentionally do not invent subject-hour allocations.

## Remaining implementation

1. Completion eligibility still needs authoritative assigned-course selection, publication/completeness checks, approved RTI/OJL evidence, practical signoffs, and per-program completion criteria. The empty-program repair is deliberately narrow.
2. Barber RTI subject coverage beyond the current short lesson set remains unverified. A competency mapping is not verified learner mastery or full-hour compliance.
3. Hair Stylist/Cosmetologist signed source remains absent from the canonical registered-standard registry inspected; do not manufacture one.
4. Reconcile course/program/delivery hour fields for HVAC, bookkeeping, cosmetology, business start-up, and CNA using actual instructional schedules.
5. Finish and verify HVAC/bookkeeping replacement publication without reviving obsolete copies.
6. Link esthetics/nail workbook sections only to actual appropriate lessons; validate remaining barber workbook coverage.
7. Build the current Indiana NLPS competency-by-competency crosswalk from official standards with instruction, assessment, practical evidence, and source version. Apprenticeship competency links do not establish secondary CTE equivalency.
8. Resolve instructor and RTI-provider assignments from verified records.
9. Inspect learner delivery and verify deployment of updated static syllabi. Database repairs are live; website deployment has not been established by a ready revision or runtime SHA.

## Scope

Existing source files and live schema/function definitions were inspected through connected GitHub and Supabase tools. The full catalog has not been certified submission-ready. Preserve all existing learner progress, signed records, workbooks, and source documents.
