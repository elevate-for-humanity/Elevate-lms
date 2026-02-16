# 🔧 Apply These Migrations to Fix Database Issues

## Quick Fix - Apply 3 Migrations

To get to 10/10 production ready, apply these 3 migrations in order:

### 1. Create Missing Tables
**File:** `20260102_ensure_tracking_tables.sql`

Creates:
- `employment_tracking` table (for WIOA compliance)
- `credential_verification` table (for state registry verification)

### 2. Fix Duplicate Policies
**File:** `20260102_fix_duplicate_policies.sql`

Fixes:
- Renames 11 duplicate policy names to be unique
- Prevents policy conflicts on fresh deployments

### 3. Final RLS Policies
**File:** `20260102_final_rls_policies.sql`

Ensures:
- Clean, conflict-free RLS state
- Public pages accessible without auth
- Private data properly protected

---

## How to Apply

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://supabase.com/dashboard/project/cuxzzpsyufcewtmicszk

2. Click **SQL Editor** in the left sidebar

3. Click **New Query**

4. Copy and paste the contents of each migration file (in order):
   - First: `20260102_ensure_tracking_tables.sql`
   - Second: `20260102_fix_duplicate_policies.sql`
   - Third: `20260102_final_rls_policies.sql`

5. Click **Run** for each migration

6. Verify no errors in the output

### Option 2: Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push

# Or apply individually
supabase db execute -f supabase/migrations/20260102_ensure_tracking_tables.sql
supabase db execute -f supabase/migrations/20260102_fix_duplicate_policies.sql
supabase db execute -f supabase/migrations/20260102_final_rls_policies.sql
```

### Option 3: psql (if you have network access)

```bash
# Load DATABASE_URL from .env.local
export $(cat .env.local | grep DATABASE_URL | xargs)

# Apply migrations
psql "$DATABASE_URL" -f supabase/migrations/20260102_ensure_tracking_tables.sql
psql "$DATABASE_URL" -f supabase/migrations/20260102_fix_duplicate_policies.sql
psql "$DATABASE_URL" -f supabase/migrations/20260102_final_rls_policies.sql
```

---

## Verification

After applying, run the test script:

```bash
npm run test:database
# or
npx tsx scripts/test-database.ts
```

Expected result:
```
✅ ALL TESTS PASSED - Database is production ready!
Total Tests: 23
Passed: 23 ✅
Failed: 0 ❌
Success Rate: 100.0%
```

---

## What Gets Fixed

### Before (9/10)
- ❌ Missing tables: `employment_tracking`, `credential_verification`
- ❌ 12 duplicate policy names
- ⚠️  Conflicting RLS files

### After (10/10)
- ✅ All tables exist
- ✅ All policies unique
- ✅ Clean RLS state
- ✅ 100% test pass rate

---

## Troubleshooting

### "relation already exists"
This is fine - it means the table was already created. Continue with next migration.

### "policy already exists"
This is fine - the migration drops existing policies before recreating them.

### "permission denied"
Make sure you're using the service role key, not the anon key.

### Network errors
Use Option 1 (Supabase Dashboard) instead of psql.

---

## After Applying

1. Run test script to verify: `npx tsx scripts/test-database.ts`
2. Update PRODUCTION_READY.md score to 10/10
3. Commit the changes
4. Deploy with confidence! 🚀
