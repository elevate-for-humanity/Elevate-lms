-- Make the service-only boundary explicit for internal authorities and remove
-- an unnecessary SECURITY DEFINER execution context from the learner document
-- requirements RPC. Existing RLS policies on the source tables already permit
-- learners to read their own rows and privileged staff to read authorized rows.

alter function public.get_user_document_requirement_rules(uuid, uuid)
  security invoker;

revoke all on function public.get_user_document_requirement_rules(uuid, uuid) from public, anon;
grant execute on function public.get_user_document_requirement_rules(uuid, uuid) to authenticated, service_role;

do $policy$
declare
  table_name text;
begin
  foreach table_name in array array[
    '_migrations',
    'apprenticeship_program_aliases',
    'apprenticeship_rti_requirements',
    'apprenticeship_standard_competencies',
    'apprenticeship_standard_versions',
    'apprenticeship_wage_milestones',
    'automation_followups',
    'implementation_orders',
    'plans',
    'platform_usage_events'
  ]
  loop
    execute format('drop policy if exists service_only_explicit_deny on public.%I', table_name);
    execute format(
      'create policy service_only_explicit_deny on public.%I as restrictive for all to anon, authenticated using (false) with check (false)',
      table_name
    );
  end loop;
end
$policy$;

comment on function public.get_user_document_requirement_rules(uuid, uuid) is
  'Returns document requirements through caller RLS; authenticated users may read their own rows and authorized staff may read permitted learners.';
