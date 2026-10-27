-- Give every course video one explicit orchestration role. The renderer must
-- never infer whether an upload is pre-roll, lesson footage, or a final output
-- from timestamps or generated_by labels.
alter table public.course_videos
  add column if not exists asset_role text,
  add column if not exists sequence_index integer not null default 0,
  add column if not exists media_asset_id uuid references public.media_assets(id) on delete set null,
  add column if not exists entitlement_id uuid references public.licensed_media_entitlements(id) on delete set null;

update public.course_videos
set asset_role = case
  when generated_by = 'manual' then 'source_broll'
  else 'lesson_primary'
end
where asset_role is null;

alter table public.course_videos
  alter column asset_role set default 'lesson_primary',
  alter column asset_role set not null;

alter table public.course_videos
  drop constraint if exists course_videos_asset_role_check;
alter table public.course_videos
  add constraint course_videos_asset_role_check check (
    asset_role in (
      'source_broll',
      'course_preroll',
      'lesson_preroll',
      'lesson_primary',
      'lesson_outro',
      'reference'
    )
  );

create index if not exists idx_course_videos_render_sources
  on public.course_videos(course_id, lesson_id, asset_role, status, sequence_index, created_at desc);
create index if not exists idx_course_videos_media_asset_id
  on public.course_videos(media_asset_id) where media_asset_id is not null;
create index if not exists idx_course_videos_entitlement_id
  on public.course_videos(entitlement_id) where entitlement_id is not null;

comment on column public.course_videos.asset_role is
  'Canonical placement role used by Course Builder and the renderer; never inferred from generated_by.';
