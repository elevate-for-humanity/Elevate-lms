# Northflank: separate LMS and Admin CI/CD

Production runs as **two Northflank services**, not one:

| Service | Dockerfile | GitHub workflow | Public host |
|---------|------------|-----------------|-------------|
| `elevate-lms` | `Dockerfile.northflank-lms` | `deploy-lms.yml` | `www.elevateforhumanity.org` |
| `elevate-admin` | `Dockerfile.northflank-admin` | `deploy-admin.yml` | `admin.elevateforhumanity.org` |

Northflank’s word **“combined”** means build and deploy live on the **same service resource** (not “LMS + admin in one container”). Elevate still uses two combined services—one per app.

## Scoped scripts

Pass a service id (or `NORTHFLANK_TARGET_SERVICE=lms|admin`) so a deploy does not touch the other service:

```bash
pnpm tsx scripts/northflank/configure-services.ts elevate-admin --execute
pnpm tsx scripts/northflank/patch-ephemeral-storage.ts elevate-lms --execute
pnpm tsx scripts/northflank/verify-health-checks.ts elevate-admin
```

Full platform (both services):

```bash
pnpm tsx scripts/northflank/configure-services.ts --all --execute
pnpm tsx scripts/northflank/verify-health-checks.ts --all
```

Or use workflow **Deploy production (both services)** (`deploy-production-dispatch.yml`).

## Guard

`bash scripts/check-admin-lms-separation.sh` fails if `deploy-lms.yml` or `deploy-admin.yml` configure both services in one run.

AWS/ECS hosting decommission: `docs/audits/aws-ecs-decommission-2026-06.md`.
