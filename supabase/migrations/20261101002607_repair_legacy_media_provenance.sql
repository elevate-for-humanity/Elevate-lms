-- Restore the documented media audit relation as service-owned metadata.
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

alter table public.media_generation_provenance enable row level security;
revoke all on public.media_generation_provenance from public,anon,authenticated;
grant select,insert,update on public.media_generation_provenance to service_role;
alter table public.ultimate_job_attempt_history enable row level security;
