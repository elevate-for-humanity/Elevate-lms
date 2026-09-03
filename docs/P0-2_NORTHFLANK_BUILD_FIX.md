# P0-2: Northflank Build Failure - ROOT CAUSE

**Date:** 2026-06-23  
**Status:** BLOCKED - Memory/Architecture Issue

## Root Cause Analysis

```
Build Command: pnpm build
Error: FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
Routes to Build: 1,048 page.tsx files
Available Memory: 16GB (4GB used, 11GB available)
Required Memory: >8GB for Next.js build
```

## Issue Summary

1. **Too many routes** - 1,048 page routes is excessive
2. **Memory constraint** - Next.js build requires more heap than available
3. **No incremental build cache** - Full rebuild every time

## Files Affected

- All 1,048 routes in `app/` directory
- Multiple large libraries being bundled
- Sentry instrumentation adding overhead

## Potential Fixes

### Option A: Incremental Build (Recommended for Northflank)
```bash
# Use Next.js incremental builds with persistent cache
NEXT_BUILD_CACHE=/cache/.next pnpm build
```

### Option B: Memory Increase
- Northflank: Increase container memory to 32GB
- Or: Use build machine with more RAM

### Option C: Route Optimization
- Archive unused routes
- Implement route groups
- Use dynamic imports for heavy components

### Option D: CI/Build Pipeline Separation
- Use GitHub Actions for builds (unlimited compute)
- Deploy artifacts to Northflank

## Verification Required

1. [ ] Green local build with 16GB memory
2. [ ] Green CI build
3. [ ] Successful Northflank deployment
4. [ ] Production health check passing

## Current Status

**❌ NOT RESOLVED** - Requires infrastructure decision

The code changes are correct (P0-1 auth fix committed), but the build
infrastructure cannot compile the codebase with current resources.
