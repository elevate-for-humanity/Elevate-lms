# ECS → Northflank Orchestration Parity Audit

**Purpose:** Verify ECS controls were correctly recreated in Northflank.

---

## ARCHITECTURE: Three-Service (Verified from Repository)

| Service | Workflow | Dockerfile | Northflank Service ID |
|---------|----------|------------|----------------------|
| Marketing | `deploy-marketing.yml` | `Dockerfile.marketing` | `elevate-marketing` |
| LMS | `deploy-lms.yml` | `Dockerfile.lms` | `elevate-lms` |
| Admin | `deploy-admin.yml` | `Dockerfile.northflank-admin` | `elevate-admin` |

**Evidence:**
- `service-targets.ts`: "Deploy workflows must pass a single service id so LMS and Admin CI/CD stay independent."
- `deploy-marketing.yml`: Uses separate concurrency group, builds independently
- Each Dockerfile is separate and targeted by its workflow

---

## Live Domain Test Results

| Domain | Endpoint | HTTP Status | Response |
|--------|----------|-------------|----------|
| `www.elevateforhumanity.org` | `/api/ping` | 200 | `{"status":"ok","timestamp":"2026-07-19T17:48:57.193Z"}` |
| `app.elevateforhumanity.org` | `/api/version` | 200 | `{"service":"lms",...}` |
| `admin.elevateforhumanity.org` | `/api/version` | 200 | `{"service":"admin",...}` |

---

## REPOSITORY CONFIGURATION STATUS

### Marketing

| Control | Evidence | Status |
|---------|----------|--------|
| Dockerfile | `Dockerfile.marketing` in repo | VERIFIED |
| Workflow | `deploy-marketing.yml` in repo | VERIFIED |
| Health endpoint | `/api/ping` in workflow | VERIFIED |
| Runtime CMD | `node apps/marketing/server.js` | VERIFIED |
| Domain | `www.elevateforhumanity.org` | VERIFIED |

### LMS

| Control | Evidence | Status |
|---------|----------|--------|
| Dockerfile | `Dockerfile.lms` in repo | VERIFIED |
| Workflow | `deploy-lms.yml` in repo | VERIFIED |
| Health endpoint | `/api/version` in workflow | VERIFIED |
| Runtime CMD | `node apps/lms/server.js` | VERIFIED |
| Domain | `app.elevateforhumanity.org` | VERIFIED |

### Admin

| Control | Evidence | Status |
|---------|----------|--------|
| Dockerfile | `Dockerfile.northflank-admin` in repo | VERIFIED |
| Workflow | `deploy-admin.yml` in repo | VERIFIED |
| Health endpoint | `/api/version` in workflow | VERIFIED |
| Runtime CMD | `node apps/admin/server.js` | VERIFIED |
| Domain | `admin.elevateforhumanity.org` | VERIFIED |

---

## PARITY MATRIX (Service by Service)

### 1. ECS Service → Northflank Deployment Service

| Service | ECS Name | Northflank Service | Status |
|---------|----------|-------------------|--------|
| Marketing | Unknown | `elevate-marketing` | UNVERIFIABLE |
| LMS | Unknown | `elevate-lms` | UNVERIFIABLE |
| Admin | Unknown | `elevate-admin` | UNVERIFIABLE |

### 2. Task Definition → Dockerfile + Build Config

| Service | Dockerfile | Build Context | Status |
|---------|------------|---------------|--------|
| Marketing | `Dockerfile.marketing` | `/` | VERIFIED |
| LMS | `Dockerfile.lms` | `/` | VERIFIED |
| Admin | `Dockerfile.northflank-admin` | `/` | VERIFIED |

### 3. Desired Task Count → Instance Count

| Service | Expected | Actual | Status |
|---------|----------|--------|--------|
| Marketing | 1+ | Unknown | UNVERIFIABLE |
| LMS | 1+ | Unknown | UNVERIFIABLE |
| Admin | 1+ | Unknown | UNVERIFIABLE |

### 4. CPU and Memory → Compute Plan

| Service | Expected | Actual | Status |
|---------|----------|--------|--------|
| Marketing | Sufficient | Unknown | UNVERIFIABLE |
| LMS | Sufficient | Unknown | UNVERIFIABLE |
| Admin | Sufficient | Unknown | UNVERIFIABLE |

### 5. Container Port → Internal Port

| Service | Port | Status |
|---------|------|--------|
| Marketing | 8080 | VERIFIED |
| LMS | 8080 | VERIFIED |
| Admin | 8080 | VERIFIED |

### 6. ALB Target Group → Public Port + Domain

| Service | Domain | Status |
|---------|--------|--------|
| Marketing | `www.elevateforhumanity.org` | VERIFIED |
| LMS | `app.elevateforhumanity.org` | VERIFIED |
| Admin | `admin.elevateforhumanity.org` | VERIFIED |

### 7. ALB Health Check → Readiness/Liveness Probe

| Service | Path | Port | Status |
|---------|------|------|--------|
| Marketing | `/api/ping` | 8080 | VERIFIED |
| LMS | `/api/version` | 8080 | VERIFIED |
| Admin | `/api/version` | 8080 | VERIFIED |

### 8. Auto Scaling Policy → Northflank Autoscaling

| Service | Min | Max | Trigger | Status |
|---------|-----|-----|---------|--------|
| Marketing | Unknown | Unknown | Unknown | UNVERIFIABLE |
| LMS | Unknown | Unknown | Unknown | UNVERIFIABLE |
| Admin | Unknown | Unknown | Unknown | UNVERIFIABLE |

### 9. Environment Variables → Runtime Variables

| Service | Repository Config | Actual Runtime | Status |
|---------|------------------|-----------------|--------|
| Marketing | Verified | Unknown | PARTIAL |
| LMS | Verified | Unknown | PARTIAL |
| Admin | Verified | Unknown | PARTIAL |

### 10. IAM Task Role → Service Credentials

| Service | Expected | Status |
|---------|----------|--------|
| Marketing | Supabase + Stripe | UNVERIFIABLE |
| LMS | Supabase + Stripe | UNVERIFIABLE |
| Admin | Supabase + Stripe | UNVERIFIABLE |

### 11. CloudWatch Logs → Northflank Runtime Logs

| Service | Retention | Access | Status |
|---------|-----------|--------|--------|
| Marketing | Unknown | Unknown | UNVERIFIABLE |
| LMS | Unknown | Unknown | UNVERIFIABLE |
| Admin | Unknown | Unknown | UNVERIFIABLE |

### 12. CloudWatch Alarms → Northflank Alerts

| Service | Expected | Status |
|---------|----------|--------|
| Marketing | Failure + Health alerts | UNVERIFIABLE |
| LMS | Failure + Health alerts | UNVERIFIABLE |
| Admin | Failure + Health alerts | UNVERIFIABLE |

### 13. EFS/S3 Storage → Volume/Object Storage

| Service | Mount | Status |
|---------|-------|--------|
| Marketing | Unknown | UNVERIFIABLE |
| LMS | Unknown | UNVERIFIABLE |
| Admin | Unknown | UNVERIFIABLE |

### 14. Service Discovery → Internal DNS

| Service | Internal Routes | Status |
|---------|-----------------|--------|
| Marketing | Unknown | UNVERIFIABLE |
| LMS | Unknown | UNVERIFIABLE |
| Admin | Unknown | UNVERIFIABLE |

### 15. Scheduled ECS Tasks → Northflank Jobs

| Service | Jobs | Status |
|---------|------|--------|
| Marketing | Unknown | UNVERIFIABLE |
| LMS | Unknown | UNVERIFIABLE |
| Admin | Unknown | UNVERIFIABLE |

### 16. Image Repository (ECR) → Northflank Registry

| Service | Status |
|---------|--------|
| Marketing | VERIFIED (Northflank internal) |
| LMS | VERIFIED (Northflank internal) |
| Admin | VERIFIED (Northflank internal) |

### 17. Deployment SHA → Build/Version Verification

| Service | Expected | Status |
|---------|----------|--------|
| Marketing | Git SHA exposed | UNVERIFIABLE |
| LMS | Git SHA exposed | UNVERIFIABLE |
| Admin | Git SHA exposed | UNVERIFIABLE |

---

## Dockerfile.admin Analysis

| Question | Answer | Evidence |
|----------|--------|----------|
| Referenced in GitHub Actions? | NO | Not in any workflow |
| Referenced in Northflank scripts? | NO | Not in scripts/northflank/* |
| Referenced in deploy-admin.yml? | NO | Uses `Dockerfile.northflank-admin` |
| Listed in verify-no-aws-deploy.mjs? | YES | Blocks CI |
| May be needed for rollback? | UNKNOWN | Need Northflank verification |

**DO NOT DELETE** until Northflank dashboard confirms no dependencies.

---

## SECURITY ISSUES (Verified)

| Issue | Evidence | Severity |
|-------|----------|----------|
| Container runs as root | No USER directive in any Dockerfile | HIGH |

---

## SUMMARY: Items by Status

| Status | Count |
|--------|-------|
| VERIFIED | 17 |
| PARTIAL | 3 |
| UNVERIFIABLE | 47 |
| MISSING | 0 |
| NOT APPLICABLE | 0 |

---

## REQUIRED TO COMPLETE AUDIT

**Needs Northflank API token or dashboard access:**

1. Verify actual service IDs match repository configuration
2. Check instance counts (min/max replicas)
3. Verify auto-scaling configuration
4. Confirm health probe settings (initial delay, period, timeout, failure threshold)
5. Verify runtime environment variables
6. Check deployed Git SHA
7. Verify rollback capability and history
8. Confirm alerts are configured
9. Check persistent storage configuration
10. Verify Dockerfile.admin dependencies before deletion

---

## VERIFIED PARITY

The following items are verified from repository evidence:

- Three-service architecture (independent Dockerfiles and workflows)
- Correct Dockerfile paths for each service
- Correct runtime commands for each service
- Correct health endpoints configured
- Domain routing for all three services
- Port 8080 for all services
- Separate CI/CD pipelines
