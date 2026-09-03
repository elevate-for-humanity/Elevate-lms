# Manual GitHub deploy package runbook

Use this when Codex/Devin/Dev Studio has committed changes but the container cannot reach GitHub or Northflank because of proxy/DNS restrictions.

## Rule

Do **not** keep retrying Northflank from the blocked container. Package the committed changes as a patch, apply the patch from a machine that can reach GitHub, push the target branch, and let GitHub Actions/Northflank deploy.

## Export the patch from Codex

```bash
pnpm run export:manual-deploy-patch -- --base=<base-sha-or-ref> --target-branch=work
```

If no `--base` is provided, the script tries `origin/work`, `origin/main`, `main`, then `HEAD~1`.

Default output:

- `/tmp/elevate-codex-deploy/codex-fixes.patch`
- `/tmp/elevate-codex-deploy/APPLY_AND_DEPLOY.md`

## Apply the patch locally

```bash
git clone https://github.com/elevateforhumanity/Elevate-lms.git
cd Elevate-lms
git checkout work
git pull origin work
git apply --check /path/to/codex-fixes.patch
git apply /path/to/codex-fixes.patch
git status
git add .
git commit -m "Reconcile documentation with implementation and fix system failures"
git push origin work
```

## Trigger deployment after push

Use one of these from an unrestricted environment:

```bash
gh workflow run deploy-production-dispatch.yml --ref work
```

or run **Deploy production (both services)** from the GitHub Actions UI.

Use `deploy-admin.yml` for admin-only deploys and `deploy-lms.yml` for LMS-only deploys.

## Required deploy secrets

At minimum, production deployment needs these in GitHub repository secrets and/or Northflank secret groups:

- `NORTHFLANK_API_TOKEN`
- `NORTHFLANK_TEAM_ID` (default: `elevates-team`)
- `NORTHFLANK_PROJECT_ID` (default: `elevate-platform`)
- `NORTHFLANK_LMS_SERVICE_ID` (default: `elevate-lms`)
- `NORTHFLANK_ADMIN_SERVICE_ID` (default: `elevate-admin`)

Live feature validation may also require Supabase, Stripe, AI provider, email, storage, workforce, and credential-provider secrets.
