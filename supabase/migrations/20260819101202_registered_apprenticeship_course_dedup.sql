do $$
declare
  v_org_id uuid;
begin
  delete from public.courses c
  using public.programs p, public.apprenticeship_standard_versions s
  where c.program_id = p.id
    and s.program_slug = p.slug
    and s.is_active = true
    and c.slug <> p.slug
    and not exists (select 1 from public.program_enrollments pe where pe.course_id = c.id)
    and not exists (select 1 from public.apprenticeship_rti_entries r where r.course_id = c.id)
    and not exists (select 1 from public.student_module_progress smp where smp.course_id = c.id)
    and not exists (select 1 from public.quiz_attempts qa where qa.course_id = c.id)
    and not exists (select 1 from public.program_course_links pcl where pcl.course_id = c.id)
    and not exists (select 1 from public.program_course_map pcm where pcm.course_id = c.id);

  insert into public.program_course_map(program_slug, course_id, updated_at)
  select s.program_slug, c.id, now()
  from public.apprenticeship_standard_versions s
  join public.programs p on p.slug = s.program_slug
  join public.courses c on c.program_id = p.id and c.slug = p.slug
  where s.is_active = true
  on conflict (program_slug) do update
    set course_id = excluded.course_id,
        updated_at = now();

  select pcl.org_id into v_org_id
  from public.program_course_links pcl
  where pcl.program_slug = 'barber-apprenticeship'
    and pcl.status = 'active'
  order by pcl.is_primary desc, pcl.created_at asc
  limit 1;

  if v_org_id is not null then
    insert into public.program_course_links(org_id, program_id, program_slug, course_id, is_primary, status, updated_at)
    select v_org_id, p.id, p.slug, c.id, true, 'active', now()
    from public.apprenticeship_standard_versions s
    join public.programs p on p.slug = s.program_slug
    join public.courses c on c.program_id = p.id and c.slug = p.slug
    where s.is_active = true
      and not exists (
        select 1 from public.program_course_links x
        where x.org_id = v_org_id
          and x.program_id = p.id
          and x.course_id = c.id
      );
  end if;

  update public.program_enrollments pe
  set course_id = c.id,
      updated_at = now()
  from public.programs p
  join public.apprenticeship_standard_versions s on s.program_slug = p.slug and s.is_active = true
  join public.courses c on c.program_id = p.id and c.slug = p.slug
  where pe.program_id = p.id
    and pe.course_id is null;
end $$;
