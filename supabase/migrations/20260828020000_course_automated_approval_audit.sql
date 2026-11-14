create table if not exists public.course_automated_approvals (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  decision text not null check (decision in ('approved', 'rejected')),
  gate_version text not null,
  evidence jsonb not null,
  blocking_issues jsonb not null default '[]'::jsonb,
  initiated_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists course_automated_approvals_course_decided_idx
  on public.course_automated_approvals(course_id, decided_at desc);

alter table public.course_automated_approvals enable row level security;

drop policy if exists course_automated_approvals_staff_read on public.course_automated_approvals;
create policy course_automated_approvals_staff_read
on public.course_automated_approvals for select to authenticated
using ((select public.is_staff()));

create or replace function public.record_course_automated_approval(
  p_course_id uuid,
  p_gate_version text,
  p_evidence jsonb,
  p_initiated_by uuid default null
) returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_id uuid;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Service role required' using errcode = '42501';
  end if;
  if p_gate_version is null or btrim(p_gate_version) = '' then
    raise exception 'gate version is required' using errcode = '22023';
  end if;
  if p_evidence is null or jsonb_typeof(p_evidence) <> 'object' then
    raise exception 'approval evidence object is required' using errcode = '22023';
  end if;

  insert into public.course_automated_approvals(
    course_id, decision, gate_version, evidence, initiated_by
  ) values (
    p_course_id, 'approved', p_gate_version, p_evidence, p_initiated_by
  ) returning id into v_id;

  update public.courses
  set review_status = 'approved', reviewed_by = null, reviewed_at = now(), updated_at = now()
  where id = p_course_id;
  if not found then raise exception 'course not found' using errcode = 'P0002'; end if;
  return v_id;
end;
$$;

revoke all on function public.record_course_automated_approval(uuid,text,jsonb,uuid) from public, anon, authenticated;
grant execute on function public.record_course_automated_approval(uuid,text,jsonb,uuid) to service_role;
