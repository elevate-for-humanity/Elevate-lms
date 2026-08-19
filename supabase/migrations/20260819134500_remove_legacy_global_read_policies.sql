-- Remove legacy policies that allowed any signed-in user to read sensitive
-- records across tenants/users. Newer owner, tenant, partner and admin policies
-- remain in place and continue to provide the intended access paths.

begin;

-- Application/intake records contain PII and business review data.
drop policy if exists auth_read_employer_applications on public.employer_applications;
drop policy if exists auth_read_program_holder_applications on public.program_holder_applications;
drop policy if exists auth_read_staff_applications on public.staff_applications;

-- Contact inquiries are staff work queue data, not an authenticated-user feed.
drop policy if exists "Allow authenticated reads" on public.inquiries;
drop policy if exists inquiries_staff_read on public.inquiries;
create policy inquiries_staff_read
on public.inquiries
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role in ('admin', 'super_admin', 'staff', 'org_admin')
  )
);

-- Certificates retain public verification, owner, tenant, partner and admin
-- policies; remove the obsolete global authenticated read.
drop policy if exists auth_read_certificates on public.certificates;

-- Personal learner artifacts must be owner/admin scoped.
drop policy if exists auth_read_user_resumes on public.user_resumes;
drop policy if exists auth_read_user_achievements on public.user_achievements;

-- Reduce anonymous table privileges to the operations actually intended by the
-- public surface. RLS remains the second enforcement layer.
revoke select on public.applications from anon;
revoke select on public.inquiries from anon;
revoke select on public.license_agreement_acceptances from anon;
revoke select on public.user_resumes from anon;
revoke select on public.user_achievements from anon;

revoke select, update, delete, truncate, references, trigger on public.employer_applications from anon;
revoke select, update, delete, truncate, references, trigger on public.program_holder_applications from anon;
revoke select, update, delete, truncate, references, trigger on public.staff_applications from anon;

commit;
