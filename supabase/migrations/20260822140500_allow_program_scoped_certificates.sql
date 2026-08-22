-- Program completion certificates are distinct from course completion certificates.
-- A program certificate may cover multiple required courses, so course_id must
-- not be mandatory on the canonical certificates table.

alter table public.certificates
  alter column course_id drop not null;

comment on column public.certificates.course_id is
  'Course scope for COURSE_COMPLETION certificates; NULL for PROGRAM_COMPLETION certificates.';
