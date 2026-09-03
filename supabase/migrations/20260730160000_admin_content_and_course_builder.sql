-- Migration: Admin Content & Course Builder Support
-- Date: 2026-07-30
-- Purpose: Add website_pages table for admin content editor and ensure courses table has required columns

create extension if not exists pgcrypto;

-- Create website_pages table for the admin website editor
create table if not exists public.website_pages (
  id uuid primary key default gen_random_uuid(),
  route text not null unique,
  title text not null,
  eyebrow text,
  headline text not null,
  summary text not null,
  primary_cta_label text,
  primary_cta_href text,
  secondary_cta_label text,
  secondary_cta_href text,
  hero_image text,
  status text not null default 'draft'
    check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add indexes for common queries
create index if not exists website_pages_route_idx
  on public.website_pages(route);

create index if not exists website_pages_status_idx
  on public.website_pages(status);

-- Ensure courses table has required columns for the API
alter table public.courses
  add column if not exists slug text;

alter table public.courses
  add column if not exists description text;

alter table public.courses
  add column if not exists status text
    default 'draft';

alter table public.courses
  add column if not exists updated_at timestamptz
    default now();

-- Create unique index for slug if not exists
do $$
begin
  if not exists (
    select 1 from pg_indexes where indexname = 'courses_slug_unique_idx'
  ) then
    create unique index courses_slug_unique_idx
      on public.courses(slug)
      where slug is not null;
  end if;
end $$;

-- RLS policies for website_pages
alter table public.website_pages
  enable row level security;

-- Allow public read of published pages
drop policy if exists "Public can read published website pages"
  on public.website_pages;

create policy "Public can read published website pages"
  on public.website_pages
  for select
  using (status = 'published');

-- Admin policy (adjust role check based on your actual profiles table)
drop policy if exists "Administrators manage website pages"
  on public.website_pages;

create policy "Administrators manage website pages"
  on public.website_pages
  for all
  using (
    exists (
      select 1
      from auth.users
      where id = auth.uid()
        and raw_user_meta_data->>'role' in ('admin', 'super_admin')
    )
  )
  with check (
    exists (
      select 1
      from auth.users
      where id = auth.uid()
        and raw_user_meta_data->>'role' in ('admin', 'super_admin')
    )
  );
