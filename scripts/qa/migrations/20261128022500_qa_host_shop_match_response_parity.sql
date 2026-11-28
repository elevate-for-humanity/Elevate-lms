-- Isolated QA only. Restore the deployed canonical match-response RPC and
-- service-role-only access required by the Host Shop response endpoint.
-- Production already has this routine; never run this QA stage there.
DO $qa_guard$
BEGIN
  IF (SELECT count(*) FROM public.tenants WHERE slug = 'elevate-lms-qa') <> 1
     OR EXISTS (SELECT 1 FROM public.tenants WHERE slug IS DISTINCT FROM 'elevate-lms-qa') THEN
    RAISE EXCEPTION 'QA match response parity: isolated tenant required';
  END IF;
  IF to_regprocedure('public.respond_host_shop_match_request(uuid,uuid,text,text)') IS NOT NULL THEN
    RAISE EXCEPTION 'QA match response parity: unexpected existing routine';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE NOT tgisinternal AND tgrelid IN (
      'auth.users'::regclass, 'public.profiles'::regclass, 'public.partners'::regclass,
      'public.shops'::regclass, 'public.host_shops'::regclass,
      'public.host_shop_match_requests'::regclass, 'public.apprentice_placements'::regclass
    )
  ) THEN
    RAISE EXCEPTION 'QA match response parity: review fixture side effects before running';
  END IF;
END
$qa_guard$;

CREATE OR REPLACE FUNCTION public.respond_host_shop_match_request(p_request_id uuid, p_responder_id uuid, p_status text, p_shop_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_request public.host_shop_match_requests%rowtype;
  v_shop record;
  v_placement_id uuid;
  v_count integer;
  v_max integer;
  v_already_active boolean;
begin
  if p_status not in ('approved','declined') then raise exception 'invalid match response status'; end if;
  select * into v_request from public.host_shop_match_requests where id=p_request_id and deleted_at is null for update;
  if not found then raise exception 'match request not found'; end if;
  if v_request.status not in ('pending',p_status) then raise exception 'match request already resolved'; end if;
  if p_status='approved' then
    select s.id,s.tenant_id,s.partner_id,coalesce(hs.max_apprentices,2) as max_apprentices into v_shop
      from public.shops s join public.partners p on p.id=s.partner_id join public.host_shops hs on hs.id=s.id
     where s.id=v_request.host_shop_id and s.active is not false and s.tenant_id is not null and p.status='active' and p.approval_status='approved' and p.is_active is not false and hs.shop_status='active' and hs.approval_status='approved' and hs.is_approved is true and hs.is_accepting_apprentices is true
     for update of s,hs;
    if not found then raise exception 'host shop is not active, approved, and accepting apprentices'; end if;
    select exists(select 1 from public.apprentice_placements where student_id=v_request.apprentice_id and shop_id=v_request.host_shop_id and program_slug=coalesce(nullif(v_request.program_slug,''),'barber-apprenticeship') and status='active') into v_already_active;
    select count(*)::integer into v_count from public.apprentice_placements where shop_id=v_request.host_shop_id and status='active';
    v_max:=v_shop.max_apprentices;
    if not v_already_active and v_count>=v_max then raise exception 'host shop has no available apprentice slots'; end if;
    insert into public.apprentice_placements(student_id,shop_id,program_slug,start_date,status,tenant_id,match_request_id,created_at,updated_at)
    values(v_request.apprentice_id,v_request.host_shop_id,coalesce(nullif(v_request.program_slug,''),'barber-apprenticeship'),current_date,'active',v_shop.tenant_id,v_request.id,now(),now())
    on conflict(student_id,shop_id,program_slug) do update set status='active',end_date=null,tenant_id=excluded.tenant_id,match_request_id=excluded.match_request_id,updated_at=now()
    returning id into v_placement_id;
  end if;
  update public.host_shop_match_requests set status=p_status,shop_notes=nullif(trim(coalesce(p_shop_notes,'')),''),responded_at=now(),responded_by=p_responder_id,placement_id=case when p_status='approved' then v_placement_id else placement_id end,updated_at=now() where id=v_request.id;
  if p_status='approved' then
    select count(*)::integer into v_count from public.apprentice_placements where shop_id=v_request.host_shop_id and status='active';
    update public.host_shops set current_apprentice_count=v_count,updated_at=now() where id=v_request.host_shop_id;
  end if;
  return jsonb_build_object('request_id',v_request.id,'status',p_status,'placement_id',v_placement_id);
end;$function$;

REVOKE ALL ON FUNCTION public.respond_host_shop_match_request(uuid,uuid,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.respond_host_shop_match_request(uuid,uuid,text,text) TO service_role;

-- Real database regression, not a mocked RPC. Every inserted row is rolled
-- back by the inner exception subtransaction, including the Auth fixtures.
DO $verify$
DECLARE
  v_tenant uuid;
  v_partner uuid := gen_random_uuid();
  v_shop uuid := gen_random_uuid();
  v_student_a uuid := gen_random_uuid();
  v_student_b uuid := gen_random_uuid();
  v_responder uuid := gen_random_uuid();
  v_request_a uuid := gen_random_uuid();
  v_request_b uuid := gen_random_uuid();
  v_request_c uuid := gen_random_uuid();
  v_placement uuid;
  v_result jsonb;
BEGIN
  IF NOT has_function_privilege('service_role','public.respond_host_shop_match_request(uuid,uuid,text,text)','EXECUTE')
     OR has_function_privilege('authenticated','public.respond_host_shop_match_request(uuid,uuid,text,text)','EXECUTE')
     OR has_function_privilege('anon','public.respond_host_shop_match_request(uuid,uuid,text,text)','EXECUTE') THEN
    RAISE EXCEPTION 'QA match response parity: unexpected RPC grants';
  END IF;
  SELECT id INTO STRICT v_tenant FROM public.tenants WHERE slug='elevate-lms-qa';
  BEGIN
    INSERT INTO auth.users (id,email,aud,role,raw_app_meta_data)
    SELECT id, 'qa-match-rpc-'||id::text||'@qa.invalid','authenticated','authenticated',
           '{"qa_fixture":true,"qa_test":"match_response_parity"}'::jsonb
    FROM unnest(ARRAY[v_student_a,v_student_b,v_responder]) AS ids(id);

    INSERT INTO public.profiles (id,email,full_name,role,tenant_id)
    SELECT id,'qa-match-rpc-'||id::text||'@qa.invalid','Disposable QA match fixture',
           CASE WHEN id=v_responder THEN 'host_shop' ELSE 'apprentice' END,v_tenant
    FROM unnest(ARRAY[v_student_a,v_student_b,v_responder]) AS ids(id);

    INSERT INTO public.partners(id,name,owner_name,contact_email,status,approval_status,is_active)
    VALUES(v_partner,'Disposable QA match fixture','Disposable QA','qa-match-rpc-'||v_partner::text||'@qa.invalid','active','approved',true);
    INSERT INTO public.shops(id,name,tenant_id,partner_id,active)
    VALUES(v_shop,'Disposable QA match fixture',v_tenant,v_partner,true);
    INSERT INTO public.host_shops(id,name,tenant_id,owner_id,shop_status,approval_status,is_approved,is_accepting_apprentices,max_apprentices,current_apprentice_count)
    VALUES(v_shop,'Disposable QA match fixture',v_tenant,v_responder,'active','approved',true,true,1,0);
    INSERT INTO public.host_shop_match_requests(id,apprentice_id,host_shop_id,program_slug,status)
    VALUES(v_request_a,v_student_a,v_shop,'barber-apprenticeship','pending'),
          (v_request_b,v_student_b,v_shop,'barber-apprenticeship','pending'),
          (v_request_c,v_student_b,v_shop,'cosmetology-apprenticeship','pending');

    v_result := public.respond_host_shop_match_request(v_request_a,v_responder,'approved',' QA approval ');
    v_placement := (v_result->>'placement_id')::uuid;
    IF v_result->>'status' IS DISTINCT FROM 'approved'
       OR v_placement IS NULL
       OR NOT EXISTS (SELECT 1 FROM public.apprentice_placements WHERE id=v_placement AND student_id=v_student_a AND shop_id=v_shop AND tenant_id=v_tenant AND match_request_id=v_request_a AND status='active')
       OR NOT EXISTS (SELECT 1 FROM public.host_shop_match_requests WHERE id=v_request_a AND status='approved' AND responded_by=v_responder AND placement_id=v_placement AND shop_notes='QA approval' AND responded_at IS NOT NULL)
       OR (SELECT current_apprentice_count FROM public.host_shops WHERE id=v_shop) IS DISTINCT FROM 1 THEN
      RAISE EXCEPTION 'QA match approval regression failed';
    END IF;

    v_result := public.respond_host_shop_match_request(v_request_a,v_responder,'approved',NULL);
    IF (v_result->>'placement_id')::uuid IS DISTINCT FROM v_placement
       OR (SELECT count(*) FROM public.apprentice_placements WHERE shop_id=v_shop) <> 1 THEN
      RAISE EXCEPTION 'QA match repeated approval regression failed';
    END IF;

    BEGIN
      PERFORM public.respond_host_shop_match_request(v_request_b,v_responder,'approved',NULL);
      RAISE EXCEPTION 'QA match capacity regression: accepted an over-capacity request';
    EXCEPTION WHEN raise_exception THEN
      IF SQLERRM <> 'host shop has no available apprentice slots' THEN RAISE; END IF;
    END;
    IF (SELECT status FROM public.host_shop_match_requests WHERE id=v_request_b) IS DISTINCT FROM 'pending'
       OR EXISTS (SELECT 1 FROM public.apprentice_placements WHERE match_request_id=v_request_b) THEN
      RAISE EXCEPTION 'QA match capacity regression: rejected request changed';
    END IF;

    v_result := public.respond_host_shop_match_request(v_request_b,v_responder,'declined',' QA decline ');
    IF v_result->>'status' IS DISTINCT FROM 'declined'
       OR NOT EXISTS (SELECT 1 FROM public.host_shop_match_requests WHERE id=v_request_b AND status='declined' AND responded_by=v_responder AND placement_id IS NULL AND shop_notes='QA decline')
       OR EXISTS (SELECT 1 FROM public.apprentice_placements WHERE match_request_id=v_request_b) THEN
      RAISE EXCEPTION 'QA match decline regression failed';
    END IF;

    BEGIN
      PERFORM public.respond_host_shop_match_request(v_request_b,v_responder,'approved',NULL);
      RAISE EXCEPTION 'QA match resolution regression: accepted a declined request';
    EXCEPTION WHEN raise_exception THEN
      IF SQLERRM <> 'match request already resolved' THEN RAISE; END IF;
    END;

    UPDATE public.host_shops SET is_approved=false WHERE id=v_shop;
    BEGIN
      PERFORM public.respond_host_shop_match_request(v_request_c,v_responder,'approved',NULL);
      RAISE EXCEPTION 'QA match approval boundary regression: accepted an unapproved shop';
    EXCEPTION WHEN raise_exception THEN
      IF SQLERRM <> 'host shop is not active, approved, and accepting apprentices' THEN RAISE; END IF;
    END;
    IF (SELECT status FROM public.host_shop_match_requests WHERE id=v_request_c) IS DISTINCT FROM 'pending'
       OR EXISTS (SELECT 1 FROM public.apprentice_placements WHERE match_request_id=v_request_c) THEN
      RAISE EXCEPTION 'QA match approval boundary regression: rejected request changed';
    END IF;

    -- Abort only the disposable data subtransaction after all assertions pass.
    RAISE SQLSTATE 'PQA01' USING MESSAGE='QA match fixtures verified; rollback';
  EXCEPTION WHEN SQLSTATE 'PQA01' THEN NULL;
  END;

  IF EXISTS (SELECT 1 FROM auth.users WHERE id IN (v_student_a,v_student_b,v_responder))
     OR EXISTS (SELECT 1 FROM public.profiles WHERE id IN (v_student_a,v_student_b,v_responder))
     OR EXISTS (SELECT 1 FROM public.partners WHERE id=v_partner)
     OR EXISTS (SELECT 1 FROM public.shops WHERE id=v_shop)
     OR EXISTS (SELECT 1 FROM public.host_shops WHERE id=v_shop)
     OR EXISTS (SELECT 1 FROM public.host_shop_match_requests WHERE id IN (v_request_a,v_request_b,v_request_c))
     OR EXISTS (SELECT 1 FROM public.apprentice_placements WHERE shop_id=v_shop) THEN
    RAISE EXCEPTION 'QA match fixture rollback verification failed';
  END IF;
END
$verify$;
NOTIFY pgrst, 'reload schema';
