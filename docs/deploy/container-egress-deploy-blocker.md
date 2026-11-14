# Container egress deploy blocker runbook

Use this runbook when Codex, Devin, Dev Studio, or another cloud container cannot trigger a Northflank deploy even though the application code is committed.

## Classification

When the deploy attempt fails with these messages, classify it as a container networking/proxy/DNS blocker, not an app build failure:

- `CONNECT tunnel failed, response 403`
- `Could not resolve host: api.northflank.com`
- `getaddrinfo EAI_AGAIN api.northflank.com`
- GitHub workflow dispatch failing before authentication because the container proxy blocks `api.github.com`

Recommended triage split:

| Category | Likelihood |
| --- | ---: |
| Application code issue | 0% |
| App deployment configuration issue | 5% |
| Container networking / proxy / DNS issue | 95% |

## Required checks

Run these commands from the blocked container and attach the output to the task:

```bash
env | rg -i '^(https?|all|no)_proxy=|NORTHFLANK|GITHUB|GH_' || true
nslookup api.northflank.com || true
dig api.northflank.com || true
curl -v https://api.northflank.com/v1/projects --max-time 20
curl -v https://api.github.com --max-time 20
HTTPS_PROXY= HTTP_PROXY= ALL_PROXY= https_proxy= http_proxy= all_proxy= \
  curl -v https://api.northflank.com/v1/projects --max-time 20
```

Interpretation:

- Proxy path returns `CONNECT tunnel failed, response 403`: the outer proxy/firewall is denying outbound HTTPS.
- Direct/no-proxy path returns DNS failures: the container does not have usable public DNS without the proxy.
- Both failures together mean the deploy request cannot reach Northflank or GitHub from that container.

## What Codex/Devin should fix versus not fix

Do fix:

1. Verify the repo has deploy workflows that can run from GitHub Actions, which has normal outbound internet.
2. Verify the production workflow is manually dispatchable through `workflow_dispatch`.
3. Verify Northflank secrets are present in GitHub repository secrets or Northflank secret groups.
4. Verify Dev Studio deploy controls call a server route or GitHub workflow relay that can deploy LMS and Admin separately.
5. Keep LMS and Admin deploys separated unless using the explicit full-platform workflow.
6. Add or improve diagnostic output so operators see `proxy/DNS blocked` instead of a fake build error.

Do not waste time:

- Rewriting app code to fix `CONNECT tunnel failed`.
- Rebuilding Next.js to fix `Could not resolve host`.
- Retrying the same Northflank `curl` from the same blocked container without changing network policy.
- Treating the Northflank token as the first suspect when the request never reaches Northflank authentication.

## Correct deploy paths

### Preferred path when the cloud container is blocked

Trigger GitHub Actions from a network that can reach GitHub:

```bash
curl -X POST \
  -H 'Accept: application/vnd.github+json' \
  -H 'Authorization: Bearer <github-token-with-workflow-scope>' \
  https://api.github.com/repos/elevateforhumanity/Elevate-lms/actions/workflows/deploy-production-dispatch.yml/dispatches \
  -d '{"ref":"main"}'
```

The workflow `deploy-production-dispatch.yml` deploys both Northflank services from GitHub Actions. Use `deploy-admin.yml` or `deploy-lms.yml` for one service only.

### Direct Northflank path when egress works

Only use this path from a shell that can resolve and reach `api.northflank.com`:

```bash
NORTHFLANK_PROJECT_ID=elevate-platform \
NORTHFLANK_TEAM_ID=elevates-team \
NORTHFLANK_LMS_SERVICE_ID=elevate-lms \
NORTHFLANK_ADMIN_SERVICE_ID=elevate-admin \
pnpm tsx scripts/northflank/trigger-build.ts elevate-admin

NORTHFLANK_PROJECT_ID=elevate-platform \
NORTHFLANK_TEAM_ID=elevates-team \
NORTHFLANK_LMS_SERVICE_ID=elevate-lms \
NORTHFLANK_ADMIN_SERVICE_ID=elevate-admin \
pnpm tsx scripts/northflank/trigger-build.ts elevate-lms
```

If this fails with DNS/proxy errors, stop and use the GitHub Actions path.

## Definition of done

A deploy issue caused by blocked container egress is resolved only when one of these is true:

- The container network policy allows HTTPS CONNECT to both `api.github.com` and `api.northflank.com`.
- A GitHub Actions workflow run has been successfully dispatched from outside the blocked container.
- A local machine or operator shell with unrestricted egress has triggered the Northflank builds.

A successful code commit alone is not a production deploy.
