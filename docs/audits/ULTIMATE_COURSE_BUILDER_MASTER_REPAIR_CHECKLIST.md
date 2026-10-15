# Ultimate Course Builder Master Repair Checklist

## Scope and historical requirements

The supplied task prompt refers to 78 prior requirements for this master checklist. Their exact text is not available in this task's recoverable conversation or source material. This incident checklist records only evidence that is available; it does not invent or imply completion of the missing 78 items. Restoring that exact list is required before a comprehensive 78-item audit can be signed off.

## Incident

- Repository: `elevate-for-humanity/Elevate-lms`
- Production build: `572cca43-6bd6-4a91-b385-a8b576209c4e`
- Course: Cosmetology (`a6b0b712-1cf0-475a-ba79-ee2023dea8ec`)
- Lesson: **Welcome to Cosmetology Apprenticeship** (`45bbd784-08c2-4b13-9c6f-c00952caa70b`)
- Current affected scene: scene 3, “Terminology”
- Live finding: `MEDIA_TEXT_UNREADABLE:3:390`; the stored render passed its render stage, while finished-media QA rejected the small heading at 390px delivery width.
- Live build state before this repair: build `blocked` at `selective_repair`; existing course job `a9b85487-5465-4bc0-bed0-9fc3411c4e50` was `failed` with a checkpoint repair payload and preserved per-lesson repair counts.
- Previously inspected video: [existing saved render](https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/course-videos/generated-lessons/lesson-e1e53bfd-2504-46b0-a814-a31c74a0090a-mv8uk5zx-37e94671-7fdd-44ea-9c05-701e621ec0d2.mp4). The instructional content and licensed visual remain unchanged by the proposed presentation repair.

## Numbered checklist

1. **Identify the exact live build, lesson, and rejected scene.** Evidence: live build/job/lesson records and saved render; finding `MEDIA_TEXT_UNREADABLE:3:390`. **Status: verified.**
2. **Trace repair routing to the producer that owns the visual.** `lib/ultimate-course-builder/core/repair-router.ts:27` routes unreadable media text to `scene_construction`. **Status: verified.**
3. **Make the producer consume the scene-specific repair directive.** `lib/ultimate-course-builder/core/production-handlers.ts:188` applies a title-scale-only repair to the numbered scene, preserving the authored storyboard text and assignments. **Status: implemented.**
4. **Ensure the renderer selects the repaired storyboard.** `lib/ultimate-course-builder/adapters/platform-renderer.ts:148` now gives the repaired scene-construction storyboard precedence over the original storyboard. **Status: implemented.**
5. **Carry the title-scale value through media preparation and Remotion.** `lib/video/media-director.ts:494`, `lib/video/remotion-render.ts:885`, and `remotion-src/compositions/SlideLesson.tsx:647` preserve and clamp the scene-specific value. The repair uses 128px on its first attempt and 144px on a later attempt, bounded by the renderer. **Status: implemented; live render verification pending.**
6. **Do not overwrite an accepted artifact with a rejected repair candidate.** `lib/ultimate-course-builder/core/build-runner.ts:142` compares and validates before persistence, restores the accepted artifact on failure, and does not persist the failed candidate as a new producer artifact. **Status: implemented.**
7. **Classify unchanged producer output as an internal repair failure.** `REPAIR_PRODUCER_UNCHANGED` is no longer treated as an external dependency that blocks automated repair. Licensing and authorization blockers remain external. **Status: implemented.**
8. **Run the focused worker regressions locally.** Command: `node --test tests/worker/verified-self-repair.test.mjs tests/worker/repair-router.test.mjs tests/worker/scene-construction-repair.test.mjs`. Result on Node v24.19.0: **10 passed, 0 failed**. **Status: passed locally.**
9. **Exercise the encoded-title readability fixture.** `tests/video/slide-lesson-title-readability.test.mjs:128` adds a 390px strict-blueprint title check. It requires the media-worker browser/OCR toolchain and was not run in the local scratch checkout. **Status: pending CI or media-worker execution.**
10. **Keep the repair tests in release gates.** The new worker regressions are added to the required PR CI preflight and the existing worker-image regression command. **Status: pending PR CI.**
11. **Check Supabase dependency recovery before release.** The live `wake_ultimate_media_dependency` function exists, uses an empty search path, is restricted to `service_role`, and its migration is applied. This repair does not require a database migration. **Status: verified read-only.**
12. **Merge through the protected GitHub path and verify deployment.** `main` requires `CI Required Gate`; the worker and admin deployment workflows are triggered by qualifying main-branch changes. **Status: pending PR, required checks, and deployment runs.**
13. **Resume the existing lesson from the earliest affected checkpoint.** Use the existing admin checkpoint-repair endpoint for this lesson after deployment, preserving saved artifacts and resetting only this lesson's exhausted repair counter. Do not create a replacement build. **Status: pending deployed code and authorized endpoint access.**
14. **Verify the corrected output and build state.** Confirm the new scene-3 title is readable in the rendered video, finished-media QA passes, the course cursor advances, and the original build/job record progresses. **Status: pending resume.**
15. **Complete the full historical 78-item checklist.** Exact prior requirement text is unavailable in the present task context. **Status: blocked on recovering the original list; no items have been fabricated.**

## Performance evidence and follow-up

The worker currently calls `runUltimateCourse` with `maxLessons: 1` in `lib/ultimate-course-builder/worker/process-job.ts`, so a full course advances one lesson per job execution. Saved lesson-step completion timestamps also contain multi-hour gaps between groups of work. Those timestamps are wall-clock checkpoints, not stage start/end measurements, so they do not prove the builder spent that time computing. Add per-stage start/end and queue-wait telemetry before tuning provider concurrency; then prioritize reuse of passed checkpoints, cached narration/media, and small multi-lesson batches while preserving lease limits and fairness.

## Release record

- Base `main` commit before repair: `9ef688875789939374a416b5115f1595a1b3a569`
- Repair branch, PR, merge commit, CI run, and deployment run: to be recorded after GitHub reports them.
