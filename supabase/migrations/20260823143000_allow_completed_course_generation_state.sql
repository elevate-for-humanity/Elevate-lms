alter table public.courses
  drop constraint if exists courses_generation_status_check;

alter table public.courses
  add constraint courses_generation_status_check
  check (generation_status = any (array[
    'draft'::text,
    'generating'::text,
    'completed'::text,
    'review'::text,
    'published'::text
  ]));

comment on column public.courses.generation_status is
  'Course generation lifecycle: draft, generating, completed, review, or published.';
