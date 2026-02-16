-- User Roles Table
-- Stores authoritative role information for users
-- Roles: student, staff, admin

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('student', 'staff', 'admin')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.user_roles enable row level security;

-- Policy: Users can read their own role
create policy "user can read own role"
on public.user_roles for select
to authenticated
using (auth.uid() = user_roles.user_id);

-- Policy: Admins can manage all roles
create policy "admins can manage roles"
on public.user_roles for all
to authenticated
using (
  exists (
    select 1 from public.user_roles ur 
    where ur.user_id = auth.uid() and ur.role = 'admin'
  )
);

-- Create index for faster role lookups
create index if not exists idx_user_roles_user_id on public.user_roles(user_id);
create index if not exists idx_user_roles_role on public.user_roles(role);

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
create trigger update_user_roles_updated_at
  before update on public.user_roles
  for each row
  execute function public.update_updated_at_column();

-- Grant permissions
grant select on public.user_roles to authenticated;
grant insert, update, delete on public.user_roles to authenticated;
