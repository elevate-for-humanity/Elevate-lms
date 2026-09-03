-- Simple Schema Inspection - Single Query Output
-- Copy this and paste into Supabase SQL Editor

-- Get all tables with their columns
select 
  t.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
from information_schema.tables t
join information_schema.columns c 
  on t.table_name = c.table_name 
  and t.table_schema = c.table_schema
where t.table_schema = 'public'
  and t.table_type = 'BASE TABLE'
  and t.table_name in (
    'profiles',
    'applications', 
    'enrollments',
    'programs',
    'partner_courses',
    'certificates',
    'payments',
    'funding',
    'outcomes'
  )
order by t.table_name, c.ordinal_position;
