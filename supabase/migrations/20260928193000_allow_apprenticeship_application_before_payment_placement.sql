-- An apprenticeship application is an intake record, not proof of enrollment.
-- Payment verification and Host Shop placement remain required before the
-- applicant can enter an enrollment/active-apprentice state, but must not
-- prevent the initial application from being saved and reviewed.
create or replace function public.guard_apprenticeship_submission_requirements()
returns trigger
language plpgsql
set search_path to 'pg_catalog', 'public'
as $function$
declare
  is_apprenticeship boolean;
  is_enrollment_activation boolean;
  entering_activation_state boolean;
begin
  is_apprenticeship :=
    coalesce(new.program_slug, new.pathway_slug, new.program_interest, '') ilike '%apprentice%';

  if not is_apprenticeship then
    return new;
  end if;

  if new.host_shop_inquiry_requested
     and new.assigned_shop_id is null
     and new.employer_sponsor_id is null then
    new.status := 'waitlisted';
    new.intake_stage := 'host_shop_waitlist';
    new.submitted_at := null;
    new.next_step := 'Host Shop inquiry received. Waiting for a nearby Host Shop match.';
    return new;
  end if;

  -- Initial submission and staff review must be durable even when payment or
  -- placement is outstanding. Enforce those prerequisites only when the
  -- record is being activated for enrollment/apprenticeship participation.
  is_enrollment_activation := coalesce(new.status, '') in
    ('ready_to_enroll', 'enrolled', 'active_apprentice', 'placed');

  entering_activation_state := is_enrollment_activation and (
    tg_op = 'INSERT'
    or (tg_op = 'UPDATE' and new.status is distinct from old.status)
  );

  if entering_activation_state
     and new.funding_type = 'self_pay'
     and coalesce(new.payment_status, '') <> 'paid' then
    raise exception 'PAYMENT_REQUIRED_BEFORE_ENROLLMENT_ACTIVATION'
      using errcode = '23514';
  end if;

  if entering_activation_state
     and new.assigned_shop_id is null
     and new.employer_sponsor_id is null
     and not coalesce(new.has_employer_sponsor, false)
     and not coalesce(new.host_shop_contacted, false) then
    raise exception 'HOST_SHOP_CONTACT_OR_INQUIRY_REQUIRED_BEFORE_ENROLLMENT_ACTIVATION'
      using errcode = '23514';
  end if;

  if new.host_shop_contacted and new.host_shop_contacted_at is null then
    new.host_shop_contacted_at := now();
  end if;

  return new;
end;
$function$;

