# Beauty Apprenticeship RTI Course Builder — Implementation Contract

Status: approved scope requested; implementation and production acceptance pending.
Date: 2026-10-16
Sponsor: 2 Exclusive LLC-S (2025-IN-132301)

## Scope and isolation
Apply only to barber-apprenticeship, cosmetology-apprenticeship (Hair Stylist), esthetician-/esthetics-apprenticeship, and nail-technician-/nail-tech-/manicurist-apprenticeship. General courses (HVAC, healthcare, business and others) retain their existing media generation, quality gates and publication behavior. Reuse the current LMS, canonical Course Factory, Supabase records, media storage, authentication, and deployment infrastructure. Do not create duplicate courses or overwrite existing student records.

## Registered training requirements
- Barber: 260 verified RTI hours; 14 competencies; competency-based.
- Hair Stylist/Cosmetology: 154 verified RTI hours; hybrid 2,000–2,500-hour term; 500-hour probation. Confirm signed approved work-process and RTI outline before final certification.
- Esthetician: 300 verified RTI hours; 20 competencies; competency-based.
- Manicurist: 210 verified RTI hours; 19 competencies; competency-based.
These totals describe completion obligations, not video duration. Signed standards and registration records govern conflicts. Do not credit RTI from template estimates or video runtime alone.

## Instructional production contract
1. Each theory unit has standards mapping, objectives, accurate instruction, qualifying learning activities, assessment and review evidence.
2. Aim for 10–15-minute narrated, captioned instructional videos per teaching topic; allow longer videos when necessary. Prefer approved existing licensed footage/images and stored assets before generating new media.
3. Videos are included in beauty theory modules, but one new cinematic video per lesson is not required. Reading, instructor-led instruction, demonstration and assessments may supplement videos under the approved RTI delivery plan.
4. Produce media in small resumable batches with stable lesson IDs, checkpoints and asset provenance. Preserve previously accepted videos, quizzes, transcripts and progress.
5. Allow incremental lesson/unit release only after content, safety, licensing, assessment, accessibility and learner-playback review passes for that unit. Do not bypass required compliance checks to publish.
6. Do not make complete-course video rendering a prerequisite for release of independently approved units. Keep premium media enhancement optional and separate from instructional publication readiness.
7. Keep media generation enabled via an explicit beauty-specific video job workflow. The temporary videoMode='off' routing in lib/course-builder/pipeline.ts must be replaced/extended before claiming videos are being generated automatically.

## RTI accounting and scheduling
- Separate planned hours, verified RTI hours, and supervised OJL. Never award planned hours as completed credit.
- Record actual qualifying participation, timestamps, assessment results, instructor approval where required, and audit provenance.
- Weekly progressive assignments and individualized catch-up schedules for apprentices already active; prerequisite safety instruction first.
- Confirm approved delivery timing and address deviations with the registration representative when needed.

## Host shop dashboard
Read-only RTI progress by apprentice: occupation, required/verified/remaining RTI, current module, next assignment, due date, overdue flags and separate OJL/competency progress. Explain that Elevate coordinates RTI and host shops provide supervised OJL. Never expose other shops' student records.

## Acceptance tests before production claim
1. Each of four occupations resolves to its registered RTI requirement and correct blueprint.
2. One approved unit publishes independently and plays on mobile; captions and quiz work.
3. Beauty video job generates a short narrated video and attaches it to the existing lesson; retries resume without duplicating assets.
4. General non-beauty course retains existing queued video behavior.
5. Verified RTI remains zero until qualifying participation is documented; OJL unaffected.
6. Host shop dashboard is tenant-isolated and read-only for RTI.
7. No existing course IDs, enrollment, grades, hours or approved media are lost.
8. CI and deployed Google Cloud/LMS smoke tests pass before declaring live.

## Immediate execution sequence
Implement beauty-scoped short-video job policy, restore optional beauty media queuing, verify a single barber lesson end-to-end, then roll out to the other three programs. No broad release or credit migration without test evidence.
