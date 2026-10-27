# Course Builder Authority Audit — 2026-09-05

## Decision

Course generation is **not safe to resume**. The repository describes one
canonical Course Builder, but production still has multiple mutation paths,
multiple queue models, contradictory completion writers, and workflows that
can spend credits on a push or GitHub issue.

The only supported target architecture is:

```
Admin/Studio request
  -> one Course Builder command service
  -> one durable build job
  -> one canonical course/lesson writer
  -> one canonical video job per lesson
  -> audiovisual verification
  -> lesson completion
  -> course completion
  -> human review/publish
```

## Production evidence

Observed directly in production on 2026-09-05:

| Area                                 |            State | Finding                                                                                    |
| ------------------------------------ | ---------------: | ------------------------------------------------------------------------------------------ |
| `video_jobs`                         |       264 queued | Paid work can continue unless every course is paused or the worker is globally disabled.   |
| `video_jobs`                         |      7 rendering | Several rows are active or stale and require lease-aware reconciliation.                   |
| `video_jobs`                         |        337 draft | Large dormant backlog exists.                                                              |
| `video_jobs`                         |        42 failed | Recovery and retry policy has accumulated failures.                                        |
| `video_jobs`                         |      97 complete | Completion alone is insufficient; URL, review, and quality evidence must also pass.        |
| `devstudio_jobs` / `build_course`    | 0 queued/running | The durable canonical course-build queue is currently idle.                                |
| `course_generation_jobs`             |           0 rows | A second, legacy queue schema exists even though it is unused.                             |
| `course_factory_jobs`                |  1 stale running | Cosmetology run `cosmetology-production-33961700406` remains at 15% with an old heartbeat. |
| Cosmetology course                   |           paused | Its course-specific gate is closed.                                                        |
| Cosmetology approved lesson packages |                0 | No lesson satisfies content + attached video + approved media evidence.                    |

## Repository authority inventory

### Current canonical path

- UI: `components/admin/course-builder/UnifiedCourseBuilder.tsx`
- Browser client: `components/admin/course-builder/runCourseFactoryPipeline.ts`
- HTTP authority: `apps/admin/app/api/admin/course-builder/route.ts`
- Server facade: `lib/course-builder/orchestrator.ts`
- Private generation engine: `lib/course-factory/factory.ts`
- Persistence: `lib/course-factory/publisher.ts`
- Media enqueue: `lib/course-factory/media-service.ts`
- Video queue worker: `apps/admin/app/api/internal/videos/process-queue/route.ts`
- Renderer: `lib/video/process-video-job.ts` -> `lib/video/remotion-render.ts`
- Final readiness: `lib/course-builder/build-lifecycle.ts`

This should remain the only mutation path.

### Parallel or misleading paths

| Path                                                                        | Behavior                                                                                                                                           | Required disposition                                                                      |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `lib/ai/course-generation-worker.ts`                                        | Independent course generator writing `generated_courses`, `generated_modules`, and `generated_lessons`; marks jobs ready without canonical videos. | Delete/quarantine; forbid imports.                                                        |
| `lib/ai/course-builder-cron.ts`                                             | Independent scheduler for `course_generation_jobs`.                                                                                                | Delete/quarantine; forbid imports.                                                        |
| `lib/autopilot/ai-course-builder.ts` and `scripts/build-course-pipeline.ts` | Separate AI course construction path.                                                                                                              | Retired and deleted during consolidation.                                                 |
| `/api/admin/course-builder/integrated`                                      | Built an in-memory credential course and media through a separate integration service, returning a slug as `courseId`.                             | POST retired; duplicate engine deleted; credential lookup retained read-only.             |
| `/api/admin/course-builder/compile`                                         | Compatibility compiler that eventually reaches Course Factory.                                                                                     | Make a thin canonical command adapter; no independent lifecycle language.                 |
| Direct repair/seed/patch scripts                                            | Write lessons or video URLs outside the lifecycle.                                                                                                 | Mark maintenance-only, require explicit guarded mode, and forbid in production workflows. |

### Production-mutating workflows

The following are separate production entry points and violate the one-command
rule:

- `build-cosmetology-course.yml`
- `build-registered-beauty-courses.yml`
- `regenerate-barber-cosmetology.yml`
- `business-draft-bootstrap.yml`
- `dev-studio-course-builder.yml`
- `build-esb-acceptance.yml`
- `upgrade-authored-course.yml`
- `esb-video-recovery-test.yml`
- `purge-esb-course-media.yml`
- `video-worker-smoke.yml`
- Course/video steps inside `cron-scheduler.yml`

Several respond to `push`, `issues`, or schedules. A test or source-code push
can therefore mutate production or start paid media work.

## Completion-rule defects

### 1. Governance overwrites media-pending state

`lib/course-factory/factory.ts` correctly marks a video-enabled course at 95%
and media-pending. Immediately afterward,
`normalizeGeneratedCourseForGovernance()` writes
`generation_status='completed'` and `generation_progress=100` without
checking video readiness. The streaming HTTP route invokes governance after
Course Factory returns and does not invoke the final media gate afterward.

This is the direct reason a text package can look complete before its videos
exist.

### 2. Database constraints validate values, not the unified invariant

Production checks that each status value is from an allowed list, but it does
not enforce relationships between them. It currently permits:

- lesson `generated/completed/approved/published` with no `video_url`;
- lesson media marked approved without matching approved `video_jobs` evidence;
- course `completed` while required lessons remain pending;
- course progress 100 while the media package is incomplete.

### 3. Application tests are structural string checks

`check-course-factory-authority.mjs` and
`check-course-media-authority.mjs` passed during this audit even while the
parallel legacy generator, mutating workflows, contradictory governance writer,
264 queued videos, and zero complete Cosmetology lessons existed. These gates
prove selected imports and strings, not end-to-end authority.

### 4. Renderer input normalization is incomplete

The first URL normalization patch sanitized provider values before assignment,
but the production proof again reached Remotion with an object-valued image
source. The final `SlideLessonProps` boundary does not validate every
`clipUrl`, `imageUrl`, and `audioSrc` after uploads and provider fallbacks.
The renderer must reject or remove non-string media values immediately before
`selectComposition` and `renderMedia`.

## Consolidation requirements

1. Add a production-wide Course Builder kill switch checked by every authoring
   command, durable course worker, video worker, and production workflow.
2. Route all supported generation through one command service and
   `devstudio_jobs(tool_name='build_course')`.
3. Retire the legacy `course_generation_jobs` worker and all workflow-specific
   course builders.
4. Keep one scheduled queue wake only; it may claim work solely when the global
   switch and the course-specific switch are both enabled.
5. Make governance content-only. Only
   `finalizeUnifiedCourseBuildWithClient()` may set course completion to 100%.
6. Enforce lesson and course audiovisual completion invariants in Postgres, not
   only TypeScript.
7. Sanitize and validate the complete Remotion props object at the renderer
   boundary.
8. Replace string-presence tests with negative authority scans and database
   invariant tests.
9. Resume with one draft proof lesson only. Do not release a course batch until
   the proof has a playable URL, approved review, approved quality evidence,
   synchronized lesson state, and no duplicate media identity.

## Resume gate

No course generation should resume until all of the following are true:

- global generation switch is explicitly enabled;
- duplicate production workflows are retired;
- legacy generator imports are impossible;
- database rejects text-only completed lessons;
- database rejects prematurely completed courses;
- final Remotion props contain only valid URL strings or null;
- one bounded proof lesson completes and is playable;
- no second lesson is claimed during the proof.
