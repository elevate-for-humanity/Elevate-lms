-- User roles for the Elevate super app
create type user_role as enum (
  'student',
  'program_holder',
  'instructor',
  'admin',
  'vita_staff',
  'supersonic_staff',
  'grant_client'
);

-- Program holders (schools, partners, organizations)
create table if not exists public.program_holders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_email text,
  contact_phone text,
  entity_id uuid references public.entities(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- User profiles with role-based access
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role user_role not null default 'student',
  program_holder_id uuid references public.program_holders(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_program_holder_idx on public.profiles(program_holder_id);

-- RLS policies
alter table public.profiles enable row level security;
alter table public.program_holders enable row level security;

-- Users can read their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Admins can read all profiles
create policy "Admins can read all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Program holders can read their learners
create policy "Program holders can read their learners"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() 
      and p.role = 'program_holder'
      and p.program_holder_id = profiles.program_holder_id
    )
  );
