-- Retain each accepted grading version independently. Revisions and rollback
-- must not erase a learner's earlier practice. No rows or access grants change.
do $$
declare
  v_constraint text;
  v_columns text[];
begin
  select constraint_row.conname,
         array_agg(attribute.attname::text order by key.position)
    into v_constraint, v_columns
    from pg_catalog.pg_constraint constraint_row
    cross join lateral unnest(constraint_row.conkey) with ordinality as key(attribute_number, position)
    join pg_catalog.pg_attribute attribute
      on attribute.attrelid = constraint_row.conrelid
     and attribute.attnum = key.attribute_number
    where constraint_row.conrelid = 'public.manufacturing_simulation_progress'::regclass
      and constraint_row.contype = 'p'
    group by constraint_row.conname;

  if v_columns = array['learner_id', 'lesson_id', 'interaction_id'] then
    execute format('alter table public.manufacturing_simulation_progress drop constraint %I', v_constraint);
    alter table public.manufacturing_simulation_progress
      add constraint manufacturing_simulation_progress_pkey
      primary key (learner_id, lesson_id, interaction_id, spec_id);
  elsif v_columns is distinct from array['learner_id', 'lesson_id', 'interaction_id', 'spec_id'] then
    raise exception 'MANUFACTURING_PROGRESS_IDENTITY_UNEXPECTED' using errcode = '23514';
  end if;
end;
$$;

comment on table public.manufacturing_simulation_progress is
  'Service-only virtual practice retained independently per learner, lesson, interaction and immutable grading version. No equipment authorization or practical hours.';
