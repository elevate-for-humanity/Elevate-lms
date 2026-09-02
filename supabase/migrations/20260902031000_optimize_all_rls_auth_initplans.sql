-- Preserve every RLS policy's command, role, and authorization semantics while
-- forcing stable auth helpers into PostgreSQL initplans. This evaluates each
-- identity function once per statement instead of once per candidate row.

do $optimize_rls$
declare
  policy_row record;
  optimized_using text;
  optimized_check text;
  alter_statement text;
begin
  for policy_row in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (
        coalesce(qual, '') ~* '(auth\.(uid|role|jwt)\(\)|current_setting\()'
        or coalesce(with_check, '') ~* '(auth\.(uid|role|jwt)\(\)|current_setting\()'
      )
    order by tablename, policyname
  loop
    optimized_using := policy_row.qual;
    optimized_check := policy_row.with_check;

    if optimized_using is not null then
      optimized_using := regexp_replace(optimized_using, '(?<!SELECT )auth\.uid\(\)', '(select auth.uid())', 'gi');
      optimized_using := regexp_replace(optimized_using, '(?<!SELECT )auth\.role\(\)', '(select auth.role())', 'gi');
      optimized_using := regexp_replace(optimized_using, '(?<!SELECT )auth\.jwt\(\)', '(select auth.jwt())', 'gi');
      optimized_using := regexp_replace(optimized_using, '(?<!SELECT )current_setting\(([^)]*)\)', '(select current_setting(\1))', 'gi');
    end if;

    if optimized_check is not null then
      optimized_check := regexp_replace(optimized_check, '(?<!SELECT )auth\.uid\(\)', '(select auth.uid())', 'gi');
      optimized_check := regexp_replace(optimized_check, '(?<!SELECT )auth\.role\(\)', '(select auth.role())', 'gi');
      optimized_check := regexp_replace(optimized_check, '(?<!SELECT )auth\.jwt\(\)', '(select auth.jwt())', 'gi');
      optimized_check := regexp_replace(optimized_check, '(?<!SELECT )current_setting\(([^)]*)\)', '(select current_setting(\1))', 'gi');
    end if;

    if optimized_using is not distinct from policy_row.qual
       and optimized_check is not distinct from policy_row.with_check then
      continue;
    end if;

    alter_statement := format(
      'alter policy %I on %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );

    if policy_row.qual is not null then
      alter_statement := alter_statement || format(' using (%s)', optimized_using);
    end if;

    if policy_row.with_check is not null then
      alter_statement := alter_statement || format(' with check (%s)', optimized_check);
    end if;

    execute alter_statement;
  end loop;
end
$optimize_rls$;
