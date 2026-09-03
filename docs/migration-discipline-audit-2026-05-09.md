# Migration Discipline Audit — 2026-05-09

## Scope

This audit focused on:
- migration failure risk
- view/table ownership drift
- RPC signature churn/conflicts
- intake/application schema consistency
- admin routing conversion integrity
- staging verification gates before production

## Findings (ordered by severity)

1. High — migration assumed `applications.id` is text, conflicting with canonical UUID schema
- Evidence: `public.applications` canonical definition uses `id UUID` in `20260227000003_schema_governance_baseline.sql`.
- Risk: `20260629000004_cleanup_intake_timestamp_ids.sql` attempted `id = gen_random_uuid()::text` with `WHERE id LIKE 'intake-%'`, which can fail on UUID-typed schemas.
- Impact: migration failure during deployment in UUID environments.
- Fix applied: migration is now type-safe and executes only when `applications.id` is `text` or `character varying`; otherwise it no-ops with `NOTICE`.

2. High — canonical view ownership drift for `public.lms_lessons`
- Evidence: 17 view redefinitions across migrations.
- Risk: environment-dependent shape drift if a migration is skipped or applied out of expected order.
- Impact: latent app breakage where lesson page and APIs expect columns introduced by later `lms_lessons` revisions.
- Required discipline: define a single canonical owner migration for `public.lms_lessons` and ensure every additive change updates that owner (or a strict ordered chain with explicit supersession comments).

3. Medium — high RPC churn on partner approval functions
- Evidence: `public.rpc_approve_partner` and `public.rpc_link_partner_user` are redefined 5 times each.
- Risk: signature and behavior drift across environments if a subset of fixes is applied.
- Impact: partner approval instability and hard-to-debug runtime mismatches.
- Required discipline: maintain one canonical migration for each RPC signature, and enforce explicit drop/recreate plus contract tests when arguments change.

4. Medium — migration lint tool produced false positives before fix
- Evidence: lint reported trailing commas for valid column-before-table-constraint syntax.
- Risk: audit noise and reduced trust in migration gates.
- Fix applied: `scripts/lint-migrations.cjs` now recognizes valid trailing comma when followed by table constraints (e.g. `UNIQUE`, `PRIMARY KEY`).

5. Medium — migration tracking script emitted ambiguous result
- Evidence: `check-migrations-status.mjs` previously returned `Total migrations executed: null` without actionable interpretation.
- Risk: false confidence about migration state.
- Fix applied: script now returns a clear failure when `_migrations` is missing and warns when count cannot be determined.

6. Low — duplicate intent migrations exist for the same schema concern
- Evidence: two migrations add `applications.type` (`20260430000016_applications_type_column.sql`, `20260503000031_applications_type_column.sql`).
- Risk: confusion and ownership ambiguity (functional risk low because both use `IF NOT EXISTS`).
- Required discipline: mark superseded migration intent in comments and keep one canonical owner for each field family.

## Intake/Application/Admin Flow Integrity Checks

1. Intake and applications write surface is narrow and auditable:
- Intake insert path: `app/api/intake/route.ts` writes `apprenticeship_intake` then mirrors to `applications`.
- General apply insert path: `app/api/apply/route.ts` writes `applications`.

2. Broken-ID mitigation is now deterministic:
- Admin review route accepts UUID and legacy `intake-*` IDs only.
- Non-UUID/non-legacy IDs return explicit invalid-ID message.
- Admin APIs for application CRUD/approve now reject invalid non-UUID IDs with 400.

3. Conversion layer status:
- UI links consistently target `/admin/applications/review/[id]`.
- Legacy direct page routes previously removed remain absent by design.

## Staging Verification Gates (must pass before production)

Run in staging environment with production-like DB snapshot:

1. Migration static checks
- `node scripts/lint-migrations.cjs`
- `bash scripts/audit-schema-refs.sh`

2. Security/governance checks
- `bash scripts/audit-auth-gaps.sh`
- `bash scripts/audit-env-vars.sh`

3. Build gate
- `pnpm next build`

4. Runtime DB assertions (Supabase SQL Editor)
- Verify key intake/application columns exist:
  - `applications`: `id`, `status`, `program_id`, `program_slug`, `eligibility_data`, `submitted_at`, `type`
  - `apprenticeship_intake`: `full_name`, `email`, `program_interest`, `funding_tag`
- Verify critical views exist and compile:
  - `public.lms_lessons`
  - `public.enrollments`
  - `public.participant_report`
- Verify critical RPCs exist with expected arg lists:
  - `public.rpc_approve_partner`
  - `public.rpc_link_partner_user`
  - `public.rpc_enroll_student`

5. Application-flow smoke checks
- Submit intake form and confirm:
  - row in `apprenticeship_intake`
  - mirrored row in `applications` or explicit `mirror_failed` response path
- Open admin review for resulting application ID.
- Confirm approve/reject actions return expected status transitions.

## Commands Executed (key)

- `node scripts/lint-migrations.cjs` (after fix: pass)
- `bash scripts/audit-schema-refs.sh` (0 schema gaps at threshold)
- `bash scripts/audit-auth-gaps.sh` (no no-auth or role-blind findings; one re-export check)
- `bash scripts/audit-env-vars.sh` (0 undocumented vars)
- migration and view/RPC drift scans via grep in `supabase/migrations`

## Recommended Next Discipline Step

Add a CI gate that fails when:
- a migration redefines `public.lms_lessons` or critical RPCs without a `-- supersedes:` header
- a migration mutates `applications` schema without updating the canonical contract note
- `check-migrations-status.mjs` cannot prove migration tracking in staging
