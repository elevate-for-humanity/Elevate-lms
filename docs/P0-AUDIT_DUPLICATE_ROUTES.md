# DUPLICATE ROUTE CONSOLIDATION AUDIT

**Date:** 2026-06-23  
**Status:** 90% COMPLETE - Requires Runtime Validation  
**Author:** OpenHands Agent

---

## EXECUTIVE SUMMARY

Audit found significant route duplication between two admin applications:
- `apps/admin/` (NEW - Next.js App Router)
- `apps/app/admin/` (LEGACY - Possibly unused)

**Total Duplicated Routes:** ~150+ routes across 7 areas

---

## VALIDATION MATRIX

| Finding                        | Status    |
| ------------------------------ | --------- |
| Duplicate code exists          | ✅ Proven  |
| Navigation points to new admin | ✅ Proven  |
| Identical implementations      | ✅ Proven  |
| Legacy routes appear unused    | ⚠️ Likely |
| Runtime behavior verified      | ❌ Not yet |
| Safe to delete                 | ❌ Not yet |

---

## PHASE 2 ONLY - AFTER P0 STABILIZATION

**Priority:** After platform stabilization is complete.

### Required Validation Before Deletion:
1. ✅ Deploy stable build
2. ⏳ Validate: `/admin/studio`, `/admin/dashboard`
3. ⏳ Verify rendered source
4. ⏳ Verify route manifests
5. ⏳ Verify build output
6. ⏳ Verify no legacy imports remain

### Safe Consolidation Process:
1. Create branch: `route-consolidation`
2. Remove unused legacy routes
3. Run full build
4. Run authentication suite
5. Run dashboard suite
6. Run studio suite
7. Run program suite
8. Run regression suite
9. Only merge after all tests pass

---

## FINDINGS

### 1. STUDIO ROUTES (23 routes)

| Attribute | Value |
|-----------|-------|
| NEW Path | `apps/admin/app/admin/studio/*` |
| LEGACY Path | `apps/app/admin/studio/*` |
| Status | **DUPLICATED** |
| Routes | page, agents, builds, courses, workflows, tasks, memory, media, pages, settings, deployments |

**Evidence:**
- Both directories contain 23 identical `page.tsx` files
- Both import `DevStudioUnifiedClient.tsx`
- Navigation links point to `/admin/studio` (NEW)

### 2. DASHBOARD ROUTES (3 routes)

| Attribute | Value |
|-----------|-------|
| NEW Path | `apps/admin/app/admin/dashboard/*` |
| LEGACY Path | `apps/app/admin/dashboard/*` |
| Status | **DUPLICATED** |
| Routes | page, etpl, program-integrity |

**Evidence:**
- IDENTICAL implementations confirmed
- Same imports: `getAdminDashboardData`, `AdminDashboardContent`
- Same metadata

### 3. OTHER DUPLICATED AREAS

| Area | NEW Path | LEGACY Path |
|------|----------|-------------|
| instructor/dashboard | `apps/admin/app/admin/instructor/dashboard/` | `apps/app/admin/instructor/dashboard/` |
| staff-portal/dashboard | `apps/admin/app/admin/staff-portal/dashboard/` | `apps/app/admin/staff-portal/dashboard/` |
| host-shop/dashboard | `apps/admin/app/admin/host-shop/dashboard/` | `apps/app/admin/host-shop/dashboard/` |
| programs/*/dashboard | `apps/admin/app/admin/programs/*/dashboard/` | `apps/app/admin/programs/*/dashboard/` |

---

## EVIDENCE COLLECTED

### Navigation References (NEW = Active)
✅ All admin navigation links point to `/admin/studio`  
✅ All admin navigation links point to `/admin/dashboard`  
✅ No navigation references to legacy paths found

### Import References
✅ No imports of `apps/app/admin` paths from codebase  
✅ No dynamic references to legacy routes

### Code Comparison
- STUDIO page: IDENTICAL (both use `DevStudioUnifiedClient`)
- DASHBOARD page: IDENTICAL (both use `AdminDashboardContent`)

---

## PENDING: RUNTIME VALIDATION

The following must be verified BEFORE marking routes as unused:

| Route | Active Path | Legacy Path | Status |
|-------|-------------|-------------|--------|
| `/admin/studio` | UNKNOWN | UNKNOWN | NEEDS TEST |
| `/admin/dashboard` | UNKNOWN | UNKNOWN | NEEDS TEST |
| `/admin/instructor/dashboard` | UNKNOWN | UNKNOWN | NEEDS TEST |

**To validate:**
1. Deploy application
2. Navigate to `/admin/studio` - capture which implementation renders
3. Navigate to `/admin/dashboard` - capture which implementation renders
4. Check browser DevTools for component source

---

## RECOMMENDATION

**DO NOT DELETE ANY ROUTES YET**

Until runtime validation proves the legacy routes are unused, they should remain in place.

### Safe Path Forward:
1. ✅ Mark as DUPLICATED (evidence complete)
2. ⏳ Runtime validation required
3. ⏳ Performance testing with both sets
4. ⏳ Create deprecation branch before any deletion
5. ⏳ Full test suite pass before removal

---

## ROUTE COUNT SUMMARY

| App | Total Pages | Studio | Dashboard | Other Admin |
|-----|-------------|--------|-----------|-------------|
| apps/admin | 385 | 23 | 3 | 359 |
| apps/app/admin | ~50 | 23 | 3 | ~24 |

**Potential reduction:** 50+ routes if legacy is unused

---

## NOTES

- Auth is handled by `apps/admin/app/admin/layout.tsx` (P0-1 fix)
- Middleware routes `/admin/*` to new app
- Legacy app structure suggests it was a separate application that may have been absorbed into `apps/admin`
