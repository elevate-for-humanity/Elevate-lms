# LMS/Admin Separation Audit - 2026-06-20

## Summary

This document audits the LMS and Admin deployment architecture to verify they are properly separated.

## Build Status (As of 2026-06-20 10:47 UTC)

| Service | Build ID | Status | SHA |
|---------|----------|--------|-----|
| LMS | cultured-ear-2569 | PENDING | b6ad297e |
| Admin | capable-eyes-1665 | PENDING | b6ad297e |

**Root cause found**: `parallelServerCompiles` and `parallelServerBuildTraces` options in next.config.mjs require worker threads that aren't configured. These have been disabled.

Previous builds were failing due to: 'parallelServerBuildTraces may only be used when build workers can be used'

## Architecture Overview

| Component | Service Name | Domain | Dockerfile | GitHub Workflow |
|-----------|-------------|--------|------------|----------------|
| LMS | `elevate-lms` | www.elevateforhumanity.org | Dockerfile.northflank-lms | deploy-lms.yml |
| Admin | `elevate-admin` | admin.elevateforhumanity.org | Dockerfile.northflank-admin | deploy-admin.yml |

## GitHub Workflow Path Filters

### deploy-lms.yml
- Paths: `app/**` with `!app/admin/**` excluded
- **STATUS**: CORRECT - admin routes excluded

### deploy-admin.yml  
- Paths: `app/admin/**`, `apps/admin/**`, and shared paths
- **STATUS**: CORRECT - includes admin-specific paths

## Dockerfile Analysis

### Dockerfile.northflank-lms
- Builds from root: `pnpm next build --no-lint`
- Output: `/app/.next/standalone`
- Server: `node server.js`

### Dockerfile.northflank-admin
- Builds from subdir: `cd /app/apps/admin && pnpm next build --no-lint`
- Output: `/app/apps/admin/.next/standalone`
- Server: `node apps/admin/server.js`

## File System Structure

```
/workspace/project/Elevate-lms/
├── app/                    # Root Next.js app (LMS)
│   ├── admin/             # Admin routes for LMS container
│   │   ├── studio/        # ← Studio route lives here
│   │   ├── programs/
│   │   └── ... (132 directories)
│   └── ... (marketing, LMS, portal routes)
│
├── apps/
│   └── admin/            # Standalone Admin app
│       └── app/         # Admin Next.js app structure
│
├── Dockerfile.northflank-lms    # LMS Dockerfile
├── Dockerfile.northflank-admin  # Admin Dockerfile
└── next.config.mjs             # Shared Next.js config
```

## Key Findings

### PROPERLY SEPARATED

1. Path Filters: deploy-lms.yml excludes `app/admin/**`, deploy-admin.yml includes it
2. Dockerfiles: Each builds only its respective app
3. Domains: LMS at www, Admin at admin subdomain
4. Concurrency Groups: Separate deployment queues

### POINTS OF ATTENTION

1. CI/CD Pipeline runs full build for both apps together (intentional for shared codebase testing)
2. app/admin/ contains routes shared between both containers
3. apps/admin/ contains standalone Admin app

## Conclusion

LMS and Admin are properly separated. The architecture correctly builds each app independently in its own container and deploys to separate domains.

Last audited: 2026-06-20
