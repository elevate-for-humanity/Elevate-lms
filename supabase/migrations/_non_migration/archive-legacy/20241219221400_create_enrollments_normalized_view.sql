-- Migration: Create enrollments_normalized view
-- Purpose: Normalize course_id confusion between program_id and partner_course_id
-- Date: 2024-12-19
-- Author: AI Safety Guardrails

-- Drop existing view if it exists
drop view if exists public.enrollments_normalized;

-- Create normalized view that handles both program and partner course enrollments
create or replace view public.enrollments_normalized as
select
  e.id,
  e.user_id,
  e.program_id,
  e.partner_course_id,
  e.status,
  e.enrolled_at,
  e.completed_at,
  e.progress,
  e.created_at,
  e.updated_at,
  -- Normalized fields
  coalesce(e.partner_course_id::text, e.program_id::text) as item_id,
  case
    when e.partner_course_id is not null then 'partner_course'
    when e.program_id is not null then 'program'
    else 'unknown'
  end as item_type,
  -- Join to get item details
  coalesce(pc.title, p.name) as item_name,
  coalesce(pc.description, p.description) as item_description,
  -- Pricing information (if available)
  pc.retail_price_cents as partner_course_price,
  null::integer as program_price -- Programs are typically free/funded
from public.enrollments e
left join public.partner_courses pc on pc.id = e.partner_course_id
left join public.programs p on p.id = e.program_id;

-- Add comment
comment on view public.enrollments_normalized is 
  'Normalized view of enrollments that handles both program_id and partner_course_id, providing a unified item_id and item_type for queries';

-- Grant access
grant select on public.enrollments_normalized to authenticated;
grant select on public.enrollments_normalized to anon;

-- Verification query (run this to test)
-- select item_id, item_type, item_name, status
-- from public.enrollments_normalized
-- limit 5;
