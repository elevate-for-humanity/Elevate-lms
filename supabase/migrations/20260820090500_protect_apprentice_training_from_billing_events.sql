-- Financial events must not silently terminate or pause apprenticeship training.
-- Stripe/webhook failures update billing state; instructional status changes
-- require a separate authorized administrative action with its own audit trail.

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
    new.status := old.status;
    new.billing_state := 'payment_failed';
    new.billing_state_changed_at := now();
    new.payment_status := 'past_due';
    new.paused_at := old.paused_at;
    new.pause_reason := old.pause_reason;
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
  'Prevents automated payment-failure events from pausing apprenticeship training; records delinquency in billing fields instead.';
