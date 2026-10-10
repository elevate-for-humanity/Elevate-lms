# Northflank to Google verification — October 8, 2026

No Northflank service, volume, secret group or project has been deleted.

| Component | Resolved runtime values matched on Google | Google-owned configuration readback | Remaining retirement evidence |
|---|---:|---|---|
| LMS | 70 | Passed | Functional student and course tests; recovery without source credentials |
| Admin | 81 | Passed | New Google build, completed video render and dashboard tests |
| Marketing | 66 | Passed | Exact public revision and video playback tests |
| Store | 10 | Passed | Billing and store route acceptance |
| Course worker | 21 | Passed; narration adapted to Kokoro | Finished course/video execution and scheduling acceptance |
| Studio | Not compared to a live replacement | Passed; one source volume recorded | Google runtime absent; auth volume and workspace transfer; provider and restart tests |

The live Google inventory contains the PBX VM and its disk, six runtime configuration secrets, no Studio VM or disk, no snapshots and no Cloud Scheduler jobs. The existing database cron is a separate scheduling mechanism.

All 23 standalone secret groups from elevate-platform and elevate-media-gpu were preserved and read back successfully at 17:50 UTC. Their complete source payloads are archived under sourceSecretGroupArchive in the existing Google Secret Manager secret elevate-admin-runtime-config. The importer verified all 23 groups and preserved the active runtime configuration. The earlier individual-secret creation denial was resolved through this existing authorized destination; the bootstrap script is not a remaining prerequisite.

At 19:19 UTC, Google Admin independently returned a healthy ping for commit d7e4961d8e5bddd751324ad665941a7b73f61388. Revision elevate-admin-migration-00015-xtq had passed deployment acceptance with 100% traffic. This contains automatic publication after the complete persisted course and media checks. It does not establish that an unfinished course is published.

The isolated Google render session claimed Barber lesson job 1611e77d-8744-4152-98e1-34e637701d62 at 19:12:52 UTC. Eight narration files were generated, and its rendering heartbeat continued at 19:22 UTC. Final audiovisual quality, learner attachment, and automatic course publication remain unverified until that execution finishes. Do not retire the source based on this intermediate status.

Ten legacy source deployment workflows were removed. Source inventory and transfer code remain available for migration. Full retirement, all source operations removal and functional acceptance are unfinished.

Evidence:
- [Live source / runtime comparison](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/37806914381)
- [Historical six configuration readbacks and initially attempted group transfers](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/37807695000)
- [Verified preservation of all 23 secret groups](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/37819482671)
- [Live Google Admin publication deployment](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/37824816277)
- [Isolated Google render acceptance execution](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/37826141153)
- [Google ownership inventory](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/37807851152)
- [Google Admin build](https://github.com/elevate-for-humanity/Elevate-lms/actions/runs/37807295076)

35 focused migration tests passed locally. Marketing TypeScript validation passed locally. These checks do not establish production functional acceptance.
