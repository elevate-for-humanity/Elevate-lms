-- Issue #935: guardian verification, consent-safe recruiting, and canonical media promotion.

alter table public.parent_student_links
  add column if not exists status text not null default 'pending',
  add column if not exists requested_at timestamptz not null default now(),
  add column if not exists verified_by uuid references auth.users(id) on delete set null,
  add column if not exists verified_at timestamptz,
  add column if not exists revoked_by uuid references auth.users(id) on delete set null,
  add column if not exists revoked_at timestamptz,
  add column if not exists revocation_reason text;

update public.parent_student_links
set status = case when verified then 'verified' else 'pending' end,
    verified_at = case when verified then coalesce(verified_at, updated_at, created_at) else null end
where status is null or status not in ('pending','verified','rejected','revoked');

alter table public.parent_student_links drop constraint if exists parent_student_links_status_check;
alter table public.parent_student_links add constraint parent_student_links_status_check
  check (status in ('pending','verified','rejected','revoked'));

create or replace function public.sync_parent_student_link_verification()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.verified := new.status = 'verified';
  if new.status = 'verified' and new.verified_at is null then new.verified_at := now(); end if;
  if new.status = 'revoked' and new.revoked_at is null then new.revoked_at := now(); end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists sync_parent_student_link_verification on public.parent_student_links;
create trigger sync_parent_student_link_verification
before insert or update on public.parent_student_links
for each row execute function public.sync_parent_student_link_verification();

drop policy if exists "parent_student_links_insert_own" on public.parent_student_links;
create policy "parents_submit_pending_relationship_requests"
on public.parent_student_links for insert to authenticated
with check (
  auth.uid() = parent_id
  and status = 'pending'
  and verified = false
  and verified_by is null and verified_at is null
  and revoked_by is null and revoked_at is null
);

create policy "authorized_staff_manage_parent_relationships"
on public.parent_student_links for all to authenticated
using (rpc_private.is_admin())
with check (rpc_private.is_admin());

create table if not exists public.candidate_employment_profiles (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text not null,
  headline text,
  city text,
  state text,
  program_name text,
  skills text[] not null default '{}',
  credential_names text[] not null default '{}',
  resume_url text,
  contact_email text,
  contact_phone text,
  available_for_employment boolean not null default false,
  consent_status text not null default 'withdrawn' check (consent_status in ('granted','withdrawn')),
  consented_at timestamptz,
  consent_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.candidate_employment_profiles enable row level security;
create policy "learners_manage_own_candidate_profile"
on public.candidate_employment_profiles for all to authenticated
using (learner_id = auth.uid()) with check (learner_id = auth.uid());
create policy "verified_employers_read_consented_candidates"
on public.candidate_employment_profiles for select to authenticated
using (
  available_for_employment and consent_status = 'granted'
  and exists (
    select 1 from public.profiles p where p.id = auth.uid()
      and p.verified is true and p.role in ('employer','recruiter','admin','super_admin','staff')
  )
);

create table if not exists public.recruiter_candidate_actions (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid not null references auth.users(id) on delete cascade,
  candidate_profile_id uuid not null references public.candidate_employment_profiles(id) on delete cascade,
  action_type text not null check (action_type in ('shortlisted','removed','contact_requested')),
  notes text,
  created_at timestamptz not null default now()
);
alter table public.recruiter_candidate_actions enable row level security;
create policy "recruiters_manage_own_candidate_actions"
on public.recruiter_candidate_actions for all to authenticated
using (recruiter_id = auth.uid()) with check (
  recruiter_id = auth.uid() and exists (
    select 1 from public.profiles p where p.id = auth.uid()
      and p.verified is true and p.role in ('employer','recruiter','admin','super_admin','staff')
  )
);

alter table public.lesson_video_versions add column if not exists transcript text;
alter table public.lesson_video_versions drop constraint if exists lesson_video_versions_status_check;
alter table public.lesson_video_versions add constraint lesson_video_versions_status_check
  check (status in ('candidate','active','archived','rejected'));
create unique index if not exists lesson_video_versions_job_unique
  on public.lesson_video_versions(video_job_id) where video_job_id is not null;
create unique index if not exists media_assets_source_job_unique
  on public.media_assets(source_job_id) where source_job_id is not null;

-- Recover legacy completions into the governed review lifecycle without publishing them.
update public.video_jobs
set review_status = 'pending_review', updated_at = now()
where asset_kind = 'lesson' and status = 'complete' and video_url is not null
  and review_status = 'not_ready';

insert into public.lesson_video_versions (
  course_id, lesson_id, video_job_id, video_url, duration_seconds, scene_count,
  quality_evidence, procedure_schema, transcript, status
)
select course_id, lesson_id, id, video_url, duration_seconds, scene_count,
       coalesce(quality_evidence, '{}'::jsonb), coalesce(procedure_schema, scene_data, '{}'::jsonb), script, 'candidate'
from public.video_jobs
where asset_kind = 'lesson' and status = 'complete' and video_url is not null
on conflict (video_job_id) where video_job_id is not null do nothing;

-- Recover abandoned work conservatively. The worker remains responsible for rendering.
update public.video_jobs
set status = 'queued', retry_count = retry_count + 1, started_at = null,
    error_message = 'Recovered stale rendering job', updated_at = now()
where status = 'rendering' and updated_at < now() - interval '2 hours' and retry_count < 3;
update public.video_jobs
set status = 'failed', completed_at = now(), last_failure_at = now(),
    error_message = coalesce(error_message, 'Retry limit exceeded'), updated_at = now()
where status in ('queued','rendering') and updated_at < now() - interval '24 hours' and retry_count >= 3;

-- Trigger functions are invoked by their owning triggers, never directly by API roles.
revoke execute on function public.sync_parent_student_link_verification() from public, anon, authenticated;
grant execute on function public.sync_parent_student_link_verification() to service_role;
