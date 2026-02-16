-- WIOA-Compliant Apprentice Hours System
-- Upgrades existing apprentice_hours_log to meet DOL/WIOA audit requirements

-- 1) Create enum types for WIOA compliance
do $$ begin
  create type hour_type as enum ('RTI', 'OJT');
exception when duplicate_object then null; end $$;

do $$ begin
  create type funding_phase as enum ('PRE_WIOA', 'WIOA', 'POST_CERT');
exception when duplicate_object then null; end $$;

do $$ begin
  create type entry_status as enum ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'LOCKED');
exception when duplicate_object then null; end $$;

-- 2) Add new columns to existing apprentice_hours_log table
alter table apprentice_hours_log 
  add column if not exists start_at timestamptz,
  add column if not exists end_at timestamptz,
  add column if not exists minutes int,
  add column if not exists hour_type hour_type,
  add column if not exists funding_phase funding_phase,
  add column if not exists apprentice_attest boolean not null default false,
  add column if not exists submitted_at timestamptz,
  add column if not exists approved_by uuid,
  add column if not exists approved_at timestamptz,
  add column if not exists status entry_status not null default 'DRAFT',
  add column if not exists milady_module_ref text,
  add column if not exists activity_note text,
  add column if not exists location_note text;

-- 3) Migrate existing data to new format
-- Convert hours_worked (decimal) to minutes and set default values
update apprentice_hours_log
set 
  minutes = floor(hours_worked * 60),
  start_at = coalesce(start_at, (log_date::text || ' 08:00:00')::timestamptz),
  end_at = coalesce(end_at, (log_date::text || ' 08:00:00')::timestamptz + (hours_worked * interval '1 hour')),
  hour_type = coalesce(hour_type, 'OJT'::hour_type),
  funding_phase = coalesce(funding_phase, 'PRE_WIOA'::funding_phase),
  status = case 
    when verified_at is not null then 'APPROVED'::entry_status
    else 'SUBMITTED'::entry_status
  end,
  submitted_at = coalesce(submitted_at, created_at),
  approved_at = verified_at,
  activity_note = coalesce(activity_note, notes)
where minutes is null;

-- 4) Add constraints after data migration
alter table apprentice_hours_log
  alter column start_at set not null,
  alter column end_at set not null,
  alter column minutes set not null,
  alter column hour_type set not null,
  alter column funding_phase set not null,
  add constraint chk_minutes_positive check (minutes > 0 and minutes <= 24*60),
  add constraint chk_end_after_start check (end_at > start_at);

-- 5) Create indexes for performance
create index if not exists idx_hours_log_apprentice_date on apprentice_hours_log(enrollment_id, log_date);
create index if not exists idx_hours_log_phase on apprentice_hours_log(funding_phase);
create index if not exists idx_hours_log_status on apprentice_hours_log(status);
create index if not exists idx_hours_log_hour_type on apprentice_hours_log(hour_type);

-- 6) Prevent overlapping time entries
create or replace function prevent_overlapping_hours()
returns trigger as $$
begin
  if exists (
    select 1
    from apprentice_hours_log e
    where e.enrollment_id = new.enrollment_id
      and e.id <> coalesce(new.id, gen_random_uuid())
      and tstzrange(e.start_at, e.end_at, '[)') && tstzrange(new.start_at, new.end_at, '[)')
  ) then
    raise exception 'Overlapping time entry detected for this enrollment';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_prevent_overlap_hours on apprentice_hours_log;
create trigger trg_prevent_overlap_hours
before insert or update on apprentice_hours_log
for each row execute function prevent_overlapping_hours();

-- 7) Auto-calculate minutes and update timestamp
create or replace function set_minutes_and_updated()
returns trigger as $$
begin
  new.minutes := greatest(1, floor(extract(epoch from (new.end_at - new.start_at))/60));
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_minutes_hours on apprentice_hours_log;
create trigger trg_set_minutes_hours
before insert or update on apprentice_hours_log
for each row execute function set_minutes_and_updated();

-- 8) Create apprentice funding profile table
create table if not exists apprentice_funding_profile (
  enrollment_id uuid primary key references student_enrollments(id) on delete cascade,
  wioa_start_date date null,
  post_cert_date date null,
  wioa_approved_by uuid null,
  wioa_approved_at timestamptz null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_funding_profile_wioa_start on apprentice_funding_profile(wioa_start_date);
create index if not exists idx_funding_profile_post_cert on apprentice_funding_profile(post_cert_date);

-- 9) Add RLS policies for apprentice_hours_log
-- Students can view their own hours
create policy "Students can view own hours"
  on apprentice_hours_log for select
  using (
    enrollment_id in (
      select id from student_enrollments where student_id = auth.uid()
    )
  );

-- Students can insert their own hours (DRAFT or SUBMITTED only)
create policy "Students can log own hours"
  on apprentice_hours_log for insert
  with check (
    enrollment_id in (
      select id from student_enrollments where student_id = auth.uid()
    )
    and status in ('DRAFT', 'SUBMITTED')
  );

-- Students can update their own DRAFT hours
create policy "Students can update draft hours"
  on apprentice_hours_log for update
  using (
    enrollment_id in (
      select id from student_enrollments where student_id = auth.uid()
    )
    and status = 'DRAFT'
  );

-- Mentors can view hours for their program holders
create policy "Mentors can view apprentice hours"
  on apprentice_hours_log for select
  using (
    program_holder_id in (
      select id from program_holders 
      where email = (select email from auth.users where id = auth.uid())
    )
  );

-- Mentors can approve hours
create policy "Mentors can approve hours"
  on apprentice_hours_log for update
  using (
    program_holder_id in (
      select id from program_holders 
      where email = (select email from auth.users where id = auth.uid())
    )
    and status = 'SUBMITTED'
  )
  with check (
    status in ('APPROVED', 'REJECTED')
  );

-- 10) Add RLS policies for funding profiles
alter table apprentice_funding_profile enable row level security;

create policy "Students can view own funding profile"
  on apprentice_funding_profile for select
  using (
    enrollment_id in (
      select id from student_enrollments where student_id = auth.uid()
    )
  );

-- Admins can manage funding profiles
create policy "Admins can manage funding profiles"
  on apprentice_funding_profile for all
  using (
    exists (
      select 1 from auth.users 
      where id = auth.uid() 
      and raw_user_meta_data->>'role' = 'admin'
    )
  );

-- 11) Add helpful comments
comment on column apprentice_hours_log.hour_type is 'RTI (Related Technical Instruction) or OJT (On-the-Job Training)';
comment on column apprentice_hours_log.funding_phase is 'PRE_WIOA (before WIOA approval), WIOA (during WIOA funding), POST_CERT (after certification)';
comment on column apprentice_hours_log.status is 'DRAFT (not submitted), SUBMITTED (awaiting approval), APPROVED (mentor approved), REJECTED (mentor rejected), LOCKED (final/audited)';
comment on column apprentice_hours_log.apprentice_attest is 'Student attestation that hours are accurate and truthful';
comment on table apprentice_funding_profile is 'Tracks WIOA eligibility dates and approval status per enrollment';

-- 12) Create view for weekly hour summaries
create or replace view weekly_hours_summary as
select 
  enrollment_id,
  date_trunc('week', log_date)::date as week_start,
  funding_phase,
  hour_type,
  sum(minutes) as total_minutes,
  sum(minutes) / 60.0 as total_hours,
  count(*) as entry_count,
  count(*) filter (where status = 'APPROVED') as approved_count
from apprentice_hours_log
group by enrollment_id, date_trunc('week', log_date), funding_phase, hour_type;

comment on view weekly_hours_summary is 'Weekly aggregation of hours by enrollment, funding phase, and hour type';
