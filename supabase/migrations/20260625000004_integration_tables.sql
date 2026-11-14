-- Integration support tables for Google Classroom, Calendly, and future providers.

-- Stores OAuth tokens for third-party integrations per user/provider.
CREATE TABLE IF NOT EXISTS public.integration_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider      TEXT NOT NULL,
  access_token  TEXT NOT NULL,
  refresh_token TEXT,
  expires_at    TIMESTAMPTZ,
  scopes        TEXT,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.integration_tokens ENABLE ROW LEVEL SECURITY;

-- Only the owning user and service role can read tokens.
DROP policy if exists "integration_tokens_owner_read" on public.integration_tokens;
CREATE policy "integration_tokens_owner_read" on public.integration_tokens FOR SELECT
  USING (auth.uid() = user_id);

DROP policy if exists "integration_tokens_owner_write" on public.integration_tokens;
CREATE policy "integration_tokens_owner_write" on public.integration_tokens FOR ALL
  USING (auth.uid() = user_id);

-- Calendly bookings — written by the webhook, read by admin.
CREATE TABLE IF NOT EXISTS public.calendly_bookings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type       TEXT NOT NULL,                    -- 'invitee.created' | 'invitee.canceled'
  invitee_name     TEXT NOT NULL,
  invitee_email    TEXT NOT NULL,
  invitee_timezone TEXT,
  event_name       TEXT,
  start_time       TIMESTAMPTZ NOT NULL,
  end_time         TIMESTAMPTZ,
  location         TEXT,
  status           TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled' | 'canceled'
  utm_source       TEXT,
  utm_medium       TEXT,
  utm_campaign     TEXT,
  questions        JSONB,
  raw_payload      JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.calendly_bookings ENABLE ROW LEVEL SECURITY;

-- Admins can read all bookings; no public access.
DROP policy if exists "calendly_bookings_admin_read" on public.calendly_bookings;
CREATE policy "calendly_bookings_admin_read" on public.calendly_bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- Service role writes via webhook (bypasses RLS).

-- Google Classroom sync state per user/course.
CREATE TABLE IF NOT EXISTS public.google_classroom_sync (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id    TEXT,
  last_sync_at TIMESTAMPTZ,
  settings     JSONB DEFAULT '{}',
  status       TEXT DEFAULT 'disconnected',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.google_classroom_sync ENABLE ROW LEVEL SECURITY;

DROP policy if exists "classroom_sync_owner" on public.google_classroom_sync;
CREATE policy "classroom_sync_owner" on public.google_classroom_sync FOR ALL
  USING (auth.uid() = user_id);

