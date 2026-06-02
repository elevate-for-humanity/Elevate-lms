# Northflank production migration (from AWS ECS)

Staging on Northflank is validated. Production cutover = **two services** (LMS + Admin), **env parity** with AWS SSM, **custom domains**, then DNS.

## Services

| Service | Dockerfile | Build (CI / Northflank) | Domain |
|---------|--------------|-------------------------|--------|
| **LMS** | `Dockerfile.package` | `pnpm install --frozen-lockfile` → `pnpm run build:lms:phased` | `www.elevateforhumanity.org` |
| **Admin** | `Dockerfile.admin` | `cd apps/admin && NODE_OPTIONS='--max-old-space-size=8192' pnpm build` | `admin.elevateforhumanity.org` |

Runtime: port **3000**, health check **`GET /api/health`**, command `node server.js` (LMS) / `node apps/admin/server.js` (Admin).

Recommended plan size: **≥ 4 vCPU / 8–16 GB RAM** per service (match or beat what worked in staging).

## Secrets (migrate from AWS)

AWS today: SSM path `/elevate/*` + ECS task `secrets` (see `aws/ecs-task-lms.json`, `aws/buildspec-lms.yml`).

Northflank: project **secret group** `elevate-production-env` (environment type), attached to LMS + Admin services.

### Option A — Export SSM (complete)

```bash
# Requires AWS CLI credentials for account 954718262498
bash scripts/northflank/export-ssm-env.sh exports/northflank-env.production.json

pnpm tsx scripts/northflank/sync-secrets.ts --file exports/northflank-env.production.json --execute
```

Do **not** commit `exports/northflank-env.production.json`.

### Option B — Cursor Cloud secrets + sync script

Add keys from `scripts/northflank/env-keys-manifest.txt` (64+ names) in [Cloud Agents secrets](https://cursor.com/dashboard/cloud-agents), then:

```bash
pnpm tsx scripts/northflank/sync-secrets.ts --execute
```

The script merges manifest keys from `process.env` + production URL defaults.

### Minimum required (same as `scripts/validate-env.js`)

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_ADMIN_URL`, `NEXTAUTH_SECRET`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SENDGRID_API_KEY`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `CRON_SECRET`, `OPENAI_API_KEY` or `GROQ_API_KEY`

Runtime still loads **`platform_secrets`** from Supabase over `process.env` when set in Dev Studio.

## Automation scripts

| Script | Purpose |
|--------|---------|
| `pnpm tsx scripts/northflank/audit.ts` | List project/service IDs, ports, domains |
| `pnpm tsx scripts/northflank/sync-secrets.ts` | Push env vars to Northflank secret group |
| `pnpm tsx scripts/northflank/configure-domains.ts` | Attach custom domains to HTTP ports |
| `bash scripts/northflank/export-ssm-env.sh` | Dump SSM → JSON |

### Cursor / agent env for automation

```
NORTHFLANK_API_TOKEN=...
NORTHFLANK_TEAM_ID=elevates-team
NORTHFLANK_PROJECT_ID=...        # from audit.ts
NORTHFLANK_LMS_SERVICE_ID=...
NORTHFLANK_ADMIN_SERVICE_ID=...
```

Restart the cloud agent after adding secrets.

## Custom domains

1. Run `pnpm tsx scripts/northflank/configure-domains.ts --execute` (or set domains in Northflank UI → Service → Ports).
2. Copy each **CNAME target** from Northflank.
3. DNS:
   - `www` → LMS CNAME
   - `admin` → Admin CNAME
   - Apex `elevateforhumanity.org` → redirect to `www` or ALIAS to Northflank (registrar-dependent)
4. Wait for TLS (Let’s Encrypt via Northflank).

## Cutover checklist

- [ ] Env secret group synced; redeploy LMS + Admin
- [ ] Health checks green on `*.code.run` URLs
- [ ] Custom domains + TLS active
- [ ] Stripe webhooks → production Northflank URLs
- [ ] Cron / external integrations updated
- [ ] Smoke: login, enrollment, email, payment test mode
- [ ] DNS cutover (low TTL)
- [ ] Keep AWS ECS scaled down 3–7 days for rollback

## Decommission AWS (after stable)

- ECS services `elevate-lms-service`, admin service
- CodeBuild projects `elevate-lms-build`, admin build
- ALB rules (if only used for Elevate)
- SSM can remain as backup until Northflank is proven
