-- Migration: Allow students to claim applications by email
-- Date: 2024-12-21
-- Description: Students can claim unclaimed applications that match their email address

-- Drop existing policy if it exists
drop policy if exists students_claim_applications on public.applications;

-- Create policy for students to claim applications
create policy students_claim_applications
on public.applications
for update
to authenticated
using (user_id is null and lower(email) = lower(auth.email()))
with check (user_id = auth.uid());

-- Add comment for documentation
comment on policy students_claim_applications on public.applications is 
'Allows authenticated users to claim applications that match their email address. Applications must be unclaimed (user_id is null) and the email must match (case-insensitive).';
