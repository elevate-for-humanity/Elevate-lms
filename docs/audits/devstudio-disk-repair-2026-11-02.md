# Dev Studio shared-disk and repair-queue audit — November 2, 2026

The shared engineering filesystem reached 100% capacity and returned ENOSPC during TypeScript and lint checks. This was independent of Backblaze object storage. The earlier build also lacked an explicit commit identity; its failure was not a persistent build-slot lock.

## Disk corrections

19 complete, untracked Next.js build-output directories, untouched for more than 12 hours, were removed after source-tracking and process checks. Source, uploads, recent builds, dependencies, and reference/security snapshots were retained. No production service or student record was deleted.

| Completed output removed | Logical GiB |
|---|---:|
| `7b0e03123eed/platform/apps/admin/.next` | 0.99 |
| `7b0e03123eed/platform/apps/lms/.next` | 0.63 |
| `7b0e03123eed/platform/apps/marketing/.next` | 0.96 |
| `7b0e03123eed/host-shop-repair/apps/admin/.next` | 1.00 |
| `7b0e03123eed/host-shop-repair/apps/marketing/.next` | 0.95 |
| `bc5ed28fc677/phone-repair/apps/admin/.next` | 1.00 |
| `bc5ed28fc677/phone-repair/apps/lms/.next` | 0.63 |
| `bc5ed28fc677/phone-repair/apps/marketing/.next` | 0.95 |
| `d267319bc5c5/cleanup/apps/admin/.next` | 1.00 |
| `d267319bc5c5/cleanup/apps/lms/.next` | 0.63 |
| `d267319bc5c5/cleanup/apps/marketing/.next` | 0.94 |
| `86397d32e5c2/Elevate-lms/apps/admin/.next` | 1.32 |
| `86397d32e5c2/Elevate-lms/apps/marketing/.next` | 0.96 |
| `d3dabcffc613/repo/apps/admin/.next` | 1.31 |
| `d3dabcffc613/repo/apps/lms/.next` | 0.95 |
| `d3dabcffc613/repo/apps/marketing/.next` | 0.94 |
| `673b3794731c/elevate-lms/apps/admin/.next` | 1.00 |
| `673b3794731c/elevate-lms/apps/lms/.next` | 0.63 |
| `673b3794731c/elevate-lms/apps/marketing/.next` | 0.95 |

Total logical output removed: 17.74 GiB. Observed free capacity after cleanup: 16.59 GiB; filesystem utilization fell to 73%. Subsequent builds consume some of that capacity normally.

## Root source corrections

- The bounded build command now reports actual slot acquisition and checks available disk before running a child command. Less than 4 GiB fails with a capacity-specific error instead of a misleading wait. The OS lock and memory limits remain enforced.
- Job tracking requires persisted IDs and ownership; failed RPCs or updates return errors. No manufactured success is returned for unavailable job storage.
- Event queries bound numeric limits and reject invalid timestamps; database failures return an error status.
- Repair planning fits diagnostic observations into the owned model context without truncating the task or system rules, and explicitly labels partial source excerpts.
- The repair inference deadline is 210 seconds, below the existing 240-second workflow HTTP deadline.
- Recurring incidents are deduplicated across unrelated source commits by their observed recovery boundary.
- Historical queued and blocked incidents are scanned in bounded pages and retired only with a later successful observation. Retirement never certifies a code repair.
- The monitor defers execution until the Admin runtime serves its exact workflow commit.
- The missing break_minutes selection in clock-out validation was corrected; current main independently contains the same correction.

## Repair reconciliation

All 75 original records retain their IDs and attempt history. 59 historical chat incidents have a later completed chat observation; 8 course repairs refer to a published course with a completed worker. Source-identity, resolved-source, owner-paused reference, active-worker, and remaining prerequisite cases have separate recorded dispositions. No repair is marked verified without deployment and runtime evidence.

## Validation

Local validation completed: 225 Studio/PARIS unit tests, 40 build-policy/repair Node tests, all 25 Studio integration checks, full repository lint, and all three production application builds with generated-route typechecks passed. The local build used the verified public Supabase configuration and explicit source identity; it is not a production deployment receipt. Validation evidence is recorded in the accompanying source tests and release checks. Production deployment must be confirmed separately by its immutable SHA and live health identity.
