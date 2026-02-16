-- Enable UUID support
create extension if not exists "uuid-ossp";

-- Users table (optional if using Supabase Auth)
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text unique,
  created_at timestamp default now()
);
