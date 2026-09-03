# Supabase RLS Policies Audit & Fix Summary

**Date:** 2026-08-15  
**Project:** Elevate LMS  
**Supabase Project ID:** cuxzzpsyufcewtmicszk  
**Status:** COMPLETE - Migration file ready for deployment

---

## Executive Summary

This audit identified **25 tables** with Row Level Security (RLS) enabled but **no policies**, blocking authenticated users from accessing data. A comprehensive migration file has been created to fix all issues.

---

## Problem Statement

When RLS is enabled on a table without policies, **all access is denied** by default. This was causing:
- Apprentices unable to view/manage their own hours
- Supervisors unable to approve apprentice hours
- Instructors unable to manage their profiles
- Course creators unable to access their generated content
- Admin-only tables completely inaccessible

---

## Solution Overview

Created comprehensive RLS policies following the **principle of least privilege**:

1. **User-owned data**: Users can only access their own records
2. **Organizational data**: Access through tenant/shop ownership
3. **Admin-only data**: Restricted to admin/super_admin/staff roles
4. **Public data**: Readable by authenticated users (e.g., published curricula)

---

## Helper Functions Created

```sql
-- Check if user is admin (role = 'admin', 'super_admin', or 'staff')
public.is_admin()

-- Check if user is super_admin
public.is_super_admin()

-- Get current user's tenant_id
public.get_user_tenant_id()
```

---

## Policy Categories

### P0 CRITICAL - Apprenticeship System

| Table | Policies | Access Pattern | Key Column |
|-------|----------|----------------|------------|
| `apprentice_hours` | 4 | Apprentice own + Supervisor shop + Admin | `host_shop_apprentice_id` → `apprentice_id` |
| `competency_signoffs` | 3 | Apprentice own + Supervisor shop + Admin | `host_shop_apprentice_id` |
| `host_shop_apprentices` | 3 | Apprentice own + Shop owner + Admin | `apprentice_id`, `host_shop_id` |
| `host_shop_evaluations` | 3 | Apprentice own + Supervisor + Admin | `apprentice_id` |
| `host_shop_subscriptions` | 2 | Shop owner select + Admin all | `tenant_id` → `owner_email` |
| `host_shops` | 2 | Owner select + Admin all | `owner_email` |

#### Policy Details for `apprentice_hours`:

```sql
-- 1. Apprentices can view their own hours
CREATE POLICY "apprentice_hours_apprentice_select"
  ON apprentice_hours FOR SELECT
  TO authenticated
  USING (auth.uid() = (
    SELECT apprentice_id FROM host_shop_apprentices
    WHERE id = apprentice_hours.host_shop_apprentice_id
  ));

-- 2. Apprentices can insert their own hours
CREATE POLICY "apprentice_hours_apprentice_insert"
  ON apprentice_hours FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = (
    SELECT apprentice_id FROM host_shop_apprentices
    WHERE id = apprentice_hours.host_shop_apprentice_id
  ));

-- 3. Supervisors can view and approve hours for their shop's apprentices
CREATE POLICY "apprentice_hours_supervisor_access"
  ON apprentice_hours FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM host_shop_apprentices hsa
    JOIN host_shops hs ON hs.id = hsa.host_shop_id
    JOIN profiles p ON p.id = auth.uid()
    WHERE hsa.id = apprentice_hours.host_shop_apprentice_id
    AND (hsa.supervisor_id = auth.uid() OR hs.owner_email = p.email OR p.role IN ('admin','super_admin','staff'))
  ));

-- 4. Admin can do everything
CREATE POLICY "apprentice_hours_admin_all"
  ON apprentice_hours FOR ALL
  TO authenticated
  USING (public.is_admin());
```

---

### P1 MAJOR - Curriculum & Course Generation

| Table | Policies | Access Pattern | Key Column |
|-------|----------|----------------|------------|
| `curricula` | 2 | Public read (published) + Admin all | `status` |
| `curriculum_versions` | 2 | Authenticated read + Admin all | `curriculum_id` → parent |
| `curriculum_licenses` | 2 | School access + Admin all | `school_id` → `email` |
| `instructor_profiles` | 3 | Own all + Public read (active) + Admin all | `user_id` |
| `generated_courses` | 2 | Creator all + Admin all | `created_by` |
| `generated_modules` | 2 | Course access + Admin all | `course_id` → parent |
| `generated_lessons` | 2 | Course access + Admin all | `course_id` → parent |
| `generated_quizzes` | 2 | Course access + Admin all | `course_id` → parent |
| `generated_assignments` | 2 | Course access + Admin all | `course_id` → parent |
| `generated_resources` | 2 | Course access + Admin all | `course_id` → parent |
| `course_module_settings` | 2 | Module access + Admin all | `module_id` → parent |
| `ai_conversations` | 3 | Own select + Own all + Admin read | `user_id` |

#### Policy Details for `instructor_profiles`:

```sql
-- 1. Instructors can manage their own profile
CREATE POLICY "instructor_own_profile"
  ON instructor_profiles FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 2. Public can view active instructor profiles
CREATE POLICY "instructor_public_read"
  ON instructor_profiles FOR SELECT
  TO authenticated
  USING (active = true OR user_id = auth.uid() OR public.is_admin());

-- 3. Admins can manage all instructor profiles
CREATE POLICY "instructor_admin_all"
  ON instructor_profiles FOR ALL
  TO authenticated
  USING (public.is_admin());
```

---

### P2 ADMINISTRATIVE - Org & Business Data

| Table | Policies | Access Pattern | Notes |
|-------|----------|----------------|-------|
| `schools` | 1 | Admin all | School org data |
| `enterprise_licenses` | 1 | Admin all | Contractual data (conditional) |
| `individual_licenses` | 2 | Own all + Admin all | User licenses (conditional) |
| `trials` | 1 | Admin all | Business metrics (conditional) |
| `blueprint_monitors` | 1 | Admin all | System config |
| `course_factory_jobs` | 2 | Creator select + Admin all | Job tracking |
| `course_publish_logs` | 2 | Admin read + Service insert | Audit trail |
| `focused_reviews` | 2 | Reviewer access + Admin all | Review tracking (conditional) |

#### Policy Details for `course_factory_jobs`:

```sql
-- 1. Job creators can view their own jobs
CREATE POLICY "cf_jobs_creator_access"
  ON course_factory_jobs FOR SELECT
  TO authenticated
  USING (requested_by = auth.uid());

-- 2. Only admins can create/modify jobs (prevents abuse)
CREATE POLICY "cf_jobs_admin_all"
  ON course_factory_jobs FOR ALL
  TO authenticated
  USING (public.is_admin());
```

---

### Additional Tables (Plans & Media)

| Table | Policies | Access Pattern |
|-------|----------|----------------|
| `plans` | 2 | Public read (active) + Admin all |
| `plan_features` | 1 | Admin all |
| `course_generation_jobs` | 2 | Creator select + Admin all |
| `course_media_assets` | 2 | Course access + Admin all |

---

## Security Design Principles Applied

1. **No USING (true)** - Every policy has a specific condition
2. **Ownership chains** - Access through parent objects (course → modules → lessons)
3. **Role-based escalation** - Admin role can access everything
4. **INSERT with WITH CHECK** - Ensures data integrity on writes
5. **Conditional table creation** - Uses DO $$ blocks for tables that may not exist

---

## Deployment Instructions

### Option 1: Via Supabase Dashboard (Recommended for Testing)

1. Go to: https://supabase.com/dashboard/project/cuxzzpsyufcewtmicszk/sql editor
2. Open the file: `supabase/migrations/20260815000001_comprehensive_rls_policies.sql`
3. Copy the entire contents
4. Paste into SQL Editor
5. Click "Run"

### Option 2: Via Supabase CLI

```bash
# Link to project
supabase link --project-ref cuxzzpsyufcewtmicszk

# Push migration
supabase db push
```

### Option 3: Via Migration Bundle

The policies are included in the all-in-one migration file:
```
supabase/migrations/ALL_IN_ONE__paste_into_dashboard.sql
```

---

## Verification After Deployment

Run these queries to verify policies are in place:

```sql
-- Check RLS is enabled and policies exist
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
AND tablename IN (
  'apprentice_hours', 'competency_signoffs', 'host_shop_apprentices',
  'host_shops', 'host_shop_subscriptions', 'curricula',
  'curriculum_versions', 'curriculum_licenses', 'instructor_profiles',
  'generated_courses', 'generated_modules', 'generated_quizzes',
  'generated_assignments', 'generated_resources', 'course_factory_jobs'
)
ORDER BY tablename;
```

---

## Rollback Plan

If issues arise, you can disable individual policies:

```sql
-- Disable a specific policy
ALTER TABLE apprentice_hours DISABLE ROW LEVEL SECURITY;

-- Or drop specific policies
DROP POLICY "apprentice_hours_apprentice_select" ON apprentice_hours;
```

**Note:** Disabling RLS entirely is NOT recommended for production.

---

## Policy Count Summary

| Priority | Tables | Total Policies |
|----------|--------|----------------|
| P0 Critical | 6 | 17 |
| P1 Major | 12 | 24 |
| P2 Administrative | 8 | 12 |
| Additional | 4 | 7 |
| **TOTAL** | **30** | **60** |

---

## Files Modified

1. **Created:** `supabase/migrations/20260815000001_comprehensive_rls_policies.sql`
   - Contains all RLS policies
   - Contains helper functions
   - Uses transaction wrapper (BEGIN/COMMIT)
   - Includes comprehensive comments

---

## Next Steps

1. **Test in staging** - Apply to a test environment first
2. **Verify with test users** - Create test apprentices, instructors, admins
3. **Check application logs** - Ensure no RLS permission errors
4. **Monitor performance** - Some policies use subqueries which may need indexes
5. **Add indexes** - If needed for policy performance

---

## Performance Considerations

Some policies use subqueries which could impact performance:

1. `apprentice_hours_supervisor_access` - joins through `host_shop_apprentices`
2. `generated_modules` - joins through `generated_courses`

**Recommended indexes (if not already present):**
```sql
CREATE INDEX IF NOT EXISTS idx_host_shop_apprentices_apprentice ON host_shop_apprentices(apprentice_id);
CREATE INDEX IF NOT EXISTS idx_host_shop_apprentices_shop ON host_shop_apprentices(host_shop_id);
CREATE INDEX IF NOT EXISTS idx_generated_courses_creator ON generated_courses(created_by);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
```

---

## Contact

For questions about these RLS policies, refer to:
- AGENTS.md - Project context and architecture
- supabase/migrations/*.sql - Schema definitions
- Supabase RLS Documentation: https://supabase.com/docs/guides/auth/row-level-security
