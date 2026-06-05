# AWS ECS decommission checklist (2026-06)

Production hosting for Elevate LMS and Admin is **Northflank only**. This repo must not deploy to AWS ECS. Remaining work is mostly **outside git**.

## Repo status (automated guards)

| Check | Script / workflow |
|-------|-------------------|
| No `deploy-aws.yml` or ECS deploy workflows | `node scripts/verify-no-aws-deploy.mjs` |
| No `aws/ecs-task-*.json` or `Dockerfile.package` | same |
| No Studio Shell wired to legacy ECS task defs | `node scripts/verify-no-studio-shell.mjs` |
| LMS vs Admin deploy isolation | `bash scripts/check-admin-lms-separation.sh` |

Both verify scripts run in `.github/workflows/integrity-gate.yml`.

## GitHub (manual)

| Action | Where |
|--------|--------|
| Delete `AWS_ACCESS_KEY_ID` | Repository → Settings → Secrets and variables → Actions |
| Delete `AWS_SECRET_ACCESS_KEY` | same |
| Confirm deploy workflows only use `NORTHFLANK_*` | `.github/workflows/deploy-lms.yml`, `deploy-admin.yml` |

No workflow in this repository should reference AWS credentials for deploy.

### Verified 2026-06-05 (Cloud Agent)

- **Repo Actions secrets:** `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are **not present** (nothing to delete).
- **Org / environment secrets:** checked `Production`, `elevate-lms`, `elevate-admin` — no AWS deploy secrets.
- **Present deploy secret:** `NORTHFLANK_API_TOKEN` (used by `deploy-lms.yml` / `deploy-admin.yml`).

## AWS Console (manual)

If traffic still hits old infrastructure, production will look “stale” even when `main` builds succeed on Northflank.

### Verified 2026-06-05 (Cloud Agent)

- **`aws sts get-caller-identity`:** failed — no `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` in this VM (only `AWS_DEFAULT_REGION=us-east-1`).
- **Cannot** scale down ECS or remove ALB from here. Add AWS credentials to Cloud Agent secrets (read-only `ecs:Describe*`, `elasticloadbalancing:Describe*`, `ecs:UpdateService`) or run decommission in Console manually.

| Action | Notes |
|--------|--------|
| Scale ECS services `elevate-lms` / `elevate-admin` to **0** or delete services | Cluster `elevate-cluster` (if still present) |
| Remove ALB listeners / target groups pointing at ECS | After DNS cutover |
| Retain S3 buckets used by app code (e.g. lesson media via `@aws-sdk/client-s3`) | **Not** the same as ECS hosting — do not delete buckets without inventory |

## DNS (Durable + Northflank)

Canonical runbook: [`docs/northflank-dns-durable.md`](../northflank-dns-durable.md)

| Host | Target |
|------|--------|
| `www.elevateforhumanity.org` | CNAME → Northflank (LMS service) |
| `admin.elevateforhumanity.org` | CNAME → Northflank (Admin service) |
| Apex `elevateforhumanity.org` | **URL forward** to `https://www…` — do **not** A-record apex to old ALB IPs |

### Verified 2026-06-05 (Cloud Agent)

| Host | DNS (8.8.8.8) | HTTPS |
|------|----------------|-------|
| `www.elevateforhumanity.org` | CNAME → `*.elev-5vfk.dns.northflank.app` → `34.145.171.7` | `/api/ping` **200** |
| `admin.elevateforhumanity.org` | CNAME → Northflank | `/api/ping` **200** |
| `elevateforhumanity.org` (apex) | **no A/CNAME** from this resolver | **not configured** — add Durable URL forward to `https://www.elevateforhumanity.org` |

No Durable API credentials in this environment; apex forward must be set in **Durable / SystemDNS** UI.

## Northflank

| Item | Value |
|------|--------|
| Project | `elevate-platform` |
| LMS service | `elevate-lms` → `Dockerfile.northflank-lms` |
| Admin service | `elevate-admin` → `Dockerfile.northflank-admin` |
| Secrets | `elevate-production-env` secret group |
| Deploy | GitHub Actions or `pnpm tsx scripts/northflank/deploy-live.ts --execute` |

Separate CI/CD per service: [`docs/deploy/northflank-separate-lms-admin.md`](../deploy/northflank-separate-lms-admin.md).

## Deploy failures are not “unmerged ECS”

`main` does not run ECS deploys. Historical Northflank build failures (e.g. `ERR_PNPM_ENOSPC`, `next: not found`, `pnpm store prune`) are Docker/build issues on Northflank — see `docs/audits/northflank-pnpm-fetch-enospc-audit.md`.

### Verified 2026-06-05 (Cloud Agent)

- Ran `configure-services.ts --all --execute`: both services on `nf-compute-800-32` build / `nf-compute-400` runtime, **32768 MB** ephemeral, health `/api/ping`.
- `verify-deployed-sha.ts`: **stale** SHAs on running pods (last builds **FAILURE**); live sites still serve older images.
- Latest failure (`deploy-admin` run for #276): `ERR_PNPM_ENOSPC` on `/mnt/pnpm-cache/node_modules` during install+build in one Docker layer.
- **Mitigation in PR:** split `pnpm install` and `next build` into separate `RUN` steps in `Dockerfile.northflank-*` (same unified cache mount).
- After merge to `main`, run: `pnpm tsx scripts/northflank/trigger-build.ts elevate-lms` and `elevate-admin`, or push to `main` to trigger workflows.

## Optional: open PRs still carrying `aws/`

Before merging large stabilization PRs, confirm the diff does **not** re-add `aws/ecs-task-*.json` or `deploy-aws.yml`. Rebase or drop those paths if present.
