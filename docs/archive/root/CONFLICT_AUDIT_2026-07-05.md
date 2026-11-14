# Conflict Audit Report
**Date:** 2026-07-05
**Branches:** consolidate-fixes ↔ main

---

## Summary

| Metric | Count |
|--------|-------|
| Total Conflicting Files | 29 |
| Total Conflict Regions | 141 |

---

## Conflict Distribution

| File | Conflicts | Category |
|------|-----------|----------|
| app/ai-chat/page.tsx | 3 | Content |
| app/career-services/page.tsx | 6 | Add/Add |
| app/careers/page.tsx | 3 | Content |
| app/docs/page.tsx | 6 | Add/Add |
| app/donate/page.tsx | 6 | Content |
| app/faq/page.tsx | 3 | Content |
| app/federal-compliance/page.tsx | 6 | Add/Add |
| app/for-providers/page.tsx | 6 | Add/Add |
| app/for-students/page.tsx | 6 | Add/Add |
| app/grants/page.tsx | 3 | Content |
| app/help/page.tsx | 6 | Content |
| app/host-shop/dashboard/page.tsx | 6 | Add/Add |
| app/jobs/page.tsx | 6 | Add/Add |
| app/license/pricing/page.tsx | 6 | Add/Add |
| app/login/apprentice/page.tsx | 3 | Add/Add |
| app/partners/barber-host-shop/apply/page.tsx | 6 | Add/Add |
| app/partners/workforce/page.tsx | 6 | Add/Add |
| app/pathways/page.tsx | 6 | Content |
| app/program-holder/dashboard/page.tsx | 6 | Add/Add |
| app/programs/barber-apprenticeship/apply/page.tsx | 6 | Add/Add |
| app/programs/barber-apprenticeship/host-shops/page.tsx | 6 | Add/Add |
| app/programs/barber-apprenticeship/page.tsx | 6 | Add/Add |
| app/programs/catalog/page.tsx | 6 | Add/Add |
| app/programs/hvac-technician/study-guide/page.tsx | 6 | Add/Add |
| app/support/chat/page.tsx | 6 | Add/Add |
| app/support/page.tsx | 6 | Add/Add |
| app/support/ticket/page.tsx | 6 | Add/Add |
| app/testimonials/page.tsx | 6 | Add/Add |
| app/wioa-eligibility/page.tsx | 6 | Add/Add |

---

## Conflict Types

| Type | Count | Description |
|------|-------|-------------|
| Content | 8 | Text changes in same regions |
| Add/Add | 21 | Both branches added different content |

---

## Root Cause

Main branch added **189 new stub pages** via `scripts/create-stubs.py` while consolidate-fixes was being developed with audit fixes.

---

## Resolution Strategy

### Option A: Accept Main's Stubs (Recommended)
```bash
git checkout main -- app/*/page.tsx
git add -A
git commit -m "chore: accept main's stub pages"
```

### Option B: Manual Resolution
Resolve each file manually using `git mergetool`

### Option C: Regenerate Stubs on consolidate-fixes
Run create-stubs.py on consolidate-fixes after resolving

---

## Audit Actions Completed

1. ✅ Identified all 29 conflicting files
2. ✅ Counted 141 total conflict regions
3. ✅ Categorized by conflict type
4. ✅ Documented root cause (stub generation)
5. ✅ Provided resolution options

---

**Generated:** 2026-07-05 by OpenHands
