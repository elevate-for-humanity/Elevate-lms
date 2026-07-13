-- Mentor Portal Tables
--
-- Creates mentorships, mentor_sessions, mentor_messages, mentor_resources.
-- Apply in Supabase Dashboard → SQL Editor.

-- ── mentorships ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.mentorships (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mentee_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'pending', -- pending, active, completed, declined
  requested_at timestamptz DEFAULT now(),
  started_at   timestamptz,
  ended_at     timestamptz,
  notes        text,
  created_at   timestamptz DEFAULT now(),
  UNIQUE (mentor_id, mentee_id)
);

CREATE INDEX IF NOT EXISTS mentorships_mentor_idx  ON public.mentorships (mentor_id);
CREATE INDEX IF NOT EXISTS mentorships_mentee_idx  ON public.mentorships (mentee_id);
CREATE INDEX IF NOT EXISTS mentorships_status_idx  ON public.mentorships (status);

-- ── mentor_sessions ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.mentor_sessions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorship_id      uuid REFERENCES public.mentorships(id) ON DELETE SET NULL,
  scheduled_at       timestamptz NOT NULL,
  duration_minutes   integer DEFAULT 60,
  status             text NOT NULL DEFAULT 'scheduled', -- scheduled, completed, cancelled, no_show
  session_type       text DEFAULT 'general',
  topic              text,
  notes              text,
  location           text,
  completed_at       timestamptz,
  created_at         timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mentor_sessions_mentorship_idx ON public.mentor_sessions (mentorship_id);
CREATE INDEX IF NOT EXISTS mentor_sessions_scheduled_idx  ON public.mentor_sessions (scheduled_at);
CREATE INDEX IF NOT EXISTS mentor_sessions_status_idx     ON public.mentor_sessions (status);

-- ── mentor_messages ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.mentor_messages (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentorship_id  uuid NOT NULL REFERENCES public.mentorships(id) ON DELETE CASCADE,
  sender_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content        text NOT NULL,
  read_at        timestamptz,
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mentor_messages_mentorship_idx ON public.mentor_messages (mentorship_id);
CREATE INDEX IF NOT EXISTS mentor_messages_sender_idx     ON public.mentor_messages (sender_id);
CREATE INDEX IF NOT EXISTS mentor_messages_created_idx    ON public.mentor_messages (created_at DESC);

-- Enable Realtime for live messaging
ALTER PUBLICATION supabase_realtime ADD TABLE public.mentor_messages;

-- ── mentor_resources ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.mentor_resources (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text,
  url         text NOT NULL,
  file_type   text, -- 'pdf', 'video', 'link', 'doc'
  category    text, -- 'career', 'skills', 'wellness', 'financial', 'general'
  created_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mentor_resources_category_idx ON public.mentor_resources (category);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.mentorships     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_resources ENABLE ROW LEVEL SECURITY;

-- Mentors see their own mentorships; admins see all
CREATE POLICY "mentorships_select" ON public.mentorships FOR SELECT
  USING (
    mentor_id = auth.uid() OR mentee_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff'))
  );

CREATE POLICY "mentorships_insert" ON public.mentorships FOR INSERT
  WITH CHECK (mentee_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "mentorships_update" ON public.mentorships FOR UPDATE
  USING (mentor_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

-- Sessions: visible to mentor and mentee
CREATE POLICY "mentor_sessions_select" ON public.mentor_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.mentorships m
      WHERE m.id = mentorship_id AND (m.mentor_id = auth.uid() OR m.mentee_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff'))
  );

CREATE POLICY "mentor_sessions_insert" ON public.mentor_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.mentorships m
      WHERE m.id = mentorship_id AND m.mentor_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Messages: visible to participants
CREATE POLICY "mentor_messages_select" ON public.mentor_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.mentorships m
      WHERE m.id = mentorship_id AND (m.mentor_id = auth.uid() OR m.mentee_id = auth.uid())
    )
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

CREATE POLICY "mentor_messages_insert" ON public.mentor_messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Resources: all authenticated users can read; mentors/admins can write
CREATE POLICY "mentor_resources_select" ON public.mentor_resources FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "mentor_resources_insert" ON public.mentor_resources FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('mentor', 'admin', 'super_admin')));
