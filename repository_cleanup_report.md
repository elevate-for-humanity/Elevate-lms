# Repository Cleanup Report

Generated: 2026-03-27  
Auditor: Ona

All statements reference real files, routes, schema objects, or storage usage.

---

## Updated Facts

| Item | Before | After |
|------|--------|-------|
| Build page count in AGENTS.md | Hardcoded "882/882 pages" | Removed — zero-error requirement stated only |
| console.log count in AGENTS.md | 161 | 1,521 across 118 files |
| error.message route count in AGENTS.md | "394 routes" | ~22 API route files (all in logger calls, not response bodies) |
| Rate limit dead files | 3 importable dead files | 2 deleted, 1 deprecated-only |
| Blueprint registry | PRS Indiana only | PRS Indiana + HVAC EPA-608 registered |
| Storage helpers | 2 using deprecated shims | Both migrated to `lib/supabase/client.ts` |
| Checkpoint gating | Not implemented | Migration written, gate enforced in lesson page |
| Auto-certificate issuance | Not wired | Fires on course completion when all checkpoints pass |
| CurriculumLessonManager | Not built | Built at `components/admin/CurriculumLessonManager.tsx` |
| AGENTS.md | Stale, missing LMS/migration/storage sections | Fully rewritten to reflect real platform state |

---

## Removed or Deprecated Items

### Deleted (0 importers confirmed before deletion)

| File | Reason |
|------|--------|
| `lib/rateLimiter.ts` | Dead — used `redis` npm client (not Upstash), 0 importers |
| `lib/api/rate-limiter.ts` | Dead — in-memory Map, 0 importers |
| `lib/safe-error.ts` | Root-level duplicate of `lib/api/safe-error.ts`, 0 importers |
| `lib/logging/logger.ts` | Duplicate of `lib/logger.ts`, 0 importers |

### Deprecated (marked, importers migrated)

| File | Action |
|------|--------|
| `lib/rateLimit.ts` | `@deprecated` JSDoc already present. All 11 importers migrated to `applyRateLimit` from `lib/api/withRateLimit.ts`. File retained until confirmed zero importers in production. |
| `app/api/auth/login/route.ts` | `@deprecated` JSDoc added. Duplicate of `/api/auth/signin`. Dead secondary rate-limit call removed. |

### Dead Code Removed from 11 Routes

Removed dead secondary `lib/rateLimit` calls (import + call + conditional block) from:
`app/api/contact/route.ts`, `app/api/applications/route.ts`, `app/api/marketplace/apply/route.ts`, `app/api/marketplace/report/route.ts`, `app/api/checkout/marketplace/route.ts`, `app/api/booking/schedule/route.ts`, `app/api/partners/barbershop-apprenticeship/apply/route.ts`, `app/api/blog/route.ts`, `app/api/upload/route.ts`, `app/api/inquiries/route.ts`, `app/api/auth/login/route.ts`

All 11 routes already had the canonical `applyRateLimit` call — the dead calls were redundant secondary checks running after the Redis check.

### Legacy Comments Added

| File | Comment |
|------|---------|
| `app/courses/hvac/module1/lesson1/page.tsx` | `@legacy` — not part of LMS engine |
| `app/lms/(app)/courses/healthcare-fundamentals/page.tsx` | `@legacy` — static, not DB-driven |
| `app/lms/(app)/courses/[courseId]/complete/page.tsx` | `@legacy` — pre-dates certification end-state |

### Storage Helpers Fixed

| File | Before | After |
|------|--------|-------|
| `lib/mou-storage.ts` | `createBrowserClient(NEXT_PUBLIC_URL, NEXT_PUBLIC_KEY)` inline | `createClient()` from `lib/supabase/client.ts` |
| `lib/storage/complianceEvidence.ts` | `createSupabaseClient()` from deprecated `lib/supabase-api` | `createClient()` from `lib/supabase/client.ts` |

---

## Completed LMS Work

### Migration: `supabase/migrations/20260327000003_checkpoint_gating.sql`

Created. Contains:
- `passing_score integer NOT NULL DEFAULT 70` column on `curriculum_lessons`
- `checkpoint_scores` table — records per-learner score per checkpoint/exam step, with `passed` as a generated column (`score >= passing_score`)
- `step_submissions` table — lab/assignment submissions with instructor sign-off workflow (`submitted | under_review | approved | rejected | revision_requested`)
- `program_completion_certificates` table — canonical completion record, auto-issued on course completion
- Rebuilt `lms_lessons` view to expose `passing_score` from `curriculum_lessons`
- RLS on all new tables: users see own rows; service_role unrestricted

**Must be applied manually via Supabase Dashboard SQL Editor before checkpoint gating is active.**

### Checkpoint Gate in Lesson Page

`app/lms/(app)/courses/[courseId]/lessons/[lessonId]/page.tsx`:
- Fetches `checkpoint_scores` for the current course on load
- Detects if the current lesson is in module N and the checkpoint for module N-1 has not been passed
- Shows a gate banner and disables the "Mark as Complete" button when blocked
- On checkpoint/exam quiz completion, writes a `checkpoint_scores` row and unlocks the next module if passed

### Auto-Certificate Issuance

`app/api/lessons/[lessonId]/complete/route.ts`:
- After course completion, checks that all `checkpoint_scores` for the course are passing
- If all pass and no existing cert exists, writes a `program_completion_certificates` row with a unique `EFH-XXXXXXXX` certificate number
- Non-fatal — lesson completion is recorded regardless of cert issuance success

### QuizPlayer Signature Update

`components/lms/QuizPlayer.tsx`:
- `onComplete` now passes `(score: number, answers?: Record<string, number>)` — answers map is passed to `checkpoint_scores.answers` for audit trail

### CurriculumLessonManager Component

`components/admin/CurriculumLessonManager.tsx` — built. Exposes:
- `step_type` dropdown (all 7 values)
- `passing_score` number input (shown only for quiz/checkpoint/exam)
- `lesson_title`, `script_text`, `video_file`, `duration_minutes`, `status` fields
- Module-grouped display with expand/collapse per lesson
- Inline save with dirty state tracking and save status indicators
- Read-only slug and ID display for reference

### HVAC Blueprint Registered

`lib/curriculum/blueprints/index.ts` — `HVAC_EPA608_BLUEPRINT` added to registry. HVAC can now use the DB-driven curriculum generator.

---

## Remaining Blockers

| Blocker | File | Required Action |
|---------|------|-----------------|
| Migration not applied | `supabase/migrations/20260327000003_checkpoint_gating.sql` | Run manually in Supabase Dashboard SQL Editor |
| Admin curriculum builder page missing | `app/admin/curriculum/[courseId]/page.tsx` | Create page, embed `CurriculumLessonManager` |
| Lab/assignment instructor sign-off UI | `step_submissions` table ready, no UI | Build instructor review queue |
| 78 deprecated Supabase shim importers | 10 shim files | Migrate gradually to `lib/supabase/*` |
| `lib/rateLimit.ts` still exists | `lib/rateLimit.ts` | Delete after confirming 0 production importers |
| `lib/curriculum/blueprints/prs.ts` | `lib/curriculum/blueprints/prs.ts` | Verify content matches `prs-indiana.ts`, delete if superseded |
| 8 cert tables with no migration source | `certificates`, `issued_certificates`, etc. | Verify in Supabase Dashboard; create migrations if needed |
| ~1,521 `console.log` calls | 118 files | Replace with `logger` from `lib/logger.ts` |
