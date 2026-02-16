-- Migration: Create schema guard helper functions
-- Purpose: Enable runtime schema verification
-- Date: 2024-12-19

-- Function to check if a table exists
create or replace function public.check_table_exists(
  schema_name text,
  table_name text
)
returns boolean
language plpgsql
security definer
as $$
begin
  return exists(
    select 1
    from information_schema.tables
    where table_schema = schema_name
      and table_name = table_name
  );
end;
$$;

-- Function to check if columns exist
create or replace function public.check_columns_exist(
  schema_name text,
  table_name text,
  column_names text[]
)
returns table(column_name text, exists boolean)
language plpgsql
security definer
as $$
begin
  return query
  select
    col,
    exists(
      select 1
      from information_schema.columns
      where table_schema = schema_name
        and table_name = table_name
        and column_name = col
    ) as exists
  from unnest(column_names) as col;
end;
$$;

-- Function to get all columns for a table
create or replace function public.get_table_columns(
  schema_name text,
  table_name text
)
returns table(
  column_name text,
  data_type text,
  is_nullable text,
  column_default text
)
language plpgsql
security definer
as $$
begin
  return query
  select
    c.column_name::text,
    c.data_type::text,
    c.is_nullable::text,
    c.column_default::text
  from information_schema.columns c
  where c.table_schema = schema_name
    and c.table_name = table_name
  order by c.ordinal_position;
end;
$$;

-- Grant execute permissions
grant execute on function public.check_table_exists(text, text) to authenticated;
grant execute on function public.check_columns_exist(text, text, text[]) to authenticated;
grant execute on function public.get_table_columns(text, text) to authenticated;

-- Add comments
comment on function public.check_table_exists is 
  'Verify if a table exists in the specified schema';

comment on function public.check_columns_exist is 
  'Check if specific columns exist in a table';

comment on function public.get_table_columns is 
  'Get all columns and their types for a table';
