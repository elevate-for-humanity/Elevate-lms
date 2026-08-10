ALTER TABLE public.partner_documents
  ADD COLUMN IF NOT EXISTS file_type text,
  ADD COLUMN IF NOT EXISTS file_size integer;

CREATE OR REPLACE FUNCTION public.fill_partner_document_display_name()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NULLIF(BTRIM(NEW.display_name), '') IS NULL THEN
    NEW.display_name := COALESCE(
      NULLIF(BTRIM(NEW.file_name), ''),
      NULLIF(INITCAP(REPLACE(NEW.document_type, '_', ' ')), ''),
      'Document'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fill_partner_document_display_name ON public.partner_documents;
CREATE TRIGGER trg_fill_partner_document_display_name
BEFORE INSERT OR UPDATE OF display_name, file_name, document_type
ON public.partner_documents
FOR EACH ROW
EXECUTE FUNCTION public.fill_partner_document_display_name();
