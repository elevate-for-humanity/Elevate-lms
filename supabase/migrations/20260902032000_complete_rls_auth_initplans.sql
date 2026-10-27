-- Complete initplan optimization for archived FSSA policies and auth.email().
-- Policy identity, roles, commands, modes, and predicates remain unchanged.

do $complete_rls_initplans$
declare
  policy_row record;
  optimized_using text;
  optimized_check text;
  alter_statement text;
begin
  for policy_row in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname in ('public', 'fssa_archive')
      and (
        coalesce(qual, '') ~* 'auth\.(uid|email)\(\)'
        or coalesce(with_check, '') ~* 'auth\.(uid|email)\(\)'
      )
    order by schemaname, tablename, policyname
  loop
    optimized_using := policy_row.qual;
    optimized_check := policy_row.with_check;

    if optimized_using is not null then
      optimized_using := regexp_replace(optimized_using, '(?<!SELECT )auth\.uid\(\)', '(select auth.uid())', 'gi');
      optimized_using := regexp_replace(optimized_using, '(?<!SELECT )auth\.email\(\)', '(select auth.email())', 'gi');
    end if;

    if optimized_check is not null then
      optimized_check := regexp_replace(optimized_check, '(?<!SELECT )auth\.uid\(\)', '(select auth.uid())', 'gi');
      optimized_check := regexp_replace(optimized_check, '(?<!SELECT )auth\.email\(\)', '(select auth.email())', 'gi');
    end if;

    if optimized_using is not distinct from policy_row.qual
       and optimized_check is not distinct from policy_row.with_check then
      continue;
    end if;

    alter_statement := format('alter policy %I on %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);
    if policy_row.qual is not null then
      alter_statement := alter_statement || format(' using (%s)', optimized_using);
    end if;
    if policy_row.with_check is not null then
      alter_statement := alter_statement || format(' with check (%s)', optimized_check);
    end if;
    execute alter_statement;
  end loop;
end
$complete_rls_initplans$;
