-- Restore the id-based Admin/job lifecycle contracts without replacing the
-- existing tenant-wide billing RPCs or extending any payment entitlement.
create or replace function public.set_license_lifecycle(
  p_license_id uuid, p_action text, p_admin_user_id uuid default null, p_reason text default null
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare target public.licenses%rowtype;
begin
  if coalesce(auth.role(), '') <> 'service_role' then raise exception 'SERVICE_ROLE_REQUIRED'; end if;
  if p_action not in ('suspend','reactivate','revoke') then raise exception 'INVALID_LICENSE_ACTION'; end if;
  if p_admin_user_id is not null and not exists (
    select 1 from public.profiles where id=p_admin_user_id and role::text in ('admin','super_admin')
  ) then raise exception 'ADMIN_REQUIRED'; end if;
  if p_action in ('suspend','revoke') and nullif(btrim(p_reason),'') is null then raise exception 'REASON_REQUIRED'; end if;
  select * into target from public.licenses where id=p_license_id for update;
  if not found then return jsonb_build_object('success',false,'message','License not found'); end if;
  if p_action='reactivate' then
    if target.canceled_at is not null or target.status in ('revoked','canceled','expired') then
      return jsonb_build_object('success',false,'message','A revoked, canceled or expired license cannot be reactivated');
    end if;
    if coalesce(target.current_period_end,target.expires_at,target.paid_through,target.ends_at) <= now() then
      return jsonb_build_object('success',false,'message','License entitlement has expired');
    end if;
    update public.licenses set status='active', suspended_at=null, suspended_reason=null, updated_at=now() where id=p_license_id;
  elsif p_action='suspend' then
    if target.status in ('revoked','canceled','expired') then
      return jsonb_build_object('success',false,'message','License is no longer active');
    end if;
    update public.licenses set status='suspended', suspended_at=now(), suspended_reason=p_reason, updated_at=now() where id=p_license_id;
  else
    update public.licenses set status='revoked', canceled_at=coalesce(canceled_at,now()), updated_at=now() where id=p_license_id;
  end if;
  insert into public.admin_audit_events(action,actor_user_id,target_type,target_id,metadata)
    values('license_'||p_action,p_admin_user_id,'licenses',p_license_id::text,jsonb_build_object('tenant_id',target.tenant_id,'reason',p_reason));
  return jsonb_build_object('success',true,'license_id',p_license_id,'action',p_action);
end $$;

create or replace function public.reactivate_license(p_license_id uuid,p_admin_user_id uuid default null)
returns jsonb language sql security invoker set search_path='' as $$
  select public.set_license_lifecycle(p_license_id,'reactivate',p_admin_user_id,null);
$$;
create or replace function public.revoke_license(p_license_id uuid,p_reason text,p_admin_user_id uuid default null)
returns jsonb language sql security invoker set search_path='' as $$
  select public.set_license_lifecycle(p_license_id,'revoke',p_admin_user_id,p_reason);
$$;

create or replace function public.suspend_provider(p_tenant_id uuid,p_admin_user_id uuid,p_reason text default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
begin
  if coalesce(auth.role(),'') <> 'service_role' then raise exception 'SERVICE_ROLE_REQUIRED'; end if;
  if not exists(select 1 from public.profiles where id=p_admin_user_id and role::text in ('admin','super_admin')) then raise exception 'ADMIN_REQUIRED'; end if;
  update public.tenants set status='suspended', active=false, updated_at=now() where id=p_tenant_id;
  if not found then return jsonb_build_object('success',false,'message','Tenant not found'); end if;
  update public.programs set published=false,is_active=false where tenant_id=p_tenant_id and (published or is_active);
  insert into public.admin_audit_events(actor_user_id,action,target_type,target_id,metadata)
    values(p_admin_user_id,'provider_suspended','tenant',p_tenant_id::text,jsonb_build_object('reason',p_reason));
  return jsonb_build_object('success',true);
end $$;

revoke all on function public.set_license_lifecycle(uuid,text,uuid,text),public.reactivate_license(uuid,uuid),public.revoke_license(uuid,text,uuid),public.suspend_provider(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.set_license_lifecycle(uuid,text,uuid,text),public.reactivate_license(uuid,uuid),public.revoke_license(uuid,text,uuid),public.suspend_provider(uuid,uuid,text) to service_role;
