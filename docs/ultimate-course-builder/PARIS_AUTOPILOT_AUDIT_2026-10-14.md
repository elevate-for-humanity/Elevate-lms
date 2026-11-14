# Course Builder and PARIS integration audit — 2026-10-14

## Verified failures

| Boundary | Evidence | Correction |
|---|---|---|
| Admin runtime/status | Authenticated status and `/api/health` returned HTTP 503; Admin deployment 38585487266 failed activation with `quota_exceeded` | Preserve explicit HTTP errors, distinguish cached observations from live status, and supervise outside Admin. Live runtime recovery still requires deployment verification. |
| Worker launch | `requestCourseWorker` swallowed direct dispatch failures and returned a generic scheduled-success-sounding notice | Return dispatch error category, unverified execution, and an explicit deferred-launch message. No invented worker assignment. |
| Automatic continuation | Existing finite worker processes one complete lesson before advancing; queue leases, progress watchdog, repair routing and retry budgets already exist | Reuse these authorities. Add external PARIS observation and bounded transient recovery rather than a second renderer or queue. |
| Frozen video | Saved finding was `Media quality gate failed: frozen interval 10.60s exceeds 4s`; router did not recognize its generic code | Route saved and future matching findings to the film renderer. Preserve every earlier checkpoint. Keep the four-second quality gate unchanged. |
| Premium photograph delivery | Premium scene photographs were static between speech cues | Add contained photographic tracking while preserving the entire photograph; invalidate only the render producer contract and dependent checks. Must pass decoded-video QA before acceptance. |
| Live preview | Video appeared only after a checkpoint diagnostic click | Include saved video and actual QA state in sanitized lesson preview; refresh checkpoints periodically, follow the active lesson, and preserve the prior draft while its replacement renders. |
| Historical failures | Repaired passed checkpoints could retain their earlier error in acceptance findings | Retain warnings from restored passed checkpoints; do not carry their historical errors into the new acceptance result. |
| AI integration | Shared operational command executor already exists; PARIS was excluded from course and Studio tools | Connect PARIS to the existing governed tool registry; give all four agents one read-only course-status tool; support named PARIS/ELLIE/LIZZY/ZORA and Zura alias at the existing command endpoint. |

## Autopilot authority

`ultimate_build_jobs.monitor` stores supervision separately from the worker payload and instructional profile. This avoids overwriting progress, pending repairs, or content hashes. Existing service-role queue permissions remain unchanged.

The Google-trusted coordinator checks enabled monitors outside the Admin process. PARIS observes worker claims and leases; expired leases recover through the existing atomic claim function. Failed transient runtime work may requeue at most three times without resetting attempts. Live leases, owner pauses, missing source/license/permission evidence, exhausted lesson repairs, and release gates remain authoritative. A configured monitor is not evidence of a running supervisor; the UI reports absent or stale supervisor observations.

Specialists share the canonical workflow and tool authority: ELLIE instruction, LIZZY operations/media, ZORA independent acceptance checks, PARIS supervision. This does not merge models or prove that every legacy/public chatbot endpoint uses the Admin operating system. No claim of a fully verified global AI integration is made here.

## Validation

- 34 coordinator/checkpoint/monitor tests passed.
- 21 focused course integration, preview, cursor, Studio command and contract tests passed.
- Admin TypeScript checking passed with a 6 GiB Node heap.
- Changed TypeScript/TSX files passed ESLint.
- Admin production build completed successfully: compilation, 141 static pages, and standalone traces. Initial parallel attempts exceeded available memory; the sequential build passed.
- Seven old panel/recovery test failures were reproduced on untouched commit `a0e2bbdcbb2b518fb0062fb21e44a59a86283fff`; they are not regressions from this patch. The old job-lifecycle assertion failure was also reproduced on that baseline.
- Database monitor column was applied and read back. No RLS policy or access grant was changed.
- Cosmetology job `a9b85487-5465-4bc0-bed0-9fc3411c4e50` has monitoring enabled and a saved repair cursor at `lesson_film_render`. Assignment, repaired-media acceptance, and production rollout require live readback.

## Deployment requirements

Deploy from main to the existing Google Admin and course-worker services. A successful build or queue acknowledgment is insufficient: verify exact image/revision, public runtime health, supervisor checkedAt, fresh worker heartbeat, and media QA. The observed quota-blocked Admin activation is an unresolved production incident until those readbacks succeed.
