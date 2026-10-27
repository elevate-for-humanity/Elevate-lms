# External Course Builder — isolation cutover (phase 1)

Status: **preparation only; external paid compute remains disabled**.

## Verified starting inventory
- Platform: Elevate LMS GitHub repository and Supabase project `cuxzzpsyufcewtmicszk` (us-east-2).
- Independent Course Builder Supabase project `liwxpxhccbaxwylpnapo` (us-west-2). Existing RLS-enabled public tables: `builder_courses`, `builder_modules`, `builder_lessons`, `builder_media`, `builder_jobs`, `builder_publications`. Last inspection showed 11 courses, 54 modules, 315 lessons, and zero rows in media/jobs/publications.
- External compute adapter in `infra/modal/` already exists but is inactive. Its canonical queue is **still in platform Supabase** (`ultimate_build_jobs`), not the independent Course Builder database.
- Current external acceptance slice is CPU-only, with max two short-lived workers. GPU inference requires a distinct future design, never an implied part of the first deployment.
- Separate existing GitHub organization repositories are used for other projects; do not overwrite `next-platform-starter` or `supersonic-fast-cash` or rename either without migration verification.

## Required phases and hard gates
1. **Inventory and reconciliation.** Map canonical course/build IDs, ownership, lesson/module/media references and enrollments across databases. Record source-of-truth per entity. Do not copy credentials or student PII unnecessarily; never change authoritative completion records as part of an infrastructure move.
2. **Dedicated repository.** Establish a purpose-built private Course Builder repository with worker, rendering pipeline, migrations, test fixtures and deployment pipeline, retaining a narrow API client in Elevate LMS. Avoid importing the full marketing site into the worker repository. Preserve Git history/license and pin dependencies and worker image digests.
3. **Storage blocker.** Audit Backblaze B2 account cap, bucket/object counts and failed upload receipts. Obtain authorized capacity increase or approved storage migration; verify small upload, metadata, retrieval and real media playback. No destructive cleanup of existing media.
4. **External CPU pilot.** Use the existing `infra/modal` implementation with explicitly authorized Modal account, secrets, immutable worker digest, platform/tenant cost controls and verified provider budget. Keep `EXTERNAL_COMPUTE_ENABLED` disabled until every prerequisite passes. Perform read-only local check: `node scripts/compute/verify-external-cutover.mjs`.
5. **One-lesson acceptance.** Select one **queued, unleased** exact-lesson job with remaining retry entitlement; enforce atomic claim, execution generation and idempotency. Validate narration, picture cues, FFmpeg/Remotion, captions, Backblaze object, LMS video playback, publication readback and reconciled cost. Do not reuse the stuck running job or erase its checkpoint/lease.
6. **Move queue ownership only after pilot.** Establish an authenticated, least-privilege service-to-service contract. The independent database can own course generation jobs, but Elevate LMS remains authoritative for student accounts, enrollments, course publication permissions and learning progress. Use event outbox and replay-safe publishing instead of cross-database transactions.
7. **Optional GPU phase.** Measure whether visual/voice generation needs GPUs. Deploy an independently budgeted GPU workload only when tests establish a benefit. Remotion/FFmpeg should remain CPU by default.
8. **Cutover and rollback.** Canary a single accepted lesson, reconcile receipts, verify no duplicate claims and retain old Google workers disabled only for *new* dispatch after completion. Never fall back automatically while an external execution outcome is uncertain. Keep old artifacts, original leases and audit evidence until cutover sign-off.

## Production acceptance
- Canonical student and admin dashboards show correct courses.
- Worker status reflects actual execution, not just a green dispatch workflow.
- Verified GPU/CPU usage, provider quota and capped cost.
- No lost progress, no unauthorized cross-tenant access, no duplicate charges or jobs.
- Exact source SHA, worker image digest, output object metadata and browser playback are recorded.
- Any failed or uncertain paid attempt is reconciled before another attempt.

**No deployment, provider account creation, charge, DNS change, or production queue mutation is authorized by this document.**
