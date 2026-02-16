-- Create programs table for Elevate For Humanity
-- This table stores centralized program data for the entire ecosystem

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_description text not null,
  long_description text not null,
  hero_image text,
  hero_image_alt text,
  duration text,
  schedule text,
  delivery text,
  credential text,
  approvals jsonb default '[]'::jsonb,
  funding_options jsonb default '[]'::jsonb,
  highlights jsonb default '[]'::jsonb,
  what_you_learn jsonb default '[]'::jsonb,
  outcomes jsonb default '[]'::jsonb,
  requirements jsonb default '[]'::jsonb,
  is_active boolean not null default true,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists programs_slug_idx on public.programs (slug);
create index if not exists programs_is_active_idx on public.programs (is_active);
create index if not exists programs_featured_idx on public.programs (featured);

-- Enable Row Level Security
alter table public.programs enable row level security;

-- Policy: Anyone can read active programs
create policy "Programs are viewable by everyone"
  on public.programs for select
  using (is_active = true);

-- Policy: Only authenticated users can insert/update/delete (for admin interface later)
create policy "Authenticated users can manage programs"
  on public.programs for all
  using (auth.role() = 'authenticated');

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at
create trigger set_updated_at
  before update on public.programs
  for each row
  execute function public.handle_updated_at();

-- Comments for documentation
comment on table public.programs is 'Centralized program data for workforce training programs';
comment on column public.programs.slug is 'URL-friendly identifier (e.g., hvac-technician)';
comment on column public.programs.name is 'Display name of the program';
comment on column public.programs.short_description is 'Brief description for cards and previews';
comment on column public.programs.long_description is 'Full program description with formatting';
comment on column public.programs.is_active is 'Whether the program is currently offered';
comment on column public.programs.featured is 'Whether to feature on homepage';
