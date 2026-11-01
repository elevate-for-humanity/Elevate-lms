# Indiana pathway reconciliation — October 31, 2026

## Applied and verified

- Commit 0a2e80207ccef0151c6a7c0a5c99ef4c263b31ab: saved empty-program completion repair in scripts/sql/harden-empty-program-completion.sql; applied as Supabase migration harden_empty_program_completion to the main Elevate project.
- Before repair, unknown program IDs and sampled programs with no lessons returned true from is_program_completion_eligible_internal. After repair they return false. Null-user check also returns false. Four active courses reject a random learner without progress. No certificate issuance or student-progress mutation was used.
- Commit b39b99e6a775009bdfec6caa115eb54e13d9093d: current barber lesson slugs exactly match the 14 apprenticeship_standard_competencies keys. Replaced the missing connection by inserting 14 instructional mapping records, with an exact-match cardinality assertion and duplicate avoidance. No learner competency completion or hour credits were inserted.
- Commits d6712a91c374ded8228972b67ec138bb53d37b51 and c18caae9100544b3d0f28e20cc33c7f18e9a48cb: barber and esthetician syllabus files now describe the existing competency-based registry completion model and 260/300 RTI totals. Removed conflicting fixed-term introductory completion claims and blanket funding/approval claims. Both files were fetched back and matched exactly.

## Approved-source reconciliation — corrected audit

The earlier assertions that Barber subjects sum to 320 and Esthetician subjects sum to 400 were audit arithmetic errors. The correct sums are 260 and 300. Do not alter the registered requirements to compensate for the audit errors.

Primary evidence has now been retrieved: the July 10, 2025 digitally signed approval attached by George Hutchinson (U.S. DOL) to Gmail message 19857620e2ca201c, July 29, 2025. Document SHA-256: 66fb85fb01aa92fae959e32840f48319ac1b4f59853962b66b887b3968497c34.
- Barber: PDF pages 3–7; 14 competencies; 260 RTI hours. Subject sum = 260.
- Esthetician: PDF pages 9–13; 20 competencies; 300 RTI hours. Subject sum = 300.
- Manicurist: PDF pages 15–20; 19 competencies; 210 RTI hours. Subject sum = 210.
- The signed Manicurist outline names Grace Beauty College as RTI provider. Provider changes require documented authority; Elevate's supplementary workbook does not establish an RTI provider amendment.

The older occupation-add attachment contains different proposed competency counts and totals; it must not override the later signed July 10 approval.

## Distinguish hours before declaring conflicts

Course duration is the aggregate of required, nonarchived lesson durations. Program delivery totals, registered RTI, work terms, state school education minimums, and minimum clinical requirements are different measures.
- HVAC: the existing delivery outline is 60 online + 120 lab + 30 exam preparation + 20 career support = 230. Its 180 online/lab hours are a subtotal, not a competing total. The replacement's 0.2-hour course summary equals its current required/nonarchived lesson aggregate; summing archived lessons produced the misleading 21.17-hour comparison.
- CNA: 75 minimum hours versus a 105-hour program target is not intrinsically a conflict. Verify the actual cohort schedule and clinical breakdown before changing either.
- Bookkeeping: the 640-hour training field, 150-hour program total, 85-hour published component breakdown, and weekly schedule require an authoritative delivery schedule; no arbitrary duration has been selected.

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

## Shared Hair Stylist operational settings

RAPIDS metadata, beauty enrollment, and canonical program data now read lib/apprenticeship/hair-stylist-program.ts. The canonical record's zero OJT hours were replaced with the existing 2,000-hour minimum hybrid work term. This consolidates existing operational settings and does not manufacture a signed Hair Stylist appendix or change its approval status.

## Source repairs completed in the follow-up

- Corrected the false 320/400 RTI audit claims; verified 260/300/210 against the signed source and ran the automated subject-sum/competency checks successfully.
- Added a source manifest with the signed-document SHA-256, retrieval reference, occupation/page identities, and original RTI-provider names.
- Linked all three live standard-version records to the signed source; preserved their correct totals and competency counts.
- Corrected the Nail syllabus to identify Grace Beauty College as the provider named in the signed source, rather than treating Elevate's workbook as proof of a provider change.
- Centralized existing Hair Stylist settings and corrected canonical OJT from zero to the shared 2,000 minimum. No approval has been inferred from the January 5, 2026 DOL email, which says approval was expected the following week rather than confirming issuance.
- Corrected the Indiana barber school-route threshold from 2,000 to the PLA-published 1,500 hours. Removed an unsupported 1,500-practical plus 500-theory split and stopped using the school threshold as a fixed apprenticeship OJL denominator. Existing transfer settings remain institutional compatibility policy, not newly verified legal requirements.
- Corrected Business Start-Up total_hours from legacy 640 to 32, consistent with training_hours, estimated_hours, and the 32-hour syllabus.
- Isolated-module runtime tests passed for shared Hair Stylist consumer values, all three approved RTI sums/counts, and separation of the 1,500 school threshold from competency-based barber OJL. Full application build and deployment are not claimed.

Unresolved source evidence: the current Bookkeeping delivery schedule (640/150/85-hour representations), actual signed Hair Stylist occupation attachment, and authority for any change from Grace Beauty College as nail RTI provider. Do not reconcile these by inventing hours, signatures, provider amendments, or approval dates.
