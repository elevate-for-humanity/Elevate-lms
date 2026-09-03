-- Canonical revocation metadata plus revocation-aware uniqueness.
-- Historical certificate rows are preserved. A revoked certificate may be
-- replaced while there remains at most one active certificate per scope.

alter table public.certificates
  add column if not exists revoked_at timestamptz,
  add column if not exists revoked_reason text;

drop index if exists public.uq_certificates_student_course;
create unique index uq_certificates_student_course
  on public.certificates(student_id, course_id)
  where student_id is not null
    and course_id is not null
    and revoked_at is null;

drop index if exists public.uq_certificates_student_program;
create unique index uq_certificates_student_program
  on public.certificates(student_id, program_id)
  where student_id is not null
    and program_id is not null
    and course_id is null
    and revoked_at is null;
