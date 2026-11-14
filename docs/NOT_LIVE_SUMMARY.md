# 🚨 NOT LIVE - WHAT'S NOT DEPLOYED
## Elevate LMS - June 21, 2026

---

## ⚠️ IMMEDIATE: UNDEPLOYED COMMITS (3 commits)

**Last Deploy SHA:** `5f59b6834` (TestingCart.tsx fix)  
**Current HEAD:** `1e9633112`

### Commits Waiting to Deploy:

| # | SHA | Message | Files |
|---|-----|---------|-------|
| 1 | 1e9633112 | fix: remove badge.tsx and button.tsx casing duplicates | -6 files (800 lines) |
| 2 | 0d070d567 | fix: remove duplicate select.tsx and tabs.tsx | -2 files (280 lines) |
| 3 | c2acde997 | fix: remove deprecated workerThreads/cpus | next.config, GlobalAvatar, apprentice/page, store-products |

### Files NOT Yet Live:

```
❌ app/apprentice/page.tsx (Globe import fix)
❌ components/GlobalAvatar.tsx (regex fix)
❌ lib/data/store-products.ts (exports added)
❌ components/ui/badge.tsx (DELETED - duplicate)
❌ components/ui/button.tsx (DELETED - duplicate)
❌ components/ui/card.tsx (DELETED - duplicate)
❌ components/ui/checkbox.tsx (DELETED - duplicate)
❌ components/ui/input.tsx (DELETED - duplicate)
❌ components/ui/label.tsx (DELETED - duplicate)
❌ components/ui/select.tsx (DELETED - duplicate)
❌ components/ui/tabs.tsx (DELETED - duplicate)
❌ next.config.mjs (workerThreads/cpus removed)
```

---

## 🌿 BRANCHES WITH UNDEPLOYED CODE

### 1. `accio-fixes-lms-20260621-1400` (3 commits ahead)

| SHA | Message |
|-----|---------|
| 2fdde84eb | 🏁 PERFORMANCE: Resolved memory spikes by disabling static revalidation on 1000+ variants and killing webpack cache |
| d80c8fd79 | 🏁 FINAL SIGNATURE: Hardened production gate and resolved recursive crash loop for Next.js 15 |
| d0826d1b7 | 🏁 PRODUCTION FIX: Resolved undefined 'canonicalAdminHost' in middleware which caused site-wide 500 errors |

**NOT LIVE:**
- Performance optimization (memory spikes)
- Production gate hardening
- Middleware fix (canonicalAdminHost)

---

### 2. `lms-critical-fixes-safe` (1 commit ahead)

| SHA | Message |
|-----|---------|
| ece6d5627 | fix: cherry-pick critical fixes from Elevate Codex |

**NOT LIVE:**
- Critical fixes from Codex

---

## ❌ UNDEPLOYED FEATURES (June 2026)

### Features NOT Deployed:

| Feature | Branch | Status |
|---------|--------|--------|
| Coupon Engine | feature/coupon-engine-platform-audit | NOT MERGED |
| Dev Studio V2 | dev-studio-integrations-v2 | NOT MERGED |
| Admin Consolidation | admin-consolidation-2026-06-18 | NOT MERGED |

### Coupon Engine Status:
```
❌ NOT DEPLOYED
- Full coupon system in dbc0da9d
- On branch: lms-old-code-old-deps
- Status: Abandoned (old dependencies)
```

---

## 🔧 WORKFLOW ISSUES (NOT RUNNING)

| Workflow | Status | Issue |
|----------|--------|-------|
| Integrity Gate | ❌ FAILING | Data schema issues |
| Compliance Gate | ❌ FAILING | Policy violations |
| Autopilot | ❌ FAILING | Builder mode errors |
| Health Check | ❌ FAILING | Runtime errors |
| CI | ❌ FAILING | TypeScript errors |

---

## 🐛 KNOWN ISSUES NOT YET FIXED

| Issue | Status | Notes |
|-------|--------|-------|
| React Error #130 | ⚠️ PARTIAL | Fixed in c2acde997 but not deployed |
| Casing duplicates | ✅ FIXED | Deleted 8 files |
| Deprecated config | ✅ FIXED | Removed workerThreads/cpus |
| Memory spikes | ❌ NOT MERGED | In accio branch |
| Middleware crash | ❌ NOT MERGED | In accio branch |
| /partner-portal duplicate | ❌ NOT FIXED | In next.config.mjs |

---

## 📊 SUMMARY

| Category | Count | Status |
|----------|-------|--------|
| Commits pending deploy | 3 | Need push |
| Branches with fixes | 2 | Need merge |
| Unmerged features | 3 | Need review |
| Failing workflows | 5 | Need fix |
| Known bugs | 6 | In progress |

---

## 🎯 ACTION ITEMS

### HIGH PRIORITY:
1. ✅ **FIXED:** Casing duplicates (waiting for deploy)
2. ✅ **FIXED:** Deprecated config (waiting for deploy)  
3. ⏳ **DEPLOY:** Trigger new build to deploy fixes
4. 📋 **MERGE:** accio-fixes-lms-20260621-1400 for performance/middleware fixes

### MEDIUM PRIORITY:
5. 📋 **FIX:** Integrity Gate failures
6. 📋 **FIX:** Compliance Gate failures
7. 📋 **FIX:** Health Check runtime errors

### LOW PRIORITY:
8. 📋 **REVIEW:** Coupon Engine (dbc0da9d) - old deps
9. 📋 **CLEANUP:** 150+ stale branches

---

*Generated: 2026-06-21T16:15 UTC*
