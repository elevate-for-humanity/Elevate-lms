# Esthetics and nails instructional source mapping — November 1, 2026

Version: efh-beauty-2026-11-01-v1. Original Elevate instruction; not text represented as agency-authored, a provider amendment, a signed competency verification or an award of hours.

The source loader now supports all 20 esthetics and 19 manicurist Appendix A competency IDs. Each source includes concept teaching, a procedure or decision sequence, an occupation-specific safety correction, a worked example, supervised/independent application and two different assessment prompts with answers and explanations. The existing deterministic production adapter selects a primary question and a distinct reassessment. Product-specific procedures remain conditional on the exact manufacturer directions, current scope and qualified supervision; no universal acid, tint, rotary-tool or enhancement parameters are invented.

## Exact mapping

| Occupation | Appendix A source ID | Original teaching title |
| --- | --- | --- |
| esthetician | esthetician-a | Room turnover and contamination control |
| esthetician | esthetician-b | Reusable tools and sterilization decisions |
| esthetician | esthetician-c | Gentle cleansing and the skin barrier |
| esthetician | esthetician-d | Selecting and applying cosmetic products |
| esthetician | esthetician-e | Comedone assessment and conservative extraction |
| esthetician | esthetician-f | Facial sequence, masks and equipment |
| esthetician | esthetician-g | Wax consultation and hair-removal safety |
| esthetician | esthetician-h | Chemical-peel boundaries and product protocols |
| esthetician | esthetician-i | Skin observation and referral decisions |
| esthetician | esthetician-j | Color and product decisions across skin tones |
| esthetician | esthetician-k | Building a manageable home-care plan |
| esthetician | esthetician-l | Referral without diagnosis |
| esthetician | esthetician-m | Teaching hygienic makeup application |
| esthetician | esthetician-n | Demonstrating a cleansing routine |
| esthetician | esthetician-o | Teaching personal hygiene and tool care |
| esthetician | esthetician-p | Evaluating new services and maintaining competence |
| esthetician | esthetician-q | Cosmetic massage and client comfort |
| esthetician | esthetician-r | Accurate confidential client records |
| esthetician | esthetician-s | Ethical makeup retail and transactions |
| esthetician | esthetician-t | Lash and brow tint readiness |
| manicurist | manicurist-a | Nail-station sanitation and chemical safety |
| manicurist | manicurist-b | Cuticle care and living-tissue protection |
| manicurist | manicurist-c | Natural-nail preparation and controlled soaking |
| manicurist | manicurist-d | Rotary-tool control for nail enhancements |
| manicurist | manicurist-e | Nail wraps and repair decisions |
| manicurist | manicurist-f | Forms, liquid-and-powder systems and balance |
| manicurist | manicurist-g | Polish removal and solvent exposure |
| manicurist | manicurist-h | Natural-nail shaping with hand tools |
| manicurist | manicurist-i | Base coat, color and top coat |
| manicurist | manicurist-j | Conservative surface preparation |
| manicurist | manicurist-k | Buffing and shine without over-thinning |
| manicurist | manicurist-l | Nail-service records and traceability |
| manicurist | manicurist-m | Inventory, expiry and replenishment |
| manicurist | manicurist-n | Appointments, consented charges and receipts |
| manicurist | manicurist-o | Cosmetic hand massage and exfoliation boundaries |
| manicurist | manicurist-p | Hand and nail observation before service |
| manicurist | manicurist-q | Nail home care and color advice |
| manicurist | manicurist-r | Ethical nail-product promotion |
| manicurist | manicurist-s | Retail checkout and responsible follow-up |

## Authority and delivery limits

The July 10, 2025 signed standard remains unchanged: esthetics 300 RTI hours and 20 competencies; manicurist 210 RTI hours and 19 competencies. The signed manicurist document names Grace Beauty College. These original teaching sources do not establish a change of registered provider. Existing requirements for OJL, annual RTI, wages, ratios, probation and trainer signoff remain unchanged.

The 39 source bindings establish competency-level teaching inputs, not proof that the entire 300/210-hour RTI schedule has been delivered. Signed subjects and allocations remain in lib/compliance/appendix-a-standards.ts. Full subject-level depth, paced delivery, final-exam coverage, product protocols, instructor acceptance, practical rubrics applied to actual performance and measured RTI attendance still require verification before submission or a compliance claim. History, career portfolio/resume work and cumulative exam preparation must be explicitly evidenced in the full RTI course; short work-process lessons alone do not prove those subject allocations.

The board's current July 2026 scope announcement was checked. Advanced scope changes do not automatically extend the signed course or establish apprentice competence; microneedling was not added to this course.

## Saved-build recovery

The prepared scoped repair script scripts/courses/prepare-beauty-source-successors.mjs emits transactional DML for only the two named course/build pairs. It rejects active leases, finished revisions, duplicate source versions and existing nonempty or published lesson content. It pauses old revisions, preserves their frozen pools/errors, seeds only empty unpublished canonical source rows, creates successor builds with the same registered competency/requirement/presentation inputs and supplies complete matching source IDs. The existing enqueue RPC enables PARIS monitoring without resetting any old attempt budget. No learner, attendance, assessment result, signed standard or recorded hour row is changed.

## Evidence consulted

- https://drive.google.com/file/d/1l3e7hmyQQDM5CvQfYZzDv1g2vR23vrVR/view — Competency identifiers and signed RTI subjects only; not the author of this teaching text.
- https://www.in.gov/pla/professions/cosmetology-and-barber-home/ — Current scope announcements and links to sanitation rules. Checked 2026-11-01.
- https://www.osha.gov/nail-salons — Chemical, biological and ergonomic exposure controls. Checked 2026-11-01.
- https://www.epa.gov/pesticide-registration/selected-epa-registered-disinfectants — Disinfectant labeling, intended uses and contact time. Checked 2026-11-01.

## Verification

Five Node source-map checks pass, and ten focused Vitest tests pass, including generation/validation of every competency blueprint, registered hours, retained practical requirements and existing profile regressions. Google authoring and fresh recap generation are mocked in the adapter test: no paid inference, media delivery, live publication or regulator approval is established by those tests. Full typecheck passed. Lint/build and live successor results are recorded separately after execution.

## Authorized main-database application

The transaction was first validated with BEGIN/ROLLBACK, then applied and read back. Successor esthetics build: efca093a-b6f5-4ffc-94ee-54df2b405811 (job c0a79b04-1323-4ffe-a2ed-ed0960a19625). Successor nails build: 060f338a-d79f-43dd-a0e3-67af0112fd57 (job d94aba50-69e9-4271-86dd-fad0b9f42feb). Both have PARIS monitoring enabled, exact 20/19 source counts and zero unmapped competency IDs. Both preserve 2,000 OJL hours and 300/210 RTI hours respectively. Old build pools, checkpoints, errors and learner records remain preserved. Esthetics' 20 previously empty draft rows now contain the original teaching; nails canonical rows are owned by the worker materialization step. Queued is not proof of running, accepted media or publication.

## Runtime dispatch authorization

Fresh live CI dispatch returned HTTP 403. Browser inspection found the October 17 personal-owner fine-grained token limited to public repository reads, with no repository permissions. Its date matches the saved runtime secret update, but the secret value was not read or compared, so token identity is not asserted as proven. The signed-in GitHub account can select the elevate-for-humanity organization and Elevate-lms for a new token. A replacement form is prepared with only that repository, Actions read/write, Contents read-only and required Metadata read-only, retaining the visible 30-day expiry. No token was generated, exposed, entered or saved by the agent. Generation and secure entry of a replacement credential require the user handoff under the browser credential policy. Dispatch must be retested with the saved runtime credential after replacement; a form or successful repository read is insufficient proof.

## RTI subject crosswalk and remaining depth

The hours below are the signed subject allocations, not durations assigned to the new short competency lessons. A source relationship is not proof that all allocated instruction is complete.

| Esthetics signed subject | Hours | Relevant source IDs (esthetician-) | Remaining evidence |
| --- | ---: | --- | --- |
| Esthetics History & Professional Ethics | 10 | p, r, s | Dedicated history instruction and paced delivery |
| Anatomy, Physiology & Skin Disorders | 60 | c, e, i, l | Full anatomy/physiology curriculum and assessed depth |
| Skin Types, Conditions & Product Selection | 60 | c, d, i, j, k | Product-specific instruction and complete skin-science coverage |
| Facial Techniques & Equipment Usage | 40 | b, c, e, f, n, q | Device-specific demonstrations and observed practice |
| Methods & Safety | 40 | a, b, e, g, h, t | Exact approved product protocols, trainer credentials and practical evidence |
| Makeup Fundamentals | 60 | j, m, s | Full application/color curriculum, inclusive demonstrations and practice |
| State Laws & Licensing Requirements | 10 | p, t | Current rules instruction and registered-pathway application evidence |
| Retailing, Client Care & Business Practices | 10 | k, l, o, r, s | Complete business/client-care activities and records |
| State Licensing Exam Preparation | 10 | competency questions throughout | Cumulative exam blueprint, question bank and current application/test documentation |
| **Signed total** | **300** | **20 competency sources** | **Delivery/acceptance remains unverified** |

| Manicurist signed subject | Hours | Relevant source IDs (manicurist-) | Remaining evidence |
| --- | ---: | --- | --- |
| Introduction & Sanitation | 5 | a | Orientation and recorded delivery |
| History & Overview of Nail Technology | 10 | — | Dedicated history instruction |
| Sanitation, Disinfection, & State Board Regulations | 40 | a, b, c, p | Full current-rule coverage and practical observations |
| Nail Anatomy & Disorders | 25 | b, c, h, j, p | Complete anatomy curriculum and assessment |
| Proper use of tools: Clippers, Buffers, & Cuticle Pushers | 5 | b, d, h, j, k | Manufacturer/tool-specific demonstrations |
| Manicure & Pedicure Techniques | 20 | b, c, g, h, i, k, o, p | Dedicated pedicure instruction, foot-spa protocol and observed practice |
| Nail Art & Specialty Services | 30 | d, e, f, i, j | Full nail-art/design instruction and system-specific practical work |
| Business & Career Preparation | 10 | l, m, n, r, s | Career plan and business activities |
| Salon Business Management & Retailing | 5 | l, m, n, r, s | Applied business records and acceptance |
| Client Relations & Customer Retention | 5 | n, q, r, s | Retention/follow-up activities and assessed performance |
| Resume Building & Portfolio Development | 10 | — | Authored resume/portfolio unit and learner artifacts |
| Final Review & Virtual Practical Demonstration | 45 | all 19 | Cumulative review, full exam and assessed demonstration; online artifacts do not replace mentor signoff |
| **Signed total** | **210** | **19 competency sources** | **Delivery/acceptance remains unverified** |

## Build validation at handoff

31 targeted checks passed: five source-binding checks, ten registered-profile/production-adapter tests and sixteen existing credential-resolution/authorization tests. Full marketing/admin/LMS source typecheck and repository lint passed. Marketing production compilation, page generation and generated-route typecheck passed. Admin production compilation and all 145 pages passed, but its subsequent generated-route checker exhausted a reduced 3 GiB heap; an earlier Admin compiler attempt was killed by the container memory limit. A separately bounded 5 GiB Admin route check and the serialized LMS build were started. These results do not establish a green full CI/release or a deployed source revision. Re-run CI with the corrected runtime Actions credential and retain the actual run/revision evidence before declaring release readiness.
