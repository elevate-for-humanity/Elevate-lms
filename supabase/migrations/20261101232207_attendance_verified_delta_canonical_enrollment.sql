create or replace function public.update_enrollment_hours()
returns trigger language plpgsql security invoker set search_path=public,pg_temp as $$
declare
  before_hours numeric := 0;
  after_hours numeric := 0;
  before_enrollment uuid;
  after_enrollment uuid;
  before_practical boolean := false;
  after_practical boolean := false;
  change record;
begin
  if TG_OP <> 'INSERT' then
    before_enrollment := OLD.enrollment_id;
    before_practical := OLD.type in ('practical','lab','hands_on');
    if OLD.verified is true and coalesce(OLD.status,'') not in ('rejected','cancelled','revoked') then
      before_hours := greatest(0,coalesce(OLD.hours_logged,OLD.hours_worked,0));
    end if;
  end if;
  if TG_OP <> 'DELETE' then
    after_enrollment := NEW.enrollment_id;
    after_practical := NEW.type in ('practical','lab','hands_on');
    if NEW.verified is true and coalesce(NEW.status,'') not in ('rejected','cancelled','revoked') then
      after_hours := greatest(0,coalesce(NEW.hours_logged,NEW.hours_worked,0));
    end if;
  end if;
  -- Apply verified deltas rather than replacing totals earned from other evidence.
  for change in
    select enrollment_id,sum(hours) total_delta,
      sum(case when practical then hours else 0 end) practical_delta,
      sum(case when not practical then hours else 0 end) theory_delta
    from (values(before_enrollment,-before_hours,before_practical),(after_enrollment,after_hours,after_practical))
      as changes(enrollment_id,hours,practical)
    where enrollment_id is not null group by enrollment_id having sum(hours)<>0 or
      sum(case when practical then hours else 0 end)<>0
  loop
    update public.program_enrollments set
      total_hours_completed=greatest(0,coalesce(total_hours_completed,0)+change.total_delta),
      practical_hours_completed=greatest(0,coalesce(practical_hours_completed,0)+change.practical_delta),
      theory_hours_completed=greatest(0,coalesce(theory_hours_completed,0)+change.theory_delta),
      updated_at=now()
    where id=change.enrollment_id;
  end loop;
  if TG_OP='DELETE' then return OLD; end if;
  return NEW;
end;
$$;
