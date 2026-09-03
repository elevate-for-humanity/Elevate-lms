-- Verified self-pay students enroll automatically. Review remains required for
-- unpaid and funded applications. The transition is allowed only after the
-- durable account and enrollment links exist.
create or replace function public.enforce_application_flow()
returns trigger
language plpgsql
set search_path to 'pg_catalog', 'public'
as $$
begin
  if old.status is null or old.status = '' then return new; end if;
  if old.status = new.status then return new; end if;

  if new.status = 'enrolled'
     and new.payment_status = 'paid'
     and new.user_id is not null
     and new.enrollment_id is not null then
    return new;
  end if;

  if (old.status = 'submitted'       and new.status in ('under_review','funding_review','pending_workone')) then return new; end if;
  if (old.status = 'under_review'    and new.status in ('approved','funding_review','rejected')) then return new; end if;
  if (old.status = 'funding_review'  and new.status in ('approved','under_review','rejected')) then return new; end if;
  if (old.status = 'pending_workone' and new.status in ('under_review','approved','rejected')) then return new; end if;
  if (old.status = 'approved'        and new.status in ('withdrawn','rejected','under_review')) then return new; end if;

  if (old.status = 'submitted'       and new.status = 'in_review') then return new; end if;
  if (old.status = 'in_review'       and new.status in ('approved','under_review','rejected')) then return new; end if;
  if (old.status = 'approved'        and new.status = 'ready_to_enroll') then return new; end if;
  if (old.status = 'ready_to_enroll' and new.status = 'enrolled') then return new; end if;

  if (old.status = 'in_review'       and new.status = 'under_review') then return new; end if;
  if (old.status = 'ready_to_enroll' and new.status = 'approved') then return new; end if;
  if (old.status = 'enrolled'        and new.status = 'approved') then return new; end if;

  if new.status in ('rejected','withdrawn') then return new; end if;
  if old.status in ('pending_workone','waitlisted') and new.status in ('under_review','in_review','rejected') then return new; end if;

  raise exception 'Invalid transition: % -> %. See enforce_application_flow trigger.', old.status, new.status;
end;
$$;
