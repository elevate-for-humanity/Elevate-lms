# Migration Status

## Current State (2026-01-23)
- **428 tables** exist in the database
- **428 tables** have RLS policies
- **1 migration** was applied via Supabase migrations system (`create_digital_purchases`)
- **93 migration files** were archived to `archive-unapplied/` (never applied - schema was created manually)

## Baseline Approach
The database schema was created manually via Supabase dashboard before migrations were set up.
A baseline migration (`00000000000000_baseline.sql`) marks this state.

Future migrations should be incremental changes from this baseline.

## Directory Structure
```
supabase/migrations/
├── 00000000000000_baseline.sql    # Marks current state
├── archive-unapplied/             # 93 migrations that were never applied
├── archive-legacy/                # Old/deprecated migrations
├── archive/                       # Other archived migrations
└── MIGRATION_STATUS.md            # This file
```

## Going Forward
1. New schema changes should be created as new migration files
2. Use `npx supabase migration new <name>` to create new migrations
3. Test migrations locally before applying to production
4. Keep migrations incremental and reversible when possible
