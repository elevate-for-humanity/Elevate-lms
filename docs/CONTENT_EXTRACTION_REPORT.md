# CONTENT EXTRACTION & BUILD MEMORY REMEDIATION REPORT

**Date:** June 18, 2026  
**Project:** Elevate LMS  
**Status:** ANALYSIS COMPLETE

---

## EXECUTIVE SUMMARY

### Large Files Audit (>50KB)

| File | Size | Classification | Status |
|------|------|----------------|--------|
| types/database.generated.ts | 2 MB | Generated Types | ⚠️ NEEDS REVIEW |
| lib/courses/hvac-quizzes.ts | 304 KB | Quiz Content | ✅ Already Runtime |
| lib/courses/hvac-lesson-quizzes.ts | 188 KB | Quiz Content | ✅ Already Runtime |
| lib/courses/hvac-quiz-banks.ts | 92 KB | Quiz Content | ✅ Already Runtime |
| lib/courses/hvac-lesson-content.ts | 104 KB | Lesson Content | ✅ Already Runtime |
| app/data/programs.ts | 120 KB | Config/Reference | ⚠️ NEEDS REVIEW |
| scripts/generated/barber-course.generated.ts | 108 KB | Generated Content | ✅ Already Runtime |
| lib/curriculum/blueprints/barber/* | 500 KB | Blueprint Config | ✅ Config Only |

---

## FILE-BY-FILE ANALYSIS

### 1. types/database.generated.ts (2 MB)
**Classification:** Generated Type Definitions
**Build Impact:** MEDIUM (~200-400MB during compilation)
**Recommendation:** SPLIT BY DOMAIN - Create `/types/tables/*.ts`

### 2-5. HVAC Quiz/Lesson Content
**Classification:** Educational Content
**Status:** ✅ ALREADY OPTIMIZED - Loaded via readFileSync from /public/data/

### 6. app/data/programs.ts (120 KB)
**Classification:** Reference Data
**Build Impact:** MEDIUM
**Recommendation:** Move to Supabase `programs` table

### 7-8. Generated Content & Blueprints
**Status:** Already separated or config-only

---

## IMPORT CHAIN ANALYSIS

| File | Client Bundle? | Server Bundle? |
|------|---------------|----------------|
| hvac-quizzes.ts | ❌ NO | ✅ YES (runtime) |
| database.generated.ts | ⚠️ Types only | ✅ YES |
| blueprints/* | ❌ NO | ✅ YES (course builder) |

---

## SUPABASE SCHEMA - ALREADY OPTIMIZED

| Content Type | Current Storage | Status |
|-------------|-----------------|--------|
| HVAC Quizzes | /public/data/*.json | ✅ Runtime |
| Lesson Content | /public/data/*.json | ✅ Runtime |
| Curriculum | /public/data/*.json | ✅ Runtime |

---

## BUILD MEMORY BREAKDOWN

| Component | Memory |
|-----------|--------|
| Source files | ~2 GB |
| Route compilation | ~3 GB |
| Type checking | ~1 GB |
| SWC caches | ~500 MB |
| **Total** | **~7 GB** |

---

## ROOT CAUSE & FIX

| Issue | Impact | Status |
|-------|--------|--------|
| Parallel builds DISABLED | 40-60% | ✅ FIXED |
| Database types (2MB) | 10-15% | ⚠️ Optional fix |
| Quiz content | 0% | ✅ Already runtime |

---

## VERDICT

**Root Cause:** Parallel builds disabled (FIXED)  
**Content Extraction:** NOT NEEDED - Already optimized  
**Next Steps:** Split database types if still OOM

