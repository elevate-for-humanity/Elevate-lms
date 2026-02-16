-- Migration: Fix claim applications function conflicts
-- Date: 2024-12-21
-- Description: Drop all existing claim functions and recreate with correct signature

-- Drop all possible existing functions
drop function if exists public.claim_my_applications() cascade;
drop function if exists public.claim_applications_for_current_user() cascade;
drop function if exists public.claim_my_applications(text) cascade;
drop function if exists public.claim_applications_for_current_user(text) cascade;

-- Create the correct function
create or replace function public.claim_my_applications()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed_count integer;
  user_email text;
begin
  -- Get the authenticated user's email
  select email into user_email
  from auth.users
  where id = auth.uid();

  -- If no user found, return 0
  if user_email is null then
    return 0;
  end if;

  -- Update all unclaimed applications matching the user's email
  with updated as (
    update public.applications
    set 
      user_id = auth.uid(),
      updated_at = now()
    where 
      user_id is null 
      and lower(email) = lower(user_email)
    returning id
  )
  select count(*) into claimed_count from updated;

  return claimed_count;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.claim_my_applications() to authenticated;

-- Add comment for documentation
comment on function public.claim_my_applications() is 
'Claims all unclaimed applications that match the authenticated user''s email address. Returns the number of applications claimed.';
