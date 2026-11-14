-- Execute after the migration inside BEGIN; always ROLLBACK.
CREATE TEMP TABLE purchase_test ON COMMIT DROP AS
SELECT w.id workbook_id,p.id product_id,
 (SELECT u.id FROM public.profiles u WHERE u.role NOT IN ('admin','super_admin','staff','instructor')
  AND NOT EXISTS(SELECT 1 FROM public.program_enrollments e WHERE coalesce(e.user_id,e.student_id)=u.id AND e.program_id=w.program_id)
  AND NOT EXISTS(SELECT 1 FROM public.user_entitlements x WHERE x.user_id=u.id AND x.product_id=p.id) LIMIT 1) buyer,
 gen_random_uuid() order_id,gen_random_uuid() entitlement_id,
 (SELECT s.id FROM public.digital_workbook_sections s WHERE s.workbook_id=w.id ORDER BY section_number LIMIT 1) section_id
FROM public.digital_workbooks w JOIN public.products p ON p.slug=w.slug||'-workbook'
WHERE w.slug='prestige-elevation-cosmetology';
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM purchase_test WHERE buyer IS NOT NULL AND section_id IS NOT NULL) THEN RAISE EXCEPTION 'Missing purchase test context'; END IF; END $$;
GRANT SELECT ON purchase_test TO authenticated;
INSERT INTO public.store_orders(id,user_id,status,total_cents,items)
SELECT order_id,buyer,'pending',9000,jsonb_build_array(jsonb_build_object('product_id',product_id::text,'quantity',1,'unit_price_cents',9000)) FROM purchase_test;
INSERT INTO public.user_entitlements(id,user_id,product_id,status,entitlement_type)
SELECT entitlement_id,buyer,product_id,'active','digital_workbook' FROM purchase_test;
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',buyer,'role','authenticated')::text,true) IS NOT NULL FROM purchase_test;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 IF public.can_edit_digital_workbook((SELECT workbook_id FROM purchase_test)) THEN RAISE EXCEPTION 'Pending order unlocked workbook'; END IF;
 IF EXISTS(SELECT 1 FROM public.digital_workbooks w JOIN purchase_test t ON t.workbook_id=w.id) THEN RAISE EXCEPTION 'Pending content visible'; END IF;
END $$;
RESET ROLE;
UPDATE public.store_orders SET status='paid' WHERE id=(SELECT order_id FROM purchase_test);
SET LOCAL ROLE authenticated;
DO $$ DECLARE s uuid; a public.digital_workbook_responses; BEGIN
 IF NOT public.can_edit_digital_workbook((SELECT workbook_id FROM purchase_test)) THEN RAISE EXCEPTION 'Paid purchase unavailable'; END IF;
 IF (SELECT count(*) FROM public.digital_workbook_sections s JOIN purchase_test t ON t.workbook_id=s.workbook_id)<>40 THEN RAISE EXCEPTION 'Purchased sections missing'; END IF;
 SELECT section_id INTO s FROM purchase_test;
 SELECT * INTO a FROM public.save_digital_workbook_section(s,'{"notes":"Transaction-only buyer test"}',false,0);
 IF a.version<>1 THEN RAISE EXCEPTION 'Buyer save failed'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.digital_workbook_responses r WHERE r.section_id=s AND r.answers->>'notes'='Transaction-only buyer test') THEN RAISE EXCEPTION 'Buyer reopen failed'; END IF;
 IF (SELECT count(*) FROM public.digital_workbooks)<>1 THEN RAISE EXCEPTION 'Purchase unlocked other workbooks'; END IF;
END $$;
RESET ROLE;
UPDATE public.user_entitlements SET status='revoked',revoked_at=now() WHERE id=(SELECT entitlement_id FROM purchase_test);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 IF public.can_edit_digital_workbook((SELECT workbook_id FROM purchase_test)) THEN RAISE EXCEPTION 'Revoked purchase retained access'; END IF;
 BEGIN PERFORM public.save_digital_workbook_section((SELECT section_id FROM purchase_test),'{}',false,1);
 RAISE EXCEPTION 'Revoked purchase saved answers'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
UPDATE public.user_entitlements SET status='active',revoked_at=NULL WHERE id=(SELECT entitlement_id FROM purchase_test);
UPDATE public.store_orders SET status='refunded' WHERE id=(SELECT order_id FROM purchase_test);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 IF public.can_edit_digital_workbook((SELECT workbook_id FROM purchase_test)) THEN RAISE EXCEPTION 'Refunded order retained access'; END IF;
END $$;
RESET ROLE;
SET LOCAL ROLE anon;
DO $$ BEGIN
 BEGIN PERFORM public.can_edit_digital_workbook(gen_random_uuid()); RAISE EXCEPTION 'Anonymous function executable'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
