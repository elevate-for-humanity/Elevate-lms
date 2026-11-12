# Course Factory Migration — Complete

The Phase 2 migration that this document originally planned is finished. The
earlier checklist (route rewrites, blueprint-loader adoption, deprecations) is
historical and must not be used as a work list.

## Current authority

| Concern | Authority |
|---------|-----------|
| Public entry point | `lib/course-factory/index.ts` — a facade that re-exports `courseFactory` from `lib/course-builder/orchestrator` plus the blueprint, content and type APIs |
| Generation | `lib/course-builder/orchestrator.ts` → `requestCanonicalGeneration(db, input, actorId)` (canonical Ultimate starter) |
| Program configuration | `saveCourseProgramConfiguration` in the orchestrator |
| Media queue | `queueCourseLessonVideos` in the orchestrator |
| Studio control plane | `lib/devstudio/course-builder-controller.ts` backed by `DevStudioUltimateCourseControl` (`lib/devstudio/ultimate-course-control.ts`) |
| Build queue | `ultimate_course_builds` + `ultimate_build_jobs` (Ultimate worker) |
| Release | `UltimateReleaseService.publish` (`lib/ultimate-course-builder/release/release-service.ts`); a row in `ultimate_release_versions` is publication authority |
> **Status: migration complete.** The tables below the status table are the historical Phase 2 plan.

| System | Status |
|--------|--------|
| Course Factory migration | ✅ Complete |
| `lib/course-factory/index.ts` | ✅ Facade — exports `courseFactory` from the canonical `lib/course-builder/orchestrator` |
| `lib/course-factory/factory.ts` | 🚫 Banned — `scripts/check-course-factory-authority.mjs` fails if it exists or is imported |
| `lib/course-builder/` | ✅ Canonical Course Builder orchestration layer |

## Enforcement

`scripts/check-course-factory-authority.mjs` (run by `.github/workflows/course-factory-authority.yml`) fails the build when:

- `lib/course-factory/factory.ts` exists — the superseded raw factory is banned;
- any file imports `@/lib/course-factory/factory`;
- `lib/course-factory/index.ts` stops exporting the Course Builder facade;
- the orchestrator stops routing through `requestCanonicalGeneration`, `saveCourseProgramConfiguration` or `queueCourseLessonVideos`;
- the Studio controller is not backed by the Ultimate control plane.

## Operations

- Diagnose the queue: `pnpm diagnose:course-builds --hours 24` (read-only; `--apply` requeues dead leases, `--requeue-codes` explicitly requeues retry-exhausted jobs whose error class is fixed).
- Publish approved builds: `npx tsx scripts/gcp/publish-approved-courses.ts` (service role).
- Reconcile releases: `scripts/audits/course-release-reconciliation-20261031.sql`.
- Health: `GET /api/admin/dev-studio/courses/health` (tables, job queue, stuck jobs, 24h failures, teaching-photo configuration).
