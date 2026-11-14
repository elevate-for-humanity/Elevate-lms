-- Prevent concurrent builders/retries from creating duplicate active jobs for the
-- same full lesson video or microclip. Completed/failed historical jobs remain
-- available for audit and regeneration.
create unique index if not exists uq_video_jobs_active_asset
  on public.video_jobs (lesson_id, asset_kind, coalesce(asset_key,''))
  where status in ('queued','rendering');
