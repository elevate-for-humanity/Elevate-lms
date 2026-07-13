-- Guardrail enforcement log
-- Records every enforcement action taken by the guardrail engine.
-- Used to prevent duplicate enforcement within grace periods.

create table if not exists public.guardrail_enforcement_log (
  id                  uuid primary key default gen_random_uuid(),
  program_holder_id   uuid not null,
  policy_id           text not null,
  action              text not null,
  severity            text not null,
  violation_type      text not null,
  mou_section         text,
  mou_clause          text,
  enforced_at         timestamptz not null default now(),
  dry_run             boolean not null default false
);

create index if not exists guardrail_log_holder_policy_idx
  on public.guardrail_enforcement_log(program_holder_id, policy_id, enforced_at desc);

alter table public.guardrail_enforcement_log enable row level security;

-- Only service role can write; admins can read
create policy "service_write" on public.guardrail_enforcement_log
  for all using (auth.role() = 'service_role');

create policy "admin_read" on public.guardrail_enforcement_log
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'super_admin', 'staff')
    )
  );
