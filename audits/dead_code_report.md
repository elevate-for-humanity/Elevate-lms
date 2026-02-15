# Dead Code & Duplication Report

Date: 2026-02-14

## SCORM Player Duplicates

| File | Lines | Status | Recommendation |
|---|---|---|---|
| `app/lms/(app)/scorm/[scormId]/ScormPlayerWrapper.tsx` | ~180 | CANONICAL — used | Keep |
| `components/scorm/ScormPlayer.tsx` | 104 | 0 app imports | DELETE (true duplicate) |
| `lib/scorm/scorm-player.ts` | 265 | Utility class, not imported | CONSOLIDATE or DELETE |
| `cloudflare-workers/scorm-player-worker.js` | N/A | Not part of Next.js app | ORPHAN — archive or delete |
| `components/course/ScormLaunchPanel.tsx` | N/A | Used by UniversalLessonPlayer | Keep |

## Unused Components (0 app imports, >100 lines)

| Component | Lines | Recommendation |
|---|---|---|
| `components/course/AutomaticCourseBuilder.tsx` | 431 | CONSOLIDATE — may be useful for AI course gen |
| `components/course/DragDropBuilder.tsx` | 386 | CONSOLIDATE — drag-drop lesson ordering |
| `components/ProgramFinder.tsx` | 474 | CONSOLIDATE — could replace search page |
| `components/SocialLearningCommunity.tsx` | 303 | CONSOLIDATE — future feature |
| `components/dashboard/RightSidebar.tsx` | 369 | CONSOLIDATE — dashboard layout option |
| `components/dashboard/DashboardSidebar.tsx` | 244 | CONSOLIDATE — dashboard layout option |
| `components/VoiceInput.tsx` | 268 | CONSOLIDATE — accessibility feature |
| `components/outcomes/LiveOutcomesDashboard.tsx` | 249 | CONSOLIDATE — outcomes reporting |
| `components/security/SimpleCaptcha.tsx` | 220 | CONSOLIDATE — form security |
| `components/dashboard/DashboardUpload.tsx` | 212 | CONSOLIDATE — file upload |
| `components/AdvancedVideoPlayer.tsx` | 205 | CONSOLIDATE — video player upgrade |
| `components/course/CourseReviewsPanel.tsx` | 201 | CONSOLIDATE — student reviews |
| `components/notifications/NotificationBell.tsx` | 190 | CONSOLIDATE — notification system |
| `components/course/CourseReviewsSection.tsx` | 177 | CONSOLIDATE — student reviews |
| `components/ModuleBreakdown.tsx` | 153 | CONSOLIDATE — module display |
| `components/ProgramHighlights.tsx` | 138 | CONSOLIDATE — program marketing |
| `components/TeamSection.tsx` | 115 | CONSOLIDATE — about page |

**Total unused component code: ~4,345 lines**

Note: These are NOT recommended for deletion. They represent future features (notifications, voice input, social learning, reviews). Recommend moving to `components/_unused/` or tagging with `@deprecated` comments.

## Potentially Unused API Routes

| Route | Purpose | Status |
|---|---|---|
| `/api/autopilots/run-tests` | Test runner | DEV-ONLY |
| `/api/admin/generate-lesson-videos` | AI video gen | API-ONLY (no UI) |
| `/api/studio/generate-tests` | Test gen | API-ONLY (no UI) |
| `/api/content/testimonials` | Testimonials | May be used by marketing pages |
| `/api/drug-testing/checkout` | Drug testing product | Separate product line |

## Summary

- **True duplicates to delete**: 1 (`components/scorm/ScormPlayer.tsx`)
- **Orphan files**: 1 (`cloudflare-workers/scorm-player-worker.js`)
- **Unused but valuable components**: 17 (4,345 lines) — consolidate, don't delete
- **API-only routes without UI**: 2-3 — acceptable for admin/automation use
