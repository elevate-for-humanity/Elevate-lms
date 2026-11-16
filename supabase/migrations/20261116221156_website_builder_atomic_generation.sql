-- Only server-authorized callers may select the plan and trial billing mode.
create or replace function public.commit_website_builder_draft(
 p_request_id uuid, p_actor_id uuid, p_website_id uuid, p_expected_updated_at timestamptz,
 p_site_name text, p_template_id text, p_site_config jsonb, p_plan text,
 p_operation text, p_charge_trial boolean
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
 v_site public.user_websites%rowtype;
 v_receipt public.website_builder_edit_commits%rowtype;
 v_fingerprint bytea;
 v_backup uuid;
 v_limit integer;
 v_count integer;
 v_success boolean;
 v_balance integer;
 v_saved jsonb;
 v_result jsonb;
begin
 if p_request_id is null or p_actor_id is null or p_charge_trial is null
  or p_site_name is null or p_template_id is null
  or p_operation is null or p_operation not in ('initial_site_generation','import')
  or (p_operation='import' and p_charge_trial)
  or jsonb_typeof(p_site_config) is distinct from 'object'
  or (p_site_config#>'{meta,parisInterviewCompleted}')='false'::jsonb
  or p_plan is null or p_plan not in ('starter','professional','enterprise')
  or (p_website_id is null and p_expected_updated_at is not null) then
  raise exception 'Invalid draft commit' using errcode='22023';
 end if;
 v_fingerprint:=sha256(convert_to(jsonb_build_array('draft',p_actor_id,p_website_id,
  extract(epoch from p_expected_updated_at),p_site_name,p_template_id,p_site_config,p_plan,p_operation,p_charge_trial)::text,'UTF8'));
 perform pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
 select * into v_receipt from public.website_builder_edit_commits where request_id=p_request_id;
 if found then
  if v_receipt.fingerprint<>v_fingerprint then raise exception 'Request identifier already used' using errcode='22023';end if;
  return v_receipt.result;
 end if;
 -- Serialize both creation paths for this owner before checking the plan limit.
 perform pg_advisory_xact_lock(hashtextextended('website-draft-owner:'||p_actor_id::text,0));
 if p_website_id is not null then
  select * into v_site from public.user_websites where id=p_website_id and user_id=p_actor_id for update;
  if not found then raise exception 'Website not found' using errcode='P0404';end if;
  if v_site.updated_at is distinct from p_expected_updated_at then
   raise exception 'Website changed while draft was prepared' using errcode='P0409';
  end if;
 end if;
 v_limit:=case p_plan when 'starter' then 1 when 'professional' then 3 else null end;
 select count(*) into v_count from public.user_websites where user_id=p_actor_id
  and (p_website_id is null or id<>p_website_id)
  and (site_config#>'{meta,parisInterviewCompleted}') is distinct from 'false'::jsonb;
 if v_limit is not null and v_count>=v_limit then
  raise exception 'Website plan limit reached' using errcode='P0409';
 end if;
 if p_website_id is not null then
  insert into public.website_revisions(website_id,user_id,site_name,subdomain,site_config,is_published,reason)
  values(v_site.id,p_actor_id,v_site.site_name,v_site.subdomain,v_site.site_config,v_site.is_published,'before_'||p_operation)
  returning id into v_backup;
  if v_backup is null then raise exception 'Rollback snapshot unavailable' using errcode='P0503';end if;
 end if;
 if p_charge_trial then
  select success,balance into v_success,v_balance from public.consume_app_credits(p_actor_id,'website-builder','initial_site_generation',60);
  if v_success is distinct from true then raise exception 'Insufficient Website Builder credits' using errcode='P0402';end if;
 end if;
 if p_website_id is null then
  insert into public.user_websites(user_id,site_name,template_id,site_config,is_published,status)
  values(p_actor_id,p_site_name,p_template_id,p_site_config,false,'draft') returning to_jsonb(user_websites.*) into v_saved;
 else
  update public.user_websites set site_name=p_site_name,template_id=p_template_id,site_config=p_site_config,
   is_published=false,status='draft' where id=p_website_id returning to_jsonb(user_websites.*) into v_saved;
 end if;
 -- Match the existing public response; never return internal ownership or trial metadata.
 v_saved:=jsonb_build_object('id',v_saved->'id','site_name',v_saved->'site_name','subdomain',v_saved->'subdomain',
  'is_published',v_saved->'is_published','updated_at',v_saved->'updated_at');
 v_result:=jsonb_build_object('website',v_saved,'backupRevisionId',v_backup,
  'creditsCharged',case when p_charge_trial then 60 else 0 end,'creditsRemaining',v_balance);
 insert into public.website_builder_edit_commits(request_id,fingerprint,result) values(p_request_id,v_fingerprint,v_result);
 return v_result;
end;$$;
revoke all on function public.commit_website_builder_draft(uuid,uuid,uuid,timestamptz,text,text,jsonb,text,text,boolean) from public,anon,authenticated;
grant execute on function public.commit_website_builder_draft(uuid,uuid,uuid,timestamptz,text,text,jsonb,text,text,boolean) to service_role;
notify pgrst,'reload schema';
