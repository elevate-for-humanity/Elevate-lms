-- Prevent a signed-in user from probing another user's enrollment eligibility.
-- The production enrollment page calls this RPC with the current auth user ID;
-- service-role callers retain cross-user evaluation for operational workflows.

begin;

create or replace function public.can_user_enroll(
  p_user_id uuid,
  p_program_id uuid,
  p_license_key text default null::text
)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'auth'
as $function$
declare
  v_license record;
  v_existing_enrollment record;
begin
  if coalesce(auth.role(), '') <> 'service_role'
     and (auth.uid() is null or auth.uid() is distinct from p_user_id) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select * into v_existing_enrollment
  from public.enrollments
  where student_id = p_user_id
    and program_id = p_program_id
    and status in ('active', 'pending');

  if found then
    return jsonb_build_object(
      'can_enroll', false,
      'reason', 'Already enrolled in this program'
    );
  end if;

  if p_license_key is not null then
    select * into v_license
    from public.program_licenses
    where license_key = p_license_key;

    if not found then
      return jsonb_build_object('can_enroll', false, 'reason', 'Invalid license key');
    end if;

    if v_license.status <> 'active' then
      return jsonb_build_object('can_enroll', false, 'reason', 'License is not active');
    end if;

    if v_license.expires_at is not null and v_license.expires_at < now() then
      return jsonb_build_object('can_enroll', false, 'reason', 'License has expired');
    end if;

    if v_license.max_enrollments is not null
       and v_license.current_enrollments >= v_license.max_enrollments then
      return jsonb_build_object('can_enroll', false, 'reason', 'License enrollment limit reached');
    end if;
  end if;

  return jsonb_build_object('can_enroll', true, 'reason', null);
end;
$function$;

revoke all on function public.can_user_enroll(uuid, uuid, text) from public, anon;
grant execute on function public.can_user_enroll(uuid, uuid, text) to authenticated, service_role;

commit;
