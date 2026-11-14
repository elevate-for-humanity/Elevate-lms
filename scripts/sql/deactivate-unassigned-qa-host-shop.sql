-- Remove a clearly identified, unassigned QA host shop from active listings.
-- Preserve the record; do not alter real shops, apprentices or federal registrations.
BEGIN;
DO $$
BEGIN
 IF EXISTS (SELECT 1 FROM public.apprentices WHERE shop_id='c4b6fa84-82ae-4593-8003-2b66debd98dc' OR host_shop_id='c4b6fa84-82ae-4593-8003-2b66debd98dc')
 OR EXISTS (SELECT 1 FROM public.program_enrollments WHERE host_shop_id='c4b6fa84-82ae-4593-8003-2b66debd98dc')
 OR EXISTS (SELECT 1 FROM public.shop_staff WHERE shop_id='c4b6fa84-82ae-4593-8003-2b66debd98dc')
 THEN RAISE EXCEPTION 'QA shop now has linked records; inspect before changing'; END IF;
END $$;
UPDATE public.host_shops SET shop_status='inactive',is_approved=false,verified=false,is_accepting_apprentices=false,updated_at=now()
WHERE id='c4b6fa84-82ae-4593-8003-2b66debd98dc' AND name='[QA E2E] Host Shop 41274336036';
COMMIT;