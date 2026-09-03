# Supabase & Platform Discipline Audit — 2026-06-05

Full audit of migration hygiene, live DB state, legacy deploy references, and code/schema alignment.

## Executive summary

| Area | Status | Action |
|------|--------|--------|
| Migration file lint (`lint-migrations.cjs`) | ✅ 747 files, 0 syntax issues | Keep in CI |
| Timestamp prefix collisions | ❌ 20 groups / 43 files | Stop adding collisions; renumber new work only |
| Live migration apply (this agent VM) | ⚠️ Blocked | `SUPABASE_SERVICE_ROLE_KEY=placeholder` in `.env.local` |
| Canonical migration runner | ✅ `scripts/db/runMigrations.js` | Use `efh_migrations` tracking + `exec_sql` RPC |
| Corrupted runner script | ✅ Fixed | `scripts/run-migrations-now.mjs` restored as wrapper |
| Schema refs vs migrations | ⚠️ 4 tables (≥5 refs, no migration CREATE) | Verify live DB |
| Auth gaps | ⚠️ 2 no-auth routes | Review barbershop apply + ping |
| Production deploy path | ✅ Northflank | Docs mentioning `deploy-aws.yml` are stale |
| Redirect conflicts | ✅ None (317 sources) | — |

---

## 1. Migration inventory

- **Total SQL files:** 747 (`supabase/migrations/`)
- **Unique 14-char prefixes:** 724
- **Colliding prefixes:** 20 groups (43 files share a timestamp with another file)

### Why collisions matter

Filenames sort lexicographically by `YYYYMMDDNNNNNN`. When two files share the same prefix, **apply order between them is undefined** (depends on the suffix description string). This breaks chronological discipline.

**Worst groups:**

| Prefix | Files |
|--------|-------|
| `20260526000001` | application_assistant, course_embeddings, intake_document_urls, sync_enrollment_progress_trigger |
| `20260703000001` | homepage_testimonials, prestige_elevation_course_title, progress_entries_hour_sync |
| `20260703000003` | seed_platform_settings_defaults, platform_events_processed_at |

**Rule (AGENTS.md):** Increment `NNNNNN` suffix for same-day migrations. Never reuse a prefix.

### Duplicate `CREATE TABLE` across files

Many tables appear in multiple migrations (often `IF NOT EXISTS`). This is expected in a long-running repo but increases drift risk. Top duplicates are tracked in `audit_out/migration-discipline.json` via:

```bash
node scripts/audit-migration-discipline.mjs
```

---

## 2. Applying migrations (orchestration)

### Canonical paths (in order of preference)

1. **`node scripts/db/runMigrations.js`** — Uses `exec_sql` RPC + `public.efh_migrations` tracking. Skips already-applied filenames. **No `DATABASE_URL` required.**
2. **Supabase Dashboard SQL Editor** — Paste idempotent bundle: `supabase/migrations/20260703000002_pending_migrations_bundle.sql`
3. **`psql $DATABASE_URL`** — Only if direct Postgres URL is configured (`postgresql://postgres:...@db.<ref>.supabase.co:5432/postgres`)

### Pending bundles (documented in AGENTS.md)

These July 20260702 migrations are idempotent and safe to re-run:

- `20260702000009_normalize_two_factor_auth.sql`
- `20260702000010_onboarding_progress_unique.sql`
- `20260702000011_ensure_storage_buckets.sql`
- `20260702000012_external_courses_support_fee.sql`

Bundled in: `20260703000002_pending_migrations_bundle.sql`

### Probe script (requires real service role key)

```bash
set -a && source .env.local && set +a
pnpm exec tsx scripts/check-pending-migrations.ts
```

**Note:** With placeholder keys, probes falsely report “applied”. Script now exits with error if key is invalid.

---

## 3. Live Supabase state (this environment)

- `.env.local` has `SUPABASE_SERVICE_ROLE_KEY=placeholder` → **cannot apply or probe live DB from Cloud Agent VM**
- Production project ref: `cuxzzpsyufcewtmicszk` (from public URL)

**To complete migration apply:** Add real `SUPABASE_SERVICE_ROLE_KEY` (and optionally `DATABASE_URL`) to agent secrets or run locally:

```bash
set -a && source .env.local && set +a
node scripts/db/runMigrations.js
```

---

## 4. Schema ↔ code alignment

`bash scripts/audit-schema-refs.sh` (code refs with no `CREATE TABLE` in migrations, ≥5 refs):

| Table | Refs |
|-------|------|
| workflow_dead_letters | 5 |
| digital_binders | 5 |
| cron_job_runs | 5 |
| compliance_violations | 5 |

**Action:** Confirm these exist in live `pg_tables` (may come from baseline migrations with different patterns or `efh_migrations` applied out of band).

---

## 5. Auth & API discipline

`bash scripts/audit-auth-gaps.sh`:

| Class | Count | Notes |
|-------|-------|-------|
| NO_AUTH | 2 | `api/partners/barbershop-apprenticeship/apply`, `api/ping` |
| ROLE_BLIND admin | 0 | — |
| error.message leaks | 0 | — |
| REEXPORT checks | 4 | Verify target routes |

---

## 6. Legacy deploy & route references

### Canonical production (2026-Q2)

- **LMS:** Northflank `elevate-lms`, `Dockerfile.northflank-lms`, `.github/workflows/deploy-lms.yml`
- **Admin:** Northflank `elevate-admin`, `Dockerfile.northflank-admin`, `.github/workflows/deploy-admin.yml`
- **Health:** `GET /api/ping` on port 8080

### Stale references (docs only — no active workflow)

- `deploy-aws.yml` — **not in repo**; mentioned in older audit docs under `docs/audits/`
- `aws/ecs-task-lms.json` — **removed** from repo; CI blocks `aws/` (Northflank-only)
- `docs/platform-hardening-audit-2026-05-31.md` — cites `deploy-aws.yml` (update doc)

### Portal / learner route consolidation

`next.config.mjs` permanently redirects legacy trees to canonical paths:

- `/student`, `/student-portal/*` → `/learner/dashboard`
- `/employer-portal/*` → `/employer/*`
- Industry portals `/portal/barber`, etc. remain **real pages** (not wildcard-redirected)

---

## 7. Dead / corrupted tooling

| Script | Issue | Resolution |
|--------|-------|------------|
| `scripts/run-migrations-now.mjs` | Corrupted by over-aggressive secret sanitization (commit `d2e437f3d`) | Restored as thin wrapper → `db/runMigrations.js` |
| 36 files under `scripts/*migration*` | Overlap / historical | **Canonical:** `db/runMigrations.js`, `check-pending-migrations.ts`, `lint-migrations.cjs` |

---

## 8. Recommended hardening checklist

- [ ] Set real `SUPABASE_SERVICE_ROLE_KEY` in Northflank `elevate-production-env` and local `.env.local`
- [ ] Run `node scripts/db/runMigrations.js` once; confirm `efh_migrations` row count ≈ applied files
- [ ] Run `20260703000002_pending_migrations_bundle.sql` in SQL Editor if July singles still pending
- [ ] Add CI step: `node scripts/audit-migration-discipline.mjs` (fail on new timestamp collisions)
- [ ] Scrub `docs/audits/*` references to `deploy-aws.yml` where ECS is no longer used
- [ ] Resolve 4 schema-ref gap tables against live DB
- [ ] Review `api/partners/barbershop-apprenticeship/apply` auth (intentional public vs gap)

---

## Commands reference

```bash
# Migration discipline report
node scripts/audit-migration-discipline.mjs

# Migration SQL lint (CI)
node scripts/lint-migrations.cjs

# Duplicate CREATE TABLE analysis
node scripts/analyze-migration-duplicates.mjs

# Schema / auth / env audits
bash scripts/audit-schema-refs.sh
bash scripts/audit-auth-gaps.sh
bash scripts/audit-env-vars.sh

# Apply pending (real keys required)
node scripts/db/runMigrations.js
```

---

*Generated by Cloud Agent discipline audit. Re-run after credential setup or before production releases.*
