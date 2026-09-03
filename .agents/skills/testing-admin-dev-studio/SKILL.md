---
name: testing-admin-dev-studio
description: Test the Elevate Admin Dev Studio panels end-to-end. Use when verifying schema migrations, API routes, or UI rendering for Dev Studio (Secrets, Agents, Container, Health, etc.).
---

# Testing Admin Dev Studio

## Overview

Dev Studio is the admin-only operations interface at `/admin/dev-studio` on the admin subdomain (`admin.elevateforhumanity.org`). It has sidebar panels: Studio, Command, Deploy, Files, Container, Health, Secrets, plus Advanced links (Agents, Tasks, Memory, Workflows, Builds, Deployments, Logs, Settings).

## Devin Secrets Needed

- `SUPABASE_SERVICE_ROLE_KEY` — for direct API calls to Supabase
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- Admin login credentials (email/password) for browser-based testing

## Pre-requisites

1. Migrations must be applied manually in Supabase Dashboard → SQL Editor (they are NOT auto-applied)
2. Admin credentials: log in at `admin.elevateforhumanity.org/login`
3. User must have `super_admin` role in `profiles` table

## Test Procedure

### 1. Login to Admin

- Navigate to `admin.elevateforhumanity.org/login`
- Enter admin credentials
- Verify redirect to `/admin/dashboard` (not `/unauthorized`)
- Navigate to `/admin/dev-studio`

### 2. Test Secrets Panel (platform_secrets table)

- Click "Secrets" in the Dev Studio sidebar
- **Pass:** Panel renders with secret count header, category breakdown, no error banners
- **Fail:** 503 "tables need schema update", 500 errors, blank spinner >10s
- Also verify API directly: `GET /api/admin/platform-secrets` should return `{secrets: [...]}`

### 3. Test Agents API

- Navigate to `/api/devstudio/agents` directly in browser
- **Pass:** JSON with `{agents: [...]}`, each agent has `slug`, `description`, `model_hint` fields, HTTP 200
- **Fail:** HTTP 503 "Dev Studio OS tables need schema update", HTTP 500 "column does not exist"
- Note: Duplicate agents may exist with UUID-suffixed slugs (e.g., `ai-architect` and `ai-architect-90dce29c`) — this is expected after deduplication

### 4. Test Container Panel

- Click "Container" in the Dev Studio sidebar
- **Pass:** devcontainer.json visual editor renders (name, base image, features, extensions), Northflank Services section shows service cards with Deploy/Restart buttons
- **Fail:** Error overlay mentioning "platform_secrets" or schema issues
- The panel references `platform_secrets` for secret precedence — if the table is missing, this panel may fail

### 5. Test Health Panel

- Click "Health" in the Dev Studio sidebar
- **Pass:** Shows status for GitHub, Groq, Gemini, OpenAI, Supabase URL, Supabase service key, Node version, Next version
- **Fail:** Error state, missing entries, schema error messages

## Common Issues

### Schema Mismatches (IF NOT EXISTS race)

Two migrations (`20260708000001` and `20260708000005`) create the same 14 dev-studio tables with `IF NOT EXISTS` but different column sets. If migration 000001 ran first, the tables exist with the older/simpler schema and 000005's columns are silently skipped. Fix: apply reconciliation migration that uses `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for each missing column.

### platform_secrets Table Missing

This table was not included in any of the original dev-studio migrations but is referenced by 11+ files. If missing, Secrets panel, Container panel, and health checks will fail. Fix: create table via migration.

### Duplicate Slugs

When adding a UNIQUE constraint to `ai_agents.slug`, duplicate slugs may cause the migration to fail with error `23505`. Fix: deduplicate first by appending UUID prefix to duplicate rows before adding constraint.

### Direct DB Connection Not Available

Supabase DB hostname may resolve only to IPv6, and the VM network might be IPv4-only. If `psql` and Node.js connections fail, migrations must be applied in Supabase Dashboard SQL Editor manually (per AGENTS.md guidelines).

### Supabase SQL Editor Transactions

The Supabase SQL Editor runs the entire script in a single transaction. If any statement fails (e.g., UNIQUE constraint on duplicates), the entire migration rolls back — including all prior column additions. Always include deduplication logic before constraint creation in the same script.

## Tips

- The admin site uses the Supabase service role key for all dev-studio API calls — ensure RLS policies include `auth.role() = 'service_role'`
- `isMissingTable()` helper in `lib/devstudio/os/api-helpers.ts` should catch both error code `42P01` (table missing) and `42703` (column missing)
- When testing API endpoints directly, you may need to be logged in (cookies) — navigate there in the same browser session where you logged in
- Dev Studio sidebar panels are rendered by `DevStudioUnifiedClient.tsx` — check this file if panels don't switch correctly
