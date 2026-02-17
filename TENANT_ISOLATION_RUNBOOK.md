# Tenant Isolation Migration Runbook

**19 migrations. 7 phases. Run in Supabase SQL Editor.**

Each phase must complete and pass verification before proceeding to the next.
All migrations use `DROP POLICY IF EXISTS` / `IF NOT EXISTS` — safe to re-run.

---

## Pre-Flight Checks

Run these FIRST. If any fail, stop and investigate.

```sql
-- 1. Confirm profiles table exists with tenant_id column
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'tenant_id';
-- Expected: 1 row (uuid, YES or NO)

-- 2. Confirm is_super_admin() exists (required by protect_tenant_id)
SELECT proname FROM pg_proc WHERE proname = 'is_super_admin';
-- Expected: 1 row. If 0 rows, create it first (see Appendix A).

-- 3. Confirm is_admin() exists
SELECT proname FROM pg_proc WHERE proname = 'is_admin';
-- Expected: 1 row. If 0 rows, create it first (see Appendix A).

-- 4. Count current state
SELECT 'profiles' AS tbl, count(*) AS total,
       count(*) FILTER (WHERE tenant_id IS NULL) AS null_tenant
FROM profiles
UNION ALL
SELECT 'training_enrollments', count(*),
       count(*) FILTER (WHERE tenant_id IS NULL)
FROM training_enrollments;
-- Record these numbers. You'll compare after backfill.

-- 5. Confirm primary tenant exists
SELECT id, name FROM organizations
WHERE id = '6ba71334-58f4-4104-9b2a-5114f2a7614c';
-- Expected: "Elevate for Humanity" or similar
```

---

## Phase 1: Foundation Functions + Immutability Trigger

**File:** `20260130000001_protect_tenant_id.sql`

Creates `get_current_tenant_id()`, `prevent_tenant_id_change()` trigger on profiles.

```
Open: supabase/migrations/20260130000001_protect_tenant_id.sql
Run:  Entire file in SQL Editor
```

### Verify Phase 1

```sql
-- Functions exist
SELECT proname, prosecdef FROM pg_proc
WHERE proname IN ('get_current_tenant_id', 'prevent_tenant_id_change');
-- Expected: 2 rows, both prosecdef = true (SECURITY DEFINER)

-- Trigger exists on profiles
SELECT tgname FROM pg_trigger
WHERE tgrelid = 'profiles'::regclass AND tgname = 'protect_tenant_id';
-- Expected: 1 row

-- RLS enabled on profiles
SELECT relrowsecurity FROM pg_class WHERE relname = 'profiles';
-- Expected: true
```

---

## Phase 2: Add tenant_id Columns + Backfill

**Files (run in this order):**
1. `20260214900000_add_tenant_id_to_core_tables.sql`
2. `20260214000001_backfill_tenant_id.sql`

Phase 2a adds `tenant_id` to certificates, lesson_progress, apprentice_placements, shops, shop_staff. Creates indexes and auto-populate triggers.

Phase 2b backfills all NULL tenant_ids to the primary tenant.

```
Open: supabase/migrations/20260214900000_add_tenant_id_to_core_tables.sql
Run:  Entire file

Open: supabase/migrations/20260214000001_backfill_tenant_id.sql
Run:  Entire file
```

### Verify Phase 2

```sql
-- All 7 core tables have tenant_id column
SELECT table_name, column_name
FROM information_schema.columns
WHERE column_name = 'tenant_id'
  AND table_schema = 'public'
  AND table_name IN (
    'profiles', 'training_enrollments', 'certificates',
    'lesson_progress', 'apprentice_placements', 'shops', 'shop_staff'
  )
ORDER BY table_name;
-- Expected: 7 rows

-- Zero NULLs across all 7 tables
SELECT 'profiles' AS tbl, count(*) FILTER (WHERE tenant_id IS NULL) AS nulls FROM profiles
UNION ALL SELECT 'training_enrollments', count(*) FILTER (WHERE tenant_id IS NULL) FROM training_enrollments
UNION ALL SELECT 'certificates', count(*) FILTER (WHERE tenant_id IS NULL) FROM certificates
UNION ALL SELECT 'lesson_progress', count(*) FILTER (WHERE tenant_id IS NULL) FROM lesson_progress
UNION ALL SELECT 'apprentice_placements', count(*) FILTER (WHERE tenant_id IS NULL) FROM apprentice_placements
UNION ALL SELECT 'shops', count(*) FILTER (WHERE tenant_id IS NULL) FROM shops
UNION ALL SELECT 'shop_staff', count(*) FILTER (WHERE tenant_id IS NULL) FROM shop_staff;
-- Expected: ALL rows show nulls = 0
-- ⚠️ IF ANY > 0: Do NOT proceed. Investigate and backfill manually.

-- Indexes created
SELECT indexname FROM pg_indexes
WHERE indexname LIKE 'idx_%tenant%';
-- Expected: 6-7 indexes

-- Auto-populate triggers exist
SELECT tgname, tgrelid::regclass
FROM pg_trigger
WHERE tgname = 'set_tenant_id_on_insert';
-- Expected: 6 rows (one per core table)
```

---

## Phase 3: Enforce NOT NULL Constraints

**File:** `20260214000002_enforce_tenant_not_null.sql`

Adds CHECK constraints (NOT VALID first, then VALIDATE) to prevent future NULLs.

```
Open: supabase/migrations/20260214000002_enforce_tenant_not_null.sql
Run:  Entire file
```

### Verify Phase 3

```sql
-- Constraints exist and are validated
SELECT conname, convalidated
FROM pg_constraint
WHERE conname LIKE '%tenant_id_not_null%';
-- Expected: 7 rows, all convalidated = true
```

---

## Phase 4: RLS Lockdown + Policy Hardening

**Files (run in this order):**
1. `20260214000006_rls_tenancy_lockdown.sql` — locks USING(true) policies, enables RLS on 12 tables
2. `20260214000004_partner_visibility_policies.sql` — partner access chain
3. `20260214000005_remove_null_tenant_fallbacks.sql` — removes OR tenant_id IS NULL
4. `20260214000008_tighten_certificates_rls.sql` — certificates INSERT/UPDATE admin-only

```
Open: supabase/migrations/20260214000006_rls_tenancy_lockdown.sql
Run:  Entire file

Open: supabase/migrations/20260214000004_partner_visibility_policies.sql
Run:  Entire file

Open: supabase/migrations/20260214000005_remove_null_tenant_fallbacks.sql
Run:  Entire file

Open: supabase/migrations/20260214000008_tighten_certificates_rls.sql
Run:  Entire file
```

### Verify Phase 4

```sql
-- No more USING(true) on sensitive tables
SELECT schemaname, tablename, policyname, qual
FROM pg_policies
WHERE qual = 'true'
  AND tablename IN (
    'sfc_tax_returns', 'sfc_tax_documents', 'licenses',
    'audit_logs', 'certificates'
  );
-- Expected: 0 rows (or only certificates_public_verify which is intentional)

-- RLS enabled on newly protected tables
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname IN ('programs', 'users', 'career_courses', 'nds_training_courses',
                  'career_course_modules', 'career_course_purchases',
                  'nds_course_purchases', 'copilot_deployments',
                  'marketing_pages', 'marketing_sections',
                  'social_media_settings', 'notification_outbox')
ORDER BY relname;
-- Expected: all relrowsecurity = true

-- licenses policy uses tenant scope
SELECT policyname, qual FROM pg_policies
WHERE tablename = 'licenses' AND policyname = 'licenses_own_tenant';
-- Expected: 1 row with get_current_tenant_id() in qual
```

---

## Phase 5: Break Recursion + Admin Policy Sweep

**Files (run in this order):**
1. `20260215000001_break_recursion_use_definer_functions.sql` — replaces 39 inline profile lookups
2. `20260215000003_rls_test_harness.sql` — creates rls_test_report() function
3. `20260216000001_batch3a_admin_only_policies.sql` — documents the 199-policy admin sweep

```
Open: supabase/migrations/20260215000001_break_recursion_use_definer_functions.sql
Run:  Entire file

Open: supabase/migrations/20260215000003_rls_test_harness.sql
Run:  Entire file

Open: supabase/migrations/20260216000001_batch3a_admin_only_policies.sql
Run:  This is a documentation file. The actual policies were applied via exec_sql.
      Skip if the batch was already applied. Check with the query below.
```

### Verify Phase 5

```sql
-- is_tax_preparer() function created
SELECT proname FROM pg_proc WHERE proname = 'is_tax_preparer';
-- Expected: 1 row

-- No more inline profiles lookups in core table policies
SELECT policyname, tablename
FROM pg_policies
WHERE qual LIKE '%FROM profiles%WHERE%auth.uid()%'
  AND tablename IN ('training_enrollments', 'certificates', 'lesson_progress',
                     'apprentice_placements', 'shops', 'shop_staff');
-- Expected: 0 rows (all replaced with is_admin()/get_current_tenant_id())

-- Run the test harness
SELECT * FROM public.rls_test_report();
-- Expected: All rows show passed = true
```

---

## Phase 6: Tenant Scoping + Immutability Extension

**Files (run in this order):**
1. `20260216000003_extend_tenant_id_immutability.sql` — trigger on 6 more tables
2. `20260216000004_fix_certificates_policies.sql` — tenant-scoped cert policies
3. `20260216000007_fix_lesson_progress_tenant_optional.sql` — handles NULL tenant on new signups
4. `20260216000009_lesson_progress_partner_visibility.sql` — partner chain for progress
5. `20260216000010_lesson_progress_policy_cleanup.sql` — removes 4 broken policies
6. `20260216000014_scope_admin_policies_to_tenant.sql` — adds tenant scope to is_admin() policies
7. `20260216000015_seal_workflow_table_inserts.sql` — blocks anon INSERT on application tables

```
Open and run each file in order:
  supabase/migrations/20260216000003_extend_tenant_id_immutability.sql
  supabase/migrations/20260216000004_fix_certificates_policies.sql
  supabase/migrations/20260216000007_fix_lesson_progress_tenant_optional.sql
  supabase/migrations/20260216000009_lesson_progress_partner_visibility.sql
  supabase/migrations/20260216000010_lesson_progress_policy_cleanup.sql
  supabase/migrations/20260216000014_scope_admin_policies_to_tenant.sql
  supabase/migrations/20260216000015_seal_workflow_table_inserts.sql
```

### Verify Phase 6

```sql
-- Immutability triggers on all 7 core tables
SELECT tgname, tgrelid::regclass
FROM pg_trigger
WHERE tgname = 'protect_tenant_id'
ORDER BY tgrelid::regclass::text;
-- Expected: 7 rows (profiles + 6 core tables)

-- No broken lesson_progress policies remain
SELECT policyname FROM pg_policies
WHERE tablename = 'lesson_progress'
  AND policyname IN ('lp_all', 'lp_admin_read', 'lp_tenant_read', 'lesson_progress_tenant_select');
-- Expected: 0 rows

-- Anon INSERT revoked on application tables
SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_name IN ('applications', 'student_applications', 'employer_applications')
  AND grantee = 'anon'
  AND privilege_type = 'INSERT';
-- Expected: 0 rows
```

---

## Phase 7: Two-Tenant Isolation Test

**File:** `20260216000017_two_tenant_isolation_test.sql`

Creates `rls_two_tenant_test()` — the definitive proof of tenant isolation.

```
Open: supabase/migrations/20260216000017_two_tenant_isolation_test.sql
Run:  Entire file
```

### Verify Phase 7 (Final Verification)

```sql
-- Run the two-tenant isolation test
SELECT * FROM public.rls_two_tenant_test();
-- Expected: ALL rows show passed = true
-- ⚠️ ANY failed row = tenant isolation is broken. Do NOT proceed to licensing.

-- Also re-run the general test harness
SELECT * FROM public.rls_test_report();
-- Expected: ALL rows show passed = true

-- Final census
SELECT
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'public') AS total_policies,
  (SELECT count(*) FROM pg_class WHERE relrowsecurity = true AND relkind = 'r' AND relnamespace = 'public'::regnamespace) AS tables_with_rls,
  (SELECT count(*) FROM pg_trigger WHERE tgname = 'protect_tenant_id') AS immutability_triggers,
  (SELECT count(*) FROM pg_trigger WHERE tgname = 'set_tenant_id_on_insert') AS auto_tenant_triggers;
```

---

## Rollback

Each phase is independently reversible. If a phase fails:

1. **Phase 1:** `DROP FUNCTION IF EXISTS get_current_tenant_id, prevent_tenant_id_change CASCADE;`
2. **Phase 2:** `ALTER TABLE certificates DROP COLUMN IF EXISTS tenant_id;` (repeat per table)
3. **Phase 3:** `ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_tenant_id_not_null;` (repeat per table)
4. **Phase 4-6:** Policies use `DROP POLICY IF EXISTS` — re-running previous migration versions restores old policies
5. **Phase 7:** `DROP FUNCTION IF EXISTS rls_two_tenant_test;`

---

## Appendix A: Create Missing Helper Functions

If `is_admin()` or `is_super_admin()` don't exist, create them before Phase 1:

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
```

---

## Summary: 19 Files, 7 Phases

| Phase | Files | What It Does |
|-------|-------|-------------|
| 1 | 1 | Foundation: `get_current_tenant_id()`, immutability trigger |
| 2 | 2 | Add `tenant_id` columns, backfill all NULLs |
| 3 | 1 | Enforce NOT NULL constraints |
| 4 | 4 | Lock down USING(true), enable RLS on 12 tables, partner visibility |
| 5 | 3 | Break recursion, test harness, admin policy sweep |
| 6 | 7 | Tenant-scope all admin policies, seal workflow inserts |
| 7 | 1 | Two-tenant isolation proof |

**Estimated time:** 2-4 hours with verification between each phase.
