-- platform_settings_history
-- Stores previous values of platform_settings rows so admins can roll back.
-- Written by /api/admin/env-vars on every upsert.

create table if not exists platform_settings_history (
  id          bigserial primary key,
  key         text        not null,
  old_value   text,
  new_value   text        not null,
  changed_by  uuid        references auth.users(id) on delete set null,
  changed_at  timestamptz not null default now()
);

create index if not exists platform_settings_history_key_idx
  on platform_settings_history (key, changed_at desc);

-- RLS: super_admin / admin / staff can read; only service role can write
alter table platform_settings_history enable row level security;

drop policy if exists "admins can read settings history" on platform_settings_history;
create policy "admins can read settings history" on platform_settings_history for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('super_admin', 'admin', 'staff')
    )
  );
