# DigitalOcean recovery deployment

This recovery path keeps Marketing, Admin, and the student LMS deployable from
GitHub when the primary Northflank environment is unavailable. It uses three
separate DigitalOcean App Platform apps so each service can later receive its
own production hostname without path-routing the portals through one origin.

## Repository configuration

| Service   | App spec             | Dockerfile             | Health check   | App name               |
| --------- | -------------------- | ---------------------- | -------------- | ---------------------- |
| Marketing | `.do/marketing.yaml` | `Dockerfile.marketing` | `/api/ping`    | `elevate-dr-marketing` |
| Admin     | `.do/admin.yaml`     | `Dockerfile.admin`     | `/api/version` | `elevate-dr-admin`     |
| LMS       | `.do/lms.yaml`       | `Dockerfile.lms`       | `/api/version` | `elevate-dr-lms`       |

The `Deploy DigitalOcean recovery` GitHub Actions workflow is the deployment
controller. App Platform source auto-deploy is disabled in every app spec, so a
push to `main` cannot unexpectedly create or update billable recovery services.

## One-time account setup

1. In DigitalOcean, confirm that the GitHub account has authorized App Platform
   to read `elevate-for-humanity/Elevate-lms`. Creating the DigitalOcean account
   through GitHub does not always grant repository access to App Platform.
2. In DigitalOcean, create a personal access token with read/write access to App
   Platform.
3. In GitHub, open **Settings → Secrets and variables → Actions**, create a
   repository secret named `DIGITALOCEAN_ACCESS_TOKEN`, and paste the token.
4. Confirm that these existing production repository secrets are present:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, and `NEXTAUTH_SECRET`.
5. Optional application secrets are passed when they exist: `SENDGRID_API_KEY`,
   `CRON_SECRET`, AI provider keys, and career-data provider keys. Add
   `ADMIN_GITHUB_TOKEN` only if the Admin app cannot load its existing
   `GITHUB_TOKEN` from the `platform_secrets` table.

Never commit a DigitalOcean token or application secret to an app spec. The
specs contain placeholders only; GitHub substitutes encrypted Actions secrets
during the deployment.

## First deployment

After this configuration is merged to `main`, use either entry point:

- Admin Dashboard → Studio → Deployment Control → **Deploy Backup**, then click
  the confirmation button.
- GitHub → Actions → **Deploy DigitalOcean recovery** → Run workflow. Select a
  service or `all`, and enter `DEPLOY_BACKUP`.

The first `all` run creates three App Platform apps. Each app starts with one
fixed shared 1 vCPU / 1 GiB container. At current App Platform pricing, the
baseline is $10 per app, or $30 per month for all three while they remain
running. This is a recovery baseline; resize Admin or LMS if runtime memory or
traffic requires it.

The workflow prints build and deployment logs and writes each generated
`ondigitalocean.app` URL to the GitHub job summary. Validate the endpoints before
changing DNS:

- Marketing: `https://<generated-host>/api/ping`
- Admin: `https://<generated-host>/api/version`
- LMS: `https://<generated-host>/api/version`

## PWA and DNS failover

The LMS image contains the existing PWA manifest, service worker, offline page,
and portal code. The recovery deployment does not itself move production
traffic. After the generated LMS URL passes login and portal checks, point the
canonical `app.elevateforhumanity.org` DNS record or traffic manager to the
DigitalOcean app and attach the custom domain in App Platform.

Keeping the canonical hostname means installed PWAs continue using the same
origin. Supabase authentication still needs network access, and any temporary
DigitalOcean test hostname used for login must also be added to Supabase's
allowed redirect URLs. Do not cut over Admin, Marketing, or LMS DNS until the
corresponding health check and authenticated smoke test pass.

## Rollback

DNS rollback is independent of the application deployment: restore the
canonical records to the primary provider after it is healthy. The DigitalOcean
apps can remain warm for recovery or be deleted in the DigitalOcean control
panel to stop future component charges.
