# ELEVATE FOR HUMANITY — PRODUCTION AUDIT PROMPT

## AUDIT CONTEXT

**Repository:** elevate-for-humanity/Elevate-lms
**Branch:** main
**Git SHA:** 8b4e720c3d (from merge of #498)

**Status:** P0 RELEASE IN PROGRESS

---

## PREVIOUS FIX (Applied in #498)

The following was already fixed:
- Health probe port: 8080 → 3000
- trigger-build.ts: Uses DEPLOY_BRANCH instead of hardcoded SHA
- DEPLOY_BRANCH: Set to `main` for production deployment

---

## YOUR TASK

Act as a Senior Platform Engineer, DevOps Engineer, SRE, Next.js Engineer, and Northflank/Kubernetes Specialist to perform a complete, line-by-line production audit and repair all verified failures.

---

## SERVICES IN SCOPE

1. **Marketing**
   - Northflank service: `elevate-marketing`
   - Domain: `www.elevateforhumanity.org`
   - Dockerfile: `Dockerfile.marketing`

2. **LMS**
   - Northflank service: `elevate-lms`
   - Domain: `app.elevateforhumanity.org`
   - Dockerfile: `Dockerfile.lms`

3. **Admin**
   - Northflank service: `elevate-admin`
   - Domain: `admin.elevateforhumanity.org`
   - Dockerfile: `Dockerfile.northflank-admin`

---

## P0 — PRESERVE PRODUCTION AND CREATE EVIDENCE

Before changing anything:

1. Record the current Git branch and commit SHA
2. Record uncommitted changes
3. Export Northflank root configuration for all 3 Combined Services
4. Capture build status
5. Capture deployment status
6. Capture replica state
7. Capture build logs
8. Capture runtime logs
9. Record container ports
10. Record health checks
11. Record environment variable names (no secrets)
12. Record domains and ingress mappings
13. Record CPU and memory configuration
14. Record restart counts
15. Record upstream status

**Do not expose passwords, API keys, or credentials in logs.**

---

## P0 — FIVE CONFLICTING SHA / RELEASE IDs (CRITICAL)

**This is a production release-integrity failure.** Five different SHA values means the repository, build, image, deployment, and live runtime are NOT using one authoritative release ID.

### AUDIT ALL FIVE IDs

Locate and record every SHA or build identifier in:

1. Git repository HEAD
2. Northflank build source commit
3. Docker image metadata or tag
4. Northflank deployment/revision
5. Live `/api/version` response

Also search for competing values in:
- GIT_SHA, COMMIT_SHA, GITHUB_SHA, SOURCE_COMMIT
- NEXT_PUBLIC_GIT_SHA, NEXT_PUBLIC_COMMIT_SHA
- BUILD_ID, RELEASE_ID, IMAGE_TAG
- Docker ARG/ENV values
- Northflank environment variables
- CI workflow outputs
- route handlers, middleware, response headers
- static JSON files, next.config

**Search commands:**
```bash
git rev-parse HEAD
git rev-parse --short=12 HEAD

grep -RIn --exclude-dir=node_modules --exclude-dir=.git \
  -E "GIT_SHA|COMMIT_SHA|GITHUB_SHA|BUILD_ID|RELEASE_ID|NEXT_PUBLIC.*SHA" .
```

### CREATE A SHA SOURCE MATRIX

| Source | Marketing | LMS | Admin | Expected | Status |
|--------|-----------|-----|-------|----------|--------|
| Repository HEAD | | | | | |
| Northflank build commit | | | | | |
| Docker image label/tag | | | | | |
| Northflank deployment revision | | | | | |
| /api/version | | | | | |
| Runtime environment GIT_SHA | | | | | |
| BUILD_ID | | | | | |

### DISTINGUISH SHA FROM BUILD ID

- **Git SHA**: Source code identifier (must match the commit used to build)
- **Next.js BUILD_ID**: Next.js build identifier (separate field)
- **Northflank build ID**: Build job identifier (separate field)
- **Northflank deployment ID**: Deployment/revision identifier (separate field)
- **Docker image digest**: Immutable image identifier (separate field)

Do not place all under a generic "version" field.

### ESTABLISH ONE AUTHORITATIVE RELEASE SHA

The authoritative release SHA must be:
```
git rev-parse HEAD
```

Use consistent variable name:
```bash
GIT_SHA=<full SHA>
GIT_SHA_SHORT=<first 12 chars>
```

### FIX /api/version

Return normalized response:
```json
{
  "service": "marketing | lms | admin",
  "gitSha": "<full authoritative Git SHA>",
  "gitShaShort": "<first 12 characters>",
  "nextBuildId": "<Next.js BUILD_ID>",
  "northflankBuildId": "<if provided>",
  "northflankDeploymentId": "<if provided>",
  "imageDigest": "<if provided>",
  "environment": "production",
  "builtAt": "<timestamp>",
  "timestamp": "<response timestamp>"
}
```

**Rules:**
- Do NOT return Next.js BUILD_ID in gitSha field
- Do NOT return deployment ID in gitSha field
- Do NOT return "dev" in production
- If GIT_SHA is missing, report `"gitSha": null, "releaseIdentityStatus": "missing"`

### REMOVE STALE FALLBACKS

**Remove fallback chains like:**
```javascript
process.env.GIT_SHA ||
process.env.COMMIT_SHA ||
process.env.GITHUB_SHA ||
process.env.NEXT_PUBLIC_GIT_SHA ||
"dev"
```

Use ONE authoritative variable. Derive aliases from the same source if needed.

### VERIFY LIVE IDENTITY

```bash
curl -fsS https://www.elevateforhumanity.org/api/version
curl -fsS https://app.elevateforhumanity.org/api/version
curl -fsS https://admin.elevateforhumanity.org/api/version
```

All three must return the **same intended production commit SHA**.

### RELEASE GATE

Not complete until:
- One authoritative Git SHA identified
- Repository HEAD matches build source commit
- Docker build receives that SHA
- Runtime container receives that SHA
- /api/version reports that SHA
- All ready replicas report that SHA
- All three services report intended SHA
- Next.js BUILD_ID stored separately
- Northflank build ID stored separately
- Deployment ID stored separately
- Image digest stored separately
- No endpoint returns "dev"
- No stale SHA in Northflank config

---

## P0 — NORTHFLANK ROOT-LEVEL CONFIGURATION

Audit every root-level setting line by line for Marketing, LMS, and Admin:

- Project, Service ID, Service type, Combined Service path
- Repository, Branch, Build trigger, Auto-deployment
- Dockerfile path, Build context, Build arguments
- Runtime image, Container port, Public port, Protocol
- Environment variables, Health checks (startup, readiness, liveness)
- Replica count, CPU/Memory requests/limits
- Ingress, Domain mapping, TLS, DNS
- Deployment timeout, Graceful shutdown, Rollback config

---

## P0 — FORCE AND VERIFY NEXT.JS STANDALONE

Verify every application has:
```javascript
output: "standalone"
```

Build each service:
```bash
pnpm --filter @elevate/marketing build
pnpm --filter @elevate/lms build
pnpm --filter @elevate/admin build
```

After build, locate artifacts:
```bash
find . -path "*/.next/standalone/*" -name server.js -print
find . -path "*/.next/*" -name BUILD_ID -print
```

**Do NOT use:**
- `next dev`, `pnpm dev`, `npm run dev`
- Hard-coded `CMD ["node", "server.js"]` unless verified

---

## P0 — DOCKERFILE LINE-BY-LINE AUDIT

Audit side by side:
- `Dockerfile.marketing`
- `Dockerfile.lms`
- `Dockerfile.northflank-admin`

Check:
- Base image, Node version, pnpm version
- Lockfile usage, dependency installation
- Build context, standalone output path
- COPY source/dest paths, static files
- WORKDIR, ENV, ARG, EXPOSE, CMD
- Signal handling, graceful shutdown

**Runtime contract (all 3 services must match):**
```
NODE_ENV=production
HOSTNAME=0.0.0.0
PORT=3000
EXPOSE 3000
```

---

## P0 — BUILD LOG AUDIT

Retrieve complete build logs for all 3 services.

For every error/warning, record:
- Timestamp, service, build ID
- Exact message, file, line
- Build stage, root cause
- Severity (P0/P1/P2)
- Fix and verification

**P0 = build failure, missing artifact, wrong CMD, image creation failure**
**P1 = runtime-risk warning, deprecated behavior, missing env var**
**P2 = non-blocking warning**

---

## P0 — RUNTIME LOG AUDIT

Retrieve complete runtime logs. Inspect for:
- Process exit, crash, restart, CrashLoopBackOff
- OOM, SIGTERM, startup timeout
- Missing server.js, module not found
- Supabase/database errors, auth errors
- Port binding errors (localhost vs 0.0.0.0)
- Wrong Git SHA, old build reuse

---

## P0 — HEALTH ENDPOINTS

Implement and verify in ALL 3 applications:

**GET /api/ping** (liveness only)
- No Supabase, no external API, no auth
- Return JSON 200 while process responsive

**GET /api/health** (readiness)
- No auth, return JSON 200 when can accept traffic
- Not expensive dependency check per probe

**GET /api/version** (release verification)
```json
{
  "service": "<name>",
  "gitSha": "<full SHA>",
  "gitShaShort": "<12 chars>",
  "nextBuildId": "<BUILD_ID>",
  "environment": "production",
  "builtAt": "<timestamp>",
  "timestamp": "<now>"
}
```

Test internal:
```bash
curl -fsS http://127.0.0.1:3000/api/ping
curl -fsS http://127.0.0.1:3000/api/health
curl -fsS http://127.0.0.1:3000/api/version
```

Test external for all 3 domains.

---

## P0 — NORTHFLANK HEALTH CONFIGURATION

Configure probes at Combined Service root level:

**Startup probe:**
- Protocol: HTTP, Path: /api/ping, Port: 3000
- Period: 5s, Timeout: 5s, Failure threshold: 30

**Readiness probe:**
- Protocol: HTTP, Path: /api/health, Port: 3000
- Period: 15s, Timeout: 5s, Failure threshold: 3

**Liveness probe:**
- Protocol: HTTP, Path: /api/ping, Port: 3000
- Period: 15s, Timeout: 5s, Failure threshold: 3

**Do NOT target:**
- Port 8080
- Authenticated routes
- /api/health/dependencies
- Routes dependent on optional integrations

---

## P0 — UNHEALTHY UPSTREAM PROCEDURE

When "No Healthy Upstream" occurs, trace in order:
1. Build completed?
2. Image contains expected standalone?
3. CMD points to real server.js?
4. Node process running?
5. Listening on 0.0.0.0 (not localhost)?
6. Process on port 3000?
7. Northflank container port 3000?
8. Startup probe passes?
9. Readiness probe passes?
10. Pod in service endpoint?
11. Ingress correct?
12. DNS correct?
13. TLS valid?
14. Middleware rewriting health routes?
15. Live image = intended Git SHA?

---

## P0 — ENVIRONMENT VARIABLES

Compare env vars side by side:
- NODE_ENV, HOSTNAME, PORT, SERVICE_NAME
- NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- GIT_SHA (server-only authoritative)

Classify each:
- Required / Optional / Missing / Incorrectly named
- Build-time / Runtime / Public / Server-only

---

## P1 — ROLLING DEPLOYMENT

- Minimum replicas: 1
- Rolling deployment enabled
- Startup probe gives sufficient time
- Previous healthy image retained for rollback

Deploy one at a time: Marketing → LMS → Admin

Wait for each to stabilize before next.

---

## REQUIRED SIDE-BY-SIDE REPORT

Complete this table with actual evidence:

| Setting | Marketing | LMS | Admin | Evidence |
|---------|-----------|-----|-------|----------|
| Service type | | | | |
| Project ID | | | | |
| Service ID | | | | |
| Repository | | | | |
| Branch | | | | |
| Deployed SHA | | | | |
| Dockerfile | | | | |
| Container Port | | | | |
| Startup Probe | | | | |
| Readiness Probe | | | | |
| /api/ping | | | | |
| /api/health | | | | |
| /api/version gitSha | | | | |
| Build Status | | | | |
| Runtime Status | | | | |
| Upstream | | | | |

---

## REQUIRED ERROR REGISTER

| ID | Service | Source | Timestamp | Severity | Message | File | Line | Root Cause | Fix |
|----|---------|--------|-----------|----------|---------|------|------|------------|-----|

---

## REQUIRED FINAL VERIFICATION

**Marketing:**
- [ ] Standalone build verified
- [ ] Process on 0.0.0.0:3000
- [ ] Startup/readiness/liveness probes passing
- [ ] At least 1 ready replica
- [ ] Healthy upstream
- [ ] /api/ping → 200
- [ ] /api/health → 200
- [ ] /api/version → expected SHA

**LMS:** (same checklist)

**Admin:** (same checklist)

**Also verify:**
- No CrashLoopBackOff
- No ImagePullBackOff
- No port mismatch
- No probe-path mismatch
- No domain mapped wrong
- No stale image
- No duplicate service

---

## FINAL DELIVERABLES

1. Executive summary
2. Northflank configuration matrix
3. Build log audit
4. Runtime log audit
5. Error register
6. Root-cause analysis for unhealthy upstream
7. Exact files changed
8. Exact Northflank settings changed
9. Before/after configuration
10. Commit SHA for every fix
11. Deployed image digest
12. Internal health evidence
13. External health evidence
14. Domain verification
15. Restart/replica evidence
16. Remaining risks
17. **FINAL GO or NO-GO**

---

**Not complete until:**
- All 3 services running and ready
- All upstreams healthy
- Public endpoints return expected results
- One authoritative Git SHA throughout
- No conflicting release IDs
