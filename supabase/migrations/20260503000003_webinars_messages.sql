-- =============================================================================
-- Webinars + Messages tables
--
-- Replaces hardcoded fake arrays in app/webinars/page.tsx and
-- app/messages/sent/page.tsx with real DB-backed tables.
-- =============================================================================

BEGIN;

-- ── webinars ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.webinars (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT        NOT NULL,
  description     TEXT,
  host_name       TEXT        NOT NULL,
  host_title      TEXT,
  scheduled_at    TIMESTAMPTZ,
  duration_minutes INTEGER,
  registration_url TEXT,
  recording_url   TEXT,
  thumbnail_url   TEXT,
  status          TEXT        NOT NULL DEFAULT 'upcoming',
                  CHECK (status IN ('upcoming', 'live', 'completed', 'cancelled')),
  attendee_count  INTEGER     DEFAULT 0,
  view_count      INTEGER     DEFAULT 0,
  tags            TEXT[]      DEFAULT '{}',
  is_public       BOOLEAN     NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webinars_status       ON public.webinars(status);
CREATE INDEX IF NOT EXISTS idx_webinars_scheduled_at ON public.webinars(scheduled_at);

-- ── webinar_registrations ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.webinar_registrations (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  webinar_id  UUID        NOT NULL REFERENCES public.webinars(id) ON DELETE CASCADE,
  user_id     UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  email       TEXT        NOT NULL,
  name        TEXT,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  attended    BOOLEAN     DEFAULT false
  UNIQUE (webinar_id, email)
);

CREATE INDEX IF NOT EXISTS idx_webinar_reg_webinar_id ON public.webinar_registrations(webinar_id);
CREATE INDEX IF NOT EXISTS idx_webinar_reg_user_id    ON public.webinar_registrations(user_id);

-- ── messages ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID       REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject     TEXT,
  body        TEXT        NOT NULL,
  is_read     BOOLEAN     NOT NULL DEFAULT false,
  read_at     TIMESTAMPTZ,
  thread_id   UUID,       -- groups replies; NULL = new thread
  parent_id   UUID        REFERENCES public.messages(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id    ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id    ON public.messages(thread_id);

COMMIT;
