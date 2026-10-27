-- Dedicated Supersonic only; fixtures are synthetic and always rolled back.
BEGIN;

INSERT INTO auth.users(id,email,raw_app_meta_data,raw_user_meta_data) VALUES
('f2000000-0000-4000-8000-000000000001','policy-check-one@example.invalid','{}','{}'),
('f2000000-0000-4000-8000-000000000002','policy-check-two@example.invalid','{}','{}');
UPDATE public.profiles SET role='admin' WHERE id='f2000000-0000-4000-8000-000000000001';
INSERT INTO public.sfc_tax_returns(id,tracking_id) OVERRIDING SYSTEM VALUE VALUES (-202610172051,'transactional-policy-check');
INSERT INTO public.tax_clients(id,user_id,first_name,last_name,ssn_hash,ssn_last4,date_of_birth) VALUES
('f3000000-0000-4000-8000-000000000001','f2000000-0000-4000-8000-000000000001','Policy','Fixture','synthetic-policy-one','0000','1900-01-01'),
('f3000000-0000-4000-8000-000000000002','f2000000-0000-4000-8000-000000000002','Policy','Fixture','synthetic-policy-two','0000','1900-01-01');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims','{"sub":"f2000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
DO $verify$ BEGIN
 IF (SELECT count(*) FROM public.sfc_tax_returns WHERE id=-202610172051)<>0 THEN RAISE EXCEPTION 'Generic administrator retained unscoped return access'; END IF;
 IF (SELECT count(*) FROM public.tax_clients WHERE id IN ('f3000000-0000-4000-8000-000000000001','f3000000-0000-4000-8000-000000000002'))<>1 THEN RAISE EXCEPTION 'Owner isolation failed'; END IF;
END $verify$;
SET LOCAL ROLE postgres;
UPDATE public.profiles SET role='tax_preparer' WHERE id='f2000000-0000-4000-8000-000000000001';
SET LOCAL ROLE authenticated;
DO $verify$ BEGIN IF (SELECT count(*) FROM public.sfc_tax_returns WHERE id=-202610172051)<>0 THEN RAISE EXCEPTION 'Unassigned preparer retained unscoped access'; END IF; END $verify$;
SET LOCAL ROLE service_role;
DO $verify$ BEGIN IF (SELECT count(*) FROM public.sfc_tax_returns WHERE id=-202610172051)<>1 THEN RAISE EXCEPTION 'Scoped backend access lost'; END IF; END $verify$;

ROLLBACK;
