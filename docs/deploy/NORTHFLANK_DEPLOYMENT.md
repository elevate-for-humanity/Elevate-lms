# Northflank Deployment Setup

Current production deployment target: **Northflank**.

AWS/ECS/SSM files remain in the repo as legacy migration reference only. Do not use the AWS deploy path for current production deploys unless AWS is explicitly re-enabled.

## Required GitHub configuration

Northflank should build from the GitHub repository connected to the production service:

```text
elevateforhumanity/Elevate-lms
branch: main
```

Use a GitHub token only in the Northflank secret/environment UI. Do not commit it to the repository.

Required repository/runtime variable:

```text
GITHUB_TOKEN=<GitHub PAT with repo/workflow access>
```

This token is used by Dev Studio, GitHub API file operations, and workflow dispatch features.

## Required Northflank runtime variables

Configure these on the relevant Northflank services/jobs:

```text
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
NEXT_PUBLIC_SITE_URL=https://www.elevateforhumanity.org
NEXT_PUBLIC_ADMIN_URL=https://admin.elevateforhumanity.org
NEXT_PUBLIC_SUPABASE_URL=<supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>
GITHUB_TOKEN=<github-token>
CRON_SECRET=<cron-secret>
STUDIO_SHELL_SECRET=<studio-shell-secret>
STUDIO_TOKEN_SECRET=<studio-token-secret>
STUDIO_SHELL_WS_URL=<internal-studio-shell-ws-url>
STUDIO_SHELL_WS_URL_PUBLIC=<public-or-provider-routable-studio-shell-ws-url>
```

Add payment, email, AI, Redis, and storage provider variables as required by the active service.

## Package registry preflight

Before dependency installation, run `pnpm run ci:registry` or `node scripts/verify-package-registry.mjs next`. A 403 from this step means the Northflank builder cannot fetch public npm packages and the fix is provider/network/registry configuration, not a Next.js code change.

## Northflank install hardening

Northflank builds are non-interactive and may restore a cached `node_modules` directory. Use `CI=true` for dependency installation so pnpm can recreate `node_modules` without prompting. This avoids `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY` during `pnpm install --frozen-lockfile`.

## Build commands

Run LMS and Admin as separate Northflank services or separate build jobs.

**LMS:**

```bash
pnpm run ci:install
pnpm run build:lms:phased
pnpm start
```

**Admin:**

```bash
pnpm run ci:install
pnpm run build:admin
pnpm --filter @elevate/admin start
```

If the Northflank builder OOMs, raise the build memory/CPU allocation first. The build-stability investigation shows the failure is route-surface/heap pressure, not AWS-specific behavior.

## Dev Studio shell

Dev Studio terminal requires a separately deployed studio-shell runtime/container and these shared values configured on both Admin and shell runtimes as appropriate:

```text
STUDIO_SHELL_SECRET
STUDIO_TOKEN_SECRET
STUDIO_SHELL_WS_URL
STUDIO_SHELL_WS_URL_PUBLIC
GITHUB_TOKEN
```

PASS condition:

```text
Admin → Dev Studio → Terminal connects and returns a shell prompt.
```

## Deploy trigger

After pushing to GitHub `main`, Northflank should trigger the connected service deployment automatically if Git integration is enabled. If auto-deploy is disabled, trigger a manual deploy from the Northflank dashboard after the push.
