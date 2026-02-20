# Migration Execution Checklist

## Current State (verified 2026-02-20)

- **679 tables** exist in live Supabase (created via Dashboard SQL Editor)
- **0 tables** have RLS enabled
- **0 RLS policies** exist on any table
- **137 timestamped migration files** in repo — table creation portions were run manually, RLS portions were NOT
- **24 run_part files** in repo — NONE have been executed
- **Helper functions** (`get_current_tenant_id`, `is_super_admin`) — status unknown, may or may not exist from earlier manual runs

All migration files are in `supabase/migrations/` and must be pasted into the **Supabase SQL Editor** at:
https://supabase.com/dashboard/project/cuxzzpsyufcewtmicszk/sql

---

## Execution Order

### PRIORITY 1: Tenant Isolation (run before any external partner login)

#### Step 1: `run_part17_tenant_isolation.sql`
**What it does:** Adds `tenant_id` column + index to 7 core tables that lack it.
**Tables affected:** courses, lessons, modules, assignments, grades, job_placements, notifications
**Risk:** LOW — adds nullable column, no data loss, no downtime
**Verification after:**
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'courses' AND column_name = 'tenant_id';
-- Should return 1 row
```

#### Step 2: `run_part18_tenant_backfill.sql`
**What it does:** Creates default "Elevate for Humanity" tenant, backfills `tenant_id` on all existing rows across 25+ tables.
**Risk:** LOW — UPDATE WHERE NULL, no overwrites
**Verification after:**
```sql
SELECT count(*) FROM courses WHERE tenant_id IS NULL;
-- Should return 0

SELECT count(*) FROM profiles WHERE tenant_id IS NULL;
-- Should return 0

SELECT count(*) FROM enrollments WHERE tenant_id IS NULL;
-- Should return 0
```

#### Step 3: `run_part19_rls_core_tables.sql`
**What it does:** Creates/replaces 4 helper functions, enables RLS on 12 core tables, creates 41 tenant-enforcing policies.
**Risk:** MEDIUM — after this, unauthenticated queries return empty. Service role key bypasses RLS.

**IMPORTANT:** Take a database snapshot/backup before running this step.

**Functions created:**
- `get_current_tenant_id()` — returns authenticated user's tenant_id
- `get_user_tenant_id()` — alias for above
- `is_super_admin()` — checks if user has super_admin role
- `is_admin()` — checks if user has admin or super_admin role

**Tables locked down:** profiles, courses, enrollments, programs, certificates, lessons, modules, assignments, grades, lesson_progress, job_placements, notifications

**Verification after:**
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('profiles', 'courses', 'enrollments')
ORDER BY tablename;
-- All should show rowsecurity = true

-- Check policies exist
SELECT tablename, policyname FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'courses';
-- Should show 4 policies (select, insert, update, delete)
```

**Expected behavior change:**
- Anonymous/unauthenticated queries → return empty (correct)
- Authenticated student → sees only their tenant's data (correct)
- Super admin → sees all data (correct)
- Service role key → bypasses RLS entirely (correct)

#### Step 4: `run_part20_rls_remaining_tenant_tables.sql`
**What it does:** Enables RLS + tenant policies on 71 additional tables that already have `tenant_id`.
**Risk:** LOW — these tables are mostly empty (operational/enterprise modules)
**Verification after:**
```sql
SELECT count(*) FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;
-- Should return 83 (12 core + 71 remaining)
```

#### Step 5: `run_part21_rbac_seed.sql`
**What it does:** Seeds 5 standard role definitions, bulk-assigns existing profiles to `user_roles` table by their current `profiles.role` value, populates `tenant_members`.
**Risk:** LOW — INSERT with ON CONFLICT / NOT EXISTS guards

**MANUAL STEP REQUIRED:** After running, find your owner profile ID and uncomment the super_admin assignment:
```sql
-- Find your profile
SELECT id, email, role FROM profiles WHERE role IN ('admin', 'super_admin');

-- Then run (replace with your actual ID):
INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_at) VALUES
  ('YOUR_PROFILE_ID_HERE', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', now())
ON CONFLICT DO NOTHING;
```

**Verification after:**
```sql
SELECT count(*) FROM user_roles;
-- Should be > 0 (one per profile)

SELECT r.name, count(*) FROM user_roles ur
JOIN roles r ON r.id = ur.role_id
GROUP BY r.name;
-- Should show student, admin, instructor counts
```

---

### PRIORITY 2: Missing Tables (run when ready, not blocking for Cohort 1)

These create tables that code references but don't exist yet. Not blocking for launch if those pages aren't in the critical path.

| Order | File | Tables Created | Size |
|---|---|---|---|
| 6 | `run_part1.sql` | ~84 tables | 27 KB |
| 7 | `run_part2.sql` | ~84 tables | 26 KB |
| 8 | `run_part3.sql` | ~84 tables | 27 KB |
| 9 | `run_part4.sql` | ~84 tables | 26 KB |
| 10 | `run_part5.sql` | ~83 tables | 10 KB |
| 11 | `run_part6_rls.sql` | RLS for above | 100 KB |
| 12 | `run_part7_seed.sql` | Seed data for 10 tables | 6 KB |

### PRIORITY 3: Live Table Migrations (documentation/reproducibility only)

These recreate existing tables with `CREATE TABLE IF NOT EXISTS`. Safe to run but not strictly necessary since tables already exist.

| Order | File | Size |
|---|---|---|
| 13-17 | `run_part8-12_live_tables.sql` | 35-38 KB each |
| 18 | `run_part13_rls_live_tables.sql` | 105 KB |

### PRIORITY 4: Missing Code Tables + Seed Data

| Order | File | What |
|---|---|---|
| 19 | `run_part14_missing_code_tables.sql` | 11 tables code references | 
| 20 | `run_part15_rls_missing_code_tables.sql` | RLS for above |
| 21-24 | `run_part16_seed_1-4.sql` | Seed data for 335 empty tables |

---

## Post-Execution Code Changes (not blocking, do after SQL)

1. **Migrate 8 `users` table queries to `profiles`** (~30 min)
   - `app/account/profile/ProfileEditForm.tsx`
   - `app/account/profile/page.tsx`
   - `app/api/account/delete/route.ts`
   - `app/api/account/export/route.ts`
   - `app/api/admin/reports/daily/route.ts`
   - `app/api/lti/launch/route.ts`
   - `app/messages/page.tsx`
   - `lib/grants/notification-system.ts`

2. **Add `tenant_id` to INSERT payloads** in write operations (211 queries)
   - After RLS, INSERTs without `tenant_id` will have NULL tenant
   - These rows become invisible to tenant-scoped reads
   - Fix by adding `tenant_id: get_current_tenant_id()` or passing from auth context

3. **Add tenant check to `withAuth` wrapper** (~15 min)
   - `lib/with-auth.ts`: add `tenant_id` to the `AuthedUser` return type
   - Query `profiles.tenant_id` alongside `profiles.role`

---

## Rollback Plan

If RLS causes issues after Step 3:
```sql
-- Emergency: disable RLS on all tables (restores pre-migration behavior)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true
  LOOP
    EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY';
  END LOOP;
END $$;
```

This instantly reverts to the current globally-readable state. Policies remain but are not enforced. Re-enable with `ALTER TABLE x ENABLE ROW LEVEL SECURITY` when ready.
