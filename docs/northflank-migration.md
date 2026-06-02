# Northflank migration (Elevate LMS)

Production is moving from AWS ECS (`elevate-lms-service` + `elevate-admin-service`) to **Northflank** project `elevate-platform`.

## Current Northflank layout

| Resource | ID / name |
|----------|-----------|
| Team | `elevates-team` |
| Project | `elevate-platform` |
| Service | `elevate-lms` (combined build+deploy, port **8080**) |
| Secret group | `elevate-production-env` (restricted to `elevate-lms`) |
| Default URL | `site--elevate-lms--pknyktykz4wg.code.run` |

There is **no separate admin service** yet. Until `elevate-admin` exists on Northflank, `admin.elevateforhumanity.org` can point at the same LMS service only if that image serves admin routes (today AWS uses `Dockerfile.admin` separately).

## Prerequisites

1. `NORTHFLANK_API_TOKEN` in `.env.local` or Cursor Cloud secrets (exact name).
2. Node 20 + pnpm: `corepack enable && pnpm install`.

```bash
export NORTHFLANK_TEAM_ID=elevates-team
export NORTHFLANK_PROJECT_ID=elevate-platform
export NORTHFLANK_LMS_SERVICE_ID=elevate-lms
# optional when admin service exists:
# export NORTHFLANK_ADMIN_SERVICE_ID=elevate-admin
```

## 1. Sync environment variables

```bash
set -a && source .env.local && set +a
pnpm tsx scripts/northflank/audit.ts
pnpm tsx scripts/northflank/sync-env.ts --dry-run
pnpm tsx scripts/northflank/sync-env.ts --execute
```

**Full parity with AWS SSM** (recommended before cutover):

```bash
bash scripts/northflank/export-ssm-env.sh > exports/northflank-env.production.json
pnpm tsx scripts/northflank/sync-env.ts --file exports/northflank-env.production.json --execute
```

Important runtime values:

- `PORT=8080` (Northflank public port — not 3000)
- `HOSTNAME=0.0.0.0`
- All `NEXT_PUBLIC_*` build-time keys from `aws/buildspec-lms.yml` / manifest

After sync, **redeploy** `elevate-lms` in the Northflank UI.

## 2. Register and verify domains

Domains must exist on the **team** before they can attach to a service port.

```bash
pnpm tsx scripts/northflank/register-domains.ts
# Add TXT records at DNS provider, then:
pnpm tsx scripts/northflank/register-domains.ts --verify
```

Targets:

- `elevateforhumanity.org` (apex — requires CNAME flattening / ALIAS at DNS)
- `www.elevateforhumanity.org`
- `admin.elevateforhumanity.org`

## 3. Attach domains to the service port

```bash
pnpm tsx scripts/northflank/configure-domains.ts --dry-run
pnpm tsx scripts/northflank/configure-domains.ts --execute
```

Northflank shows **CNAME targets** per port in the UI. Point DNS there after verification.

## 4. Cutover checklist

- [ ] Secret group has production keys (not `dev-secret` placeholders)
- [ ] Domains verified + TLS active on Northflank
- [ ] DNS CNAMEs updated (www, admin, apex)
- [ ] Stripe webhook URLs → Northflank hostnames
- [ ] Cron / external callbacks updated
- [ ] Smoke: login, LMS lesson, admin dashboard, webhooks
- [ ] Decommission ECS after stable window

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/northflank/audit.ts` | List projects, services, secrets, ports |
| `scripts/northflank/sync-env.ts` | Push env to `elevate-production-env` |
| `scripts/northflank/register-domains.ts` | Register team domains + print TXT |
| `scripts/northflank/configure-domains.ts` | Attach hostnames to HTTP port |
| `scripts/northflank/export-ssm-env.sh` | Export AWS SSM `/elevate/*` to JSON |
