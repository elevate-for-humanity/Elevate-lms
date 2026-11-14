begin;
set local lock_timeout='5s';
alter table public.program_enrollments
  alter column theory_hours_completed drop default,
  alter column theory_hours_completed type numeric using (case when theory_hours_completed then 1 else 0 end),
  alter column theory_hours_completed set default 0,
  alter column practical_hours_completed drop default,
  alter column practical_hours_completed type numeric using (case when practical_hours_completed then 1 else 0 end),
  alter column practical_hours_completed set default 0;
alter table public.courses
  add column if not exists duration_weeks integer,
  add column if not exists tuition_cost numeric,
  add column if not exists max_students integer,
  add column if not exists prerequisites jsonb,
  add column if not exists learning_outcomes jsonb;
notify pgrst, 'reload schema';
commit;