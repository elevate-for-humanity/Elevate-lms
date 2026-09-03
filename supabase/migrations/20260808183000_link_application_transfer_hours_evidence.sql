-- Link private transfer-hours evidence uploaded during public apprenticeship intake
-- to the application row created immediately afterward. Evidence remains pending
-- until staff verification; claimed hours are never auto-approved.

CREATE OR REPLACE FUNCTION public.link_staged_transfer_hours_evidence()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  evidence_record public.documents%ROWTYPE;
  program_key text;
BEGIN
  IF COALESCE(NEW.transfer_hours_claimed, 0) <= 0 THEN
    RETURN NEW;
  END IF;

  program_key := COALESCE(NULLIF(NEW.program_slug, ''), NEW.program_interest);

  SELECT d.*
    INTO evidence_record
  FROM public.documents d
  WHERE d.application_id IS NULL
    AND d.document_type = 'transfer_hours_evidence'
    AND lower(COALESCE(d.metadata->>'normalized_email', '')) = lower(trim(NEW.email))
    AND COALESCE(d.metadata->>'program_slug', '') = program_key
    AND d.created_at >= now() - interval '24 hours'
  ORDER BY d.created_at DESC
  LIMIT 1;

  IF evidence_record.id IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.documents
  SET application_id = NEW.id,
      owner_type = 'application',
      owner_id = NEW.id,
      metadata = COALESCE(metadata, '{}'::jsonb)
        || jsonb_build_object(
             'staged', false,
             'linked_at', now(),
             'application_id', NEW.id,
             'hours_claimed', NEW.transfer_hours_claimed
           ),
      updated_at = now()
  WHERE id = evidence_record.id;

  INSERT INTO public.review_queue (
    queue_type,
    subject_type,
    subject_id,
    priority,
    reasons,
    status,
    metadata
  )
  SELECT
    'transcript_review',
    'document',
    evidence_record.id,
    8,
    ARRAY[
      format(
        'Applicant claims %s transfer hours. Verify uploaded evidence before awarding credit.',
        NEW.transfer_hours_claimed
      )
    ],
    'open',
    jsonb_build_object(
      'application_id', NEW.id,
      'document_type', 'transfer_hours_evidence',
      'hours_claimed', NEW.transfer_hours_claimed
    )
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.review_queue rq
    WHERE rq.subject_type = 'document'
      AND rq.subject_id = evidence_record.id
      AND rq.status IN ('open', 'in_progress', 'escalated')
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_link_staged_transfer_hours_evidence ON public.applications;
CREATE TRIGGER trg_link_staged_transfer_hours_evidence
AFTER INSERT ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.link_staged_transfer_hours_evidence();

COMMENT ON FUNCTION public.link_staged_transfer_hours_evidence()
IS 'Links staged transfer-hours evidence to a newly submitted apprenticeship application and queues it for staff verification.';
