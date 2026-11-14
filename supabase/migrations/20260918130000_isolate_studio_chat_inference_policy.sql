-- Keep interactive Admin Studio inference independent from long-running course media queues.
-- The provider authorization function enforces max_active_requests per scope_key.
insert into public.paid_inference_policies (
  tenant_id,
  enabled,
  paused,
  daily_limit_micros,
  monthly_limit_micros,
  per_request_limit_micros,
  max_active_requests,
  approval_threshold_micros,
  currency,
  updated_by,
  updated_at,
  scope_key
)
values (
  null,
  true,
  false,
  5000000,
  50000000,
  100000,
  10,
  100000,
  'USD',
  null,
  now(),
  'studio-chat'
)
on conflict (scope_key) do update
set enabled = excluded.enabled,
    paused = excluded.paused,
    daily_limit_micros = excluded.daily_limit_micros,
    monthly_limit_micros = excluded.monthly_limit_micros,
    per_request_limit_micros = excluded.per_request_limit_micros,
    max_active_requests = excluded.max_active_requests,
    approval_threshold_micros = excluded.approval_threshold_micros,
    currency = excluded.currency,
    updated_at = now();
