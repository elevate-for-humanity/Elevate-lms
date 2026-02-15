# SCORM End-to-End Truth Report

Date: 2026-02-14

## Pipeline Status

| Component | Status | Evidence |
|---|---|---|
| Upload API | COMPLETE | `app/api/scorm/upload/route.ts` — JSZip extraction, manifest parsing |
| Manifest parsing | COMPLETE | `fast-xml-parser` at line 9, `imsmanifest.xml` parsed at line 82 |
| Launch href detection | COMPLETE | `findLaunchHref()` function traverses organization → item → resource |
| File extraction to storage | COMPLETE | Uploads to Supabase `course-content` bucket |
| Content serving | COMPLETE | `app/api/scorm/content/[packageId]/[...path]/route.ts` — 25+ MIME types |
| Embedded player | COMPLETE | `app/lms/(app)/scorm/[scormId]/ScormPlayerWrapper.tsx` — iframe-based |
| CMI API shim | COMPLETE | `lib/scorm/scorm-api.ts` — SCORM 1.2 + 2004 support |
| Tracking persistence | COMPLETE | `ScormPlayerWrapper.tsx:164` — writes to `scorm_attempts` table |
| Resume on reload | COMPLETE | `ScormPlayerWrapper.tsx:46-60` — queries existing incomplete attempt |
| Upload UI | PARTIAL | `app/admin/modules/module-form.tsx:217` — SCORM upload section exists in module form, but no standalone SCORM upload page |

## Player Inventory

| File | Status | Imported By |
|---|---|---|
| `app/lms/(app)/scorm/[scormId]/ScormPlayerWrapper.tsx` | CANONICAL — embedded iframe + tracking | `scorm/[scormId]/page.tsx` |
| `components/scorm/ScormPlayer.tsx` | UNUSED — 0 imports | None |
| `lib/scorm/scorm-player.ts` | UTILITY — CMI helper class | Not directly imported |
| `components/course/ScormLaunchPanel.tsx` | USED — launch panel in UniversalLessonPlayer | `UniversalLessonPlayer.tsx` |
| `cloudflare-workers/scorm-player-worker.js` | UNUSED — Cloudflare worker, not deployed | None |

## Duplicates

- `components/scorm/ScormPlayer.tsx` — 104 lines, 0 imports. **SHOULD BE DELETED** (true duplicate)
- `cloudflare-workers/scorm-player-worker.js` — not part of Next.js app. **ORPHAN**

## Gaps

1. **No standalone SCORM upload page** — upload is embedded in module form, not a dedicated admin page
2. `components/scorm/ScormPlayer.tsx` is dead code (0 imports)
3. `lib/scorm/scorm-player.ts` is a utility class but not imported by the canonical player

## Overall Verdict: COMPLETE (with minor dead code)

The SCORM pipeline is end-to-end functional:
Upload → Extract → Parse manifest → Store files → Serve content → Embedded iframe → CMI tracking → DB persistence → Resume on reload

Not LAUNCH-ONLY. Not STUBBED. Real tracking with real persistence.
