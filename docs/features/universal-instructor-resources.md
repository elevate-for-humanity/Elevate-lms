# Universal Instructor Resource Manager

Scope: **every** authenticated program holder, not individual hard-coded accounts.

## Existing boundaries
- Program Holder compliance uploader (`ProgramHolderDocumentUpload`) is for protected onboarding evidence. Never reuse its bucket or automatically expose those documents to learners.
- `getProgramHolderWorkspace` resolves holder ID and assigned program IDs through `requireProgramHolder`.
- The existing lesson resource endpoint reads `course_materials`; it does not upload or publish files.

## Required implementation
1. Dedicated private storage and metadata for instructor resources: holder ID, uploader user ID, program ID, optional course/lesson IDs, title, category (syllabus/workbook/tracker/assignment/other), storage object path, visibility (instructor_only/course_builder/student_published), review state, timestamps.
2. RLS: program holders can manage only resources for their assigned programs; authorized course builders can review/attach; learners can read only published resources for their active course enrollment. Use short-lived signed download URLs, never public buckets.
3. Instructor UI accessible from **all** program holder dashboards: upload, replace/version, preview, choose assigned program/course/lesson, select audience, submit for review, publish/retract if authorized, show status and errors.
4. Course Builder consumes approved instructor resources and links to existing lessons without copying files or replacing lessons.
5. LMS student course page lists published resources and download links. Workbooks and syllabi can be shared; individual progress trackers must be per-student, never expose cohort data.
6. Audit log for upload, publish, unpublish, access; MIME/size validation and malware scanning; reject executables; safe filenames.
7. Backfill or link Crystal's **verified** Certiport syllabus to Carlina only after verifying their actual program assignments; do not fabricate the document.
8. Tests for holder isolation, unauthorized publication, learner enrollment gating, signed URLs, resource replacement and revocation.

## Release gate
Do not advertise this feature as live until schema, RLS, upload, Course Builder linkage, student display, tests, and deployment are verified. Do not silently publish compliance documents.
