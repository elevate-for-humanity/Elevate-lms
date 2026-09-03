-- Platform settings table for admin-configurable values.
-- Single-row per key design — upsert on key conflict.

create table if not exists platform_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

-- Seed defaults
insert into platform_settings (key, value) values
  ('site_name',           'Elevate For Humanity'),
  ('support_email',       'info@elevateforhumanity.org'),
  ('email_notifications', 'true'),
  ('system_alerts',       'true')
on conflict (key) do nothing;

-- RLS: only admin/super_admin can read or write
alter table platform_settings enable row level security;

create policy "admin_read_settings"
  on platform_settings for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'super_admin')
    )
  );

create policy "admin_write_settings"
  on platform_settings for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'super_admin')
    )
  );
