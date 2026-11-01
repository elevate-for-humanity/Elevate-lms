# Barber and esthetics submission verification — November 1, 2026

## Decision

**Not yet verified submission-ready.** Registered RTI requirements align, but instructional delivery, course resolution, instructor/provider assignments, production syllabus deployment and current agency evidence have open gaps. This verification covers barber and esthetics in the preceding RTI reconciliation, not certification of every Elevate program.

## Verification matrix

| Check | Result | Evidence and limit |
| --- | --- | --- |
| Retrieved governing standard | Verified retrieved revision | July 10, 2025 revision, registration 2025-IN-132301; Barber 0030CB and Esthetician 2089CB. Current RAPIDS export not retrieved; later unlocated amendments not excluded. |
| Document integrity | Verified cryptographic signature; trust limited | Previously downloaded PDF SHA-256 66fb85fb01aa92fae959e32840f48319ac1b4f59853962b66b887b3968497c34. Poppler reports valid signature over complete document, TIFFANIE CLAWSON; certificate issuer not trusted in this environment. Sponsor signature visible, handwriting identity not independently authenticated. |
| RTI subjects and program requirements | Verified | All 17 signed subject/hour pairs match TypeScript and live apprenticeship_rti_requirements; totals 260 barber / 300 esthetician; program min_rti_hours match; required competencies 14 / 20. See preceding reconciliation for every subject. |
| Repository syllabi | Verified on main in preceding pass | Exact subject allocations and annual 144-hour provision added and read back. |
| Live syllabi | Failed deployment acceptance | Both www.elevateforhumanity.org/docs/syllabi/barber-apprenticeship.md and /docs/syllabi/professional-esthetician.md return HTTP 200 text/markdown, but lack November 1 revision, contact-hour tables and annual 144-hour provision. Cache-busting URL requests also lack the new revision. Main is not evidence of live deployment. |
| Barber course | Partial delivery representation | Required canonical course 2c723bfa-8c40-4acc-b961-98d917710ffc is published; course_lessons contains 14 published lessons and 310 required minutes (5h10m). Assessment fields and practical_required are present. These do not prove complete assessment quality or 260 delivered RTI hours. |
| Barber additional links | Structural gap | program_courses has 4 links; 3 optional course IDs do not resolve in courses or training_courses. No links were deleted; external or historical identity reconciliation needed. |
| Esthetics required course | Structural gap | Required course ID 67c1d9ec-a64c-4cde-8d2d-10a6909f1523 does not resolve in courses or training_courses. No esthetics title/slug matches in either catalog. No curriculum_lessons matched the linked IDs. This does not establish absence of all external instruction. |
| RTI delivery ledger | Evidence missing in checked ledger | apprenticeship_rti_entries has no matching barber/esthetician standard entries. No hours were manufactured. |
| Operational RTI providers | Assignment gap | rapids_rti_providers contains zero rows. Signed source identifies Elevate for Humanity Career and Technical Institute for both occupations; the runtime resolver's operational provider source cannot supply an assignment from this table. Historical source identity does not prove a current operational assignment. |
| Program instructors | Assignment gap | program_instructors has zero assignments for either canonical program. Credentials elsewhere or external supervisors were not authenticated. |
| Practical completion evidence | Evidence incomplete | Barber-linked apprentice_competency_records has 1 record, 0 completed, 0 with evidence URLs; barber_instructor_signoffs has no matching rows. No esthetics enrollments matched queried slugs. These are scoped database findings, not conclusions about all physical files. |
| Learner agreement and registration flags | Incomplete registry evidence | Eight active barber enrollment rows: 2 agreement_signed, 3 rapids_registered, 4 supervisor_id, 5 host_shop_id; theory_hours_completed sum is 0. These flags are not substitutes for signed documents or current RAPIDS records. Other statuses were excluded from these active counts. |
| Provider compliance artifact register | No evidence in table | provider_compliance_artifacts contains no rows in inspected result. This does not prove no licenses or agreements exist elsewhere. |
| Current Indiana pathway sources | Retrieved | Full 2026–2027 NLPS Review Document and all 5 linked beauty competency documents retrieved. Details below. |
| Full NLPS equivalency | Not established | No approved competency-by-competency equivalency crosswalk found in repository search. Course titles and DOL competency counts are not secondary course equivalency. |
| State licensing route | Verified public application route | PLA examination instructions accept DOL apprentice number and completion certificate as an education/apprenticeship route. Does not issue licenses automatically or establish each learner's eligibility. |
| INTraining historical approvals | Verified emails with distinct location IDs | Newer barber location 10005172 approved June 15, 2026; esthetics location 10005325 approved September 18, 2026. Current portal listing/status not independently retrieved. |
| Database agency IDs | Stale/mismatched references | Barber intrainingid is #10004637 (email confirms June 12 termination); esthetics #10004628 differs from retrieved newer location. intraining_program_id is null for both. Main program IDs and location IDs must not be substituted without checking intended field semantics. etpl_listed and wioa_approved are false; flags preserved. |
| OCTS status | Limited determination located | October 21, 2025 email addresses described 25-hour high-school offerings, school/district or WIOA Youth/WEX arrangements and no direct billing. It does not establish blanket exemption or approval for current self-pay apprenticeship offerings. |

## Current Indiana sources and route separation

Official resource page: https://www.in.gov/che/cte/career-pathways-programs-of-study/

Downloaded current July 2026 review document (12,236,035 bytes):
https://www.in.gov/che/cte/career-pathways-programs-of-study/2026-2027%20NLPS%20Review%20Document?language_id=1

SHA-256: 5a6d009c2eef7c70d8c0f834805db3723e3e6321cfe55fa4fa5ed583b16a4654

Printed/PDF pages 455–460 identify the Cosmetology and Barbering pathway:
7330 Principles, 7331 Fundamentals, 7332 Advanced Cosmetology **or** 7333 Advanced Barbering, then 7334 Capstone. Each selected course specifies at least 375 studio hours. Prerequisites, concurrent enrollment notes and instructor assignment rules apply. This secondary pathway structure is separate from the 260/300 registered RTI totals. Do not replace either requirement with the other.

The current linked competency documents were retrieved through Drive:
- 7330, 76 unique competency IDs: https://docs.google.com/document/d/1ZNqsf3VXmunKLCx4TIwPSo0Xm4f3Q3Lm1V9ZBZ45i1I/edit
- 7331, 51 IDs: https://docs.google.com/document/d/1OCz68uVGdKJR4RWiSPWIV5U3xgCkDxC2S3oZaM7w3ng/edit
- 7332, 35 IDs: https://docs.google.com/document/d/14XpJbJxTpPAtH__zTqNRTBWaKQNfMVeADFgjx1rlDrM/edit
- 7333, 53 IDs: https://docs.google.com/document/d/1JwAkEKNUfZSCtbgEfLyTqOmKbdLFBfgEupw_UDKd2fQ/edit
- 7334, 119 IDs: https://docs.google.com/document/d/1gZCTKReRJoEC31l-u_rCRuKo3k7Y-QrqSO7MurZiogI/edit

Counts represent extracted source IDs, not completed mappings or additional DOL competencies. The advanced alternatives are not both required merely because both were retrieved.

Source comparison identifies meaningful scope gaps: 7333 expressly covers chemical texturizing, coloring, braiding and hairpieces; 7330 includes nail, career navigation, leadership and college/career readiness competencies. The 14 current barber lesson objectives principally mirror the DOL work-process competencies and do not establish all those secondary competencies. Esthetics subjects overlap skin, makeup and hair removal domains in 7334, but that overlap cannot establish the full barbering/cosmetology pathway, prerequisites or studio-hour sequence.

PLA source:
https://www.in.gov/pla/professions/cosmetology-and-barber-home/cosmetology-and-barber-licensing-information/

Its examination-applicant section expressly accepts either beauty-culture school certification or DOL registered-apprenticeship completion evidence. Its school education table lists 1,500 barber / 700 esthetician hours; those school figures were not substituted for the signed RTI allocations. Written exam and remaining application conditions still apply.

## Private agency evidence references

Read message bodies, not just subjects:
- Barber current retrieved approval: Gmail 19ecbc1d20f088e8, June 15, 2026, location 10005172.
- Barber old-location termination: 19ebd6669607b3ba, June 12, 2026, location 10004637. June 11 information request 19eb800ed935becf requests address correction.
- Esthetics newer-location approval: 1a0b5356fa1afe35, September 18, 2026, location 10005325.
- Esthetics earlier-location termination: 1a0a55dc9a89221f, September 15, 2026, location 10005171.
- OCTS scoped determination: 19a0739e79546a0c, October 21, 2025.
- Targeted post-July-10 DOL standards/amendment search located the known July 29 approved-source message 19857620e2ca201c and related July correspondence, not a later issued barber/esthetician amendment. Search absence is not authoritative confirmation that no later amendment exists.
- Drive Barber and Esthetician searches located the signed PDF, earlier occupation-add PDF and incomplete Barber template; no later approved revision surfaced.

## Required closure evidence

1. Deploy the committed syllabi and confirm live exact contents.
2. Resolve esthetics' required course identity and barber optional references without deleting progress or historical identities.
3. Establish a real full-hour RTI delivery plan, subject allocations, annual pacing and actual instructor-verified attendance/assessments. The barber lesson durations leave 254h50m of the 260-hour requirement unaccounted for by those lesson-duration fields alone; this is not an invented learner deficit and may be satisfied only with authentic additional delivery evidence.
4. Document and connect approved providers, qualified instructors, licensed supervisors/sites, signed learner agreements, current apprenticeship registration, wage schedules and practical evidence.
5. Verify current INTraining program/location identities and scope before reconciling agency-ID fields or changing funding flags. Existing emails alone do not authorize treating all locations or cohorts alike.
6. Obtain current RAPIDS standard/occupation export and any later amendments. Complete trusted signature-certificate validation if required by reviewer.
7. For secondary CTE submission, build and validate the full chosen sequence's competency-to-instruction/assessment/practical-evidence crosswalk and required school/adoption/instructor arrangements. Esthetics cannot be described as equivalent to the entire beauty pathway based on overlapping skin subjects.
8. Confirm the current operator/entity and actual offering fall within the relevant agency determination; preserve the narrow scope of the 25-hour OCTS letter.

## Preservation and limits

This pass performed read-only database verification and saved this evidence record. It did not change progress, hours, placements, agreement flags, funding status, approved standards, course identity or publication. No emails were sent. No unauthenticated learner was used to claim signed-in course acceptance. Overall approval cannot be verified solely by editing records or generating a crosswalk.
