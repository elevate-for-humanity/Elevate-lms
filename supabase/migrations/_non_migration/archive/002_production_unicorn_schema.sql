-- =====================================================
-- PRODUCTION UNICORN LMS - Complete Database Schema
-- Multi-tenant, RBAC, Billing, AI, Community, Analytics
-- Copyright (c) 2025 Elevate for Humanity
-- =====================================================

-- 0) Extensions & enums
create extension if not exists pgcrypto;
create extension if not exists "uuid-ossp";

-- Roles enum (RBAC)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type app_role as enum ('owner','admin','instructor','staff','student');
  end if;
end$$;

-- Status enums
do $$
begin
  if not exists (select 1 from pg_type where typname = 'pub_status') then
    create type pub_status as enum ('draft','published','archived');
  end if;
end$$;

-- =====================================================
-- 1) Core tenancy, members, and helpers
-- =====================================================

-- Orgs (tenants)
create table if not exists orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  tier text not null default 'starter',
  status text not null default 'active',
  settings jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Org membership (Auth <-> Orgs)
create table if not exists org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  status text not null default 'active',
  invited_by uuid references auth.users(id),
  invited_at timestamptz,
  joined_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, user_id)
);

-- Helper: is current user a member of org?
create or replace function is_member_of(org uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from org_members
    where org_id = org and user_id = auth.uid()
  );
$$;

-- Helper: current user role in org
create or replace function member_role(org uuid)
returns app_role language sql stable as $$
  select role from org_members
  where org_id = org and user_id = auth.uid()
  limit 1;
$$;

alter table org_members enable row level security;

-- RLS: members can see members of their org
create policy "members_read" on org_members
for select using ( is_member_of(org_id) );

-- RLS: owners/admins manage members
create policy "members_insert" on org_members
for insert with check ( member_role(org_id) in ('owner','admin') );

create policy "members_update" on org_members
for update using ( member_role(org_id) in ('owner','admin') );

create policy "members_delete" on org_members
for delete using ( member_role(org_id) = 'owner' );

-- =====================================================
-- 2) Billing, plans, and entitlements (Stripe-syncable)
-- =====================================================

create table if not exists billing_subscriptions (
  org_id uuid primary key references orgs(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  plan text not null default 'starter',
  status text not null default 'active', -- trialing/active/past_due/canceled
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  seats integer default 1,
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists entitlements (
  org_id uuid primary key references orgs(id) on delete cascade,
  max_seats int not null default 5,
  max_courses int not null default 10,
  features jsonb not null default '{}'::jsonb,
  source text not null default 'manual',
  updated_at timestamptz not null default now()
);

alter table billing_subscriptions enable row level security;
alter table entitlements          enable row level security;

create policy "billing_read" on billing_subscriptions
for select using ( is_member_of(org_id) and member_role(org_id) in ('owner','admin') );

create policy "ent_read" on entitlements
for select using ( is_member_of(org_id) );

create policy "ent_write_admin" on entitlements
for update using ( member_role(org_id) in ('owner','admin') );

-- =====================================================
-- 3) Configuration & secure API keys (for AI/Workers)
-- =====================================================

-- Per-tenant configuration
create table if not exists org_settings (
  org_id uuid primary key references orgs(id) on delete cascade,
  config jsonb not null default '{}'::jsonb, -- feature flags, UI, domains, etc.
  updated_at timestamptz not null default now()
);

-- Server-managed secrets (never readable by client RLS users)
create table if not exists org_api_keys (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  provider text not null,                      -- 'openai','cloudflare','zapier'
  key_encrypted text not null,                 -- store KMS/Secrets-managed cipher
  created_at timestamptz not null default now(),
  unique(org_id, provider)
);

alter table org_settings enable row level security;
alter table org_api_keys enable row level security;

-- Settings readable to members; writable by admins
create policy "settings_read" on org_settings
for select using ( is_member_of(org_id) );

create policy "settings_write" on org_settings
for update using ( member_role(org_id) in ('owner','admin') );

-- API keys NEVER exposed to client by RLS; only server-role should access.
create policy "keys_nobody_reads" on org_api_keys
for select using ( false );

create policy "keys_nobody_writes" on org_api_keys
for all using ( false ) with check ( false );

-- =====================================================
-- 4) Content: courses, modules, lessons, assets
-- =====================================================

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  title text not null,
  slug text not null,
  description text default '',
  content jsonb default '{}',
  status pub_status not null default 'draft',
  version integer not null default 1,
  created_by uuid not null references auth.users(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, slug)
);

create table if not exists course_versions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  version integer not null,
  title text not null,
  description text,
  content jsonb not null,
  changed_by uuid not null references auth.users(id),
  change_summary text,
  created_at timestamptz not null default now(),
  unique(course_id, version)
);

create table if not exists modules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  position int not null default 1
);

create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  module_id uuid not null references modules(id) on delete cascade,
  title text not null,
  content jsonb not null default '{}'::jsonb, -- blocks, html, video refs
  position int not null default 1,
  status pub_status not null default 'draft',
  updated_at timestamptz not null default now()
);

create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  kind text not null,                  -- 'video','pdf','image','audio'
  url text not null,                   -- storage/public URL
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists enrollments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active',
  progress jsonb default '{}',
  enrolled_at timestamptz default now(),
  completed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, course_id, user_id)
);

alter table courses       enable row level security;
alter table course_versions enable row level security;
alter table modules       enable row level security;
alter table lessons       enable row level security;
alter table media_assets  enable row level security;
alter table enrollments   enable row level security;

-- RLS: read if member; write if admin/instructor
create policy "course_read" on courses
for select using ( is_member_of(org_id) );
create policy "course_write" on courses
for insert with check ( member_role(org_id) in ('owner','admin','instructor') );
create policy "course_update" on courses
for update using ( member_role(org_id) in ('owner','admin','instructor') );

create policy "course_versions_read" on course_versions
for select using ( 
  course_id in (select id from courses where org_id in (
    select org_id from org_members where user_id = auth.uid()
  ))
);

create policy "modules_read" on modules
for select using ( is_member_of(org_id) );
create policy "modules_write" on modules
for all using ( member_role(org_id) in ('owner','admin','instructor') );

create policy "lessons_read" on lessons
for select using ( is_member_of(org_id) );
create policy "lessons_write" on lessons
for all using ( member_role(org_id) in ('owner','admin','instructor') );

create policy "assets_read" on media_assets
for select using ( is_member_of(org_id) );
create policy "assets_write" on media_assets
for all using ( member_role(org_id) in ('owner','admin','instructor','staff') );

create policy "enrollments_read" on enrollments
for select using ( 
  user_id = auth.uid() or 
  (is_member_of(org_id) and member_role(org_id) in ('owner','admin','instructor','staff'))
);
create policy "enrollments_write" on enrollments
for all using ( member_role(org_id) in ('owner','admin','instructor') );

-- =====================================================
-- 5) Assessments: banks, questions, attempts (AI-grading ready)
-- =====================================================

create table if not exists question_banks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  title text not null
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  bank_id uuid references question_banks(id) on delete cascade,
  type text not null,            -- 'mcq','short','long','code','upload'
  prompt jsonb not null,         -- rich prompt
  answer_key jsonb,              -- for auto/AI grading
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists assessments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  title text not null,
  config jsonb not null default '{}'::jsonb, -- timing, proctoring, adaptivity
  status pub_status not null default 'draft'
);

create table if not exists assessment_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  assessment_id uuid not null references assessments(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  position int not null default 1
);

create table if not exists attempts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  assessment_id uuid not null references assessments(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  responses jsonb not null default '{}'::jsonb,
  score numeric,                 -- set by auto/AI grading
  started_at timestamptz not null default now(),
  submitted_at timestamptz
);

alter table question_banks   enable row level security;
alter table questions        enable row level security;
alter table assessments      enable row level security;
alter table assessment_items enable row level security;
alter table attempts         enable row level security;

-- RLS: members read; instructors/admins write; user can read own attempts
create policy "qb_read" on question_banks for select using ( is_member_of(org_id) );
create policy "qb_write" on question_banks for all using ( member_role(org_id) in ('owner','admin','instructor') );

create policy "q_read"  on questions for select using ( is_member_of(org_id) );
create policy "q_write" on questions for all using ( member_role(org_id) in ('owner','admin','instructor') );

create policy "assess_read"  on assessments for select using ( is_member_of(org_id) );
create policy "assess_write" on assessments for all using ( member_role(org_id) in ('owner','admin','instructor') );

create policy "items_rw" on assessment_items
for all using ( member_role(org_id) in ('owner','admin','instructor') );

-- Attempts: user reads own; admins/instructors can read all for their org
create policy "attempts_read_self" on attempts
for select using ( user_id = auth.uid() );

create policy "attempts_read_admin" on attempts
for select using ( is_member_of(org_id) and member_role(org_id) in ('owner','admin','instructor') );

create policy "attempts_write_self" on attempts
for insert with check ( user_id = auth.uid() and is_member_of(org_id) );

create policy "attempts_update_self" on attempts
for update using ( user_id = auth.uid() );

-- =====================================================
-- 6) Community & gamification (forums, badges, leaderboards)
-- =====================================================

create table if not exists forum_threads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  title text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists forum_posts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  thread_id uuid not null references forum_threads(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  content jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists badges (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  key text not null,
  name text not null,
  description text default ''
);

create table if not exists user_badges (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  badge_id uuid not null references badges(id) on delete cascade,
  awarded_at timestamptz not null default now()
);

create table if not exists leaderboards (
  org_id uuid not null references orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  points int not null default 0,
  primary key (org_id, user_id)
);

alter table forum_threads enable row level security;
alter table forum_posts   enable row level security;
alter table badges        enable row level security;
alter table user_badges   enable row level security;
alter table leaderboards  enable row level security;

create policy "forum_read" on forum_threads for select using ( is_member_of(org_id) );
create policy "forum_write" on forum_threads for all using ( is_member_of(org_id) );

create policy "posts_read" on forum_posts for select using ( is_member_of(org_id) );
create policy "posts_write" on forum_posts for all using ( is_member_of(org_id) );

create policy "badges_read" on badges for select using ( is_member_of(org_id) );
create policy "badges_admin" on badges for all using ( member_role(org_id) in ('owner','admin','instructor') );

create policy "user_badges_rw" on user_badges for all using ( is_member_of(org_id) );

create policy "lb_read" on leaderboards for select using ( is_member_of(org_id) );
create policy "lb_update_admin" on leaderboards for update using ( member_role(org_id) in ('owner','admin','instructor','staff') );

-- =====================================================
-- 7) Marketing automation (campaigns, A/B tests, funnels)
-- =====================================================

create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  channel text not null,              -- 'email','sms','inapp'
  config jsonb not null default '{}'::jsonb,
  status text not null default 'draft'
);

create table if not exists ab_tests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  entity text not null,               -- 'page','email','subject'
  variants jsonb not null,           -- {A:{...},B:{...}}
  metrics jsonb not null default '{}'::jsonb,
  active boolean not null default true
);

create table if not exists funnels (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  steps jsonb not null               -- array of steps/conditions
);

alter table campaigns enable row level security;
alter table ab_tests  enable row level security;
alter table funnels   enable row level security;

create policy "mk_read" on campaigns for select using ( is_member_of(org_id) );
create policy "mk_write" on campaigns for all using ( member_role(org_id) in ('owner','admin','staff') );

create policy "ab_read" on ab_tests for select using ( is_member_of(org_id) );
create policy "ab_write" on ab_tests for all using ( member_role(org_id) in ('owner','admin','staff') );

create policy "fn_read" on funnels for select using ( is_member_of(org_id) );
create policy "fn_write" on funnels for all using ( member_role(org_id) in ('owner','admin','staff') );

-- =====================================================
-- 8) AI Website Builder / Page Builder
-- =====================================================

create table if not exists pages (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  slug text not null,
  title text not null,
  html text not null,
  css text,
  metadata jsonb not null default '{}'::jsonb,
  status pub_status not null default 'draft',
  updated_at timestamptz not null default now(),
  unique(org_id, slug)
);

alter table pages enable row level security;

create policy "pages_read" on pages for select using ( is_member_of(org_id) );
create policy "pages_write" on pages for all using ( member_role(org_id) in ('owner','admin','staff') );

-- =====================================================
-- 9) Integrations hub (webhooks, REST, Zapier)
-- =====================================================

create table if not exists webhooks_outbox (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  event text not null,                -- 'user.created','course.published', etc.
  payload jsonb not null,
  status text not null default 'pending', -- pending|sent|failed
  attempt int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  url text not null,
  secret text,                         -- signing secret (store hashed)
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table webhooks_outbox   enable row level security;
alter table webhook_endpoints enable row level security;

create policy "wh_out_read" on webhooks_outbox for select using ( is_member_of(org_id) );
create policy "wh_out_write" on webhooks_outbox for all using ( member_role(org_id) in ('owner','admin','staff','instructor') );

create policy "wh_ep_rw" on webhook_endpoints for all using ( member_role(org_id) in ('owner','admin') );

-- =====================================================
-- 10) Advanced analytics (events, dashboards)
-- =====================================================

create table if not exists analytics_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  user_id uuid references auth.users(id),
  name text not null,                 -- 'lesson.view','purchase','attempt.submit'
  properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table if not exists dashboards (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  widgets jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table analytics_events enable row level security;
alter table dashboards       enable row level security;

create policy "events_rw" on analytics_events for all using ( is_member_of(org_id) );

create policy "dash_rw" on dashboards for all using ( member_role(org_id) in ('owner','admin','staff') );

-- =====================================================
-- 11) Automation & monitoring (copilot/autopilot)
-- =====================================================

-- Workflow jobs/queues (simple)
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  kind text not null,                 -- 'email.campaign','grade.ai','webhook.dispatch'
  payload jsonb not null,
  status text not null default 'queued', -- queued|running|done|error
  err text,
  run_after timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Health checks / logs
create table if not exists system_logs (
  id uuid primary key default gen_random_uuid(),
  level text not null,                -- info|warn|error
  message text not null,
  context jsonb,
  created_at timestamptz not null default now()
);

alter table jobs        enable row level security;
alter table system_logs enable row level security;

create policy "jobs_rw" on jobs for all using ( member_role(org_id) in ('owner','admin','staff') );
-- system_logs: client should not read; keep server-only via service role
create policy "sys_logs_no_client" on system_logs for all using ( false ) with check ( false );

-- =====================================================
-- 12) Audit log (global)
-- =====================================================

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  actor_id uuid references auth.users(id),
  action text not null,               -- 'course.create','member.role.update'
  target text not null,               -- 'course:uuid'
  target_type text,
  target_id uuid,
  diff jsonb,
  metadata jsonb default '{}',
  ip_address inet,
  user_agent text,
  at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table audit_logs enable row level security;

create policy "audit_read_admins" on audit_logs
for select using ( is_member_of(org_id) and member_role(org_id) in ('owner','admin') );

create policy "audit_write_members" on audit_logs
for insert with check ( is_member_of(org_id) );

-- =====================================================
-- 13) Optional: SSO placeholders (IdP metadata)
-- =====================================================

create table if not exists sso_connections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  provider text not null,             -- 'okta','azuread','google-workspace'
  config jsonb not null,              -- issuer, client_id, mapping
  active boolean not null default false,
  created_at timestamptz not null default now()
);

alter table sso_connections enable row level security;
create policy "sso_rw" on sso_connections for all using ( member_role(org_id) in ('owner','admin') );

-- =====================================================
-- 14) Triggers for updated_at
-- =====================================================

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_orgs_updated_at before update on orgs
  for each row execute function update_updated_at_column();

create trigger update_org_members_updated_at before update on org_members
  for each row execute function update_updated_at_column();

create trigger update_courses_updated_at before update on courses
  for each row execute function update_updated_at_column();

create trigger update_enrollments_updated_at before update on enrollments
  for each row execute function update_updated_at_column();

create trigger update_billing_subscriptions_updated_at before update on billing_subscriptions
  for each row execute function update_updated_at_column();

create trigger update_entitlements_updated_at before update on entitlements
  for each row execute function update_updated_at_column();

-- =====================================================
-- 15) Seed entitlements for existing orgs (idempotent)
-- =====================================================

insert into entitlements(org_id, max_seats, max_courses, features)
select id, 5, 10, '{"audit": true, "customBranding": false}'::jsonb from orgs
on conflict (org_id) do nothing;

-- =====================================================
-- 16) System configuration defaults
-- =====================================================

create table if not exists system_configuration (
  id uuid primary key default gen_random_uuid(),
  config_key text not null unique,
  config_value jsonb not null,
  description text,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

-- Tier defaults
insert into system_configuration (config_key, config_value, description) values
  ('tier.starter.max_orgs', '1', 'Maximum organizations for starter tier'),
  ('tier.starter.max_seats', '5', 'Maximum seats for starter tier'),
  ('tier.starter.max_courses', '10', 'Maximum courses for starter tier'),
  ('tier.starter.features', '["basic_courses", "basic_analytics"]', 'Features for starter tier'),
  ('tier.growth.max_orgs', '5', 'Maximum organizations for growth tier'),
  ('tier.growth.max_seats', '50', 'Maximum seats for growth tier'),
  ('tier.growth.max_courses', '100', 'Maximum courses for growth tier'),
  ('tier.growth.features', '["basic_courses", "advanced_analytics", "white_label", "mobile_apps"]', 'Features for growth tier'),
  ('tier.enterprise.max_orgs', '-1', 'Unlimited organizations for enterprise tier'),
  ('tier.enterprise.max_seats', '-1', 'Unlimited seats for enterprise tier'),
  ('tier.enterprise.max_courses', '-1', 'Unlimited courses for enterprise tier'),
  ('tier.enterprise.features', '["all"]', 'All features for enterprise tier')
on conflict (config_key) do nothing;

-- =====================================================
-- COMPLETE! Production-ready unicorn LMS schema.
-- =====================================================
