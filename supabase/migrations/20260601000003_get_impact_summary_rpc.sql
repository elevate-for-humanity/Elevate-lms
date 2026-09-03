-- Aggregates impact metrics in SQL so schema truth stays in one place.
-- Called by /api/impact/summary instead of inline route queries.
-- SECURITY DEFINER — callable by authenticated + service_role only.

create or replace function public.get_impact_summary()
returns json
language sql
security definer
stable
as $$
  select json_build_object(
    'total_learners',
      (select count(*) from public.profiles where role in ('student', 'learner')),
    'active_enrollments',
      (select count(*) from public.program_enrollments where status = 'active'),
    'program_completions',
      (select count(*) from public.program_enrollments where completed_at is not null),
    'certificates_awarded',
      (select count(*) from public.certificates),
    'total_programs',
      (select count(*) from public.programs where published = true and status != 'archived'),
    'partners',
      (select count(*) from public.profiles where role = 'partner'),
    'total_hours',
      coalesce(
        (select sum(duration_minutes) / 60.0 from public.course_lessons),
        0
      )
  );
$$;

revoke all on function public.get_impact_summary() from public, anon;
grant execute on function public.get_impact_summary() to authenticated, service_role;
