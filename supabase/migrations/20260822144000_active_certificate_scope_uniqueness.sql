-- Allow a revoked certificate to be replaced while preserving one active
-- certificate per learner/course and one active program certificate per learner.

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
