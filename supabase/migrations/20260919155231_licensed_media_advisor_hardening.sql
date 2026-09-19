create index if not exists course_lesson_media_matches_entitlement_idx
  on public.course_lesson_media_matches (entitlement_id);
create index if not exists course_lesson_media_matches_media_asset_idx
  on public.course_lesson_media_matches (media_asset_id) where media_asset_id is not null;
create index if not exists course_lesson_media_matches_course_video_idx
  on public.course_lesson_media_matches (course_video_id) where course_video_id is not null;
create index if not exists course_lesson_media_matches_approved_by_idx
  on public.course_lesson_media_matches (approved_by) where approved_by is not null;
create index if not exists licensed_media_entitlements_created_by_idx
  on public.licensed_media_entitlements (created_by) where created_by is not null;

create policy licensed_media_entitlements_service_role_all
  on public.licensed_media_entitlements for all to service_role
  using (true) with check (true);
create policy course_lesson_media_matches_service_role_all
  on public.course_lesson_media_matches for all to service_role
  using (true) with check (true);
