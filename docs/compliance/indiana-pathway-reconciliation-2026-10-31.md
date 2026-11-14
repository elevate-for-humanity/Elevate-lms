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

## Follow-up evidence search — November 1, 2026

The following are evidence dispositions, not approval or schedule changes.

| Item | Evidence located | Disposition |
| --- | --- | --- |
| Bookkeeping delivery schedule | Public program component schedule totals 85 hours (30 online, 40 lab, 10 exam preparation, 5 career support), while 8 weeks at 15–20 hours implies 120–160 hours. Live program training_hours is 640 and total_hours is 150. | No controlling hour total has been established. Do not present these conflicting values as a verified submission schedule. |
| Instructor bookkeeping sources | Supabase communication_email_messages be8b41ae-76db-4665-a202-aa52b7abe5cb, “Syllabus,” October 24, 2026; and f13aef8e-46bb-4b62-be16-4bda96538db5, “Complete Course Work,” October 25, 2026, from center.of.destiny@elevateforhumanity.org. | Actual instructor-assigned attachments exist; their contents must be inspected before selecting or revising the schedule. The later message explicitly describes its course as additional to the course assigned by Ms. Greene. Do not assume these are duplicate or superseding courses. |
| Hair Stylist signed attachment | Exact 0096HY Gmail search returns January 5, 2026 DOL correspondence predicting future approval. Later DOL Hair Stylist/Cosmetology search did not locate issued approval. Drive Hair Stylist and 0096HY searches did not locate a separate signed occupation attachment. | Signed occupation authority remains unlocated. Keep shared operational values separate from approved-source evidence. |
| Nail RTI-provider amendment | Signed July 10, 2025 approval names Grace Beauty College. Gmail amendment/provider search and Drive Manicurist search located the original signed source and earlier draft outlines, not an approved provider-change amendment. | Grace Beauty College remains the provider established by the retrieved signed source. Do not treat an Elevate workbook or earlier draft as amendment evidence. This finding does not prove no amendment exists elsewhere. |

Instructor attachment locations in the private communication-email-attachments bucket:

- be8b41ae-76db-4665-a202-aa52b7abe5cb: ffd70d79-6503-4945-bd9e-6b367d493516/be8b41ae-76db-4665-a202-aa52b7abe5cb/c3d8ff30-ab77-4945-84fc-9becb7adc7b5-Elevate-Bookkeeping Syllabus.pdf
- f13aef8e-46bb-4b62-be16-4bda96538db5: ffd70d79-6503-4945-bd9e-6b367d493516/f13aef8e-46bb-4b62-be16-4bda96538db5/f797efc3-d0f2-4fd5-8ac5-eabb3700437c-Bookkeeping Syllabus - Weekly Guide.pdf

The connected Supabase tools expose SQL metadata but no authenticated Storage download action. The bucket is private; attachment existence and assignment context were verified, but PDF contents were not retrieved in this follow-up. No bucket permissions were changed.

Durable Drive copy of the signed July 10 source: https://drive.google.com/file/d/1l3e7hmyQQDM5CvQfYZzDv1g2vR23vrVR/view . Filename and 784,906-byte size match the earlier Gmail source; the Drive copy was not independently rehashed.

Closure requires: (1) inspect both instructor syllabi and the separately assigned course, establish which cohort each applies to, and reconcile instructional, independent-study, and support hours without double counting; (2) obtain the issued signed Hair Stylist occupation attachment or authoritative RAPIDS approval record; (3) obtain an approved provider-change record before changing the nail provider named in the signed source. These three items remain open; no hours, signatures, or amendment evidence were invented.


## Barber and esthetics RTI verification — November 1, 2026

### Governing evidence and signature inspection

Independently downloaded the [existing Drive PDF](https://drive.google.com/file/d/1l3e7hmyQQDM5CvQfYZzDv1g2vR23vrVR/view) (784,906 bytes). SHA-256 independently reproduced: `66fb85fb01aa92fae959e32840f48319ac1b4f59853962b66b887b3968497c34`. Cover visually identifies registration 2025-IN-132301, registration January 14, 2025, revision July 10, 2025, adding 0030CB, 2089CB and 2090CB. A sponsor signature is visible; handwriting identity was not independently authenticated.

Poppler pdfsig reports TIFFANIE CLAWSON, U.S. Government / Department of Labor / Employment Training Administration; July 10, 2025 signing time; SHA-256; total document signed; signature valid. Certificate issuer is not trusted by this environment, so independent certificate-chain/revocation validation is not claimed. The cover's visible signature time is 15:41:22 -04:00. The later signed revision is the controlling retrieved evidence for these occupations, consistent with both active database standard-version records. A current RAPIDS export or authority confirmation is still needed to exclude any later unlocated amendments.

The [June 12, 2025 Barber DOCX](https://docs.google.com/document/d/1uQ9Kickve1l-cZIfK_o77F7WGHYdfZrb/edit) has blank occupation codes, term, ratio, wages and RTI provider fields, and an unallocated 144-hour template outline. It is not used to override the signed revision.

### Exact subject comparison

PDF pages 7 and 13 (both printed A-6) were rendered and visually inspected. Every subject title and hour below matches `lib/compliance/appendix-a-standards.ts` and live `apprenticeship_rti_requirements`, in display order. Main project: `cuxzzpsyufcewtmicszk`.

| Occupation | Signed instructional subject | PDF hours | TypeScript hours | Database hours |
| --- | --- | ---: | ---: | ---: |
| Barber | Barbering History and Professional Development | 10 | 10 | 10 |
| Barber | Anatomy, Physiology & Skin/Nail Disorders | 60 | 60 | 60 |
| Barber | Hair & Scalp Theory, Disorders, and Treatments | 60 | 60 | 60 |
| Barber | Infection Control & Bloodborne Pathogens (OSHA) | 40 | 40 | 40 |
| Barber | Hair Cutting Theory, Tool Safety, and Techniques | 60 | 60 | 60 |
| Barber | State Board Laws, Rules, and Regulations | 10 | 10 | 10 |
| Barber | Business Practices | 10 | 10 | 10 |
| Barber | Preparation for State Licensing Examination | 10 | 10 | 10 |
| Esthetician | Esthetics History & Professional Ethics | 10 | 10 | 10 |
| Esthetician | Anatomy, Physiology & Skin Disorders | 60 | 60 | 60 |
| Esthetician | Skin Types, Conditions & Product Selection | 60 | 60 | 60 |
| Esthetician | Facial Techniques & Equipment Usage | 40 | 40 | 40 |
| Esthetician | Methods & Safety | 40 | 40 | 40 |
| Esthetician | Makeup Fundamentals | 60 | 60 | 60 |
| Esthetician | State Laws & Licensing Requirements | 10 | 10 | 10 |
| Esthetician | Retailing, Client Care & Business Practices | 10 | 10 | 10 |
| Esthetician | State Licensing Exam Preparation | 10 | 10 | 10 |

| Verified measure | Barber | Esthetician |
| --- | ---: | ---: |
| Sum of subject hours | 260 | 300 |
| Declared TypeScript RTI | 260 | 300 |
| Active standard-version RTI | 260 | 300 |
| Program min_rti_hours | 260 | 300 |
| Required database competencies | 14 | 20 |
| Signed competency count | 14 | 20 |

The 320/400 assertions are arithmetic errors, not conflicting approved allocations. No RTI database correction was necessary. A program's training_hours field is not automatically its registered RTI field: inspected values are 260 for barber and 2,000 for esthetician; the latter has no verified RTI meaning and was not relabeled or changed. Likewise, the canonical totalOjlHours value of 2,000 is not established as a fixed completion requirement by these competency-based appendices. The registered-program contract correctly exposes fixedOjlCompletionHours as null. Retain separate operational and approved-standard meanings pending delivery evidence.

Configuration tracing: RAPIDS metadata and enrollment generation use getRegisteredProgramStandard; the registered-program contract reads the canonical RTI values. The active database revisions are July 10, 2025. The syllabus router points to the two files below.

### Corrections and verification

- Added exact source subject titles and contact-hour allocations, source links/page references, and the signed annual 144-hour instruction provision to `public/docs/syllabi/barber-apprenticeship.md` and `public/docs/syllabi/professional-esthetician.md`.
- Commits: barber `5e8859c4adf7520c986395cc9157995898f9a36b`; esthetician `bf86f9d7a5802e163cd10f528dac896e3fe24fa8`.
- Read both updated files back from main; contents match the intended replacements exactly. Automated ordered subject-title/hour comparison passed for all 17 database rows against TypeScript; totals independently computed as 260/300.
- Final read-only database query confirms active revision, totals, program minimums, and required competency counts match. No database writes, learner progress changes, recorded-hour changes, signed-standard edits, or approved requirement changes were made.
- Changes are Markdown documentation only. No application code/build change was made; full build and live website deployment verification are not claimed.

### Evidence still required before submission readiness

1. Current RAPIDS occupation export or DOL confirmation of the governing revision and any subsequent amendments; independent trusted certificate validation if required by the submission reviewer.
2. A dated delivery schedule allocating the complete 260/300 contact hours to actual instruction, instructors, lessons/workbooks, attendance and assessments; show how the signed annual 144-hour provision is met without double counting OJL.
3. Subject-level delivery and mastery evidence, individual practical signoffs, qualified instructors and supervisors, approved sites, signed agreements, and applicable wage progression. Matching required-hour records does not prove completed instruction.
4. A competency-by-competency crosswalk to the applicable **2026–2027** Indiana NLPS pathway/course standards, with course sequence, prerequisites, assessment and practical evidence, instructor assignment eligibility and any required school/CTE adoption or credit arrangements. The [official CHE pathway resources](https://www.in.gov/che/cte/career-pathways-programs-of-study/) identify the July 6, 2026 NLPS review version, assignment codes and adoption process. The full current review document could not be retrieved through the web tool in this pass due to its size; no detailed current NLPS equivalency is claimed.
5. Document the specific submission route and obtain the relevant Indiana authority's determination of licensing eligibility and education/provider requirements. DOL apprenticeship approval does not alone establish secondary CTE equivalency, state licensure, funding eligibility, or DOE program approval.

Disposition: **RTI source/TypeScript/database requirement alignment verified; syllabus allocations corrected. Program delivery, current state pathway equivalency and overall submission readiness remain unverified.**

## Bookkeeping schedule resolved from instructor attachments — November 1, 2026

This section supersedes the earlier bookkeeping “source not inspected” and unresolved 640/150/85-hour dispositions.

Authenticated admin email attachment links opened both private PDFs. The original **Elevate-Bookkeeping Syllabus.pdf**, master syllabus v2.0 (2026), page 2 states 160 instructional hours and ten curriculum modules; pages 3–4 provide the module allocation. The later **Bookkeeping Syllabus - Weekly Guide.pdf**, page 4 reproduces the same allocation and page 8 specifies eight weeks of 20 instructional hours each. Both are instructor-issued sources by Dr. Carlina A. Wilkes, not DOL or Indiana approval documents.

| Module | Instructional hours |
| --- | ---: |
| Accounting and Bookkeeping Foundations | 15 |
| Debits, Credits, Journals and Ledgers | 20 |
| Cash, Assets and Sales Transactions | 20 |
| Purchases, Liabilities and Equity | 20 |
| Adjustments and the Accounting Cycle | 15 |
| Reconciliation and Error Correction | 15 |
| Financial Statements and Analysis | 15 |
| Payroll, Controls and Bookkeeping Operations | 10 |
| Excel for Accounting Laboratories | 15 |
| Capstone, Remediation and Exam Preparation | 15 |
| Total | 160 |

Weekly allocation by module: W1 M1:15 + M2:5; W2 M2:15 + M3:5; W3 M3:15 + M4:5; W4 M4:15 + M5:5; W5 M5:10 + M6:10; W6 M6:5 + M7:15; W7 M8:10 + M9:10; W8 M9:5 + M10:15. Each week sums to 20, and allocations across weeks reproduce every module total.

Repairs:
- Added lib/programs/bookkeeping-schedule.ts as the reusable module/weekly source.
- Program schema now accepts source-documented module allocations as an alternative to delivery-mode allocations. Existing online/lab/exam/career breakdowns retain their existing computation.
- data/programs/bookkeeping.ts uses ten source modules totaling 160, eight weeks at 20 hours, and the source weekly sequence. Removed the unverified Tue/Thu evening promise and the conflicting older four-phase schedule. No invented online/lab/support split was substituted.
- Saved and applied scripts/sql/reconcile-bookkeeping-instructor-schedule.sql. The exact bookkeeping program now has training_hours, total_hours, estimated_hours, duration_hours and hours = 160, duration_weeks = 8, and an explicit schedule. Source identifiers, allocation and prior values are retained in lms_config.instructional_schedule_source.
- Program archived/inactive status is preserved. Course video/lesson durations, required_hours, learner attendance/progress, credential awards and enrollments were not changed.

Verification: fetched every changed source file back from main and compared exact contents; independent database readback confirms the five 160-hour fields and eight-week schedule. Isolated Node module tests passed for total/range, all eight weekly sums, all ten module-column sums, program hour validation, a deliberately mismatched range, and legacy delivery-mode calculation. Full application typecheck/lint/build and production website deployment are not established by these scoped checks.

PDFs were inspected in the authenticated browser viewer; browser download synchronization failed, so no new byte hash or independently extracted full-text copy is claimed.

Remaining approval evidence: RAPIDS opens at the external-user sign-in screen. Automatic approval review rejected clicking “I am an external user – Login.gov,” stating that explicit permission to initiate Login.gov authentication was required. No further authentication action or workaround was attempted. Hair Stylist's issued occupation approval and any approved nail RTI-provider amendment remain unverified pending that access. Grace Beauty College remains the provider established by the retrieved signed July 10, 2025 source.
