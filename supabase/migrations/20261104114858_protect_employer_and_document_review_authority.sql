-- Only authorized review can change employer approval or review employer-owned documents.
create function security_private.protect_employer_onboarding_authority()
returns trigger language plpgsql set search_path = '' as $$
declare field_name text;
begin
  if current_user in ('postgres','supabase_admin','service_role') then return new; end if;
  if exists (select 1 from public.profiles p where p.id=(select auth.uid()) and p.role in ('admin','super_admin','staff')) then return new; end if;
  if tg_table_name = 'employers' then
    if tg_op = 'INSERT' then
      if new.approved is true or new.verified_at is not null or coalesce(new.status,'pending') <> 'pending' then
        raise exception 'Employer approval requires authorized review' using errcode='42501';
      end if;
    else
      foreach field_name in array array['approved','status','verified_at','owner_user_id'] loop
        if (to_jsonb(new)->field_name) is distinct from (to_jsonb(old)->field_name) then
          raise exception 'Employer authority requires authorized review' using errcode='42501';
        end if;
      end loop;
    end if;
  elsif tg_table_name = 'documents' and exists (select 1 from public.employers e where e.owner_user_id=(select auth.uid())) then
    if tg_op = 'INSERT' then
      if coalesce(new.status,'pending') not in ('pending','pending_review','submitted','uploaded')
        or new.verified is true or new.verified_at is not null or new.verified_by is not null
        or new.reviewed_at is not null or new.reviewed_by is not null
        or coalesce(new.verification_status,'pending') not in ('pending','pending_review','unverified') then
        raise exception 'Employer document approval requires authorized review' using errcode='42501';
      end if;
    else
      foreach field_name in array array['status','verification_status','verified','verified_at','verified_by','reviewed_at','reviewed_by'] loop
        if (to_jsonb(new)->field_name) is distinct from (to_jsonb(old)->field_name) then
          raise exception 'Employer document review fields require authorized review' using errcode='42501';
        end if;
      end loop;
    end if;
  end if;
  return new;
end;
$$;
create trigger protect_employer_onboarding_authority before insert or update on public.employers for each row execute function security_private.protect_employer_onboarding_authority();
create trigger protect_employer_document_authority before insert or update on public.documents for each row execute function security_private.protect_employer_onboarding_authority();
