-- Course Completion with External Modules
-- This migration adds the logic to check if all external partner modules are approved
-- before allowing course completion

-- ============================================================================
-- 1. Add internal_complete flag to enrollments if not exists
-- ============================================================================

-- Check if column exists, add if not
do $$ 
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'enrollments' 
    and column_name = 'internal_complete'
  ) then
    alter table enrollments add column internal_complete boolean default false;
  end if;
end $$;

-- Add index for performance
create index if not exists idx_enrollments_internal_complete 
  on enrollments(internal_complete);

-- ============================================================================
-- 2. Function: Check if all external modules are approved for a course
-- ============================================================================

create or replace function public.external_modules_complete(
  p_course_id uuid,
  p_user_id uuid
) returns boolean
language plpgsql
stable
as $$
declare
  total_required int;
  total_approved int;
begin
  -- How many external modules are required for this course?
  select count(*)
  into total_required
  from public.external_partner_modules
  where course_id = p_course_id
    and is_required = true;

  -- If none required, it's automatically satisfied
  if total_required = 0 then
    return true;
  end if;

  -- How many of those modules are approved for this learner?
  select count(*)
  into total_approved
  from public.external_partner_progress
  where user_id = p_user_id
    and status = 'approved'
    and module_id in (
      select id
      from public.external_partner_modules
      where course_id = p_course_id
        and is_required = true
    );

  return total_approved >= total_required;
end;
$$;

comment on function public.external_modules_complete is 
  'Returns true if all required external partner modules are approved for a user in a course';

-- ============================================================================
-- 3. Function: Get external module completion summary
-- ============================================================================

create or replace function public.external_modules_summary(
  p_course_id uuid,
  p_user_id uuid
) returns table (
  total_required int,
  total_approved int,
  is_complete boolean,
  pending_modules jsonb
)
language plpgsql
stable
as $$
declare
  v_total_required int;
  v_total_approved int;
  v_pending jsonb;
begin
  -- Count required modules
  select count(*)
  into v_total_required
  from public.external_partner_modules
  where course_id = p_course_id
    and is_required = true;

  -- Count approved modules
  select count(*)
  into v_total_approved
  from public.external_partner_progress
  where user_id = p_user_id
    and status = 'approved'
    and module_id in (
      select id
      from public.external_partner_modules
      where course_id = p_course_id
        and is_required = true
    );

  -- Get pending modules
  select jsonb_agg(
    jsonb_build_object(
      'id', epm.id,
      'title', epm.title,
      'partner_name', epm.partner_name,
      'status', coalesce(epp.status, 'not_started')
    )
  )
  into v_pending
  from public.external_partner_modules epm
  left join public.external_partner_progress epp 
    on epp.module_id = epm.id 
    and epp.user_id = p_user_id
  where epm.course_id = p_course_id
    and epm.is_required = true
    and (epp.status is null or epp.status != 'approved');

  return query select 
    v_total_required,
    v_total_approved,
    (v_total_approved >= v_total_required) as is_complete,
    coalesce(v_pending, '[]'::jsonb) as pending_modules;
end;
$$;

comment on function public.external_modules_summary is 
  'Returns detailed summary of external module completion status for a user in a course';

-- ============================================================================
-- 4. Function: Check overall course completion (internal + external)
-- ============================================================================

create or replace function public.check_course_completion(
  p_course_id uuid,
  p_user_id uuid
) returns table (
  can_complete boolean,
  internal_complete boolean,
  external_complete boolean,
  missing_requirements text[]
)
language plpgsql
stable
as $$
declare
  v_internal_complete boolean;
  v_external_complete boolean;
  v_missing text[];
begin
  -- Check internal completion from enrollment
  select e.internal_complete
  into v_internal_complete
  from enrollments e
  where e.user_id = p_user_id
    and e.program_id = p_course_id
  limit 1;

  -- Default to false if no enrollment found
  v_internal_complete := coalesce(v_internal_complete, false);

  -- Check external modules
  v_external_complete := public.external_modules_complete(p_course_id, p_user_id);

  -- Build missing requirements list
  v_missing := array[]::text[];
  
  if not v_internal_complete then
    v_missing := array_append(v_missing, 'Internal course modules not complete');
  end if;

  if not v_external_complete then
    v_missing := array_append(v_missing, 'Required partner modules not approved');
  end if;

  return query select
    (v_internal_complete and v_external_complete) as can_complete,
    v_internal_complete,
    v_external_complete,
    v_missing;
end;
$$;

comment on function public.check_course_completion is 
  'Checks if a user can complete a course (both internal and external requirements met)';

-- ============================================================================
-- 5. Trigger: Auto-update enrollment status when all requirements met
-- ============================================================================

create or replace function auto_complete_enrollment()
returns trigger as $$
declare
  v_enrollment_id uuid;
  v_course_id uuid;
  v_user_id uuid;
  v_can_complete boolean;
begin
  -- Get enrollment info from the progress record
  select epm.course_id, new.user_id
  into v_course_id, v_user_id
  from external_partner_modules epm
  where epm.id = new.module_id;

  -- Check if course can be completed
  select can_complete
  into v_can_complete
  from check_course_completion(v_course_id, v_user_id);

  -- If yes, update enrollment
  if v_can_complete then
    update enrollments
    set 
      status = 'completed',
      completed_at = now()
    where user_id = v_user_id
      and program_id = v_course_id
      and status != 'completed';
  end if;

  return new;
end;
$$ language plpgsql;

-- Trigger when external module is approved
create trigger trigger_auto_complete_enrollment
  after update on external_partner_progress
  for each row
  when (new.status = 'approved' and old.status != 'approved')
  execute function auto_complete_enrollment();

comment on function auto_complete_enrollment is 
  'Automatically marks enrollment as completed when all requirements (internal + external) are met';

-- ============================================================================
-- 6. View: Course completion status for all enrollments
-- ============================================================================

create or replace view enrollment_completion_status as
select 
  e.id as enrollment_id,
  e.user_id,
  e.program_id as course_id,
  e.status as enrollment_status,
  e.internal_complete,
  e.completed_at,
  (
    select count(*)
    from external_partner_modules epm
    where epm.course_id = e.program_id
      and epm.is_required = true
  ) as total_external_modules,
  (
    select count(*)
    from external_partner_progress epp
    join external_partner_modules epm on epm.id = epp.module_id
    where epp.user_id = e.user_id
      and epm.course_id = e.program_id
      and epm.is_required = true
      and epp.status = 'approved'
  ) as approved_external_modules,
  (
    select external_modules_complete(e.program_id, e.user_id)
  ) as external_complete,
  (
    e.internal_complete and 
    (select external_modules_complete(e.program_id, e.user_id))
  ) as ready_for_completion
from enrollments e;

comment on view enrollment_completion_status is 
  'Shows completion status for all enrollments including external module requirements';

-- ============================================================================
-- 7. Grant permissions
-- ============================================================================

-- Allow authenticated users to call these functions
grant execute on function public.external_modules_complete to authenticated;
grant execute on function public.external_modules_summary to authenticated;
grant execute on function public.check_course_completion to authenticated;

-- Allow authenticated users to view completion status
grant select on enrollment_completion_status to authenticated;

-- ============================================================================
-- 8. Example queries
-- ============================================================================

-- Check if user can complete a course:
-- SELECT * FROM check_course_completion('course-uuid', 'user-uuid');

-- Get external module summary:
-- SELECT * FROM external_modules_summary('course-uuid', 'user-uuid');

-- View all enrollment completion statuses:
-- SELECT * FROM enrollment_completion_status WHERE user_id = 'user-uuid';
