-- Captures partial booking intent before the full form is completed.
-- Used to trigger 24hr and 48hr follow-up emails when a lead doesn't convert.
-- Upserts on (lower(email), exam_type) — re-submitting refreshes the lead instead of erroring.

CREATE TABLE IF NOT EXISTS public.exam_booking_leads (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email             text        NOT NULL,
  exam_type         text        NOT NULL,       -- e.g. 'CCMA', 'CPT'
  first_name        text,
  phone             text,
  source            text        NOT NULL DEFAULT 'booking_form',
  converted         boolean     NOT NULL DEFAULT false,
  converted_at      timestamptz,
  follow_up_1_sent  boolean     NOT NULL DEFAULT false,
  follow_up_2_sent  boolean     NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint the API upserts on — same email + exam = refresh, not duplicate
CREATE UNIQUE INDEX IF NOT EXISTS exam_booking_leads_email_exam_unique
  ON public.exam_booking_leads (lower(email), exam_type);

-- Index for cron job — find unconverted leads with unsent follow-ups
CREATE INDEX IF NOT EXISTS exam_booking_leads_follow_up
  ON public.exam_booking_leads (created_at, converted, follow_up_1_sent, follow_up_2_sent);

-- Auto-update updated_at on any row change
CREATE OR REPLACE FUNCTION public.set_exam_booking_leads_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER exam_booking_leads_updated_at
  BEFORE UPDATE ON public.exam_booking_leads
  FOR EACH ROW EXECUTE FUNCTION public.set_exam_booking_leads_updated_at();

COMMENT ON TABLE public.exam_booking_leads IS 'Partial booking intent captured before checkout. Drives 24hr/48hr follow-up email sequence. Upserts on (email, exam_type).';
