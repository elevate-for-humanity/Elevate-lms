begin;

create table if not exists public.media_characters (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid null,
  name text not null,
  reference_image_url text null,
  appearance_prompt text null,
  voice_id text null,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.media_likeness_consents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid null,
  character_id uuid null references public.media_characters(id) on delete cascade,
  subject_name text not null,
  consent_scope text not null default 'video_generation',
  consent_status text not null default 'active' check (consent_status in ('active','revoked','expired')),
  evidence_url text null,
  granted_at timestamptz not null default now(),
  expires_at timestamptz null,
  revoked_at timestamptz null,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.media_generation_provenance (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid null,
  course_id uuid null,
  lesson_id uuid null,
  video_job_id uuid null,
  storyboard_version text not null default '1.0',
  storyboard_hash text not null,
  scene_id text not null,
  operation text not null,
  provider text not null,
  model text not null,
  model_version text null,
  prompt_hash text not null,
  reference_urls jsonb not null default '[]'::jsonb,
  reference_hash text null,
  likeness_consent_record_ids jsonb not null default '[]'::jsonb,
  moderation_decision text not null default 'approved' check (moderation_decision in ('approved','blocked','review')),
  ai_generated boolean not null default true,
  watermark_policy text not null default 'elevate-ai-generated-v1',
  generated_asset_url text null,
  generated_bytes bigint null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists media_generation_provenance_video_job_idx on public.media_generation_provenance(video_job_id);
create index if not exists media_generation_provenance_course_lesson_idx on public.media_generation_provenance(course_id, lesson_id);
create index if not exists media_generation_provenance_tenant_idx on public.media_generation_provenance(tenant_id, created_at desc);
create index if not exists media_likeness_consents_character_idx on public.media_likeness_consents(character_id, consent_status);

alter table public.media_characters enable row level security;
alter table public.media_likeness_consents enable row level security;
alter table public.media_generation_provenance enable row level security;

-- Service-role/Admin writes these records. Authenticated users may only read rows
-- that are attached to their own tenant through application-controlled APIs.
-- No broad authenticated write policy is created intentionally.

grant select on public.media_characters to authenticated;
grant select on public.media_likeness_consents to authenticated;
grant select on public.media_generation_provenance to authenticated;

commit;
