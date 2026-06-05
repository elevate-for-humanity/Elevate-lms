# Local development (admin dashboard)

This is the standard setup for staff and engineers. **Gitpod is not required.**

## Quick start

```bash
nvm use 20.19.2
corepack enable
pnpm install
cp .env.example .env.local   # then fill in Supabase + Stripe keys, or use Dev Studio after first boot
pnpm dev:admin
```

Open **http://localhost:3001** — admin dashboard (applications, enrollments, Dev Studio, settings).

## When to run the LMS (port 3000)

```bash
pnpm dev
```

Open **http://localhost:3000** only for:

- Testing `/apply`, enrollment checkout, lesson player
- Marketing / programs pages
- Verifying fixes that affect learners or public SEO

## Environment variables

Minimum to **boot** (many admin actions will still need real keys):

```env
NEXT_PUBLIC_SUPABASE_URL=https://cuxzzpsyufcewtmicszk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
NEXTAUTH_SECRET=dev-secret
SKIP_ENV_VALIDATION=true
NEXT_TELEMETRY_DISABLED=1
```

For production-like admin behavior, use the same keys as Northflank production or configure them in **Dev Studio → Secrets** (stored in `platform_secrets` / `app_secrets` when connected to Supabase).

## Production

| App | URL |
|-----|-----|
| Admin | https://admin.elevateforhumanity.org |
| Public site | https://www.elevateforhumanity.org |

## Health checks (after deploy)

```bash
curl -s http://localhost:3001/api/health | jq .status    # admin
curl -s http://localhost:3000/api/ready | jq .ready       # LMS
```

See `docs/audits/aws-ecs-decommission-2026-06.md` and `pnpm tsx scripts/northflank/verify-health-checks.ts`.

## Not using Gitpod

`.devcontainer/` and Gitpod preview bypasses in `proxy.ts` exist for optional cloud IDE use only. Your daily workflow is **localhost + admin on 3001**.
