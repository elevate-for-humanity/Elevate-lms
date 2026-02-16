-- Create contact_requests table for contact form submissions
create table public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text,
  email text,
  phone text,
  role text,
  interest text,
  followup text,
  source text
);

-- Create index for faster queries
create index idx_contact_requests_created_at on contact_requests(created_at desc);
create index idx_contact_requests_role on contact_requests(role);

-- Enable Row Level Security
alter table contact_requests enable row level security;

-- Policy: Only authenticated staff can read contact requests
create policy "Staff can view contact requests"
  on contact_requests for select
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'staff')
    )
  );

-- Policy: Anyone can insert (for public form)
create policy "Anyone can submit contact form"
  on contact_requests for insert
  to anon, authenticated
  with check (true);

-- Policy: Only staff can update
create policy "Staff can update contact requests"
  on contact_requests for update
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'staff')
    )
  );
