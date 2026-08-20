create table if not exists public.participant_funding_authorization_audit (
  id bigint generated always as identity primary key,
  authorization_id uuid not null,
  participant_id uuid not null,
  program_id uuid,
  action text not null check (action in ('INSERT','UPDATE','DELETE')),
  old_row jsonb,
  new_row jsonb,
  changed_at timestamptz not null default now(),
  changed_by uuid default auth.uid(),
  txid bigint not null default txid_current()
);

create index if not exists idx_participant_funding_auth_audit_auth on public.participant_funding_authorization_audit(authorization_id, changed_at);
create index if not exists idx_participant_funding_auth_audit_participant on public.participant_funding_authorization_audit(participant_id, changed_at);

alter table public.participant_funding_authorization_audit enable row level security;

create or replace function public.audit_participant_funding_authorization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.participant_funding_authorization_audit(
      authorization_id, participant_id, program_id, action, old_row, new_row, changed_by
    ) values (
      new.id, new.participant_id, new.program_id, 'INSERT', null, to_jsonb(new), auth.uid()
    );
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.participant_funding_authorization_audit(
      authorization_id, participant_id, program_id, action, old_row, new_row, changed_by
    ) values (
      new.id, new.participant_id, new.program_id, 'UPDATE', to_jsonb(old), to_jsonb(new), auth.uid()
    );
    return new;
  else
    insert into public.participant_funding_authorization_audit(
      authorization_id, participant_id, program_id, action, old_row, new_row, changed_by
    ) values (
      old.id, old.participant_id, old.program_id, 'DELETE', to_jsonb(old), null, auth.uid()
    );
    return old;
  end if;
end;
$$;

drop trigger if exists trg_audit_participant_funding_authorization on public.participant_funding_authorizations;
create trigger trg_audit_participant_funding_authorization
after insert or update or delete on public.participant_funding_authorizations
for each row execute function public.audit_participant_funding_authorization();

revoke insert, update, delete, truncate on public.participant_funding_authorization_audit from anon, authenticated;

comment on table public.participant_funding_authorization_audit is 'Append-only audit history for participant funding authorization changes. Direct client mutation is revoked.';
