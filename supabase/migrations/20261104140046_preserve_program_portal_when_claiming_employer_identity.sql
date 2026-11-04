-- Employer identity is represented by profiles.role and employers.owner_user_id.
-- Preserve the existing program-specific portal_type instead of writing an
-- unsupported role name into profiles_portal_type_check.
create or replace function public.claim_invited_employer_account()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  update public.employers
  set owner_user_id = new.id,
      updated_at = now()
  where owner_user_id is null
    and lower(coalesce(contact_email, email, '')) = lower(new.email)
    and coalesce(status, 'pending') in ('pending','submitted','under_review');

  if found then
    new.role := 'employer';
    new.company_name := coalesce(
      new.company_name,
      (select coalesce(e.company_name, e.business_name) from public.employers e where e.owner_user_id = new.id limit 1)
    );
  end if;
  return new;
end;
$function$;