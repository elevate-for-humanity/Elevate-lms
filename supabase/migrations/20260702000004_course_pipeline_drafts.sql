-- Course pipeline draft persistence
-- Stores in-progress course generation configs so admins can resume after
-- page close or session expiry. One draft per user (upsert on save).

create table if not exists public.course_pipeline_drafts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null default '',
  topic         text not null default '',
  difficulty    text not null default 'intermediate',
  program_id    uuid,
  module_count  int  not null default 6,
  lessons_per_module int not null default 5,
  include_videos boolean not null default false,
  dry_run       boolean not null default false,
  updated_at    timestamptz not null default now()
);

-- One draft per user — upsert replaces on save
create unique index if not exists course_pipeline_drafts_user_id_idx
  on public.course_pipeline_drafts(user_id);

-- RLS: users can only read/write their own draft
alter table public.course_pipeline_drafts enable row level security;

create policy "owner_all" on public.course_pipeline_drafts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger course_pipeline_drafts_updated_at
  before update on public.course_pipeline_drafts
  for each row execute function public.set_updated_at();
