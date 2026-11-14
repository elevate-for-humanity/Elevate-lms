-- Add document_urls column to apprenticeship_intake.
-- Stores storage paths of files uploaded via /api/intake/upload before submission.
-- Paths are relative to the 'documents' bucket (e.g. intake-documents/ts-rand/type-name.pdf).

ALTER TABLE public.apprenticeship_intake
  ADD COLUMN IF NOT EXISTS document_urls TEXT[] DEFAULT '{}';
