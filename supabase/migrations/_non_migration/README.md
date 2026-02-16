# Database Migrations

## Current State

**Clean slate as of December 27, 2025**

All legacy migrations (253 files) have been archived. The database schema is now managed through:

1. **Migration tracking system** - Prevents duplicate migrations
2. **Two active migrations** - Schema fixes and tracking system
3. **Archived legacy files** - Preserved in `archive-legacy/` for reference

## Active Migrations

### 20251227_fix_schema_mismatches.sql
Fixes schema mismatches between database and TypeScript code:
- Adds `uploaded_at` to `program_holder_documents`
- Adds `decision`, `reviewed_at`, `reviewed_by` to `program_holder_verification`
- Includes triggers to keep mirrored columns in sync

### 20251227_create_migration_tracking.sql
Creates migration tracking system:
- `schema_migrations` table tracks applied migrations
- Helper functions to check/record migrations
- Marks all legacy migrations as applied

## How to Create New Migrations

### 1. Name Your Migration
Use timestamp format: `YYYYMMDD_description.sql`

Example: `20251228_add_user_preferences.sql`

### 2. Check If Already Applied
```sql
SELECT migration_applied('20251228_add_user_preferences');
```

### 3. Write Your Migration
```sql
-- Check if already applied
DO $$
BEGIN
  IF NOT migration_applied('20251228_add_user_preferences') THEN
    
    -- Your migration code here
    ALTER TABLE users ADD COLUMN preferences JSONB;
    
    -- Record migration
    PERFORM record_migration(
      '20251228_add_user_preferences',
      'Add user preferences column'
    );
    
  END IF;
END $$;
```

### 4. Test Locally First
```bash
# Run migration
psql $DATABASE_URL -f supabase/migrations/20251228_add_user_preferences.sql

# Verify it worked
psql $DATABASE_URL -c "SELECT * FROM migration_history LIMIT 5;"
```

### 5. Apply to Production
Via Supabase Dashboard:
1. Go to SQL Editor
2. Copy migration file contents
3. Run it
4. Verify in `migration_history` view

## Migration Best Practices

### ✅ DO
- Use `IF NOT EXISTS` for CREATE statements
- Check `migration_applied()` before running
- Record with `record_migration()` after success
- Test in staging first
- Keep migrations small and focused
- Add comments explaining why

### ❌ DON'T
- Drop tables without backup
- Change column types on large tables
- Run migrations twice
- Skip the tracking system
- Make breaking changes without migration path

## Viewing Migration History

```sql
-- See all applied migrations
SELECT * FROM migration_history;

-- See recent migrations
SELECT * FROM migration_history LIMIT 10;

-- Check specific migration
SELECT * FROM schema_migrations WHERE version = '20251227_fix_schema_mismatches';
```

## Rollback Strategy

Migrations are **forward-only**. To rollback:

1. **Create a new migration** that reverses changes
2. **Don't delete** from `schema_migrations`
3. **Test thoroughly** before applying

Example rollback:
```sql
-- Original: 20251228_add_user_preferences.sql
ALTER TABLE users ADD COLUMN preferences JSONB;

-- Rollback: 20251229_remove_user_preferences.sql
ALTER TABLE users DROP COLUMN IF EXISTS preferences;
```

## Archived Migrations

**Location:** `archive-legacy/`

**Count:** 253 files

**Status:** All marked as applied in `schema_migrations`

**Purpose:** Historical reference only - DO NOT run these

These files represent the messy history that led to the current schema. They're preserved for:
- Understanding how we got here
- Debugging historical issues
- Reference for table structures

## Emergency: Reset Migration Tracking

If migration tracking gets corrupted:

```sql
-- DANGER: Only use if absolutely necessary
TRUNCATE schema_migrations;

-- Re-run tracking migration
\i supabase/migrations/20251227_create_migration_tracking.sql
```

## Questions?

- Check `migration_history` view first
- Review archived migrations for reference
- Test in staging before production
- Document complex migrations

## Schema Documentation

Current schema state documented in:
- `schema-audit-results.json` - Actual database state
- `SCHEMA_FIX_SUMMARY.md` - Recent fixes applied
- `DATABASE_AUDIT_REPORT.md` - Full audit findings
