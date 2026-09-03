create or replace function public.increment_agentic_run_credits(
  p_run_id uuid,
  p_credits integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer;
begin
  if p_credits < 0 then
    raise exception 'credits must be non-negative';
  end if;

  update public.agentic_build_runs
     set credits_used = credits_used + p_credits
   where id = p_run_id
   returning credits_used into v_total;

  if v_total is null then
    raise exception 'agentic run not found';
  end if;

  return v_total;
end;
$$;

revoke all on function public.increment_agentic_run_credits(uuid, integer) from public;
revoke all on function public.increment_agentic_run_credits(uuid, integer) from anon;
revoke all on function public.increment_agentic_run_credits(uuid, integer) from authenticated;
