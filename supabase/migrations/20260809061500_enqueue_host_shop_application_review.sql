-- Ensure every submitted Host Shop application enters the Admin review queue.
-- Idempotent: one open/in-progress/escalated review item per application.

CREATE OR REPLACE FUNCTION public.enqueue_host_shop_application_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'submitted' THEN
    INSERT INTO public.review_queue (
      queue_type,
      subject_type,
      subject_id,
      priority,
      reasons,
      status,
      metadata,
      entity_type,
      entity_id,
      review_type
    )
    SELECT
      'host_shop_review',
      'host_shop_application',
      NEW.id,
      8,
      ARRAY[
        'Verify business/shop license, supervising professional license, liability insurance, workers compensation or exemption, EIN/W-9 identity record, worksite capacity, and program fit before approval.'
      ],
      'open',
      jsonb_build_object(
        'application_id', NEW.id,
        'shop_name', NEW.shop_name,
        'business_name', NEW.business_name,
        'contact_email', NEW.contact_email,
        'submitted_at', NEW.submitted_at
      ),
      'host_shop_application',
      NEW.id,
      'host_shop_compliance'
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.review_queue rq
      WHERE rq.subject_type = 'host_shop_application'
        AND rq.subject_id = NEW.id
        AND rq.status IN ('open', 'in_progress', 'escalated')
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_host_shop_application_review
  ON public.host_shop_applications;

CREATE TRIGGER trg_enqueue_host_shop_application_review
AFTER INSERT OR UPDATE OF status ON public.host_shop_applications
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_host_shop_application_review();

COMMENT ON FUNCTION public.enqueue_host_shop_application_review()
IS 'Automatically creates one Admin review_queue item for each submitted Host Shop application.';
