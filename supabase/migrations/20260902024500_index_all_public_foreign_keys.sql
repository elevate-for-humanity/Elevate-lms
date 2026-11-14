-- Every public foreign key needs a covering index so deletes, joins, tenant
-- scoping, and cascading relationship checks do not degrade as data grows.
-- Names are deterministic and bounded to PostgreSQL's identifier limit.

do $index_foreign_keys$
declare
  foreign_key record;
  index_name text;
begin
  for foreign_key in
    select
      relation.oid as table_oid,
      relation.relname as table_name,
      constraint_row.conname as constraint_name,
      constraint_row.conkey,
      string_agg(quote_ident(attribute.attname), ', ' order by key_column.ordinality) as column_list
    from pg_constraint constraint_row
    join pg_class relation on relation.oid = constraint_row.conrelid
    join pg_namespace namespace on namespace.oid = relation.relnamespace
    cross join lateral unnest(constraint_row.conkey)
      with ordinality as key_column(attribute_number, ordinality)
    join pg_attribute attribute
      on attribute.attrelid = relation.oid
     and attribute.attnum = key_column.attribute_number
    where constraint_row.contype = 'f'
      and namespace.nspname = 'public'
      and not exists (
        select 1
        from pg_index existing_index
        where existing_index.indrelid = relation.oid
          and existing_index.indisvalid
          and (existing_index.indkey::smallint[])[0:cardinality(constraint_row.conkey) - 1]
            = constraint_row.conkey
      )
    group by relation.oid, relation.relname, constraint_row.oid,
      constraint_row.conname, constraint_row.conkey
    order by pg_total_relation_size(relation.oid), relation.relname, constraint_row.conname
  loop
    index_name := 'idx_fk_' || left(foreign_key.table_name, 35) || '_' ||
      left(md5(foreign_key.constraint_name), 12);

    execute format(
      'create index if not exists %I on public.%I (%s)',
      index_name,
      foreign_key.table_name,
      foreign_key.column_list
    );
  end loop;
end
$index_foreign_keys$;
