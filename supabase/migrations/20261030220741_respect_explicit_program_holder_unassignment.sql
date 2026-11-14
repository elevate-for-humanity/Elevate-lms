create or replace function public.assign_program_holder_to_enrollment()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.program_id is null then new.program_holder_id := null; return new; end if;
  if lower(coalesce(new.status,'')) in ('cancelled','canceled','rejected','withdrawn') then
    new.program_holder_id := null; return new;
  end if;
  -- Preserve explicit assignments AND deliberate unassignment on the same program.
  -- Defaults apply when first enrolling or changing programs, never on unrelated edits.
  if tg_op = 'UPDATE' then
    if new.program_id is not distinct from old.program_id then return new; end if;
  elsif new.program_holder_id is not null then return new;
  end if;
  if lower(coalesce(new.status,'')) not in ('active','enrolled','completed','graduated') then
    new.program_holder_id := null; return new;
  end if;
  select php.program_holder_id into new.program_holder_id
  from public.program_holder_programs php
  join public.program_holders ph on ph.id=php.program_holder_id
  where php.program_id=new.program_id
    and coalesce(php.status,'active')='active'
    and coalesce(ph.status,'active')='active'
  order by coalesce(php.is_primary,false) desc,php.created_at asc,php.id asc limit 1;
  return new;
end;
$$;
revoke all on function public.assign_program_holder_to_enrollment() from public;
