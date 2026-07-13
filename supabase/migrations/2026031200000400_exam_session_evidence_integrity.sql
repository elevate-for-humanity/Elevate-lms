-- Evidence integrity fields for exam_sessions.
-- A URL alone is weak: if the file in storage is replaced, the link still resolves.
-- Storing hash + storage key lets you detect tampering after the fact.

ALTER TABLE public.exam_sessions
  ADD COLUMN IF NOT EXISTS evidence_hash          TEXT,          -- SHA-256 of the evidence file at upload time
  ADD COLUMN IF NOT EXISTS evidence_uploaded_at   TIMESTAMPTZ,  -- When evidence was first attached
  ADD COLUMN IF NOT EXISTS evidence_storage_key   TEXT;          -- Supabase storage path (bucket/path), immutable after set

-- Prevent evidence_storage_key from being overwritten once set.
-- Replacing evidence requires voiding the session and creating a new one.
CREATE OR REPLACE FUNCTION public.prevent_evidence_key_overwrite()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.evidence_storage_key IS NOT NULL
     AND NEW.evidence_storage_key IS DISTINCT FROM OLD.evidence_storage_key THEN
    RAISE EXCEPTION 'evidence_storage_key is immutable once set. Void this session and create a new one.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_evidence_key_overwrite ON public.exam_sessions;
CREATE TRIGGER trg_prevent_evidence_key_overwrite
  BEFORE UPDATE ON public.exam_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_evidence_key_overwrite();
