-- Financial events must not silently terminate or pause apprenticeship training.
-- Stripe/webhook failures update billing state only when billing enforcement is
-- explicitly enabled. Instructional status changes require a separate authorized
-- administrative action with their own audit trail.

create or replace function public.protect_apprentice_training_from_billing_pause()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(coalesce(new.program_slug, '')) like '%apprentice%'
     and lower(coalesce(new.status, '')) = 'paused'
     and lower(coalesce(new.pause_reason, '')) = 'payment_failed'
  then
    -- Never let a payment event pause training automatically.
    new.status := old.status;
    new.paused_at := old.paused_at;
    new.pause_reason := old.pause_reason;

    -- Only apprentices explicitly placed under payment enforcement are marked
    -- delinquent. Apprentices who are not paying yet remain unaffected.
    if coalesce(old.billing_enforcement_enabled, false) then
      new.billing_state := 'payment_failed';
      new.billing_state_changed_at := now();
      new.payment_status := 'past_due';
    else
      new.billing_state := old.billing_state;
      new.billing_state_changed_at := old.billing_state_changed_at;
      new.payment_status := old.payment_status;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_protect_apprentice_training_from_billing_pause
  on public.program_enrollments;

create trigger trg_protect_apprentice_training_from_billing_pause
before update on public.program_enrollments
for each row
execute function public.protect_apprentice_training_from_billing_pause();

comment on function public.protect_apprentice_training_from_billing_pause() is
  'Prevents automated payment-failure events from pausing apprenticeship training and honors per-enrollment billing enforcement opt-in.';
