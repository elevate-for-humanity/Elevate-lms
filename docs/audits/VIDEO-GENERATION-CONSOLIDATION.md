# VIDEO GENERATION CONSOLIDATION AUDIT

**Date:** 2026-07-11
**Status:** 🔴 CRITICAL - 60+ Duplicate Scripts

---

## EXECUTIVE SUMMARY

You are RIGHT. There are **60+ video generation scripts** when you only need **ONE**.

---

## THE PROBLEM: Massive Duplication

| Category | Count | Should Be |
|----------|------:|----------:|
| Barber video scripts | 10 | 0 (generic works) |
| HVAC video scripts | 15 | 0 (generic works) |
| Course video scripts | 3 | 1 (KEEP) |
| Audio/Speech scripts | 7 | 1 |
| Batch/Helper scripts | 15+ | 0 |
| Pexels/Fetch scripts | 8+ | 0 |
| **TOTAL** | **60+** | **2** |

---

## THE SOLUTION: ONE COURSE BUILDER

### ✅ THE GENERIC COURSE VIDEO GENERATOR EXISTS

```
scripts/generate-course-videos.ts
```

This is the **GOLDEN STANDARD** that should work for ALL courses:

```typescript
const COURSES: Record<string, CourseConfig> = {
  barber: {
    id: '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17',
    label: 'Barber Apprenticeship',
    table: 'course_lessons',
    // ...
  },
  // ADD HVAC HERE:
  // hvac: {
  //   id: '<hvac-course-id>',
  //   label: 'HVAC EPA 608',
  //   table: 'curriculum_lessons',
  //   // ...
  // },
};
```

### HOW IT WORKS

1. Pull lesson rows from database
2. Split markdown into scenes by ## headings
3. Match b-roll clips to content
4. Generate TTS narration (OpenAI)
5. Trim clips to audio duration
6. Concatenate → MP4
7. Upload to Supabase CDN
8. Write URL to DB

**This should work for ANY course!**

---

## SCRIPTS TO DELETE (60+)

### ❌ Barber Video Scripts (DELETE ALL - use generic)
```
scripts/generate-barber-videos.ts
scripts/generate-barber-videos-free.ts
scripts/generate-barber-videos-supabase.ts
scripts/generate-barber-lesson-videos.ts
scripts/generate-barber-intro-video.ts
scripts/generate-barber-orientation-video.ts
scripts/barber-video-pexels-helpers.ts
scripts/fix-barber-missing-videos.ts
scripts/list-missing-barber-videos.ts
scripts/rebuild-barber-lesson-videos.ts
scripts/bind-barber-videos.ts
```

### ❌ HVAC Video Scripts (DELETE ALL - use generic)
```
scripts/generate-hvac-videos.ts
scripts/generate-hvac-videos-did.ts
scripts/generate-hvac-did-videos.ts
scripts/generate-hvac-lesson-videos.ts
scripts/generate-hvac-lesson1-video.ts
scripts/generate-hvac-makeover-videos.mjs
scripts/rebuild-hvac-videos-v5.ts
scripts/link-hvac-videos.ts
scripts/assemble-hvac-lesson.ts
scripts/assemble-hvac-v16.mjs
scripts/build-hvac-lesson-manifests.ts
scripts/build-hvac-manifest.mjs
```

### ❌ Audio/Speech Scripts (KEEP 1)
```
scripts/generate-lesson-audio.ts              ← KEEP (generic)
scripts/generate-course-preview-audio.ts       ← KEEP (preview)
scripts/generate-hvac-audio.ts               ← DELETE
scripts/generate-program-holder-audio.ts     ← DELETE
scripts/generate-hero-audio.ts              ← DELETE
scripts/generate-home-hero-audio.ts         ← DELETE
scripts/generate-learner-hero-audio.ts      ← DELETE
scripts/upload-hvac-audio-to-storage.ts     ← DELETE
```

### ❌ Batch/Helper Scripts (MOSTLY DELETE)
```
scripts/batch-generate-videos.ts            ← DELETE (use CLI flags)
scripts/batch-generate-audio.mjs           ← DELETE
scripts/batch-assemble-videos.mjs          ← DELETE
scripts/prepare-video-jobs.mjs             ← DELETE
scripts/generate-videos-batch.ts           ← DELETE
scripts/generate-videos-from-audio.ts      ← DELETE
scripts/extract-audio-from-videos.ts       ← DELETE
scripts/regen-audio-csv.mjs               ← DELETE
```

### ❌ Fetch/Pexels Scripts (KEEP 1)
```
scripts/fetch-pexels-program-videos.mjs    ← KEEP (generic b-roll fetcher)
scripts/scan-pexels-barber-videos.ts       ← DELETE
scripts/barber-video-pexels-helpers.ts    ← DELETE
scripts/fetch-broll-clips.ts                ← KEEP (if exists)
```

### ❌ Demo/Test Scripts (DELETE)
```
scripts/generate-demo-videos.ts
scripts/generate-demo-videos-openai.ts
scripts/create-demo-video.sh
scripts/pilot-lesson-videos.ts
```

### ❌ 3D/Render Scripts (DELETE)
```
scripts/render-3d-video.mjs
scripts/generate-avatar-videos.ts
scripts/generate-heygen-video.ts
scripts/download-heygen-videos.sh
```

### ❌ Hero/Preview Scripts (DELETE - use generic)
```
scripts/generate-hero-videos.ts
scripts/generate-intro-video.mjs
scripts/build-makeover-videos.mjs
scripts/patch-hero-banners-video-only.mjs
```

### ❌ Misc Video Scripts (MOSTLY DELETE)
```
scripts/generate-lesson-video-runway.ts      ← DELETE
scripts/generate-missing-videos.ts          ← DELETE
scripts/enforce-video-invariants.ts        ← DELETE
scripts/fix-barber-missing-videos.ts       ← DELETE
scripts/assemble-program-holder-video.sh    ← DELETE
```

---

## SCRIPTS TO KEEP (2-3)

### ✅ GENERIC COURSE VIDEO GENERATOR
```
scripts/generate-course-videos.ts
```

**Usage:**
```bash
# Generate all courses
pnpm tsx scripts/generate-course-videos.ts

# Generate specific course
pnpm tsx scripts/generate-course-videos.ts --course hvac

# Generate specific module
pnpm tsx scripts/generate-course-videos.ts --course hvac --module 1

# Generate specific lesson
pnpm tsx scripts/generate-course-videos.ts --course hvac --slug hvac-01-01
```

### ✅ GENERIC AUDIO GENERATOR
```
scripts/generate-lesson-audio.ts
```

### ✅ B-ROLL FETCHER (if needed)
```
scripts/fetch-pexels-program-videos.mjs
```

---

## RECOMMENDED ARCHITECTURE

```
scripts/
├── course-builder/
│   ├── generate-course.ts        ← Generate course structure
│   ├── generate-content.ts      ← Generate lesson content (AI)
│   ├── generate-quizzes.ts     ← Generate quiz questions (AI)
│   ├── generate-videos.ts       ← Generate lesson videos ← MAIN
│   ├── generate-audio.ts        ← Generate audio only
│   ├── upload-videos.ts         ← Upload to CDN
│   ├── validate.ts             ← Validate course completeness
│   └── run.ts                  ← Full pipeline
│
├── broll/
│   └── fetch-broll.ts          ← Fetch b-roll clips
│
└── [DELETE ALL OTHER VIDEO SCRIPTS]
```

---

## HOW TO ADD HVAC TO THE GENERIC GENERATOR

Edit `scripts/generate-course-videos.ts`:

```typescript
const COURSES: Record<string, CourseConfig> = {
  barber: {
    id: '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17',
    label: 'Barber Apprenticeship',
    table: 'course_lessons',
    outDir: path.join(process.cwd(), 'public/videos/barber-lessons'),
    storageBucket: 'course-videos',
    storagePrefix: 'barber',
  },
  // ADD HVAC:
  hvac: {
    id: 'f0593164-55be-5867-98e7-8a86770a8dd0', // HVAC_COURSE_ID from seed-hvac-curriculum.ts
    label: 'HVAC EPA 608',
    table: 'curriculum_lessons',
    outDir: path.join(process.cwd(), 'public/videos/hvac-lessons'),
    storageBucket: 'course-videos',
    storagePrefix: 'hvac',
  },
};
```

Then run:
```bash
pnpm tsx scripts/generate-course-videos.ts --course hvac
```

---

## FILES TO DELETE (60+)

```bash
# Barber duplicates
rm scripts/generate-barber-videos.ts
rm scripts/generate-barber-videos-free.ts
rm scripts/generate-barber-videos-supabase.ts
rm scripts/generate-barber-lesson-videos.ts
rm scripts/generate-barber-intro-video.ts
rm scripts/generate-barber-orientation-video.ts
rm scripts/barber-video-pexels-helpers.ts
rm scripts/fix-barber-missing-videos.ts
rm scripts/list-missing-barber-videos.ts
rm scripts/rebuild-barber-lesson-videos.ts
rm scripts/bind-barber-videos.ts

# HVAC duplicates
rm scripts/generate-hvac-videos.ts
rm scripts/generate-hvac-videos-did.ts
rm scripts/generate-hvac-did-videos.ts
rm scripts/generate-hvac-lesson-videos.ts
rm scripts/generate-hvac-lesson1-video.ts
rm scripts/generate-hvac-makeover-videos.mjs
rm scripts/rebuild-hvac-videos-v5.ts
rm scripts/link-hvac-videos.ts
rm scripts/assemble-hvac-lesson.ts
rm scripts/assemble-hvac-v16.mjs
rm scripts/build-hvac-lesson-manifests.ts
rm scripts/build-hvac-manifest.mjs

# Audio duplicates
rm scripts/generate-hvac-audio.ts
rm scripts/generate-program-holder-audio.ts
rm scripts/generate-hero-audio.ts
rm scripts/generate-home-hero-audio.ts
rm scripts/generate-learner-hero-audio.ts
rm scripts/upload-hvac-audio-to-storage.ts

# Batch/Helper duplicates
rm scripts/batch-generate-videos.ts
rm scripts/batch-generate-audio.mjs
rm scripts/batch-assemble-videos.mjs
rm scripts/prepare-video-jobs.mjs
rm scripts/generate-videos-batch.ts
rm scripts/generate-videos-from-audio.ts
rm scripts/extract-audio-from-videos.ts
rm scripts/regen-audio-csv.mjs

# Demo/Test duplicates
rm scripts/generate-demo-videos.ts
rm scripts/generate-demo-videos-openai.ts
rm scripts/create-demo-video.sh
rm scripts/pilot-lesson-videos.ts

# 3D/Render duplicates
rm scripts/render-3d-video.mjs
rm scripts/generate-avatar-videos.ts
rm scripts/generate-heygen-video.ts
rm scripts/download-heygen-videos.sh

# Hero/Preview duplicates
rm scripts/generate-hero-videos.ts
rm scripts/generate-intro-video.mjs
rm scripts/build-makeover-videos.mjs
rm scripts/patch-hero-banners-video-only.mjs

# Misc duplicates
rm scripts/generate-lesson-video-runway.ts
rm scripts/generate-missing-videos.ts
rm scripts/enforce-video-invariants.ts
rm scripts/fix-barber-missing-videos.ts
rm scripts/assemble-program-holder-video.sh
rm scripts/scan-pexels-barber-videos.ts
rm scripts/video-ux-autopilot.mjs

# Keep these:
# scripts/generate-course-videos.ts      ← THE GENERIC ONE
# scripts/generate-lesson-audio.ts       ← GENERIC AUDIO
# scripts/fetch-pexels-program-videos.mjs ← B-ROLL FETCHER
```

---

## SAVINGS

| Metric | Before | After |
|--------|--------|-------|
| Video scripts | 60+ | 3 |
| Files deleted | - | 57+ |
| Complexity | Massive | Simple |
| Maintainability | Nightmare | Easy |

---

## AUDIT SIGN-OFF

**Auditor:** OpenHands Agent
**Date:** 2026-07-11
**Scripts Found:** 60+
**Scripts to Keep:** 3
**Scripts to Delete:** 57+
**Reduction:** 95%
