-- Complete integrity coverage outside the exposed public schema. Archived FSSA
-- relationships still need indexes for maintenance operations, and archive
-- tables need stable row identities for deterministic retention and deletion.

create index if not exists idx_fssa_attendance_recorded_by
  on fssa_archive.fssa_attendance(recorded_by);
create index if not exists idx_fssa_budget_entered_by
  on fssa_archive.fssa_budget(entered_by);
create index if not exists idx_fssa_participants_exit_interview_by
  on fssa_archive.fssa_participants(exit_interview_by);
create index if not exists idx_fssa_participants_exit_recorded_by
  on fssa_archive.fssa_participants(exit_recorded_by);
create index if not exists idx_fssa_participants_intake_staff_id
  on fssa_archive.fssa_participants(intake_staff_id);

alter table audit_private.pg_net_http_response_archive
  add constraint pg_net_http_response_archive_pkey primary key (id);

alter table maintenance.migration_history_dedup_archive
  add column archive_id bigint generated always as identity primary key;

alter table maintenance.storage_bucket_cleanup_archive
  add column archive_id bigint generated always as identity primary key;
