-- Create user_access table for subscription tier management
-- This is the single source of truth for what a user can access

create table if not exists public.user_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier text not null default 'free', -- free | student | career | partner
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  status text, -- active | trialing | past_due | canceled | incomplete | unpaid
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.user_access enable row level security;

-- User can read their own access
create policy "user can read own access"
on public.user_access
for select
to authenticated
using (auth.uid() = user_id);

-- Only service role should write (via webhook)
create policy "service role write access"
on public.user_access
for all
to service_role
using (true)
with check (true);

-- Create index for faster lookups
create index if not exists idx_user_access_user_id on public.user_access(user_id);
create index if not exists idx_user_access_stripe_customer on public.user_access(stripe_customer_id);
create index if not exists idx_user_access_stripe_subscription on public.user_access(stripe_subscription_id);

-- Add comment
comment on table public.user_access is 'Stores user subscription tier and Stripe sync data';
