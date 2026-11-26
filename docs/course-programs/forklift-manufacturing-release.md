# Forklift and Manufacturing Operations

Prepared 24 November 2026 from the user-authorized combined-program request.

## Scope

One 48-hour online preparation course: 8 forklift foundations, 16 assembly and production, and 24 quality inspection. There are 24 two-hour lesson plans, 76 explained knowledge questions, 24 workbook sections and 10 decision simulations containing 69 scored tasks. Workbook and simulation practice is included in the planned hours. Actual attendance and employer practice must be recorded separately.

The coordinated employer phase is an estimated 2–4 weeks, with completion based on demonstrated job-specific competence. A suggested schedule is two online weeks at 24 hours per week followed by the employer phase. This is a planning example; there is no promised operating qualification or fixed completion date. Welding remains separate.

## Persisted authoring records

- Program: `55df2949-16a4-4e43-b597-067b14879130` (`forklift`).
- Course: `832cf9d8-e676-4bfb-a623-ab13a7ddf847` (`forklift-manufacturing-operations-48h`).
- Workbook: `f75c6f09-1218-5c25-95cd-8c74dbce6a10` (`forklift-manufacturing-operations-workbook`).
- Three canonical modules and 24 canonical lessons have been saved as inactive/unapproved course drafts. All lesson job packets and scenario specifications are present.
- Each workbook section maps to its exact canonical lesson UUID and has three combined prompts, plus the existing notes, next-goal and learner-review fields.
- Existing legacy forklift lessons and learner records were not rewritten. Both legacy-course and program enrollment counts were zero when authoring began.

## Implementation

The interaction endpoint validates enrollment/course/lesson binding, serves a public simulation specification without expected answers, and grades submitted responses against the canonical stored specification. A critical miss prevents mastery regardless of the aggregate score. Completion regrades saved responses; client-controlled score or completed flags cannot substitute for correct answers. Only this new course adds the workbook and simulation completion requirements.

Admin simulation preview checks responses locally and writes no learner record. Existing workbook RLS and edit-access RPC remain authoritative. The learner review checkbox is self-review, not an instructor attestation.

Protected workbook download behavior remains unchanged. Only the program syllabus is exposed under public/docs. Full readings, editable workbooks, instructor keys and the standalone practice companion are private owner-review artifacts. The companion generator rejects a public-directory destination. It awards no LMS completion, attendance, credential or equipment authorization.

## Publication and funding status

The program's authoritative duration and descriptive record have been updated. ETPL and WIOA flags remain false. Public copy no longer claims an OSHA-issued certificate, three-year certificate validity, guaranteed employment, approved funding or unconfirmed tuition.

The course is **not released to learners**. Do not set publication fields directly, change AI provenance, invent review actors, or fabricate media evidence. The current canonical Ultimate production/release path requires a valid build with authorized instructional sources, competency mappings, produced media and its required QA/release evidence. A qualified employer trainer must review and supplement the forklift material for the actual equipment and site.

The canonical course-builder route uses `start-existing` / contract configuration and `publish-persisted`; the retired direct publish route must not be used. Source hydration excludes unapproved drafts, so attach the complete authorized curriculum through the supported contract configuration before production. Review the current implementation and release state when proceeding; do not assume generated artifacts exist.

## Verification and remaining gates

Focused simulator, route, workbook, completion, and public-program regressions pass. The complete repository lint command passed. Local full type checking and the production build were attempted using the existing bounded scripts but were terminated with exit 137 / SIGKILL; no compiler or release gate was disabled. Required CI and normal Google Cloud release controls must succeed before merging/deploying the code. The deployed commit has not yet been verified.

All final PDFs were rendered and checked. The student workbook has 144 editable fields; the employer guide has 262. Field values round-trip through a temporary filled copy, while delivered forms remain blank. Source lists, calculations, scenario answer keys and planned-hour totals were checked. A full browser run is subject to runtime availability and is not implied by DOM/unit-test results.
