create or replace function public.enforce_barber_appendix_a_completion()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_ready boolean;
begin
  if new.program_slug = 'barber-apprenticeship'
     and lower(coalesce(new.enrollment_state, '')) in ('completed', 'graduated')
     and (tg_op = 'INSERT' or old.enrollment_state is distinct from new.enrollment_state) then
    select completion_ready into v_ready
    from public.barber_appendix_a_completion_readiness
    where enrollment_id = new.id;

    if coalesce(v_ready, false) is not true then
      raise exception 'Barber apprenticeship completion requirements are not satisfied'
        using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_barber_appendix_a_completion() from public, anon, authenticated;

drop trigger if exists trg_enforce_barber_appendix_a_completion on public.program_enrollments;
create trigger trg_enforce_barber_appendix_a_completion
before insert or update of enrollment_state on public.program_enrollments
for each row execute function public.enforce_barber_appendix_a_completion();
