# Migration Status

## Current State (2026-02-24)

- **428 tables** existed in the database at baseline (created via Supabase Dashboard)
- **142 numbered migrations** (`20*.sql`) add ~240 new tables, RLS policies, functions, indexes, and seed data
- **1 baseline migration** (`00000000000000_baseline.sql`) marks the pre-existing state
- **Total: 143 active migration files**

## Safety

All migrations are idempotent:
- `CREATE TABLE IF NOT EXISTS` — safe to re-run
- `ADD COLUMN IF NOT EXISTS` or wrapped in `DO $$ IF NOT EXISTS` PL/pgSQL blocks
- `CREATE OR REPLACE FUNCTION` — last definition wins
- `DROP POLICY IF EXISTS` before `CREATE POLICY` — last definition wins

## Archived Files

| Directory | Count | Contents |
|-----------|-------|----------|
| `archive-batch-scripts/` | 24 | `run_part*.sql` — bulk table creation scripts (872 tables). Manual paste-into-dashboard scripts, not Supabase migrations. |
| `archive-tests/` | 7 | Test harnesses, verification queries, seed test data. Not for production. |
| `archive-superseded/` | 4 | Migrations replaced by later versions (tax_prep_enrollment_map v1/v2, no-op markers). |
| `archive/` | 20+ | Legacy migrations from before baseline. Never applied via migration system. |
| `archive-legacy/` | varies | Old/deprecated migrations. |
| `archive-lockdown/` | varies | RLS lockdown drafts. |
| `archive-phase-b/` | varies | Phase B planning files. |
| `archive-unapplied/` | varies | 93 migrations that were never applied. |

## Duplicate Handling

13 tables had duplicate `CREATE TABLE` statements across files. All duplicates have been commented out with `[DUPLICATE: canonical in ...]` markers pointing to the canonical file. The canonical file (earliest) retains the active definition.

## RLS Policies & Functions

Policies and functions are intentionally redefined across multiple migrations. Each iteration refines the definition (adding tenant scoping, fixing recursion, etc.). The last migration to run wins. This is correct Supabase practice.

Key evolution chains:
- `get_current_tenant_id` — 5 versions (recursion fixes, default tenant handling)
- `profiles_admin_all` — 5 versions (tenant scoping iterations)
- `handle_new_user` — 3 versions (default tenant assignment)

## How to Apply

### New migrations
```bash
npx supabase migration new <name>
```

### Run in Supabase Dashboard
1. Go to SQL Editor: https://supabase.com/dashboard/project/cuxzzpsyufcewtmicszk/sql
2. Paste migration SQL
3. Run

### Batch scripts (if needed)
The `archive-batch-scripts/run_part*.sql` files create 872 tables referenced by the codebase. Run them in order (1-21) in the SQL Editor if tables are missing.
