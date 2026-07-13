-- Ensure OCR result columns exist on documents table.
-- These may already exist from earlier migrations — all statements are idempotent.

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS ocr_text         TEXT,
  ADD COLUMN IF NOT EXISTS ocr_confidence   DECIMAL(5,4),
  ADD COLUMN IF NOT EXISTS extracted_data   JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS processed_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processed_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index for finding unprocessed documents efficiently
CREATE INDEX IF NOT EXISTS idx_documents_status
  ON public.documents (status)
  WHERE status IN ('pending', 'pending_review', 'processing', 'error');

-- Index for looking up a user's documents
CREATE INDEX IF NOT EXISTS idx_documents_user_id
  ON public.documents (user_id)
  WHERE user_id IS NOT NULL;

COMMENT ON COLUMN public.documents.ocr_text IS 'Raw text extracted by Tesseract (images) or pdf-parse (PDFs)';
COMMENT ON COLUMN public.documents.ocr_confidence IS 'OCR confidence 0.0–1.0; NULL means not yet processed or source was pdf-parse (exact)';
COMMENT ON COLUMN public.documents.extracted_data IS 'Structured fields parsed from ocr_text: {fields, source, word_count, char_count}';
COMMENT ON COLUMN public.documents.processed_at IS 'Timestamp when OCR processing completed';
COMMENT ON COLUMN public.documents.processed_by IS 'Admin user who triggered processing';
