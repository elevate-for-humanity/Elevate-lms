# PRODUCTION-RECOVERY-AUDIT.md

## Phase 1: Baseline Evidence

### Git State
- **Branch:** main
- **HEAD SHA:** c0337a3a5c3a8d1975c8a0c0aea30c258cdf73c5
- **Latest commit:** fix: standardize build args to use GITHUB_SHA as primary

### Production Status (2026-07-20 09:14 UTC)

| Service | Public URL | Health Status | Version SHA | HTTP Code |
|---------|-----------|---------------|-------------|-----------|
| Marketing | www.elevateforhumanity.org | no healthy upstream | unknown | 503 |
| LMS | app.elevateforhumanity.org | {"status":"ok"} | unknown | 200 |
| Admin | admin.elevateforhumanity.org | Redirect (307) | unknown | 307 |

### Marketing Health Response
```
no healthy upstream
```

### LMS Health Response
```json
{"status":"ok","service":"marketing","commit":"unknown","buildTime":"unknown","timestamp":"2026-07-20T09:14:44.936Z"}
```
Note: Shows "service":"marketing" but URL is LMS - possible config mismatch

### Admin Health Response
```
307 redirect (likely to login)
```

### Identified Issues
1. **Marketing:** No healthy upstream - container startup failure or port mismatch
2. **LMS:** Wrong service name in health response (shows "marketing" instead of "lms")
3. **Admin:** Redirects instead of returning health JSON

## Phase 2: Northflank API Status
- **Status:** BLOCKED - Token returning 401 Unauthorized
- **Token received:** Yes (from email)
- **API Authentication:** FAILED

## Phase 3-6: In Progress (see separate audit files)
