-- Seed default platform_settings rows for all admin Settings pages.
-- Uses INSERT ... ON CONFLICT DO NOTHING so existing values are never overwritten.
-- Safe to re-run.

INSERT INTO platform_settings (key, value) VALUES
  -- General
  ('site_name',             ''),
  ('support_email',         ''),
  ('contact_phone',         ''),
  ('timezone',              'America/Indiana/Indianapolis'),

  -- Security
  ('mfa_required',          'false'),
  ('session_timeout',       '480'),
  ('ip_allowlist',          ''),

  -- Notifications
  ('email_notifications',   'true'),
  ('sms_notifications',     'false'),
  ('slack_webhook',         ''),

  -- Payments
  ('stripe_mode',           'live'),
  ('currency',              'USD'),
  ('payment_methods',       'card,affirm,sezzle'),

  -- Email
  ('email_from_name',       ''),
  ('email_from_address',    ''),
  ('email_provider',        'sendgrid')

ON CONFLICT (key) DO NOTHING;
