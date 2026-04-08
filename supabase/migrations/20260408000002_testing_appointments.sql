-- Testing appointments and reminders tables.
-- Populated by /api/testing/calendly-webhook on invitee.created/canceled.
-- Reminders fired by /api/internal/testing-reminders cron.

CREATE TABLE IF NOT EXISTS public.testing_appointments (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  calendly_event_uri    text UNIQUE,
  calendly_invitee_uri  text UNIQUE,
  invitee_name          text NOT NULL,
  invitee_email         text NOT NULL,
  invitee_phone         text,
  exam_type             text,
  start_time            timestamptz NOT NULL,
  end_time              timestamptz,
  status                text NOT NULL DEFAULT 'confirmed'
                          CHECK (status IN ('confirmed', 'canceled', 'completed', 'no_show')),
  cancel_url            text,
  reschedule_url        text,
  stripe_payment_intent text,
  notes                 text,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.testing_appointment_reminders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id  uuid NOT NULL REFERENCES public.testing_appointments(id) ON DELETE CASCADE,
  type            text NOT NULL CHECK (type IN ('24h', '1h')),
  send_at         timestamptz NOT NULL,
  sent            boolean NOT NULL DEFAULT false,
  sent_at         timestamptz,
  canceled        boolean NOT NULL DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_testing_appts_email     ON public.testing_appointments(invitee_email);
CREATE INDEX IF NOT EXISTS idx_testing_appts_start     ON public.testing_appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_testing_appts_status    ON public.testing_appointments(status);
CREATE INDEX IF NOT EXISTS idx_testing_reminders_send  ON public.testing_appointment_reminders(send_at)
  WHERE sent = false AND canceled = false;

-- RLS: service role only for writes; admins can read
ALTER TABLE public.testing_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testing_appointment_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public.testing_appointments
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access" ON public.testing_appointment_reminders
  FOR ALL USING (auth.role() = 'service_role');

-- Store webhook signing secret
INSERT INTO app_secrets (key, value, scope, note)
VALUES (
  'CALENDLY_WEBHOOK_SECRET',
  '9b396c9ee4161ae2241c6938bb8601e19e6a37f4a22d376cc68f1db421723cd3',
  'runtime',
  'Calendly webhook signing key for /api/testing/calendly-webhook. Webhook URI: https://api.calendly.com/webhook_subscriptions/dd9f4be4-0f00-49e8-a637-d84a7aeb4d80'
)
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value, updated_at = now();
