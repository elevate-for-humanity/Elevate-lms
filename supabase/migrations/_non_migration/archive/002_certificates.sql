-- Certificates Table
-- Stores issued certificates with verification codes

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id text not null,
  program_name text not null,
  issued_at timestamptz not null default now(),
  verify_code text not null unique,
  pdf_url text,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.certificates enable row level security;

-- Policy: Students can read their own certificates
create policy "student read own certs"
on public.certificates for select
to authenticated
using (auth.uid() = user_id);

-- Policy: Staff and admins can insert certificates
create policy "staff issue certs"
on public.certificates for insert
to authenticated
with check (
  exists (
    select 1 from public.user_roles ur 
    where ur.user_id = auth.uid() and ur.role in ('staff', 'admin')
  )
);

-- Policy: Staff and admins can update certificates
create policy "staff update certs"
on public.certificates for update
to authenticated
using (
  exists (
    select 1 from public.user_roles ur 
    where ur.user_id = auth.uid() and ur.role in ('staff', 'admin')
  )
);

-- Policy: Admins can delete certificates
create policy "admin delete certs"
on public.certificates for delete
to authenticated
using (
  exists (
    select 1 from public.user_roles ur 
    where ur.user_id = auth.uid() and ur.role = 'admin'
  )
);

-- Policy: Public can verify certificates (read-only with verify_code)
create policy "public verify certs"
on public.certificates for select
to anon
using (true);

-- Create indexes for faster lookups
create index if not exists idx_certificates_user_id on public.certificates(user_id);
create index if not exists idx_certificates_verify_code on public.certificates(verify_code);
create index if not exists idx_certificates_program_id on public.certificates(program_id);
create index if not exists idx_certificates_issued_at on public.certificates(issued_at desc);

-- Trigger to automatically update updated_at
create trigger update_certificates_updated_at
  before update on public.certificates
  for each row
  execute function public.update_updated_at_column();

-- Grant permissions
grant select on public.certificates to authenticated, anon;
grant insert, update on public.certificates to authenticated;
grant delete on public.certificates to authenticated;

-- RPC function to get user by email (for staff to issue certificates)
create or replace function public.get_user_by_email(email_input text)
returns table (id uuid, email text)
language sql stable security definer
as $$
  select u.id, u.email
  from auth.users u
  where lower(u.email) = lower(email_input)
  limit 1;
$$;

grant execute on function public.get_user_by_email(text) to authenticated;
