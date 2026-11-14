create function rpc_private.enforce_hvac_practice_server_scoring()
returns trigger language plpgsql security invoker set search_path = pg_catalog, public
as $$
declare protected_ids uuid[] := array['e47bab32-5d13-5d53-b525-135c6ecd4d48','6e9ae471-b744-5d73-ac6e-7664da9b9496','9fe4ceb8-f11d-5737-b3a0-a1be0b403abd','fbe3299c-027f-596f-938b-c934f39ea212']::uuid[];
begin
  if current_user in ('authenticated','anon') then
    if new.lesson_id = any(protected_ids) then
      raise exception 'HVAC_PRACTICE_SERVER_SCORING_REQUIRED' using errcode='42501';
    end if;
    if tg_op='UPDATE' then
      if old.lesson_id = any(protected_ids) then
        raise exception 'HVAC_PRACTICE_SERVER_SCORING_REQUIRED' using errcode='42501';
      end if;
    end if;
  end if;
  return new;
end $$;
create trigger guard_hvac_practice_server_scoring before insert or update on public.checkpoint_scores
for each row execute function rpc_private.enforce_hvac_practice_server_scoring();
comment on function rpc_private.enforce_hvac_practice_server_scoring() is 'The four required HVAC practice tests must be graded by the authenticated server handler. Learners cannot insert or edit their own claimed scores through the Data API. Other assessment behavior is unchanged.';
