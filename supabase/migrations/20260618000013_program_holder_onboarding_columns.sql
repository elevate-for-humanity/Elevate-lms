-- Add columns needed by the program holder onboarding-complete flow
-- and OCR document processing.

-- welcome_email_sent: idempotency flag — prevents duplicate welcome emails
ALTER TABLE public.program_holders
  ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN NOT NULL DEFAULT FALSE;

-- ocr_text: raw OCR output stored after image document uploads
ALTER TABLE public.program_holder_documents
  ADD COLUMN IF NOT EXISTS ocr_text TEXT;

-- Index for fast lookup of unsent welcome emails
CREATE INDEX IF NOT EXISTS idx_program_holders_welcome_email_sent
  ON public.program_holders (welcome_email_sent)
  WHERE welcome_email_sent = FALSE;
