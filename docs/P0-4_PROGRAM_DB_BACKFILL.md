# P0-4: Program DB Backfill Migration

**Date:** 2026-06-23  
**Status:** REQUIRES DATABASE ACCESS

## Root Cause

```
Program pages expect related data in:
- program_media
- program_ctas
- program_tracks
- program_modules

43 programs defined in data/programs/*.ts
Only HVAC program has seed data in migrations
```

## Files Requiring Backfill

Local files: 43 programs in `data/programs/`
Migrations with seed data: Only `20260530000001_seed_hvac_program_relations.sql`

## Script Available

`scripts/check-program-integrity.ts` - Checks for missing relations

```bash
# Run integrity check
pnpm tsx scripts/check-program-integrity.ts

# Run strict mode
STRICT_PROGRAM_INTEGRITY=true pnpm tsx scripts/check-program-integrity.ts
```

## Required Action

1. Run `pnpm tsx scripts/check-program-integrity.ts` against production DB
2. Identify which programs are missing related data
3. Create migration to backfill missing data
4. Re-run check until ZERO failures

## Verification

Output file: `audit-packet/program-integrity-report.json`

```
✅ All programs have media
✅ All programs have CTAs
✅ All programs have tracks
✅ All programs have modules
```

## Current Status

**⚠️ REQUIRES DATABASE ACCESS** - Cannot verify without production/supabase access

Commit already exists for auth fix, this task requires Supabase access to verify.
