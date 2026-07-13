-- Stripe event idempotency log.
--
-- Prevents duplicate processing when Stripe retries a webhook or when
-- multiple webhook endpoints are accidentally registered for the same account.
--
-- The canonical webhook (app/api/webhooks/stripe/route.ts) already uses
-- stripe_webhook_events for idempotency. This table is a lightweight
-- secondary guard for any handler that does NOT use stripe_webhook_events.
--
-- Apply in Supabase Dashboard → SQL Editor.

create table if not exists public.stripe_event_log (
  id               bigserial primary key,
  stripe_event_id  text        not null,
  stripe_event_type text       not null,
  processed_at     timestamptz not null default now()
  , constraint stripe_event_log_event_id_unique unique (stripe_event_id)
);

-- Index for fast duplicate lookups
create index if not exists idx_stripe_event_log_event_id
  on public.stripe_event_log (stripe_event_id);

-- Service role only — no user-facing RLS needed
alter table public.stripe_event_log enable row level security;

-- No SELECT/INSERT policies for anon or authenticated roles.
-- Only the service role (webhook handler) writes to this table.

comment on table public.stripe_event_log is
  'Secondary idempotency guard for Stripe webhook handlers. '
  'Primary guard is stripe_webhook_events. '
  'Insert stripe_event_id before processing; unique constraint rejects duplicates.';
