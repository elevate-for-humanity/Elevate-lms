-- Chain-of-custody event log for exam sessions.
-- Records every significant state transition so auditors can reconstruct
-- exactly what happened during a session, not just the final outcome.
-- Rows are append-only — no UPDATE or DELETE is permitted via RLS.

CREATE TABLE IF NOT EXISTS public.exam_session_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID        NOT NULL REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
  event_type  TEXT        NOT NULL,   -- see event types below
  actor_id    UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role  TEXT,                   -- role snapshot at event time
  metadata    JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Event types (enforced in application layer, documented here for reference):
--   session_created       — initial check-in
--   id_verified           — proctor confirmed identity
--   exam_started          — started_at set
--   camera_connected      — online proctoring: webcam confirmed
--   recording_uploaded    — evidence_url / evidence_storage_key set
--   result_recorded       — pass / fail / incomplete set
--   session_voided        — voided with reason
--   proctor_flagged       — proctor noted an irregularity
--   retest_detected       — is_retest auto-set on session creation
--   notes_updated         — proctor_notes changed

CREATE INDEX IF NOT EXISTS idx_exam_session_events_session
  ON public.exam_session_events (session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_exam_session_events_actor
  ON public.exam_session_events (actor_id);

-- RLS: same staff roles can read; insert is allowed; no update or delete ever.
ALTER TABLE public.exam_session_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY exam_session_events_read ON public.exam_session_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'staff', 'instructor')
    )
  );

CREATE POLICY exam_session_events_insert ON public.exam_session_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'staff', 'instructor')
    )
  );

-- No UPDATE policy — rows are immutable once written.
-- No DELETE policy — rows cannot be removed.
