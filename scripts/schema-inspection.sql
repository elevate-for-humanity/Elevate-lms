-- ═══════════════════════════════════════════════════════════════════════════
-- COMPREHENSIVE SCHEMA INSPECTION FOR VA-GRADE SYSTEM UPGRADE
-- Run this in Supabase SQL Editor to get complete schema output
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 1: ALL TABLES IN PUBLIC SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════

select 
  '═══ ALL TABLES ═══' as section,
  table_name,
  (select count(*) from information_schema.columns c where c.table_schema='public' and c.table_name=t.table_name) as column_count
from information_schema.tables t
where t.table_schema = 'public'
  and t.table_type = 'BASE TABLE'
order by t.table_name;

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 2: CORE PERSON/USER TABLES
-- ═══════════════════════════════════════════════════════════════════════════

-- Profiles table
select '═══ PROFILES TABLE ═══' as section;
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema='public' and table_name='profiles'
order by ordinal_position;

-- Applications table
select '═══ APPLICATIONS TABLE ═══' as section;
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema='public' and table_name='applications'
order by ordinal_position;

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 3: ENROLLMENT TABLES
-- ═══════════════════════════════════════════════════════════════════════════

-- Enrollments table
select '═══ ENROLLMENTS TABLE ═══' as section;
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema='public' and table_name='enrollments'
order by ordinal_position;

-- Check for enrollment history/audit table
select '═══ ENROLLMENT HISTORY/AUDIT TABLES ═══' as section;
select table_name
from information_schema.tables
where table_schema='public'
  and table_type='BASE TABLE'
  and (
    table_name like '%enrollment%history%'
    or table_name like '%enrollment%audit%'
    or table_name like '%enrollment%log%'
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 4: PROGRAM TABLES
-- ═══════════════════════════════════════════════════════════════════════════

-- Programs table
select '═══ PROGRAMS TABLE ═══' as section;
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema='public' and table_name='programs'
order by ordinal_position;

-- Partner courses table
select '═══ PARTNER_COURSES TABLE ═══' as section;
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema='public' and table_name='partner_courses'
order by ordinal_position;

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 5: FUNDING/PAYMENT TABLES
-- ═══════════════════════════════════════════════════════════════════════════

-- Check for funding tables
select '═══ FUNDING TABLES ═══' as section;
select table_name
from information_schema.tables
where table_schema='public'
  and table_type='BASE TABLE'
  and (
    table_name like '%funding%'
    or table_name like '%payment%'
    or table_name like '%invoice%'
    or table_name like '%transaction%'
  )
order by table_name;

-- If funding table exists, show columns
select '═══ FUNDING TABLE COLUMNS (if exists) ═══' as section;
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema='public' 
  and table_name in (
    select table_name 
    from information_schema.tables 
    where table_schema='public' 
      and table_name like '%funding%'
    limit 1
  )
order by ordinal_position;

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 6: PARTNER/ASSIGNMENT TABLES
-- ═══════════════════════════════════════════════════════════════════════════

-- Check for partner assignment tables
select '═══ PARTNER ASSIGNMENT TABLES ═══' as section;
select table_name
from information_schema.tables
where table_schema='public'
  and table_type='BASE TABLE'
  and (
    table_name like '%partner%assign%'
    or table_name like '%partner%enroll%'
    or table_name like '%partner%student%'
  )
order by table_name;

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 7: OUTCOME/COMPLETION TABLES
-- ═══════════════════════════════════════════════════════════════════════════

-- Check for outcome tables
select '═══ OUTCOME TABLES ═══' as section;
select table_name
from information_schema.tables
where table_schema='public'
  and table_type='BASE TABLE'
  and (
    table_name like '%outcome%'
    or table_name like '%completion%'
    or table_name like '%certificate%'
    or table_name like '%placement%'
  )
order by table_name;

-- Certificates table (if exists)
select '═══ CERTIFICATES TABLE ═══' as section;
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema='public' and table_name='certificates'
order by ordinal_position;

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 8: ROLE/PERMISSION TABLES
-- ═══════════════════════════════════════════════════════════════════════════

-- Check for role tables
select '═══ ROLE/PERMISSION TABLES ═══' as section;
select table_name
from information_schema.tables
where table_schema='public'
  and table_type='BASE TABLE'
  and (
    table_name like '%role%'
    or table_name like '%permission%'
    or table_name like '%advisor%'
    or table_name like '%case_manager%'
  )
order by table_name;

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 9: EXISTING VIEWS
-- ═══════════════════════════════════════════════════════════════════════════

select '═══ EXISTING VIEWS ═══' as section;
select table_name as view_name
from information_schema.tables
where table_schema='public'
  and table_type='VIEW'
order by table_name;

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 10: ENROLLMENT STATUS VALUES
-- ═══════════════════════════════════════════════════════════════════════════

-- Get distinct enrollment statuses
select '═══ ENROLLMENT STATUS VALUES ═══' as section;
select distinct status, count(*) as count
from public.enrollments
group by status
order by count desc;

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 11: FOREIGN KEY RELATIONSHIPS
-- ═══════════════════════════════════════════════════════════════════════════

select '═══ FOREIGN KEY RELATIONSHIPS ═══' as section;
select
  tc.table_name as from_table,
  kcu.column_name as from_column,
  ccu.table_name as to_table,
  ccu.column_name as to_column
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
  and tc.table_schema = kcu.table_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
  and ccu.table_schema = tc.table_schema
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_schema = 'public'
  and tc.table_name in ('enrollments', 'applications', 'profiles', 'programs', 'partner_courses')
order by tc.table_name, kcu.column_name;

-- ═══════════════════════════════════════════════════════════════════════════
-- SECTION 12: SAMPLE DATA COUNTS
-- ═══════════════════════════════════════════════════════════════════════════

select '═══ TABLE ROW COUNTS ═══' as section;
select 
  'profiles' as table_name, 
  count(*) as row_count 
from public.profiles
union all
select 'applications', count(*) from public.applications
union all
select 'enrollments', count(*) from public.enrollments
union all
select 'programs', count(*) from public.programs
union all
select 'partner_courses', count(*) from public.partner_courses;

-- ═══════════════════════════════════════════════════════════════════════════
-- END OF SCHEMA INSPECTION
-- ═══════════════════════════════════════════════════════════════════════════

select '═══ INSPECTION COMPLETE ═══' as section;
