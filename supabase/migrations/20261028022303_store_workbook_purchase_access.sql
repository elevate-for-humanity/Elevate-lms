-- Workbook purchases grant study access only, never program enrollment or hours.
-- Keep billing tables private. This private helper returns only the signed-in
-- caller's purchase eligibility; it accepts no caller-supplied user identity.
CREATE OR REPLACE FUNCTION rpc_private.workbook_purchase_access(p_workbook uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.digital_workbooks w
  JOIN public.products p ON p.slug=w.slug||'-workbook'
  JOIN public.user_entitlements e ON e.product_id=p.id
  WHERE w.id=p_workbook AND w.is_active
   AND e.user_id=(SELECT auth.uid()) AND e.status='active' AND e.revoked_at IS NULL
   AND EXISTS(SELECT 1 FROM public.store_orders o WHERE o.user_id=e.user_id AND o.status='paid'
     AND o.items @> jsonb_build_array(jsonb_build_object('product_id',p.id::text)))
 )
$$;
REVOKE ALL ON FUNCTION rpc_private.workbook_purchase_access(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION rpc_private.workbook_purchase_access(uuid) TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.can_edit_digital_workbook(p_workbook_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.digital_workbooks w WHERE w.id=p_workbook_id AND w.is_active
  AND (rpc_private.workbook_program_access(w.program_id) OR rpc_private.workbook_purchase_access(w.id)))
$$;
REVOKE ALL ON FUNCTION public.can_edit_digital_workbook(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_edit_digital_workbook(uuid) TO authenticated,service_role;

DROP POLICY IF EXISTS workbook_assigned_read ON public.digital_workbooks;
CREATE POLICY workbook_assigned_read ON public.digital_workbooks FOR SELECT TO authenticated
 USING(is_active AND (rpc_private.workbook_program_access(program_id)
  OR rpc_private.workbook_purchase_access(id) OR (SELECT rpc_private.workbook_admin_read())));
DROP POLICY IF EXISTS workbook_section_assigned_read ON public.digital_workbook_sections;
CREATE POLICY workbook_section_assigned_read ON public.digital_workbook_sections FOR SELECT TO authenticated
 USING(EXISTS(SELECT 1 FROM public.digital_workbooks w WHERE w.id=workbook_id)
 AND ((SELECT rpc_private.workbook_admin_read()) OR rpc_private.workbook_purchase_access(workbook_id)
  OR lesson_id IS NULL OR EXISTS(SELECT 1 FROM public.course_lessons l WHERE l.id=lesson_id
  AND l.is_published AND rpc_private.paced_lesson_access((SELECT auth.uid()),l.id))));
DROP POLICY IF EXISTS workbook_response_owner_insert ON public.digital_workbook_responses;
CREATE POLICY workbook_response_owner_insert ON public.digital_workbook_responses FOR INSERT TO authenticated
 WITH CHECK(user_id=(SELECT auth.uid()) AND public.can_edit_digital_workbook((
  SELECT s.workbook_id FROM public.digital_workbook_sections s WHERE s.id=section_id)));
DROP POLICY IF EXISTS workbook_response_owner_update ON public.digital_workbook_responses;
CREATE POLICY workbook_response_owner_update ON public.digital_workbook_responses FOR UPDATE TO authenticated
 USING(user_id=(SELECT auth.uid()))
 WITH CHECK(user_id=(SELECT auth.uid()) AND public.can_edit_digital_workbook((
  SELECT s.workbook_id FROM public.digital_workbook_sections s WHERE s.id=section_id)));

-- Existing workbook content is retained. Only public catalog metadata is added.
INSERT INTO public.products(id,name,slug,description,price,price_cents,type,category,image_url,is_active,requires_shipping,track_inventory,currency)
SELECT v.id::uuid,v.name,v.slug,'Digital apprenticeship workbook with practice prompts and private account-saved answers. Course enrollment and training hours are separate.',90,9000,'digital_workbook','digital-workbook',w.cover_image,true,false,false,'usd'
FROM (VALUES
 ('2e03fb81-1385-5391-b34d-a2d3e4e9db8e','Barbering Apprenticeship Workbook','prestige-elevation-barbering-workbook','prestige-elevation-barbering'),
 ('381aff7f-7fdc-58bd-8b65-0d07f4f411ec','Cosmetology Apprenticeship Workbook','prestige-elevation-cosmetology-workbook','prestige-elevation-cosmetology'),
 ('2ee1a1cc-fadf-550d-8f9b-bb1c4752784e','Esthetics Apprenticeship Workbook','prestige-elevation-esthetics-workbook','prestige-elevation-esthetics'),
 ('c25ba6dc-6ab1-555f-9944-b51e8154f9c2','Nail Technology Apprenticeship Workbook','prestige-elevation-nail-technology-workbook','prestige-elevation-nail-technology')
) v(id,name,slug,workbook_slug)
JOIN public.digital_workbooks w ON w.slug=v.workbook_slug AND w.is_active
ON CONFLICT(id) DO UPDATE SET name=excluded.name,slug=excluded.slug,description=excluded.description,
 price=excluded.price,price_cents=excluded.price_cents,type=excluded.type,category=excluded.category,
 image_url=excluded.image_url,is_active=excluded.is_active,requires_shipping=false,track_inventory=false,currency='usd';
