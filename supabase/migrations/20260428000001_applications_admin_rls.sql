-- Allow admin/super_admin/staff roles to read and update all applications.
-- Without this, the review page calls notFound() for every application
-- because the session JWT returns an empty result set.

alter table public.applications enable row level security;

-- Drop existing policies if any to avoid conflicts
drop policy if exists "Admins can read all applications" on public.applications;
drop policy if exists "Admins can update all applications" on public.applications;
drop policy if exists "Public can insert applications" on public.applications;
drop policy if exists "Users can read own applications" on public.applications;

-- Anyone can submit an application (public intake form)
create policy "Public can insert applications"
  on public.applications for insert
  with check (true);

-- Applicants can read their own submission by email match
create policy "Users can read own applications"
  on public.applications for select
  using (
    auth.jwt() ->> 'email' = email
  );

-- Admin roles can read all applications
create policy "Admins can read all applications"
  on public.applications for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'super_admin', 'staff')
    )
  );

-- Admin roles can update application status
create policy "Admins can update all applications"
  on public.applications for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'super_admin', 'staff')
    )
  );
