# Diagnostics Guide

This document describes how to run the Elevate LMS diagnostic checks both **locally** and **in CI**.

---

## What the diagnostics cover

| Check                | Script                                 | Purpose                                                                                                                            |
| -------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| DB schema validation | `scripts/check-dashboard-schema.mjs`   | Verifies required Supabase tables and columns exist for program-holder dashboards, onboarding, notifications, and enrollment flows |
| Redirect scan        | `scripts/check-redirect-conflicts.mjs` | Detects Netlify/Next.js redirect conflicts, wildcard/base overlaps, and middleware/proxy conflicts                                 |
| Page-stub scan       | `scripts/audit-stubs.ts`               | Scans for placeholder/stub text (`coming soon`, `lorem ipsum`, fake/demo content) in `app/`, `components/`, and `lib/`             |
| Broken link audit    | `scripts/audit-broken-links.ts`        | Statically scans every `.tsx` / `.ts` file in `app/` and `components/` for `href` values that point to non-existent routes         |
| Image reference fix  | `scripts/fix-broken-images.sh`         | Normalizes stale/deleted image paths to the canonical locations under `public/images/`                                             |
| Production readiness | `scripts/validate-production.sh`       | Starts a local server on port 5005 and exercises core endpoints (LMS, payments, compliance, widgets)                               |

---

## Running diagnostics locally

### Prerequisites

- Node.js 20+
- pnpm (`npm install -g pnpm`)
- `tsx` (`npm install -g tsx`)
- `jq` (macOS: `brew install jq` / Ubuntu: `apt-get install -y jq`)
- A `.env.local` file with at minimum:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
  ```

### One-command wrapper

```bash
bash scripts/ci/run-dashboard-health-check.sh
```

This script runs all six checks in sequence, prints a color-coded summary, and exits with code `0` (healthy) or `1` (one or more checks failed).

### Running checks individually

```bash
# 1. Schema validation (requires Supabase credentials in env)
node scripts/check-dashboard-schema.mjs

# 2. Redirect conflict scan
node scripts/check-redirect-conflicts.mjs

# 3. Page-stub scan — writes stub-audit-report.json
tsx scripts/audit-stubs.ts

# 4. Static broken-link audit — writes broken-links-report.json
tsx scripts/audit-broken-links.ts

# 5. Normalize broken image references in source files
bash scripts/fix-broken-images.sh

# 6. Production readiness check (starts local server on port 5005)
bash scripts/validate-production.sh
```

> **Note:** `scripts/remove-mock-data.sh` is intentionally **excluded** from automated runs because it is interactive (requires a `y/n` confirmation) and performs irreversible file deletions. Run it manually after confirming database migrations are applied.

---

## Running diagnostics in CI (GitHub Actions)

The workflow `.github/workflows/dashboard-diagnostics.yml` runs automatically on **every push** to any branch and can also be triggered manually from the Actions tab (`workflow_dispatch`).

### Required repository secrets

| Secret                      | Purpose                                                          |
| --------------------------- | ---------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`  | Supabase project URL — used by `check-dashboard-schema.mjs`      |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key — used by `check-dashboard-schema.mjs` |

Set these in **Settings → Secrets and variables → Actions** in your GitHub repository. If they are absent the schema check is skipped with a warning instead of failing the run.

### Artifacts

After each run, `broken-links-report.json`, `stub-audit-report.json`, and `/tmp/link-check-results.json` (if produced) are uploaded as a workflow artifact named `dashboard-diagnostics-<run_number>` and retained for 14 days. Download them from the **Actions** tab → select the run → **Artifacts**.

### Blocking vs. non-blocking checks

| Check                | Blocking?                      | Rationale                                                    |
| -------------------- | ------------------------------ | ------------------------------------------------------------ |
| Schema validation    | No (`continue-on-error: true`) | Credentials may not be present in all environments           |
| Redirect scan        | No (`continue-on-error: true`) | Existing redirect debt may require staged cleanup            |
| Page-stub scan       | No (`continue-on-error: true`) | Legacy placeholder backlog may exist; report-first rollout   |
| Broken link audit    | No (`continue-on-error: true`) | Existing backlog; links should be reviewed, not block merges |
| Image reference fix  | **Yes**                        | Pure file-transform; always safe to run                      |
| Production readiness | No (`continue-on-error: true`) | Requires `simple-server.cjs`; not available in base CI image |

### Manual trigger

```
GitHub → Actions → "Dashboard Diagnostics" → Run workflow
```

---

## Interpreting results

- **Schema check failures** — a table or column is missing; apply the relevant Supabase migration and re-run.
- **Redirect scan failures** — conflicting redirect rules or wildcard ordering issues exist; resolve in `netlify.toml` and/or `next.config.mjs`.
- **Page-stub scan failures** — placeholder/demo content was detected; review `stub-audit-report.json` and replace with production content.
- **Broken link report** — review `broken-links-report.json` in the artifact; each entry shows the file and the unresolvable `href`. Fix the link or add a redirect.
- **Image fix** — if the script modified files, commit the changes (`git add -A && git commit -m "fix: normalize image paths"`).
- **Production readiness** — endpoint failures indicate a service that is not running locally. These are informational in CI; investigate before deploying to production.
