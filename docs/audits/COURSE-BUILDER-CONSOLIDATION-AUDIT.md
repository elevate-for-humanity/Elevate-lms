# COURSE BUILDER CONSOLIDATION AUDIT

**Date:** 2026-07-11
**Status:** 🔴 CRITICAL - 41 Scripts Need Consolidation

---

## EXECUTIVE SUMMARY

| Category | Count | Keep | Delete | Consolidate |
|---------|------:|-----:|-------:|------------:|
| Course Generation | 4 | 4 | 0 | 0 |
| Course Data (Seeds) | 6 | 2 | 0 | 4 |
| Video Generation | 9 | 3 | 0 | 6 |
| Auditing/Validation | 6 | 3 | 3 | 0 |
| HVAC Specific | 14 | 2 | 0 | 12 |
| Import/Export | 6 | 2 | 0 | 4 |
| Other | 10 | 2 | 4 | 4 |
| **TOTAL** | **41** | **18** | **7** | **16** |

**Recommended Scripts to Keep:** 5 core scripts
**Recommended Scripts to Delete:** 23 scripts
**Scripts Needing Consolidation:** 13 scripts

---

## 🔴 CORE COURSE BUILDER (KEEP - 5 Scripts)

### The Actual Course Builder
```
scripts/course-builder/
├── generate-course.ts     ← MAIN: Generates course structure
├── build.ts              ← BUILD: Compiles course
├── validate.ts           ← VALIDATE: Checks course quality
├── run.ts                ← RUN: Orchestrates the pipeline
└── types.ts              ← TYPES: Type definitions
```

### Seed Data
```
scripts/course-builder/seeds/
└── barber-course.seed.ts  ← COURSE SEEDS
```

**Recommendation:** ✅ KEEP AS IS

---

## 🟡 COURSE SEEDS (6 → 2)

| Script | Purpose | Action |
|--------|---------|--------|
| `course-builder/seeds/barber-course.seed.ts` | Barber apprenticeship data | ✅ KEEP |
| `course-builder/patch-seeds.ts` | Patch existing seeds | ✅ KEEP |
| `seed-courses.ts` | Generic course seeding | ❌ DELETE (duplicate) |
| `seed-course-from-blueprint.ts` | Blueprint-based seeding | ❌ DELETE (duplicate) |
| `seed-all-program-courses.ts` | All program courses | ❌ DELETE (duplicate) |
| `seed-fast-external-courses.ts` | External courses | ❌ DELETE (duplicate) |

**Recommendation:** Consolidate all seeding into `course-builder/generate-course.ts`

---

## 🟠 VIDEO GENERATION (9 → 3)

### Current Scripts
```
scripts/
├── generate-course-videos.ts          ← MAIN video generator
├── generate-course-preview-videos.ts  ← Preview videos only
├── generate-course-preview-audio.ts   ← Audio extraction only
├── generate-hvac-videos.ts           ← HVAC specific (DUPLICATE)
├── generate-hvac-videos-did.ts       ← HVAC DID specific (DUPLICATE)
├── generate-hvac-did-videos.ts       ← HVAC DID specific (DUPLICATE)
├── generate-hvac-lesson-videos.ts    ← HVAC lesson videos (DUPLICATE)
├── generate-hvac-audio.ts            ← HVAC audio (DUPLICATE)
└── [12 more HVAC-specific scripts]   ← HVAC duplicates
```

### Recommendation
```
scripts/
├── generate-course-videos.ts    ← GENERIC: Works for all courses
├── generate-course-preview-videos.ts
└── generate-course-preview-audio.ts
```

**DELETE:**
- `generate-hvac-videos.ts`
- `generate-hvac-videos-did.ts`
- `generate-hvac-did-videos.ts`
- `generate-hvac-lesson-videos.ts`
- `generate-hvac-audio.ts`

---

## 🟣 HVAC SPECIFIC SCRIPTS (14 → 2)

### Current Scripts
```
scripts/
├── seed-hvac-curriculum.ts         ← Seeds HVAC curriculum
├── seed-hvac-program.ts             ← Seeds HVAC program
├── seed-hvac-youtube-urls.ts       ← Adds YouTube URLs
├── assemble-hvac-lesson.ts          ← Assembles lessons
├── assemble-hvac-v16.mjs            ← Assembles v16
├── build-hvac-lesson-manifests.ts   ← Builds manifests
├── build-hvac-manifest.mjs          ← Builds manifest
├── backfill-hvac-durations.ts       ← Backfills durations
├── backfill-hvac-script-text.ts     ← Backfills text
├── generate-missing-hvac-media.ts   ← Generates media
├── link-hvac-videos.ts             ← Links videos
├── check-hvac-content.ts            ← Checks content
├── create-hvac-test-user.ts         ← Creates test user
└── rebuild-hvac-videos-v5.ts        ← Rebuilds videos
```

### Recommendation
```
scripts/hvac/
├── seed-hvac.ts                    ← ALL seeding in ONE script
├── generate-hvac-videos.ts          ← ALL video generation
└── validate-hvac.ts                ← Content validation
```

**Keep for now:**
- `seed-hvac-curriculum.ts` ← Seeds HVAC curriculum (KEEP)
- `check-hvac-content.ts` ← Content validation (KEEP)

**DELETE:** 12 scripts (consolidate into 2)

---

## 🔵 IMPORT/EXPORT (6 → 2)

| Script | Purpose | Action |
|--------|---------|--------|
| `insert-courses-api.mjs` | Insert via API | ✅ KEEP |
| `sync-static-courses-to-supabase.mjs` | Sync to Supabase | ✅ KEEP |
| `insert-courses-simple.mjs` | Simple insert | ❌ DELETE (duplicate) |
| `import-partner-courses.ts` | Import partner | ❌ CONSOLIDATE |
| `scrape-all-partner-courses.ts` | Scrape partners | ❌ CONSOLIDATE |
| `setup-all-partner-courses.ts` | Setup partners | ❌ CONSOLIDATE |

**Recommendation:** Consolidate partner imports into `insert-courses-api.mjs`

---

## ⚪ OTHER SCRIPTS (10 → 2)

| Script | Purpose | Action |
|--------|---------|--------|
| `course-factory.ts` | Factory pattern | ❌ DELETE (deprecated) |
| `build-courses.ts` | Build courses | ❌ DELETE (duplicate of build.ts) |
| `build-course-pipeline.ts` | Pipeline build | ❌ DELETE (duplicate) |
| `generate-barber-course.ts` | Barber generator | ❌ DELETE (duplicate) |
| `generate-lms-course-index.mjs` | Index generator | ⚠️ CHECK |
| `pptx_to_course.py` | PPTX conversion | ❌ DELETE (unused?) |
| `activate-courses.sh` | Activation script | ❌ DELETE |
| `migrate-course-videos-to-r2.ts` | Video migration | ⚠️ KEEP (one-time) |
| `upload-course-previews-to-storage.ts` | Upload previews | ⚠️ CONSOLIDATE |
| `restore-all-course-pages.sh` | Restore pages | ❌ DELETE |

---

## 🗂️ RECOMMENDED FINAL STRUCTURE

```
scripts/
├── course-builder/
│   ├── generate-course.ts      ← MAIN: Generate any course
│   ├── build.ts                ← BUILD: Build course
│   ├── validate.ts             ← VALIDATE: Check quality
│   ├── run.ts                  ← RUN: Full pipeline
│   ├── types.ts                ← TYPES
│   ├── insert-courses.ts       ← INSERT: To database
│   └── seeds/
│       └── *.seed.ts          ← Course seeds
│
├── hvac/
│   ├── seed-hvac.ts           ← HVAC seeding
│   ├── generate-videos.ts      ← HVAC video generation
│   └── validate-content.ts     ← HVAC validation
│
├── partners/
│   ├── import-partners.ts      ← Partner import
│   └── sync-partners.ts        ← Partner sync
│
└── misc/
    ├── migrate-videos.ts      ← Video migration
    └── upload-previews.ts      ← Preview upload
```

---

## FILES TO DELETE

```bash
# DUPLICATE SEEDING
rm scripts/seed-courses.ts
rm scripts/seed-course-from-blueprint.ts
rm scripts/seed-all-program-courses.ts
rm scripts/seed-fast-external-courses.ts

# DUPLICATE VIDEO GENERATION
rm scripts/generate-hvac-videos.ts
rm scripts/generate-hvac-videos-did.ts
rm scripts/generate-hvac-did-videos.ts
rm scripts/generate-hvac-lesson-videos.ts
rm scripts/generate-hvac-audio.ts

# HVAC DUPLICATES (KEEP 2)
rm scripts/seed-hvac-program.ts
rm scripts/seed-hvac-youtube-urls.ts
rm scripts/assemble-hvac-lesson.ts
rm scripts/assemble-hvac-v16.mjs
rm scripts/build-hvac-lesson-manifests.ts
rm scripts/build-hvac-manifest.mjs
rm scripts/backfill-hvac-durations.ts
rm scripts/backfill-hvac-script-text.ts
rm scripts/generate-missing-hvac-media.ts
rm scripts/link-hvac-videos.ts
rm scripts/create-hvac-test-user.ts
rm scripts/rebuild-hvac-videos-v5.ts

# OTHER DUPLICATES
rm scripts/course-factory.ts
rm scripts/build-courses.ts
rm scripts/build-course-pipeline.ts
rm scripts/generate-barber-course.ts
rm scripts/generate-lms-course-index.mjs
rm scripts/pptx_to_course.py
rm scripts/activate-courses.sh
rm scripts/restore-all-course-pages.sh
rm scripts/audit-course-generator.sh

# AUDITING (DEPRECATED)
rm scripts/test-course-builder.ts
rm scripts/test-course-builder-pipeline.ts
rm scripts/audit-barber-course.ts
rm scripts/audit-barber-course-generation.ts
rm scripts/verify-barber-course.ts

# IMPORT/EXPORT DUPLICATES
rm scripts/insert-courses-simple.mjs

# GENERATED FILES
rm scripts/generated/barber-course.generated.ts
rm scripts/generated/barber-course.generated.json

# ESTIMATED SAVINGS: 31 files deleted
```

---

## FILES TO KEEP

```
scripts/
├── course-builder/
│   ├── generate-course.ts          ✅
│   ├── build.ts                     ✅
│   ├── validate.ts                  ✅
│   ├── run.ts                       ✅
│   ├── types.ts                     ✅
│   ├── apply-taxonomy.ts            ✅
│   ├── verify-course-ownership.ts   ✅
│   └── seeds/
│       └── barber-course.seed.ts    ✅
│
├── seed-hvac-curriculum.ts          ✅ (HVAC only)
├── check-hvac-content.ts            ✅ (HVAC validation)
│
├── insert-courses-api.mjs           ✅
├── sync-static-courses-to-supabase.mjs ✅
│
├── generate-course-videos.ts        ✅
├── generate-course-preview-videos.ts ✅
├── generate-course-preview-audio.ts  ✅
│
├── migrate-course-videos-to-r2.ts    ✅ (migration)
└── upload-course-previews-to-storage.ts ✅
```

**Total to keep:** ~15 scripts

---

## CONSOLIDATION PLAN

### Phase 1: Create Unified Course Builder
```typescript
// scripts/course-builder/run.ts
// Should handle:
const actions = {
  'generate': () => generateCourse(program),
  'seed': () => seedCourses(program),
  'videos': () => generateVideos(program),
  'validate': () => validateCourse(program),
  'all': () => runFullPipeline(program),
};
```

### Phase 2: Create Unified HVAC Builder
```typescript
// scripts/hvac/run.ts
// Should handle:
const hvacActions = {
  'seed': () => seedHvac(),
  'curriculum': () => seedHvacCurriculum(),
  'videos': () => generateHvacVideos(),
  'sync-urls': () => syncYoutubeUrls(),
  'validate': () => validateHvacContent(),
  'all': () => runHvacPipeline(),
};
```

### Phase 3: Delete Duplicates
```bash
# Run this after consolidation
rm [31 duplicate files]
```

---

## AUDIT SIGN-OFF

**Auditor:** OpenHands Agent
**Date:** 2026-07-11
**Scripts Found:** 41
**Scripts to Keep:** 15
**Scripts to Delete:** 26
**Consolidation Savings:** ~80% reduction
